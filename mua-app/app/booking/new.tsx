import React, { useState } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCreateBooking } from "@/lib/hooks/use-bookings";
import { useClients } from "@/lib/hooks/use-clients";
import { useServices } from "@/lib/hooks/use-services";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ChevronLeft, Calendar, Clock, MapPin, User, Tag } from "lucide-react-native";
import { v4 as uuidv4 } from "uuid";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function NewBooking() {
  const router = useRouter();
  const createBookingMutation = useCreateBooking();
  const { data: clients = [] } = useClients();
  const { data: services = [] } = useServices();
  const session = useAuthStore(s => s.session);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientId: "",
    serviceId: "",
    bookingDate: new Date().toISOString().split("T")[0],
    startTime: "08:00",
    endTime: "10:00",
    locationName: "",
    locationAddress: "",
    totalPrice: "0",
    notes: "",
  });

  const handleSave = async () => {
    if (!formData.clientId || !formData.serviceId) {
      Alert.alert("Error", "Pilih klien dan layanan terlebih dahulu");
      return;
    }

    setLoading(true);
    try {
      const newBooking = {
        id: uuidv4(),
        userId: session?.user.id || "",
        clientId: formData.clientId,
        serviceId: formData.serviceId,
        bookingDate: formData.bookingDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        locationName: formData.locationName,
        locationAddress: formData.locationAddress,
        totalPrice: parseFloat(formData.totalPrice),
        status: "pending",
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createBookingMutation.mutateAsync(newBooking);
      Alert.alert("Sukses", "Booking berhasil dibuat");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Gagal menyimpan booking");
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
        <Text className="text-xl font-bold text-text-primary">Booking Baru</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text className="text-sm font-bold text-text-hint uppercase mb-4">Informasi Klien</Text>
        <View className="mb-6">
          <Text className="text-text-primary font-medium mb-2">Pilih Klien</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {clients.map((client: any) => (
              <TouchableOpacity 
                key={client.id}
                onPress={() => setFormData(prev => ({ ...prev, clientId: client.id }))}
                className={`mr-3 px-4 py-3 rounded-2xl border ${formData.clientId === client.id ? 'bg-primary border-primary' : 'bg-surface border-divider'}`}
              >
                <Text className={`${formData.clientId === client.id ? 'text-white' : 'text-text-primary'} font-bold`}>{client.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Text className="text-sm font-bold text-text-hint uppercase mb-4">Layanan & Harga</Text>
        <View className="mb-6">
          <Text className="text-text-primary font-medium mb-2">Pilih Layanan</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {services.map((service: any) => (
              <TouchableOpacity 
                key={service.id}
                onPress={() => setFormData(prev => ({ ...prev, serviceId: service.id, totalPrice: String(service.basePrice) }))}
                className={`mr-3 px-4 py-3 rounded-2xl border ${formData.serviceId === service.id ? 'bg-primary border-primary' : 'bg-surface border-divider'}`}
              >
                <Text className={`${formData.serviceId === service.id ? 'text-white' : 'text-text-primary'} font-bold`}>{service.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Input 
          label="Total Harga (Rp)" 
          value={formData.totalPrice} 
          onChangeText={(v) => setFormData(p => ({ ...p, totalPrice: v }))}
          keyboardType="numeric"
          leftIcon={<Tag {...({ size: 18, color: "#BDBDBD" } as any)} />}
        />

        <Text className="text-sm font-bold text-text-hint uppercase mt-4 mb-4">Waktu & Lokasi</Text>
        <Input 
          label="Tanggal (YYYY-MM-DD)" 
          value={formData.bookingDate} 
          onChangeText={(v) => setFormData(p => ({ ...p, bookingDate: v }))}
          leftIcon={<Calendar {...({ size: 18, color: "#BDBDBD" } as any)} />}
        />
        <View className="flex-row justify-between">
          <View className="w-[48%]">
            <Input 
              label="Mulai" 
              value={formData.startTime} 
              onChangeText={(v) => setFormData(p => ({ ...p, startTime: v }))}
              leftIcon={<Clock {...({ size: 18, color: "#BDBDBD" } as any)} />}
            />
          </View>
          <View className="w-[48%]">
            <Input 
              label="Selesai" 
              value={formData.endTime} 
              onChangeText={(v) => setFormData(p => ({ ...p, endTime: v }))}
              leftIcon={<Clock {...({ size: 18, color: "#BDBDBD" } as any)} />}
            />
          </View>
        </View>

        <Input 
          label="Nama Lokasi" 
          placeholder="Misal: Hotel Mulia, Rumah Klien"
          value={formData.locationName} 
          onChangeText={(v) => setFormData(p => ({ ...p, locationName: v }))}
          leftIcon={<MapPin {...({ size: 18, color: "#BDBDBD" } as any)} />}
        />
        <Input 
          label="Alamat Detail" 
          placeholder="Jl. Raya No. 123..."
          value={formData.locationAddress} 
          onChangeText={(v) => setFormData(p => ({ ...p, locationAddress: v }))}
          multiline
          numberOfLines={3}
          style={{ height: 80 }}
        />

        <Input 
          label="Catatan Khusus" 
          placeholder="Alergi, request gaya makeup, dll"
          value={formData.notes} 
          onChangeText={(v) => setFormData(p => ({ ...p, notes: v }))}
          multiline
          numberOfLines={3}
          style={{ height: 80 }}
        />

        <Button 
          variant="primary" 
          label={loading ? "Menyimpan..." : "Buat Booking"} 
          onPress={handleSave}
          loading={loading}
          className="mt-6 mb-10 h-14"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

import { TouchableOpacity } from "react-native";

