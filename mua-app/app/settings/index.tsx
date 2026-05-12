import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch } from "react-native";
import { showAlert } from "@/lib/utils/alert";

import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { ChevronLeft, Users, ShoppingBag, ShieldCheck, Store, Phone } from "lucide-react-native";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { APP_CONFIG } from "@/lib/constants/app";

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
    updateTemplates,
    paymentInstructions: savedPaymentInstructions,
    setPaymentInstructions
  } = useSettingsStore();

  const [businessName, setBusinessName] = useState(savedBusinessName);
  const [whatsapp, setWhatsapp] = useState(savedWhatsapp);
  const [localPaymentInstructions, setLocalPaymentInstructions] = useState(savedPaymentInstructions);
  
  // Local state for templates to avoid auto-saving while typing
  const [localTemplates, setLocalTemplates] = useState(waTemplates);

  const handleSaveProfile = () => {
    updateBusinessProfile(businessName, whatsapp);
    showAlert("Berhasil", "Profil bisnis telah diperbarui.");
  };


  const handleSaveTemplates = () => {
    updateTemplates(localTemplates);
    showAlert("Berhasil", "Template WhatsApp telah disimpan.");
  };


  const handleSavePaymentInstructions = () => {
    setPaymentInstructions(localPaymentInstructions);
    showAlert("Berhasil", "Instruksi pembayaran telah disimpan.");
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
              value={localTemplates.confirmation} 
              onChangeText={(t) => setLocalTemplates({ ...localTemplates, confirmation: t })}
              multiline
              numberOfLines={3}
            />
          </View>
          <View className="mb-4">
            <Input 
              label="Pesan Pengingat (Reminder)" 
              value={localTemplates.reminder} 
              onChangeText={(t) => setLocalTemplates({ ...localTemplates, reminder: t })}
              multiline
              numberOfLines={3}
            />
          </View>
          <View className="mb-6">
            <Input 
              label="Pesan Ucapan Terima Kasih" 
              value={localTemplates.thanks} 
              onChangeText={(t) => setLocalTemplates({ ...localTemplates, thanks: t })}
              multiline
              numberOfLines={3}
            />
          </View>
          <Button 
             label="Simpan Template" 
             onPress={handleSaveTemplates}
             variant="outline"
             className="h-12 rounded-xl"
           />
        </Card>

        <Text className="text-text-hint font-bold uppercase text-xs mb-4">Instruksi Pembayaran (Muncul di Invoice)</Text>
        <Card className="p-4 mb-8">
           <View className="mb-4">
             <Input 
               label="Nomor Rekening / E-Wallet" 
               value={localPaymentInstructions} 
               onChangeText={setLocalPaymentInstructions}
               placeholder="Contoh: BCA 123456 a/n MUA Name"
               multiline
               numberOfLines={4}
             />
           </View>
           <Button 
              label="Simpan Instruksi" 
              onPress={handleSavePaymentInstructions}
              variant="outline"
              className="h-12 rounded-xl"
            />
        </Card>

        <Text className="text-text-hint font-bold uppercase text-xs mb-4">Keamanan & Lisensi</Text>
        <Card className="p-4 bg-primary/5 border-primary/20 mb-8">
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

        <Text className="text-text-hint font-bold uppercase text-xs mb-4">Pusat Bantuan & Panduan</Text>
        <Card className="mb-10 overflow-hidden">
          <TouchableOpacity 
            onPress={() => showAlert("Panduan AI", "1. Copy pesan booking dari WhatsApp klien.\n2. Buka 'Booking Baru' > klik 'Asisten AI'.\n3. Paste pesan dan klik 'Proses'.\n4. Data akan terisi otomatis!")}
            className="flex-row items-center justify-between p-4 border-b border-divider"

          >
            <View className="flex-row items-center">
              <Text className="text-text-primary font-medium">Cara Menggunakan Asisten AI</Text>
            </View>
            <ChevronLeft size={20} color="#BDBDBD" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => showAlert("Panduan Booking", "Tipe Acara (Akad/Resepsi) digunakan untuk pengelompokan di kalender. Layanan digunakan untuk hitungan harga. Gunakan fitur 'Otomatis' dengan memilih layanan terlebih dahulu.")}
            className="flex-row items-center justify-between p-4 border-b border-divider"

          >
            <View className="flex-row items-center">
              <Text className="text-text-primary font-medium">Panduan Kelola Jadwal</Text>
            </View>
            <ChevronLeft size={20} color="#BDBDBD" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => showAlert("Link Booking Publik", "Kirimkan link yang ada di profil Anda ke klien (Bio IG/WA). Klien bisa mengisi data sendiri dan akan muncul di jadwal Anda sebagai 'Pending'.")}
            className="flex-row items-center justify-between p-4"

          >
            <View className="flex-row items-center">
              <Text className="text-text-primary font-medium">Cara Booking Mandiri oleh Klien</Text>
            </View>
            <ChevronLeft size={20} color="#BDBDBD" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        </Card>

        <Text className="text-center text-text-hint mt-10 text-xs">MUA App v{APP_CONFIG.VERSION}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

