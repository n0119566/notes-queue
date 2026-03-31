import { Job } from "agenda";
/**
 * Job: cleanup-deleted-notes
 *
 * This job runs every hour and permanently deletes notes that:
 * - Have deleted = true
 * - Have deletedDate more than 30 days ago
 */
export declare const cleanupExpiredNotesJob: (job: Job) => Promise<void>;
//# sourceMappingURL=cleanupExpiredNotes.d.ts.map