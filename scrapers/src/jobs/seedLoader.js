/**
 * Seed MongoDB with mock data for development and CI.
 * Run: node src/jobs/seedLoader.js
 * 
 * This script is safe to run multiple times (upsert).
 * NEVER put real production data in mock-data/.
 */
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/catch";

// Minimal inline schemas for seeding (mirrors TypeScript models)
const CouponSchema = new mongoose.Schema({
  coupon_id: { type: String, unique: true },
  source: String,
  store_id: String, store_name: String,
  coupon_code: String,
  description: String,
  discount_type: String, discount_value: Number,
  min_spend: { type: Number, default: 0 },
  categories: [String], subcategories: [String], fabric_types: [String],
  original_price: Number,
  expiry: Date, terms: String,
  is_active: { type: Boolean, default: true },
  last_verified: { type: Date, default: Date.now },
}, { timestamps: true });

const ProductSchema = new mongoose.Schema({
  sku: String, source: String,
  store_id: String, store_name: String, mall_id: String,
  name: String, category: String, subcategory: String,
  fabric_type: String,
  original_price: Number, sale_price: Number,
  stock_qty: Number, stock_status: String,
  image_url: String,
  last_updated: { type: Date, default: Date.now },
}, { timestamps: true });

const Coupon = mongoose.model("Coupon", CouponSchema);
const Product = mongoose.model("Product", ProductSchema);

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB:", MONGO_URI);

  // Load seed files
  const couponData = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../../mock-data/seed_coupons.json"), "utf-8")
  );
  const productData = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../../mock-data/seed_products.json"), "utf-8")
  );

  // Upsert coupons
  for (const c of couponData) {
    await Coupon.findOneAndUpdate(
      { coupon_id: c.coupon_id },
      { ...c, expiry: new Date(c.expiry) },
      { upsert: true, new: true }
    );
  }
  console.log(`Upserted ${couponData.length} coupons`);

  // Upsert products
  for (const p of productData) {
    await Product.findOneAndUpdate(
      { sku: p.sku, store_id: p.store_id },
      { ...p, last_updated: new Date() },
      { upsert: true, new: true }
    );
  }
  console.log(`Upserted ${productData.length} products`);

  await mongoose.disconnect();
  console.log("Seed complete.");
}

seed().catch((e) => { console.error("Seed failed:", e); process.exit(1); });