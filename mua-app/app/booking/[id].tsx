import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, Linking, Share, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBooking, useUpdateBooking, useDeleteBooking, useBookings } from "@/lib/hooks/use-bookings";
import { useClient } from "@/lib/hooks/use-clients";
import { useBridalParty, useCreateBridalPartyMember, useUpdateBridalPartyMember, useDeleteBridalPartyMember } from "@/lib/hooks/use-bridal-party";
import { usePaymentsByBooking, useCreatePayment } from "@/lib/hooks/use-payments";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import * as Crypto from "expo-crypto";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { ChevronLeft, Calendar as CalendarIcon, Clock, MapPin, User, FileText, MessageSquare, Trash2, RotateCcw, Share2, Users, Plus, Edit2, CheckCircle2, Tag, AlertCircle } from "lucide-react-native";
import { showAlert } from "@/lib/utils/alert";
import { formatCurrency } from "@/lib/utils/currency";

import DateTimePickerModal from "react-native-modal-datetime-picker";

import { sendWhatsApp, formatWhatsAppTemplate } from "@/lib/utils/whatsapp";
import { PremiumGate } from "@/components/ui/PremiumGate";

export default function BookingDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const updateBookingMutation = useUpdateBooking();
  const deleteBookingMutation = useDeleteBooking();
  const createPaymentMutation = useCreatePayment();
  
  // Bridal Party Mutations
  const createMemberMutation = useCreateBridalPartyMember();
  const updateMemberMutation = useUpdateBridalPartyMember();
  const deleteMemberMutation = useDeleteBridalPartyMember();

  const { data: allBookings = [] } = useBookings();
  const { data: booking, isLoading: loadingBooking } = useBooking(id as string);
  const { data: client } = useClient(booking?.clientId || "");
  const { data: payments = [] } = usePaymentsByBooking(id as string);
  const { data: members = [] } = useBridalParty(id as string);
  const { showBridalParty, waTemplates } = useSettingsStore();
  const session = useAuthStore(s => s.session);

  const [editMode, setEditMode] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  
  // Edit State
  const [editData, setEditData] = useState<any>(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isStartTimeVisible, setStartTimeVisibility] = useState(false);
  const [isEndTimeVisible, setEndTimeVisibility] = useState(false);
  const [unitPrice, setUnitPrice] = useState(0);

  const totalPaid = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
  const remainingBalance = (booking?.totalPrice || 0) - totalPaid;

  // Member State
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [memberForm, setMemberForm] = useState({
    name: "",
    role: "",
    clothingDesc: "",
    clothingSize: "",
    makeupRequest: "",
    notes: ""
  });

  const handleSaveMember = async () => {
    if (!memberForm.name) return;
    try {
      if (selectedMember) {
        await updateMemberMutation.mutateAsync({ 
          id: selectedMember.id, 
          updates: memberForm, 
          bookingId: id 
        });
      } else {
        await createMemberMutation.mutateAsync({ 
          ...memberForm, 
          bookingId: id 
        });
      }
      setMemberModalVisible(false);
    } catch (e) {
      showAlert("Error", "Gagal menyimpan data");
    }

  };

  const startEdit = () => {
    setEditData({ ...booking });
    // Hitung harga per orang untuk kalkulasi otomatis saat edit pax
    const initialUnitPrice = booking.totalPrice / (booking.numPersons || 1);
    setUnitPrice(initialUnitPrice);
    setEditMode(true);
  };

  // Sync Total Price when Pax changes
  useEffect(() => {
    if (editMode && editData && unitPrice > 0) {
      const newTotal = unitPrice * editData.numPersons;
      if (newTotal !== editData.totalPrice) {
        setEditData((prev: any) => ({ ...prev, totalPrice: newTotal }));
      }
    }
  }, [editData?.numPersons, unitPrice, editMode]);


  const [conflictInfo, setConflictInfo] = useState<any>(null);

  const checkConflict = (date: string, start: string, end: string) => {
    const BUFFER = 30;
    const toMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const newStart = toMinutes(start);
    const newEnd = toMinutes(end);

    return allBookings.find((b: any) => 
      b.id !== id &&
      b.bookingDate === date && 
      b.status !== 'cancelled' &&
      ((newStart < toMinutes(b.endTime) + BUFFER && newStart >= toMinutes(b.endTime)) || 
       (newEnd > toMinutes(b.startTime) - BUFFER && newEnd <= toMinutes(b.startTime)) ||
       (newStart >= toMinutes(b.startTime) && newStart < toMinutes(b.endTime)) ||
       (newEnd > toMinutes(b.startTime) && newEnd <= toMinutes(b.endTime)) ||
       (newStart <= toMinutes(b.startTime) && newEnd >= toMinutes(b.endTime)))
    );
  };

  useEffect(() => {
    if (editMode && editData?.bookingDate && editData?.startTime && editData?.endTime) {
      const conflict = checkConflict(editData.bookingDate, editData.startTime, editData.endTime);
      setConflictInfo(conflict || null);
    }
  }, [editMode, editData?.bookingDate, editData?.startTime, editData?.endTime, allBookings]);

  const handleSaveEdit = async () => {
    if (editData.endTime <= editData.startTime) {
      showAlert("Jam Tidak Valid", "Jam selesai harus setelah jam mulai.");

      return;
    }

    if (conflictInfo) {
      showAlert(
        "Jadwal Bentrok / Mepet!", 
        `Jadwal ini bentrok atau terlalu mepet dengan ${conflictInfo.clientName}. Tetap simpan?`,
        [
          { text: "Batal", style: "cancel" },
          { text: "Tetap Simpan", onPress: submitUpdate }
        ]
      );

    } else {
      submitUpdate();
    }
  };

  const submitUpdate = async () => {
    try {
      await updateBookingMutation.mutateAsync({
        id: id as string,
        updates: editData
      });
      setEditMode(false);
      showAlert("Sukses", "Perubahan berhasil disimpan.");

    } catch (error) {
      showAlert("Error", "Gagal menyimpan perubahan.");

    }
  };

  const handleRefund = () => {
    if (totalPaid <= 0) return;
    showAlert(
      "Konfirmasi Refund",
      `Apakah Anda yakin ingin mengembalikan dana sebesar ${formatCurrency(totalPaid)}?`,
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Ya, Refund", 
          style: "destructive", 
          onPress: async () => {
            try {
              await createPaymentMutation.mutateAsync({
                id: Crypto.randomUUID(),
                userId: session?.user.id || "",
                bookingId: id as string,
                amount: -totalPaid,
                paymentMethod: "Refund",
                notes: "Pengembalian dana (Refund)",
                paymentDate: new Date().toISOString().split('T')[0],
                paymentType: "expense",
                createdAt: new Date().toISOString(),
              });
              showAlert("Sukses", "Refund berhasil dicatat.");
            } catch (error) {
              showAlert("Error", "Gagal mencatat refund.");
            }
          }
        }
      ]
    );

  };

  const handleDelete = () => {
    showAlert("Hapus Jadwal", "Yakin ingin menghapus jadwal ini?", [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: async () => {
        await deleteBookingMutation.mutateAsync(id as string);
        router.replace("/(tabs)/calendar");
      }}
    ]);

  };

  const updateStatus = async (newStatus: string) => {
    // Validasi Status vs Pembayaran
    if (newStatus === 'confirmed' && totalPaid <= 0) {
      showAlert("DP Belum Ada", "Status FIX (Confirmed) hanya bisa diaktifkan jika sudah ada pembayaran/DP masuk.");
      return;
    }

    if (newStatus === 'completed' && remainingBalance > 0) {
      showAlert("Belum Lunas", `Jadwal tidak bisa diselesaikan karena masih ada sisa tagihan sebesar ${formatCurrency(remainingBalance)}.`);
      return;
    }

    setStatusLoading(true);
    try {
      await updateBookingMutation.mutateAsync({
        id: id as string,
        updates: { status: newStatus }
      });
      // Beri jeda sedikit agar DB sync selesai sebelum refresh
      setTimeout(() => {
        showAlert("Sukses", `Status berhasil diubah ke ${newStatus === 'confirmed' ? 'FIX' : newStatus}`);
      }, 500);
    } catch (error) {
      showAlert("Error", "Gagal memperbarui status");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSendReminder = () => {
    // Susun label layanan dari eventType agar lebih deskriptif
    const layananLabel = booking.eventType 
      ? `Makeup ${booking.eventType}` 
      : "Makeup";

    const message = formatWhatsAppTemplate(waTemplates.reminder, {
      nama: client?.name || booking.clientName || "Klien",
      layanan: layananLabel,
      tanggal: booking.bookingDate,
      jam: booking.startTime
    });
    
    showAlert("Kirim Pengingat", "Pilih metode pengiriman:", [
      { text: "Batal", style: "cancel" },
      { text: "WhatsApp", onPress: () => sendWhatsApp(client?.phone || "", message) },
      { text: "Share Lainnya", onPress: () => Share.share({ message }) }
    ]);

  };

  if (loadingBooking) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#B76E79" />
        <Text className="text-text-hint mt-3">Memuat data jadwal...</Text>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center p-6">
        <Stack.Screen options={{ headerShown: false }} />
        <AlertCircle size={40} color="#B76E79" />
        <Text className="text-lg font-bold text-text-primary mt-4 text-center">Jadwal Tidak Ditemukan</Text>
        <Text className="text-text-secondary text-center mt-2">
          Jadwal ini mungkin sudah dihapus atau tidak tersedia.
        </Text>
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="mt-6 bg-primary px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-bold">Kembali</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      
      <SafeAreaView className="bg-surface border-b border-divider">
        <View className="flex-row items-center justify-between px-6 py-4">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2">
              <ChevronLeft size={24} color="#2D2D2D" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-text-primary">Detail Booking</Text>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity onPress={handleDelete} className="mr-4 p-2">
              <Trash2 size={22} color="#F44336" />
            </TouchableOpacity>
            <TouchableOpacity onPress={editMode ? handleSaveEdit : startEdit} className="p-2">
              <Text className="text-primary font-bold">{editMode ? "Simpan" : "Edit"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {/* Status Section */}
        <View className="mb-6">
           <Text className="text-text-hint font-bold uppercase text-xs mb-3">Status Jadwal</Text>
           <View className="flex-row gap-2">
              {[
                { id: 'pending', label: 'Pending', color: '#FF9800' },
                { id: 'confirmed', label: 'FIX', color: '#2196F3' },
                { id: 'completed', label: 'Selesai', color: '#4CAF50' },
                { id: 'cancelled', label: 'Batal', color: '#F44336' },
              ].map((s) => (
                <TouchableOpacity 
                  key={s.id}
                  onPress={() => updateStatus(s.id)}
                  disabled={statusLoading || editMode}
                  style={{ 
                    backgroundColor: booking.status === s.id ? s.color : '#F5F5F5',
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 12,
                    alignItems: 'center',
                    opacity: (statusLoading || editMode) ? 0.5 : 1
                  }}
                >
                   <Text style={{ color: booking.status === s.id ? 'white' : '#757575', fontWeight: 'bold', fontSize: 10 }}>
                     {s.label}
                   </Text>
                </TouchableOpacity>
              ))}
           </View>
        </View>

        {/* Client Info */}
        <Card className="mb-6 p-4">
           <View className="flex-row items-center mb-4">
              <View className="w-12 h-12 rounded-full bg-primary-light items-center justify-center mr-4">
                 <User size={24} color="#B76E79" />
              </View>
              <View className="flex-1">
                 <Text className="text-lg font-bold text-text-primary">{booking.clientName || client?.name || "Klien"}</Text>
                 <Text className="text-text-secondary">{client?.phone || "-"}</Text>
              </View>
              <View className="bg-primary/10 px-3 py-1 rounded-full flex-row items-center">
                <Users size={14} color="#B76E79" className="mr-1" />
                <Text className="text-primary font-bold">{booking.numPersons || 1} Orang</Text>
              </View>
           </View>
           {!editMode && (
             <View className="flex-row gap-2">
                <TouchableOpacity 
                  onPress={() => Linking.openURL(`whatsapp://send?phone=${client?.phone}`)}
                  className="flex-1 flex-row items-center justify-center bg-green-500 py-3 rounded-xl"
                >
                   <MessageSquare size={18} color="white" />
                   <Text className="text-white font-bold ml-2">WhatsApp</Text>
                </TouchableOpacity>
                <View className="flex-1">
                  <PremiumGate featureName="Invoice PDF & WA">
                    <TouchableOpacity 
                      onPress={() => router.push(`/booking/invoice/${booking.id}` as any)}
                      className="w-full flex-row items-center justify-center bg-primary py-3 rounded-xl"
                    >
                      <FileText size={18} color="white" />
                      <Text className="text-white font-bold ml-2">Invoice</Text>
                    </TouchableOpacity>
                  </PremiumGate>
                </View>
             </View>
           )}
        </Card>

        {/* Schedule Detail */}
        <View className="mb-6">
           <View className="flex-row justify-between items-center mb-3">
             <Text className="text-text-hint font-bold uppercase text-xs">Detail Jadwal</Text>
             {booking.eventType && <Badge label={booking.eventType} variant="info" />}
           </View>
           <Card className="p-4">
              {editMode ? (
                <>
                  <View className="flex-row gap-2 mb-4">
                    {["Akad", "Resepsi", "Fitting", "Rapat", "Lainnya"].map((t) => (
                      <TouchableOpacity 
                        key={t}
                        onPress={() => setEditData({...editData, eventType: t})}
                        className={`px-3 py-1 rounded-full border ${editData.eventType === t ? 'bg-primary border-primary' : 'bg-surface border-divider'}`}
                      >
                        <Text className={editData.eventType === t ? 'text-white text-[10px] font-bold' : 'text-text-secondary text-[10px]'}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity onPress={() => setDatePickerVisibility(true)} className="mb-4 border-b border-divider pb-2 flex-row items-center">
                    <CalendarIcon size={18} color="#B76E79" className="mr-3" />
                    <Text className="text-text-primary text-base">{editData.bookingDate}</Text>
                  </TouchableOpacity>
                  <View className="flex-row gap-4 mb-4">
                    <TouchableOpacity onPress={() => setStartTimeVisibility(true)} className="flex-1 border-b border-divider pb-2 flex-row items-center">
                      <Clock size={18} color="#B76E79" className="mr-3" />
                      <Text className="text-text-primary text-base font-bold">{editData.startTime}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setEndTimeVisibility(true)} className="flex-1 border-b border-divider pb-2 flex-row items-center">
                      <Clock size={18} color="#B76E79" className="mr-3" />
                      <Text className="text-text-primary text-base font-bold">{editData.endTime}</Text>
                    </TouchableOpacity>
                  </View>

                  {conflictInfo && (
                    <View className="bg-red-50 p-3 rounded-xl border border-red-100 mb-4 flex-row items-center">
                      <AlertCircle size={16} color="#F44336" className="mr-2" />
                      <View className="flex-1">
                        <Text className="text-status-error font-bold text-[10px] uppercase">BENTROK / MEPET</Text>
                        <Text className="text-text-primary text-[10px]">
                          {conflictInfo.clientName} ({conflictInfo.startTime} - {conflictInfo.endTime})
                        </Text>
                      </View>
                    </View>
                  )}

                  <View className="flex-row items-center mb-4">
                    <Users size={18} color="#B76E79" className="mr-3" />
                    <Text className="text-text-primary mr-4">Jumlah Orang:</Text>
                    <TouchableOpacity onPress={() => setEditData({...editData, numPersons: Math.max(1, editData.numPersons - 1)})} className="w-8 h-8 bg-gray-100 rounded items-center justify-center"><Text>-</Text></TouchableOpacity>
                    <Text className="mx-4 font-bold">{editData.numPersons}</Text>
                    <TouchableOpacity onPress={() => setEditData({...editData, numPersons: editData.numPersons + 1})} className="w-8 h-8 bg-gray-100 rounded items-center justify-center"><Text>+</Text></TouchableOpacity>
                  </View>
                  <Input value={editData.locationName} onChangeText={(t) => setEditData({...editData, locationName: t})} placeholder="Nama Lokasi" className="mb-4" />
                  <Input value={editData.locationAddress} onChangeText={(t) => setEditData({...editData, locationAddress: t})} placeholder="Alamat Lengkap" multiline />
                </>
              ) : (
                <>
                  <View className="flex-row items-center mb-4">
                     <CalendarIcon size={20} color="#B76E79" className="mr-3" />
                     <Text className="text-text-primary font-medium">{booking.bookingDate}</Text>
                  </View>
                  <View className="flex-row items-center mb-4">
                     <Clock size={20} color="#B76E79" className="mr-3" />
                     <Text className="text-text-primary font-medium">{booking.startTime} - {booking.endTime}</Text>
                  </View>
                  <View className="flex-row items-start">
                     <MapPin size={20} color="#B76E79" className="mr-3 mt-1" />
                     <View className="flex-1">
                        <Text className="text-text-primary font-medium">{booking.locationName || "Lokasi tidak ditentukan"}</Text>
                        <Text className="text-text-secondary text-sm">{booking.locationAddress}</Text>
                     </View>
                  </View>
                </>
              )}
           </Card>
        </View>

        {/* BRIDAL PARTY / DETAIL PER ORANG */}
        {showBridalParty && (
          <View className="mb-6">
             <View className="flex-row justify-between items-center mb-3">
               <Text className="text-text-hint font-bold uppercase text-xs">Detail Rias Per Orang</Text>
               <TouchableOpacity 
                 onPress={() => {
                   setMemberForm({ name: "", role: "", clothingDesc: "", clothingSize: "", makeupRequest: "", notes: "" });
                   setSelectedMember(null);
                   setMemberModalVisible(true);
                 }}
                 className="flex-row items-center"
               >
                  <Plus size={14} color="#B76E79" className="mr-1" />
                  <Text className="text-primary text-xs font-bold">Tambah Orang</Text>
               </TouchableOpacity>
             </View>

             {members.length === 0 ? (
               <Card className="p-6 border-dashed border-divider items-center">
                  <Text className="text-text-hint text-xs">Belum ada rincian orang yang dirias.</Text>
               </Card>
             ) : (
               members.map((m: any) => (
                 <Card key={m.id} className="mb-3 p-4 border-l-2 border-l-primary/30">
                    <View className="flex-row justify-between items-start mb-2">
                      <View>
                        <Text className="font-bold text-text-primary">{m.name}</Text>
                        <Text className="text-[10px] text-primary font-bold uppercase">{m.role || "Anggota"}</Text>
                      </View>
                      <View className="flex-row">
                        <TouchableOpacity 
                          onPress={() => {
                            setSelectedMember(m);
                            setMemberForm({ ...m });
                            setMemberModalVisible(true);
                          }}
                          className="p-1 mr-2"
                        >
                          <Edit2 size={14} color="#757575" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => {
                            showAlert("Hapus", `Hapus data ${m.name}?`, [
                              { text: "Batal", style: "cancel" },
                              { text: "Hapus", style: "destructive", onPress: () => deleteMemberMutation.mutate({ id: m.id, bookingId: id }) }
                            ]);

                          }}
                          className="p-1"
                        >
                          <Trash2 size={14} color="#F44336" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    <View className="flex-row flex-wrap gap-2">
                      {m.makeupRequest && (
                        <View className="bg-blue-50 px-2 py-1 rounded flex-row items-center">
                          <CheckCircle2 size={10} color="#2196F3" className="mr-1" />
                          <Text className="text-[10px] text-blue-700">Makeup: {m.makeupRequest}</Text>
                        </View>
                      )}
                      {m.clothingSize && (
                        <View className="bg-purple-50 px-2 py-1 rounded flex-row items-center">
                          <Tag size={10} color="#9C27B0" className="mr-1" />
                          <Text className="text-[10px] text-purple-700">Size: {m.clothingSize}</Text>
                        </View>
                      )}
                    </View>
                    {m.clothingDesc && (
                      <Text className="text-[11px] text-text-secondary mt-2 italic">Baju: {m.clothingDesc}</Text>
                    )}
                 </Card>
               ))
             )}
          </View>
        )}

        {/* Finance Info */}
        <View className="mb-6">
           <View className="flex-row justify-between items-center mb-3">
              <Text className="text-text-hint font-bold uppercase text-xs">Keuangan</Text>
              {!editMode && totalPaid > 0 && (
                <TouchableOpacity onPress={handleRefund} className="flex-row items-center">
                  <RotateCcw size={12} color="#F44336" className="mr-1" />
                  <Text className="text-status-error text-xs font-bold">Refund Dana</Text>
                </TouchableOpacity>
              )}
           </View>
           <Card className="p-4">
              <View className="flex-row justify-between mb-2">
                 <Text className="text-text-secondary">Total Biaya ({booking.numPersons || 1} org)</Text>
                 {editMode ? (
                   <View className="flex-row items-center">
                     <Text className="mr-1">Rp</Text>
                     <Input 
                       value={String(editData.totalPrice)} 
                       onChangeText={(t) => {
                         const val = Number(t);
                         setEditData({...editData, totalPrice: val});
                         // Jika user edit manual totalnya, update unitPrice agar pax selanjutnya ikut harga baru
                         if (editData.numPersons > 0) {
                           setUnitPrice(val / editData.numPersons);
                         }
                       }} 
                       keyboardType="numeric" 
                       className="w-24 h-8" 
                     />
                   </View>
                 ) : (
                   <Text className="text-text-primary font-bold">{formatCurrency(booking.totalPrice)}</Text>
                 )}
              </View>
              <View className="flex-row justify-between mb-2">
                 <Text className="text-text-secondary">Telah Dibayar</Text>
                 <Text className="text-status-success font-bold">{formatCurrency(totalPaid)}</Text>
              </View>
              <View className="h-[1] bg-divider my-2" />
              <View className="flex-row justify-between">
                 <Text className="text-text-primary font-bold">Sisa Tagihan</Text>
                 <Text className="text-status-error font-bold">{formatCurrency(remainingBalance)}</Text>
              </View>
              
               


              {!editMode && (
                <View className="flex-row gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    label="Kirim Pengingat" 
                    onPress={handleSendReminder} 
                    className="flex-1 rounded-xl" 
                    leftIcon={<MessageSquare size={18} color="#B76E79" />} 
                  />
                  {remainingBalance > 0 && (
                    <Button variant="primary" label="Bayar Sisa" className="flex-1 rounded-xl" onPress={() => router.push({ pathname: "/payment/new", params: { bookingId: booking.id, amount: remainingBalance } })} />
                  )}
                </View>
              )}
           </Card>
        </View>

        <DateTimePickerModal isVisible={isDatePickerVisible} mode="date" onConfirm={(date) => { setEditData({ ...editData, bookingDate: date.toISOString().split('T')[0] }); setDatePickerVisibility(false); }} onCancel={() => setDatePickerVisibility(false)} />
        <DateTimePickerModal isVisible={isStartTimeVisible} mode="time" is24Hour={true} onConfirm={(date) => { const time = date.getHours().toString().padStart(2, '0') + ":" + date.getMinutes().toString().padStart(2, '0'); setEditData({ ...editData, startTime: time }); setStartTimeVisibility(false); }} onCancel={() => setStartTimeVisibility(false)} />
        <DateTimePickerModal isVisible={isEndTimeVisible} mode="time" is24Hour={true} onConfirm={(date) => { const time = date.getHours().toString().padStart(2, '0') + ":" + date.getMinutes().toString().padStart(2, '0'); setEditData({ ...editData, endTime: time }); setEndTimeVisibility(false); }} onCancel={() => setEndTimeVisibility(false)} />
      </ScrollView>

      {/* MODAL DETAIL ORANG */}
      <Modal visible={memberModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="w-full"
          >
            <View className="bg-surface p-6 rounded-t-3xl h-[85%]">
               <View className="flex-row justify-between items-center mb-6">
                  <Text className="text-lg font-bold">{selectedMember ? "Edit Detail Rias" : "Tambah Detail Rias"}</Text>
                  <TouchableOpacity onPress={() => setMemberModalVisible(false)} className="p-2">
                    <Text className="text-primary font-bold">Tutup</Text>
                  </TouchableOpacity>
               </View>
               
               <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  <Input label="Nama Lengkap" value={memberForm.name} onChangeText={(t) => setMemberForm({...memberForm, name: t})} placeholder="Contoh: Ibu Siti" className="mb-4" />
                  <Input label="Peran / Role" value={memberForm.role} onChangeText={(t) => setMemberForm({...memberForm, role: t})} placeholder="Contoh: Ibu Pengantin / Pagar Ayu" className="mb-4" />
                  <Input label="Request Makeup" value={memberForm.makeupRequest} onChangeText={(t) => setMemberForm({...memberForm, makeupRequest: t})} placeholder="Contoh: Natural / Bold / Smokey" className="mb-4" />
                  
                  <View className="flex-row gap-4 mb-4">
                    <View className="flex-1">
                      <Input label="Ukuran Baju" value={memberForm.clothingSize} onChangeText={(t) => setMemberForm({...memberForm, clothingSize: t})} placeholder="XL / 42" />
                    </View>
                  </View>

                  <Input label="Deskripsi Baju" value={memberForm.clothingDesc} onChangeText={(t) => setMemberForm({...memberForm, clothingDesc: t})} placeholder="Contoh: Kebaya Biru Payet" multiline className="mb-4" />
                  <Input label="Catatan Tambahan" value={memberForm.notes} onChangeText={(t) => setMemberForm({...memberForm, notes: t})} placeholder="Misal: Alergi kosmetik tertentu" multiline className="mb-6" />
                  
                  <Button 
                    variant="primary" 
                    label="Simpan Detail" 
                    onPress={handleSaveMember} 
                    loading={createMemberMutation.isPending || updateMemberMutation.isPending} 
                    className="h-14 rounded-2xl mb-20" 
                  />
               </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}
