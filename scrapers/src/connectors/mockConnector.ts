/**
 * MockConnector - returns seed data from JSON files.
 * Used in CI and demo so the stack works without live store URLs.
 * Replace with real Puppeteer or BS4 connectors per store.
 */
import * as fs from "fs";
import * as path from "path";
import { StoreConnector, ScrapeResult } from "./storeConnector";

export class MockConnector implements StoreConnector {
  store_id: string;
  store_name: string;
  mall_id: string;
  private seedFile: string;

  constructor(store_id: string, store_name: string, mall_id: string, seedFile: string) {
    this.store_id = store_id;
    this.store_name = store_name;
    this.mall_id = mall_id;
    this.seedFile = seedFile;
  }

  async fetch(): Promise<ScrapeResult> {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 50 + Math.random() * 100));

    const raw = JSON.parse(fs.readFileSync(this.seedFile, "utf-8"));
    const products = raw.filter((p: any) => p.store_id === this.store_id);
    return {
      store_id: this.store_id,
      store_name: this.store_name,
      mall_id: this.mall_id,
      scraped_at: new Date().toISOString(),
      products,
      promotions: [],  // promotions come via seed_coupons.json separately
    };
  }
}