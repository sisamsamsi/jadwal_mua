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
import { View, Text, ActivityIndicator, AppState, TouchableOpacity } from "react-native";
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
import * as FileSystem from "expo-file-system";


import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import migrations from "../drizzle/migrations";
import { db } from "@/lib/db/client";
import { bookings } from "@/lib/db/schema";
import { Platform } from "react-native";
import { eq } from "drizzle-orm";

import { registerForPushNotificationsAsync, scheduleSubscriptionReminder } from "@/lib/utils/notifications";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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
  const [isUpdating, setIsUpdating] = useState(false);
  const [showRecoveryOption, setShowRecoveryOption] = useState(false);
  const realtimeChannelRef = useRef<any>(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    let timer: any;
    if (!success) {
      timer = setTimeout(() => {
        setShowRecoveryOption(true);
      }, 6000); // 6 detik safety timeout
    } else {
      setShowRecoveryOption(false);
    }
    return () => clearTimeout(timer);
  }, [success]);

  const forceResetDatabaseAndRestart = async () => {
    try {
      const dbPath = `${(FileSystem as any).documentDirectory}SQLite/mua_app.db`;
      const info = await FileSystem.getInfoAsync(dbPath);
      if (info.exists) {
        await FileSystem.deleteAsync(dbPath, { idempotent: true });
      }
      await Updates.reloadAsync();
    } catch (err) {
      console.error("Force reset database failed:", err);
      try {
        const { clearLocalDatabase } = require("@/lib/db/client");
        await clearLocalDatabase();
        await Updates.reloadAsync();
      } catch (e) {
        Alert.alert("Gagal Memulihkan", "Gagal membersihkan database otomatis. Silakan instal ulang aplikasi.");
      }
    }
  };

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

  // Handle Notification Taps
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const { data } = response.notification.request.content;
      if (data?.bookingId) {
        router.push(`/booking/${data.bookingId}` as any);
      } else if (data?.type === 'subscription_reminder') {
        router.push(`/subscription` as any);
      }
    });
    return () => subscription.remove();
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
          // Fetch langsung dari Supabase dengan proteksi timeout 2 detik untuk menghindari hang saat OTA reload
          let isExpired = false;
          try {
            const remoteProfile = await Promise.race([
              profilesService.getById(session.user.id),
              new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000))
            ]);
            
            // Cek kedua skema penamaan (snake_case dari DB atau camelCase jika sudah di-map) untuk ketahanan ekstra
            const status = remoteProfile?.subscription_status ?? remoteProfile?.subscriptionStatus ?? 'trial';

            if (status === 'active') {
              isExpired = false;
            } else if (status === 'expired' || status === 'cancelled') {
              isExpired = true;
            } else {
              // trial — cek tanggal kadaluarsa
              const trialEnd = remoteProfile?.trial_ends_at ?? remoteProfile?.trialEndsAt;
              if (trialEnd) isExpired = new Date(trialEnd) < new Date();
            }
          } catch (err) {
            if (__DEV__) console.log("RootLayout: Remote profile fetch failed or timed out, using local SQLite cache", err);
            // Offline/Timeout: fallback ke SQLite (cepat dan handal)
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
                  try {
                    setIsUpdating(true);
                    await Updates.fetchUpdateAsync();
                    await Updates.reloadAsync();
                  } catch (err) {
                    setIsUpdating(false);
                    if (__DEV__) console.log("Fetch update error:", err);
                  }
                },
              },
            ]
          );
        }
      } catch (error) {
        if (__DEV__) console.log("Updates error:", error);
      }
    }

    const otaTimeout = setTimeout(onFetchUpdateAsync, 2000);
    return () => clearTimeout(otaTimeout);
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
          syncRepository.fullSync().finally(() => {
            queryClient.invalidateQueries({ queryKey: ["profile", data.session?.user.id] });
          });
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
            if (__DEV__) console.log("RootLayout: Removing previous realtime channel");
            supabase.removeChannel(realtimeChannelRef.current);
          }

          const userId = session.user.id;
          if (__DEV__) console.log(`RootLayout: Setting up Realtime bookings listener for user_id: ${userId}`);

          // Ganti nama channel menjadi unik per user untuk menghindari tabrakan jika ada lebih dari 1 user dalam app yang sama
          const channel = supabase.channel(`public-bookings-listener-${userId}`);
          
          channel.on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'bookings',
              filter: `user_id=eq.${userId}`,
            },
            async (payload: any) => {
              if (__DEV__) console.log('Realtime: Received INSERT event payload:', payload);
              try {
                if (__DEV__) console.log('Realtime: Starting full sync to update local data...');
                // Sinkronisasi data di background tanpa memunculkan notifikasi lokal ganda.
                // Notifikasi utama kini ditangani oleh Push Notification Server yang dikirim dari form open booking 
                // sehingga notifikasi lebih handal dan sampai walau app ditutup (killed).
                syncRepository.fullSync();
              } catch (e) {
                console.warn('Realtime booking handler error:', e);
              }
            }
          );
          
          channel.subscribe((status, err) => {
            if (__DEV__) {
              console.log(`Realtime: Subscription status: ${status}`);
              if (err) {
                console.error("Realtime: Subscription error detail:", err);
              }
            }
          });
          
          realtimeChannelRef.current = channel;
        } else {
          if (realtimeChannelRef.current) {
            if (__DEV__) console.log("RootLayout: User logged out, removing realtime channel");
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
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FAF7F5", padding: 24 }}>
        <ActivityIndicator size="large" color="#B76E79" />
        <Text style={{ marginTop: 16, color: "#B76E79", fontWeight: "600", fontSize: 16 }}>Menyiapkan Database...</Text>
        <Text style={{ marginTop: 8, color: "#9E9E9E", fontSize: 12, textAlign: "center" }}>
          Ini memerlukan waktu beberapa saat saat pertama kali atau setelah pembaruan.
        </Text>
        
        {showRecoveryOption && (
          <View style={{ marginTop: 32, padding: 20, backgroundColor: "#FFF", borderRadius: 16, borderWidth: 1, borderColor: "#E0E0E0", width: "100%", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
            <Text style={{ fontSize: 13, fontWeight: "bold", color: "#E57373", textTransform: "uppercase", letterSpacing: 1 }}>Proses Terlalu Lama?</Text>
            <Text style={{ fontSize: 12, color: "#757575", marginTop: 6, textAlign: "center", marginBottom: 16, lineHeight: 18 }}>
              Jika aplikasi macet di layar ini, mungkin terjadi konflik database lokal setelah update. Anda dapat membersihkan cache lokal dengan aman dan menyinkronkan ulang data secara bersih dari server.
            </Text>
            <TouchableOpacity 
              onPress={forceResetDatabaseAndRestart}
              activeOpacity={0.8}
              style={{ backgroundColor: "#E57373", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, width: "100%", alignItems: "center" }}
            >
              <Text style={{ color: "#FFF", fontWeight: "bold", fontSize: 13 }}>Bersihkan & Reset Database Lokal</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
        <CustomAlert />
        {isUpdating && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 99999
          }}>
            <ActivityIndicator size="large" color="#B76E79" />
            <Text style={{ marginTop: 15, color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
              Mengunduh pembaruan...
            </Text>
            <Text style={{ marginTop: 5, color: '#ddd', fontSize: 13 }}>
              Aplikasi akan restart secara otomatis setelah selesai
            </Text>
          </View>
        )}
      </QueryClientProvider>

    </GestureHandlerRootView>
  );
}
