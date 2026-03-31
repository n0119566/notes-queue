import { Job } from "agenda";
import * as fs from "fs";
import * as path from "path";
import * as zlib from "zlib";
import mongoose from "mongoose";
import { MAX_BACKUP_VERSIONS } from "../variables";

const BACKUP_DIR = path.join(process.cwd(), "backups");

/**
 * Job: backup-database
 *
 * This job runs once a day and:
 * 1. Checks the backup folder exists, creating it if it doesn't
 * 2. Discovers all collections in the database dynamically (no hardcoded models)
 * 3. Exports all documents from every collection as JSON
 * 4. Gzips the JSON export
 * 5. Retains no more than MAX_BACKUP_VERSIONS (14) backup files
 */
export const backupDatabaseJob = async (job: Job): Promise<void> => {
  const jobName = job.attrs.name;
  console.log(`💾 [${jobName}] Starting database backup...`);

  try {
    // 1. Check backup folder exists, create it if it doesn't
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      console.log(`📁 [${jobName}] Created backups directory: ${BACKUP_DIR}`);
    }

    // 2. Discover all collections dynamically via the active connection
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection is not established");
    }
    const collections = await db.listCollections().toArray();
    const backup: Record<string, unknown[]> = {};
    let totalDocuments = 0;

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const documents = await db.collection(collectionName).find({}).toArray();
      backup[collectionName] = documents;
      totalDocuments += documents.length;
      console.log(`📦 [${jobName}] Collected ${documents.length} documents from "${collectionName}"`);
    }

    // 3. Zip up the export using gzip compression
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup-${timestamp}.json.gz`;
    const filepath = path.join(BACKUP_DIR, filename);

    const jsonData = JSON.stringify(backup, null, 2);
    const compressed = zlib.gzipSync(Buffer.from(jsonData, "utf-8"));
    fs.writeFileSync(filepath, compressed);
    console.log(`✅ [${jobName}] Backup saved to: ${filepath} (${collections.length} collections, ${totalDocuments} total documents)`);

    // 4. Keep no more than MAX_BACKUP_VERSIONS versions — remove the oldest first
    const backupFiles = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith("backup-") && f.endsWith(".json.gz"))
      .sort(); // ISO-based filenames sort chronologically

    let retainedCount = backupFiles.length;
    if (backupFiles.length > MAX_BACKUP_VERSIONS) {
      const filesToDelete = backupFiles.slice(0, backupFiles.length - MAX_BACKUP_VERSIONS);
      for (const file of filesToDelete) {
        fs.unlinkSync(path.join(BACKUP_DIR, file));
        console.log(`🗑️  [${jobName}] Removed old backup: ${file}`);
      }
      retainedCount = MAX_BACKUP_VERSIONS;
    }

    console.log(`✅ [${jobName}] Database backup completed. Backups retained: ${retainedCount}`);
  } catch (error) {
    console.error(`❌ [${jobName}] Error creating database backup:`, error);
    throw error;
  }
};
