import React from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { useBookings } from "@/lib/hooks/use-bookings";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChevronLeft, FileText, Share2, DollarSign } from "lucide-react-native";
import { formatCurrency } from "@/lib/utils/currency";

export default function InvoiceManagement() {
  const router = useRouter();
  const { data: bookings = [], isLoading } = useBookings();

  // Filter booking yang statusnya tidak batal untuk invoice
  const activeBookings = bookings.filter((b: any) => b.status !== "cancelled");

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      
      <View className="flex-row items-center px-6 py-4 border-b border-divider bg-surface">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2">
          <ChevronLeft size={24} color="#2D2D2D" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-text-primary">Manajemen Invoice</Text>
      </View>

      <FlatList
        data={activeBookings}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: 24 }}
        renderItem={({ item }: any) => {
          // Untuk sementara kita gunakan total price sebagai indikator tagihan
          return (
            <Card className="mb-4 p-5" onPress={() => router.push(`/booking/invoice/${item.id}` as any)}>
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1 mr-2">
                  <Text className="text-text-hint text-[10px] font-bold uppercase mb-1">
                    INV/{item.id.substring(0,8).toUpperCase()}
                  </Text>
                  <Text className="text-lg font-bold text-text-primary" numberOfLines={1}>
                    {item.client?.name || "Klien Umum"}
                  </Text>
                  <Text className="text-text-secondary text-xs">
                    {item.bookingDate} • {item.serviceName || "Layanan MUA"}
                  </Text>
                </View>
                <View className="items-end">
                   <Text className="text-primary font-bold text-lg">
                      {formatCurrency(item.totalPrice)}
                   </Text>
                   <View className={`px-2 py-1 rounded-full mt-1 ${item.status === 'completed' ? 'bg-status-success/10' : 'bg-status-warning/10'}`}>
                      <Text className={`text-[10px] font-bold ${item.status === 'completed' ? 'text-status-success' : 'text-status-warning'}`}>
                         {item.status === 'completed' ? 'LUNAS' : 'PENDING'}
                      </Text>
                   </View>
                </View>
              </View>

              <View className="flex-row gap-x-3 border-t border-divider pt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  label="Lihat Detail" 
                  className="flex-1 h-10 border-primary"
                  onPress={() => router.push(`/booking/invoice/${item.id}` as any)}
                />
                <Button 
                  variant="primary" 
                  size="sm" 
                  label="Invoice WA" 
                  leftIcon={<Share2 size={14} color="white" />}
                  className="flex-1 h-10"
                  onPress={() => router.push(`/booking/invoice/${item.id}` as any)}
                />
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20 bg-surface rounded-3xl border border-divider border-dashed mx-6">
            <FileText size={60} color="#E0E0E0" />
            <Text className="text-text-hint mt-4 font-medium">Belum ada invoice yang tersedia.</Text>
            <Text className="text-text-hint text-xs mt-1">Invoice muncul otomatis saat ada booking baru.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
