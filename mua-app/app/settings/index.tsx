import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch } from "react-native";
import { showAlert } from "@/lib/utils/alert";

import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { ChevronLeft, Users, ShoppingBag, ShieldCheck, Store, Phone } from "lucide-react-native";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { APP_CONFIG } from "@/lib/constants/app";
import { useAuthStore } from "@/lib/stores/auth-store";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { paymentRepository } from "@/lib/repositories/payment-repository";
import { expenseRepository } from "@/lib/repositories/expense-repository";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react-native";
import { useSubscription } from "@/lib/hooks/use-subscription";
import * as Updates from "expo-updates";

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isPremium } = useSubscription();
  const { user } = useAuthStore();
  const { 
    showBridalParty, 
    showInventory, 
    waTemplates,
    toggleBridalParty, 
    toggleInventory,
    updateTemplates,
    paymentInstructions: savedPaymentInstructions,
    setPaymentInstructions
  } = useSettingsStore();

  const [showOtaDetails, setShowOtaDetails] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isTestingNotification, setIsTestingNotification] = useState(false);

  React.useEffect(() => {
    if (user?.id) {
      profileRepository.getById(user.id).then((p: any) => {
        if (p?.fcmToken) {
          setPushToken(p.fcmToken);
        }
      }).catch(() => {});
    }
  }, [user?.id]);

  const handleRegisterPushToken = async () => {
    if (!user?.id) {
      showAlert("Error", "Sesi login tidak ditemukan.");
      return;
    }
    setIsRegistering(true);
    try {
      const { registerForPushNotificationsAsync } = require("@/lib/utils/notifications");
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setPushToken(token);
        await profileRepository.update(user.id, { fcmToken: token });
        
        if (token.includes("mock_no_permission")) {
          showAlert(
            "Terdaftar (Mode Simulasi)",
            "Pendaftaran disimulasikan agar data tersimpan! Namun, izin notifikasi di HP Anda dinonaktifkan. Silakan aktifkan izin notifikasi untuk Fixatif di Pengaturan HP Anda agar notifikasi fisik bisa muncul."
          );
        } else if (token.includes("mock_simulator")) {
          showAlert(
            "Terdaftar (Simulator)",
            "Pendaftaran disimulasikan untuk lingkungan simulator/emulator. Notifikasi fisik tidak akan muncul di simulator, gunakan HP fisik untuk hasil optimal."
          );
        } else if (token.includes("mock_preview")) {
          showAlert(
            "Terdaftar (Mode Preview)",
            "Token tiruan berhasil terdaftar di APK Preview Anda. Notifikasi lokal kini aktif dan siap Anda tes!"
          );
        } else {
          showAlert("Berhasil", "Token Notifikasi berhasil didaftarkan dan disinkronkan ke Supabase.");
        }
      } else {
        showAlert("Perhatian", "Gagal mendapatkan token notifikasi. Periksa izin notifikasi di pengaturan HP Anda.");
      }
    } catch (err: any) {
      showAlert("Error", "Gagal mendaftarkan token: " + (err?.message || err));
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSendTestNotification = async () => {
    if (!pushToken) {
      showAlert("Perhatian", "Token notifikasi belum terdaftar. Silakan klik 'Daftarkan Perangkat' terlebih dahulu.");
      return;
    }
    setIsTestingNotification(true);
    try {
      const { showImmediateNotification } = require("@/lib/utils/notifications");
      await showImmediateNotification("📲 Test Notifikasi Lokal", "Jalur komunikasi internal aktif!");

      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          to: pushToken,
          title: "🔔 Test Push Notification (Sukses)",
          body: "Hebat! Jalur remote push dari server Expo ke HP Anda berhasil terhubung 100%!",
          data: { type: "test" },
          sound: "default",
          priority: "high",
        }),
      });
      
      const result = await response.json();
      if (response.ok) {
        showAlert("Sukses", "Tes notifikasi berhasil dikirim via Expo Server! Silakan tunggu 1-3 detik untuk notifikasi muncul.");
      } else {
        showAlert("Info", "Notifikasi lokal dikirim. Pengiriman remote gagal: " + JSON.stringify(result));
      }
    } catch (err: any) {
      showAlert("Error", "Gagal melakukan tes notifikasi: " + (err?.message || err));
    } finally {
      setIsTestingNotification(false);
    }
  };

  const [localPaymentInstructions, setLocalPaymentInstructions] = useState(savedPaymentInstructions);
  
  // Local state for templates to avoid auto-saving while typing
  const [localTemplates, setLocalTemplates] = useState(waTemplates);


  const handleSaveTemplates = () => {
    updateTemplates(localTemplates);
    showAlert("Berhasil", "Template WhatsApp telah disimpan.");
  };


  const handleSavePaymentInstructions = () => {
    setPaymentInstructions(localPaymentInstructions);
    showAlert("Berhasil", "Instruksi pembayaran telah disimpan.");
  };

  const handleResetFinance = () => {
    showAlert(
      "Konfirmasi Reset",
      "Apakah Anda yakin ingin menghapus SEMUA data pemasukan dan pengeluaran? Tindakan ini tidak dapat dibatalkan.",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Ya, Hapus Semua", 
          style: "destructive",
          onPress: async () => {
            try {
              await paymentRepository.deleteAll();
              await expenseRepository.deleteAll();
              queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
              queryClient.invalidateQueries({ queryKey: ["payments"] });
              queryClient.invalidateQueries({ queryKey: ["expenses"] });
              showAlert("Berhasil", "Data keuangan telah dikosongkan.");
            } catch (e) {
              showAlert("Error", "Gagal meriset data keuangan.");
            }
          }
        }
      ]
    );
  };

  const handleResetAllData = () => {
    showAlert(
      "Reset Seluruh Data Akun",
      "Apakah Anda yakin ingin menghapus PERMANEN semua data booking, klien, layanan, paket, invoice, pembayaran, pengeluaran, dan produk? Tindakan ini akan menghapus data di HP Anda dan di server Supabase secara permanen.",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Ya, Hapus Permanen", 
          style: "destructive",
          onPress: async () => {
            try {
              if (!user?.id) return;
              const userId = user.id;
              const { supabase: supabaseClient } = require("@/lib/supabase/client");
              const { db: dbClient } = require("@/lib/db/client");
              const schemaTable = require("@/lib/db/schema");
              const { eq: eqOp } = require("drizzle-orm");

              // 1. Hapus data di Supabase (remote)
              const { data: userBookings } = await supabaseClient.from("bookings").select("id").eq("user_id", userId);
              const bookingIds = userBookings?.map((b: any) => b.id) || [];

              if (bookingIds.length > 0) {
                await supabaseClient.from("bridal_party").delete().in("booking_id", bookingIds);
                await supabaseClient.from("booking_logs").delete().in("booking_id", bookingIds);
              }
              await supabaseClient.from("payments").delete().eq("user_id", userId);
              await supabaseClient.from("invoices").delete().eq("user_id", userId);
              await supabaseClient.from("bookings").delete().eq("user_id", userId);
              
              const { data: userClients } = await supabaseClient.from("clients").select("id").eq("user_id", userId);
              const clientIds = userClients?.map((c: any) => c.id) || [];
              if (clientIds.length > 0) {
                await supabaseClient.from("client_photos").delete().in("client_id", clientIds);
              }
              await supabaseClient.from("clients").delete().eq("user_id", userId);
              await supabaseClient.from("services").delete().eq("user_id", userId);
              await supabaseClient.from("packages").delete().eq("user_id", userId);
              await supabaseClient.from("expenses").delete().eq("user_id", userId);
              await supabaseClient.from("products").delete().eq("user_id", userId);
              await supabaseClient.from("reminders").delete().eq("user_id", userId);

              // 2. Hapus data di SQLite (lokal)
              await dbClient.delete(schemaTable.bridalParty).where(
                eqOp(schemaTable.bridalParty.bookingId, dbClient.select({ id: schemaTable.bookings.id }).from(schemaTable.bookings).where(eqOp(schemaTable.bookings.userId, userId)))
              ).catch(() => {});
              await dbClient.delete(schemaTable.payments).where(eqOp(schemaTable.payments.userId, userId)).catch(() => {});
              await dbClient.delete(schemaTable.invoices).where(eqOp(schemaTable.invoices.userId, userId)).catch(() => {});
              await dbClient.delete(schemaTable.bookings).where(eqOp(schemaTable.bookings.userId, userId)).catch(() => {});
              await dbClient.delete(schemaTable.clients).where(eqOp(schemaTable.clients.userId, userId)).catch(() => {});
              await dbClient.delete(schemaTable.services).where(eqOp(schemaTable.services.userId, userId)).catch(() => {});
              await dbClient.delete(schemaTable.packages).where(eqOp(schemaTable.packages.userId, userId)).catch(() => {});
              await dbClient.delete(schemaTable.expenses).where(eqOp(schemaTable.expenses.userId, userId)).catch(() => {});
              await dbClient.delete(schemaTable.products).where(eqOp(schemaTable.products.userId, userId)).catch(() => {});
              await dbClient.delete(schemaTable.reminders).where(eqOp(schemaTable.reminders.userId, userId)).catch(() => {});

              // 3. Clear Query Cache and Reload App
              queryClient.clear();
              
              showAlert(
                "Berhasil", 
                "Seluruh data transaksi dan master berhasil dihapus. Aplikasi akan memuat ulang.",
                [{ text: "OK", onPress: () => Updates.reloadAsync() }]
              );
            } catch (err: any) {
              showAlert("Error", "Gagal menghapus data: " + err.message);
            }
          }
        }
      ]
    );
  };


  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      
      <View className="flex-row items-center px-6 py-4 border-b border-divider bg-surface">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2">
          <ChevronLeft size={24} color="#2D2D2D" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-text-primary">Pengaturan</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>


        <Text className="text-text-hint font-bold uppercase text-xs mb-4">Fitur Modul</Text>
        
        <Card className="mb-8 overflow-hidden">
          <View className="flex-row items-center justify-between p-4 border-b border-divider">
            <View className="flex-row items-center">
              <Users size={20} color="#757575" className="mr-3" />
              <Text className="text-text-primary font-medium">Modul Rombongan</Text>
            </View>
            <Switch value={showBridalParty} onValueChange={toggleBridalParty} trackColor={{ false: "#E0E0E0", true: "#B76E79" }} />
          </View>
          <View className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center">
              <ShoppingBag size={20} color="#757575" className="mr-3" />
              <Text className="text-text-primary font-medium">Modul Inventaris</Text>
            </View>
            <Switch value={showInventory} onValueChange={toggleInventory} trackColor={{ false: "#E0E0E0", true: "#B76E79" }} />
          </View>
        </Card>

        <Text className="text-text-hint font-bold uppercase text-xs mb-4">Template Pesan WhatsApp</Text>
        <Card className="p-4 mb-8">
          <View className="bg-primary/5 p-3 rounded-lg mb-4">
            <Text className="text-primary text-[10px] leading-4">
              Gunakan placeholder:{"\n"}
              <Text className="font-bold">{"{{nama}}"}</Text> : Nama Klien{"\n"}
              <Text className="font-bold">{"{{layanan}}"}</Text> : Nama Layanan/Paket{"\n"}
              <Text className="font-bold">{"{{tanggal}}"}</Text> : Tanggal Booking{"\n"}
              <Text className="font-bold">{"{{jam}}"}</Text> : Jam Mulai
            </Text>
          </View>

          <View className="mb-4">
            <Input 
              label="Pesan Konfirmasi" 
              value={localTemplates.confirmation} 
              onChangeText={(t) => setLocalTemplates({ ...localTemplates, confirmation: t })}
              multiline
              numberOfLines={3}
            />
          </View>
          <View className="mb-4">
            <Input 
              label="Pesan Pengingat (Reminder)" 
              value={localTemplates.reminder} 
              onChangeText={(t) => setLocalTemplates({ ...localTemplates, reminder: t })}
              multiline
              numberOfLines={3}
            />
          </View>
          <View className="mb-6">
            <Input 
              label="Pesan Ucapan Terima Kasih" 
              value={localTemplates.thanks} 
              onChangeText={(t) => setLocalTemplates({ ...localTemplates, thanks: t })}
              multiline
              numberOfLines={3}
            />
          </View>
          <Button 
             label="Simpan Template" 
             onPress={handleSaveTemplates}
             variant="outline"
             className="h-12 rounded-xl"
           />
        </Card>

        <Text className="text-text-hint font-bold uppercase text-xs mb-4">Instruksi Pembayaran (Muncul di Invoice)</Text>
        <Card className="p-4 mb-8">
           <View className="mb-4">
             <Input 
               label="Nomor Rekening / E-Wallet" 
               value={localPaymentInstructions} 
               onChangeText={setLocalPaymentInstructions}
               placeholder="Contoh: BCA 123456 a/n MUA Name"
               multiline
               numberOfLines={4}
             />
           </View>
           <Button 
              label="Simpan Instruksi" 
              onPress={handleSavePaymentInstructions}
              variant="outline"
              className="h-12 rounded-xl"
            />
        </Card>

        <Text className="text-text-hint font-bold uppercase text-xs mb-4">Keamanan & Lisensi</Text>
        <TouchableOpacity onPress={() => router.push("/settings/subscription" as any)}>
          <Card className="p-4 bg-primary/5 border-primary/20 mb-8">
            <View className="flex-row items-start">
              <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center mr-4">
                  <ShieldCheck size={20} color="#B76E79" />
              </View>
              <View className="flex-1">
                  <Text className="font-bold text-text-primary">Status Lisensi</Text>
                  <Text className="text-text-secondary text-sm mb-2">
                    {isPremium ? "Lisensi Aktif (Versi Full)" : "Mode Development / Trial"}
                  </Text>
                  {!isPremium && (
                    <Text className="text-[10px] text-primary italic">
                      Ketuk untuk perpanjang atau aktivasi fitur premium.
                    </Text>
                  )}
              </View>
            </View>
          </Card>
        </TouchableOpacity>

        <Text className="text-text-hint font-bold uppercase text-xs mb-4">Bahaya / Manajemen Data</Text>
        <Card className="p-4 mb-10 border-red-100 bg-red-50/30 gap-y-4">
           <View className="flex-row items-center mb-4">
              <Trash2 size={20} color="#F44336" className="mr-3" />
              <View className="flex-1">
                 <Text className="font-bold text-text-primary">Manajemen Data</Text>
                 <Text className="text-text-hint text-[10px]">Hapus riwayat keuangan atau reset total akun Anda</Text>
              </View>
           </View>
           
           <View className="gap-y-3">
             <Button 
                label="Reset Hanya Data Keuangan" 
                variant="outline"
                className="border-status-error h-11 rounded-xl"
                textClassName="text-status-error"
                onPress={handleResetFinance}
             />

             <Button 
                label="Reset Seluruh Data (Jadwal, Klien, Layanan)" 
                variant="primary"
                className="bg-status-error border-status-error h-11 rounded-xl"
                textClassName="text-white font-bold"
                onPress={handleResetAllData}
             />
           </View>
         </Card>
 
         <View className="mt-10 mb-8 items-center">
           <Text className="text-center text-text-hint text-xs font-semibold">MUA App v{APP_CONFIG.VERSION}</Text>
           
           <TouchableOpacity 
             onPress={() => setShowOtaDetails(!showOtaDetails)}
             activeOpacity={0.7}
             className="mt-3 bg-neutral-background px-4 py-1.5 rounded-full border border-divider flex-row items-center shadow-sm"
           >
             <View className={`w-2.5 h-2.5 rounded-full mr-2.5 ${Updates.updateId ? "bg-emerald-500" : "bg-amber-400"}`} />
             <Text className="text-[11px] text-text-secondary font-bold uppercase tracking-wider">
               {Updates.updateId ? "OTA Update Aktif" : "Versi Default Aplikasi"}
             </Text>
           </TouchableOpacity>

           {showOtaDetails && (
              <Card className="mt-4 p-5 w-full bg-surface border border-divider rounded-2xl shadow-md gap-y-3">
                <Text className="text-xs font-bold text-text-secondary uppercase tracking-widest border-b border-divider pb-2 mb-1">
                  Informasi Update Aplikasi
                </Text>
                <View className="gap-y-2.5">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-xs text-text-hint">Update ID</Text>
                    <Text className="text-xs text-text-primary font-mono bg-neutral-background px-2 py-0.5 rounded select-all border border-divider">
                      {Updates.updateId ? Updates.updateId.substring(0, 8) + "..." : "N/A (Lokal/Dev)"}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-xs text-text-hint">Tanggal Rilis</Text>
                    <Text className="text-xs text-text-primary font-semibold">
                      {Updates.createdAt ? new Date(Updates.createdAt).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '-'}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-xs text-text-hint">Channel Rilis</Text>
                    <Text className="text-xs text-text-primary font-bold text-primary capitalize bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                      {Updates.channel || "development"}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-xs text-text-hint">Sumber Bundle</Text>
                    <Text className="text-xs text-text-primary font-semibold">
                      {Updates.isEmbeddedLaunch ? "Built-in (Asli)" : "OTA Downloaded (Terbaru)"}
                    </Text>
                  </View>
                </View>

                <Text className="text-xs font-bold text-text-secondary uppercase tracking-widest border-t border-divider pt-3 pb-2 mt-2">
                  Diagnostik Notifikasi (Tes)
                </Text>
                <View className="gap-y-3">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-xs text-text-hint">Push Token</Text>
                    <Text className="text-xs text-text-primary font-mono bg-neutral-background px-2 py-0.5 rounded select-all border border-divider max-w-[180px]" numberOfLines={1}>
                      {pushToken ? `${pushToken.substring(0, 15)}...` : "Belum Terdaftar"}
                    </Text>
                  </View>
                  
                  <View className="flex-row gap-x-2 mt-1">
                    <TouchableOpacity 
                      disabled={isRegistering}
                      onPress={handleRegisterPushToken}
                      className="flex-1 bg-primary/10 border border-primary/20 py-2.5 rounded-xl items-center justify-center"
                    >
                      <Text className="text-xs text-primary font-bold">
                        {isRegistering ? "Mendaftarkan..." : "Daftarkan HP"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      disabled={isTestingNotification}
                      onPress={handleSendTestNotification}
                      className="flex-1 bg-emerald-500 py-2.5 rounded-xl items-center justify-center"
                    >
                      <Text className="text-xs text-white font-bold">
                        {isTestingNotification ? "Mengirim..." : "Kirim Uji Coba"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            )}
         </View>
       </ScrollView>
    </SafeAreaView>
  );
}
