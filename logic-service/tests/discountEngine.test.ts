/**
 * Unit tests for the Discount Engine (pure logic, no DB).
 */
import { filterAndRankDeals, DealContext } from "../src/services/discountEngine";
import { ICoupon } from "../src/models/Coupon";

const FUTURE = new Date(Date.now() + 86400000 * 30);  // 30 days ahead
const PAST   = new Date(Date.now() - 86400000);        // yesterday

function makeCoupon(overrides: Partial<ICoupon> = {}): ICoupon {
  return {
    coupon_id: `test_${Math.random()}`,
    source: "merchant",
    store_id: "store_01",
    store_name: "Test Store",
    coupon_code: "TEST10",
    description: "",
    discount_type: "percent",
    discount_value: 10,
    min_spend: 0,
    categories: ["apparel"],
    subcategories: ["jacket"],
    fabric_types: [],
    original_price: 100,
    expiry: FUTURE,
    terms: "",
    is_active: true,
    last_verified: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  } as unknown as ICoupon;
}

const ctx: DealContext = {
  category: "apparel",
  subcategory: "jacket",
  reference_price: 100,
};

describe("filterAndRankDeals", () => {
  test("filters expired coupons", () => {
    const coupons = [makeCoupon({ expiry: PAST })];
    const report = filterAndRankDeals(coupons, ctx);
    expect(report.deals).toHaveLength(0);
    expect(report.filtered_out_expired).toBe(1);
  });

  test("filters inactive coupons", () => {
    const coupons = [makeCoupon({ is_active: false })];
    const report = filterAndRankDeals(coupons, ctx);
    expect(report.deals).toHaveLength(0);
    expect(report.filtered_out_expired).toBe(1);
  });

  test("filters category mismatches", () => {
    const coupons = [makeCoupon({ categories: ["electronics"] })];
    const report = filterAndRankDeals(coupons, ctx);
    expect(report.deals).toHaveLength(0);
    expect(report.filtered_out_category).toBe(1);
  });

  test("filters min_spend violations", () => {
    const coupons = [makeCoupon({ min_spend: 200, original_price: 100 })];
    const report = filterAndRankDeals(coupons, ctx);
    expect(report.deals).toHaveLength(0);
    expect(report.filtered_out_min_spend).toBe(1);
  });

  test("computes net_saving for percent discount", () => {
    const coupons = [makeCoupon({ discount_value: 20, original_price: 100 })];
    const report = filterAndRankDeals(coupons, ctx);
    expect(report.deals[0].net_saving).toBe(20);
    expect(report.deals[0].discounted_price).toBe(80);
  });

  test("computes net_saving for flat discount", () => {
    const coupons = [makeCoupon({ discount_type: "flat", discount_value: 15, original_price: 100 })];
    const report = filterAndRankDeals(coupons, ctx);
    expect(report.deals[0].net_saving).toBe(15);
  });

  test("ranks by net_saving descending", () => {
    const coupons = [
      makeCoupon({ coupon_id: "low", discount_value: 5, original_price: 100 }),
      makeCoupon({ coupon_id: "high", discount_value: 30, original_price: 100 }),
      makeCoupon({ coupon_id: "mid", discount_value: 15, original_price: 100 }),
    ];
    const report = filterAndRankDeals(coupons, ctx);
    expect(report.deals[0].deal_id).toBe("high");
    expect(report.deals[1].deal_id).toBe("mid");
    expect(report.deals[2].deal_id).toBe("low");
  });

  test("top deal has why_top explanation", () => {
    const coupons = [
      makeCoupon({ coupon_id: "a", discount_value: 30 }),
      makeCoupon({ coupon_id: "b", discount_value: 10 }),
    ];
    const report = filterAndRankDeals(coupons, ctx);
    expect(report.deals[0].why_top).toBeDefined();
    expect(typeof report.deals[0].why_top).toBe("string");
  });

  test("universal coupons (empty categories) match any item", () => {
    const coupons = [makeCoupon({ categories: [], subcategories: [] })];
    const ctxElec: DealContext = { category: "electronics", subcategory: "headphone" };
    const report = filterAndRankDeals(coupons, ctxElec);
    expect(report.deals).toHaveLength(1);
  });

  test("fabric filter excludes non-matching fabric types", () => {
    const coupons = [makeCoupon({ fabric_types: ["cotton"] })];
    const ctxDenim: DealContext = { category: "apparel", subcategory: "jacket", fabric_type: "denim" };
    const report = filterAndRankDeals(coupons, ctxDenim);
    expect(report.deals).toHaveLength(0);
  });

  test("fabric filter passes matching fabric types", () => {
    const coupons = [makeCoupon({ fabric_types: ["denim"] })];
    const ctxDenim: DealContext = { category: "apparel", subcategory: "jacket", fabric_type: "denim" };
    const report = filterAndRankDeals(coupons, ctxDenim);
    expect(report.deals).toHaveLength(1);
  });
});