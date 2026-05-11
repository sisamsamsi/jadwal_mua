import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Share, Alert } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBooking } from "@/lib/hooks/use-bookings";
import { useClient } from "@/lib/hooks/use-clients";
import { useService } from "@/lib/hooks/use-services";
import { usePaymentsByBooking } from "@/lib/hooks/use-payments";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, Share2, Download, Printer, Scissors } from "lucide-react-native";
import { formatCurrency } from "@/lib/utils/currency";

export default function InvoiceScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const { data: booking } = useBooking(id as string);
  const { data: client } = useClient(booking?.clientId || "");
  const { data: service } = useService(booking?.serviceId || "");
  const { data: payments = [] } = usePaymentsByBooking(id as string);
  const { businessName, whatsappNumber, paymentInstructions } = useSettingsStore();

  const clientName = client?.name || booking?.clientName || "Klien";

  const totalPaid = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
  const remainingBalance = (booking?.totalPrice || 0) - totalPaid;

  const handleShare = async () => {
    const message = `
INVOICE ${businessName || "MUA"}
------------------
Klien: ${clientName}
Tanggal: ${booking?.bookingDate}
Layanan: ${service?.name || "Layanan Makeup"}

Total Biaya: ${formatCurrency(booking?.totalPrice || 0)}
Telah Dibayar: ${formatCurrency(totalPaid)}
Sisa Tagihan: ${formatCurrency(remainingBalance)}
------------------
Terima kasih!
    `;
    await Share.share({ message });
  };

  if (!booking) return null;

  return (
    <View className="flex-1 bg-neutral-background">
      <Stack.Screen options={{ headerShown: false }} />
      
      <SafeAreaView className="bg-surface border-b border-divider">
        <View className="flex-row items-center justify-between px-6 py-4">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2">
              <ChevronLeft size={24} color="#2D2D2D" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-text-primary">Invoice</Text>
          </View>
          <TouchableOpacity onPress={handleShare} className="p-2">
            <Share2 size={22} color="#B76E79" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Card className="bg-white p-8 shadow-sm">
          {/* Header Invoice */}
          <View className="items-center border-b-2 border-divider pb-6 mb-6">
            <Text className="text-xl font-bold text-text-primary mb-1 uppercase tracking-widest">{businessName || "MUA PROFESSIONAL"}</Text>
            <Text className="text-text-hint text-xs mb-4">{whatsappNumber}</Text>
            <View className="bg-primary/10 px-4 py-1 rounded-full mb-2">
              <Text className="text-primary font-bold">INVOICE</Text>
            </View>
            <Text className="text-text-hint text-[10px]">No: INV/{booking.id.substring(0,8).toUpperCase()}</Text>
          </View>

          {/* Info Klien */}
          <View className="flex-row justify-between mb-8">
            <View>
              <Text className="text-text-hint text-xs font-bold uppercase mb-1">Kepada:</Text>
              <Text className="text-lg font-bold text-text-primary">{clientName}</Text>
              <Text className="text-text-secondary text-sm">{client?.phone || "-"}</Text>
            </View>
            <View className="items-end">
              <Text className="text-text-hint text-xs font-bold uppercase mb-1">Tanggal Jadwal:</Text>
              <Text className="text-text-primary font-bold">{booking.bookingDate}</Text>
            </View>
          </View>

          {/* Rincian Layanan */}
          <View className="mb-8">
            <View className="flex-row justify-between border-b border-divider pb-2 mb-2">
              <Text className="text-text-hint text-xs font-bold">DESKRIPSI</Text>
              <Text className="text-text-hint text-xs font-bold">TOTAL</Text>
            </View>
            <View className="flex-row justify-between py-2">
              <View className="flex-1 mr-4">
                <Text className="text-text-primary font-bold">{service?.name || "Layanan Makeup"}</Text>
                <Text className="text-text-secondary text-xs">{booking.notes || "Tanpa catatan tambahan"}</Text>
              </View>
              <Text className="text-text-primary font-bold">{formatCurrency(booking.totalPrice)}</Text>
            </View>
          </View>

          {/* Total Ringkasan */}
          <View className="bg-neutral-background p-4 rounded-xl">
            <View className="flex-row justify-between mb-2">
              <Text className="text-text-secondary">Subtotal</Text>
              <Text className="text-text-primary">{formatCurrency(booking.totalPrice)}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-text-secondary">Telah Dibayar</Text>
              <Text className="text-status-success font-bold">{formatCurrency(totalPaid)}</Text>
            </View>
            <View className="h-[1] bg-divider my-2" />
            <View className="flex-row justify-between">
              <Text className="text-lg font-bold text-text-primary">Sisa Tagihan</Text>
              <Text className="text-lg font-bold text-status-error">{formatCurrency(remainingBalance)}</Text>
            </View>
          </View>

          {/* Metode Pembayaran */}
          {remainingBalance > 0 && (
            <View className="mt-8 p-4 border border-divider rounded-xl border-dashed">
              <Text className="text-text-hint text-[10px] font-bold uppercase mb-2">Instruksi Pembayaran:</Text>
              <Text className="text-text-primary font-bold text-sm">
                {paymentInstructions || "Transfer Bank / E-Wallet"}
              </Text>
            </View>
          )}

          <View className="mt-10 items-center">
             <View className="flex-row items-center mb-4">
                <Scissors size={16} color="#E0E0E0" />
                <View className="flex-1 h-[1] bg-divider mx-2 border-dashed" />
             </View>
             <Text className="text-text-hint text-xs italic">Terima kasih atas kepercayaan Anda menggunakan jasa kami.</Text>
          </View>
        </Card>

        <View className="flex-row gap-4 mt-8 mb-10">
           <Button 
             variant="outline" 
             label="Unduh PDF" 
             leftIcon={<Download size={18} color="#B76E79" />}
             className="flex-1 h-14 rounded-2xl border-primary"
             onPress={() => Alert.alert("Fitur Download", "Fungsi cetak PDF sedang disiapkan.")}
           />
           <Button 
             variant="primary" 
             label="Kirim WA" 
             leftIcon={<Share2 size={18} color="white" />}
             className="flex-1 h-14 rounded-2xl"
             onPress={handleShare}
           />
        </View>
      </ScrollView>
    </View>
  );
}
