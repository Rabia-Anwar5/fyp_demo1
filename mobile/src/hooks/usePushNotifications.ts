/**
 * Hook for registering Expo Push Notifications and handling incoming deal pushes.
 * Returns expoPushToken (string|null) and the latest notification object.
 */
import { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications(onDealReceived?: (dealId: string) => void) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notifListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      setExpoPushToken(token);
      if (token) {
        // In production: send token to logic-service to update UserProfile.fcm_tokens
        console.log("[CATCH] Push token:", token);
      }
    });

    notifListener.current = Notifications.addNotificationReceivedListener((notif) => {
      setNotification(notif);
      const dealId = notif.request.content.data?.deal_id as string;
      if (dealId && onDealReceived) onDealReceived(dealId);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((resp) => {
      setNotification(resp.notification);
      const dealId = resp.notification.request.content.data?.deal_id as string;
      if (dealId && onDealReceived) onDealReceived(dealId);
    });

    return () => {
      Notifications.removeNotificationSubscription(notifListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return { expoPushToken, notification };
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("[CATCH] Push notification permission denied");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("catch-deals", {
      name: "CATCH Deals",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  } catch {
    return null;
  }
}