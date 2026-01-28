import Agenda, { Job } from "agenda";
import { getMongoConnectionString } from "./config/database";
import { cleanupDeletedNotesJob } from "./jobs/cleanupDeletedNotes";
import { CLEANUP_DELETED_NOTES_JOB, CLEANUP_JOB_FREQUENCY } from "./variables";

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

  await agenda.every(CLEANUP_JOB_FREQUENCY, CLEANUP_DELETED_NOTES_JOB);
  console.log(`⏰ Scheduled ${CLEANUP_DELETED_NOTES_JOB} to run every ${CLEANUP_JOB_FREQUENCY}`);
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
