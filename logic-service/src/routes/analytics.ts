import { Router, Request, Response } from "express";
import { AnalyticsEvent } from "../models/AnalyticsEvent";
import mongoose from "mongoose";

const router = Router();

router.get("/analytics/summary", async (_req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json({ deal_stats: {}, scrape_stats: [], note: "MongoDB not connected — running in standalone mode" });
  }

  try {
    const [dealStats] = await AnalyticsEvent.aggregate([
      { $match: { event_type: "deal_found" } },
      { $group: {
          _id: null,
          avg_time_to_deal_ms: { $avg: "$time_to_deal_ms" },
          avg_deals_found: { $avg: "$deals_found" },
          avg_deals_after_filter: { $avg: "$deals_after_filter" },
          avg_top_saving: { $avg: "$top_saving" },
          total_events: { $sum: 1 },
      }},
    ]);

    const scrapeStats = await AnalyticsEvent.aggregate([
      { $match: { event_type: "scrape_run" } },
      { $group: {
          _id: "$scrape_source",
          avg_duration_ms: { $avg: "$scrape_duration_ms" },
          total_runs: { $sum: 1 },
          errors: { $sum: { $cond: [{ $ifNull: ["$error", false] }, 1, 0] } },
      }},
    ]);

    res.json({ deal_stats: dealStats ?? {}, scrape_stats: scrapeStats });
  } catch (err) {
    res.status(500).json({ error: "Analytics query failed", detail: (err as Error).message });
  }
});

export default router;