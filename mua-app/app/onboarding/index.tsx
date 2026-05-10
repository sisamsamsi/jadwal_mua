import React, { useState, useRef } from "react";
import { View, Text, ScrollView, Dimensions, TouchableOpacity, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { Sparkles, Calendar, Users, ArrowRight } from "lucide-react-native";

const { width } = Dimensions.get("window");

const slides = [
  {
    title: "Booking Cerdas",
    description: "Catat jadwal MUA Anda lebih cepat dengan bantuan AI. Tempel pesan WA dan biarkan AI mengisi datanya.",
    icon: <Sparkles size={80} color="#B76E79" />,
  },
  {
    title: "Manajemen Klien",
    description: "Simpan data pelanggan dengan rapi. Kirim pengingat otomatis agar tidak ada jadwal yang terlewat.",
    icon: <Users size={80} color="#B76E79" />,
  },
  {
    title: "Bisnis Modern",
    description: "Kelola layanan, paket, dan inventaris Anda dalam satu aplikasi profesional yang minimalis.",
    icon: <Calendar size={80} color="#B76E79" />,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (activeSlide < slides.length - 1) {
      // Scroll logic would go here if using a flatlist, 
      // but for simplicity we can just track index or use a simple swiper
      setActiveSlide(activeSlide + 1);
    } else {
      completeOnboarding();
      router.replace("/(tabs)" as any);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-10">
        <View className="w-48 h-48 bg-primary/5 rounded-full items-center justify-center mb-10">
          {slides[activeSlide].icon}
        </View>
        
        <Text className="text-3xl font-bold text-text-primary text-center mb-4">
          {slides[activeSlide].title}
        </Text>
        
        <Text className="text-text-secondary text-center text-lg leading-6 px-4">
          {slides[activeSlide].description}
        </Text>
      </View>

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
