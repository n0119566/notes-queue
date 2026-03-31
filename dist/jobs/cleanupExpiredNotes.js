"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupExpiredNotesJob = void 0;
const Note_1 = __importDefault(require("../models/Note"));
/**
 * Job: cleanup-deleted-notes
 *
 * This job runs every hour and permanently deletes notes that:
 * - Have deleted = true
 * - Have deletedDate more than 30 days ago
 */
const cleanupExpiredNotesJob = async (job) => {
    const jobName = job.attrs.name;
    console.log(`🗑️  [${jobName}] Starting cleanup of old deleted notes...`);
    try {
        const now = new Date();
        const result = await Note_1.default.updateMany({
            expirationDate: { $lt: now, $ne: null },
            deleted: { $ne: true },
        }, {
            $set: {
                deleted: true,
                deletedDate: now,
                expirationDate: null,
            },
        });
        console.log(`✅ [${jobName}] Moved expired ${result.modifiedCount} notes to trash, updated deleted date, and cleared expiration date`);
    }
    catch (error) {
        console.error(`❌ [${jobName}] Error cleaning up deleted notes:`, error);
        throw error;
    }
};
exports.cleanupExpiredNotesJob = cleanupExpiredNotesJob;
//# sourceMappingURL=cleanupExpiredNotes.js.map