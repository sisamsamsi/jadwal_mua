import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { ChevronLeft, Users, ShoppingBag, ShieldCheck } from "lucide-react-native";
import { Card } from "@/components/ui/Card";

export default function SettingsScreen() {
  const router = useRouter();
  const { 
    showBridalParty, 
    showInventory, 
    isLicenseActive,
    toggleBridalParty, 
    toggleInventory 
  } = useSettingsStore();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      
      <View className="flex-row items-center px-6 py-4 border-b border-divider bg-surface">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2">
          <ChevronLeft size={24} color="#2D2D2D" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-text-primary">Pengaturan Fitur</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text className="text-text-hint font-bold uppercase text-xs mb-4">Fitur Modul</Text>
        
        <Card className="mb-6 overflow-hidden">
          <ToggleItem 
            label="Detail Rias Per Orang" 
            description="Tampilkan rincian makeup & baju untuk setiap anggota rombongan."
            icon={<Users size={22} color="#B76E79" />}
            value={showBridalParty}
            onToggle={toggleBridalParty}
          />
          <View className="h-[1] bg-divider ml-16" />
          <ToggleItem 
            label="Manajemen Inventaris" 
            description="Aktifkan pencatatan stok alat rias dan produk."
            icon={<ShoppingBag size={22} color="#2196F3" />}
            value={showInventory}
            onToggle={toggleInventory}
          />
        </Card>

        <Text className="text-text-hint font-bold uppercase text-xs mb-4">Keamanan & Lisensi</Text>
        <Card className="p-4 bg-primary/5 border-primary/20">
          <View className="flex-row items-start">
             <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center mr-4">
                <ShieldCheck size={20} color="#B76E79" />
             </View>
             <View className="flex-1">
                <Text className="font-bold text-text-primary">Status Lisensi</Text>
                <Text className="text-text-secondary text-sm mb-2">
                  {isLicenseActive ? "Lisensi Aktif (Versi Full)" : "Mode Development / Trial"}
                </Text>
                {!isLicenseActive && (
                  <Text className="text-[10px] text-primary italic">
                    * Sistem lisensi sedang dalam pengembangan dan dinonaktifkan untuk tester.
                  </Text>
                )}
             </View>
          </View>
        </Card>

        <Text className="text-center text-text-hint mt-10 text-xs">MUA App v1.0.0 (Beta)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function ToggleItem({ label, description, icon, value, onToggle }: any) {
  return (
    <View className="flex-row items-center justify-between p-4">
      <View className="flex-row items-center flex-1 mr-4">
        <View className="w-10 h-10 bg-neutral-background rounded-xl items-center justify-center mr-4">
          {icon}
        </View>
        <View className="flex-1">
          <Text className="text-text-primary font-bold">{label}</Text>
          <Text className="text-text-hint text-xs">{description}</Text>
        </View>
      </View>
      <Switch 
        value={value} 
        onValueChange={onToggle}
        trackColor={{ false: "#E0E0E0", true: "#B76E79" }}
        thumbColor={value ? "#FFFFFF" : "#F5F5F5"}
      />
    </View>
  );
}
