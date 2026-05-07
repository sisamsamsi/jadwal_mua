import React, { useState } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCreateService } from "@/lib/hooks/use-services";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ChevronLeft, Package, Tag, Clock, DollarSign } from "lucide-react-native";
import { v4 as uuidv4 } from "uuid";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function NewService() {
  const router = useRouter();
  const createServiceMutation = useCreateService();
  const session = useAuthStore(s => s.session);

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
        id: uuidv4(),
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
      Alert.alert("Sukses", "Layanan berhasil ditambahkan");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Gagal menyimpan layanan");
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
        <Text className="text-xl font-bold text-text-primary">Tambah Layanan</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Input 
          label="Nama Layanan *" 
          placeholder="Misal: Makeup Wisuda, Bridal Premium"
          value={formData.name} 
          onChangeText={(v) => setFormData(p => ({ ...p, name: v }))}
          leftIcon={<Package {...({ size: 18, color: "#BDBDBD" } as any)} />}
        />
        
        <Input 
          label="Kategori" 
          placeholder="Bridal, Party, Photoshoot, dll"
          value={formData.category} 
          onChangeText={(v) => setFormData(p => ({ ...p, category: v }))}
          leftIcon={<Tag {...({ size: 18, color: "#BDBDBD" } as any)} />}
        />

        <View className="flex-row justify-between">
          <View className="w-[48%]">
            <Input 
              label="Durasi (Menit)" 
              value={formData.durationMinutes} 
              onChangeText={(v) => setFormData(p => ({ ...p, durationMinutes: v }))}
              keyboardType="numeric"
              leftIcon={<Clock {...({ size: 18, color: "#BDBDBD" } as any)} />}
            />
          </View>
          <View className="w-[48%]">
            <Input 
              label="Harga Dasar (Rp) *" 
              value={formData.basePrice} 
              onChangeText={(v) => setFormData(p => ({ ...p, basePrice: v }))}
              keyboardType="numeric"
              leftIcon={<DollarSign {...({ size: 18, color: "#BDBDBD" } as any)} />}
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
          label={loading ? "Menyimpan..." : "Simpan Layanan"} 
          onPress={handleSave}
          loading={loading}
          className="mt-6 h-14"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

