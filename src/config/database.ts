import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const getDatabaseUrl = (): string => {
  const env = process.env.ENV || "local";

  if (env === "production" || env === "prod") {
    return process.env.DATABASE_PROD || "";
  }

  return process.env.DATABASE || "mongodb://127.0.0.1:27017/notes";
};

export const connectDatabase = async (): Promise<void> => {
  const dbUrl = getDatabaseUrl();

  try {
    await mongoose.connect(dbUrl);
    console.log(`✅ Connected to MongoDB: ${dbUrl.includes("mongodb+srv") ? "Production" : "Local"}`);
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
    process.exit(1);
  }
};

export const getMongoConnectionString = (): string => {
  return getDatabaseUrl();
};
