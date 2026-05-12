import React, { useState } from "react";
import { View, Text, ScrollView, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ChevronLeft, DollarSign, Calendar as CalendarIcon, Tag } from "lucide-react-native";
import { useCreateExpense } from "@/lib/hooks/use-expenses";
import { useAuthStore } from "@/lib/stores/auth-store";
import * as Crypto from "expo-crypto";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { format } from "date-fns";
import { useAlertStore } from "@/lib/stores/alert-store";

export default function NewExpense() {
  const router = useRouter();
  const createExpenseMutation = useCreateExpense();
  const session = useAuthStore(s => s.session);
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlertStore();
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: "",
    category: "Operasional",
    expenseDate: new Date().toISOString().split("T")[0],
    description: "",
  });

  const categories = ["Operasional", "Produk", "Marketing", "Gaji", "Lainnya"];

  const handleConfirmDate = (date: Date) => {
    setFormData(prev => ({ ...prev, expenseDate: format(date, "yyyy-MM-dd") }));
    setDatePickerVisibility(false);
  };

  const handleSave = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showAlert("Input Tidak Valid", "Masukkan jumlah pengeluaran yang valid.");
      return;
    }

    setLoading(true);
    try {
      const newExpense = {
        id: Crypto.randomUUID(),
        userId: session?.user.id || "",
        amount: parseFloat(formData.amount),
        category: formData.category,
        expenseDate: formData.expenseDate,
        description: formData.description,
        createdAt: new Date().toISOString(),
      };

      await createExpenseMutation.mutateAsync(newExpense);
      showAlert("Sukses", "Pengeluaran Anda berhasil dicatat.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error(error);
      showAlert("Error", "Gagal menyimpan pengeluaran. Silakan coba lagi.");
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
          <Text className="text-xl font-bold text-text-primary">Catat Pengeluaran</Text>
        </View>

        <ScrollView 
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          <Input 
            label="Jumlah Pengeluaran (Rp) *" 
            placeholder="0"
            value={formData.amount}
            onChangeText={(v) => setFormData(p => ({ ...p, amount: v }))}
            keyboardType="numeric"
            leftIcon={<DollarSign size={18} color="#BDBDBD" />}
          />

          <TouchableOpacity onPress={() => setDatePickerVisibility(true)}>
            <View pointerEvents="none">
              <Input 
                label="Tanggal Pengeluaran *" 
                value={formData.expenseDate}
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
            date={new Date(formData.expenseDate)}
          />

          <View className="mb-6 mt-4">
            <Text className="text-text-secondary text-sm font-bold mb-3 uppercase">Kategori</Text>
            <View className="flex-row flex-wrap gap-2">
              {categories.map((cat) => (
                <TouchableOpacity 
                  key={cat}
                  onPress={() => setFormData(p => ({ ...p, category: cat }))}
                  style={{
                    backgroundColor: formData.category === cat ? '#F44336' : '#FFFFFF',
                    borderColor: formData.category === cat ? '#F44336' : '#EEEEEE',
                  }}
                  className="px-4 py-2 rounded-xl border shadow-sm"
                >
                  <Text className={`font-bold ${formData.category === cat ? 'text-white' : 'text-text-secondary'}`}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Input 
            label="Deskripsi Pengeluaran" 
            placeholder="Misal: Beli Foundation, Bayar Listrik"
            value={formData.description}
            onChangeText={(v) => setFormData(p => ({ ...p, description: v }))}
            multiline
            numberOfLines={3}
            style={{ height: 80 }}
            leftIcon={<Tag size={18} color="#BDBDBD" />}
          />

          <Button 
            variant="primary" 
            label="Simpan Pengeluaran" 
            onPress={handleSave}
            loading={loading}
            className="mt-6 h-14 rounded-2xl"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
