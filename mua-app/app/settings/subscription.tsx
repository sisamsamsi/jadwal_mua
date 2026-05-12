import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { ChevronLeft, CheckCircle2, Crown, MessageCircle, Calendar, Phone } from "lucide-react-native";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function SubscriptionScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // Mock data for now as per BLUEPRINT point 3.A
  // In real implementation, these would come from profiles table in Supabase
  const subscriptionStatus = user?.user_metadata?.subscription_status || "trial";
  const trialEndsAt = user?.user_metadata?.trial_ends_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const daysLeft = Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const handleSubscribe = () => {
    const email = user?.email || "User";
    const pesan = `Halo admin Fixatif, saya ingin berlangganan paket Premium bulanan (Rp 79.000). Akun saya: ${email}`;
    // Ganti nomor di bawah dengan nomor WhatsApp admin yang sebenarnya
    Linking.openURL(`https://wa.me/628884000585?text=${encodeURIComponent(pesan)}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-divider bg-surface">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2">
          <ChevronLeft size={24} color="#2D2D2D" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-text-primary">Langganan</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {/* Status Card */}
        <Card className="p-6 mb-8 bg-primary/5 border-primary/20 overflow-hidden relative">
          <View className="absolute -right-6 -top-6 opacity-10">
            <Crown size={120} color="#B76E79" />
          </View>
          
          <View className="flex-row items-center mb-4">
            <View className="bg-primary/20 p-2 rounded-full mr-3">
              <Crown size={20} color="#B76E79" />
            </View>
            <Text className="text-lg font-bold text-text-primary">Status Akun</Text>
          </View>

          <View className="mb-4">
             <Text className="text-text-secondary text-sm">Paket Saat Ini:</Text>
             <Text className="text-2xl font-bold text-primary uppercase tracking-tight">
               {subscriptionStatus === 'trial' ? 'Free Trial (7 Hari)' : 'Premium Member'}
             </Text>
          </View>

          <View className="flex-row items-center bg-white/60 p-3 rounded-xl border border-divider">
            <Calendar size={16} color="#757575" className="mr-2" />
            <Text className="text-text-secondary text-xs">
              {subscriptionStatus === 'trial' 
                ? `Masa trial berakhir dalam ${daysLeft > 0 ? daysLeft : 0} hari lagi.` 
                : "Langganan Anda aktif hingga bulan depan."}
            </Text>
          </View>
        </Card>

        {/* Benefits */}
        <Text className="text-text-hint font-bold uppercase text-xs mb-4">Keuntungan Premium</Text>
        <View className="mb-8 gap-4">
          {[
            "Kelola Jadwal Tanpa Batas",
            "Akses Asisten AI (Proses Booking Otomatis)",
            "Web Link Booking Mandiri untuk Klien",
            "Laporan Keuangan & Inventaris",
            "Download Invoice PDF Profesional",
            "Backup Data Aman di Cloud"
          ].map((benefit, index) => (
            <View key={index} className="flex-row items-center">
              <CheckCircle2 size={18} color="#4CAF50" className="mr-3" />
              <Text className="text-text-primary font-medium">{benefit}</Text>
            </View>
          ))}
        </View>

        {/* Pricing Card */}
        <Card className="p-8 items-center border-2 border-primary mb-8 shadow-lg shadow-primary/20">
          <Text className="text-text-secondary font-bold text-xs uppercase tracking-widest mb-2">Paling Populer</Text>
          <View className="flex-row items-baseline mb-1">
            <Text className="text-3xl font-bold text-text-primary">Rp 79.000</Text>
          </View>
          <Text className="text-text-hint text-sm mb-6">per bulan</Text>
          
          <Button 
            label="Aktifkan Sekarang" 
            onPress={handleSubscribe}
            leftIcon={<MessageCircle size={20} color="white" />}
            className="w-full h-14 rounded-2xl shadow-md"
          />
          <Text className="text-[10px] text-text-hint mt-4 text-center leading-4">
            Pembayaran akan dikonfirmasi secara manual oleh Admin melalui WhatsApp setelah Anda melakukan transfer.
          </Text>
        </Card>

        {/* Support */}
        <View className="bg-neutral-background p-6 rounded-2xl flex-row items-center mb-10">
          <View className="flex-1">
            <Text className="font-bold text-text-primary mb-1">Butuh bantuan?</Text>
            <Text className="text-text-secondary text-xs">Hubungi tim support kami jika ada kendala pembayaran.</Text>
          </View>
          <TouchableOpacity 
            className="bg-white p-3 rounded-full shadow-sm border border-divider"
            onPress={() => Linking.openURL('https://wa.me/628XXXXXXXXXX')}
          >
            <Phone size={20} color="#B76E79" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
