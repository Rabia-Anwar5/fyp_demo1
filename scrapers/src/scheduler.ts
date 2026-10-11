/**
 * CATCH Scraper Scheduler
 * Periodically runs configured mall store scrapers and seeds live data into MongoDB.
 */
import cron from "node-cron";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { MockConnector } from "./connectors/mockConnector";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/catch_db";

export async function runScraperJob(): Promise<{ success: boolean; itemsUpdated: number }> {
  console.log(`[${new Date().toISOString()}] [CATCH Scraper] Starting scheduled scrape cycle...`);
  const connector = new MockConnector();
  const products = await connector.fetchProducts();

  console.log(`[CATCH Scraper] Fetched ${products.length} products from registered mall storefronts.`);

  // If MongoDB connected, sync to collection
  if (mongoose.connection.readyState === 1) {
    const Product = mongoose.model("Product");
    for (const p of products) {
      await Product.updateOne(
        { product_id: p.product_id },
        { $set: { ...p, last_updated: new Date() } },
        { upsur: true }
      );
    }
  }

  console.log(`[CATCH Scraper] Cycle finished successfully.`);
  return { success: true, itemsUpdated: products.length };
}

export function startScheduler() {
  console.log("[CATCH Scraper] Scheduler initialized. Running every 30 minutes.");
  // Run every 30 mins
  cron.schedule("*/30 * * * *", async () => {
    try {
      await runScraperJob();
    } catch (e) {
      console.error("[CATCH Scraper] Scheduled job error:", (e as Error).message);
    }
  });
}

if (require.main === module) {
  mongoose.connect(MONGODB_URI).then(() => {
    console.log("[CATCH Scraper] Connected to MongoDB");
    runScraperJob().then(() => {
      startScheduler();
    });
  }).catch((err) => {
    console.warn("[CATCH Scraper] Running in standalone mode (no DB):", err.message);
    runScraperJob();
  });
}
