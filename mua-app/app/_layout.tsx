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
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/auth-store";

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

    return () => {
      subscription?.subscription?.unsubscribe?.();
    };
  }, []);

  if (!success) {
    return null;
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
