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
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { useRouter, useSegments, useRootNavigationState } from "expo-router";
import { CustomAlert } from "@/components/ui/CustomAlert";
import * as Updates from "expo-updates";
import { Alert } from "react-native";
import { profileRepository } from "@/lib/repositories/profile-repository";


import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import migrations from "../drizzle/migrations";
import { db } from "@/lib/db/client";
import { Platform } from "react-native";

const queryClient = new QueryClient();

export default function RootLayout() {
  // Only run migrations on native platforms. SQLite is not supported on web in this setup.
  const migrationResult = Platform.OS !== 'web' 
    ? useMigrations(db, migrations) 
    : { success: true, error: null };
  
  const { success, error } = migrationResult;
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

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Check hydration status to avoid reading false defaults
    const unsubHydrate = useSettingsStore.persist.onFinishHydration(() => setIsHydrated(true));
    setIsHydrated(useSettingsStore.persist.hasHydrated());
    return () => {
      if (unsubHydrate) unsubHydrate();
    };
  }, []);

  useEffect(() => {
    // Tunggu sampai navigasi, auth, dan settings (hydration) siap
    const isNavigationReady = !!navigationState?.key;
    
    if (!isNavigationReady || isLoading || !isHydrated) {
      console.log("RootLayout: Waiting for...", { 
        nav: isNavigationReady, 
        auth: !isLoading, 
        settings: isHydrated 
      });
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "onboarding";
    const isSubscriptionPage = (segments[0] as string) === "subscription";
    const isPublicBooking = segments[0] === "book";

    if (isPublicBooking) return;

    // Gunakan rAF atau setTimeout kecil untuk memastikan router siap
    const timeout = setTimeout(async () => {
      try {
        if (!hasSeenOnboarding) {
          if (!inOnboarding) {
            router.replace("/onboarding");
          }
        } else if (!session) {
          if (!inAuthGroup) {
            router.replace("/login");
          }
        } else {
          // USER LOGGED IN - Check Subscription
          const profile = await profileRepository.getById(session.user.id);
          
          // Logika Penentuan Status
          let isExpired = false;
          if (profile) {
            const expiryDate = profile.subscriptionStatus === "trial" 
              ? profile.trialEndsAt 
              : profile.subscriptionEndsAt;
            
            if (expiryDate) {
              isExpired = new Date(expiryDate) < new Date();
            } else {
              // Jika data langganan belum ada sama sekali (user baru), buatkan trial 7 hari
              const trialEnd = new Date();
              trialEnd.setDate(trialEnd.getDate() + 7);
              await profileRepository.update(session.user.id, {
                subscriptionStatus: "trial",
                trialEndsAt: trialEnd.toISOString(),
              });
            }
          }

          if (isExpired) {
            if (!isSubscriptionPage) {
              router.replace("/subscription" as any);
            }
          } else if (inAuthGroup || inOnboarding || isSubscriptionPage) {
            router.replace("/(tabs)/home" as any);
          }
        }
      } catch (err) {
        console.error("RootLayout Navigation Error:", err);
      }
    }, 10);

    return () => clearTimeout(timeout);
  }, [session, isLoading, segments, hasSeenOnboarding, navigationState?.key, isHydrated]);

  useEffect(() => {
    async function onFetchUpdateAsync() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          Alert.alert(
            "Update Tersedia",
            "Versi terbaru Fixatif sudah tersedia. Ingin memperbarui aplikasi sekarang?",
            [
              { text: "Nanti" },
              {
                text: "Update & Restart",
                onPress: async () => {
                  await Updates.fetchUpdateAsync();
                  await Updates.reloadAsync();
                },
              },
            ]
          );
        }
      } catch (error) {
        // Error di development mode diabaikan
        console.log("Updates error:", error);
      }
    }

    onFetchUpdateAsync();
  }, []);


  useEffect(() => {
    // Pengaman: Jika dalam 3 detik status belum didapat, paksa matikan loading
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    console.log("RootLayout: Fetching session...");
    supabase.auth.getSession()
      .then(({ data }) => {
        console.log("RootLayout: Session fetched", !!data.session);
        setSession(data.session ?? null);
        setLoading(false);
        clearTimeout(safetyTimeout);
      })
      .catch((err) => {
        console.error("RootLayout: Session fetch error", err);
        setLoading(false);
        clearTimeout(safetyTimeout);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log("RootLayout: Auth state changed", !!session);
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

  // FIX 3: Tampilkan error HANYA jika ada error nyata. 
  // Jika !success tapi !error, berarti masih proses migrasi database.
  if (!success && error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#fff" }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "#F44336", marginBottom: 10 }}>
          Gagal Memuat Database
        </Text>
        <Text style={{ textAlign: "center", color: "#757575" }}>
          {error?.message || "Terjadi kesalahan saat sinkronisasi data lokal."}
        </Text>
      </View>
    );
  }

  // Jika migrasi belum sukses dan belum ada error, tampilkan loading utama
  if (!success) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FAF7F5" }}>
        <ActivityIndicator size="large" color="#B76E79" />
        <Text style={{ marginTop: 12, color: "#B76E79" }}>Menyiapkan Database...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
        <CustomAlert />
      </QueryClientProvider>

    </GestureHandlerRootView>
  );
}
