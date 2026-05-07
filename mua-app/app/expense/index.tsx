import React from "react";
import { View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useExpenses } from "@/lib/hooks/use-expenses";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ChevronLeft, Plus, Receipt, TrendingDown } from "lucide-react-native";
import { formatCurrency } from "@/lib/utils/currency";

export default function ExpenseList() {
  const router = useRouter();
  const { data: expenses = [], isLoading } = useExpenses();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-6 py-4 bg-surface border-b border-divider">
        <View className="flex-row items-center">
          <Button variant="ghost" size="icon" onPress={() => router.back()} className="mr-2">
            <ChevronLeft {...({ size: 24, color: "#2D2D2D" } as any)} />
          </Button>
          <Text className="text-xl font-bold text-text-primary">Daftar Pengeluaran</Text>
        </View>
        <Button 
          variant="primary" 
          size="icon" 
          onPress={() => router.push("/expense/new")}
          className="rounded-full bg-status-error"
        >
          <Plus {...({ size: 20, color: "white" } as any)} />
        </Button>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24 }}
        renderItem={({ item }: any) => (
          <Card className="mb-4 p-4">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-red-50 rounded-xl items-center justify-center mr-3">
                  <TrendingDown {...({ size: 20, color: "#F44336" } as any)} />
                </View>
                <View>
                  <Text className="text-lg font-bold text-text-primary">{item.description}</Text>
                  <Text className="text-text-hint text-xs">{item.expenseDate} • {item.category}</Text>
                </View>
              </View>
              <Text className="text-status-error font-bold text-lg">- {formatCurrency(item.amount)}</Text>
            </View>
            {item.notes && (
              <View className="mt-2 pt-2 border-t border-divider">
                <Text className="text-text-secondary text-sm italic">"{item.notes}"</Text>
              </View>
            )}
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

