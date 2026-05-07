import "../global.css";
import React, { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/auth-store";
import * as Notifications from "expo-notifications";

const queryClient = new QueryClient();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const setSession = useAuthStore((s) => s.setSession);
  const setLoading = useAuthStore((s) => s.setLoading);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session ?? null);
        setLoading(false);
      },
    );

    const notificationSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const { bookingId } = response.notification.request.content.data as any;
      if (bookingId) {
        router.push(`/booking/${bookingId}` as any);
      }
    });

    return () => {
      subscription?.subscription?.unsubscribe?.();
      notificationSubscription.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
