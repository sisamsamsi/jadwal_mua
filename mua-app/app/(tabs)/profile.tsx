import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
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
  Info,
  Link as LinkIcon,
  Copy,
  Share2
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { Share } from "react-native";
import * as Clipboard from "expo-clipboard";
import { APP_CONFIG } from "@/lib/constants/app";

export default function ProfileScreen() {
  const { session } = useAuthStore();
  const router = useRouter();
  const { showInventory, isLicenseActive, businessName } = useSettingsStore();

  const bookingLink = `${APP_CONFIG.PUBLIC_BOOKING_BASE_URL}/${session?.user?.id}`;

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(bookingLink);
    Alert.alert("Berhasil", "Link booking berhasil disalin ke clipboard.");
  };

  const shareLink = async () => {
    try {
      await Share.share({
        message: `Halo! Kamu bisa cek jadwal dan booking rias langsung di sini: ${bookingLink}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await authService.signOut();
    router.replace("/(auth)/login");
  };

  const userEmail = session?.user?.email ?? "MUA Professional";
  const displayName = 
    session?.user?.user_metadata?.full_name ??
    session?.user?.user_metadata?.name ??
    userEmail.split("@")[0];

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
              onPress={() => router.push("/settings")}
            >
              <Settings {...({ size: 18, color: "white" } as any)} />
            </TouchableOpacity>
          </View>
          <Text className="text-2xl font-bold text-text-primary mt-4 capitalize">{displayName}</Text>
          {businessName ? (
            <Text className="text-primary font-bold text-sm italic">"{businessName}"</Text>
          ) : null}
          <Text className="text-text-secondary mt-1">{userEmail}</Text>
          
          <View className="flex-row mt-4 gap-x-2">
            <Badge 
              icon={<Star {...({ size: 12, color: isLicenseActive ? "#D4A574" : "#9CA3AF" } as any)} />} 
              label={isLicenseActive ? "Lisensi Aktif" : "Mode Trial"} 
            />
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

          <SectionTitle title="Link Booking Publik" />
          <Card className="p-4 bg-primary/5 border-dashed border-primary/30 mt-1">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <LinkIcon size={18} color="#B76E79" className="mr-2" />
                <Text className="text-text-primary font-bold">Link Mandiri Klien</Text>
              </View>
              <View className="bg-primary/20 px-2 py-1 rounded">
                <Text className="text-primary text-[10px] font-bold">PRO</Text>
              </View>
            </View>
            <Text className="text-text-secondary text-xs mb-4">
              Bagikan link ini ke Instagram/WA agar klien bisa isi jadwal sendiri tanpa DM.
            </Text>
            <View className="flex-row gap-x-2">
              <TouchableOpacity 
                onPress={copyToClipboard}
                className="flex-1 bg-white border border-divider h-10 rounded-lg flex-row items-center justify-center"
              >
                <Copy size={14} color="#757575" className="mr-2" />
                <Text className="text-text-primary text-xs font-medium">Salin Link</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={shareLink}
                className="flex-1 bg-primary h-10 rounded-lg flex-row items-center justify-center"
              >
                <Share2 size={14} color="white" className="mr-2" />
                <Text className="text-white text-xs font-medium">Bagikan</Text>
              </TouchableOpacity>
            </View>
          </Card>

          <SectionTitle title="Aplikasi" />
          <ProfileLink 
            label="Pengaturan Fitur" 
            icon={<Settings {...({ size: 22, color: "#757575" } as any)} />} 
            onPress={() => router.push("/settings")} 
          />
          <ProfileLink 
            label="Bantuan & Support" 
            icon={<Info {...({ size: 22, color: "#757575" } as any)} />} 
            onPress={() => Alert.alert("Bantuan", "Untuk bantuan, hubungi kami via WhatsApp atau email support yang tertera di kemasan aplikasi.")} 
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

