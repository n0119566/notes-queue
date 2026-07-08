import { Job } from "agenda";
import * as fs from "fs";
import * as path from "path";
import * as zlib from "zlib";
import mongoose from "mongoose";
import { MAX_BACKUP_VERSIONS } from "../variables";

const BACKUP_DIR = path.join(process.cwd(), "backups");

// MongoDB's internal databases — never backed up.
const SYSTEM_DATABASES = new Set(["admin", "local", "config"]);

/**
 * Turn a database name into a filesystem-safe folder name so databases with
 * characters that are awkward on disk still get their own backup directory.
 */
const sanitizeDbName = (name: string): string =>
  name.replace(/[^a-zA-Z0-9._-]/g, "_");

/**
 * Back up a single database to its own subfolder and prune old versions.
 * Returns the number of documents backed up.
 */
const backupSingleDatabase = async (
  db: mongoose.mongo.Db,
  dbName: string,
  jobName: string | undefined,
  timestamp: string
): Promise<number> => {
  const collections = await db.listCollections().toArray();
  const backup: Record<string, unknown[]> = {};
  let totalDocuments = 0;

  for (const collectionInfo of collections) {
    const collectionName = collectionInfo.name;
    const documents = await db.collection(collectionName).find({}).toArray();
    backup[collectionName] = documents;
    totalDocuments += documents.length;
    console.log(
      `📦 [${jobName}] [${dbName}] Collected ${documents.length} documents from "${collectionName}"`
    );
  }

  // Each database gets its own subfolder so retention is tracked independently.
  const dbDir = path.join(BACKUP_DIR, sanitizeDbName(dbName));
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const filename = `backup-${timestamp}.json.gz`;
  const filepath = path.join(dbDir, filename);

  const jsonData = JSON.stringify(backup, null, 2);
  const compressed = zlib.gzipSync(Buffer.from(jsonData, "utf-8"));
  fs.writeFileSync(filepath, compressed);
  console.log(
    `✅ [${jobName}] [${dbName}] Backup saved to: ${filepath} (${collections.length} collections, ${totalDocuments} total documents)`
  );

  // Keep no more than MAX_BACKUP_VERSIONS versions for this database — oldest first.
  const backupFiles = fs
    .readdirSync(dbDir)
    .filter((f) => f.startsWith("backup-") && f.endsWith(".json.gz"))
    .sort((a, b) => a.localeCompare(b)); // ISO-based filenames sort chronologically

  if (backupFiles.length > MAX_BACKUP_VERSIONS) {
    const filesToDelete = backupFiles.slice(0, backupFiles.length - MAX_BACKUP_VERSIONS);
    for (const file of filesToDelete) {
      fs.unlinkSync(path.join(dbDir, file));
      console.log(`🗑️  [${jobName}] [${dbName}] Removed old backup: ${file}`);
    }
  }

  return totalDocuments;
};

/**
 * Job: backup-database
 *
 * This job runs once a day and:
 * 1. Checks the backup folder exists, creating it if it doesn't
 * 2. Discovers every (non-system) database in the cluster dynamically
 * 3. Exports every collection of each database as JSON into a per-database subfolder
 * 4. Gzips each database's export
 * 5. Retains no more than MAX_BACKUP_VERSIONS (14) backups per database
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

    // 2. Discover every database in the cluster via the shared MongoClient.
    // The mongoose connection is scoped to a default database, but its client
    // can read any database in the cluster the user has access to.
    const client = mongoose.connection.getClient();
    const adminDb = client.db().admin();
    const { databases } = await adminDb.listDatabases();

    const targetDatabases = databases
      .map((d) => d.name)
      .filter((name) => !SYSTEM_DATABASES.has(name));

    if (targetDatabases.length === 0) {
      console.warn(`⚠️  [${jobName}] No databases found to back up.`);
      return;
    }

    console.log(
      `🗄️  [${jobName}] Backing up ${targetDatabases.length} database(s): ${targetDatabases.join(", ")}`
    );

    // 3. Back up each database independently. A single shared timestamp keeps
    // every file from one run aligned. Failures on one DB don't abort the rest.
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const succeeded: string[] = [];
    const failed: string[] = [];

    for (const dbName of targetDatabases) {
      try {
        await backupSingleDatabase(client.db(dbName), dbName, jobName, timestamp);
        succeeded.push(dbName);
      } catch (error) {
        failed.push(dbName);
        console.error(`❌ [${jobName}] Failed to back up database "${dbName}":`, error);
      }
    }

    console.log(
      `✅ [${jobName}] Database backup completed. Succeeded: ${succeeded.length}/${targetDatabases.length}` +
        (failed.length > 0 ? ` — failed: ${failed.join(", ")}` : "")
    );

    // If every database failed, surface the failure so Agenda records it.
    if (failed.length === targetDatabases.length) {
      throw new Error(`All database backups failed: ${failed.join(", ")}`);
    }
  } catch (error) {
    console.error(`❌ [${jobName}] Error creating database backup:`, error);
    throw error;
  }
};
