import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePackages, usePackage } from "@/lib/hooks/use-packages";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ChevronLeft, Trash2, Tag, DollarSign, FileText, Gift } from "lucide-react-native";
import { formatCurrency } from "@/lib/utils/currency";

export default function PackageDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const { data: pkg, isLoading } = usePackage(id as string);
  const { updatePackage, deletePackage, isUpdating } = usePackages();

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    totalPrice: "",
    description: "",
  });

  React.useEffect(() => {
    if (pkg) {
      setFormData({
        name: pkg.name || "",
        totalPrice: String(pkg.totalPrice || ""),
        description: pkg.description || "",
      });
    }
  }, [pkg]);

  const handleDelete = () => {
    Alert.alert("Hapus Paket", "Yakin ingin menghapus paket ini?", [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: async () => {
        try {
          await deletePackage(id as string);
          Alert.alert("Sukses", "Paket telah dihapus");
          router.back();
        } catch (error) {
          Alert.alert("Error", "Gagal menghapus paket");
        }
      }}
    ]);
  };

  const handleUpdate = async () => {
    try {
      await updatePackage({
        id: id as string,
        updates: {
          name: formData.name,
          totalPrice: parseFloat(formData.totalPrice),
          description: formData.description,
        }
      });
      Alert.alert("Sukses", "Paket berhasil diperbarui");
      setEditMode(false);
    } catch (error) {
      Alert.alert("Error", "Gagal memperbarui paket");
    }
  };

  if (isLoading) return null;
  if (!pkg) return (
    <SafeAreaView className="flex-1 items-center justify-center">
      <Text className="text-text-hint">Paket tidak ditemukan...</Text>
      <Button label="Kembali" onPress={() => router.back()} className="mt-4" />
    </SafeAreaView>
  );

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      
      <SafeAreaView className="bg-surface border-b border-divider">
        <View className="flex-row items-center justify-between px-6 py-4">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2">
              <ChevronLeft size={24} color="#2D2D2D" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-text-primary">Detail Paket</Text>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity onPress={handleDelete} className="mr-4 p-2">
              <Trash2 size={22} color="#F44336" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditMode(!editMode)} className="p-2">
              <Text className="text-primary font-bold">{editMode ? "Batal" : "Edit"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          {editMode ? (
            <View>
              <Input label="Nama Paket" value={formData.name} onChangeText={(v) => setFormData(p => ({ ...p, name: v }))} leftIcon={<Tag size={18} color="#BDBDBD" />} />
              <Input label="Harga Paket (Rp)" value={formData.totalPrice} onChangeText={(v) => setFormData(p => ({ ...p, totalPrice: v }))} keyboardType="numeric" leftIcon={<DollarSign size={18} color="#BDBDBD" />} />
              <Input label="Deskripsi" value={formData.description} onChangeText={(v) => setFormData(p => ({ ...p, description: v }))} multiline numberOfLines={4} style={{ height: 100 }} leftIcon={<FileText size={18} color="#BDBDBD" />} />
              <Button variant="primary" label="Simpan Perubahan" onPress={handleUpdate} className="mt-6 h-14 rounded-2xl" loading={isUpdating} />
            </View>
          ) : (
            <View>
               <Card className="p-6 mb-6 items-center">
                  <View className="w-20 h-20 bg-secondary-light/20 rounded-full items-center justify-center mb-4">
                     <Gift size={40} color="#D4A574" />
                  </View>
                  <Text className="text-2xl font-bold text-text-primary text-center">{pkg.name}</Text>
                  <Text className="text-primary text-xl font-bold mt-2">{formatCurrency(pkg.totalPrice)}</Text>
               </Card>

               <Text className="text-text-hint font-bold uppercase text-xs mb-3">Deskripsi Paket</Text>
               <Card className="p-4">
                  <Text className="text-text-primary leading-6">
                     {pkg.description || "Tidak ada deskripsi untuk paket ini."}
                  </Text>
               </Card>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
