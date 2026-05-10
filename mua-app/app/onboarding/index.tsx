import React, { useState, useRef } from "react";
import { View, Text, FlatList, Dimensions, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { Sparkles, Users, Briefcase, ArrowRight } from "lucide-react-native";

const { width } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    title: "Booking Cerdas",
    description: "Catat jadwal MUA Anda lebih cepat dengan bantuan AI. Tempel pesan WA dan biarkan AI mengisi datanya.",
    icon: <Sparkles size={80} color="#B76E79" />,
  },
  {
    id: "2",
    title: "Manajemen Klien",
    description: "Simpan data pelanggan dengan rapi. Kirim pengingat otomatis agar tidak ada jadwal yang terlewat.",
    icon: <Users size={80} color="#B76E79" />,
  },
  {
    id: "3",
    title: "Bisnis Modern",
    description: "Kelola layanan, paket, dan inventaris Anda dalam satu aplikasi profesional yang minimalis.",
    icon: <Briefcase size={80} color="#B76E79" />,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);
  const [activeSlide, setActiveSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (activeSlide < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeSlide + 1 });
      setActiveSlide(activeSlide + 1);
    } else {
      completeOnboarding();
      router.replace("/(tabs)" as any);
    }
  };

  const renderItem = ({ item }: { item: typeof slides[0] }) => (
    <View style={{ width }} className="items-center justify-center px-10">
      <View className="w-48 h-48 bg-primary/5 rounded-full items-center justify-center mb-10">
        {item.icon}
      </View>
      <Text className="text-3xl font-bold text-text-primary text-center mb-4">
        {item.title}
      </Text>
      <Text className="text-text-secondary text-center text-lg leading-6 px-4">
        {item.description}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveSlide(index);
        }}
        keyExtractor={(item) => item.id}
      />

      <View className="px-10 pb-12">
        <View className="flex-row justify-center mb-10 gap-x-2">
          {slides.map((_, i) => (
            <View 
              key={i} 
              className={`h-2 rounded-full ${i === activeSlide ? "w-8 bg-primary" : "w-2 bg-divider"}`}
            />
          ))}
        </View>

        <TouchableOpacity 
          onPress={handleNext}
          className="bg-primary h-16 rounded-2xl flex-row items-center justify-center"
        >
          <Text className="text-white font-bold text-lg mr-2">
            {activeSlide === slides.length - 1 ? "Mulai Sekarang" : "Lanjut"}
          </Text>
          <ArrowRight size={20} color="white" />
        </TouchableOpacity>
        
        {activeSlide < slides.length - 1 && (
          <TouchableOpacity 
            onPress={() => { completeOnboarding(); router.replace("/(tabs)" as any); }}
            className="mt-4 items-center"
          >
            <Text className="text-text-hint font-medium">Lewati</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
