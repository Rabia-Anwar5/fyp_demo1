/**
 * POST /api/v1/merchant/submit
 * Merchants submit inventory and promotions directly (hybrid scraping model).
 */
import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { Product } from "../models/Product";
import { Coupon } from "../models/Coupon";
import { logger } from "../utils/logger";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// Simple API key middleware (replace with proper auth in production)
function merchantAuth(req: Request, res: Response, next: Function) {
  const key = req.headers["x-merchant-api-key"] as string;
  if (!key || key.length < 8) {
    return res.status(401).json({ error: "Invalid merchant API key" });
  }
  next();
}

router.post("/merchant/submit", merchantAuth, [
  body("merchant_id").isString().notEmpty(),
  body("products").isArray({ min: 1 }),
  body("products.*.sku").isString().notEmpty(),
  body("products.*.name").isString().notEmpty(),
  body("products.*.category").isString().notEmpty(),
  body("products.*.original_price").isFloat({ min: 0 }),
  body("products.*.stock_qty").isInt({ min: 0 }),
  body("products.*.store_id").isString().notEmpty(),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { merchant_id, products } = req.body;
  const now = new Date();
  let productsUpserted = 0;
  let couponsUpserted = 0;

  try {
    for (const p of products) {
      // Upsert product
      await Product.findOneAndUpdate(
        { sku: p.sku, store_id: p.store_id },
        {
          sku: p.sku,
          source: "merchant",
          store_id: p.store_id,
          store_name: p.store_name ?? merchant_id,
          mall_id: p.mall_id ?? "mall_default",
          name: p.name,
          category: p.category,
          subcategory: p.subcategory ?? "",
          fabric_type: p.fabric_type,
          original_price: p.original_price,
          sale_price: p.sale_price,
          stock_qty: p.stock_qty,
          stock_status: p.stock_qty > 10 ? "in_stock" : p.stock_qty > 0 ? "low_stock" : "out_of_stock",
          last_updated: now,
        },
        { upsert: true, new: true }
      );
      productsUpserted++;

      // Upsert promotions
      if (p.promotions && Array.isArray(p.promotions)) {
        for (const promo of p.promotions) {
          const couponId = `merch_${p.store_id}_${promo.coupon_code ?? uuidv4()}`;
          await Coupon.findOneAndUpdate(
            { coupon_id: couponId },
            {
              coupon_id: couponId,
              source: "merchant",
              store_id: p.store_id,
              store_name: p.store_name ?? merchant_id,
              coupon_code: promo.coupon_code ?? null,
              description: promo.description ?? "",
              discount_type: promo.discount_type,
              discount_value: promo.discount_value,
              min_spend: promo.min_spend ?? 0,
              categories: [p.category],
              subcategories: p.subcategory ? [p.subcategory] : [],
              fabric_types: promo.fabric_types ?? [],
              original_price: p.original_price,
              expiry: new Date(promo.expiry),
              terms: promo.terms ?? "",
              is_active: true,
              last_verified: now,
            },
            { upsert: true, new: true }
          );
          couponsUpserted++;
        }
      }
    }

    logger.info("Merchant submission processed", { merchant_id, productsUpserted, couponsUpserted });
    res.json({ success: true, products_upserted: productsUpserted, coupons_upserted: couponsUpserted });
  } catch (err) {
    logger.error("Merchant submit error", { error: (err as Error).message });
    res.status(500).json({ error: "Failed to process submission" });
  }
});

export default router;