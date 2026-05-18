import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, Platform } from "react-native";
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
  const [muaProfile, setMuaProfile] = useState<{ businessName: string; name: string; whatsappNumber: string } | null>(null);
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
          .select("full_name, business_name, whatsapp_number")
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
            name: profileData.full_name || "",
            whatsappNumber: profileData.whatsapp_number || ""
          });
          setIsValidMua(true);
        }

        // Fetch Services
        const { data: rawServices } = await supabase
          .from("services")
          .select("*")
          .eq("user_id", muaId)
          .eq("is_active", true);
        
        if (rawServices) {
          // Normalisasi data dari Supabase (snake_case -> camelCase)
          const normalized = rawServices.map((s: any) => ({
            ...s,
            durationMinutes: s.duration_minutes || 60,
            basePrice: s.base_price || 0,
            additionalPersonPrice: s.extra_person_price || 0,
            sortOrder: s.sort_order || 0
          }));
          setServices(normalized);
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

      if (clientError) {
        console.error("Client Insert Error:", clientError);
        throw clientError;
      }
      
      if (!clientData) {
        throw new Error("Gagal membuat data klien (Data kosong)");
      }

      console.log("Client created successfully:", clientData.id);

      // 2. Hitung end_time berdasarkan durasi layanan
      const selectedService = services.find(s => s.id === formData.serviceId);
      const duration = selectedService?.durationMinutes || 60;
      
      let endTime = formData.time;
      try {
        const [hours, minutes] = formData.time.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes + duration);
        endTime = date.getHours().toString().padStart(2, '0') + ":" + date.getMinutes().toString().padStart(2, '0');
      } catch (err) {
        console.error("Time calculation error:", err);
      }

      console.log("Creating booking for service:", formData.serviceId);

      const { data: bookingData, error: bookingError } = await supabase.from("bookings").insert({
        user_id: muaId,
        client_id: clientData.id,
        service_id: formData.serviceId,
        booking_date: formData.date,
        start_time: formData.time,
        end_time: endTime,
        notes: `[Booking Publik]\n${formData.notes}`,
        status: "pending",
        num_persons: 1,
        total_price: selectedService?.basePrice || 0
      }).select().single();

      if (bookingError) {
        console.error("Booking Insert Error:", bookingError);
        throw bookingError;
      }

      console.log("Booking submitted successfully!");

      // 3. Kirim Push Notification ke perangkat MUA
      try {
        const { data: muaProfileData } = await supabase
          .from("profiles")
          .select("fcm_token")
          .eq("id", muaId)
          .single();

        if (!muaProfileData?.fcm_token) {
          console.warn("MUA push token not found (null or empty), notification skipped!");
        } else {
          const clientName = formData.name || "Klien Baru";
          await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              to: muaProfileData.fcm_token,
              title: '📅 Booking Baru Masuk!',
              body: `${clientName} baru saja booking untuk tanggal ${formData.date} jam ${formData.time}`,
              data: { type: 'new_booking', bookingId: bookingData?.id },
              sound: 'default',
              priority: 'high',
            }),
          });
          console.log("Push notification sent to MUA");
        }
      } catch (pushErr) {
        console.error("Gagal mengirim push notification:", pushErr);
      }

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
      const msg = e.message || "Terjadi kesalahan saat mengirim data. Silakan coba lagi.";
      if (Platform.OS === 'web') {
        alert("Gagal: " + msg);
      } else {
        Alert.alert("Gagal", msg);
      }
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
            onChangeText={(t) => {
              let cleaned = t.replace(/\D/g, "");
              if (cleaned.startsWith("0")) {
                cleaned = "62" + cleaned.slice(1);
              }
              setFormData({...formData, phone: cleaned});
            }}
            placeholder="Contoh: 628123456789 (Tanpa angka 0)"
            keyboardType="phone-pad"
            leftIcon={<Phone size={18} color="#757575" />}
          />
          <Text className="text-text-hint text-[10px] mt-[-12] mb-4 ml-1">
            Format wajib: 628... (Diawali 62, jangan dimulai dengan angka 0).
          </Text>

          <View>
            <Text className="text-text-secondary text-sm font-semibold mb-3 ml-1">Pilih Layanan</Text>
            <View className="flex-row flex-wrap gap-2">
              {services.length === 0 ? (
                <View className="bg-neutral-background p-4 rounded-2xl border border-divider w-full">
                  <Text className="text-text-hint text-center italic">MUA belum mengaktifkan daftar layanan.</Text>
                </View>
              ) : (
                services.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    onPress={() => setFormData({...formData, serviceId: service.id, serviceName: service.name})}
                    style={{ minWidth: '47%' }}
                    className={cn(
                      "flex-1 p-4 rounded-2xl border-2 transition-all duration-200",
                      formData.serviceId === service.id 
                        ? "bg-primary/5 border-primary shadow-sm" 
                        : "bg-white border-divider"
                    )}
                  >
                    <Text className={cn(
                      "text-sm font-bold mb-1",
                      formData.serviceId === service.id ? "text-primary" : "text-text-primary"
                    )}>
                      {service.name}
                    </Text>
                    <Text className="text-xs text-text-hint">
                      {service.durationMinutes} Menit
                    </Text>
                    <Text className="text-sm font-semibold mt-2 text-primary">
                      Rp {(service.basePrice || 0).toLocaleString('id-ID')}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>

          {Platform.OS === 'web' ? (
            <View className="mb-5">
              <Text className="text-text-secondary text-sm font-semibold mb-2 ml-1">Tanggal Acara</Text>
              <View className="flex-row items-center bg-white border border-divider rounded-2xl px-4 min-h-[56px]">
                <Calendar size={18} color="#757575" className="mr-3" />
                <input 
                  type="date" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="flex-1 bg-transparent border-none outline-none text-base text-text-primary"
                  style={{ height: '40px' }}
                />
              </View>
            </View>
          ) : (
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
          )}

          {Platform.OS === 'web' ? (
            <View className="mb-5">
              <Text className="text-text-secondary text-sm font-semibold mb-2 ml-1">Jam Mulai</Text>
              <View className="flex-row items-center bg-white border border-divider rounded-2xl px-4 min-h-[56px]">
                <Clock size={18} color="#757575" className="mr-3" />
                <input 
                  type="time" 
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                  className="flex-1 bg-transparent border-none outline-none text-base text-text-primary"
                  style={{ height: '40px' }}
                />
              </View>
            </View>
          ) : (
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
          )}

          <Input 
            label="Catatan Tambahan" 
            value={formData.notes} 
            onChangeText={(t) => setFormData({...formData, notes: t})}
            placeholder="Contoh: Lokasi di hotel, atau permintaan khusus lainnya"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            leftIcon={<MessageSquare size={18} color="#757575" />}
          />
        </View>

        <View className="mt-8 gap-y-4">
          <Button 
            label={loading ? "Mengirim..." : "Ajukan Booking"} 
            onPress={handleSubmit} 
            disabled={loading}
            className="w-full h-14 rounded-2xl" 
          />
          
          <TouchableOpacity 
            onPress={() => {
              const message = `Halo, saya ingin booking layanan ${formData.serviceName || "[Layanan]"} pada tanggal ${formData.date || "[Tanggal]"} jam ${formData.time || "[Jam]"}. Apakah tersedia?`;
              const waUrl = `https://wa.me/${muaProfile?.whatsappNumber || "628884000585"}?text=${encodeURIComponent(message)}`;
              if (Platform.OS === 'web') {
                window.open(waUrl, '_blank');
              } else {
                // Link handling for native
              }
            }}
            className="w-full h-14 rounded-2xl border border-primary items-center justify-center flex-row"
          >
            <MessageSquare size={20} color="#B76E79" className="mr-2" />
            <Text className="text-primary font-bold text-lg">Chat via WhatsApp</Text>
          </TouchableOpacity>
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
