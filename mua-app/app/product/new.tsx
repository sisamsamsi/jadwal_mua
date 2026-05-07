import React, { useState } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCreateProduct } from "@/lib/hooks/use-products";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ChevronLeft, ShoppingBag, Tag, Box, DollarSign, Calendar } from "lucide-react-native";
import { v4 as uuidv4 } from "uuid";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function NewProduct() {
  const router = useRouter();
  const createProductMutation = useCreateProduct();
  const session = useAuthStore(s => s.session);

  const [loading, setLoading] = useState(false);
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

  const handleSave = async () => {
    if (!formData.name || !formData.category) {
      Alert.alert("Error", "Nama dan kategori produk wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const newProduct = {
        id: uuidv4(),
        userId: session?.user.id || "",
        name: formData.name,
        brand: formData.brand,
        category: formData.category,
        currentStock: parseInt(formData.currentStock),
        minimumStock: parseInt(formData.minimumStock),
        purchasePrice: parseFloat(formData.purchasePrice),
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
      Alert.alert("Error", "Gagal menyimpan produk");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-6 py-4 border-b border-divider bg-surface">
        <Button variant="ghost" size="icon" onPress={() => router.back()} className="mr-2">
          <ChevronLeft {...({ size: 24, color: "#2D2D2D" } as any)} />
        </Button>
        <Text className="text-xl font-bold text-text-primary">Tambah Produk</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Input 
          label="Nama Produk *" 
          placeholder="Misal: L'Oreal True Match Foundation"
          value={formData.name} 
          onChangeText={(v) => setFormData(p => ({ ...p, name: v }))}
          leftIcon={<ShoppingBag {...({ size: 18, color: "#BDBDBD" } as any)} />}
        />
        <Input 
          label="Brand" 
          placeholder="L'Oreal, MAC, Maybelline, dll"
          value={formData.brand} 
          onChangeText={(v) => setFormData(p => ({ ...p, brand: v }))}
          leftIcon={<Tag {...({ size: 18, color: "#BDBDBD" } as any)} />}
        />
        <Input 
          label="Kategori" 
          placeholder="Foundation, Lipstick, Eyeshadow, dll"
          value={formData.category} 
          onChangeText={(v) => setFormData(p => ({ ...p, category: v }))}
          leftIcon={<Tag {...({ size: 18, color: "#BDBDBD" } as any)} />}
        />

        <View className="flex-row justify-between">
          <View className="w-[48%]">
            <Input 
              label="Stok Saat Ini" 
              value={formData.currentStock} 
              onChangeText={(v) => setFormData(p => ({ ...p, currentStock: v }))}
              keyboardType="numeric"
              leftIcon={<Box {...({ size: 18, color: "#BDBDBD" } as any)} />}
            />
          </View>
          <View className="w-[48%]">
            <Input 
              label="Stok Minimum" 
              value={formData.minimumStock} 
              onChangeText={(v) => setFormData(p => ({ ...p, minimumStock: v }))}
              keyboardType="numeric"
              leftIcon={<Box {...({ size: 18, color: "#BDBDBD" } as any)} />}
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
              leftIcon={<DollarSign {...({ size: 18, color: "#BDBDBD" } as any)} />}
            />
          </View>
          <View className="w-[48%]">
            <Input 
              label="Tgl Kedaluwarsa" 
              placeholder="YYYY-MM-DD"
              value={formData.expiryDate} 
              onChangeText={(v) => setFormData(p => ({ ...p, expiryDate: v }))}
              leftIcon={<Calendar {...({ size: 18, color: "#BDBDBD" } as any)} />}
            />
          </View>
        </View>

        <Input 
          label="Catatan" 
          placeholder="Shade, nomor seri, dll"
          value={formData.notes} 
          onChangeText={(v) => setFormData(p => ({ ...p, notes: v }))}
          multiline
          numberOfLines={3}
          style={{ height: 80 }}
        />

        <Button 
          variant="primary" 
          label={loading ? "Menyimpan..." : "Simpan Produk"} 
          onPress={handleSave}
          loading={loading}
          className="mt-6 h-14"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

