import React from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { usePayments, useDeletePayment } from "@/lib/hooks/use-payments";
import { useExpenses, useDeleteExpense } from "@/lib/hooks/use-expenses";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChevronLeft, TrendingUp, TrendingDown, Filter, Trash2 } from "lucide-react-native";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/currency";
import { showAlert } from "@/lib/utils/alert";

export default function TransactionHistory() {
  const router = useRouter();
  const { data: payments = [], isLoading: loadingPayments } = usePayments();
  const { data: expenses = [], isLoading: loadingExpenses } = useExpenses();
  const deletePayment = useDeletePayment();
  const deleteExpense = useDeleteExpense();

  // Gabungkan dan urutkan berdasarkan tanggal terbaru
  const allTransactions = [
    ...payments.map((p: any) => ({ 
      ...p, 
      type: p.paymentType === 'expense' ? 'expense' : 'income',
      displayDescription: p.notes || (p.paymentType === 'expense' ? 'Refund' : 'Pemasukan')
    })),
    ...expenses.map((e: any) => ({ 
      ...e, 
      type: 'expense',
      displayDescription: e.description
    }))
  ].sort((a, b) => new Date(b.createdAt || b.expenseDate).getTime() - new Date(a.createdAt || a.expenseDate).getTime());

  const isLoading = loadingPayments || loadingExpenses;

  const handleDelete = (item: any) => {
    showAlert(
      "Hapus Transaksi",
      `Apakah Anda yakin ingin menghapus transaksi "${item.displayDescription}"?`,
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Hapus", 
          style: "destructive", 
          onPress: async () => {
            try {
              if (item.paymentType || item.bookingId) { // Ini dari tabel payments
                await deletePayment.mutateAsync(item.id);
              } else { // Ini dari tabel expenses
                await deleteExpense.mutateAsync(item.id);
              }
              showAlert("Berhasil", "Transaksi telah dihapus.");
            } catch (e) {
              showAlert("Error", "Gagal menghapus transaksi.");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-divider bg-surface">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2">
            <ChevronLeft size={24} color="#2D2D2D" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-text-primary">Riwayat Transaksi</Text>
        </View>
        <TouchableOpacity className="p-2">
          <Filter size={20} color="#B76E79" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={allTransactions}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: 24 }}
        refreshing={isLoading}
        renderItem={({ item }: any) => (
          <Card className="mb-4 p-4">
             <View className="flex-row justify-between items-center">
                <View className="flex-row items-center flex-1">
                   <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${item.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {item.type === 'income' ? 
                        <TrendingUp size={18} color="#4CAF50" /> : 
                        <TrendingDown size={18} color="#F44336" />
                      }
                   </View>
                   <View className="flex-1">
                     <Text className="font-bold text-text-primary text-base" numberOfLines={1}>
                       {item.description || item.notes || (item.type === 'income' ? 'Pemasukan' : 'Pengeluaran')}
                     </Text>
                     <Text className="text-text-hint text-xs">
                       {item.paymentDate || item.expenseDate} • {item.paymentMethod || item.category}
                     </Text>
                   </View>
                </View>
                 <View className="flex-row items-center">
                    <Text className={`font-bold text-base mr-3 ${item.type === 'income' ? 'text-status-success' : 'text-status-error'}`}>
                      {item.type === 'income' ? '+' : '-'} {formatCurrencyCompact(Math.abs(item.amount))}
                    </Text>
                    <TouchableOpacity onPress={() => handleDelete(item)} className="p-2">
                       <Trash2 size={16} color="#F44336" />
                    </TouchableOpacity>
                 </View>
             </View>
          </Card>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-text-hint text-center">Belum ada riwayat transaksi.{"\n"}Ayo catat pemasukan pertama Anda!</Text>
            <Button 
              variant="primary" 
              label="Catat Pemasukan" 
              className="mt-6" 
              onPress={() => router.push("/payment/new")} 
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}
