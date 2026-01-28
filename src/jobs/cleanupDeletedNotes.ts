import { Job } from "agenda";
import Note from "../models/Note";
import { MAX_DELETION_DAYS } from "../variables";

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
