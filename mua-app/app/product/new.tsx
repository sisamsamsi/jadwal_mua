import React, { useState } from "react";
import { View, Text, ScrollView, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCreateProduct } from "@/lib/hooks/use-products";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ChevronLeft, ShoppingBag, Tag, Box, DollarSign, Calendar as CalendarIcon } from "lucide-react-native";
import * as Crypto from "expo-crypto";
import { useAuthStore } from "@/lib/stores/auth-store";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { format } from "date-fns";

export default function NewProduct() {
  const router = useRouter();
  const createProductMutation = useCreateProduct();
  const session = useAuthStore(s => s.session);

  const [loading, setLoading] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "Foundation",
    currentStock: "0",
    minimumStock: "1",
    purchasePrice: "0",
    expiryDate: "",
    notes: "",
  });

  const handleConfirmDate = (date: Date) => {
    setFormData(prev => ({ ...prev, expiryDate: format(date, "yyyy-MM-dd") }));
    setDatePickerVisibility(false);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.category) {
      Alert.alert("Error", "Nama dan kategori produk wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const newProduct = {
        id: Crypto.randomUUID(),
        userId: session?.user.id || "",
        name: formData.name,
        brand: formData.brand,
        category: formData.category,
        currentStock: parseInt(formData.currentStock || "0"),
        minimumStock: parseInt(formData.minimumStock || "0"),
        purchasePrice: parseFloat(formData.purchasePrice || "0"),
        expiryDate: formData.expiryDate,
        notes: formData.notes,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createProductMutation.mutateAsync(newProduct);
      Alert.alert("Sukses", "Produk berhasil ditambahkan");
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal menyimpan produk");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
      >
        <View className="flex-row items-center px-6 py-4 border-b border-divider bg-surface">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2">
            <ChevronLeft size={24} color="#2D2D2D" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-text-primary">Tambah Produk</Text>
        </View>

        <ScrollView 
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          <Input 
            label="Nama Produk *" 
            placeholder="Misal: Foundation L'Oreal"
            value={formData.name} 
            onChangeText={(v) => setFormData(p => ({ ...p, name: v }))}
            leftIcon={<ShoppingBag size={18} color="#BDBDBD" />}
          />
          <Input 
            label="Brand" 
            placeholder="L'Oreal, MAC, dll"
            value={formData.brand} 
            onChangeText={(v) => setFormData(p => ({ ...p, brand: v }))}
            leftIcon={<Tag size={18} color="#BDBDBD" />}
          />
          <Input 
            label="Kategori" 
            placeholder="Foundation, Lipstick, dll"
            value={formData.category} 
            onChangeText={(v) => setFormData(p => ({ ...p, category: v }))}
            leftIcon={<Tag size={18} color="#BDBDBD" />}
          />

          <View className="flex-row justify-between">
            <View className="w-[48%]">
              <Input 
                label="Stok Saat Ini" 
                value={formData.currentStock} 
                onChangeText={(v) => setFormData(p => ({ ...p, currentStock: v }))}
                keyboardType="numeric"
                leftIcon={<Box size={18} color="#BDBDBD" />}
              />
            </View>
            <View className="w-[48%]">
              <Input 
                label="Stok Minimum" 
                value={formData.minimumStock} 
                onChangeText={(v) => setFormData(p => ({ ...p, minimumStock: v }))}
                keyboardType="numeric"
                leftIcon={<Box size={18} color="#BDBDBD" />}
              />
            </View>
          </View>

          <View className="flex-row justify-between">
            <View className="w-[48%]">
              <Input 
                label="Harga Beli (Rp)" 
                value={formData.purchasePrice} 
                onChangeText={(v) => setFormData(p => ({ ...p, purchasePrice: v }))}
                keyboardType="numeric"
                leftIcon={<DollarSign size={18} color="#BDBDBD" />}
              />
            </View>
            <View className="w-[48%]">
              <TouchableOpacity onPress={() => setDatePickerVisibility(true)}>
                <View pointerEvents="none">
                  <Input 
                    label="Tgl Kedaluwarsa" 
                    placeholder="YYYY-MM-DD"
                    value={formData.expiryDate} 
                    editable={false}
                    leftIcon={<CalendarIcon size={18} color="#BDBDBD" />}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={handleConfirmDate}
            onCancel={() => setDatePickerVisibility(false)}
            date={formData.expiryDate ? new Date(formData.expiryDate) : new Date()}
          />

          <Input 
            label="Catatan" 
            placeholder="Shade, detail lainnya..."
            value={formData.notes} 
            onChangeText={(v) => setFormData(p => ({ ...p, notes: v }))}
            multiline
            numberOfLines={3}
            style={{ height: 80 }}
          />

          <Button 
            variant="primary" 
            label="Simpan Produk" 
            onPress={handleSave}
            loading={loading}
            className="mt-6 mb-10 h-14 rounded-2xl"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
