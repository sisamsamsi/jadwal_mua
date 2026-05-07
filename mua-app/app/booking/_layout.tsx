import React from "react";
import { Stack } from "expo-router";

export default function BookingLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="[id]" options={{ title: "Detail Booking" }} />
      <Stack.Screen name="new" options={{ title: "Booking Baru" }} />
    </Stack>
  );
}

