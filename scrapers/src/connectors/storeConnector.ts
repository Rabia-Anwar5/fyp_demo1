/**
 * StoreConnector interface.
 * All scrapers (Puppeteer, BS4-proxy, merchant API) implement this interface.
 * This makes it easy to add a real POS connector in the future without
 * touching the scheduler or normaliser.
 */

export interface RawProduct {
  sku: string;
  name: string;
  category: string;
  subcategory: string;
  fabric_type?: string;
  original_price: number;
  sale_price?: number;
  stock_qty: number;
  image_url?: string;
  scrape_url?: string;
}

export interface RawPromotion {
  coupon_code?: string;
  description: string;
  discount_type: "percent" | "flat" | "bogo";
  discount_value: number;
  min_spend?: number;
  categories: string[];
  subcategories: string[];
  fabric_types?: string[];
  expiry: string;   // ISO8601
  terms?: string;
}

export interface ScrapeResult {
  store_id: string;
  store_name: string;
  mall_id: string;
  scraped_at: string;
  products: RawProduct[];
  promotions: RawPromotion[];
  error?: string;
}

export interface StoreConnector {
  store_id: string;
  store_name: string;
  mall_id: string;
  /** Fetch live products and promotions from this store. */
  fetch(): Promise<ScrapeResult>;
}