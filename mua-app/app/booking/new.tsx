import React, { useState } from "react";
import { View, Text, ScrollView, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCreateBooking } from "@/lib/hooks/use-bookings";
import { useClients } from "@/lib/hooks/use-clients";
import { useServices } from "@/lib/hooks/use-services";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ChevronLeft, Calendar as CalendarIcon, Clock, MapPin, Tag } from "lucide-react-native";
import * as Crypto from "expo-crypto";
import { useAuthStore } from "@/lib/stores/auth-store";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { format } from "date-fns";

export default function NewBooking() {
  const router = useRouter();
  const createBookingMutation = useCreateBooking();
  const { data: clients = [] } = useClients();
  const { data: services = [] } = useServices();
  const session = useAuthStore(s => s.session);

  const [loading, setLoading] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  
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

  const handleConfirmDate = (date: Date) => {
    setFormData(prev => ({ ...prev, bookingDate: format(date, "yyyy-MM-dd") }));
    setDatePickerVisibility(false);
  };

  const handleSave = async () => {
    if (!formData.clientId || !formData.serviceId) {
      Alert.alert("Error", "Pilih klien dan layanan terlebih dahulu");
      return;
    }

    setLoading(true);
    try {
      const newBooking = {
        id: Crypto.randomUUID(),
        userId: session?.user.id || "",
        clientId: formData.clientId,
        serviceId: formData.serviceId,
        bookingDate: formData.bookingDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        locationName: formData.locationName,
        locationAddress: formData.locationAddress,
        totalPrice: parseFloat(formData.totalPrice || "0"),
        status: "pending",
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createBookingMutation.mutateAsync(newBooking);
      Alert.alert("Sukses", "Booking berhasil dibuat");
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal menyimpan booking");
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
          <Text className="text-xl font-bold text-text-primary">Booking Baru</Text>
        </View>

        <ScrollView 
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-sm font-bold text-text-hint uppercase mb-4">Informasi Klien</Text>
          <View className="mb-6">
            <Text className="text-text-primary font-medium mb-3">Pilih Klien</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {clients.length === 0 && <Text className="text-text-secondary italic">Belum ada data klien</Text>}
              {clients.map((client: any) => (
                <TouchableOpacity 
                  key={client.id}
                  onPress={() => setFormData(prev => ({ ...prev, clientId: client.id }))}
                  style={{
                    backgroundColor: formData.clientId === client.id ? '#B76E79' : '#FFFFFF',
                    borderColor: formData.clientId === client.id ? '#B76E79' : '#EEEEEE',
                  }}
                  className="mr-3 px-5 py-3 rounded-2xl border shadow-sm"
                >
                  <Text className={`${formData.clientId === client.id ? 'text-white' : 'text-text-primary'} font-bold`}>{client.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <Text className="text-sm font-bold text-text-hint uppercase mb-4">Layanan & Harga</Text>
          <View className="mb-6">
            <Text className="text-text-primary font-medium mb-3">Pilih Layanan</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {services.length === 0 && <Text className="text-text-secondary italic">Belum ada data layanan</Text>}
              {services.map((service: any) => (
                <TouchableOpacity 
                  key={service.id}
                  onPress={() => setFormData(prev => ({ ...prev, serviceId: service.id, totalPrice: String(service.basePrice) }))}
                  style={{
                    backgroundColor: formData.serviceId === service.id ? '#B76E79' : '#FFFFFF',
                    borderColor: formData.serviceId === service.id ? '#B76E79' : '#EEEEEE',
                  }}
                  className="mr-3 px-5 py-3 rounded-2xl border shadow-sm"
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
            leftIcon={<Tag size={18} color="#BDBDBD" />}
          />

          <Text className="text-sm font-bold text-text-hint uppercase mt-4 mb-4">Waktu & Lokasi</Text>
          
          <TouchableOpacity onPress={() => setDatePickerVisibility(true)}>
            <View pointerEvents="none">
              <Input 
                label="Tanggal Booking" 
                value={formData.bookingDate} 
                editable={false}
                leftIcon={<CalendarIcon size={18} color="#BDBDBD" />}
              />
            </View>
          </TouchableOpacity>

          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={handleConfirmDate}
            onCancel={() => setDatePickerVisibility(false)}
            date={new Date(formData.bookingDate)}
          />
          
          <View className="flex-row justify-between">
            <View className="w-[48%]">
              <Input 
                label="Mulai" 
                value={formData.startTime} 
                onChangeText={(v) => setFormData(p => ({ ...p, startTime: v }))}
                leftIcon={<Clock size={18} color="#BDBDBD" />}
              />
            </View>
            <View className="w-[48%]">
              <Input 
                label="Selesai" 
                value={formData.endTime} 
                onChangeText={(v) => setFormData(p => ({ ...p, endTime: v }))}
                leftIcon={<Clock size={18} color="#BDBDBD" />}
              />
            </View>
          </View>

          <Input 
            label="Nama Lokasi" 
            placeholder="Misal: Hotel Mulia, Rumah Klien"
            value={formData.locationName} 
            onChangeText={(v) => setFormData(p => ({ ...p, locationName: v }))}
            leftIcon={<MapPin size={18} color="#BDBDBD" />}
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
            label="Buat Booking" 
            onPress={handleSave}
            loading={loading}
            className="mt-6 mb-10 h-14 rounded-2xl"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
