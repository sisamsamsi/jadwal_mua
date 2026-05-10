import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCreateBooking, useBookings } from "@/lib/hooks/use-bookings";
import { useCreateClient, useClients } from "@/lib/hooks/use-clients";
import { useCreateService, useServices } from "@/lib/hooks/use-services";
import { usePackages } from "@/lib/hooks/use-packages";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ChevronLeft, Calendar as CalendarIcon, Clock, Users, Plus, Tag } from "lucide-react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Modal } from "react-native";

export default function NewBooking() {
  const router = useRouter();
  const createBooking = useCreateBooking();
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

  const handleCreateClient = async () => {
    if (!newClientName) return;
    try {
      const result = await createClientMutation.mutateAsync({ name: newClientName, phone: newClientPhone });
      setFormData({ ...formData, clientId: result.id, clientName: result.name });
      setClientModalVisible(false);
      setNewClientName("");
      setNewClientPhone("");
    } catch (e) {
      Alert.alert("Error", "Gagal menambah klien");
    }
  };

  const handleCreateService = async () => {
    if (!newServiceName || !newServicePrice) return;
    try {
      const result = await createServiceMutation.mutateAsync({ 
        name: newServiceName, 
        basePrice: Number(newServicePrice),
        category: "Makeup" 
      });
      setBasePricePerPerson(Number(newServicePrice));
      setFormData({ ...formData, serviceId: result.id, packageId: "" });
      setServiceModalVisible(false);
      setNewServiceName("");
      setNewServicePrice("");
    } catch (e) {
      Alert.alert("Error", "Gagal menambah layanan");
    }
  };

  const [basePricePerPerson, setBasePricePerPerson] = useState(0);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isStartTimeVisible, setStartTimeVisibility] = useState(false);
  const [isEndTimeVisible, setEndTimeVisibility] = useState(false);

  // LOGIKA HITUNG OTOMATIS: Harga x Jumlah Orang
  useEffect(() => {
    const calculatedPrice = basePricePerPerson * formData.numPersons;
    setFormData(prev => ({ ...prev, totalPrice: calculatedPrice }));
  }, [formData.numPersons, basePricePerPerson]);

  const checkConflict = (date: string, start: string, end: string) => {
    return allBookings.find(b => 
      b.bookingDate === date && 
      b.status !== 'cancelled' &&
      ((start >= b.startTime && start < b.endTime) || 
       (end > b.startTime && end <= b.endTime) ||
       (start <= b.startTime && end >= b.endTime))
    );
  };

  const handleSave = async () => {
    if (!formData.clientId || !formData.bookingDate || !formData.startTime || !formData.endTime) {
      Alert.alert("Error", "Mohon lengkapi data wajib (Klien, Tanggal, Waktu)");
      return;
    }

    if (formData.endTime <= formData.startTime) {
      Alert.alert("Jam Tidak Valid", "Jam selesai harus setelah jam mulai.");
      return;
    }

    const conflict = checkConflict(formData.bookingDate, formData.startTime, formData.endTime);
    if (conflict) {
      Alert.alert(
        "Jadwal Bentrok!", 
        `Jam ini sudah ada bokingan untuk ${conflict.clientName || 'Klien lain'}. Tetap simpan?`,
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
      await createBooking.mutateAsync(formData);
      router.back();
    } catch (error) {
      Alert.alert("Error", "Gagal menyimpan jadwal");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-6 py-4 border-b border-divider bg-surface">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ChevronLeft size={24} color="#2D2D2D" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-text-primary">Booking Kolektif</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {/* Tipe Acara */}
        <Text className="text-text-hint font-bold uppercase text-xs mb-3">Tipe Acara</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          {["Akad", "Resepsi", "Fitting", "Rapat", "Siraman", "Lamaran", "Lainnya"].map((type) => (
            <TouchableOpacity 
              key={type} 
              onPress={() => setFormData({ ...formData, eventType: type })}
              className={`mr-3 px-4 py-2 rounded-full border ${formData.eventType === type ? 'bg-primary border-primary' : 'bg-surface border-divider'}`}
            >
              <Text className={formData.eventType === type ? 'text-white font-bold' : 'text-text-secondary'}>{type}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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

        {/* Layanan/Paket */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-text-hint font-bold uppercase text-xs">Layanan / Paket (Per Orang)</Text>
          <TouchableOpacity onPress={() => setServiceModalVisible(true)} className="flex-row items-center">
            <Plus size={14} color="#B76E79" className="mr-1" />
            <Text className="text-primary text-xs font-bold">Tambah Layanan</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          {(services || []).map((s: any) => (
            <TouchableOpacity 
              key={s.id} 
              onPress={() => {
                setBasePricePerPerson(s.basePrice || 0);
                setFormData({ ...formData, serviceId: s.id, packageId: "" });
              }}
              className={`mr-3 px-4 py-3 rounded-2xl border ${formData.serviceId === s.id ? 'bg-primary-light/20 border-primary' : 'bg-surface border-divider'}`}
            >
              <Text className="font-bold text-text-primary">{s.name}</Text>
              <Text className="text-xs text-text-hint">Rp {(s.basePrice || 0).toLocaleString()}</Text>
            </TouchableOpacity>
          ))}
          {(packages || []).map((p: any) => (
            <TouchableOpacity 
              key={p.id} 
              onPress={() => {
                setBasePricePerPerson(p.totalPrice || 0);
                setFormData({ ...formData, packageId: p.id, serviceId: "" });
              }}
              className={`mr-3 px-4 py-3 rounded-2xl border ${formData.packageId === p.id ? 'bg-primary-light/20 border-primary' : 'bg-surface border-divider'}`}
            >
              <Text className="font-bold text-text-primary">{p.name}</Text>
              <Text className="text-xs text-text-hint">Rp {(p.totalPrice || 0).toLocaleString()}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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

        <Button variant="primary" label="Simpan Jadwal Rombongan" onPress={handleSave} loading={createBooking.isPending} className="mb-10 h-14 rounded-2xl" />

        <DateTimePickerModal isVisible={isDatePickerVisible} mode="date" onConfirm={(date) => { setFormData({ ...formData, bookingDate: date.toISOString().split('T')[0] }); setDatePickerVisibility(false); }} onCancel={() => setDatePickerVisibility(false)} />
        <DateTimePickerModal isVisible={isStartTimeVisible} mode="time" is24Hour={true} onConfirm={(date) => { const time = date.getHours().toString().padStart(2, '0') + ":" + date.getMinutes().toString().padStart(2, '0'); setFormData({ ...formData, startTime: time }); setStartTimeVisibility(false); }} onCancel={() => setStartTimeVisibility(false)} />
        <DateTimePickerModal isVisible={isEndTimeVisible} mode="time" is24Hour={true} onConfirm={(date) => { const time = date.getHours().toString().padStart(2, '0') + ":" + date.getMinutes().toString().padStart(2, '0'); setFormData({ ...formData, endTime: time }); setEndTimeVisibility(false); }} onCancel={() => setEndTimeVisibility(false)} />
      </ScrollView>

      {/* Modal Tambah Klien */}
      <Modal visible={isClientModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-surface p-6 rounded-t-3xl">
            <Text className="text-lg font-bold mb-4">Tambah Klien Baru</Text>
            <Input label="Nama Klien" value={newClientName} onChangeText={setNewClientName} placeholder="Contoh: Ibu Rina" className="mb-4" />
            <Input label="Nomor WhatsApp" value={newClientPhone} onChangeText={setNewClientPhone} placeholder="0812..." keyboardType="phone-pad" className="mb-6" />
            <View className="flex-row gap-3">
              <Button variant="outline" label="Batal" onPress={() => setClientModalVisible(false)} className="flex-1" />
              <Button variant="primary" label="Simpan" onPress={handleCreateClient} loading={createClientMutation.isPending} className="flex-1" />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Tambah Layanan */}
      <Modal visible={isServiceModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-surface p-6 rounded-t-3xl">
            <Text className="text-lg font-bold mb-4">Tambah Layanan Baru</Text>
            <Input label="Nama Layanan" value={newServiceName} onChangeText={setNewServiceName} placeholder="Contoh: Makeup Wisuda" className="mb-4" />
            <Input label="Harga Dasar (Rp)" value={newServicePrice} onChangeText={setNewServicePrice} placeholder="500000" keyboardType="numeric" className="mb-6" />
            <View className="flex-row gap-3">
              <Button variant="outline" label="Batal" onPress={() => setServiceModalVisible(false)} className="flex-1" />
              <Button variant="primary" label="Simpan" onPress={handleCreateService} loading={createServiceMutation.isPending} className="flex-1" />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
