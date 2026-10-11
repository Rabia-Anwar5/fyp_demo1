/**
 * POST /api/v1/deals
 * Given a recognised item context, return ranked deals.
 */
import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { getDealsForItem } from "../services/dealService";
import { sendDealPush } from "../services/fcmService";
import { UserProfile } from "../models/UserProfile";
import { logger } from "../utils/logger";

const router = Router();

const validateDeals = [
  body("item_context_id").isString().notEmpty(),
  body("category").isString().notEmpty(),
  body("subcategory").isString().notEmpty(),
  body("fabric_type").optional().isString(),
  body("user_id").optional().isString(),
  body("location.mall_id").optional().isString(),
  body("reference_price").optional().isFloat({ min: 0 }),
];

router.post("/deals", validateDeals, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { item_context_id, category, subcategory, fabric_type, user_id, location, reference_price, request_id } = req.body;

  try {
    const report = await getDealsForItem({
      item_context_id,
      category,
      subcategory,
      fabric_type,
      user_id,
      mall_id: location?.mall_id,
      reference_price,
      request_id: request_id ?? item_context_id,
    });

    // Proactively push top deal via FCM if user has tokens
    if (user_id && report.deals.length > 0) {
      const profile = await UserProfile.findOne({ user_id }).lean();
      const topDeal = report.deals[0];
      if (profile && profile.fcm_tokens?.length > 0) {
        sendDealPush({
          fcm_token: profile.fcm_tokens[0],
          title: `${topDeal.saving_percent}% off at ${topDeal.store_name}!`,
          body: topDeal.coupon_code
            ? `Use code ${topDeal.coupon_code} to save ${topDeal.net_saving.toFixed(2)}`
            : `Save ${topDeal.net_saving.toFixed(2)} — expires ${new Date(topDeal.expiry).toLocaleDateString()}`,
          deal_id: topDeal.deal_id,
          user_id,
          store_name: topDeal.store_name,
          saving: topDeal.net_saving,
        }).catch((e: Error) => logger.warn("FCM push error", { error: e.message }));
      }
    }

    res.json({
      ...report,
      deals: report.deals.slice(0, 10),  // return top 10
      total_deals_found: report.total_before_filter,
      deals_filtered_out: report.total_before_filter - report.total_after_filter,
      filter_reasons: [
        `expired: ${report.filtered_out_expired}`,
        `category_mismatch: ${report.filtered_out_category}`,
        `min_spend: ${report.filtered_out_min_spend}`,
      ],
    });
  } catch (err) {
    logger.error("deals route error", { error: (err as Error).message });
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;