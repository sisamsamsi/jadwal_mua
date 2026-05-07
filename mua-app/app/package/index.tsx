import React from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { usePackages } from "@/lib/hooks/use-packages";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChevronLeft, Plus, Star, Gift, ChevronRight } from "lucide-react-native";
import { formatCurrency } from "@/lib/utils/currency";

export default function PackageListScreen() {
  const router = useRouter();
  const { packages, isLoading } = usePackages();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ title: "Paket Layanan", headerShown: false }} />
      
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-divider bg-surface">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2">
            <ChevronLeft size={24} color="#2D2D2D" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-text-primary">Paket Layanan</Text>
        </View>
        <Button 
          variant="primary" 
          size="icon" 
          className="rounded-full"
          onPress={() => router.push("/package/new")}
        >
          <Plus size={20} color="white" />
        </Button>
      </View>

      <FlatList
        data={packages}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: 24 }}
        renderItem={({ item }: any) => (
          <TouchableOpacity 
            onPress={() => router.push(`/package/${item.id}` as any)}
            activeOpacity={0.7}
          >
            <Card className="mb-4 p-5">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 bg-secondary-light/30 rounded-xl items-center justify-center mr-3">
                    <Star size={20} color="#D4A574" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-text-primary" numberOfLines={1}>{item.name}</Text>
                    <Text className="text-primary font-bold text-base">{formatCurrency(item.totalPrice)}</Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#BDBDBD" />
              </View>
              <Text className="text-text-secondary text-sm" numberOfLines={2}>
                {item.description || "Tidak ada deskripsi paket."}
              </Text>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Gift size={60} color="#E0E0E0" />
            <Text className="text-text-hint mt-4 text-center">
              Belum ada paket layanan.{"\n"}Buat paket untuk memudahkan booking!
            </Text>
            <Button 
              variant="primary" 
              label="Buat Paket Pertama" 
              className="mt-6 px-8"
              onPress={() => router.push("/package/new")}
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}
