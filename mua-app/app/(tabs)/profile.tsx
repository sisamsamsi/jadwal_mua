import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/lib/stores/auth-store";
import { authService } from "@/lib/supabase/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { 
  User, 
  Settings, 
  LogOut, 
  Package, 
  ShoppingBag, 
  ChevronRight, 
  Star,
  Info
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useSettingsStore } from "@/lib/stores/settings-store";

export default function ProfileScreen() {
  const { session } = useAuthStore();
  const router = useRouter();
  const { showInventory } = useSettingsStore();

  const handleLogout = async () => {
    await authService.signOut();
    router.replace("/(auth)/login");
  };

  const userEmail = session?.user?.email ?? "MUA Professional";
  const displayName = userEmail.split("@")[0];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View className="items-center mb-10">
          <View className="relative">
            <View className="w-32 h-32 rounded-full bg-primary-light/30 border-4 border-surface items-center justify-center">
              <User {...({ size: 60, color: "#B76E79" } as any)} />
            </View>
            <TouchableOpacity 
              className="absolute bottom-0 right-0 bg-primary w-10 h-10 rounded-full border-4 border-surface items-center justify-center"
              onPress={() => {}}
            >
              <Settings {...({ size: 18, color: "white" } as any)} />
            </TouchableOpacity>
          </View>
          <Text className="text-2xl font-bold text-text-primary mt-4 capitalize">{displayName}</Text>
          <Text className="text-text-secondary">{userEmail}</Text>
          
          <View className="flex-row mt-4 gap-x-2">
            <Badge icon={<Star {...({ size: 12, color: "#D4A574" } as any)} />} label="Premium Member" />
          </View>
        </View>

        <View className="gap-y-4">
          <SectionTitle title="Layanan & Produk" />
          <ProfileLink 
            label="Manajemen Layanan" 
            icon={<Package {...({ size: 22, color: "#B76E79" } as any)} />} 
            onPress={() => router.push("/service")} 
          />
          <ProfileLink 
            label="Paket Layanan" 
            icon={<Star {...({ size: 22, color: "#D4A574" } as any)} />} 
            onPress={() => router.push("/package")} 
          />
          {showInventory && (
            <ProfileLink 
              label="Inventaris Produk" 
              icon={<ShoppingBag {...({ size: 22, color: "#2196F3" } as any)} />} 
              onPress={() => router.push("/product")} 
            />
          )}

          <SectionTitle title="Aplikasi" />
          <ProfileLink 
            label="Pengaturan" 
            icon={<Settings {...({ size: 22, color: "#757575" } as any)} />} 
            onPress={() => router.push("/settings")} 
          />
          <ProfileLink 
            label="Bantuan & Support" 
            icon={<Info {...({ size: 22, color: "#757575" } as any)} />} 
            onPress={() => {}} 
          />
          
          <Button 
            variant="ghost" 
            className="mt-6 flex-row items-center justify-center py-4 bg-red-50"
            onPress={handleLogout}
          >
            <LogOut {...({ size: 20, color: "#F44336" } as any)} className="mr-2" />
            <Text className="text-status-error font-bold text-lg">Keluar Akun</Text>
          </Button>
        </View>

        <Text className="text-center text-text-hint mt-10 mb-6">MUA App v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Text className="text-text-hint text-xs font-bold uppercase tracking-widest mt-4 ml-1">
      {title}
    </Text>
  );
}

function ProfileLink({ label, icon, onPress }: { label: string, icon: any, onPress: () => void }) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className="bg-surface flex-row items-center justify-between p-5 rounded-2xl border border-divider shadow-sm"
    >
      <View className="flex-row items-center">
        <View className="w-10 h-10 bg-neutral-background rounded-xl items-center justify-center mr-4">
          {icon}
        </View>
        <Text className="text-text-primary font-semibold text-lg">{label}</Text>
      </View>
      <ChevronRight {...({ size: 20, color: "#BDBDBD" } as any)} />
    </TouchableOpacity>
  );
}

function Badge({ icon, label }: { icon: any, label: string }) {
  return (
    <View className="bg-secondary-light/30 flex-row items-center px-3 py-1 rounded-full border border-secondary/20">
      <View className="mr-1">{icon}</View>
      <Text className="text-secondary font-bold text-xs uppercase">{label}</Text>
    </View>
  );
}

