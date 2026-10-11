/**
 * Analytics events for RQ3/RQ4 instrumentation.
 * Records: deal discovery events, match rates, time-to-deal.
 */
import mongoose, { Schema, Document } from "mongoose";

export interface IAnalyticsEvent extends Document {
  event_type: "recognition" | "deal_found" | "deal_pushed" | "deal_acted" | "scrape_run";
  request_id?: string;
  user_id?: string;
  category?: string;
  subcategory?: string;
  store_id?: string;
  deals_found?: number;
  deals_after_filter?: number;
  top_saving?: number;
  time_to_deal_ms?: number;
  recognition_confidence?: number;
  scrape_source?: string;
  scrape_duration_ms?: number;
  error?: string;
  ts: Date;
}

const AnalyticsEventSchema = new Schema<IAnalyticsEvent>({
  event_type: { type: String, required: true, index: true },
  request_id: String,
  user_id: String,
  category: String,
  subcategory: String,
  store_id: String,
  deals_found: Number,
  deals_after_filter: Number,
  top_saving: Number,
  time_to_deal_ms: Number,
  recognition_confidence: Number,
  scrape_source: String,
  scrape_duration_ms: Number,
  error: String,
  ts: { type: Date, default: Date.now, index: true },
});

export const AnalyticsEvent = mongoose.model<IAnalyticsEvent>("AnalyticsEvent", AnalyticsEventSchema);