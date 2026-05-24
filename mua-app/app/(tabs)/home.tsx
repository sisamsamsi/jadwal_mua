import React, { useState } from "react";
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDashboardStats } from "@/lib/hooks/use-dashboard";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrencyCompact } from "@/lib/utils/currency";
import { Calendar, Users, DollarSign, Clock, Plus, ChevronRight, Filter, User, Settings } from "lucide-react-native";
import { useRouter } from "expo-router";
import { formatDate } from "@/lib/utils/date";
import { useQueryClient } from "@tanstack/react-query";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { useProfile } from "@/lib/hooks/use-profile";
import { Image } from "react-native";

const STATUS_FILTERS = [
  { id: 'all', label: 'Semua', color: 'bg-gray-100', text: 'text-gray-600' },
  { id: 'pending', label: 'Pending', color: 'bg-orange-100', text: 'text-orange-600' },
  { id: 'confirmed', label: 'Fix', color: 'bg-blue-100', text: 'text-blue-600' },
  { id: 'completed', label: 'Selesai', color: 'bg-green-100', text: 'text-green-600' },
  { id: 'cancelled', label: 'Batal', color: 'bg-red-100', text: 'text-red-600' },
];

export default function DashboardScreen() {
  const { stats, isLoading } = useDashboardStats();
  const session = useAuthStore((s) => s.session);
  const { showBridalParty } = useSettingsStore();
  const { data: profile } = useProfile();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState('all');
  const [stablePhotoUri, setStablePhotoUri] = useState<string | null>(null);

  React.useEffect(() => {
    if (profile?.profilePhotoUrl) {
      setStablePhotoUri(`${profile.profilePhotoUrl}?t=${Date.now()}`);
    } else {
      setStablePhotoUri(null);
    }
  }, [profile?.profilePhotoUrl]);

  useFocusEffect(
    React.useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    }, [])
  );

  const userEmail = session?.user?.email ?? "MUA Professional";
  const displayName = 
    session?.user?.user_metadata?.full_name ??
    session?.user?.user_metadata?.name ??
    userEmail.split("@")[0];
  const greetingName = displayName.split(" ")[0] || displayName;

  const onRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    await queryClient.invalidateQueries({ queryKey: ["bookings"] });
  };

  const filterBookings = (bookings: any[]) => {
    if (!bookings) return [];
    if (activeFilter === 'all') return bookings;
    return bookings.filter(b => b.status === activeFilter);
  };

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 11) return "Selamat Pagi";
    if (hours >= 11 && hours < 15) return "Selamat Siang";
    if (hours >= 15 && hours < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView 
        contentContainerStyle={{ padding: 24 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
      >
        <View className="flex-row items-center justify-between mb-8">
          <View className="flex-1 mr-4">
            <Text className="text-text-secondary text-lg">Halo, {getGreeting()}</Text>
            <Text numberOfLines={1} className="text-text-primary text-3xl font-bold capitalize">{greetingName} ✨</Text>
          </View>
          <View className="flex-row items-center flex-shrink-0">
            <TouchableOpacity 
              onPress={() => router.push("/settings")}
              className="w-12 h-12 rounded-full bg-white items-center justify-center shadow-sm border border-divider mr-3"
            >
               <Settings size={22} color="#757575" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => router.push("/(tabs)/profile")}
              className="w-14 h-14 rounded-full bg-white items-center justify-center shadow-sm border border-divider overflow-hidden"
            >
               {stablePhotoUri ? (
                <Image 
                  source={{ uri: stablePhotoUri }} 
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <View className="w-11 h-11 rounded-full bg-primary-light items-center justify-center">
                  <User size={24} color="#B76E79" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row flex-wrap justify-between gap-y-4 mb-8">
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

        {/* Filter Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 -mx-2 px-2">
          {STATUS_FILTERS.map(f => (
            <TouchableOpacity 
              key={f.id}
              onPress={() => setActiveFilter(f.id)}
              className={`mr-2 px-4 py-2 rounded-full border ${activeFilter === f.id ? 'bg-primary border-primary' : 'bg-surface border-divider'}`}
            >
              <Text className={`text-xs font-bold ${activeFilter === f.id ? 'text-white' : f.text}`}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* AGENDA HARI INI */}
        <Text className="text-xl font-bold text-text-primary mb-4">Agenda Hari Ini</Text>
        {filterBookings(stats?.todayBookings || []).length > 0 ? (
          filterBookings(stats?.todayBookings || []).map((booking: any) => (
            <BookingItem key={booking.id} booking={booking} onPress={() => router.push(`/booking/${booking.id}` as any)} />
          ))
        ) : (
          <Card className="items-center justify-center py-6 bg-surface/50 border-dashed border-divider mb-6">
            <Text className="text-text-hint text-center">Tidak ada jadwal {activeFilter !== 'all' ? activeFilter : ''} hari ini.</Text>
          </Card>
        )}

        {/* JADWAL MENDATANG */}
        <View className="flex-row items-center justify-between mt-4 mb-4">
          <Text className="text-xl font-bold text-text-primary">Jadwal Mendatang</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/calendar")}>
            <Text className="text-primary font-bold">Lihat Semua</Text>
          </TouchableOpacity>
        </View>

        {filterBookings(stats?.upcomingBookings || []).length > 0 ? (
          filterBookings(stats?.upcomingBookings || []).map((booking: any) => (
            <BookingItem 
              key={booking.id} 
              booking={booking} 
              showDate 
              onPress={() => router.push(`/booking/${booking.id}` as any)} 
            />
          ))
        ) : (
          <Card className="items-center justify-center py-6 bg-surface/50 border-dashed border-divider">
            <Text className="text-text-hint text-center">Belum ada jadwal {activeFilter !== 'all' ? activeFilter : ''} mendatang.</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function BookingItem({ booking, onPress, showDate }: { booking: any, onPress: () => void, showDate?: boolean }) {
  const { showBridalParty } = useSettingsStore();
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'confirmed': return 'info';
      case 'cancelled': return 'error';
      case 'pending': return 'warning';
      default: return 'warning';
    }
  };

  return (
    <Card className="mb-4 p-4" onPress={onPress}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="w-12 h-12 rounded-full bg-secondary-light/20 items-center justify-center mr-4">
            <Text className="text-primary font-bold text-lg">{(booking.clientName || "K").substring(0, 1).toUpperCase()}</Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Text className="text-text-primary font-bold text-base mr-2" numberOfLines={1}>{booking.clientName}</Text>
              <Badge label={booking.status === 'confirmed' ? 'FIX' : booking.status} variant={getStatusColor(booking.status)} />
            </View>
            <Text className="text-text-secondary text-xs">
              {showDate ? `${formatDate(booking.bookingDate, "dd MMM")} • ` : ""}{booking.startTime} - {booking.endTime} • {booking.numPersons || 1} Orang
            </Text>
            {showBridalParty && booking.numPersons > 1 && (booking.bridalPartyCount || 0) < booking.numPersons && (
              <View className="mt-2">
                <Badge 
                  label="Data Orang Belum Lengkap" 
                  variant="warning" 
                  className="bg-orange-50 border border-orange-200 py-1"
                />
              </View>
            )}
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
