import { Job } from "agenda";
import Note from "../models/Note";

/**
 * Job: cleanup-deleted-notes
 *
 * This job runs every hour and permanently deletes notes that:
 * - Have deleted = true
 * - Have deletedDate more than 30 days ago
 */
export const cleanupExpiredNotesJob = async (job: Job): Promise<void> => {
  const jobName = job.attrs.name;
  console.log(`🗑️  [${jobName}] Starting cleanup of old deleted notes...`);

  try {
    const now = new Date();

    const result = await Note.updateMany(
      {
        expirationDate: { $lt: now, $ne: null },
        deleted: { $ne: true },
      },
      {
        $set: {
          deleted: true,
          deletedDate: now,
          expirationDate: null,
        },
      },
    );

    console.log(
      `✅ [${jobName}] Moved expired ${result.modifiedCount} notes to trash, updated deleted date, and cleared expiration date`,
    );
  } catch (error) {
    console.error(`❌ [${jobName}] Error cleaning up deleted notes:`, error);
    throw error;
  }
};
