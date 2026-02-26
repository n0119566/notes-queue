import { Job } from "agenda";
import Note from "../models/Note";
import { MAX_DELETION_DAYS } from "../variables";
import { Pinecone } from "@pinecone-database/pinecone/dist/pinecone";

/**
 * Job: cleanup-deleted-notes
 *
 * This job runs every hour and permanently deletes notes that:
 * - Have deleted = true
 * - Have deletedDate more than 30 days ago
 */
export const cleanupDeletedNotesJob = async (job: Job): Promise<void> => {
  const jobName = job.attrs.name;
  console.log(`🗑️  [${jobName}] Starting cleanup of old deleted notes...`);

  try {
    // Calculate the date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - MAX_DELETION_DAYS);

    // Find notes that are marked as deleted and older than 30 days
    const vectorsToDelete = await Note.find({
      deleted: true,
      $or: [
        { deletedDate: { $lt: thirtyDaysAgo } }, // If date is greater than 30 days ago
        { deletedDate: { $exists: false } }, // OR if the field is missing entirely
      ],
    }).select("_id");

    if (vectorsToDelete.length === 0) {
      console.log(`✅ [${jobName}] No old deleted notes found to clean up.`);
      return;
    }

    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || "",
    });

    const ids = vectorsToDelete.map((note) => note._id.toString());

    const indexName = process.env.PINECONE_INDEX_NAME || "notes";
    const index = pc.index({ name: indexName });

    if (ids.length <= 1000) {
      await index.deleteMany(ids);
    } else {
      const result: string[][] = [];
      for (let i = 0; i < ids.length; i += 1000) {
        const chunk = ids.slice(i, i + 1000);
        result.push(chunk);
      }

      await Promise.all(
        result.map(async (chunk) => {
          await index.deleteMany(chunk);
        }),
      );
    }

    // Find and delete notes that are marked as deleted and older than 30 days
    const result = await Note.deleteMany({
      deleted: true,
      $or: [
        { deletedDate: { $lt: thirtyDaysAgo } }, // If date is greater than 30 days ago
        { deletedDate: { $exists: false } }, // OR if the field is missing entirely
      ],
    });

    console.log(
      `✅ [${jobName}] Permanently deleted ${result.deletedCount} notes that were in trash for over ${MAX_DELETION_DAYS} days`,
    );
  } catch (error) {
    console.error(`❌ [${jobName}] Error cleaning up deleted notes:`, error);
    throw error;
  }
};
