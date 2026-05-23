import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useCreateBooking, useBookings } from "@/lib/hooks/use-bookings";
import { useCreateClient, useClients } from "@/lib/hooks/use-clients";
import { useCreateService, useServices } from "@/lib/hooks/use-services";
import { usePackages } from "@/lib/hooks/use-packages";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ChevronLeft, Calendar as CalendarIcon, Clock, Users, Plus, AlertCircle, Sparkles } from "lucide-react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Modal } from "react-native";
import { showAlert } from "@/lib/utils/alert";
import { aiService } from "@/lib/services/ai-service";
import { useSubscription } from "@/lib/hooks/use-subscription";


export default function NewBooking() {
  const router = useRouter();
  const { session } = useAuthStore();
  const userId = session?.user?.id ?? "";

  const createBooking = useCreateBooking();
  const { isPremium } = useSubscription();
  const createClientMutation = useCreateClient();
  const createServiceMutation = useCreateService();
  
  const { data: clients = [] } = useClients();
  const { data: services = [] } = useServices();
  const { packages = [] } = usePackages();
  const { data: allBookings = [] } = useBookings();

  const [formData, setFormData] = useState({
    clientId: "",
    clientName: "",
    serviceId: "",
    packageId: "",
    bookingDate: new Date().toISOString().split('T')[0],
    startTime: "08:00",
    endTime: "10:00",
    locationName: "",
    locationAddress: "",
    numPersons: 1, 
    totalPrice: 0,
    eventType: "Akad",
    notes: "",
  });

  // Modal States
  const [isClientModalVisible, setClientModalVisible] = useState(false);
  const [isServiceModalVisible, setServiceModalVisible] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [aiServiceName, setAiServiceName] = useState("");

  // Prefill new client name from AI extracted client name if not yet created
  useEffect(() => {
    if (isClientModalVisible && !formData.clientId && formData.clientName && !newClientName) {
      setNewClientName(formData.clientName);
    }
  }, [isClientModalVisible, formData.clientId, formData.clientName]);

  // Prefill new service name from AI extracted service name if not yet created
  useEffect(() => {
    if (isServiceModalVisible && !formData.serviceId && !formData.packageId && aiServiceName && !newServiceName) {
      setNewServiceName(aiServiceName);
    }
  }, [isServiceModalVisible, formData.serviceId, formData.packageId, aiServiceName]);

  const handleCreateClient = async () => {
    if (!newClientName) return;
    try {
      const result = await createClientMutation.mutateAsync({
        name: newClientName,
        phone: newClientPhone,
        userId, // Fix Bug 1B: userId wajib untuk DB constraint NOT NULL
      });
      setFormData(prev => ({ ...prev, clientId: result.id, clientName: result.name })); // Fix Bug 1B: gunakan prev => untuk hindari stale closure
      setClientModalVisible(false);
      setNewClientName("");
      setNewClientPhone("");
    } catch (e) {
      showAlert("Error", "Gagal menambah klien");
    }

  };

  const handleCreateService = async () => {
    if (!newServiceName || !newServicePrice) return;
    try {
      const result = await createServiceMutation.mutateAsync({ 
        name: newServiceName, 
        basePrice: Number(newServicePrice),
        category: "Makeup",
        userId, // Fix Bug 1B: userId wajib untuk DB constraint NOT NULL
      });
      setBasePricePerPerson(Number(newServicePrice));
      setFormData(prev => ({ ...prev, serviceId: result.id, packageId: "" })); // Fix Bug 1B: gunakan prev => untuk hindari stale closure
      setServiceModalVisible(false);
      setNewServiceName("");
      setNewServicePrice("");
    } catch (e) {
      showAlert("Error", "Gagal menambah layanan");
    }

  };

  const [basePricePerPerson, setBasePricePerPerson] = useState(0);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isStartTimeVisible, setStartTimeVisibility] = useState(false);
  const [isEndTimeVisible, setEndTimeVisibility] = useState(false);

  // AI States
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiInputText, setAiInputText] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  const handleAiParse = async () => {
    if (!aiInputText.trim()) return;
    setIsParsing(true);
    
    // Resolusi userId dinamis dari store langsung untuk mencegah stale closure atau empty string
    const activeUserId = userId || useAuthStore.getState().session?.user?.id;
    if (!activeUserId) {
      showAlert("Sesi Tidak Ditemukan", "Sesi login MUA tidak valid. Silakan login kembali.");
      setIsParsing(false);
      return;
    }

    try {
      const result = await aiService.parseBookingMessage(aiInputText);
      
      // Helper normalisasi nama klien (mengabaikan gelar/sapaan seperti Ibu, Kak, Mbak, Bapak)
      const normalizeClientName = (name: string) => {
        return name
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, "") // Hapus tanda baca
          .split(/\s+/)
          .filter(word => !["ibu", "bapak", "kak", "kakak", "mbak", "neng", "sis", "sist", "sista", "tante", "om", "sdr", "sdri"].includes(word))
          .join(" ")
          .trim();
      };

      // Helper normalisasi nama layanan (menghilangkan spasi pada "make up" -> "makeup", mengabaikan kata umum "mua", "makeup", "rias", "jasa", "layanan")
      const normalizeServiceName = (name: string) => {
        return name
          .toLowerCase()
          .replace(/make\s+up/g, "makeup") // satukan "make up" menjadi "makeup"
          .replace(/[^a-z0-9\s]/g, "") // Hapus tanda baca
          .split(/\s+/)
          .filter(word => !["mua", "makeup", "rias", "jasa", "layanan", "artist", "paket", "custom"].includes(word))
          .join(" ")
          .trim();
      };

      // 1. Matching klien — DUA ARAH dengan normalisasi cerdas
      let matchedClientId = "";
      let matchedClientName = result.clientName || "";
      let isNewClientCreated = false;
      
      if (result.clientName) {
        const match = clients.find((c: any) => {
          const normDb = normalizeClientName(c.name);
          const normAi = normalizeClientName(result.clientName);
          if (!normDb || !normAi) {
            const rawDb = c.name.toLowerCase().trim();
            const rawAi = result.clientName.toLowerCase().trim();
            return rawDb.includes(rawAi) || rawAi.includes(rawDb);
          }
          return normDb.includes(normAi) || normAi.includes(normDb);
        });
        
        if (match) {
          matchedClientId = match.id;
          matchedClientName = match.name;
        } else {
          // Buat klien baru secara otomatis!
          try {
            const newClient = await createClientMutation.mutateAsync({
              name: result.clientName,
              phone: result.clientPhone || "",
              userId: activeUserId,
            });
            matchedClientId = newClient.id;
            matchedClientName = newClient.name;
            isNewClientCreated = true;
          } catch (createErr) {
            console.error("Gagal membuat klien baru otomatis via AI:", createErr);
          }
        }
      }

      // 2. Matching layanan dari nama yang diekstrak AI dengan normalisasi cerdas
      let matchedServiceId = "";
      let matchedServicePrice = 0;
      let isNewServiceCreated = false;

      if (result.serviceName) {
        const matchedSvc = services.find((s: any) => {
          const normDb = normalizeServiceName(s.name);
          const normAi = normalizeServiceName(result.serviceName);
          if (!normDb || !normAi) {
            const rawDb = s.name.toLowerCase().trim();
            const rawAi = result.serviceName.toLowerCase().trim();
            return rawDb.includes(rawAi) || rawAi.includes(rawDb);
          }
          return normDb.includes(normAi) || normAi.includes(normDb);
        });
        
        if (matchedSvc) {
          matchedServiceId = matchedSvc.id;
          matchedServicePrice = matchedSvc.basePrice || 0;
        } else {
          // Buat layanan baru secara otomatis!
          try {
            const price = result.servicePrice || 0;
            const newSvc = await createServiceMutation.mutateAsync({
              name: result.serviceName,
              basePrice: price,
              category: "Makeup",
              userId: activeUserId,
            });
            matchedServiceId = newSvc.id;
            matchedServicePrice = newSvc.basePrice || 0;
            isNewServiceCreated = true;
          } catch (createErr) {
            console.error("Gagal membuat layanan baru otomatis via AI:", createErr);
          }
        }
      }

      // 3. Validasi Format Tanggal (YYYY-MM-DD)
      let validDate = formData.bookingDate;
      if (result.bookingDate && /^\d{4}-\d{2}-\d{2}$/.test(result.bookingDate)) {
        validDate = result.bookingDate;
      }

      // 4. Update form data dengan fallback (pakai prev => agar tidak ada stale closure)
      setFormData(prev => ({
        ...prev,
        clientId: matchedClientId || prev.clientId,
        clientName: matchedClientName || prev.clientName,
        serviceId: matchedServiceId || prev.serviceId,
        bookingDate: validDate,
        startTime: result.startTime || prev.startTime,
        endTime: result.endTime || prev.endTime,
        locationName: result.locationName || prev.locationName,
        locationAddress: result.locationAddress || prev.locationAddress,
        numPersons: result.numPersons || prev.numPersons,
        eventType: result.eventType || prev.eventType,
        notes: result.notes || prev.notes,
        totalPrice: prev.totalPrice,
      }));

      if (matchedServiceId) setBasePricePerPerson(matchedServicePrice);
      setAiServiceName(result.serviceName || "");

      // 5. Ringkasan feedback per field dengan emoji
      const fields: string[] = [];
      if (isNewClientCreated) {
        fields.push(`✨ Klien Baru "${result.clientName}" dibuat otomatis`);
      } else if (matchedClientId) {
        fields.push(`✅ Klien "${matchedClientName}" terpilih`);
      } else if (result.clientName) {
        fields.push(`⚠️ Gagal memproses klien "${result.clientName}"`);
      }

      if (isNewServiceCreated) {
        fields.push(`✨ Layanan Baru "${result.serviceName}" dibuat otomatis (Rp ${matchedServicePrice.toLocaleString('id-ID')})`);
      } else if (matchedServiceId) {
        fields.push(`✅ Layanan "${result.serviceName}" terpilih`);
      } else if (result.serviceName) {
        fields.push(`⚠️ Gagal memproses layanan "${result.serviceName}"`);
      }

      if (result.bookingDate) fields.push("✅ Tanggal");
      if (result.startTime) fields.push("✅ Waktu");
      if (result.locationName) fields.push("✅ Lokasi");

      const summary = fields.length > 0 ? fields.join("\n") : "Beberapa data berhasil diekstrak.";
      showAlert("Hasil AI", summary + "\n\nSilakan lengkapi bagian yang kosong.");

      setAiModalVisible(false);
      setAiInputText("");
    } catch (error: any) {
      showAlert("Gagal Membaca", "Gagal memproses teks. Pastikan koneksi internet stabil.");
    } finally {
      setIsParsing(false);
    }
  };

  // LOGIKA HITUNG OTOMATIS: Harga x Jumlah Orang
  useEffect(() => {
    const calculatedPrice = basePricePerPerson * formData.numPersons;
    setFormData(prev => ({ ...prev, totalPrice: calculatedPrice }));
  }, [formData.numPersons, basePricePerPerson]);

  const [conflictInfo, setConflictInfo] = useState<any>(null);

  const checkConflict = useCallback((date: string, start: string, end: string) => {
    const BUFFER = 30;
    const toMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const newStart = toMinutes(start);
    const newEnd = toMinutes(end);

    return allBookings.find((b: any) => {
      if (b.bookingDate !== date || b.status === 'cancelled') return false;
      const bStart = toMinutes(b.startTime);
      const bEnd = toMinutes(b.endTime);

      const isOverlap = (newStart >= bStart && newStart < bEnd) || 
                       (newEnd > bStart && newEnd <= bEnd) ||
                       (newStart <= bStart && newEnd >= bEnd);
      if (isOverlap) return true;

      const isTooClose = (newStart < bEnd + BUFFER && newStart >= bEnd) || 
                         (newEnd > bStart - BUFFER && newEnd <= bStart);
      if (isTooClose) return true;

      return false;
    });
  }, [allBookings]);

  // Real-time conflict check
  useEffect(() => {
    if (formData.bookingDate && formData.startTime && formData.endTime) {
      const conflict = checkConflict(formData.bookingDate, formData.startTime, formData.endTime);
      setConflictInfo(conflict || null);
    }
  }, [formData.bookingDate, formData.startTime, formData.endTime, checkConflict]);

  const handleSave = async () => {
    if (!formData.clientId || !formData.bookingDate || !formData.startTime || !formData.endTime) {
      showAlert("Error", "Mohon lengkapi data wajib (Klien, Tanggal, Waktu)");

      return;
    }

    // GATING: Batas 10 Booking untuk Trial
    if (!isPremium && allBookings.length >= 10) {
      showAlert(
        "Limit Trial Tercapai", 
        "Anda telah mencapai batas maksimal 10 booking untuk versi Trial. Silakan upgrade ke Premium untuk menambah jadwal tanpa batas!",
        [{ text: "Nanti Saja" }, { text: "Upgrade Sekarang", onPress: () => router.push("/settings") }]
      );

      return;
    }

    // Issue 8: Validasi layanan — booking tidak boleh disimpan tanpa layanan/paket
    if (!formData.serviceId && !formData.packageId) {
      showAlert("Pilih Layanan", "Mohon pilih layanan atau paket sebelum menyimpan jadwal. Booking tanpa layanan tidak bisa dihitung harganya.");

      return;
    }

    if (formData.endTime <= formData.startTime) {
      showAlert("Jam Tidak Valid", "Jam selesai harus setelah jam mulai.");

      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (formData.bookingDate < today) {
      showAlert("Tanggal Mundur", "Anda tidak bisa membuat jadwal untuk tanggal yang sudah lewat.");

      return;
    }

    if (conflictInfo) {
      showAlert(
        "Peringatan Jadwal!", 
        `Jadwal ini bentrok atau terlalu mepet dengan booking ${conflictInfo.clientName} (${conflictInfo.startTime} - ${conflictInfo.endTime}). Tetap simpan?`,
        [
          { text: "Batal", style: "cancel" },
          { text: "Tetap Simpan", onPress: submitData }
        ]
      );

    } else {
      submitData();
    }
  };

  const submitData = async () => {
    try {
      const result = await createBooking.mutateAsync(formData);
      
      if (formData.numPersons > 1) {
        showAlert(
          "Jadwal Berhasil Disimpan",
          "Booking rombongan berhasil dibuat. Ingin menambahkan rincian nama dan pilihan makeup untuk setiap orang sekarang?",
          [
            { 
              text: "Nanti Saja", 
              onPress: () => router.replace("/(tabs)/home") 
            },
            { 
              text: "Tambah Rincian", 
              onPress: () => router.replace(`/booking/${result.id}` as any) 
            }
          ]
        );
      } else {
        showAlert(
          "Sukses", 
          "Jadwal berhasil disimpan.",
          [{ text: "OK", onPress: () => router.back() }]
        );
      }

    } catch (error: any) {
      // Cek apakah error adalah trial limit
      if (error?.message?.startsWith('TRIAL_LIMIT_REACHED:')) {
        const msg = error.message.replace('TRIAL_LIMIT_REACHED:', '');
        showAlert(
          '🔒 Batas Trial Tercapai',
          msg,
          [
            { text: 'Nanti', style: 'cancel' },
            { text: 'Upgrade Premium', onPress: () => router.push('/settings/subscription' as any) }
          ]
        );
      } else {
        showAlert('Error', 'Gagal menyimpan jadwal');
      }
    }

  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-6 py-4 border-b border-divider bg-surface">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ChevronLeft size={24} color="#2D2D2D" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-text-primary">
          {formData.numPersons > 1 ? "Booking Rombongan" : "Booking Jadwal"}
        </Text>
        <TouchableOpacity 
          onPress={() => {
            if (!isPremium) {
              showAlert(
                '🔒 Fitur Premium',
                'AI Asisten hanya tersedia untuk pengguna Premium. Upgrade sekarang untuk menggunakannya!',
                [
                  { text: 'Nanti', style: 'cancel' },
                  { text: 'Upgrade Premium', onPress: () => router.push('/settings/subscription' as any) }
                ]
              );
              return;
            }
            setAiModalVisible(true);
          }}
          className="ml-auto bg-primary/10 px-3 py-2 rounded-full flex-row items-center"
        >
          <Sparkles size={16} color="#B76E79" className="mr-1" />
          <Text className="text-primary text-xs font-bold">Asisten AI</Text>
          {!isPremium && <Text className="text-primary text-xs ml-1">🔒</Text>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
        {/* Tipe Acara - Disederhanakan menjadi Input Teks agar tidak perlu CRUD membingungkan */}
        <Text className="text-text-hint font-bold uppercase text-xs mb-3">Jenis / Tipe Acara (Opsional)</Text>
        <Input
          value={formData.eventType}
          onChangeText={(t) => setFormData({ ...formData, eventType: t })}
          placeholder="Contoh: Akad, Resepsi, Wisuda, dll."
          className="mb-6"
        />

        {/* Pilih Klien */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-text-hint font-bold uppercase text-xs">Pilih Klien / Instansi</Text>
          <TouchableOpacity onPress={() => setClientModalVisible(true)} className="flex-row items-center">
            <Plus size={14} color="#B76E79" className="mr-1" />
            <Text className="text-primary text-xs font-bold">Tambah Klien</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          {(clients || []).map((c: any) => (
            <TouchableOpacity 
              key={c.id} 
              onPress={() => setFormData({ ...formData, clientId: c.id, clientName: c.name })}
              className={`mr-3 px-4 py-2 rounded-full border ${formData.clientId === c.id ? 'bg-primary border-primary' : 'bg-surface border-divider'}`}
            >
              <Text className={formData.clientId === c.id ? 'text-white font-bold' : 'text-text-secondary'}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tanggal & Waktu */}
        <View className="flex-row gap-4 mb-6">
          <View className="flex-1">
            <Text className="text-text-hint font-bold uppercase text-xs mb-2">Tanggal</Text>
            <TouchableOpacity onPress={() => setDatePickerVisibility(true)} className="bg-surface p-4 rounded-xl border border-divider flex-row items-center">
              <CalendarIcon size={18} color="#B76E79" className="mr-2" />
              <Text className="text-text-primary">{formData.bookingDate}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row gap-4 mb-6">
          <View className="flex-1">
            <Text className="text-text-hint font-bold uppercase text-xs mb-2">Mulai</Text>
            <TouchableOpacity onPress={() => setStartTimeVisibility(true)} className="bg-surface p-4 rounded-xl border border-divider flex-row items-center">
              <Clock size={18} color="#B76E79" className="mr-2" />
              <Text className="text-text-primary font-bold">{formData.startTime}</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-1">
            <Text className="text-text-hint font-bold uppercase text-xs mb-2">Selesai</Text>
            <TouchableOpacity onPress={() => setEndTimeVisibility(true)} className="bg-surface p-4 rounded-xl border border-divider flex-row items-center">
              <Clock size={18} color="#B76E79" className="mr-2" />
              <Text className="text-text-primary font-bold">{formData.endTime}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* JUMLAH ORANG (PAX) */}
        <View className="mb-6">
          <Text className="text-text-hint font-bold uppercase text-xs mb-3">Jumlah Orang (Pax)</Text>
          <View className="flex-row items-center bg-surface p-2 rounded-2xl border border-divider">
            <TouchableOpacity 
              onPress={() => setFormData(prev => ({ ...prev, numPersons: Math.max(1, prev.numPersons - 1) }))}
              className="w-12 h-12 items-center justify-center bg-gray-100 rounded-xl"
            >
              <Text className="text-2xl font-bold text-text-primary">-</Text>
            </TouchableOpacity>
            <View className="flex-1 items-center flex-row justify-center">
              <Users size={20} color="#B76E79" className="mr-2" />
              <Text className="text-xl font-bold text-text-primary">{formData.numPersons} Orang</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setFormData(prev => ({ ...prev, numPersons: prev.numPersons + 1 }))}
              className="w-12 h-12 items-center justify-center bg-primary-light/30 rounded-xl"
            >
              <Text className="text-2xl font-bold text-primary">+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Real-time Conflict Warning */}
        {conflictInfo && (
          <View className="bg-red-50 p-4 rounded-2xl border border-red-100 mb-6 flex-row items-center">
            <AlertCircle size={20} color="#F44336" className="mr-3" />
            <View className="flex-1">
              <Text className="text-status-error font-bold text-xs uppercase">Jadwal Bentrok / Mepet</Text>
              <Text className="text-text-primary text-[11px]">
                {conflictInfo.clientName} ({conflictInfo.startTime} - {conflictInfo.endTime})
              </Text>
            </View>
          </View>
        )}

        {/* Layanan/Paket - Tampilan Grid 3 Kolom */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-text-hint font-bold uppercase text-xs">Layanan / Paket (Per Orang)</Text>
          <TouchableOpacity onPress={() => setServiceModalVisible(true)} className="flex-row items-center">
            <Plus size={14} color="#B76E79" className="mr-1" />
            <Text className="text-primary text-xs font-bold">Tambah Layanan</Text>
          </TouchableOpacity>
        </View>
        
        <View className="flex-row flex-wrap justify-between mb-6">
          {(services || []).map((s: any) => (
            <TouchableOpacity 
              key={s.id} 
              onPress={() => {
                setBasePricePerPerson(s.basePrice || 0);
                setFormData({ ...formData, serviceId: s.id, packageId: "" });
              }}
              style={{ width: '31.5%', marginBottom: 10 }}
              className={`p-3 rounded-2xl border ${formData.serviceId === s.id ? 'bg-primary-light/20 border-primary' : 'bg-surface border-divider'}`}
            >
              <Text className={`font-bold text-[11px] mb-1 ${formData.serviceId === s.id ? 'text-primary' : 'text-text-primary'}`} numberOfLines={1}>
                {s.name}
              </Text>
              <Text className={`text-[9px] ${formData.serviceId === s.id ? 'text-primary/70' : 'text-text-hint'}`}>
                Rp {(s.basePrice || 0).toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
          {(packages || []).map((p: any) => (
            <TouchableOpacity 
              key={p.id} 
              onPress={() => {
                setBasePricePerPerson(p.totalPrice || 0);
                setFormData({ ...formData, packageId: p.id, serviceId: "" });
              }}
              style={{ width: '31.5%', marginBottom: 10 }}
              className={`p-3 rounded-2xl border ${formData.packageId === p.id ? 'bg-primary-light/20 border-primary' : 'bg-surface border-divider'}`}
            >
              <Text className={`font-bold text-[11px] mb-1 ${formData.packageId === p.id ? 'text-primary' : 'text-text-primary'}`} numberOfLines={1}>
                {p.name}
              </Text>
              <Text className={`text-[9px] ${formData.packageId === p.id ? 'text-primary/70' : 'text-text-hint'}`}>
                Rp {(p.totalPrice || 0).toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Lokasi */}
        <Text className="text-text-hint font-bold uppercase text-xs mb-3">Lokasi Acara</Text>
        <Input
          value={formData.locationName}
          onChangeText={(t) => setFormData({ ...formData, locationName: t })}
          placeholder="Nama Gedung / Venue / Lokasi"
          className="mb-3"
        />
        <Input
          value={formData.locationAddress}
          onChangeText={(t) => setFormData({ ...formData, locationAddress: t })}
          placeholder="Alamat lengkap..."
          multiline
          className="mb-6"
        />

        {/* Catatan */}
        <Text className="text-text-hint font-bold uppercase text-xs mb-3">Catatan Tambahan</Text>
        <Input
          value={formData.notes}
          onChangeText={(t) => setFormData({ ...formData, notes: t })}
          placeholder="Misal: Request khusus, alergi, dll."
          multiline
          className="mb-6"
        />

        {/* Total Keseluruhan */}
        <View className="bg-primary/5 p-6 rounded-3xl border border-primary/10 mb-6">
          <Text className="text-text-hint text-center text-xs uppercase font-bold mb-1">Total Biaya Keseluruhan</Text>
          <Text className="text-primary text-center text-3xl font-bold">
            Rp {formData.totalPrice.toLocaleString()}
          </Text>
          <Text className="text-text-hint text-center text-[10px] mt-1 italic">
            ({formData.numPersons} orang × Rp {basePricePerPerson.toLocaleString()})
          </Text>
        </View>

        <Button 
          variant="primary" 
          label={formData.numPersons > 1 ? "Simpan Jadwal Rombongan" : "Simpan Jadwal"} 
          onPress={handleSave} 
          loading={createBooking.isPending} 
          className="mb-10 h-14 rounded-2xl" 
        />

        <DateTimePickerModal isVisible={isDatePickerVisible} mode="date" onConfirm={(date) => { setFormData({ ...formData, bookingDate: date.toISOString().split('T')[0] }); setDatePickerVisibility(false); }} onCancel={() => setDatePickerVisibility(false)} />
        <DateTimePickerModal isVisible={isStartTimeVisible} mode="time" is24Hour={true} onConfirm={(date) => { const time = date.getHours().toString().padStart(2, '0') + ":" + date.getMinutes().toString().padStart(2, '0'); setFormData({ ...formData, startTime: time }); setStartTimeVisibility(false); }} onCancel={() => setStartTimeVisibility(false)} />
        <DateTimePickerModal isVisible={isEndTimeVisible} mode="time" is24Hour={true} onConfirm={(date) => { const time = date.getHours().toString().padStart(2, '0') + ":" + date.getMinutes().toString().padStart(2, '0'); setFormData({ ...formData, endTime: time }); setEndTimeVisibility(false); }} onCancel={() => setEndTimeVisibility(false)} />
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal Tambah Klien */}
      <Modal visible={isClientModalVisible} animationType="fade" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-center bg-black/50 px-6"
        >
          <View className="bg-surface p-6 rounded-3xl shadow-2xl border border-divider">
            <Text className="text-lg font-bold mb-4 text-text-primary">Tambah Klien Baru</Text>
            <Input label="Nama Klien" value={newClientName} onChangeText={setNewClientName} placeholder="Contoh: Ibu Rina" className="mb-4" />
            <Input label="Nomor WhatsApp" value={newClientPhone} onChangeText={setNewClientPhone} placeholder="0812..." keyboardType="phone-pad" className="mb-6" />
            <View className="flex-row gap-3">
              <Button variant="outline" label="Batal" onPress={() => setClientModalVisible(false)} className="flex-1" />
              <Button variant="primary" label="Simpan" onPress={handleCreateClient} loading={createClientMutation.isPending} className="flex-1" />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Tambah Layanan */}
      <Modal visible={isServiceModalVisible} animationType="fade" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-center bg-black/50 px-6"
        >
          <View className="bg-surface p-6 rounded-3xl shadow-2xl border border-divider">
            <Text className="text-lg font-bold mb-4 text-text-primary">Tambah Layanan Baru</Text>
            <Input label="Nama Layanan" value={newServiceName} onChangeText={setNewServiceName} placeholder="Contoh: Makeup Wisuda" className="mb-4" />
            <Input label="Harga Dasar (Rp)" value={newServicePrice} onChangeText={setNewServicePrice} placeholder="500000" keyboardType="numeric" className="mb-6" />
            <View className="flex-row gap-3">
              <Button variant="outline" label="Batal" onPress={() => setServiceModalVisible(false)} className="flex-1" />
              <Button variant="primary" label="Simpan" onPress={handleCreateService} loading={createServiceMutation.isPending} className="flex-1" />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* AI ASISTEN MODAL */}
      <Modal visible={aiModalVisible} animationType="fade" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-center bg-black/50 px-6"
        >
          <View className="bg-white rounded-[32px] p-6 shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center mr-3">
                  <Sparkles size={20} color="#B76E79" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-text-primary">Asisten AI MUA</Text>
                  <Text className="text-text-hint text-[10px]">Tempel pesan WA untuk isi otomatis</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setAiModalVisible(false)} className="ml-2">
                <Text className="text-primary font-bold">Batal</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="max-h-80">
              <View className="bg-gray-50 rounded-2xl p-4 border border-divider mb-4">
                <Input
                  placeholder="Tempel pesan di sini... Contoh: 'Halo kak, mau booking buat akad tgl 12 Des jam 8 pagi di Gedung Serbaguna...'"
                  value={aiInputText}
                  onChangeText={setAiInputText}
                  multiline
                  numberOfLines={6}
                  maxLength={1000}
                  textAlignVertical="top"
                  className="bg-transparent border-0 min-h-[120px]"
                />
              </View>
            </ScrollView>

            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-[10px] text-text-hint italic">
                * AI mendeteksi Nama, Layanan, Tanggal, Jam & Lokasi
              </Text>
              <Text className="text-[10px] text-text-hint">
                {aiInputText.length}/1000
              </Text>
            </View>

            <Button
              label={isParsing ? "Sedang Membaca..." : "Proses dengan AI"}
              onPress={handleAiParse}
              loading={isParsing}
              className="h-14 rounded-2xl"
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
