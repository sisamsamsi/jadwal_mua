import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, Lock, Eye, BookOpen, ChevronRight, MessageSquare, Trash2 } from "lucide-react-native";
import { paymentRepository } from "@/lib/repositories/payment-repository";
import { useQueryClient } from "@tanstack/react-query";

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleResetRevenue = () => {
    Alert.alert(
      "Reset Revenue",
      "Apakah Anda yakin ingin menghapus semua catatan transaksi? Revenue akan kembali menjadi Rp 0. Tindakan ini tidak bisa dibatalkan.",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Ya, Reset", 
          style: "destructive", 
          onPress: async () => {
            await paymentRepository.deleteAll();
            queryClient.invalidateQueries({ queryKey: ["payments"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
            Alert.alert("Sukses", "Data transaksi telah dibersihkan.");
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-6 py-4 border-b border-divider bg-surface">
        <Button variant="ghost" size="icon" onPress={() => router.back()} className="mr-2">
          <ChevronLeft size={24} color="#2D2D2D" />
        </Button>
        <Text className="text-xl font-bold text-text-primary">Pengaturan</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Section title="Bantuan">
          <TouchableOpacity 
            onPress={() => router.push("/settings/guide" as any)}
            className="flex-row items-center justify-between p-4"
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 items-center justify-center mr-3 bg-blue-50 rounded-lg">
                <BookOpen size={20} color="#2196F3" />
              </View>
              <View>
                <Text className="text-text-primary font-medium text-base">Panduan Pengguna</Text>
                <Text className="text-text-hint text-xs">Cara pakai aplikasi dari nol</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#BDBDBD" />
          </TouchableOpacity>
        </Section>

        <Section title="Data & Keuangan">
          <TouchableOpacity 
            onPress={handleResetRevenue}
            className="flex-row items-center justify-between p-4"
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 items-center justify-center mr-3 bg-red-50 rounded-lg">
                <Trash2 size={20} color="#F44336" />
              </View>
              <View>
                <Text className="text-status-error font-medium text-base">Reset Semua Revenue</Text>
                <Text className="text-text-hint text-xs">Hapus semua riwayat pembayaran</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#BDBDBD" />
          </TouchableOpacity>
        </Section>

        <Section title="Fitur WhatsApp">
          <View className="p-4 flex-row items-center">
            <View className="w-8 h-8 items-center justify-center mr-3 bg-green-50 rounded-lg">
              <MessageSquare size={20} color="#4CAF50" />
            </View>
            <View className="flex-1">
              <Text className="text-text-primary font-medium text-base">WhatsApp Reminder</Text>
              <Text className="text-text-hint text-xs">Fitur kirim pengingat & invoice via WA aktif otomatis.</Text>
            </View>
          </View>
        </Section>

        <Section title="Keamanan (Pending)">
          <View className="p-4 opacity-50">
            <Text className="text-text-secondary text-sm italic">Fitur Kunci Aplikasi & Keamanan akan hadir pada update mendatang.</Text>
          </View>
        </Section>

        <Section title="Tampilan (Pending)">
          <View className="p-4 opacity-50">
            <Text className="text-text-secondary text-sm italic">Mode Gelap & Tema Kustom akan segera hadir.</Text>
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <View className="mb-8">
      <Text className="text-text-hint text-xs font-bold uppercase tracking-widest mb-4 ml-1">
        {title}
      </Text>
      <View className="bg-surface rounded-2xl border border-divider overflow-hidden">
        {children}
      </View>
    </View>
  );
}
