import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";

// Konfigurasi bagaimana notifikasi muncul saat aplikasi terbuka
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#B76E79",
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
      return null;
    }
    
    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (e) {
      console.warn("Error getting push token:", e);
    }
  }
  return token;
}

export async function scheduleBookingReminder(
  bookingId: string,
  title: string,
  body: string,
  triggerDate: Date
) {
  if (triggerDate.getTime() <= Date.now()) {
    // Jika waktu sudah lewat, jangan jadwalkan
    return null;
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { bookingId },
      sound: true,
    },
    trigger: triggerDate as any,
  });

  return id;
}

export async function cancelNotification(id: string) {
  if (id) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
}
