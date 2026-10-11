/**
 * Deal Service: DB queries + discount engine orchestration.
 * Fetches coupons/products from MongoDB, calls discountEngine, logs analytics.
 */
import { Coupon } from "../models/Coupon";
import { filterAndRankDeals, DealContext, FilterReport } from "./discountEngine";
import { AnalyticsEvent } from "../models/AnalyticsEvent";
import { logger } from "../utils/logger";

export interface DealRequest {
  item_context_id: string;
  category: string;
  subcategory: string;
  fabric_type?: string;
  user_id?: string;
  mall_id?: string;
  reference_price?: number;
  request_id?: string;
}

export async function getDealsForItem(req: DealRequest): Promise<FilterReport & { request_id: string }> {
  const t0 = Date.now();
  const reqId = req.request_id ?? req.item_context_id;

  try {
    // Fetch all potentially matching coupons from DB
    const coupons = await Coupon.find({
      is_active: true,
      expiry: { $gt: new Date() },
      $or: [
        { categories: { $in: [req.category, "all"] } },
        { subcategories: req.subcategory },
        { categories: { $size: 0 } }, // universal coupons
      ],
    }).lean();

    const ctx: DealContext = {
      category: req.category,
      subcategory: req.subcategory,
      fabric_type: req.fabric_type,
      reference_price: req.reference_price,
    };

    const report = filterAndRankDeals(coupons as any, ctx);
    const elapsed = Date.now() - t0;

    // Log analytics (RQ3 instrumentation)
    AnalyticsEvent.create({
      event_type: "deal_found",
      request_id: reqId,
      user_id: req.user_id,
      category: req.category,
      subcategory: req.subcategory,
      deals_found: report.total_before_filter,
      deals_after_filter: report.total_after_filter,
      top_saving: report.deals[0]?.net_saving ?? 0,
      time_to_deal_ms: elapsed,
    }).catch((e: Error) => logger.warn("Analytics write failed", { error: e.message }));

    logger.info("Deals computed", {
      request_id: reqId,
      category: req.category,
      total_before: report.total_before_filter,
      total_after: report.total_after_filter,
      elapsed_ms: elapsed,
    });

    return { ...report, request_id: reqId };
  } catch (err) {
    logger.error("getDealsForItem failed", { error: (err as Error).message, request_id: reqId });
    throw err;
  }
}