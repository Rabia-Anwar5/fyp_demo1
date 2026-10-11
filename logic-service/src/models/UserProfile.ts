/**
 * User profile: FCM tokens, preferences, deal history.
 */
import mongoose, { Schema, Document } from "mongoose";

export interface IUserProfile extends Document {
  user_id: string;
  fcm_tokens: string[];
  preferred_categories: string[];
  preferred_stores: string[];
  preferred_mall_ids: string[];
  deal_history: Array<{ deal_id: string; viewed_at: Date; acted_on: boolean }>;
  created_at: Date;
  updated_at: Date;
}

const UserProfileSchema = new Schema<IUserProfile>(
  {
    user_id: { type: String, required: true, unique: true, index: true },
    fcm_tokens: [{ type: String }],
    preferred_categories: [{ type: String }],
    preferred_stores: [{ type: String }],
    preferred_mall_ids: [{ type: String }],
    deal_history: [
      {
        deal_id: String,
        viewed_at: { type: Date, default: Date.now },
        acted_on: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const UserProfile = mongoose.model<IUserProfile>("UserProfile", UserProfileSchema);