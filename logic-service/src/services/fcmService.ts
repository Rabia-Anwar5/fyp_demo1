/**
 * Firebase Cloud Messaging service.
 * Sends proactive deal push notifications to shopper devices.
 */
import * as admin from "firebase-admin";
import { logger } from "../utils/logger";
import { config } from "../config";

let _initialized = false;

export function initFCM(): void {
  if (_initialized) return;
  try {
    if (config.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccount = require(config.FIREBASE_SERVICE_ACCOUNT_PATH);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } else {
      // Dev mode: use application default credentials
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
    }
    _initialized = true;
    logger.info("Firebase Admin SDK initialized");
  } catch (e) {
    logger.warn("Firebase init failed (FCM will be stubbed)", { error: (e as Error).message });
  }
}

export interface PushPayload {
  fcm_token: string;
  title: string;
  body: string;
  deal_id: string;
  user_id: string;
  store_name?: string;
  saving?: number;
}

export async function sendDealPush(payload: PushPayload): Promise<{ success: boolean; message_id?: string }> {
  if (!_initialized) {
    // Stub: log and return success for dev/test
    logger.info("FCM stub: would send push", { payload });
    return { success: true, message_id: `stub_${Date.now()}` };
  }

  try {
    const message: admin.messaging.Message = {
      token: payload.fcm_token,
      notification: { title: payload.title, body: payload.body },
      data: {
        deal_id: payload.deal_id,
        user_id: payload.user_id,
        store_name: payload.store_name ?? "",
        saving: String(payload.saving ?? 0),
        type: "deal_push",
      },
      android: { priority: "high" },
      apns: { payload: { aps: { sound: "default", badge: 1 } } },
    };

    const messageId = await admin.messaging().send(message);
    logger.info("FCM push sent", { message_id: messageId, user_id: payload.user_id });
    return { success: true, message_id: messageId };
  } catch (err) {
    logger.error("FCM push failed", { error: (err as Error).message, user_id: payload.user_id });
    return { success: false };
  }
}