import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { ChevronLeft, List, Box, Users, CalendarDays, Receipt, Heart } from "lucide-react-native";

export default function GuideScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      
      <View className="flex-row items-center px-6 py-4 border-b border-divider bg-surface">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ChevronLeft size={24} color="#2D2D2D" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-text-primary">Panduan Pengguna</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text className="text-2xl font-bold text-primary mb-2">Selamat Datang! ✨</Text>
        <Text className="text-text-secondary mb-8">
          Ikuti langkah-langkah di bawah ini untuk mulai mengelola jadwal MUA Anda dengan profesional.
        </Text>

        <Step 
          num="1" 
          title="Atur Layanan Jasa" 
          desc="Klik menu Layanan di Dashboard. Masukkan semua jenis jasa makeup Anda (contoh: Wedding, Wisuda, Party) beserta harganya."
          icon={<List size={20} color="white" />}
        />

        <Step 
          num="2" 
          title="Buat Paket (Opsional)" 
          desc="Gabungkan beberapa layanan menjadi satu paket hemat di menu Paket Jasa. Ini memudahkan Anda saat klien memesan banyak layanan sekaligus."
          icon={<Box size={20} color="white" />}
        />

        <Step 
          num="3" 
          title="Daftarkan Klien" 
          desc="Masukkan nama dan nomor WhatsApp klien. Pastikan nomor diawali dengan 628... agar fitur kirim pesan otomatis berfungsi."
          icon={<Users size={20} color="white" />}
        />

        <Step 
          num="4" 
          title="Buat Jadwal Booking" 
          desc="Pilih tanggal, lokasi, dan klien. Sistem akan otomatis menjadwalkan pengingat di HP Anda 1 jam sebelum acara dimulai."
          icon={<CalendarDays size={20} color="white" />}
        />

        <Step 
          num="5" 
          title="Kelola Pembayaran" 
          desc="Catat DP atau pelunasan. Anda bisa langsung mengirim Invoice profesional ke WhatsApp klien dari halaman detail booking."
          icon={<Receipt size={20} color="white" />}
        />

        <View className="mt-8 p-6 bg-primary-light/20 rounded-3xl items-center">
          <Heart size={32} color="#B76E79" />
          <Text className="text-primary font-bold text-lg mt-2 text-center">Semangat Sukses, MUA!</Text>
          <Text className="text-text-secondary text-xs text-center mt-1">
            Gunakan aplikasi ini setiap hari untuk melacak perkembangan bisnis Anda.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Step({ num, title, desc, icon }: { num: string, title: string, desc: string, icon: any }) {
  return (
    <View className="flex-row mb-8">
      <View className="mr-4">
        <View className="w-10 h-10 rounded-full bg-primary items-center justify-center">
          {icon}
        </View>
        <View className="w-[2] flex-1 bg-primary/20 self-center my-1" />
      </View>
      <View className="flex-1 pt-1">
        <Text className="text-text-hint text-[10px] font-bold uppercase">Langkah {num}</Text>
        <Text className="text-text-primary font-bold text-lg mb-1">{title}</Text>
        <Text className="text-text-secondary leading-5">{desc}</Text>
      </View>
    </View>
  );
}
