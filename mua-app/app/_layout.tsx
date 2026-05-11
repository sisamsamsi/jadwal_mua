import "../global.css";
if (typeof global.crypto !== 'object') {
  global.crypto = {} as any;
}
if (typeof global.crypto.randomUUID !== 'function') {
  global.crypto.randomUUID = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  } as any;
}
import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { useRouter, useSegments, useRootNavigationState } from "expo-router";

import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import migrations from "../drizzle/migrations";
import { db } from "@/lib/db/client";

const queryClient = new QueryClient();

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);
  const setSession = useAuthStore((s) => s.setSession);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    if (error) {
      console.error("Migration error:", error);
    }
  }, [error]);

  const hasSeenOnboarding = useSettingsStore((s) => s.hasSeenOnboarding);
  const { session, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key || isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "onboarding";
    const isPublicBooking = segments[0] === "book";

    if (!session && !inAuthGroup && !isPublicBooking) {
      router.replace("/login");
    } else if (session && !hasSeenOnboarding && !inOnboarding && !isPublicBooking) {
      router.replace("/onboarding");
    } else if (session && hasSeenOnboarding && (inAuthGroup || inOnboarding)) {
      router.replace("/(tabs)/home"); // path lengkap untuk menghindari ambiguitas
    }
  }, [session, isLoading, segments, hasSeenOnboarding, navigationState?.key]);

  useEffect(() => {
    // Pengaman: Jika dalam 3 detik status belum didapat, paksa matikan loading
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    supabase.auth.getSession()
      .then(({ data }) => {
        setSession(data.session ?? null);
        setLoading(false);
        clearTimeout(safetyTimeout);
      })
      .catch(() => {
        setLoading(false);
        clearTimeout(safetyTimeout);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session ?? null);
        setLoading(false);
        clearTimeout(safetyTimeout);
      },
    );

    return () => {
      subscription?.subscription?.unsubscribe?.();
      clearTimeout(safetyTimeout);
    };
  }, []);

  if (!success) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "#F44336", marginBottom: 10 }}>
          Gagal Memuat Database
        </Text>
        <Text style={{ textAlign: "center", color: "#757575" }}>
          {error?.message || "Terjadi kesalahan saat sinkronisasi data lokal. Silakan coba buka kembali aplikasinya."}
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
