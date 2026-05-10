import React, { useState, useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Calendar } from "react-native-calendars";
import { useBookingsByDate, useBookings } from "@/lib/hooks/use-bookings";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Clock, MapPin, Plus } from "lucide-react-native";
import { formatDate } from "@/lib/utils/date";

const PASTEL_COLORS = [
  "#FFB3BA", // Pink Soft
  "#BAFFC9", // Green Soft
  "#BAE1FF", // Blue Soft
  "#FFFFBA", // Yellow Soft
  "#FFDFBA", // Orange Soft
  "#E0BBE4", // Purple Soft
];

export default function CalendarScreen() {
  const [selected, setSelected] = useState(new Date().toISOString().split("T")[0]);
  const router = useRouter();
  const { data: bookingsOnDate } = useBookingsByDate(selected);
  const { data: allBookings = [] } = useBookings();

  const markedDates = useMemo(() => {
    const marks: any = {};

    allBookings
      .filter((b: any) => b.status !== "cancelled")
      .forEach((b: any) => {
        const date = b.bookingDate;
        if (!marks[date]) {
          const colorIndex = Math.abs(date.split('-').join('') % PASTEL_COLORS.length);
          marks[date] = {
            customStyles: {
              container: {
                backgroundColor: PASTEL_COLORS[colorIndex],
                borderRadius: 12,
              },
              text: {
                color: '#2D2D2D',
                fontWeight: 'bold',
              },
            },
          };
        }
      });

    // Highlight Tanggal Terpilih (Warna Rose MUA)
    marks[selected] = {
      customStyles: {
        container: {
          backgroundColor: "#B76E79",
          borderRadius: 12,
          elevation: 4,
        },
        text: {
          color: 'white',
          fontWeight: 'bold',
        },
      },
    };

    return marks;
  }, [allBookings, selected]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 py-4 flex-row items-center justify-between">
        <Text className="text-3xl font-bold text-text-primary">Kalender</Text>
        <TouchableOpacity 
          onPress={() => router.push("/booking/new")}
          className="bg-primary p-3 rounded-full shadow-lg"
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View className="px-4">
        <Card className="p-0 overflow-hidden border-none shadow-md">
          <Calendar
            markingType={'custom'}
            onDayPress={(day: any) => setSelected(day.dateString)}
            markedDates={markedDates}
            theme={{
              calendarBackground: "#FFFFFF",
              textSectionTitleColor: "#BDBDBD",
              todayTextColor: "#B76E79",
              dayTextColor: "#2D2D2D",
              textDisabledColor: "#EEEEEE",
              arrowColor: "#B76E79",
              monthTextColor: "#2D2D2D",
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
          <Badge label={`${bookingsOnDate?.length ?? 0} Booking`} variant="info" />
        </View>

        <FlatList
          data={bookingsOnDate ?? []}
          keyExtractor={(item: any) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center py-10 bg-surface rounded-3xl border border-divider border-dashed">
              <Text className="text-text-hint text-center">Tidak ada jadwal untuk tanggal ini.{"\n"}Klik "+" untuk menambah jadwal.</Text>
            </View>
          }
          renderItem={({ item }: any) => (
            <Card 
              className="mb-4 p-4 border-l-4 border-l-primary"
              onPress={() => router.push(`/booking/${item.id}` as any)}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Clock size={14} color="#757575" className="mr-1" />
                  <Text className="text-text-secondary text-sm font-medium">
                    {item.startTime} - {item.endTime}
                  </Text>
                </View>
                <Badge 
                  label={item.status.toUpperCase()} 
                  variant={
                    item.status === 'completed' ? 'success' : 
                    item.status === 'cancelled' ? 'error' : 
                    item.status === 'confirmed' ? 'info' : 'warning'
                  } 
                />
              </View>
              <Text className="text-lg font-bold text-text-primary mb-1">{item.clientName}</Text>
              <View className="flex-row items-center">
                <MapPin size={14} color="#BDBDBD" className="mr-1" />
                <Text className="text-text-hint text-sm" numberOfLines={1}>{item.locationName ?? "Lokasi tidak ditentukan"}</Text>
              </View>
            </Card>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
