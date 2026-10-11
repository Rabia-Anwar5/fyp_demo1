/**
 * Logic Service configuration from environment variables.
 */
import dotenv from "dotenv";
dotenv.config();

export const config = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: parseInt(process.env.PORT ?? "3001"),
  LOG_LEVEL: process.env.LOG_LEVEL ?? "info",

  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI ?? "mongodb://localhost:27017/catch",

  // Firebase
  FIREBASE_SERVICE_ACCOUNT_PATH: process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? "",

  // AI Service
  AI_SERVICE_URL: process.env.AI_SERVICE_URL ?? "http://ai-service:8000",
  AI_SERVICE_API_KEY: process.env.AI_SERVICE_API_KEY ?? "dev-insecure-key",

  // Auth
  MERCHANT_API_KEY_HASH: process.env.MERCHANT_API_KEY_HASH ?? "dev-hash",

  // Scraper schedule
  SCRAPER_CRON: process.env.SCRAPER_CRON ?? "0 */30 * * * *",   // every 30 min
};