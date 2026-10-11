/**
 * CATCH Logic Service - Express application entry point.
 */
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import cron from "node-cron";

import { config } from "./config";
import { logger } from "./utils/logger";
import { initFCM } from "./services/fcmService";

import healthRouter from "./routes/health";
import dealsRouter from "./routes/deals";
import notifyRouter from "./routes/notify";
import merchantRouter from "./routes/merchant";
import analyticsRouter from "./routes/analytics";

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// --- Routes ---
const v1 = express.Router();
v1.use(healthRouter);
v1.use(dealsRouter);
v1.use(notifyRouter);
v1.use(merchantRouter);
v1.use(analyticsRouter);
app.use("/api/v1", v1);

app.get("/", (_, res) => res.json({ service: "catch-logic-service", version: "1.0.0" }));

// --- Bootstrap ---
async function bootstrap(): Promise<void> {
  // MongoDB
  await mongoose.connect(config.MONGODB_URI);
  logger.info("MongoDB connected", { uri: config.MONGODB_URI.replace(/\/\/.*@/, "//***@") });

  // Firebase
  initFCM();

  // Start server
  app.listen(config.PORT, () => {
    logger.info("Logic service listening", { port: config.PORT, env: config.NODE_ENV });
  });
}

bootstrap().catch((err) => {
  logger.error("Bootstrap failed", { error: err.message });
  process.exit(1);
});

export { app };