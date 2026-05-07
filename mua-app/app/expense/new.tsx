import React, { useState } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCreateExpense } from "@/lib/hooks/use-expenses";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ChevronLeft, Receipt, Tag, Calendar, DollarSign } from "lucide-react-native";
import { v4 as uuidv4 } from "uuid";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function NewExpense() {
  const router = useRouter();
  const createExpenseMutation = useCreateExpense();
  const session = useAuthStore(s => s.session);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    category: "Product",
    amount: "0",
    expenseDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const handleSave = async () => {
    if (!formData.description || !formData.amount) {
      Alert.alert("Error", "Deskripsi dan jumlah pengeluaran wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const newExpense = {
        id: uuidv4(),
        userId: session?.user.id || "",
        description: formData.description,
        category: formData.category,
        amount: parseFloat(formData.amount),
        expenseDate: formData.expenseDate,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
      };

      await createExpenseMutation.mutateAsync(newExpense);
      Alert.alert("Sukses", "Pengeluaran berhasil dicatat");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Gagal menyimpan pengeluaran");
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
        <Text className="text-xl font-bold text-text-primary">Catat Pengeluaran</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Input 
          label="Deskripsi Pengeluaran *" 
          placeholder="Misal: Beli Foundation, Transport Wedding"
          value={formData.description} 
          onChangeText={(v) => setFormData(p => ({ ...p, description: v }))}
          leftIcon={<Receipt {...({ size: 18, color: "#BDBDBD" } as any)} />}
        />
        
        <Input 
          label="Kategori" 
          placeholder="Product, Transport, Equipment, Rent, dll"
          value={formData.category} 
          onChangeText={(v) => setFormData(p => ({ ...p, category: v }))}
          leftIcon={<Tag {...({ size: 18, color: "#BDBDBD" } as any)} />}
        />

        <View className="flex-row justify-between">
          <View className="w-[48%]">
            <Input 
              label="Tanggal" 
              value={formData.expenseDate} 
              onChangeText={(v) => setFormData(p => ({ ...p, expenseDate: v }))}
              leftIcon={<Calendar {...({ size: 18, color: "#BDBDBD" } as any)} />}
            />
          </View>
          <View className="w-[48%]">
            <Input 
              label="Jumlah (Rp) *" 
              value={formData.amount} 
              onChangeText={(v) => setFormData(p => ({ ...p, amount: v }))}
              keyboardType="numeric"
              leftIcon={<DollarSign {...({ size: 18, color: "#BDBDBD" } as any)} />}
            />
          </View>
        </View>

        <Input 
          label="Catatan" 
          placeholder="Catatan tambahan..."
          value={formData.notes} 
          onChangeText={(v) => setFormData(p => ({ ...p, notes: v }))}
          multiline
          numberOfLines={3}
          style={{ height: 80 }}
        />

        <Button 
          variant="primary" 
          label={loading ? "Menyimpan..." : "Simpan Pengeluaran"} 
          onPress={handleSave}
          loading={loading}
          className="mt-6 h-14"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

