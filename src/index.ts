import dotenv from "dotenv";
import { connectDatabase } from "./config/database";
import { initAgenda, startAgenda, stopAgenda } from "./agenda";

// Load environment variables
dotenv.config();

const APP_NAME = process.env.APP_NAME || "Notes Queue Service";

async function main(): Promise<void> {
  console.log(`\n🎯 Starting ${APP_NAME}...\n`);

  try {
    // Connect to MongoDB
    await connectDatabase();

    // Initialize and start Agenda
    await initAgenda();
    await startAgenda();

    console.log(`\n✅ ${APP_NAME} is running!\n`);
  } catch (error) {
    console.error("❌ Failed to start the application:", error);
    process.exit(1);
  }
}

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`\n📴 Received ${signal}. Shutting down gracefully...`);

  try {
    await stopAgenda();
    console.log("👋 Goodbye!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Start the application
main();
