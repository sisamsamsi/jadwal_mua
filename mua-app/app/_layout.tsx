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
import React, { useEffect, useState, useRef } from "react";
import { View, Text, ActivityIndicator, AppState } from "react-native";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { supabase } from "@/lib/supabase/client";
import { profilesService } from "@/lib/supabase/profiles";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { useRouter, useSegments, useRootNavigationState } from "expo-router";
import { CustomAlert } from "@/components/ui/CustomAlert";
import * as Updates from "expo-updates";
import { Alert } from "react-native";
import * as Linking from "expo-linking";
import { profileRepository } from "@/lib/repositories/profile-repository";


import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import migrations from "../drizzle/migrations";
import { db } from "@/lib/db/client";
import { bookings } from "@/lib/db/schema";
import { Platform } from "react-native";
import { eq } from "drizzle-orm";

import { registerForPushNotificationsAsync, scheduleSubscriptionReminder, showImmediateNotification } from "@/lib/utils/notifications";

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
  const [isSynced, setIsSynced] = useState(false);
  const [isSyncTimedOut, setIsSyncTimedOut] = useState(false);
  const realtimeChannelRef = useRef<any>(null);
  const appStateRef = useRef(AppState.currentState);

  // Deep Link Handling for Password Reset & OAuth
  useEffect(() => {
    const handleDeepLink = (url: string | null) => {
      if (!url) return;

      // Handle password reset
      if (url.includes('reset-password') || url.includes('type=recovery')) {
        router.replace('/(auth)/reset-password');
        return;
      }

      // Handle OAuth callback (Google SSO)
      if (url.includes('access_token')) {
        try {
          // Parse access_token from hash fragment (#) or query string (?)
          const hashIndex = url.indexOf('#');
          const tokenString = hashIndex >= 0 
            ? url.slice(hashIndex + 1) 
            : url.split('?')[1] ?? '';
            
          const params = new URLSearchParams(tokenString);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            // onAuthStateChange will fire and trigger navigation to home
          }
        } catch (e) {
          console.error('OAuth deep link parse error:', e);
        }
      }
    };
    
    Linking.getInitialURL().then(handleDeepLink);
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });
    
    return () => {
      subscription.remove();
    };
  }, [router]);

  useEffect(() => {
    // Check hydration status to avoid reading false defaults
    const unsubHydrate = useSettingsStore.persist.onFinishHydration(() => setIsHydrated(true));
    setIsHydrated(useSettingsStore.persist.hasHydrated());
    return () => {
      if (unsubHydrate) unsubHydrate();
    };
  }, []);

  useEffect(() => {
    const isNavigationReady = !!navigationState?.key;

    if (!isNavigationReady || isLoading || !isHydrated) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "onboarding";
    const isSubscriptionPage = (segments[0] as string) === "subscription";
    const isPublicBooking = segments[0] === "book";

    if (isPublicBooking) return;

    const timeout = setTimeout(async () => {
      try {
        if (!hasSeenOnboarding) {
          if (!inOnboarding) router.replace("/onboarding");
        } else if (!session) {
          if (!inAuthGroup) router.replace("/login");
        } else {
          // Fetch langsung dari Supabase — tidak bergantung SQLite / isSynced
          let isExpired = false;
          try {
            const remoteProfile = await profilesService.getById(session.user.id);
            const status = remoteProfile?.subscription_status ?? 'trial';

            if (status === 'active') {
              isExpired = false;
            } else if (status === 'expired' || status === 'cancelled') {
              isExpired = true;
            } else {
              // trial — cek tanggal kadaluarsa
              const trialEnd = remoteProfile?.trial_ends_at;
              if (trialEnd) isExpired = new Date(trialEnd) < new Date();
            }
          } catch {
            // Offline: fallback ke SQLite
            const localProfile = await profileRepository.getById(session.user.id);
            const status = localProfile?.subscriptionStatus ?? 'trial';
            if (status === 'active') {
              isExpired = false;
            } else if (status === 'expired' || status === 'cancelled') {
              isExpired = true;
            } else {
              const trialEnd = localProfile?.trialEndsAt;
              if (trialEnd) isExpired = new Date(trialEnd) < new Date();
            }
          }

          // Push notification registration
          if (Platform.OS !== 'web') {
            const localProfile = await profileRepository.getById(session.user.id).catch(() => null);
            registerForPushNotificationsAsync().then((token) => {
              if (token && token !== localProfile?.fcmToken) {
                profileRepository.update(session.user.id, { fcmToken: token });
              }
            });

            const reminderDate = localProfile?.subscriptionStatus === 'trial'
              ? localProfile?.trialEndsAt
              : localProfile?.subscriptionEndsAt;
            if (reminderDate) scheduleSubscriptionReminder(new Date(reminderDate));
          }

          if (isExpired) {
            if (!isSubscriptionPage) router.replace("/subscription" as any);
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

  // AppState Listener: refresh profil setiap kali app kembali ke foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        if (__DEV__) console.log('AppState: App active — refreshing profile...');
        // Invalidate semua query profil agar useProfile() re-fetch dari Supabase
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      }
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, []);

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

    if (__DEV__) console.log("RootLayout: Fetching session...");
    
    // FIX: Start sync repository listener
    const { syncRepository } = require("@/lib/repositories/sync-repository");
    const unsubscribeSync = syncRepository.startConnectivityListener();

    supabase.auth.getSession()
      .then(({ data }) => {
        if (__DEV__) console.log("RootLayout: Session fetched", !!data.session);
        setSession(data.session ?? null);
        setLoading(false);
        clearTimeout(safetyTimeout);
        
        if (data.session) {
          // BUG FIX: Set timeout 5 detik sebagai fallback jika network lambat / offline.
          // Ini mencegah infinite loading setelah OTA restart.
          const syncTimeout = setTimeout(() => {
            if (__DEV__) console.log("RootLayout: Sync timed out, proceeding with local data.");
            setIsSyncTimedOut(true);
          }, 5000);

          syncRepository.fullSync().finally(() => {
            clearTimeout(syncTimeout);
            setIsSynced(true);
            queryClient.invalidateQueries({ queryKey: ["profile", data.session?.user.id] });
          });
        } else {
          // Tidak ada session, tidak perlu sync
          setIsSynced(true);
        }

        // Keep-alive ping: Melakukan query ringan agar Supabase tetap aktif
        supabase.from("profiles").select("id").limit(1).then(() => {
          if (__DEV__) console.log("Keep-alive: Heartbeat sent to Supabase");
        });
      })
      .catch((err) => {
        console.error("RootLayout: Session fetch error", err);
        setLoading(false);
        clearTimeout(safetyTimeout);
      });


    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (__DEV__) console.log("RootLayout: Auth state changed", !!session);
        setSession(session ?? null);
        setLoading(false);
        clearTimeout(safetyTimeout);

        // REALTIME BOOKING LISTENER: dengarkan booking baru dari web link
        if (session?.user?.id) {
          // Hapus channel lama jika ada untuk mencegah duplikasi
          if (realtimeChannelRef.current) {
            supabase.removeChannel(realtimeChannelRef.current);
          }

          const userId = session.user.id;
          const channel = supabase.channel('public-bookings-listener');
          
          channel.on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'bookings',
              filter: `user_id=eq.${userId}`,
            },
            async (payload: any) => {
              try {
                const localBooking = await db
                  .select()
                  .from(bookings)
                  .where(eq(bookings.id, payload.new.id));

                if (localBooking.length === 0) {
                  const clientName = payload.new.client_name || 'Klien Baru';
                  const bookingDate = payload.new.booking_date || '';
                  const startTime = payload.new.start_time || '';
                  await showImmediateNotification(
                    '📅 Booking Baru Masuk!',
                    `${clientName} baru saja booking untuk tanggal ${bookingDate} jam ${startTime}`,
                    { type: 'new_booking', bookingId: payload.new.id }
                  );
                  syncRepository.fullSync();
                }
              } catch (e) {
                console.warn('Realtime booking handler error:', e);
              }
            }
          );
          
          channel.subscribe();
          realtimeChannelRef.current = channel;
        } else {
          if (realtimeChannelRef.current) {
            supabase.removeChannel(realtimeChannelRef.current);
            realtimeChannelRef.current = null;
          }
        }
      },
    );

    return () => {
      subscription?.subscription?.unsubscribe?.();
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
      unsubscribeSync();
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
