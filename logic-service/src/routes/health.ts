import { Router } from "express";
const router = Router();
router.get("/health", (_, res) => res.json({ status: "healthy", service: "catch-logic-service", ts: new Date().toISOString() }));
export default router;