import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, Linking, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useClient, useUpdateClient, useDeleteClient } from "@/lib/hooks/use-clients";
import { useBookings } from "@/lib/hooks/use-bookings";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ChevronLeft, User, Phone, MapPin, Mail, MessageSquare, Calendar, ChevronRight, Trash2, Tag, Book } from "lucide-react-native";

export default function ClientDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const updateClientMutation = useUpdateClient();
  const deleteClientMutation = useDeleteClient();
  
  const { data: client, isLoading } = useClient(id as string);
  const { data: allBookings = [] } = useBookings();
  
  const clientBookings = (allBookings || []).filter((b: any) => b.clientId === id);

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
  });

  React.useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || "",
        phone: client.phone || "",
        email: client.email || "",
        address: client.address || "",
        city: client.city || "",
      });
    }
  }, [client]);

  const handleDelete = () => {
    Alert.alert("Hapus Klien", "Yakin ingin menghapus klien ini?", [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: async () => {
        await deleteClientMutation.mutateAsync(id as string);
        router.replace("/(tabs)/clients");
      }}
    ]);
  };

  const handleUpdate = async () => {
    try {
      await updateClientMutation.mutateAsync({
        id: id as string,
        updates: formData
      });
      Alert.alert("Sukses", "Data klien diperbarui");
      setEditMode(false);
    } catch (error) {
      Alert.alert("Error", "Gagal memperbarui data");
    }
  };

  if (isLoading) return null;
  if (!client) return (
    <SafeAreaView className="flex-1 items-center justify-center">
      <Text className="text-text-hint">Data telah dihapus...</Text>
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
            <Text className="text-xl font-bold text-text-primary">Profil Klien</Text>
          </View>
          <View className="flex-row items-center">
            {!editMode && (
              <TouchableOpacity onPress={handleDelete} className="mr-4 p-2">
                <Trash2 size={22} color="#F44336" />
              </TouchableOpacity>
            )}
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
              <Input label="Nama Lengkap" value={formData.name} onChangeText={(v) => setFormData(p => ({ ...p, name: v }))} leftIcon={<User size={18} color="#BDBDBD" />} />
              <Input label="Nomor WhatsApp" value={formData.phone} onChangeText={(v) => setFormData(p => ({ ...p, phone: v }))} keyboardType="phone-pad" leftIcon={<Phone size={18} color="#BDBDBD" />} />
              <Text className="text-text-hint text-[10px] mt-[-12] mb-4 ml-1">
                Gunakan format: 628... agar tombol WhatsApp berfungsi lancar
              </Text>
              <Input label="Email" value={formData.email} onChangeText={(v) => setFormData(p => ({ ...p, email: v }))} keyboardType="email-address" leftIcon={<Mail size={18} color="#BDBDBD" />} />
              <Input label="Kota" value={formData.city} onChangeText={(v) => setFormData(p => ({ ...p, city: v }))} leftIcon={<Tag size={18} color="#BDBDBD" />} />
              <Input label="Alamat Lengkap" value={formData.address} onChangeText={(v) => setFormData(p => ({ ...p, address: v }))} multiline numberOfLines={3} style={{ height: 80 }} leftIcon={<MapPin size={18} color="#BDBDBD" />} />
              <Button variant="primary" label="Simpan Perubahan" onPress={handleUpdate} className="mt-6 h-14 rounded-2xl" />
            </View>
          ) : (
            <View>
              {/* Header Profile */}
              <View className="items-center mb-8">
                 <View className="w-24 h-24 rounded-full bg-primary-light items-center justify-center mb-4">
                    <User size={48} color="#B76E79" />
                 </View>
                 <Text className="text-2xl font-bold text-text-primary">{client.name}</Text>
                 <Text className="text-text-secondary">{client.city || "Kota tidak diisi"}</Text>
              </View>

              {/* Actions */}
              <View className="flex-row gap-x-4 mb-8">
                 <TouchableOpacity onPress={() => Linking.openURL(`whatsapp://send?phone=${client.phone}`)} className="flex-1 bg-green-100 p-4 rounded-2xl items-center border border-green-200">
                    <MessageSquare size={24} color="#4CAF50" className="mb-2" />
                    <Text className="font-bold text-green-700">WhatsApp</Text>
                 </TouchableOpacity>
                 <TouchableOpacity onPress={() => Linking.openURL(`tel:${client.phone}`)} className="flex-1 bg-blue-100 p-4 rounded-2xl items-center border border-blue-200">
                    <Phone size={24} color="#2196F3" className="mb-2" />
                    <Text className="font-bold text-blue-700">Telepon</Text>
                 </TouchableOpacity>
              </View>

              {/* Info Details */}
              <View className="mb-8">
                 <Text className="text-text-hint font-bold uppercase text-xs mb-3">Informasi Kontak</Text>
                 <Card className="p-4">
                    <View className="flex-row items-center mb-4">
                       <Phone size={18} color="#BDBDBD" className="mr-3" />
                       <Text className="text-text-primary flex-1">{client.phone || "-"}</Text>
                    </View>
                    <View className="flex-row items-center mb-4">
                       <Mail size={18} color="#BDBDBD" className="mr-3" />
                       <Text className="text-text-primary flex-1">{client.email || "-"}</Text>
                    </View>
                    <View className="flex-row items-start">
                       <MapPin size={18} color="#BDBDBD" className="mr-3 mt-1" />
                       <Text className="text-text-primary flex-1">{client.address || "-"}</Text>
                    </View>
                 </Card>
              </View>

              {/* Booking History */}
              <View className="mb-10">
                 <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-text-hint font-bold uppercase text-xs">Riwayat Booking</Text>
                    <Text className="text-primary font-bold text-xs">{clientBookings.length} Kali</Text>
                 </View>

                 {clientBookings.length === 0 ? (
                   <Card className="p-8 items-center border-dashed border-divider">
                      <Text className="text-text-hint">Belum ada riwayat booking</Text>
                      <Button variant="outline" label="Buat Booking" className="mt-4" onPress={() => router.push("/booking/new")} />
                   </Card>
                 ) : (
                   clientBookings.map((booking: any) => (
                     <TouchableOpacity key={booking.id} onPress={() => router.push(`/booking/${booking.id}` as any)} className="bg-white p-4 rounded-2xl border border-divider mb-3 flex-row items-center justify-between">
                        <View className="flex-row items-center">
                           <View className="w-10 h-10 bg-primary-light/30 rounded-xl items-center justify-center mr-4">
                              <Calendar size={18} color="#B76E79" />
                           </View>
                           <View>
                              <Text className="font-bold text-text-primary">{booking.bookingDate}</Text>
                              <Text className="text-text-hint text-xs">{booking.startTime} - {booking.endTime}</Text>
                           </View>
                        </View>
                        <ChevronRight size={18} color="#BDBDBD" />
                     </TouchableOpacity>
                   ))
                 )}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
