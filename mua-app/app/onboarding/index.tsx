import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Platform,
  Image,
  Linking,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { ArrowRight, Sparkles } from "lucide-react-native";
import { APP_CONFIG } from "@/lib/constants/app";

const { width, height } = Dimensions.get("window");

// ─── DATA SLIDES ────────────────────────────────────────────────────────────

const slides = [
  {
    id: "0",
    image: require("@/assets/images/welcome.png"),
    isWelcome: true,
  },
  {
    id: "1",
    image: require("@/assets/images/slide1.png"),
    headline: "Bisnis MUA Lebih Rapi & Profesional",
    subheadline:
      "Fixatif membantu Anda mengelola jadwal klien, invoice pembayaran, dan laporan keuangan dalam satu asisten cerdas.",
    caption: "Dibuat khusus untuk Makeup Artist Indonesia.",
  },
  {
    id: "2",
    image: require("@/assets/images/slide2.png"),
    headline: "Kelola Booking Tanpa Repot",
    subheadline:
      "Catat reservasi otomatis, kirim invoice instan, dan buat pengingat jadwal WhatsApp otomatis untuk klien Anda.",
    features: [
      { label: "Kalender & Jadwal Interaktif" },
      { label: "Invoice Otomatis & Catatan Keuangan" },
      { label: "AI WhatsApp Booking Integration" },
    ],
  },
  {
    id: "3",
    image: require("@/assets/images/slide3.png"),
    headline: "Mulai Langkah Sukses Anda",
    subheadline:
      "Coba asisten digital Fixatif gratis selama 7 hari (maksimal 10 booking). Rasakan kemudahan mengelola bisnis MUA secara modern.",
    caption: "Tanpa kartu kredit · Berlangganan Premium untuk akses tanpa batas",
  },
];

// ─── KOMPONEN DOT INDICATOR ─────────────────────────────────────────────────

const DotIndicator = ({ total, active }: { total: number; active: number }) => (
  <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 20 }}>
    {Array.from({ length: total }).map((_, i) => (
      <View
        key={i}
        style={{
          height: 8,
          width: i === active ? 28 : 8,
          borderRadius: 4,
          backgroundColor: i === active ? "#B76E79" : "#E8D5D8",
        }}
      />
    ))}
  </View>
);

// ─── KOMPONEN SLIDE ──────────────────────────────────────────────────────────

const SlideItem = ({
  item,
}: {
  item: (typeof slides)[0];
}) => {
  const insets = useSafeAreaInsets();

  if (item.isWelcome) {
    return (
      <View style={{ width, height }}>
        <Image 
          source={item.image} 
          style={{ width, height }} 
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View style={{ width, height }}>
      {/* ── Ilustrasi Fullscreen sebagai Background ── */}
      <ImageBackground
        source={item.image}
        style={{ width, height }}
        resizeMode="cover"
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            paddingHorizontal: 20,
            paddingBottom: 220 + insets.bottom, 
          }}
        >
          {/* ── Premium Frosted Glassmorphism Card ── */}
          <View
            style={{
              backgroundColor: "rgba(250, 247, 245, 0.94)", // Premium warm white with high opacity for readability
              borderRadius: 24,
              padding: 24,
              borderWidth: 1.5,
              borderColor: "rgba(255, 255, 255, 0.7)", // Frosted border glow
              shadowColor: "#4A2D33",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.12,
              shadowRadius: 20,
              elevation: 8,
            }}
          >
            {/* Judul Slide */}
            <Text
              style={{
                fontSize: 22,
                fontWeight: "800",
                color: "#4A2D33",
                lineHeight: 30,
                marginBottom: 8,
              }}
            >
              {item.headline}
            </Text>

            {/* Deskripsi/Subjudul */}
            <Text
              style={{
                fontSize: 14,
                color: "#6E5B5E",
                lineHeight: 20,
                marginBottom: item.features ? 14 : (item.caption ? 12 : 0),
              }}
            >
              {item.subheadline}
            </Text>

            {/* List Fitur (Untuk Slide 2) */}
            {item.features && (
              <View style={{ gap: 10, marginTop: 2 }}>
                {item.features.map((feature, idx) => (
                  <View key={idx} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: "#F3EAEB", // Soft blush pink tint
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          color: "#B76E79",
                          fontWeight: "800",
                        }}
                      >
                        ✓
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: "#4A2D33",
                      }}
                    >
                      {feature.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Keterangan Tambahan / Caption */}
            {item.caption && (
              <Text
                style={{
                  fontSize: 12,
                  color: "#8C7B7D",
                  fontStyle: "italic",
                  lineHeight: 16,
                  marginTop: 6,
                }}
              >
                {item.caption}
              </Text>
            )}
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

// ─── KOMPONEN UTAMA ──────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter();
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);
  const session = useAuthStore((s) => s.session);
  const insets = useSafeAreaInsets();
  
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef<FlatList>(null);
  const isLastSlide = activeSlide === slides.length - 1;

  const handleFinish = useCallback(() => {
    completeOnboarding();
    if (session) {
      router.replace("/(tabs)/home" as any);
    } else {
      router.replace("/login");
    }
  }, [completeOnboarding, router, session]);

  const handleSubscribe = useCallback(async () => {
    completeOnboarding();
    const whatsappUrl = `whatsapp://send?phone=${APP_CONFIG.SUPPORT_WHATSAPP}&text=${encodeURIComponent(
      "Halo, saya ingin berlangganan MUA App (Fixatif) Premium."
    )}`;
    try {
      await Linking.openURL(whatsappUrl);
    } catch (e) {
      const webUrl = `https://wa.me/${APP_CONFIG.SUPPORT_WHATSAPP}?text=${encodeURIComponent(
        "Halo, saya ingin berlangganan MUA App (Fixatif) Premium."
      )}`;
      try {
        await Linking.openURL(webUrl);
      } catch (err) {
        Alert.alert(
          "WhatsApp Tidak Tersedia",
          `Silakan hubungi WhatsApp kami di ${APP_CONFIG.SUPPORT_WHATSAPP} untuk berlangganan.`
        );
      }
    }
    if (session) {
      router.replace("/(tabs)/home" as any);
    } else {
      router.replace("/login");
    }
  }, [completeOnboarding, router, session]);

  const handleNext = useCallback(() => {
    if (!isLastSlide) {
      scrollRef.current?.scrollToIndex({ index: activeSlide + 1, animated: true });
      setActiveSlide((prev) => prev + 1);
    }
  }, [activeSlide, isLastSlide]);

  return (
    <View style={{ flex: 1, backgroundColor: "#FAF7F5" }}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ── FlatList Slides ── */}
      <FlatList
        ref={scrollRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveSlide(index);
        }}
        renderItem={({ item }) => (
          <SlideItem item={item} />
        )}
      />

      {/* ── Bottom Navigation (fixed di atas semua slide) ── */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "transparent",
          paddingHorizontal: 28,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? insets.bottom + 10 : insets.bottom + 20,
        }}
      >
        {/* Dot Indicator */}
        <DotIndicator total={slides.length} active={activeSlide} />

        {/* CTA Buttons */}
        {isLastSlide ? (
          <View style={{ gap: 12 }}>
            <TouchableOpacity
              onPress={handleFinish}
              activeOpacity={0.85}
              style={{
                backgroundColor: "#B76E79",
                height: 56,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#B76E79",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Sparkles size={18} color="white" />
                <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
                  Coba Gratis 7 Hari
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubscribe}
              activeOpacity={0.75}
              style={{
                borderWidth: 1.5,
                borderColor: "#B76E79",
                height: 52,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#B76E79", fontWeight: "600", fontSize: 15 }}>
                Mulai Berlangganan — Rp 79rb/bln
              </Text>
            </TouchableOpacity>

            <Text
              style={{
                textAlign: "center",
                fontSize: 11,
                color: "#9CA3AF",
                marginTop: -4,
              }}
            >
              Tidak perlu kartu kredit · Bisa batal kapan saja
            </Text>
          </View>
        ) : (
          <View>
            <TouchableOpacity
              onPress={handleNext}
              activeOpacity={0.85}
              style={{
                backgroundColor: "#B76E79",
                height: 56,
                borderRadius: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                shadowColor: "#B76E79",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
                {activeSlide === 0 ? "Mulai Sekarang" : "Lanjut"}
              </Text>
              <ArrowRight size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleFinish}
              activeOpacity={0.6}
              style={{ alignItems: "center", paddingVertical: 14 }}
            >
              <Text style={{ color: activeSlide === 0 ? "rgba(0,0,0,0.3)" : "#9CA3AF", fontSize: 14, fontWeight: "500" }}>
                Lewati
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
