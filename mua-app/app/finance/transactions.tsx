import React from "react";
import { View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChevronLeft, TrendingUp, TrendingDown } from "lucide-react-native";
import { formatCurrency } from "@/lib/utils/currency";

export default function TransactionHistory() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-6 py-4 border-b border-divider bg-surface">
        <Button variant="ghost" size="icon" onPress={() => router.back()} className="mr-2">
          <ChevronLeft {...({ size: 24, color: "#2D2D2D" } as any)} />
        </Button>
        <Text className="text-xl font-bold text-text-primary">Riwayat Transaksi</Text>
      </View>

      <FlatList
        data={[]}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: 24 }}
        renderItem={({ item }: any) => (
          <Card className="mb-4 p-4">
             <View className="flex-row justify-between items-center">
                <View>
                  <Text className="font-bold text-text-primary">{item.description}</Text>
                  <Text className="text-text-hint text-xs">{item.date}</Text>
                </View>
                <Text className={item.type === 'income' ? 'text-status-success' : 'text-status-error'}>
                  {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                </Text>
             </View>
          </Card>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-text-hint">Belum ada riwayat transaksi.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

