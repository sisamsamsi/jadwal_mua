import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, Linking, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform } from "react-native";
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
  Share2,
  Plus,
  Store,
  Phone
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { Share } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { APP_CONFIG } from "@/lib/constants/app";
import { useProfile, useUpdateProfile } from "@/lib/hooks/use-profile";
import { storageService } from "@/lib/supabase/storage";
import { Buckets } from "@/lib/constants/supabase";
import { Image } from "react-native";
import { useAlertStore } from "@/lib/stores/alert-store";
import { PremiumGate } from "@/components/ui/PremiumGate";
import { useSubscription } from "@/lib/hooks/use-subscription";

export default function ProfileScreen() {
  const { session } = useAuthStore();
  const router = useRouter();
  const { showInventory, businessName } = useSettingsStore();
  const { data: profile } = useProfile();
  const { isPremium } = useSubscription();
  const updateProfileMutation = useUpdateProfile();
  const [uploading, setUploading] = React.useState(false);
  const { showAlert } = useAlertStore();
  const { whatsappNumber, updateBusinessProfile } = useSettingsStore();

  const [isEditModalVisible, setIsEditModalVisible] = React.useState(false);
  const [editFullName, setEditFullName] = React.useState("");
  const [editBusinessName, setEditBusinessName] = React.useState("");
  const [editWhatsappNumber, setEditWhatsappNumber] = React.useState("");
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);

  const [stablePhotoUri, setStablePhotoUri] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (profile?.profilePhotoUrl) {
      setStablePhotoUri(`${profile.profilePhotoUrl}?t=${Date.now()}`);
    } else {
      setStablePhotoUri(null);
    }
  }, [profile?.profilePhotoUrl]);

  React.useEffect(() => {
    console.log("DEBUG: profile data =", JSON.stringify(profile));
  }, [profile]);

  const handleOpenEditModal = () => {
    setEditFullName(profile?.fullName || displayName);
    setEditBusinessName(profile?.businessName || businessName || "");
    setEditWhatsappNumber(profile?.whatsappNumber || whatsappNumber || "");
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!session?.user?.id) return;
    setIsSavingProfile(false);
    setIsSavingProfile(true);
    try {
      updateBusinessProfile(editBusinessName, editWhatsappNumber);
      
      await updateProfileMutation.mutateAsync({
        fullName: editFullName,
        businessName: editBusinessName,
        whatsappNumber: editWhatsappNumber,
        email: session.user.email || ""
      });
      
      setIsEditModalVisible(false);
      showAlert("Berhasil", "Profil bisnis Anda telah diperbarui.");
    } catch (err: any) {
      showAlert("Error", "Gagal menyimpan profil: " + (err?.message || err));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const bookingLink = `${APP_CONFIG.PUBLIC_BOOKING_BASE_URL}/${session?.user?.id}`;

  React.useEffect(() => {
    if (profile?.profilePhotoUrl) {
      console.log("Photo URL:", profile.profilePhotoUrl);
    }
  }, [profile?.profilePhotoUrl]);

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(bookingLink);
    showAlert("Berhasil Salin", "Link booking Anda telah disalin. Sekarang Anda bisa menempelkannya di bio Instagram atau pesan WhatsApp.");
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

  const handlePickImage = async () => {
    Alert.alert("Debug [1/4]", "Membuka galeri foto...");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      Alert.alert("Debug [2/4]", "Foto terpilih, memulai upload...");
      uploadPhoto(result.assets[0].uri);
    } else {
      Alert.alert("Debug", "Pemilihan foto dibatalkan.");
    }
  };

  const uploadPhoto = async (uri: string) => {
    setUploading(true);
    try {
      const fileName = `${session?.user?.id}/${Date.now()}.jpg`;
      Alert.alert("Debug [3/4]", "Mengunggah file ke Supabase Storage...");
      const publicUrl = await storageService.uploadFile(Buckets.profilePhotos, fileName, uri);
      
      Alert.alert("Debug [4/4]", "Menyinkronkan URL ke database: " + publicUrl);
      await updateProfileMutation.mutateAsync({
        profilePhotoUrl: publicUrl,
        email: session?.user?.email || ""
      });
      
      showAlert("Upload Berhasil", "Foto profil Anda telah diperbarui dengan sukses.");
    } catch (error) {
      console.error(error);
      showAlert("Error", "Gagal mengunggah foto profil. Silakan coba lagi.");
    } finally {
      setUploading(false);
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
          <TouchableOpacity onPress={handlePickImage} disabled={uploading} className="relative">
            <View className="w-32 h-32 rounded-full bg-primary-light/30 border-4 border-surface items-center justify-center overflow-hidden">
              {stablePhotoUri ? (
                <Image 
                  source={{ uri: stablePhotoUri }} 
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <User {...({ size: 60, color: "#B76E79" } as any)} />
              )}
              {uploading && (
                <View className="absolute inset-0 bg-black/30 items-center justify-center">
                  <ActivityIndicator color="white" />
                </View>
              )}
            </View>
            <View 
              className="absolute bottom-0 right-0 bg-primary w-10 h-10 rounded-full border-4 border-surface items-center justify-center"
            >
              <Plus {...({ size: 18, color: "white" } as any)} />
            </View>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-text-primary mt-4 capitalize">{displayName}</Text>
          {businessName ? (
            <Text className="text-primary font-bold text-sm italic">"{businessName}"</Text>
          ) : null}
          <Text className="text-text-secondary mt-1">{userEmail}</Text>
          
          <View className="flex-row mt-4 gap-x-2">
            <Badge 
              icon={<Star {...({ size: 12, color: isPremium ? "#D4A574" : "#9CA3AF" } as any)} />} 
              label={isPremium ? "Lisensi Aktif" : "Mode Trial"} 
            />
          </View>

          <TouchableOpacity 
            onPress={handleOpenEditModal}
            activeOpacity={0.7}
            className="mt-4 flex-row items-center bg-primary/10 px-4 py-2 rounded-full border border-primary/20"
          >
            <Settings size={13} color="#B76E79" className="mr-1.5" />
            <Text className="text-primary font-bold text-xs">Edit Profil Rias</Text>
          </TouchableOpacity>
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
          <PremiumGate featureName="Web Booking Link" showOverlay>
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
          </PremiumGate>
          {!profile?.whatsappNumber && (
            <TouchableOpacity 
              onPress={handleOpenEditModal}
              activeOpacity={0.8}
              className="flex-row items-start bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-2 shadow-sm"
            >
              <Text className="text-amber-700 text-xs leading-5">
                ⚠️ <Text className="font-bold">WhatsApp Bisnis Belum Diatur!</Text> Klien tidak akan bisa mengirimkan bukti booking ke Anda. Ketuk di sini untuk mengaturnya sekarang.
              </Text>
            </TouchableOpacity>
          )}
          {!APP_CONFIG.IS_WEB_APP_DEPLOYED && (
            <View className="flex-row items-start bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-1">
              <Text className="text-amber-600 text-xs leading-5">
                ⚠️ <Text className="font-bold">Domain belum aktif.</Text> Link ini bisa dibagikan setelah web app dideploy. Form booking sudah bisa ditest secara langsung.
              </Text>
            </View>
          )}

          <SectionTitle title="Aplikasi" />
          <ProfileLink 
            label="Pengaturan Fitur" 
            icon={<Settings {...({ size: 22, color: "#757575" } as any)} />} 
            onPress={() => router.push("/settings")} 
          />
          <ProfileLink 
            label="Bantuan & Support" 
            icon={<Info {...({ size: 22, color: "#757575" } as any)} />} 
            onPress={() => {
              const waUrl = `whatsapp://send?phone=${APP_CONFIG.SUPPORT_WHATSAPP}&text=Halo, saya butuh bantuan dengan MUA App.`;
              Linking.openURL(waUrl).catch(() => 
                Alert.alert("WhatsApp tidak tersedia", "Pastikan WhatsApp terinstal di perangkat Anda.")
              );
            }} 
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

        <Text className="text-center text-text-hint mt-10 mb-6">MUA App v{APP_CONFIG.VERSION}</Text>
      </ScrollView>

      {/* Modal Edit Profil */}
      <Modal
        visible={isEditModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-center items-center bg-black/60 p-6"
        >
          <View className="bg-surface rounded-[28px] p-6 shadow-2xl border border-divider w-full max-h-[85%]">
            {/* Header Modal */}
            <View className="flex-row justify-between items-center mb-6 pb-4 border-b border-divider">
              <Text className="text-xl font-bold text-text-primary">Edit Profil Rias</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)} className="p-1">
                <Text className="text-text-hint font-semibold text-sm">Batal</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {/* Input Nama Owner */}
              <View className="gap-y-1.5 mb-4">
                <Text className="text-text-secondary font-bold text-xs uppercase tracking-wider">Nama Lengkap Owner</Text>
                <View className="flex-row items-center border border-divider rounded-xl px-3 bg-neutral-background h-12">
                  <User size={18} color="#757575" className="mr-2.5" />
                  <TextInput
                    value={editFullName}
                    onChangeText={setEditFullName}
                    placeholder="Contoh: Rahayu Wardani"
                    className="flex-1 text-text-primary text-sm font-medium"
                    placeholderTextColor="#9E9E9E"
                  />
                </View>
              </View>

              {/* Input Brand Bisnis */}
              <View className="gap-y-1.5 mb-4">
                <Text className="text-text-secondary font-bold text-xs uppercase tracking-wider">Nama Bisnis / Brand MUA</Text>
                <View className="flex-row items-center border border-divider rounded-xl px-3 bg-neutral-background h-12">
                  <Store size={18} color="#757575" className="mr-2.5" />
                  <TextInput
                    value={editBusinessName}
                    onChangeText={setEditBusinessName}
                    placeholder="Contoh: Rahayu Makeup Artist"
                    className="flex-1 text-text-primary text-sm font-medium"
                    placeholderTextColor="#9E9E9E"
                  />
                </View>
              </View>

              {/* Input Nomor WA */}
              <View className="gap-y-1.5 mb-4">
                <Text className="text-text-secondary font-bold text-xs uppercase tracking-wider">Nomor WhatsApp Bisnis</Text>
                <View className="flex-row items-center border border-divider rounded-xl px-3 bg-neutral-background h-12">
                  <Phone size={18} color="#757575" className="mr-2.5" />
                  <TextInput
                    value={editWhatsappNumber}
                    onChangeText={setEditWhatsappNumber}
                    placeholder="Contoh: 0812xxxxxx"
                    keyboardType="phone-pad"
                    className="flex-1 text-text-primary text-sm font-medium"
                    placeholderTextColor="#9E9E9E"
                  />
                </View>
              </View>
              
              <View className="bg-primary/5 p-3 rounded-lg border border-primary/10 mt-2">
                <Text className="text-[10px] text-primary italic leading-4">
                  * Informasi ini akan ditampilkan di Bio Profil Anda dan digunakan oleh sistem untuk notifikasi WhatsApp.
                </Text>
              </View>
            </ScrollView>

            {/* Simpan Button */}
            <Button
              label={isSavingProfile ? "Menyimpan..." : "Simpan Perubahan"}
              disabled={isSavingProfile}
              onPress={handleSaveProfile}
              className="h-12 rounded-xl mt-4 bg-primary"
              textClassName="text-white font-bold"
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

