"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupDeletedNotesJob = void 0;
const Note_1 = __importDefault(require("../models/Note"));
const variables_1 = require("../variables");
const pinecone_1 = require("@pinecone-database/pinecone/dist/pinecone");
/**
 * Job: cleanup-deleted-notes
 *
 * This job runs every hour and permanently deletes notes that:
 * - Have deleted = true
 * - Have deletedDate more than 30 days ago
 */
const cleanupDeletedNotesJob = async (job) => {
    const jobName = job.attrs.name;
    console.log(`🗑️  [${jobName}] Starting cleanup of old deleted notes...`);
    try {
        // Calculate the date 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - variables_1.MAX_DELETION_DAYS);
        // Find notes that are marked as deleted and older than 30 days
        const notesToDelete = await Note_1.default.find({
            deleted: true,
            $or: [
                { deletedDate: { $lt: thirtyDaysAgo } }, // If date is greater than 30 days ago
                { deletedDate: { $exists: false } }, // OR if the field is missing entirely
            ],
        }).select("_id user");
        if (notesToDelete.length === 0) {
            console.log(`✅ [${jobName}] No old deleted notes found to clean up.`);
            return;
        }
        console.log(`✅ [${jobName}] Found ${notesToDelete.length} old deleted notes to clean up.`);
        // Group notes by user
        const notesByUser = notesToDelete.reduce((acc, note) => {
            const user = note.user;
            if (!acc[user]) {
                acc[user] = [];
            }
            acc[user].push(note._id.toString());
            return acc;
        }, {});
        // Convert to array format: [{name: user, ids: [ids]}]
        const groupedNotes = Object.entries(notesByUser).map(([name, ids]) => ({
            name,
            ids,
        }));
        const pc = new pinecone_1.Pinecone({
            apiKey: process.env.PINECONE_API_KEY || "",
        });
        const indexName = process.env.PINECONE_INDEX_NAME || "notes";
        // Delete vectors for each user using their namespace
        for (const userGroup of groupedNotes) {
            const index = pc.index(indexName).namespace(userGroup.name);
            if (userGroup.ids.length <= 1000) {
                await index.deleteMany(userGroup.ids);
            }
            else {
                const chunks = [];
                for (let i = 0; i < userGroup.ids.length; i += 1000) {
                    const chunk = userGroup.ids.slice(i, i + 1000);
                    chunks.push(chunk);
                }
                await Promise.all(chunks.map(async (chunk) => {
                    await index.deleteMany(chunk);
                }));
            }
            console.log(`✅ [${jobName}] Deleted ${userGroup.ids.length} vectors for user: ${userGroup.name}`);
        }
        // Find and delete notes that are marked as deleted and older than 30 days
        const result = await Note_1.default.deleteMany({
            deleted: true,
            $or: [
                { deletedDate: { $lt: thirtyDaysAgo } }, // If date is greater than 30 days ago
                { deletedDate: { $exists: false } }, // OR if the field is missing entirely
            ],
        });
        console.log(`✅ [${jobName}] Permanently deleted ${result.deletedCount} notes that were in trash for over ${variables_1.MAX_DELETION_DAYS} days`);
    }
    catch (error) {
        console.error(`❌ [${jobName}] Error cleaning up deleted notes:`, error);
        throw error;
    }
};
exports.cleanupDeletedNotesJob = cleanupDeletedNotesJob;
//# sourceMappingURL=cleanupDeletedNotes.js.map