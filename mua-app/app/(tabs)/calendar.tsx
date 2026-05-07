import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Calendar } from "react-native-calendars";
import { useBookingsByDate } from "@/lib/hooks/use-bookings";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Clock, MapPin, User } from "lucide-react-native";
import { formatDate } from "@/lib/utils/date";

export default function CalendarScreen() {
  const [selected, setSelected] = useState(
    new Date().toISOString().split("T")[0]
  );
  const router = useRouter();
  const { data: bookings, isLoading } = useBookingsByDate(selected);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 py-4">
        <Text className="text-3xl font-bold text-text-primary">Kalender</Text>
      </View>

      <View className="px-4">
        <Card className="p-0 overflow-hidden border-none shadow-md">
          <Calendar
            onDayPress={(day: any) => setSelected(day.dateString)}
            markedDates={{
              [selected]: {
                selected: true,
                selectedColor: "#B76E79",
                selectedTextColor: "white",
              },
            }}
            theme={{
              calendarBackground: "#FFFFFF",
              textSectionTitleColor: "#BDBDBD",
              selectedDayBackgroundColor: "#B76E79",
              selectedDayTextColor: "#ffffff",
              todayTextColor: "#B76E79",
              dayTextColor: "#2D2D2D",
              textDisabledColor: "#EEEEEE",
              dotColor: "#B76E79",
              selectedDotColor: "#ffffff",
              arrowColor: "#B76E79",
              monthTextColor: "#2D2D2D",
              indicatorColor: "#B76E79",
              textDayFontWeight: "500",
              textMonthFontWeight: "bold",
              textDayHeaderFontWeight: "bold",
            }}
          />
        </Card>
      </View>

      <View className="flex-1 px-4 mt-6">
        <View className="flex-row items-center justify-between mb-4 px-2">
          <Text className="text-lg font-bold text-text-primary">
            Jadwal {selected === new Date().toISOString().split("T")[0] ? "Hari Ini" : formatDate(selected, "dd MMM")}
          </Text>
          <Badge label={`${bookings?.length ?? 0} Booking`} variant="info" />
        </View>

        <FlatList
          data={bookings ?? []}
          keyExtractor={(item: any) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center py-10">
              <Text className="text-text-hint">Tidak ada jadwal untuk hari ini</Text>
            </View>
          }
          renderItem={({ item }: any) => {
            return (
              <Card 
                className="mb-4 p-4 border-l-4 border-l-primary"
                onPress={() => router.push(`/booking/${item.id}`)}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <View className="mr-1">
                      <Clock {...({ size: 14, color: "#757575" } as any)} />
                    </View>
                    <Text className="text-text-secondary text-sm font-medium">
                      {item.startTime} - {item.endTime}
                    </Text>
                  </View>
                  <Badge label={item.status} variant={item.status === 'completed' ? 'success' : 'warning'} />
                </View>
                
                <Text className="text-lg font-bold text-text-primary mb-1">
                  {item.clientId}
                </Text>
                
                <View className="flex-row items-center">
                  <View className="mr-1">
                    <MapPin {...({ size: 14, color: "#BDBDBD" } as any)} />
                  </View>
                  <Text className="text-text-hint text-sm" numberOfLines={1}>
                    {item.locationName ?? "Lokasi tidak ditentukan"}
                  </Text>
                </View>
              </Card>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

