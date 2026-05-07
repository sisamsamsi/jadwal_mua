import React, { useState } from "react";
import { View, Text, ScrollView, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ChevronLeft, DollarSign, Calendar as CalendarIcon, Receipt } from "lucide-react-native";
import { useCreatePayment } from "@/lib/hooks/use-payments";
import { useAuthStore } from "@/lib/stores/auth-store";
import * as Crypto from "expo-crypto";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { format } from "date-fns";

export default function NewPayment() {
  const { bookingId, amount: initialAmount } = useLocalSearchParams();
  const router = useRouter();
  const createPaymentMutation = useCreatePayment();
  const session = useAuthStore(s => s.session);
  const [loading, setLoading] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: initialAmount ? String(initialAmount) : "",
    paymentMethod: "transfer",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: bookingId ? `Pembayaran booking` : "",
  });

  const handleConfirmDate = (date: Date) => {
    setFormData(prev => ({ ...prev, paymentDate: format(date, "yyyy-MM-dd") }));
    setDatePickerVisibility(false);
  };

  const handleSave = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      Alert.alert("Error", "Masukkan jumlah pembayaran yang valid");
      return;
    }

    setLoading(true);
    try {
      const newPayment = {
        id: Crypto.randomUUID(),
        userId: session?.user.id || "",
        bookingId: (bookingId as string) || "manual-entry",
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        paymentDate: formData.paymentDate,
        paymentType: "income",
        notes: formData.notes,
        createdAt: new Date().toISOString(),
      };

      await createPaymentMutation.mutateAsync(newPayment);
      Alert.alert("Sukses", "Pembayaran berhasil dicatat");
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal menyimpan pembayaran");
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
          <Text className="text-xl font-bold text-text-primary">Catat Pemasukan</Text>
        </View>

        <ScrollView 
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          <Input 
            label="Jumlah Pembayaran (Rp) *" 
            placeholder="0"
            value={formData.amount}
            onChangeText={(v) => setFormData(p => ({ ...p, amount: v }))}
            keyboardType="numeric"
            leftIcon={<DollarSign size={18} color="#BDBDBD" />}
          />

          <TouchableOpacity onPress={() => setDatePickerVisibility(true)}>
            <View pointerEvents="none">
              <Input 
                label="Tanggal Pembayaran *" 
                value={formData.paymentDate}
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
            date={new Date(formData.paymentDate)}
          />

          <View className="mb-6 mt-4">
            <Text className="text-text-secondary text-sm font-bold mb-3 uppercase">Metode Pembayaran</Text>
            <View className="flex-row flex-wrap gap-2">
              {["transfer", "tunai", "e-wallet"].map((method) => (
                <TouchableOpacity 
                  key={method}
                  onPress={() => setFormData(p => ({ ...p, paymentMethod: method }))}
                  style={{
                    backgroundColor: formData.paymentMethod === method ? '#B76E79' : '#FFFFFF',
                    borderColor: formData.paymentMethod === method ? '#B76E79' : '#EEEEEE',
                  }}
                  className="px-5 py-3 rounded-2xl border shadow-sm"
                >
                  <Text className={`font-bold capitalize ${formData.paymentMethod === method ? 'text-white' : 'text-text-secondary'}`}>
                    {method === "e-wallet" ? "E-Wallet" : method}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Input 
            label="Catatan" 
            placeholder="Misal: Pelunasan Wedding, DP 50%"
            value={formData.notes}
            onChangeText={(v) => setFormData(p => ({ ...p, notes: v }))}
            multiline
            numberOfLines={3}
            style={{ height: 80 }}
            leftIcon={<Receipt size={18} color="#BDBDBD" />}
          />

          <Button 
            variant="primary" 
            label="Simpan Pembayaran" 
            onPress={handleSave}
            loading={loading}
            className="mt-6 h-14 rounded-2xl"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
