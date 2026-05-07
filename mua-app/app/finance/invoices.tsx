import React from "react";
import { View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChevronLeft, FileText, Download, Share2 } from "lucide-react-native";
import { formatCurrency } from "@/lib/utils/currency";

export default function InvoiceManagement() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-6 py-4 border-b border-divider bg-surface">
        <Button variant="ghost" size="icon" onPress={() => router.back()} className="mr-2">
          <ChevronLeft {...({ size: 24, color: "#2D2D2D" } as any)} />
        </Button>
        <Text className="text-xl font-bold text-text-primary">Manajemen Invoice</Text>
      </View>

      <FlatList
        data={[]}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: 24 }}
        renderItem={({ item }: any) => (
          <Card className="mb-4 p-4">
             <View className="flex-row justify-between items-center mb-4">
                <View>
                  <Text className="font-bold text-text-primary">INV-{item.number}</Text>
                  <Text className="text-text-hint text-xs">{item.clientName}</Text>
                </View>
                <Text className="font-bold text-lg">{formatCurrency(item.total)}</Text>
             </View>
             <View className="flex-row gap-x-2">
                <Button variant="outline" size="sm" label="Download" className="flex-1 h-9" />
                <Button variant="primary" size="sm" label="Kirim WA" className="flex-1 h-9" />
             </View>
          </Card>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <FileText {...({ size: 60, color: "#E0E0E0" } as any)} />
            <Text className="text-text-hint mt-4">Belum ada invoice yang dibuat.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

