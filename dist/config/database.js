"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMongoConnectionString = exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const getDatabaseUrl = () => {
    const env = process.env.ENV || "local";
    if (env === "production" || env === "prod") {
        return process.env.DATABASE_PROD || "";
    }
    return process.env.DATABASE || "mongodb://127.0.0.1:27017/notes";
};
const connectDatabase = async () => {
    const dbUrl = getDatabaseUrl();
    try {
        await mongoose_1.default.connect(dbUrl);
        console.log(`✅ Connected to MongoDB: ${dbUrl.includes("mongodb+srv") ? "Production" : "Local"}`);
    }
    catch (error) {
        console.error("❌ Failed to connect to MongoDB:", error);
        process.exit(1);
    }
};
exports.connectDatabase = connectDatabase;
const getMongoConnectionString = () => {
    return getDatabaseUrl();
};
exports.getMongoConnectionString = getMongoConnectionString;
//# sourceMappingURL=database.js.map