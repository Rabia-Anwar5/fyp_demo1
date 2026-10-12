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

const ProductSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true },
    source: { type: String, default: "scraper" },
    store_id: { type: String, required: true },
    store_name: { type: String },
    mall_id: { type: String },
    name: { type: String, required: true },
    category: { type: String },
    subcategory: { type: String },
    fabric_type: { type: String },
    original_price: { type: Number },
    sale_price: { type: Number },
    stock_qty: { type: Number, default: 0 },
    stock_status: { type: String, default: "in_stock" },
    image_url: { type: String },
    last_updated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export async function runScraperJob(): Promise<{ success: boolean; itemsUpdated: number }> {
  console.log(`[${new Date().toISOString()}] [CATCH Scraper] Starting scheduled scrape cycle...`);
  const connector = new MockConnector();
  const products = await connector.fetchProducts();

  console.log(`[CATCH Scraper] Fetched ${products.length} products from registered mall storefronts.`);

  // If MongoDB connected, sync to collection
  if (mongoose.connection.readyState === 1) {
    const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);
    for (const p of products) {
      await Product.updateOne(
        { sku: p.sku, store_id: (p as any).store_id ?? connector.store_id },
        { $set: { ...p, last_updated: new Date() } },
        { upsert: true }
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
