import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useService, useUpdateService, useDeleteService } from "@/lib/hooks/use-services";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ChevronLeft, Trash2, Tag, DollarSign, Clock, FileText } from "lucide-react-native";

export default function ServiceDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const { data: service, isLoading } = useService(id as string);
  const updateServiceMutation = useUpdateService();
  const deleteServiceMutation = useDeleteService();

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    basePrice: "",
    durationMinutes: "",
    description: "",
    category: "",
  });

  // Isi form saat data service berhasil dimuat
  React.useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        basePrice: String(service.basePrice),
        durationMinutes: String(service.durationMinutes || "60"),
        description: service.description || "",
        category: service.category || "General",
      });
    }
  }, [service]);

  const handleDelete = () => {
    Alert.alert(
      "Hapus Layanan",
      "Apakah Anda yakin ingin menghapus layanan ini?",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Hapus", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteServiceMutation.mutateAsync(id as string);
              Alert.alert("Sukses", "Layanan telah dihapus");
              router.back();
            } catch (error) {
              Alert.alert("Error", "Gagal menghapus layanan");
            }
          }
        }
      ]
    );
  };

  const handleUpdate = async () => {
    try {
      await updateServiceMutation.mutateAsync({
        id: id as string,
        updates: {
          name: formData.name,
          basePrice: parseFloat(formData.basePrice),
          durationMinutes: parseInt(formData.durationMinutes),
          description: formData.description,
          category: formData.category,
        }
      });
      Alert.alert("Sukses", "Layanan berhasil diperbarui");
      setEditMode(false);
    } catch (error) {
      Alert.alert("Error", "Gagal memperbarui layanan");
    }
  };

  if (isLoading) return null;
  if (!service) return <Text>Layanan tidak ditemukan</Text>;

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      
      <SafeAreaView className="bg-surface border-b border-divider">
        <View className="flex-row items-center justify-between px-6 py-4">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2">
              <ChevronLeft size={24} color="#2D2D2D" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-text-primary">Detail Layanan</Text>
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

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          {editMode ? (
            <View>
              <Input 
                label="Nama Layanan" 
                value={formData.name} 
                onChangeText={(v) => setFormData(p => ({ ...p, name: v }))}
                leftIcon={<Tag size={18} color="#BDBDBD" />}
              />
              <Input 
                label="Harga Dasar (Rp)" 
                value={formData.basePrice} 
                onChangeText={(v) => setFormData(p => ({ ...p, basePrice: v }))}
                keyboardType="numeric"
                leftIcon={<DollarSign size={18} color="#BDBDBD" />}
              />
              <Input 
                label="Durasi (Menit)" 
                value={formData.durationMinutes} 
                onChangeText={(v) => setFormData(p => ({ ...p, durationMinutes: v }))}
                keyboardType="numeric"
                leftIcon={<Clock size={18} color="#BDBDBD" />}
              />
              <Input 
                label="Kategori" 
                value={formData.category} 
                onChangeText={(v) => setFormData(p => ({ ...p, category: v }))}
                leftIcon={<Tag size={18} color="#BDBDBD" />}
              />
              <Input 
                label="Deskripsi" 
                value={formData.description} 
                onChangeText={(v) => setFormData(p => ({ ...p, description: v }))}
                multiline
                numberOfLines={3}
                style={{ height: 80 }}
                leftIcon={<FileText size={18} color="#BDBDBD" />}
              />
              <Button 
                variant="primary" 
                label="Simpan Perubahan" 
                onPress={handleUpdate}
                className="mt-6 h-14 rounded-2xl"
              />
            </View>
          ) : (
            <View>
               <Card className="p-6 mb-6 items-center">
                  <View className="w-20 h-20 bg-primary-light/20 rounded-full items-center justify-center mb-4">
                     <Tag size={40} color="#B76E79" />
                  </View>
                  <Text className="text-2xl font-bold text-text-primary text-center">{service.name}</Text>
                  <Text className="text-primary text-xl font-bold mt-2">Rp {service.basePrice.toLocaleString()}</Text>
               </Card>

               <Text className="text-text-hint font-bold uppercase text-xs mb-3">Informasi Layanan</Text>
               <Card className="p-4">
                  <View className="flex-row items-center mb-4">
                     <Clock size={18} color="#BDBDBD" className="mr-3" />
                     <Text className="text-text-primary font-medium">Durasi: {service.durationMinutes || "-"} Menit</Text>
                  </View>
                  <View className="flex-row items-start">
                     <FileText size={18} color="#BDBDBD" className="mr-3 mt-1" />
                     <Text className="text-text-primary flex-1">{service.description || "Tidak ada deskripsi"}</Text>
                  </View>
               </Card>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
