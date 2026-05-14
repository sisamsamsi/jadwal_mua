import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Calendar, Clock, User, Phone, MessageSquare, CheckCircle2 } from "lucide-react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { cn } from "@/lib/utils/cn";

export default function PublicBookingForm() {
  const { muaId } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [muaProfile, setMuaProfile] = useState<{ businessName: string; name: string } | null>(null);
  const [isValidMua, setIsValidMua] = useState<boolean | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    serviceId: "",
    serviceName: "",
    date: "",
    time: "",
    notes: ""
  });

  const [services, setServices] = useState<any[]>([]);
  const [isServicePickerVisible, setServicePickerVisible] = useState(false);

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);

  // 1. Validasi & Fetch Profil MUA
  React.useEffect(() => {
    async function fetchData() {
      if (!muaId) return;
      
      try {
        // Fetch Profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, business_name")
          .eq("id", muaId)
          .single();
        
        if (profileError) {
          console.error("Supabase Fetch Error:", profileError);
          setIsValidMua(false);
        } else if (!profileData) {
          setIsValidMua(false);
        } else {
          setMuaProfile({
            businessName: profileData.business_name || "",
            name: profileData.full_name || ""
          });
          setIsValidMua(true);
        }

        // Fetch Services
        const { data: servicesData } = await supabase
          .from("services")
          .select("*")
          .eq("user_id", muaId)
          .eq("is_active", true)
          .order("sort_order", { ascending: true });
        
        if (servicesData) {
          setServices(servicesData);
        }
      } catch (e) {
        console.error("Catch Block Error:", e);
        setIsValidMua(false);
      }
    }
    fetchData();
  }, [muaId]);

  const phoneRegex = /^(\+62|62|0)[0-9]{8,12}$/;

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.date || !formData.time || !formData.serviceId) {
      Alert.alert("Error", "Mohon isi semua data wajib (termasuk layanan).");
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
        service_id: formData.serviceId,
        booking_date: formData.date,
        start_time: formData.time,
        end_time: formData.time, // Default sementara
        notes: `[Booking Publik]\n${formData.notes}`,
        status: "pending",
        num_persons: 1,
        total_price: services.find(s => s.id === formData.serviceId)?.basePrice || 0
      });

      if (bookingError) throw bookingError;

      setIsSuccess(true);
      setFormData({ 
        name: "", 
        phone: "", 
        serviceId: "", 
        serviceName: "", 
        date: "", 
        time: "", 
        notes: "" 
      });
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

          <View>
            <Text className="text-text-secondary text-sm font-semibold mb-2 ml-1">Layanan</Text>
            <View className="bg-white border border-divider rounded-2xl overflow-hidden">
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{ padding: 8 }}
              >
                {services.length === 0 ? (
                  <Text className="text-text-hint p-2">MUA belum menambahkan layanan.</Text>
                ) : (
                  services.map((service) => (
                    <TouchableOpacity
                      key={service.id}
                      onPress={() => setFormData({...formData, serviceId: service.id, serviceName: service.name})}
                      className={cn(
                        "px-4 py-2 rounded-xl mr-2 border",
                        formData.serviceId === service.id 
                          ? "bg-primary/10 border-primary" 
                          : "bg-neutral-background border-divider"
                      )}
                    >
                      <Text className={cn(
                        "text-sm font-medium",
                        formData.serviceId === service.id ? "text-primary" : "text-text-secondary"
                      )}>
                        {service.name}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </View>

          <TouchableOpacity activeOpacity={0.7} onPress={() => setDatePickerVisibility(true)}>
            <View pointerEvents="none">
              <Input 
                label="Tanggal Acara" 
                value={formData.date} 
                editable={false}
                placeholder="Pilih Tanggal"
                leftIcon={<Calendar size={18} color="#757575" />}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} onPress={() => setTimePickerVisibility(true)}>
            <View pointerEvents="none">
              <Input 
                label="Jam Mulai" 
                value={formData.time} 
                editable={false}
                placeholder="Pilih Jam"
                leftIcon={<Clock size={18} color="#757575" />}
              />
            </View>
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
