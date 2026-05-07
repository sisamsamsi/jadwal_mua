import React, { useState } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCreateClient } from "@/lib/hooks/use-clients";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ChevronLeft, User, Phone, Mail, MapPin, Tag, FileText } from "lucide-react-native";
import { v4 as uuidv4 } from "uuid";
import { useAuthStore } from "@/lib/stores/auth-store";

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
    city: "",
    skinType: "",
    allergies: "",
    preferences: "",
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
        id: uuidv4(),
        userId: session?.user.id || "",
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        skinType: formData.skinType,
        allergies: formData.allergies,
        preferences: formData.preferences,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createClientMutation.mutateAsync(newClient);
      Alert.alert("Sukses", "Klien berhasil ditambahkan");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Gagal menyimpan klien");
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
        <Text className="text-xl font-bold text-text-primary">Tambah Klien Baru</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text className="text-sm font-bold text-text-hint uppercase mb-4">Informasi Dasar</Text>
        <Input 
          label="Nama Lengkap *" 
          placeholder="Nama klien..."
          value={formData.name} 
          onChangeText={(v) => setFormData(p => ({ ...p, name: v }))}
          leftIcon={<User {...({ size: 18, color: "#BDBDBD" } as any)} />}
        />
        <Input 
          label="Nomor Telepon" 
          placeholder="0812..."
          value={formData.phone} 
          onChangeText={(v) => setFormData(p => ({ ...p, phone: v }))}
          keyboardType="phone-pad"
          leftIcon={<Phone {...({ size: 18, color: "#BDBDBD" } as any)} />}
        />
        <Input 
          label="Email" 
          placeholder="email@contoh.com"
          value={formData.email} 
          onChangeText={(v) => setFormData(p => ({ ...p, email: v }))}
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon={<Mail {...({ size: 18, color: "#BDBDBD" } as any)} />}
        />

        <Text className="text-sm font-bold text-text-hint uppercase mt-4 mb-4">Alamat</Text>
        <Input 
          label="Kota" 
          placeholder="Jakarta, Surabaya, dll"
          value={formData.city} 
          onChangeText={(v) => setFormData(p => ({ ...p, city: v }))}
          leftIcon={<MapPin {...({ size: 18, color: "#BDBDBD" } as any)} />}
        />
        <Input 
          label="Alamat Lengkap" 
          placeholder="Jl. Raya No. 123..."
          value={formData.address} 
          onChangeText={(v) => setFormData(p => ({ ...p, address: v }))}
          multiline
          numberOfLines={3}
          style={{ height: 80 }}
        />

        <Text className="text-sm font-bold text-text-hint uppercase mt-4 mb-4">Catatan Kecantikan</Text>
        <Input 
          label="Tipe Kulit" 
          placeholder="Berminyak, Kering, Kombinasi, dll"
          value={formData.skinType} 
          onChangeText={(v) => setFormData(p => ({ ...p, skinType: v }))}
          leftIcon={<Tag {...({ size: 18, color: "#BDBDBD" } as any)} />}
        />
        <Input 
          label="Alergi Produk" 
          placeholder="Paraben, Alcohol, dll"
          value={formData.allergies} 
          onChangeText={(v) => setFormData(p => ({ ...p, allergies: v }))}
          leftIcon={<FileText {...({ size: 18, color: "#BDBDBD" } as any)} />}
        />
        <Input 
          label="Preferensi / Catatan" 
          placeholder="Suka makeup bold, tidak suka bulu mata tebal, dll"
          value={formData.preferences} 
          onChangeText={(v) => setFormData(p => ({ ...p, preferences: v }))}
          multiline
          numberOfLines={3}
          style={{ height: 80 }}
        />

        <Button 
          variant="primary" 
          label={loading ? "Menyimpan..." : "Simpan Klien"} 
          onPress={handleSave}
          loading={loading}
          className="mt-6 mb-10 h-14"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

