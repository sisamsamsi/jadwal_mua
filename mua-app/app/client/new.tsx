import React, { useState } from "react";
import { View, Text, ScrollView, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ChevronLeft, User, Phone, Mail, MapPin, Notebook as Note } from "lucide-react-native";
import { useCreateClient } from "@/lib/hooks/use-clients";
import { useAuthStore } from "@/lib/stores/auth-store";
import * as Crypto from "expo-crypto";

export default function NewClient() {
  const router = useRouter();
  const createClientMutation = useCreateClient();
  const session = useAuthStore(s => s.session);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  const handleSave = async () => {
    if (!formData.name) {
      Alert.alert("Error", "Nama klien wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const newClient = {
        id: Crypto.randomUUID(),
        userId: session?.user.id || "",
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createClientMutation.mutateAsync(newClient);
      Alert.alert("Sukses", "Klien berhasil ditambahkan");
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal menyimpan klien");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View className="flex-row items-center px-6 py-4 border-b border-divider bg-surface">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2">
            <ChevronLeft size={24} color="#2D2D2D" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-text-primary">Tambah Klien</Text>
        </View>

        <ScrollView 
          contentContainerStyle={{ padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <Input 
            label="Nama Lengkap *" 
            placeholder="Masukkan nama klien"
            value={formData.name}
            onChangeText={(v) => setFormData(p => ({ ...p, name: v }))}
            leftIcon={<User size={18} color="#BDBDBD" />}
          />

          <Input 
            label="Nomor WhatsApp" 
            placeholder="Contoh: 628123456789 (Tanpa angka 0)"
            value={formData.phone}
            onChangeText={(v) => {
              let cleaned = v.replace(/\D/g, "");
              if (cleaned.startsWith("0")) {
                cleaned = "62" + cleaned.slice(1);
              }
              setFormData(p => ({ ...p, phone: cleaned }));
            }}
            keyboardType="phone-pad"
            leftIcon={<Phone size={18} color="#BDBDBD" />}
          />
          <Text className="text-text-hint text-[10px] mt-[-12] mb-4 ml-1">
            Format wajib: 628... (Diawali 62, jangan dimulai dengan angka 0).
          </Text>

          <Input 
            label="Email" 
            placeholder="klien@email.com"
            value={formData.email}
            onChangeText={(v) => setFormData(p => ({ ...p, email: v }))}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail size={18} color="#BDBDBD" />}
          />

          <Input 
            label="Alamat" 
            placeholder="Alamat lengkap klien..."
            value={formData.address}
            onChangeText={(v) => setFormData(p => ({ ...p, address: v }))}
            multiline
            numberOfLines={2}
            style={{ height: 60 }}
            leftIcon={<MapPin size={18} color="#BDBDBD" />}
          />

          <Input 
            label="Catatan" 
            placeholder="Misal: Alergi kosmetik tertentu, gaya favorit"
            value={formData.notes}
            onChangeText={(v) => setFormData(p => ({ ...p, notes: v }))}
            multiline
            numberOfLines={3}
            style={{ height: 80 }}
            leftIcon={<Note size={18} color="#BDBDBD" />}
          />

          <Button 
            variant="primary" 
            label="Simpan Klien" 
            onPress={handleSave}
            loading={loading}
            className="mt-6 h-14 rounded-2xl"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
