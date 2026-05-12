# 📱 Panduan Implementasi Onboarding Baru — Fixatif
**File target:** `mua-app/app/onboarding/index.tsx`
**Tanggal:** 10 Mei 2026

---

## Gambaran Umum

Onboarding baru menggunakan **ilustrasi fullscreen** sebagai background per slide, dengan teks overlay di area kosong bawah ilustrasi. Slide 3 memiliki dua tombol CTA berbeda (Coba Gratis & Berlangganan).

```
┌─────────────────────────┐
│                         │
│      ILUSTRASI          │
│      FULLSCREEN         │
│                         │
│   (70% layar atas)      │
│                         │
├─────────────────────────┤
│  Headline               │
│  Subheadline            │
│  ○ ● ○  (dot indicator) │
│  [Tombol CTA]           │
│  Lewati                 │
└─────────────────────────┘
```

---

## Langkah 1 — Siapkan File Ilustrasi

Simpan 3 file ilustrasi ke folder:
```
mua-app/assets/images/onboarding/
├── slide1.png   ← MUA di meja rias
├── slide2.png   ← 4 kartu fitur 3D
└── slide3.png   ← Dua MUA sebelum & sesudah
```

> **Catatan:** Rename file sesuai urutan di atas. Format PNG, resolusi minimal 828×1792px (iPhone standard).

---

## Langkah 2 — Tambah Dependency

Pastikan package berikut sudah terinstall (sudah ada di project):
```bash
# Sudah ada, tidak perlu install ulang
expo-image          # untuk gambar performa tinggi
react-native-reanimated  # untuk animasi smooth
```

---

## Langkah 3 — Kode Lengkap `onboarding/index.tsx`

Ganti **seluruh isi file** dengan kode berikut:

```tsx
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { ArrowRight, Sparkles } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

// ─── DATA SLIDES ────────────────────────────────────────────────────────────

const slides = [
  {
    id: "1",
    image: require("@/assets/images/onboarding/slide1.png"),
    headline: "Hai, Selamat Datang di Fixatif! 👋",
    subheadline:
      "Asisten bisnis kamu sebagai MUA — dari jadwal, klien, hingga keuangan. Semua dalam satu genggaman.",
    caption: "Dibuat khusus untuk MUA Indonesia yang ingin kerja lebih rapi.",
  },
  {
    id: "2",
    image: require("@/assets/images/onboarding/slide2.png"),
    headline: "Fixatif bisa bantu banyak hal 💄",
    subheadline:
      "Catat booking, buat invoice, kirim pengingat WA ke klien — bahkan baca pesan WA klien langsung jadi jadwal otomatis.",
    features: [
      { icon: "📅", label: "Jadwal & Kalender" },
      { icon: "💰", label: "Keuangan & Invoice" },
      { icon: "🤖", label: "AI dari Pesan WA" },
    ],
  },
  {
    id: "3",
    image: require("@/assets/images/onboarding/slide3.png"),
    headline: "Mulai sekarang, gratis dulu boleh! 🎉",
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
          // Transisi lebar dot saat active berubah
        }}
      />
    ))}
  </View>
);

// ─── KOMPONEN SLIDE ──────────────────────────────────────────────────────────

const SlideItem = ({
  item,
  isLast,
  onNext,
  onSkip,
  onTrial,
  onSubscribe,
}: {
  item: (typeof slides)[0];
  isLast: boolean;
  onNext: () => void;
  onSkip: () => void;
  onTrial: () => void;
  onSubscribe: () => void;
}) => {
  return (
    <View style={{ width, height }}>
      {/* ── Ilustrasi Fullscreen ── */}
      <ImageBackground
        source={item.image}
        style={{ width, height: height * 0.62 }}
        resizeMode="cover"
      />

      {/* ── Area Teks (38% bawah) ── */}
      <View
        style={{
          flex: 1,
          backgroundColor: "#FAF7F5",
          paddingHorizontal: 28,
          paddingTop: 24,
          paddingBottom: 12,
        }}
      >
        {/* Headline */}
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            color: "#2D2D2D",
            marginBottom: 10,
            lineHeight: 30,
          }}
        >
          {item.headline}
        </Text>

        {/* Subheadline */}
        <Text
          style={{
            fontSize: 14,
            color: "#757575",
            lineHeight: 22,
            marginBottom: item.features ? 14 : 6,
          }}
        >
          {item.subheadline}
        </Text>

        {/* Feature Chips — hanya di slide 2 */}
        {item.features && (
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            {item.features.map((f, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#F8E8EA",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  gap: 4,
                }}
              >
                <Text style={{ fontSize: 13 }}>{f.icon}</Text>
                <Text style={{ fontSize: 12, color: "#B76E79", fontWeight: "600" }}>
                  {f.label}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Caption kecil */}
        {item.caption && (
          <Text style={{ fontSize: 12, color: "#9CA3AF", fontStyle: "italic", marginBottom: 4 }}>
            {item.caption}
          </Text>
        )}
      </View>
    </View>
  );
};

// ─── KOMPONEN UTAMA ──────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter();
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);
  const [activeSlide, setActiveSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const isLastSlide = activeSlide === slides.length - 1;

  const handleFinish = useCallback(() => {
    completeOnboarding();
    router.replace("/(tabs)/home" as any);
  }, []);

  const handleNext = useCallback(() => {
    if (!isLastSlide) {
      flatListRef.current?.scrollToIndex({ index: activeSlide + 1, animated: true });
      setActiveSlide((prev) => prev + 1);
    }
  }, [activeSlide, isLastSlide]);

  return (
    <View style={{ flex: 1, backgroundColor: "#FAF7F5" }}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ── FlatList Slides ── */}
      <FlatList
        ref={flatListRef}
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
          <SlideItem
            item={item}
            isLast={item.id === slides[slides.length - 1].id}
            onNext={handleNext}
            onSkip={handleFinish}
            onTrial={handleFinish}
            onSubscribe={handleFinish}
          />
        )}
      />

      {/* ── Bottom Navigation (fixed di atas semua slide) ── */}
      <SafeAreaView
        edges={["bottom"]}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#FAF7F5",
          paddingHorizontal: 28,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 8 : 20,
          borderTopWidth: 1,
          borderTopColor: "#F0E8E9",
        }}
      >
        {/* Dot Indicator */}
        <DotIndicator total={slides.length} active={activeSlide} />

        {/* CTA Buttons */}
        {isLastSlide ? (
          /* Slide 3 — Dua tombol */
          <View style={{ gap: 12 }}>
            {/* Tombol Coba Gratis (Primary) */}
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

            {/* Tombol Berlangganan (Secondary/Outline) */}
            <TouchableOpacity
              onPress={handleFinish}
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

            {/* Caption disclaimer */}
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
          /* Slide 1 & 2 — Satu tombol Lanjut + Lewati */
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
                Lanjut
              </Text>
              <ArrowRight size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleFinish}
              activeOpacity={0.6}
              style={{ alignItems: "center", paddingVertical: 14 }}
            >
              <Text style={{ color: "#9CA3AF", fontSize: 14, fontWeight: "500" }}>
                Lewati
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}
```

---

## Langkah 4 — Sesuaikan Tinggi Area Teks

Karena setiap HP berbeda tingginya, **area ilustrasi dan teks perlu dicek** di beberapa ukuran layar:

| Ukuran Layar | Ilustrasi | Teks Area |
|---|---|---|
| HP kecil (< 700px height) | 58% | 42% |
| HP standar (700–800px) | 62% | 38% |
| HP besar (> 800px) | 65% | 35% |

Tambahkan logika dinamis ini di kode jika dibutuhkan:
```tsx
const ILLUS_HEIGHT = height < 700 
  ? height * 0.58 
  : height < 800 
    ? height * 0.62 
    : height * 0.65;
```

Lalu ganti `height * 0.62` dengan `ILLUS_HEIGHT` di komponen `SlideItem`.

---

## Langkah 5 — Navigasi dari `_layout.tsx`

Pastikan routing onboarding sudah benar di `_layout.tsx`:

```tsx
// Kondisi yang ada — tidak perlu diubah
} else if (session && !hasSeenOnboarding && !inOnboarding) {
  router.replace("/onboarding");
}
```

Dan setelah onboarding selesai, `handleFinish` memanggil:
```tsx
completeOnboarding(); // set hasSeenOnboarding = true di store
router.replace("/(tabs)/home");
```

---

## Langkah 6 — Opsional: Hapus Import yang Tidak Dipakai

Setelah implementasi, hapus import yang tidak lagi dipakai dari file lama:
```tsx
// HAPUS — tidak dipakai lagi
import { Sparkles, Users, Briefcase } from "lucide-react-native";

// PERTAHANKAN — masih dipakai
import { ArrowRight, Sparkles } from "lucide-react-native";
```

---

## Checklist Implementasi

- [ ] Simpan 3 ilustrasi ke `assets/images/onboarding/`
- [ ] Rename file: `slide1.png`, `slide2.png`, `slide3.png`
- [ ] Ganti seluruh isi `onboarding/index.tsx` dengan kode di atas
- [ ] Sesuaikan `ILLUS_HEIGHT` jika tampilan di HP terpotong
- [ ] Test swipe antar slide — pastikan smooth
- [ ] Test tombol "Lewati" di slide 1 & 2 — langsung ke dashboard
- [ ] Test dua tombol CTA di slide 3 — keduanya ke dashboard (untuk saat ini)
- [ ] Test dot indicator berubah saat diswipe manual
- [ ] Cek tampilan di HP kecil (layar < 700px)
- [ ] Cek `hasSeenOnboarding` tidak tampil lagi setelah selesai

---

## Catatan Pengembangan Selanjutnya

**Tombol Berlangganan (slide 3)** saat ini mengarah ke `handleFinish` (masuk app langsung) karena sistem langganan belum aktif. Ketika sistem pembayaran sudah siap, ganti `onPress` tombol berlangganan dengan navigasi ke halaman pembayaran:

```tsx
// Nanti diganti dengan:
onPress={() => router.push("/subscription/checkout")}
```

**Harga Rp 79rb/bln** di tombol berlangganan bisa dipindahkan ke konstanta `APP_CONFIG` agar mudah diubah dari satu tempat:
```tsx
// lib/constants/app.ts
SUBSCRIPTION_PRICE: "79.000",
TRIAL_DAYS: 7,
```

---

*Panduan ini dibuat berdasarkan kode `onboarding/index.tsx` eksisting dan ilustrasi yang sudah digenerate.*
*Fixatif — Kunci jadwalmu, pastikan sempurna.*
