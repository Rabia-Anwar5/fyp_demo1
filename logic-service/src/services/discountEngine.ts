/**
 * Discount Filtering Engine
 *
 * Core logic for CATCH's agentic deal discovery.
 * 1. Load all active coupons from DB matching category + optional subcategory + fabric
 * 2. Filter: not expired, category match, min_spend feasible
 * 3. Compute net_saving for each valid coupon
 * 4. Rank by net_saving descending
 * 5. Return top-N with explanation of why the top deal won
 *
 * This is pure business logic - no DB or HTTP calls in this file; those are in dealService.ts
 */

import { ICoupon } from "../models/Coupon";

export interface DealContext {
  category: string;
  subcategory: string;
  fabric_type?: string;
  reference_price?: number;    // price of the item the shopper is looking at
  min_spend_budget?: number;   // shopper's estimated spend (optional)
}

export interface RankedDeal {
  deal_id: string;
  coupon_code: string | null;
  store_id: string;
  store_name: string;
  original_price: number;
  discounted_price: number;
  net_saving: number;
  saving_percent: number;
  expiry: string;
  terms: string;
  category_match: boolean;
  rank: number;
  why_top?: string;
}

export interface FilterReport {
  deals: RankedDeal[];
  total_before_filter: number;
  total_after_filter: number;
  filtered_out_expired: number;
  filtered_out_category: number;
  filtered_out_min_spend: number;
}

/**
 * Filter and rank coupons for a given item context.
 * All logic is deterministic and testable (no IO).
 */
export function filterAndRankDeals(
  coupons: ICoupon[],
  ctx: DealContext,
  now: Date = new Date()
): FilterReport {
  const before = coupons.length;
  let exp = 0, cat = 0, spend = 0;
  const referencePrice = ctx.reference_price ?? 100; // fallback if unknown

  const validDeals: RankedDeal[] = [];

  for (const coupon of coupons) {
    // 1. Expiry check
    if (coupon.expiry < now) { exp++; continue; }
    if (!coupon.is_active) { exp++; continue; }

    // 2. Category match (category must match if specified, subcategory must match if specified)
    const mainCatMatch =
      coupon.categories.length === 0 || coupon.categories.includes(ctx.category);
    if (!mainCatMatch) { cat++; continue; }

    const subCatMatch =
      coupon.subcategories.length === 0 || coupon.subcategories.includes(ctx.subcategory);
    if (!subCatMatch) { cat++; continue; }

    // 3. Fabric filter (if coupon specifies fabric types)
    if (
      ctx.fabric_type &&
      coupon.fabric_types.length > 0 &&
      !coupon.fabric_types.includes(ctx.fabric_type)
    ) {
      cat++; continue;
    }

    // 4. Compute effective price
    const origPrice = coupon.original_price ?? referencePrice;
    let discountedPrice: number;

    if (coupon.discount_type === "percent") {
      discountedPrice = origPrice * (1 - coupon.discount_value / 100);
    } else if (coupon.discount_type === "flat") {
      discountedPrice = Math.max(0, origPrice - coupon.discount_value);
    } else if (coupon.discount_type === "bogo") {
      discountedPrice = origPrice / 2; // simplified: 50% effective
    } else {
      discountedPrice = origPrice;
    }

    // 5. Min spend check
    if (coupon.min_spend > 0 && origPrice < coupon.min_spend) { spend++; continue; }

    const netSaving = origPrice - discountedPrice;
    const savingPct = origPrice > 0 ? (netSaving / origPrice) * 100 : 0;

    validDeals.push({
      deal_id: coupon.coupon_id,
      coupon_code: coupon.coupon_code,
      store_id: coupon.store_id,
      store_name: coupon.store_name,
      original_price: Math.round(origPrice * 100) / 100,
      discounted_price: Math.round(discountedPrice * 100) / 100,
      net_saving: Math.round(netSaving * 100) / 100,
      saving_percent: Math.round(savingPct * 10) / 10,
      expiry: coupon.expiry.toISOString(),
      terms: coupon.terms,
      category_match: true,
      rank: 0, // set after sort
    });
  }

  // Rank by net_saving descending
  validDeals.sort((a, b) => b.net_saving - a.net_saving);
  validDeals.forEach((d, i) => {
    d.rank = i + 1;
    if (i === 0 && validDeals.length > 0) {
      d.why_top = buildWhyTop(d, validDeals);
    }
  });

  return {
    deals: validDeals,
    total_before_filter: before,
    total_after_filter: validDeals.length,
    filtered_out_expired: exp,
    filtered_out_category: cat,
    filtered_out_min_spend: spend,
  };
}

function buildWhyTop(top: RankedDeal, all: RankedDeal[]): string {
  const parts: string[] = [];
  parts.push(`Highest net saving (${top.saving_percent}%)`);
  if (top.coupon_code) {
    parts.push(`use code ${top.coupon_code}`);
  }
  if (all.length > 1) {
    const second = all[1];
    const extra = top.net_saving - second.net_saving;
    parts.push(`saves ${extra.toFixed(2)} more than the next best deal`);
  }
  return parts.join("; ");
}