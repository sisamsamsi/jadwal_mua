import React, { useState } from "react";
import { View, Text, ScrollView, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCreateService } from "@/lib/hooks/use-services";
import { useAlertStore } from "@/lib/stores/alert-store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ChevronLeft, Package, Tag, Clock, DollarSign } from "lucide-react-native";
import * as Crypto from "expo-crypto";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function NewService() {
  const router = useRouter();
  const createServiceMutation = useCreateService();
  const session = useAuthStore(s => s.session);
  const { showAlert } = useAlertStore();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "Bridal",
    description: "",
    durationMinutes: "60",
    basePrice: "0",
  });

  const handleSave = async () => {
    if (!formData.name || !formData.basePrice) {
      Alert.alert("Error", "Nama dan harga layanan wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const newService = {
        id: Crypto.randomUUID(),
        userId: session?.user.id || "",
        name: formData.name,
        category: formData.category,
        description: formData.description,
        durationMinutes: parseInt(formData.durationMinutes),
        basePrice: parseFloat(formData.basePrice),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createServiceMutation.mutateAsync(newService);
      showAlert("Sukses", "Layanan '" + formData.name + "' berhasil ditambahkan ke daftar Anda.");
      router.back();
    } catch (error) {
      console.error(error);
      showAlert("Gagal Simpan", "Terjadi kesalahan saat menyimpan layanan. Mohon periksa koneksi internet Anda.");
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
          <Text className="text-xl font-bold text-text-primary">Tambah Layanan</Text>
        </View>

        <ScrollView 
          contentContainerStyle={{ padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <Input 
            label="Nama Layanan *" 
            placeholder="Misal: Makeup Wisuda, Bridal Premium"
            value={formData.name} 
            onChangeText={(v) => setFormData(p => ({ ...p, name: v }))}
            leftIcon={<Package size={18} color="#BDBDBD" />}
          />
          
          <Input 
            label="Kategori" 
            placeholder="Bridal, Party, Photoshoot, dll"
            value={formData.category} 
            onChangeText={(v) => setFormData(p => ({ ...p, category: v }))}
            leftIcon={<Tag size={18} color="#BDBDBD" />}
          />

          <View className="flex-row justify-between">
            <View className="w-[48%]">
              <Input 
                label="Durasi (Menit)" 
                value={formData.durationMinutes} 
                onChangeText={(v) => setFormData(p => ({ ...p, durationMinutes: v }))}
                keyboardType="numeric"
                leftIcon={<Clock size={18} color="#BDBDBD" />}
              />
            </View>
            <View className="w-[48%]">
              <Input 
                label="Harga Dasar (Rp) *" 
                value={formData.basePrice} 
                onChangeText={(v) => setFormData(p => ({ ...p, basePrice: v }))}
                keyboardType="numeric"
                leftIcon={<DollarSign size={18} color="#BDBDBD" />}
              />
            </View>
          </View>

          <Input 
            label="Deskripsi" 
            placeholder="Jelaskan detail layanan ini..."
            value={formData.description} 
            onChangeText={(v) => setFormData(p => ({ ...p, description: v }))}
            multiline
            numberOfLines={4}
            style={{ height: 100 }}
          />

          <Button 
            variant="primary" 
            label="Simpan Layanan" 
            onPress={handleSave}
            loading={loading}
            className="mt-6 mb-10 h-14 rounded-2xl"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
