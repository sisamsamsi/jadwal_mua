import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { ChevronLeft, Users, ShoppingBag, ShieldCheck, Store, Phone } from "lucide-react-native";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function SettingsScreen() {
  const router = useRouter();
  const { 
    showBridalParty, 
    showInventory, 
    isLicenseActive,
    businessName: savedBusinessName,
    whatsappNumber: savedWhatsapp,
    waTemplates,
    toggleBridalParty, 
    toggleInventory,
    updateBusinessProfile,
    updateTemplates
  } = useSettingsStore();

  const [businessName, setBusinessName] = useState(savedBusinessName);
  const [whatsapp, setWhatsapp] = useState(savedWhatsapp);

  const handleSaveProfile = () => {
    updateBusinessProfile(businessName, whatsapp);
    Alert.alert("Berhasil", "Profil bisnis telah diperbarui.");
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
        <Text className="text-text-hint font-bold uppercase text-xs mb-4">Profil Bisnis (Identitas MUA)</Text>
        <Card className="p-4 mb-8">
           <View className="mb-4">
             <Input 
               label="Nama Bisnis / Brand" 
               value={businessName} 
               onChangeText={setBusinessName}
               placeholder="Contoh: Rahayu Makeup Artist"
               leftIcon={<Store size={18} color="#757575" />}
             />
           </View>
           <View className="mb-6">
             <Input 
               label="Nomor WhatsApp Bisnis" 
               value={whatsapp} 
               onChangeText={setWhatsapp}
               placeholder="0812xxxxxx"
               keyboardType="phone-pad"
               leftIcon={<Phone size={18} color="#757575" />}
             />
           </View>
           <Button 
             label="Simpan Profil" 
             onPress={handleSaveProfile}
             className="h-12 rounded-xl"
           />
        </Card>

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
              value={waTemplates.confirmation} 
              onChangeText={(t) => updateTemplates({ confirmation: t })}
              multiline
              numberOfLines={3}
            />
          </View>
          <View className="mb-4">
            <Input 
              label="Pesan Pengingat (Reminder)" 
              value={waTemplates.reminder} 
              onChangeText={(t) => updateTemplates({ reminder: t })}
              multiline
              numberOfLines={3}
            />
          </View>
          <View className="mb-6">
            <Input 
              label="Pesan Ucapan Terima Kasih" 
              value={waTemplates.thanks} 
              onChangeText={(t) => updateTemplates({ thanks: t })}
              multiline
              numberOfLines={3}
            />
          </View>
          <Text className="text-text-hint text-[10px] italic text-center">
            * Perubahan otomatis tersimpan
          </Text>
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
