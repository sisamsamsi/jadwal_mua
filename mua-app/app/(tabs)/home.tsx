import React from "react";
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDashboardStats } from "@/lib/hooks/use-dashboard";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrencyCompact } from "@/lib/utils/currency";
import { Calendar, Users, DollarSign, Clock, Plus, ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { formatDate } from "@/lib/utils/date";

export default function DashboardScreen() {
  const { stats, isLoading } = useDashboardStats();
  const session = useAuthStore((s) => s.session);
  const router = useRouter();

  const userEmail = session?.user?.email ?? "MUA";
  const displayName = userEmail.split("@")[0];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView 
        contentContainerStyle={{ padding: 24 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => {}} />}
      >
        <View className="flex-row items-center justify-between mb-8">
          <View>
            <Text className="text-text-secondary text-lg">Halo, Selamat Pagi</Text>
            <Text className="text-text-primary text-3xl font-bold capitalize">{displayName} ✨</Text>
          </View>
          <Button 
            variant="primary" 
            size="icon" 
            onPress={() => router.push("/booking/new")}
            className="rounded-full w-14 h-14"
          >
            <Plus size={28} color="white" />
          </Button>
        </View>

        <View className="flex-row flex-wrap justify-between gap-y-4 mb-10">
          <StatCard 
            label="Revenue" 
            value={formatCurrencyCompact(stats?.totalRevenue ?? 0)} 
            icon={<DollarSign size={20} color="#B76E79" />}
            color="bg-primary-light/20"
          />
          <StatCard 
            label="Klien" 
            value={String(stats?.totalClients ?? 0)} 
            icon={<Users size={20} color="#2196F3" />}
            color="bg-blue-100"
          />
          <StatCard 
            label="Jadwal Hari Ini" 
            value={String(stats?.todayBookingsCount ?? 0)} 
            icon={<Calendar size={20} color="#4CAF50" />}
            color="bg-green-100"
          />
          <StatCard 
            label="Pending" 
            value={String(stats?.pendingBookings ?? 0)} 
            icon={<Clock size={20} color="#FF9800" />}
            color="bg-orange-100"
          />
        </View>

        {/* AGENDA HARI INI */}
        <Text className="text-xl font-bold text-text-primary mb-4">Agenda Hari Ini</Text>
        {stats?.todayBookings && stats.todayBookings.length > 0 ? (
          stats.todayBookings.map((booking: any) => (
            <BookingItem key={booking.id} booking={booking} onPress={() => router.push(`/booking/${booking.id}` as any)} />
          ))
        ) : (
          <Card className="items-center justify-center py-8 bg-surface/50 border-dashed border-divider mb-6">
            <Text className="text-text-hint text-center">Tidak ada jadwal untuk hari ini.</Text>
          </Card>
        )}

        {/* JADWAL MENDATANG */}
        <View className="flex-row items-center justify-between mt-4 mb-4">
          <Text className="text-xl font-bold text-text-primary">Jadwal Mendatang</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/calendar")}>
            <Text className="text-primary font-bold">Lihat Semua</Text>
          </TouchableOpacity>
        </View>

        {stats?.upcomingBookings && stats.upcomingBookings.length > 0 ? (
          stats.upcomingBookings.map((booking: any) => (
            <BookingItem 
              key={booking.id} 
              booking={booking} 
              showDate 
              onPress={() => router.push(`/booking/${booking.id}` as any)} 
            />
          ))
        ) : (
          <Card className="items-center justify-center py-8 bg-surface/50 border-dashed border-divider">
            <Text className="text-text-hint text-center">Belum ada jadwal mendatang.</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function BookingItem({ booking, onPress, showDate }: { booking: any, onPress: () => void, showDate?: boolean }) {
  return (
    <Card className="mb-4 p-4" onPress={onPress}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="w-12 h-12 rounded-full bg-secondary-light/20 items-center justify-center mr-4">
            <Text className="text-primary font-bold text-lg">{(booking.clientName || "K").substring(0, 1).toUpperCase()}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-text-primary font-bold text-base" numberOfLines={1}>{booking.clientName}</Text>
            <Text className="text-text-secondary text-xs">
              {showDate ? `${formatDate(booking.bookingDate, "dd MMM")} • ` : ""}{booking.startTime} - {booking.endTime}
            </Text>
          </View>
        </View>
        <ChevronRight size={18} color="#BDBDBD" />
      </View>
    </Card>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: string, icon: any, color: string }) {
  return (
    <View className="w-[48%] bg-surface rounded-2xl p-4 shadow-sm border border-divider">
      <View className={`w-10 h-10 ${color} rounded-xl items-center justify-center mb-3`}>
        {icon}
      </View>
      <Text className="text-text-hint text-[10px] font-bold uppercase mb-1">{label}</Text>
      <Text className="text-text-primary text-xl font-bold">{value}</Text>
    </View>
  );
}
