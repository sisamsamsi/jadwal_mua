import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDashboardStats } from "@/lib/hooks/use-dashboard";
import { useExpenses } from "@/lib/hooks/use-expenses";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/currency";
import { TrendingUp, TrendingDown, Receipt, Plus, ChevronRight, PieChart, Wallet, ArrowUpCircle, ArrowDownCircle } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function FinanceScreen() {
  const { stats } = useDashboardStats();
  const { data: expenses = [] } = useExpenses();
  const router = useRouter();

  const totalExpense = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
  const totalRevenue = stats?.totalRevenue ?? 0;
  const netProfit = totalRevenue - totalExpense;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View className="mb-8">
          <Text className="text-3xl font-bold text-text-primary">Keuangan</Text>
          <Text className="text-text-secondary">Ringkasan pendapatan & pengeluaran</Text>
        </View>

        {/* Laba Bersih Card */}
        <Card className="bg-primary p-6 mb-8 border-none shadow-xl shadow-primary/20">
          <Text className="text-white/80 text-sm font-medium uppercase mb-1">Total Saldo (Laba Bersih)</Text>
          <Text className="text-white text-4xl font-bold mb-6">{formatCurrency(netProfit)}</Text>
          
          <View className="flex-row justify-between pt-6 border-t border-white/20">
            <View>
              <Text className="text-white/60 text-xs mb-1">Total Pendapatan</Text>
              <View className="flex-row items-center">
                <TrendingUp size={14} color="#4CAF50" className="mr-1" />
                <Text className="text-white font-bold">{formatCurrencyCompact(totalRevenue)}</Text>
              </View>
            </View>
            <View>
              <Text className="text-white/60 text-xs mb-1">Total Pengeluaran</Text>
              <View className="flex-row items-center">
                <TrendingDown size={14} color="#FFCDD2" className="mr-1" />
                <Text className="text-white font-bold">{formatCurrencyCompact(totalExpense)}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Tombol Transaksi Utama */}
        <View className="flex-row gap-4 mb-8">
          <TouchableOpacity 
            onPress={() => router.push("/payment/new")}
            className="flex-1 bg-green-50 p-5 rounded-3xl border border-green-100 items-center justify-center"
          >
            <ArrowUpCircle size={32} color="#4CAF50" className="mb-2" />
            <Text className="font-bold text-green-700 text-sm">Pemasukan</Text>
            <Text className="text-green-600 text-[10px] uppercase font-bold">(Uang Masuk)</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push("/expense/new")}
            className="flex-1 bg-red-50 p-5 rounded-3xl border border-red-100 items-center justify-center"
          >
            <ArrowDownCircle size={32} color="#F44336" className="mb-2" />
            <Text className="font-bold text-red-700 text-sm">Pengeluaran</Text>
            <Text className="text-red-600 text-[10px] uppercase font-bold">(Uang Keluar)</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Links */}
        <View className="gap-y-4">
          <MenuLink 
            label="Riwayat Transaksi" 
            subLabel="Detail arus kas masuk & keluar"
            icon={<Receipt size={22} color="#B76E79" />} 
            onPress={() => router.push("/finance/transactions")} 
          />
          <MenuLink 
            label="Manajemen Invoice" 
            subLabel="Cek status DP & Pelunasan klien"
            icon={<PieChart size={22} color="#2196F3" />} 
            onPress={() => router.push("/finance/invoices")} 
          />
        </View>

        <View className="flex-row items-center justify-between mt-10 mb-4">
           <Text className="text-xl font-bold text-text-primary">Pengeluaran Terbaru</Text>
           <TouchableOpacity onPress={() => router.push("/finance/transactions")}>
              <Text className="text-primary font-bold">Lihat Semua</Text>
           </TouchableOpacity>
        </View>

        {expenses.length === 0 ? (
          <Card className="p-10 items-center bg-surface/50 border-dashed border-divider">
             <Text className="text-text-hint">Belum ada catatan pengeluaran</Text>
          </Card>
        ) : (
          expenses.slice(0, 5).map((expense: any) => (
            <Card key={expense.id} className="mb-3 p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-text-primary font-bold">{expense.description}</Text>
                  <Text className="text-text-hint text-xs">{expense.expenseDate} • {expense.category}</Text>
                </View>
                <Text className="text-status-error font-bold">- {formatCurrencyCompact(expense.amount)}</Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuLink({ label, subLabel, icon, onPress }: { label: string, subLabel: string, icon: any, onPress: () => void }) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className="bg-surface flex-row items-center justify-between p-5 rounded-3xl border border-divider shadow-sm"
    >
      <View className="flex-row items-center">
        <View className="w-12 h-12 bg-neutral-background rounded-2xl items-center justify-center mr-4">
          {icon}
        </View>
        <View className="flex-1">
          <Text className="text-text-primary font-bold text-lg">{label}</Text>
          <Text className="text-text-hint text-xs">{subLabel}</Text>
        </View>
      </View>
      <ChevronRight size={20} color="#BDBDBD" />
    </TouchableOpacity>
  );
}
