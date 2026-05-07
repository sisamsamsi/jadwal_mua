import React from "react";
import { View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useServices } from "@/lib/hooks/use-services";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ChevronLeft, Plus, Clock, Tag } from "lucide-react-native";
import { formatCurrency } from "@/lib/utils/currency";

export default function ServiceList() {
  const router = useRouter();
  const { data: services = [], isLoading } = useServices();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-6 py-4 bg-surface border-b border-divider">
        <View className="flex-row items-center">
          <Button variant="ghost" size="icon" onPress={() => router.back()} className="mr-2">
            <ChevronLeft {...({ size: 24, color: "#2D2D2D" } as any)} />
          </Button>
          <Text className="text-xl font-bold text-text-primary">Layanan</Text>
        </View>
        <Button 
          variant="primary" 
          size="icon" 
          onPress={() => router.push("/service/new" as any)}
          className="rounded-full"
        >
          <Plus {...({ size: 20, color: "white" } as any)} />
        </Button>
      </View>

      <FlatList
        data={services}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: 24 }}
        renderItem={({ item }: any) => (
          <Card 
            className="mb-4 p-4"
            onPress={() => router.push(`/service/${item.id}` as any)}
          >
            <View className="flex-row justify-between mb-2">
              <Text className="text-lg font-bold text-text-primary">{item.name}</Text>
              <Badge label={item.category} variant="info" />
            </View>
            <View className="flex-row items-center mb-3">
              <Clock {...({ size: 14, color: "#757575", className: "mr-1" } as any)} />
              <Text className="text-text-secondary text-sm mr-4">{item.durationMinutes} Menit</Text>
              <Tag {...({ size: 14, color: "#757575", className: "mr-1" } as any)} />
              <Text className="text-primary font-bold">{formatCurrency(item.basePrice)}</Text>
            </View>
            {item.description && (
              <Text className="text-text-hint text-sm" numberOfLines={2}>{item.description}</Text>
            )}
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

