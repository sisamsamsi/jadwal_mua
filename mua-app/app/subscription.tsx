import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, Platform, ScrollView, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { Crown, CheckCircle2, MessageCircle, ArrowLeft } from "lucide-react-native";
import * as Linking from "expo-linking";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useProfile } from "@/lib/hooks/use-profile";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

export default function SubscriptionScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: profile, isLoading, refetch } = useProfile();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch().catch(() => {});
    setIsRefreshing(false);
  };

  const handleContactAdmin = () => {
    // GANTI NOMOR WA ADMIN DI SINI
    const adminWA = "628884000585"; 
    const message = `Halo Admin Fixatif, saya ingin memperpanjang langganan MUA saya. Akun: ${user?.email || profile?.fullName}`;
    Linking.openURL(`https://wa.me/${adminWA}?text=${encodeURIComponent(message)}`);
  };

  const isTrial = profile?.subscriptionStatus === "trial";
  const expiryDate = isTrial ? profile?.trialEndsAt : profile?.subscriptionEndsAt;
  const isExpired = expiryDate ? new Date(expiryDate) < new Date() : true;

  // Auto-navigate ke dashboard jika langganan aktif / tidak expired
  useEffect(() => {
    if (profile && !isExpired) {
      router.replace('/(tabs)/home');
    }
  }, [profile, isExpired]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')} 
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Langganan Premium</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={["#B76E79"]} />
        }
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={styles.crownCircle}>
              <Crown size={48} color="#B76E79" fill="#B76E79" />
            </View>
          </View>

          <View style={styles.statusContainer}>
            <Text style={styles.title}>
              {isExpired ? "Masa Akses Berakhir" : "Akses Premium Aktif"}
            </Text>
            <Text style={styles.description}>
              {isExpired 
                ? "Terima kasih telah mencoba Fixatif. Masa akses Anda telah habis. Silakan perpanjang untuk terus menggunakan fitur lengkap." 
                : `Anda sedang dalam masa ${isTrial ? 'Trial' : 'Berlangganan'}. Berakhir pada ${expiryDate ? new Date(expiryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}`}
            </Text>
          </View>

          <View style={styles.benefitsContainer}>
            {[
              "Manajemen Jadwal Tanpa Batas",
              "AI Asisten dari Pesan WA (Proses Booking Otomatis)",
              "Sistem Invoice & Kwitansi Otomatis",
              "Laporan Keuangan & Laba Rugi",
              "Booking Link untuk Klien",
              "Manajemen Inventaris Produk"
            ].map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <CheckCircle2 size={20} color="#10B981" />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>Biaya Langganan</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>Rp 79.000</Text>
              <Text style={styles.period}>/ bulan</Text>
            </View>
            <Text style={styles.priceSubtext}>Semua fitur, tanpa biaya tersembunyi.</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button 
          label={isLoading || isRefreshing ? "Memeriksa..." : "Sudah Bayar? Cek Status"}
          onPress={handleRefresh}
          variant="outline"
          className="h-14 rounded-2xl mb-3"
          disabled={isLoading || isRefreshing}
        />
        <Button 
          label="Hubungi Admin via WhatsApp"
          onPress={handleContactAdmin}
          variant="primary"
          className="h-14 rounded-2xl"
          leftIcon={<MessageCircle size={20} color="#FFF" />}
        />
        <Text style={styles.footerText}>Proses aktivasi cepat (5-10 menit)</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF7F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
    marginRight: 16,
    borderRadius: 12,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  content: {
    flex: 1,
    padding: 24,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  crownCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#B76E7915",
    alignItems: "center",
    justifyContent: "center",
  },
  statusContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
  benefitsContainer: {
    marginBottom: 32,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 15,
    color: "#374151",
    marginLeft: 12,
  },
  priceCard: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  price: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1F2937",
  },
  period: {
    fontSize: 16,
    color: "#6B7280",
    marginLeft: 4,
  },
  priceSubtext: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  footer: {
    padding: 24,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  footerText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 12,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
