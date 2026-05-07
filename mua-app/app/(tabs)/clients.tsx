import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useClients } from "@/lib/hooks/use-clients";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Search, Plus, User, Phone, MapPin } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function ClientsScreen() {
  const { data: clients = [], isLoading } = useClients();
  const [search, setSearch] = useState("");
  const router = useRouter();

  const filteredClients = clients.filter((c: any) => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.phone && c.phone.includes(search))
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 py-4">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-3xl font-bold text-text-primary">Daftar Klien</Text>
          <Button 
            variant="primary" 
            size="icon" 
            onPress={() => router.push("/client/new")}
            className="rounded-full"
          >
            <Plus {...({ size: 24, color: "white" } as any)} />
          </Button>
        </View>

        <Input
          placeholder="Cari nama atau nomor telepon..."
          value={search}
          onChangeText={setSearch}
          leftIcon={<Search {...({ size: 20, color: "#BDBDBD" } as any)} />}
          className="mb-0"
        />
      </View>

      <FlatList
        data={filteredClients}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: 24, paddingTop: 0 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-text-hint text-center">
              {search ? "Klien tidak ditemukan" : "Belum ada klien di database."}
            </Text>
          </View>
        }
        renderItem={({ item }: any) => (
          <Card 
            className="mb-4 p-4" 
            onPress={() => router.push(`/client/${item.id}` as any)}
          >
            <View className="flex-row items-center">
              <View className="w-14 h-14 rounded-2xl bg-primary-light/20 items-center justify-center mr-4">
                <User {...({ size: 28, color: "#B76E79" } as any)} />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-text-primary">{item.name}</Text>
                {item.phone && (
                  <View className="flex-row items-center mt-1">
                    <Phone {...({ size: 12, color: "#757575", className: "mr-1" } as any)} />
                    <Text className="text-text-secondary text-sm">{item.phone}</Text>
                  </View>
                )}
                {item.city && (
                  <View className="flex-row items-center mt-0.5">
                    <MapPin {...({ size: 12, color: "#BDBDBD", className: "mr-1" } as any)} />
                    <Text className="text-text-hint text-xs">{item.city}</Text>
                  </View>
                )}
              </View>
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

