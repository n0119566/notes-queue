"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgenda = exports.stopAgenda = exports.startAgenda = exports.initAgenda = void 0;
const agenda_1 = __importDefault(require("agenda"));
const database_1 = require("./config/database");
const cleanupDeletedNotes_1 = require("./jobs/cleanupDeletedNotes");
const variables_1 = require("./variables");
const cleanupExpiredNotes_1 = require("./jobs/cleanupExpiredNotes");
let agenda;
const initAgenda = async () => {
    const mongoConnectionString = (0, database_1.getMongoConnectionString)();
    agenda = new agenda_1.default({
        db: {
            address: mongoConnectionString,
            collection: "agendaJobs",
        },
        maxConcurrency: 20,
    });
    agenda.define(variables_1.CLEANUP_DELETED_NOTES_JOB, async (job) => {
        try {
            await (0, cleanupDeletedNotes_1.cleanupDeletedNotesJob)(job);
        }
        catch (error) {
            console.error("Error in check and update job:", error);
        }
    });
    agenda.define(variables_1.CLEANUP_EXPIRED_NOTES_JOB, async (job) => {
        try {
            await (0, cleanupExpiredNotes_1.cleanupExpiredNotesJob)(job);
        }
        catch (error) {
            console.error("Error in check and update job:", error);
        }
    });
    // Event listeners for monitoring
    agenda.on("ready", async () => {
        console.log("📅 Agenda is ready");
    });
    agenda.on("start", async (job) => {
        console.log(`▶️  Job ${job.attrs.name} starting...`);
    });
    agenda.on("complete", (job) => {
        console.log(`✔️  Job ${job.attrs.name} completed`);
    });
    agenda.on("fail", (err, job) => {
        console.error(`❌ Job ${job.attrs.name} failed with error:`, err);
    });
    return agenda;
};
exports.initAgenda = initAgenda;
const startAgenda = async () => {
    if (!agenda) {
        throw new Error("Agenda not initialized. Call initAgenda() first.");
    }
    await agenda.start();
    console.log("🚀 Agenda started");
    await agenda.every(variables_1.CLEANUP_JOB_FREQUENCY, variables_1.CLEANUP_DELETED_NOTES_JOB);
    console.log(`⏰ Scheduled ${variables_1.CLEANUP_DELETED_NOTES_JOB} to run every ${variables_1.CLEANUP_JOB_FREQUENCY}`);
    await agenda.every(variables_1.CLEANUP_JOB_FREQUENCY, variables_1.CLEANUP_EXPIRED_NOTES_JOB);
    console.log(`⏰ Scheduled ${variables_1.CLEANUP_EXPIRED_NOTES_JOB} to run every ${variables_1.CLEANUP_JOB_FREQUENCY}`);
};
exports.startAgenda = startAgenda;
const stopAgenda = async () => {
    if (agenda) {
        await agenda.stop();
        console.log("🛑 Agenda stopped");
    }
};
exports.stopAgenda = stopAgenda;
const getAgenda = () => {
    if (!agenda) {
        throw new Error("Agenda not initialized. Call initAgenda() first.");
    }
    return agenda;
};
exports.getAgenda = getAgenda;
//# sourceMappingURL=agenda.js.map