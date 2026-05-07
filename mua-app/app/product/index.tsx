import React from "react";
import { View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useProducts } from "@/lib/hooks/use-products";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ChevronLeft, Plus, Box, AlertTriangle } from "lucide-react-native";

export default function ProductList() {
  const router = useRouter();
  const { data: products = [], isLoading } = useProducts();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-6 py-4 bg-surface border-b border-divider">
        <View className="flex-row items-center">
          <Button variant="ghost" size="icon" onPress={() => router.back()} className="mr-2">
            <ChevronLeft {...({ size: 24, color: "#2D2D2D" } as any)} />
          </Button>
          <Text className="text-xl font-bold text-text-primary">Inventaris Produk</Text>
        </View>
        <Button 
          variant="primary" 
          size="icon" 
          onPress={() => router.push("/product/new")}
          className="rounded-full"
        >
          <Plus {...({ size: 20, color: "white" } as any)} />
        </Button>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24 }}
        renderItem={({ item }: any) => {
          const isLowStock = item.currentStock <= item.minimumStock;
          return (
            <Card className="mb-4 p-4">
              <View className="flex-row justify-between mb-2">
                <View className="flex-1">
                  <Text className="text-lg font-bold text-text-primary">{item.name}</Text>
                  <Text className="text-text-secondary text-sm">{item.brand || 'No Brand'} • {item.category}</Text>
                </View>
                <View className="items-end">
                  <Text className={`text-xl font-bold ${isLowStock ? 'text-status-error' : 'text-primary'}`}>
                    {item.currentStock}
                  </Text>
                  <Text className="text-text-hint text-[10px] uppercase font-bold">Stok</Text>
                </View>
              </View>
              
              {isLowStock && (
                <View className="flex-row items-center mt-2 bg-red-50 p-2 rounded-lg">
                  <AlertTriangle {...({ size: 14, color: "#F44336", className: "mr-2" } as any)} />
                  <Text className="text-status-error text-xs font-medium">Peringatan: Stok menipis!</Text>
                </View>
              )}
            </Card>
          );
        }}
      />
    </SafeAreaView>
  );
}

