"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const agenda_1 = require("./agenda");
// Load environment variables
dotenv_1.default.config();
const APP_NAME = process.env.APP_NAME || "Notes Queue Service";
async function main() {
    console.log(`\n🎯 Starting ${APP_NAME}...\n`);
    try {
        // Connect to MongoDB
        await (0, database_1.connectDatabase)();
        // Initialize and start Agenda
        await (0, agenda_1.initAgenda)();
        await (0, agenda_1.startAgenda)();
        console.log(`\n✅ ${APP_NAME} is running!\n`);
    }
    catch (error) {
        console.error("❌ Failed to start the application:", error);
        process.exit(1);
    }
}
// Graceful shutdown handlers
const gracefulShutdown = async (signal) => {
    console.log(`\n📴 Received ${signal}. Shutting down gracefully...`);
    try {
        await (0, agenda_1.stopAgenda)();
        console.log("👋 Goodbye!");
        process.exit(0);
    }
    catch (error) {
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
//# sourceMappingURL=index.js.map