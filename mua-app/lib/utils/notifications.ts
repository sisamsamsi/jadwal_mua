// Notifications utility stubs - completely disabled to prevent Expo Go crashes

export async function registerForPushNotificationsAsync(): Promise<string> {
  if (__DEV__) console.log("Push notifications are disabled in this build.");
  return "ExponentPushToken[disabled]";
}

export async function scheduleBookingReminder(
  bookingId: string,
  title: string,
  body: string,
  triggerDate: Date,
  reminderType: 'h1' | '1h'
): Promise<string> {
  return "disabled_reminder_id";
}

export async function scheduleAllBookingReminders(booking: {
  id: string;
  bookingDate: string;
  startTime: string;
  status: string;
}): Promise<void> {
  // no-op
}

export async function scheduleSubscriptionReminder(expiryDate: Date): Promise<void> {
  // no-op
}

export async function showImmediateNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  if (__DEV__) console.log("Immediate notification trigger ignored (disabled):", title, body);
}

export async function cancelNotificationByBookingId(bookingId: string): Promise<void> {
  // no-op
}

export async function cancelNotification(id: string): Promise<void> {
  // no-op
}
