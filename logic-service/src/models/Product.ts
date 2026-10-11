/**
 * Product/Inventory MongoDB schema.
 * Stores normalised inventory from scrapers and merchant submissions.
 */
import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  sku: string;
  source: "scraper" | "merchant";
  store_id: string;
  store_name: string;
  mall_id: string;
  name: string;
  category: string;
  subcategory: string;
  fabric_type?: string;
  original_price: number;
  sale_price?: number;
  stock_qty: number;
  stock_status: "in_stock" | "low_stock" | "out_of_stock";
  image_url?: string;
  last_updated: Date;
  scrape_url?: string;
}

const ProductSchema = new Schema<IProduct>(
  {
    sku: { type: String, required: true, index: true },
    source: { type: String, enum: ["scraper", "merchant"], required: true },
    store_id: { type: String, required: true, index: true },
    store_name: { type: String, required: true },
    mall_id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    category: { type: String, required: true, index: true },
    subcategory: { type: String, required: true },
    fabric_type: { type: String },
    original_price: { type: Number, required: true, min: 0 },
    sale_price: { type: Number },
    stock_qty: { type: Number, default: 0 },
    stock_status: { type: String, enum: ["in_stock", "low_stock", "out_of_stock"], default: "in_stock" },
    image_url: { type: String },
    last_updated: { type: Date, default: Date.now, index: true },
    scrape_url: { type: String },
  },
  { timestamps: true }
);

ProductSchema.index({ store_id: 1, category: 1, last_updated: -1 });

export const Product = mongoose.model<IProduct>("Product", ProductSchema);