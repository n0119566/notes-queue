import Agenda, { Job } from "agenda";
import { getMongoConnectionString } from "./config/database";
import { cleanupDeletedNotesJob } from "./jobs/cleanupDeletedNotes";
import {
  BACKUP_DATABASE_JOB,
  BACKUP_JOB_FREQUENCY,
  CLEANUP_DELETED_NOTES_JOB,
  CLEANUP_EXPIRED_NOTES_JOB,
  CLEANUP_JOB_FREQUENCY,
} from "./variables";
import { cleanupExpiredNotesJob } from "./jobs/cleanupExpiredNotes";
import { backupDatabaseJob } from "./jobs/backupDatabase";

let agenda: Agenda;

export const initAgenda = async (): Promise<Agenda> => {
  const mongoConnectionString = getMongoConnectionString();

  agenda = new Agenda({
    db: {
      address: mongoConnectionString,
      collection: "agendaJobs",
    },
    maxConcurrency: 20,
  });

  agenda.define(CLEANUP_DELETED_NOTES_JOB, async (job: Job) => {
    try {
      await cleanupDeletedNotesJob(job);
    } catch (error) {
      console.error("Error in check and update job:", error);
    }
  });

  agenda.define(CLEANUP_EXPIRED_NOTES_JOB, async (job: Job) => {
    try {
      await cleanupExpiredNotesJob(job);
    } catch (error) {
      console.error("Error in cleanup expired notes job:", error);
    }
  });

  agenda.define(BACKUP_DATABASE_JOB, async (job: Job) => {
    try {
      await backupDatabaseJob(job);
    } catch (error) {
      console.error("Error in backup database job:", error);
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

export const startAgenda = async (): Promise<void> => {
  if (!agenda) {
    throw new Error("Agenda not initialized. Call initAgenda() first.");
  }

  await agenda.start();
  console.log("🚀 Agenda started");

  const now = Date.now();
  const SECOND = 1000;

  // Stagger the first run so the jobs kick off in order: backup, then expired,
  // then deleted — starting 1 minute after Agenda starts and 30 seconds apart.
  // Each job still repeats on its configured interval after this first run.
  const startupSchedule: Array<{ name: string; interval: string; firstRunAt: Date }> = [
    { name: BACKUP_DATABASE_JOB, interval: BACKUP_JOB_FREQUENCY, firstRunAt: new Date(now + 60 * SECOND) },
    { name: CLEANUP_EXPIRED_NOTES_JOB, interval: CLEANUP_JOB_FREQUENCY, firstRunAt: new Date(now + 90 * SECOND) },
    { name: CLEANUP_DELETED_NOTES_JOB, interval: CLEANUP_JOB_FREQUENCY, firstRunAt: new Date(now + 120 * SECOND) },
  ];

  for (const { name, interval, firstRunAt } of startupSchedule) {
    const job = await agenda.every(interval, name);
    job.schedule(firstRunAt);
    await job.save();
    console.log(
      `⏰ Scheduled ${name} to first run at ${firstRunAt.toISOString()}, then every ${interval}`
    );
  }
};

export const stopAgenda = async (): Promise<void> => {
  if (agenda) {
    await agenda.stop();
    console.log("🛑 Agenda stopped");
  }
};

export const getAgenda = (): Agenda => {
  if (!agenda) {
    throw new Error("Agenda not initialized. Call initAgenda() first.");
  }
  return agenda;
};
