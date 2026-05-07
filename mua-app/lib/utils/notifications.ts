import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notification!");
      return;
    }
    
    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) {
        console.warn("Project ID not found for notifications");
      }
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (e) {
      console.warn("Error getting push token:", e);
    }
  } else {
    // alert("Must use physical device for Push Notifications");
  }

  return token;
}

export async function scheduleBookingReminder(
  bookingId: string,
  title: string,
  body: string,
  triggerDate: Date
) {
  // Only schedule if the date is in the future
  if (triggerDate.getTime() <= Date.now()) {
    return null;
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { bookingId },
    },
    trigger: triggerDate as any,
  });

  return id;
}

export async function cancelNotification(id: string) {
  await Notifications.cancelScheduledNotificationAsync(id);
}
