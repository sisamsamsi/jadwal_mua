import React, { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { bookingRepository } from "../../lib/repositories/booking-repository";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, Clock, MapPin, User, ChevronLeft } from "lucide-react-native";
import { formatDate } from "../../lib/utils/date";
import { formatCurrency } from "../../lib/utils/currency";
import { sendWhatsApp, getBookingReminderTemplate } from "../../lib/utils/whatsapp";
import { Alert } from "react-native";

export default function BookingDetail() {
  const { id } = useLocalSearchParams();
  const [booking, setBooking] = useState(null as any);
  const router = useRouter();

  useEffect(() => {
    if (id) {
      bookingRepository
        .getById(id as string)
        .then((b) => setBooking(b))
        .catch((e) => console.warn(e));
    }
  }, [id]);

  if (!booking) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text>Loading...</Text>
      </View>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed": return "success";
      case "pending": return "warning";
      case "cancelled": return "error";
      case "confirmed": return "info";
      default: return "default";
    }
  };

  const handleWhatsApp = () => {
    if (!booking.client?.phone) {
      Alert.alert("Error", "Nomor telepon klien tidak tersedia");
      return;
    }
    const message = getBookingReminderTemplate(
      booking.client.name,
      formatDate(booking.bookingDate),
      booking.startTime,
      booking.service?.name || "Makeup Service"
    );
    sendWhatsApp(booking.client.phone, message);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 py-4 flex-row items-center border-b border-divider">
        <Button 
          variant="ghost" 
          size="icon" 
          onPress={() => router.back()}
          className="mr-2"
        >
          <ChevronLeft {...({ size: 24, color: "#2D2D2D" } as any)} />
        </Button>
        <Text className="text-xl font-bold text-text-primary">Detail Jadwal</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Card className="mb-6">
          <CardHeader className="flex-row items-center justify-between">
            <View>
              <Text className="text-text-secondary text-sm">Status Booking</Text>
              <Badge label={booking.status} variant={getStatusVariant(booking.status)} className="mt-1" />
            </View>
            <Text className="text-2xl font-bold text-primary">{formatCurrency(booking.totalPrice)}</Text>
          </CardHeader>

          <CardContent className="gap-y-4">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-primary-light/20 rounded-full items-center justify-center mr-3">
                <User {...({ size: 20, color: "#B76E79" } as any)} />
              </View>
              <View>
                <Text className="text-text-secondary text-xs">Klien</Text>
                <Text className="text-text-primary font-semibold text-base">{booking.client?.name || booking.clientId}</Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-primary-light/20 rounded-full items-center justify-center mr-3">
                <Calendar {...({ size: 20, color: "#B76E79" } as any)} />
              </View>
              <View>
                <Text className="text-text-secondary text-xs">Tanggal</Text>
                <Text className="text-text-primary font-semibold text-base">{formatDate(booking.bookingDate)}</Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-primary-light/20 rounded-full items-center justify-center mr-3">
                <Clock {...({ size: 20, color: "#B76E79" } as any)} />
              </View>
              <View>
                <Text className="text-text-secondary text-xs">Waktu</Text>
                <Text className="text-text-primary font-semibold text-base">{booking.startTime} - {booking.endTime}</Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-primary-light/20 rounded-full items-center justify-center mr-3">
                <MapPin {...({ size: 20, color: "#B76E79" } as any)} />
              </View>
              <View className="flex-1">
                <Text className="text-text-secondary text-xs">Lokasi</Text>
                <Text className="text-text-primary font-semibold text-base" numberOfLines={2}>
                  {booking.locationName || "Lokasi tidak ditentukan"}
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {booking.notes && (
          <Card className="mb-6">
            <Text className="text-text-secondary text-sm mb-2">Catatan</Text>
            <Text className="text-text-primary leading-relaxed">{booking.notes}</Text>
          </Card>
        )}

        <Button 
          label="Edit Jadwal" 
          onPress={() => router.push(`/booking/${booking.id}/edit`)}
          className="mb-4"
        />
        <Button 
          variant="outline" 
          label="Hubungi Klien (WA)" 
          onPress={handleWhatsApp} 
        />
      </ScrollView>
    </SafeAreaView>
  );
}
