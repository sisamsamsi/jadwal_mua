# 🧪 Laporan Testing — MUA App
**Commit:** `20791d8`
**Tanggal Review:** 10 Mei 2026
**Scope:** UI/UX · Kemudahan User · Logic Issue · Security · Placeholder · Bug & Error · AI Service

> **Catatan:** Sistem trial/premium dinonaktifkan secara sengaja untuk kemudahan tester real user — tidak dimasukkan sebagai temuan.

---

## ✅ Yang Sudah Diperbaiki dari Review Sebelumnya

| # | Item | Status |
|---|------|--------|
| 1 | `clientId` kini dicari otomatis dari daftar klien setelah AI parse | ✅ |
| 2 | Fallback `null` ditambahkan untuk semua field kritis dari AI (`endTime`, `bookingDate`, dll) | ✅ |
| 3 | AI parse kini menampilkan ringkasan field mana yang berhasil diisi | ✅ |
| 4 | `.env.example` kini mencantumkan `EXPO_PUBLIC_GROQ_API_KEY` | ✅ |
| 5 | `home.tsx` — `displayName` sudah pakai `user_metadata.full_name` | ✅ |
| 6 | Profile — tombol edit (gear icon) kini navigasi ke `/settings`, tidak lagi mati | ✅ |
| 7 | Settings — edit profil bisnis (nama & nomor WA) sudah berfungsi | ✅ |
| 8 | Settings — template pesan WhatsApp bisa dikustomisasi | ✅ |
| 9 | Fitur **Link Booking Publik** ditambahkan di halaman Profile | ✅ Fitur baru |
| 10 | Fitur **Onboarding** 3 slide ditambahkan untuk user baru | ✅ Fitur baru |
| 11 | Root layout kini routing ke onboarding untuk user yang belum selesai onboarding | ✅ |
| 12 | Route `/book/[muaId]` dikecualikan dari auth check | ✅ |
| 13 | `ai-service.ts` kini menambahkan komentar peringatan keamanan key | ✅ |

---

## 🔴 Bug & Error Kritis

### 1. 🚨 GROQ API Key Masih Terekspos di Bundle APK

**File:** `lib/services/ai-service.ts`

```ts
// Komentar peringatan sudah ada, tapi key masih di sini:
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
```

Komentar peringatan sudah ditambahkan (bagus), namun key dengan prefix `EXPO_PUBLIC_` **tetap terbundle ke dalam APK**. Ini belum benar-benar aman karena komentar tidak mengubah cara Expo mem-bundle variabel environment. Sudah dilaporkan sejak review sebelumnya — ini satu-satunya fix yang belum dieksekusi.

**Solusi permanen:** Pindahkan API call ke Supabase Edge Function.

---

### 2. 🚨 Public Booking Form — Kolom `client_name` Tidak Ada di Schema

**File:** `app/book/[muaId].tsx` baris 39

```ts
// Insert ke Supabase:
client_name: formData.name,  // ← kolom ini TIDAK ADA di tabel bookings

// Schema aktual di lib/db/schema.ts:
clientId: text("client_id").notNull()  // ← wajib ada, tapi tidak diisi
```

Setiap kali klien mengirim form booking publik, insert akan **gagal dengan error Supabase** karena:
1. Kolom `client_name` tidak ada di tabel `bookings`
2. Field `clientId` yang wajib diisi (`.notNull()`) tidak disertakan

Ini berarti fitur booking publik **belum berfungsi sama sekali** dalam kondisi saat ini.

**Solusi:** Saat klien submit form publik, buat dulu entri klien baru di tabel `clients` dengan nama dan nomor WA yang diisi, kemudian gunakan ID-nya sebagai `clientId` di insert booking.

---

### 3. 🚨 Public Booking Form — Tidak Ada Validasi `muaId`

**File:** `app/book/[muaId].tsx`

```ts
const { muaId } = useLocalSearchParams();
// muaId langsung dipakai tanpa verifikasi:
user_id: muaId,
```

Tidak ada pengecekan apakah `muaId` dari URL benar-benar merupakan ID user yang valid. Seseorang bisa:
- Mengirim request dengan UUID acak yang tidak terdaftar
- Membanjiri tabel `bookings` dengan data sampah

**Solusi:** Query Supabase terlebih dahulu untuk verifikasi `muaId` sebelum menampilkan form, dan tampilkan error jika MUA tidak ditemukan.

---

### 4. Template WA Dikustomisasi tapi Tidak Dipakai di Pengiriman Pesan

**File:** `lib/utils/whatsapp.ts` vs `lib/stores/settings-store.ts`

Di Settings, MUA bisa edit template dengan placeholder `{{nama}}`, `{{layanan}}`, dll. Namun fungsi pengiriman WA di `whatsapp.ts` **masih menggunakan template hardcoded** yang tidak membaca dari settings store sama sekali:

```ts
// whatsapp.ts — template hardcoded, tidak pakai waTemplates dari store
export const getBookingReminderTemplate = (clientName, date, time, serviceName) => {
  return `Halo ${clientName}, ini pengingat...`; // ← tidak ada koneksi ke settings
};
```

Akibatnya, fitur kustomisasi template di Settings **tidak berpengaruh** pada pesan WA yang dikirim. User mengedit template tapi pesan tetap menggunakan teks bawaan.

---

### 5. `Clipboard` Diimport dari `react-native` — Sudah Deprecated

**File:** `app/(tabs)/profile.tsx`

```ts
import { Share, Clipboard } from "react-native";
// Clipboard.setString(bookingLink); ← ini deprecated sejak RN 0.59
```

`Clipboard` telah dihapus dari package `react-native` di versi modern. Ini akan menyebabkan **error undefined** saat tombol "Salin Link" ditekan.

**Solusi:** Ganti dengan package yang benar:
```ts
import Clipboard from "@react-native-clipboard/clipboard";
// atau gunakan expo-clipboard:
import * as Clipboard from "expo-clipboard";
await Clipboard.setStringAsync(bookingLink);
```

---

## 🟠 Logic Issue

### 6. Onboarding — `scrollX` Dideklarasikan tapi Tidak Digunakan

**File:** `app/onboarding/index.tsx`

```ts
const scrollX = useRef(new Animated.Value(0)).current; // ← tidak dipakai di mana pun
```

`Animated` diimport dan `scrollX` dideklarasikan tapi tidak pernah digunakan di JSX maupun logika slide. Ini **dead code** yang bisa membingungkan developer berikutnya.

---

### 7. Onboarding — Tidak Bisa Digeser (Swipe), Hanya Tombol

**File:** `app/onboarding/index.tsx`

Komentar di kode pun mengakui ini:
```ts
// Scroll logic would go here if using a flatlist,
// but for simplicity we can just track index
```

Layar onboarding standar mendukung swipe horizontal antar slide. Tanpa swipe, user yang sudah terbiasa dengan konvensi onboarding modern akan merasa UX-nya belum selesai.

**Solusi:** Ganti implementasi dengan `FlatList` horizontal + `pagingEnabled`, atau gunakan library `react-native-pager-view` yang ringan.

---

### 8. Domain Link Booking Publik Hardcoded ke URL yang Belum Tentu Aktif

**File:** `app/(tabs)/profile.tsx` baris 30

```ts
const bookingLink = `https://mua-jadwal.web.app/book/${session?.user?.id}`;
```

Domain `mua-jadwal.web.app` di-hardcode langsung. Jika domain ini belum terdeploy atau berubah, **setiap MUA yang membagikan link-nya akan mengirimkan link yang rusak ke klien mereka**.

**Solusi:** Pindahkan domain ke environment variable atau konstanta di `lib/constants/app.ts` agar mudah diubah:
```ts
// lib/constants/app.ts
export const PUBLIC_BOOKING_BASE_URL = process.env.EXPO_PUBLIC_BASE_URL ?? "https://mua-jadwal.web.app";
```

---

### 9. `ToggleItem` Dideklarasikan tapi Tidak Dipakai di `settings/index.tsx`

**File:** `app/settings/index.tsx` baris 163

Fungsi `ToggleItem` masih ada di bagian bawah file namun tidak dipanggil di mana pun — settings screen sudah menggunakan Switch inline langsung. Ini dead code yang membuat file lebih panjang dari seharusnya.

---

### 10. Template WA Auto-Save Setiap Keystroke — Tidak Efisien

**File:** `app/settings/index.tsx`

```tsx
<Input
  onChangeText={(t) => updateTemplates({ confirmation: t })} // ← tiap ketuk huruf = tulis ke AsyncStorage
/>
```

`updateTemplates` memanggil Zustand `persist` yang menulis ke `AsyncStorage` setiap kali satu karakter diubah. Ini tidak efisien, terutama pada device lama. Konsisten dengan bagian "Profil Bisnis" yang punya tombol "Simpan" tersendiri — idealnya template juga punya tombol simpan, atau gunakan debounce.

---

## 🟡 UX Issue

### 11. Public Booking Form — Tidak Menampilkan Identitas MUA

**File:** `app/book/[muaId].tsx`

Form hanya menampilkan teks generik "Buat Janji Temu". Klien yang membuka link tidak mengetahui form ini milik MUA siapa — tidak ada nama, foto, atau nama bisnis yang ditampilkan. Ini menurunkan kepercayaan klien terhadap form.

**Solusi:** Fetch nama dan nama bisnis MUA berdasarkan `muaId` saat form dibuka, lalu tampilkan di header.

---

### 12. Public Booking Form — Tidak Ada Halaman Sukses

**File:** `app/book/[muaId].tsx`

Setelah submit berhasil, user hanya mendapat Alert lalu form dikosongkan. Tidak ada halaman konfirmasi visual yang menjelaskan langkah selanjutnya (misalnya "MUA akan menghubungi kamu via WA dalam 1x24 jam").

---

### 13. Onboarding — Ikon Slide Ketiga Kurang Relevan

**File:** `app/onboarding/index.tsx`

Slide ketiga berjudul "Bisnis Modern" dengan deskripsi tentang "layanan, paket, dan inventaris", namun ikonnya adalah `<Calendar>`. Ikon kalender lebih cocok untuk slide jadwal. Slide ini lebih cocok menggunakan ikon seperti `<Briefcase>` atau `<BarChart2>`.

---

### 14. Settings — Inkonsistensi Save: Profil Butuh Tombol, Template Auto-Save

Di halaman Settings:
- **Profil Bisnis** → butuh klik tombol "Simpan Profil"
- **Template WA** → tersimpan otomatis (tanpa tombol, tiap ketuk)

Dua mekanisme berbeda dalam satu halaman membingungkan user. Sebaiknya konsisten: gunakan salah satu pola untuk seluruh halaman.

---

## 📊 Scorecard Perkembangan

| Kategori | Review #1 | Review #2 | Review #3 | Review #4 |
|----------|:---------:|:---------:|:---------:|:---------:|
| Bug Kritis | 7 | 2 | 3 | **5** |
| Security | 0 | 1 | 1 | **1** ⚠️ |
| Logic Issue | 3 | 3 | 4 | **5** |
| UX Issue | 6 | 2 | 3 | **4** |
| Dead Code | 0 | 0 | 0 | **2** |

> **Catatan:** Kenaikan angka bukan berarti app memburuk. Di setiap review ada fitur baru yang ditambahkan dan membawa temuan baru. Jika dilihat per-fitur lama, perbaikannya sangat konsisten.

---

## 🎯 Prioritas Fix Sebelum Dijual

| # | Item | Urgensi |
|---|------|:-------:|
| 1 | Fix schema mismatch di public booking form (`client_name` vs `clientId`) | 🔴 Wajib |
| 2 | Tambah validasi & fetch profil MUA di public booking form | 🔴 Wajib |
| 3 | Pindahkan Groq API call ke Supabase Edge Function | 🔴 Wajib |
| 4 | Hubungkan `waTemplates` dari settings ke fungsi kirim WA | 🔴 Wajib |
| 5 | Ganti `Clipboard` dari `react-native` ke `expo-clipboard` | 🔴 Wajib |
| 6 | Pindahkan domain booking publik ke environment variable / konstanta | 🟠 Penting |
| 7 | Tambah swipe gesture di onboarding | 🟠 Penting |
| 8 | Tambah halaman sukses di public booking form | 🟠 Penting |
| 9 | Hapus dead code: `scrollX` dan `ToggleItem` | 🟡 Disarankan |
| 10 | Seragamkan mekanisme save di Settings (auto-save vs tombol) | 🟡 Disarankan |
| 11 | Ganti ikon onboarding slide 3 ke `Briefcase` atau `BarChart2` | 🟡 Disarankan |

---

*Laporan ini dibuat dari hasil code review statis terhadap repository `sisamsamsi/jadwal_mua` branch `main`.*
*Reviewer: Claude Sonnet — 10 Mei 2026*
