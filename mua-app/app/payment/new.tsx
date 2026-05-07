import React, { useState } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ChevronLeft, DollarSign, Calendar, CreditCard, Receipt } from "lucide-react-native";

export default function NewPayment() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-6 py-4 border-b border-divider bg-surface">
        <Button variant="ghost" size="icon" onPress={() => router.back()} className="mr-2">
          <ChevronLeft {...({ size: 24, color: "#2D2D2D" } as any)} />
        </Button>
        <Text className="text-xl font-bold text-text-primary">Catat Pembayaran</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Input 
          label="Jumlah Pembayaran (Rp) *" 
          placeholder="0"
          keyboardType="numeric"
          leftIcon={<DollarSign {...({ size: 18, color: "#BDBDBD" } as any)} />}
        />

        <Input 
          label="Tanggal Pembayaran *" 
          value={new Date().toISOString().split("T")[0]}
          leftIcon={<Calendar {...({ size: 18, color: "#BDBDBD" } as any)} />}
        />

        <View className="mb-6">
          <Text className="text-text-secondary text-sm font-bold mb-2 uppercase">Metode Pembayaran</Text>
          <View className="flex-row gap-x-2">
            <MethodButton label="Transfer" active />
            <MethodButton label="Tunai" />
            <MethodButton label="E-Wallet" />
          </View>
        </View>

        <Input 
          label="Catatan" 
          placeholder="Misal: Pelunasan Wedding, DP 50%"
          multiline
          numberOfLines={3}
          style={{ height: 80 }}
          leftIcon={<Receipt {...({ size: 18, color: "#BDBDBD" } as any)} />}
        />

        <Button 
          variant="primary" 
          label="Simpan Pembayaran" 
          onPress={() => {
            Alert.alert("Sukses", "Pembayaran berhasil dicatat");
            router.back();
          }}
          className="mt-6 h-14"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function MethodButton({ label, active = false }: { label: string, active?: boolean }) {
  return (
    <TouchableOpacity 
      className={`px-4 py-2 rounded-xl border ${active ? 'bg-primary border-primary' : 'bg-surface border-divider'}`}
    >
      <Text className={`font-bold ${active ? 'text-white' : 'text-text-secondary'}`}>{label}</Text>
    </TouchableOpacity>
  );
}

import { TouchableOpacity } from "react-native";

