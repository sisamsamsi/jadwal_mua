import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform, Alert } from "react-native";
import Constants from "expo-constants";

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.log("Must use physical device for Push Notifications");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    Alert.alert(
      "Izin Notifikasi Ditolak",
      "Anda tidak akan menerima pengingat jadwal via notifikasi. Anda bisa mengaktifkannya di pengaturan perangkat."
    );
    return null;
  }

  // Get the token that uniquely identifies this device
  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      console.warn("Project ID not found in expo config, notification registration might fail.");
    }

    const token = (await Notifications.getExpoPushTokenAsync({
      projectId,
    })).data;

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#B76E79",
      });
    }

    return token;
  } catch (e) {
    console.error("Error getting push token", e);
    return null;
  }
}

export async function scheduleBookingReminder(
  bookingId: string,
  title: string,
  body: string,
  triggerDate: Date,
  reminderType: 'h1' | '1h'
) {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data?.bookingId === bookingId && notif.content.data?.reminderType === reminderType) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch (e) {
    console.warn("Failed to cancel existing booking reminder", e);
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { bookingId, reminderType },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
  });
  return identifier;
}

export async function scheduleAllBookingReminders(booking: {
  id: string;
  bookingDate: string;
  startTime: string;
  status: string;
}) {
  if (booking.status === 'cancelled') {
    try {
      await cancelNotificationByBookingId(booking.id);
    } catch (e) {
      console.warn("Failed to cancel notifications on cancelled status", e);
    }
    return;
  }

  try {
    const [year, month, day] = booking.bookingDate.split("-").map(Number);
    const [hour, minute] = booking.startTime.split(":").map(Number);
    const bookingDateObj = new Date(year, month - 1, day, hour, minute);

    // H-1 (24 hours before)
    const reminderDateH1 = new Date(bookingDateObj.getTime() - 24 * 60 * 60 * 1000);
    if (reminderDateH1 > new Date()) {
      await scheduleBookingReminder(
        booking.id,
        "Pengingat Jadwal Makeup (H-1)",
        `Kamu ada jadwal makeup besok jam ${booking.startTime}`,
        reminderDateH1,
        'h1'
      );
    }

    // 1 hour before
    const reminderDate1H = new Date(bookingDateObj.getTime() - 60 * 60 * 1000);
    if (reminderDate1H > new Date()) {
      await scheduleBookingReminder(
        booking.id,
        "Pengingat Jadwal Makeup (1 Jam Lagi)",
        `Kamu ada jadwal makeup 1 jam lagi (jam ${booking.startTime})`,
        reminderDate1H,
        '1h'
      );
    }
  } catch (e) {
    console.warn(`Failed to schedule reminders for booking ${booking.id}:`, e);
  }
}


// Jadwalkan notifikasi 3 hari sebelum langganan habis
export async function scheduleSubscriptionReminder(expiryDate: Date) {
  try {
    // Batalkan pengingat langganan yang sudah ada agar tidak duplikat
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data?.type === 'subscription_reminder') {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    const reminderDate = new Date(expiryDate.getTime() - 3 * 24 * 60 * 60 * 1000);

    // Hanya jadwalkan jika tanggal pengingat masih di masa depan
    if (reminderDate > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Langganan Fixatif Hampir Habis',
          body: 'Masa akses Anda akan berakhir dalam 3 hari. Segera hubungi admin untuk perpanjangan!',
          data: { type: 'subscription_reminder' },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderDate },
      });
      if (__DEV__) console.log('Subscription reminder scheduled for:', reminderDate.toISOString());
    }
  } catch (e) {
    console.warn('Failed to schedule subscription reminder:', e);
  }
}

// Tampilkan notifikasi langsung (real-time) — hanya berfungsi saat app aktif / di background
export async function showImmediateNotification(title: string, body: string, data?: Record<string, any>) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data ?? {},
      },
      trigger: null, // null = tampilkan sekarang juga
    });
  } catch (e) {
    console.warn('Failed to show immediate notification:', e);
  }
}

export async function cancelNotificationByBookingId(bookingId: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.bookingId === bookingId) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}

export async function cancelNotification(id: string) {
  await Notifications.cancelScheduledNotificationAsync(id);
}
