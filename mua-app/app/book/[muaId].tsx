import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Calendar, Clock, User, Phone, MessageSquare, CheckCircle2 } from "lucide-react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";

export default function PublicBookingForm() {
  const { muaId } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [muaProfile, setMuaProfile] = useState<{ businessName: string; name: string } | null>(null);
  const [isValidMua, setIsValidMua] = useState<boolean | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
    notes: ""
  });

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);

  // 1. Validasi & Fetch Profil MUA
  React.useEffect(() => {
    async function fetchMuaProfile() {
      console.log("Fetching MUA Profile for ID:", muaId);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, business_name")
          .eq("id", muaId)
          .single();
        
        if (error) {
          console.error("Supabase Fetch Error:", error);
          setIsValidMua(false);
        } else if (!data) {
          console.warn("No data found for MUA ID:", muaId);
          setIsValidMua(false);
        } else {
          console.log("MUA Profile Found:", data);
          setMuaProfile({
            businessName: data.business_name || "",
            name: data.full_name || ""
          });
          setIsValidMua(true);
        }
      } catch (e) {
        console.error("Catch Block Error:", e);
        setIsValidMua(false);
      }
    }
    fetchMuaProfile();
  }, [muaId]);

  const phoneRegex = /^(\+62|62|0)[0-9]{8,12}$/;

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.date || !formData.time) {
      Alert.alert("Error", "Mohon isi semua data wajib.");
      return;
    }

    if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
      Alert.alert("Nomor Tidak Valid", "Masukkan nomor WhatsApp yang valid (contoh: 0812xxxxxx atau +628xxxxxxxx).");
      return;
    }

    setLoading(true);
    try {
      // 1. Buat atau cari klien terlebih dahulu
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .insert({
          user_id: muaId,
          name: formData.name,
          phone: formData.phone,
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // 2. Insert ke bookings menggunakan client_id yang valid (snake_case = nama kolom DB)
      const { error: bookingError } = await supabase.from("bookings").insert({
        user_id: muaId,
        client_id: clientData.id,
        booking_date: formData.date,
        start_time: formData.time,
        notes: `[Booking Publik]\n${formData.notes}`,
        status: "pending",
        num_persons: 1,
        total_price: 0
      });

      if (bookingError) throw bookingError;

      setIsSuccess(true);
      setFormData({ name: "", phone: "", date: "", time: "", notes: "" });
    } catch (e: any) {
      console.error("Submit Error:", e);
      Alert.alert("Gagal", "Terjadi kesalahan saat mengirim data. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (isValidMua === false) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center p-6">
        <Text className="text-xl font-bold text-status-error text-center mb-2">MUA Tidak Ditemukan</Text>
        <Text className="text-text-secondary text-center">Link yang Anda gunakan tidak valid atau sudah tidak aktif.</Text>
      </SafeAreaView>
    );
  }

  if (isValidMua === null) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-text-hint">Memuat profil MUA...</Text>
      </SafeAreaView>
    );
  }

  if (isSuccess) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center p-8">
        <View className="w-16 h-16 bg-status-success/10 rounded-full items-center justify-center mb-6">
          <CheckCircle2 size={32} color="#4CAF50" />
        </View>
        <Text className="text-2xl font-bold text-text-primary text-center mb-3">
          Booking Berhasil!
        </Text>
        <Text className="text-text-secondary text-center text-base leading-6 mb-8">
          Permintaan jadwal Anda telah terkirim ke <Text className="font-bold">{muaProfile?.businessName}</Text>. Kami akan menghubungi Anda via WhatsApp untuk konfirmasi selanjutnya.
        </Text>
        <Button 
          label="Buat Booking Lain" 
          onPress={() => setIsSuccess(false)} 
          className="w-full h-14 rounded-2xl" 
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ title: "Form Booking MUA", headerShown: true }} />
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View className="mb-8 items-center">
          <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-4">
            <Calendar size={40} color="#B76E79" />
          </View>
          <Text className="text-2xl font-bold text-text-primary text-center">
            {muaProfile?.businessName || "Booking MUA"}
          </Text>
          <Text className="text-text-hint text-center mt-2 px-4">
            {muaProfile?.name ? `MUA: ${muaProfile.name}` : "Silakan isi detail di bawah ini untuk mengajukan jadwal rias."}
          </Text>
        </View>

        <View className="gap-y-4">
          <Input 
            label="Nama Lengkap" 
            value={formData.name} 
            onChangeText={(t) => setFormData({...formData, name: t})}
            placeholder="Masukkan nama Anda"
            leftIcon={<User size={18} color="#757575" />}
          />
          
          <Input 
            label="Nomor WhatsApp" 
            value={formData.phone} 
            onChangeText={(t) => setFormData({...formData, phone: t})}
            placeholder="0812xxxxxx"
            keyboardType="phone-pad"
            leftIcon={<Phone size={18} color="#757575" />}
          />

          <TouchableOpacity onPress={() => setDatePickerVisibility(true)}>
            <Input 
              label="Tanggal Acara" 
              value={formData.date} 
              editable={false}
              placeholder="Pilih Tanggal"
              leftIcon={<Calendar size={18} color="#757575" />}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setTimePickerVisibility(true)}>
            <Input 
              label="Jam Mulai" 
              value={formData.time} 
              editable={false}
              placeholder="Pilih Jam"
              leftIcon={<Clock size={18} color="#757575" />}
            />
          </TouchableOpacity>

          <Input 
            label="Catatan Tambahan (Opsional)" 
            value={formData.notes} 
            onChangeText={(t) => setFormData({...formData, notes: t})}
            placeholder="Misal: Lokasi acara, jumlah orang, dll."
            multiline
            numberOfLines={4}
            leftIcon={<MessageSquare size={18} color="#757575" />}
          />

          <Button 
            label="Kirim Permintaan Booking" 
            onPress={handleSubmit} 
            loading={loading}
            className="mt-6 h-14 rounded-2xl"
          />
        </View>

        <DateTimePickerModal 
          isVisible={isDatePickerVisible} 
          mode="date"
          minimumDate={new Date()}
          onConfirm={(date) => {
            setFormData({...formData, date: date.toISOString().split('T')[0]});
            setDatePickerVisibility(false);
          }} 
          onCancel={() => setDatePickerVisibility(false)} 
        />

        <DateTimePickerModal 
          isVisible={isTimePickerVisible} 
          mode="time" 
          is24Hour={true}
          onConfirm={(date) => {
            const time = date.getHours().toString().padStart(2, '0') + ":" + date.getMinutes().toString().padStart(2, '0');
            setFormData({...formData, time: time});
            setTimePickerVisibility(false);
          }} 
          onCancel={() => setTimePickerVisibility(false)} 
        />
      </ScrollView>
    </SafeAreaView>
  );
}
