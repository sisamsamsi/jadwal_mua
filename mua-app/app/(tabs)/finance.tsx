import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDashboardStats } from "@/lib/hooks/use-dashboard";
import { useExpenses } from "@/lib/hooks/use-expenses";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/currency";
import { TrendingUp, TrendingDown, Receipt, Plus, ChevronRight, PieChart } from "lucide-react-native";
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
        <View className="flex-row items-center justify-between mb-8">
          <Text className="text-3xl font-bold text-text-primary">Keuangan</Text>
          <View className="flex-row gap-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              onPress={() => router.push("/expense/new")}
              className="rounded-full border-status-error/30"
            >
              <TrendingDown {...({ size: 20, color: "#F44336" } as any)} />
            </Button>
            <Button 
              variant="primary" 
              size="icon" 
              onPress={() => router.push("/payment/new")}
              className="rounded-full"
            >
              <Plus {...({ size: 20, color: "white" } as any)} />
            </Button>
          </View>
        </View>

        <Card className="bg-primary p-6 mb-8 border-none">
          <Text className="text-white/80 text-sm font-medium uppercase mb-1">Total Laba Bersih</Text>
          <Text className="text-white text-4xl font-bold mb-6">{formatCurrency(netProfit)}</Text>
          
          <View className="flex-row justify-between pt-6 border-t border-white/20">
            <View>
              <Text className="text-white/60 text-xs mb-1">Total Pendapatan</Text>
              <View className="flex-row items-center">
                <TrendingUp {...({ size: 14, color: "#4CAF50" } as any)} className="mr-1" />
                <Text className="text-white font-bold">{formatCurrencyCompact(totalRevenue)}</Text>
              </View>
            </View>
            <View>
              <Text className="text-white/60 text-xs mb-1">Total Pengeluaran</Text>
              <View className="flex-row items-center">
                <TrendingDown {...({ size: 14, color: "#FFCDD2" } as any)} className="mr-1" />
                <Text className="text-white font-bold">{formatCurrencyCompact(totalExpense)}</Text>
              </View>
            </View>
          </View>
        </Card>

        <View className="gap-y-4">
          <MenuLink 
            label="Riwayat Transaksi" 
            icon={<Receipt {...({ size: 22, color: "#B76E79" } as any)} />} 
            onPress={() => router.push("/finance/transactions")} 
          />
          <MenuLink 
            label="Manajemen Invoice" 
            icon={<PieChart {...({ size: 22, color: "#2196F3" } as any)} />} 
            onPress={() => router.push("/finance/invoices")} 
          />
          <MenuLink 
            label="Daftar Pengeluaran" 
            icon={<TrendingDown {...({ size: 22, color: "#F44336" } as any)} />} 
            onPress={() => router.push("/expense")} 
          />
        </View>

        <Text className="text-xl font-bold text-text-primary mt-10 mb-4">Pengeluaran Terbaru</Text>
        {expenses.slice(0, 5).map((expense: any) => (
          <Card key={expense.id} className="mb-3 p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-text-primary font-bold">{expense.description}</Text>
                <Text className="text-text-hint text-xs">{expense.expenseDate} • {expense.category}</Text>
              </View>
              <Text className="text-status-error font-bold">- {formatCurrencyCompact(expense.amount)}</Text>
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuLink({ label, icon, onPress }: { label: string, icon: any, onPress: () => void }) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className="bg-surface flex-row items-center justify-between p-5 rounded-2xl border border-divider shadow-sm"
    >
      <View className="flex-row items-center">
        <View className="w-10 h-10 bg-neutral-background rounded-xl items-center justify-center mr-4">
          {icon}
        </View>
        <Text className="text-text-primary font-semibold text-lg">{label}</Text>
      </View>
      <ChevronRight {...({ size: 20, color: "#BDBDBD" } as any)} />
    </TouchableOpacity>
  );
}

