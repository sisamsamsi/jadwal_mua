import React from "react";
import { View, Text, ScrollView, Switch, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, Bell, Lock, Globe, Eye, BookOpen, ChevronRight } from "lucide-react-native";

export default function SettingsScreen() {
  const router = useRouter();

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

        <Section title="Notifikasi">
          <SettingItem 
            label="Pengingat Jadwal" 
            icon={<Bell size={20} color="#B76E79" />} 
            value={true} 
          />
          <SettingItem 
            label="Notifikasi WhatsApp" 
            icon={<Globe size={20} color="#4CAF50" />} 
            value={true} 
          />
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

function SettingItem({ label, icon, value }: { label: string, icon: any, value: boolean }) {
  const [isEnabled, setIsEnabled] = React.useState(value);

  return (
    <View className="flex-row items-center justify-between p-4 border-b border-divider last:border-b-0">
      <View className="flex-row items-center">
        <View className="w-8 h-8 items-center justify-center mr-3">
          {icon}
        </View>
        <Text className="text-text-primary font-medium text-base">{label}</Text>
      </View>
      <Switch
        trackColor={{ false: "#E0E0E0", true: "#B76E79" }}
        thumbColor={isEnabled ? "#FFFFFF" : "#F5F5F5"}
        onValueChange={() => setIsEnabled(!isEnabled)}
        value={isEnabled}
      />
    </View>
  );
}
