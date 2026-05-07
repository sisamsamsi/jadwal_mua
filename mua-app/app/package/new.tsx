import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePackages } from "@/lib/hooks/use-packages";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ChevronLeft, Gift, Tag, DollarSign, FileText } from "lucide-react-native";

export default function NewPackageScreen() {
  const router = useRouter();
  const { createPackage, isCreating } = usePackages();

  const [formData, setFormData] = useState({
    name: "",
    totalPrice: "",
    description: "",
  });

  const handleSave = async () => {
    if (!formData.name || !formData.totalPrice) {
      Alert.alert("Error", "Nama paket dan harga wajib diisi");
      return;
    }

    try {
      await createPackage({
        name: formData.name,
        totalPrice: parseFloat(formData.totalPrice),
        description: formData.description,
        isActive: true,
      });
      Alert.alert("Sukses", "Paket layanan berhasil dibuat");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Gagal membuat paket");
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      
      <SafeAreaView className="bg-surface border-b border-divider">
        <View className="flex-row items-center px-6 py-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2">
            <ChevronLeft size={24} color="#2D2D2D" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-text-primary">Tambah Paket</Text>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-secondary-light/20 rounded-full items-center justify-center mb-2">
              <Gift size={40} color="#D4A574" />
            </View>
            <Text className="text-text-secondary">Buat paket layanan untuk booking yang lebih cepat</Text>
          </View>

          <Input 
            label="Nama Paket" 
            placeholder="Contoh: Wedding Gold"
            value={formData.name} 
            onChangeText={(v) => setFormData(p => ({ ...p, name: v }))}
            leftIcon={<Tag size={18} color="#BDBDBD" />}
          />

          <Input 
            label="Harga Paket (Rp)" 
            placeholder="0"
            value={formData.totalPrice} 
            onChangeText={(v) => setFormData(p => ({ ...p, totalPrice: v }))}
            keyboardType="numeric"
            leftIcon={<DollarSign size={18} color="#BDBDBD" />}
          />

          <Input 
            label="Deskripsi Paket" 
            placeholder="Apa saja yang didapat klien?"
            value={formData.description} 
            onChangeText={(v) => setFormData(p => ({ ...p, description: v }))}
            multiline
            numberOfLines={4}
            style={{ height: 100 }}
            leftIcon={<FileText size={18} color="#BDBDBD" />}
          />

          <Button 
            variant="primary" 
            label="Simpan Paket" 
            onPress={handleSave}
            className="mt-8 h-14 rounded-2xl"
            loading={isCreating}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
