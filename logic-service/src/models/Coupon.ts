/**
 * Coupon/Promotion MongoDB schema.
 * Stores both scraper-sourced and merchant-submitted promotions.
 */
import mongoose, { Schema, Document } from "mongoose";

export type DiscountType = "percent" | "flat" | "bogo";

export interface ICoupon extends Document {
  coupon_id: string;
  source: "scraper" | "merchant";
  store_id: string;
  store_name: string;
  coupon_code: string | null;
  description: string;
  discount_type: DiscountType;
  discount_value: number;          // percent (0-100) or flat amount
  min_spend: number;               // 0 = no minimum
  categories: string[];            // matched categories e.g. ["apparel", "jacket"]
  subcategories: string[];
  fabric_types: string[];          // empty = applies to all fabrics
  original_price?: number;
  expiry: Date;
  terms: string;
  is_active: boolean;
  last_verified: Date;
  created_at: Date;
  updated_at: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    coupon_id: { type: String, required: true, unique: true, index: true },
    source: { type: String, enum: ["scraper", "merchant"], required: true },
    store_id: { type: String, required: true, index: true },
    store_name: { type: String, required: true },
    coupon_code: { type: String, default: null },
    description: { type: String, default: "" },
    discount_type: { type: String, enum: ["percent", "flat", "bogo"], required: true },
    discount_value: { type: Number, required: true, min: 0 },
    min_spend: { type: Number, default: 0 },
    categories: [{ type: String }],
    subcategories: [{ type: String }],
    fabric_types: [{ type: String }],
    original_price: { type: Number },
    expiry: { type: Date, required: true, index: true },
    terms: { type: String, default: "" },
    is_active: { type: Boolean, default: true, index: true },
    last_verified: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// Compound index for fast filtering
CouponSchema.index({ is_active: 1, expiry: 1, categories: 1 });

export const Coupon = mongoose.model<ICoupon>("Coupon", CouponSchema);