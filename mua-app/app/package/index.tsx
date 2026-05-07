import React from "react";
import { View, Text, ScrollView, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChevronLeft, Plus, Star, Gift } from "lucide-react-native";

export default function PackageListScreen() {
  const router = useRouter();

  // Mock data for now
  const packages = [
    { id: "1", name: "Wedding Bronze", price: 2500000, description: "Makeup + Hairdo untuk 1 orang" },
    { id: "2", name: "Wedding Gold", price: 5000000, description: "Makeup + Hairdo untuk Pengantin & 2 Keluarga" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-divider bg-surface">
        <View className="flex-row items-center">
          <Button variant="ghost" size="icon" onPress={() => router.back()} className="mr-2">
            <ChevronLeft {...({ size: 24, color: "#2D2D2D" } as any)} />
          </Button>
          <Text className="text-xl font-bold text-text-primary">Paket Layanan</Text>
        </View>
        <Button variant="primary" size="icon" className="rounded-full">
          <Plus {...({ size: 20, color: "white" } as any)} />
        </Button>
      </View>

      <FlatList
        data={packages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24 }}
        renderItem={({ item }) => (
          <Card className="mb-4 p-5">
            <View className="flex-row items-center mb-2">
              <View className="w-10 h-10 bg-secondary-light/30 rounded-xl items-center justify-center mr-3">
                <Star {...({ size: 20, color: "#D4A574" } as any)} />
              </View>
              <View>
                <Text className="text-lg font-bold text-text-primary">{item.name}</Text>
                <Text className="text-primary font-bold text-base">Rp {(item.price / 1000000).toFixed(1)}jt</Text>
              </View>
            </View>
            <Text className="text-text-secondary text-sm mb-4">{item.description}</Text>
            <Button variant="outline" label="Edit Paket" className="h-10" />
          </Card>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Gift {...({ size: 60, color: "#E0E0E0" } as any)} />
            <Text className="text-text-hint mt-4 text-center">Belum ada paket layanan.{"\n"}Buat paket untuk memudahkan booking!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

