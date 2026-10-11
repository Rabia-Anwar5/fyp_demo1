/**
 * POST /api/v1/notify
 * Manually trigger an FCM push notification.
 */
import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { sendDealPush } from "../services/fcmService";
import { logger } from "../utils/logger";

const router = Router();

router.post("/notify", [
  body("user_id").isString().notEmpty(),
  body("fcm_token").isString().notEmpty(),
  body("deal_id").isString().notEmpty(),
  body("title").isString().notEmpty(),
  body("body").isString().notEmpty(),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { user_id, fcm_token, deal_id, title, body: msgBody, store_name, saving } = req.body;
  const result = await sendDealPush({ fcm_token, title, body: msgBody, deal_id, user_id, store_name, saving });
  res.json(result);
});

export default router;