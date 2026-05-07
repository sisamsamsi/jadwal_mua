// Fitur notifikasi dimatikan untuk kompatibilitas Expo Go
export async function registerForPushNotificationsAsync() {
  return null;
}

export async function scheduleBookingReminder(
  bookingId: string,
  title: string,
  body: string,
  triggerDate: Date
) {
  return null;
}

export async function cancelNotification(id: string) {
  return null;
}
