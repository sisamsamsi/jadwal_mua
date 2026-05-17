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
    headline: "Hai, Selamat Datang di Fixatif!",
    subheadline:
      "Asisten bisnis kamu sebagai MUA — dari jadwal, klien, hingga keuangan. Semua dalam satu genggaman.",
    caption: "Dibuat khusus untuk MUA Indonesia yang ingin kerja lebih rapi.",
  },
  {
    id: "2",
    image: require("@/assets/images/slide2.png"),
    headline: "Fixatif bisa bantu banyak hal",
    subheadline:
      "Catat booking, buat invoice, kirim pengingat WA ke klien — bahkan baca pesan WA klien langsung jadi jadwal otomatis.",
    features: [
      { label: "Jadwal & Kalender" },
      { label: "Keuangan & Invoice" },
      { label: "AI dari Pesan WA" },
    ],
  },
  {
    id: "3",
    image: require("@/assets/images/slide3.png"),
    headline: "Mulai sekarang, gratis dulu boleh!",
    subheadline:
      "Coba semua fitur selama 7 hari tanpa bayar. Kalau sudah cocok, lanjut bareng kami.",
    caption: "Tidak perlu kartu kredit. Bisa batal kapan saja.",
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
        {/* Teks di-render dinamis di area bawah gambar dengan gradien warna yang menyatu */}
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            paddingHorizontal: 28,
            paddingTop: insets.top + 20,
            paddingBottom: 220 + insets.bottom, 
          }}
        >
          {/* Judul Slide */}
          <Text
            style={{
              fontSize: 24,
              fontWeight: "800",
              color: "#4A2D33",
              lineHeight: 32,
              marginBottom: 10,
            }}
          >
            {item.headline}
          </Text>

          {/* Deskripsi/Subjudul */}
          <Text
            style={{
              fontSize: 15,
              color: "#6E5B5E",
              lineHeight: 22,
              marginBottom: item.features ? 14 : 16,
            }}
          >
            {item.subheadline}
          </Text>

          {/* List Fitur (Untuk Slide 2) */}
          {item.features && (
            <View style={{ gap: 10, marginTop: 4 }}>
              {item.features.map((feature, idx) => (
                <View key={idx} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: "#E8D5D8",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#B76E79",
                        fontWeight: "700",
                      }}
                    >
                      {idx + 1}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 15,
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
                fontSize: 13,
                color: "#8C7B7D",
                fontStyle: "italic",
                lineHeight: 18,
                marginTop: 4,
              }}
            >
              {item.caption}
            </Text>
          )}
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
