/**
 * Hook for registering Expo Push Notifications and handling incoming deal pushes.
 */
import { useEffect, useRef } from "react";
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
  const notifListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        // In production: send token to logic-service to update UserProfile.fcm_tokens
        console.log("[CATCH] Push token:", token);
      }
    });

    notifListener.current = Notifications.addNotificationReceivedListener((notif) => {
      const dealId = notif.request.content.data?.deal_id as string;
      if (dealId && onDealReceived) onDealReceived(dealId);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((resp) => {
      const dealId = resp.notification.request.content.data?.deal_id as string;
      if (dealId && onDealReceived) onDealReceived(dealId);
    });

    return () => {
      Notifications.removeNotificationSubscription(notifListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);
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