# 🧪 Laporan Testing Final — MUA App
**Commit:** `8f6eca5`
**Tanggal Review:** 10 Mei 2026
**Status:** Review ke-5 — Persiapan Sebelum Tester Real User
**Scope:** UI/UX · Kemudahan User · Logic Issue · Security · Placeholder · Bug & Error · AI Service

> **Catatan:** Sistem trial/premium dinonaktifkan secara sengaja untuk kemudahan tester real user — tidak dimasukkan sebagai temuan.

---

## ✅ Yang Sudah Diperbaiki dari Review Sebelumnya

| # | Item | Status |
|---|------|--------|
| 1 | **AI Service** — Groq API key dipindah ke Supabase Edge Function (tidak lagi di APK) | ✅ Perbaikan kritis |
| 2 | **Public booking** — Validasi & fetch profil MUA sebelum tampilkan form | ✅ |
| 3 | **Public booking** — Buat klien dulu, pakai `clientId` yang valid saat insert booking | ✅ |
| 4 | **Public booking** — Halaman sukses dengan nama bisnis MUA ditampilkan | ✅ |
| 5 | **Template WA** — `formatWhatsAppTemplate` terhubung ke pengiriman pesan di booking detail | ✅ Perbaikan kritis |
| 6 | **Clipboard** — Diganti `expo-clipboard` (package deprecated dihapus) | ✅ |
| 7 | **Domain booking** — Dipindah ke `APP_CONFIG` di `lib/constants/app.ts` | ✅ |
| 8 | **Onboarding** — Sekarang pakai `FlatList` horizontal, bisa digeser | ✅ |
| 9 | **Onboarding** — Ikon slide 3 diganti dari `Calendar` ke `Briefcase` | ✅ |
| 10 | **Settings** — Template WA sekarang pakai local state + tombol "Simpan Template" eksplisit | ✅ |
| 11 | **Settings** — Dead code `ToggleItem` dihapus | ✅ |

Progress sangat signifikan. Semua bug kritis dari review sebelumnya sudah diselesaikan.

---

## 🔴 Bug & Error

### 1. Public Booking — `clientId` Salah Penamaan Kolom di Insert Supabase

**File:** `app/book/[muaId].tsx` baris 81

```ts
// Yang ditulis di kode:
clientId: clientData.id,  // ← camelCase

// Yang seharusnya (nama kolom di database Supabase):
client_id: clientData.id, // ← snake_case
```

Schema Drizzle mendefinisikan `clientId: text("client_id")` — nama JS-nya `clientId` tapi kolom database-nya `client_id`. Ketika insert langsung via Supabase REST client (bukan Drizzle), wajib menggunakan nama kolom database (`snake_case`). Kolom lain di insert yang sama sudah benar (`user_id`, `booking_date`, `start_time`, dll), hanya `clientId` yang salah.

**Akibat:** Setiap submit dari form booking publik akan gagal dengan error `column "clientId" does not exist`.

**Fix:**
```ts
client_id: clientData.id,
```

---

### 2. Edge Function Belum Tentu Terdeploy — AI Asisten Akan Error untuk Semua Tester

**File:** `lib/services/ai-service.ts` + `supabase-edge-function-sample.ts`

```ts
// ai-service.ts memanggil:
supabase.functions.invoke("parse-booking", { body: { message } });
```

File edge function ada di `supabase-edge-function-sample.ts` di root repo sebagai **contoh** (bukan hasil deploy). Selama function ini belum di-deploy ke Supabase Dashboard menggunakan `supabase functions deploy parse-booking`, tombol **"Asisten AI"** di form booking akan selalu error untuk **semua tester**.

Tidak ada fallback atau pesan yang memberi tahu tester bahwa fitur ini membutuhkan setup tambahan.

**Hal yang perlu dilakukan sebelum serahkan ke tester:**
1. Deploy edge function: `supabase functions deploy parse-booking`
2. Set secret di Supabase Dashboard: `supabase secrets set GROQ_API_KEY=...`
3. Atau tambahkan pesan di UI jika edge function belum aktif

---

### 3. Booking Detail — Loading State Menampilkan Layar Kosong

**File:** `app/booking/[id].tsx` baris 221

```tsx
if (loadingBooking) return null; // ← blank white screen
if (!booking) return null;       // ← blank white screen
```

Saat data booking sedang di-fetch atau tidak ditemukan, user melihat layar putih kosong tanpa penjelasan apapun.

**Fix:**
```tsx
if (loadingBooking) return <LoadingScreen />;
if (!booking) return <NotFoundScreen message="Jadwal tidak ditemukan." />;
```

---

## 🟠 Logic Issue

### 4. Public Booking — Tidak Ada Validasi Format Nomor WhatsApp

**File:** `app/book/[muaId].tsx`

Validasi hanya mengecek apakah field kosong atau tidak:
```ts
if (!formData.name || !formData.phone || ...) { ... }
```

Tidak ada pengecekan format nomor. Klien bisa mengetik `"abcde"`, `"123"`, atau angka yang terlalu pendek dan tetap bisa submit. Nomor yang salah menyebabkan MUA tidak bisa menghubungi klien sama sekali.

**Fix:** Tambahkan regex sederhana sebelum submit:
```ts
const phoneRegex = /^(\+62|62|0)[0-9]{8,12}$/;
if (!phoneRegex.test(formData.phone)) {
  Alert.alert("Nomor Tidak Valid", "Masukkan nomor WhatsApp yang benar.");
  return;
}
```

---

### 5. Public Booking — Bisa Memilih Tanggal Masa Lalu

**File:** `app/book/[muaId].tsx`

`DateTimePickerModal` tidak memiliki properti `minimumDate`:
```tsx
<DateTimePickerModal
  mode="date"
  // ← minimumDate tidak ada
  onConfirm={...}
/>
```

Klien bisa memilih tanggal kemarin atau setahun yang lalu, dan form akan berhasil dikirim. MUA akan menerima booking dengan tanggal yang sudah lewat.

**Fix:**
```tsx
<DateTimePickerModal
  mode="date"
  minimumDate={new Date()}
  ...
/>
```

---

### 6. `Animated` Masih Diimport tapi Tidak Digunakan di Onboarding

**File:** `app/onboarding/index.tsx` baris 2

```ts
import { View, Text, FlatList, Dimensions, TouchableOpacity, Animated } from "react-native";
//                                                                         ^^^^^^^^ tidak dipakai
```

Setelah beralih ke FlatList, `Animated` tidak lagi digunakan. Dead import — akan memunculkan lint warning.

---

### 7. `APP_CONFIG.SUPPORT_WHATSAPP` Didefinisikan tapi Tidak Dipakai

**File:** `lib/constants/app.ts`

```ts
export const APP_CONFIG = {
  PUBLIC_BOOKING_BASE_URL: "...",
  SUPPORT_WHATSAPP: "628123456789", // ← placeholder, tidak dipakai di mana pun
  VERSION: "1.0.4",
};
```

Tombol "Bantuan & Support" di profile screen masih menampilkan Alert teks, bukan menghubungkan ke nomor WA ini. `SUPPORT_WHATSAPP` terdefinisi tapi tidak dikoneksikan ke UI.

---

### 8. Placeholder `{{layanan}}` di Template WA Diisi dengan `eventType`, Bukan Nama Layanan

**File:** `app/booking/[id].tsx` baris 207

```tsx
const message = formatWhatsAppTemplate(waTemplates.reminder, {
  nama: booking.clientName,
  layanan: booking.eventType || "Makeup", // ← eventType, bukan nama layanan
  tanggal: booking.bookingDate,
  jam: booking.startTime
});
```

Di halaman Settings, deskripsi placeholder `{{layanan}}` adalah *"Nama Layanan/Paket"*. Namun yang dikirim adalah `eventType` (misal: "Akad", "Resepsi"). MUA yang mengatur template dengan ekspektasi nama layanan (misal "Makeup Pengantin") akan mendapatkan pesan yang berbeda dari yang diinginkan.

---

### 9. Domain Booking Publik Masih Placeholder yang Belum Aktif

**File:** `lib/constants/app.ts`

```ts
PUBLIC_BOOKING_BASE_URL: "https://mua-jadwal.web.app/book",
```

Domain ini belum terdeploy. Setiap MUA yang menggunakan fitur "Bagikan Link" atau "Salin Link" akan membagikan URL yang hasilnya **404**. Ini akan membingungkan tester real user yang mencoba fitur ini.

**Saran sementara:** Tambahkan banner di card Link Booking Publik:
> *"⚠️ Fitur ini aktif setelah web app dideploy. Saat ini masih dalam pengembangan."*

---

## 🟡 UX Issue

### 10. Tombol "Tutup" di Halaman Sukses Public Booking Membingungkan

**File:** `app/book/[muaId].tsx`

Setelah submit berhasil dan halaman sukses tampil, tombol **"Tutup"** memanggil `setIsSuccess(false)` yang mengembalikan user ke form kosong. Ini tidak intuitif — user yang sudah sukses booking tidak perlu melihat form lagi.

**Saran:** Ganti label "Tutup" menjadi "Buat Booking Lain" agar lebih jelas konteksnya, atau hapus tombol sama sekali.

---

### 11. Saat Form Booking Publik Diisi AI dan Klien Tidak Cocok — Tidak Ada Panduan

**File:** `app/booking/new.tsx`

Ketika AI berhasil mengekstrak nama klien dari pesan WA tapi nama tersebut tidak cocok dengan klien manapun di database, `clientId` tetap kosong dan form tidak bisa disimpan. Pesan feedback yang muncul hanya menyebut field yang berhasil diisi, tidak secara eksplisit mengarahkan user untuk memilih atau menambah klien.

---

### 12. Tidak Ada Indikator Versi yang Konsisten

`APP_CONFIG.VERSION = "1.0.4"` tapi teks di footer Settings dan Profile masih hardcoded `"MUA App v1.0.0 (Beta)"`. Terdapat inkonsistensi versi antara konstanta dan tampilan.

---

## 🔒 Security

### 13. CORS Edge Function Menggunakan Wildcard `*`

**File:** `supabase-edge-function-sample.ts`

```ts
'Access-Control-Allow-Origin': '*',
```

Wildcard CORS berarti **domain mana pun** bisa memanggil edge function ini dari browser. Untuk production, sebaiknya batasi ke domain spesifik:

```ts
'Access-Control-Allow-Origin': 'https://mua-jadwal.web.app',
```

Untuk saat ini (fase tester) masih bisa diterima, namun wajib diperketat sebelum rilis umum.

---

## 📊 Scorecard Perkembangan — 5 Review

| Kategori | #1 | #2 | #3 | #4 | #5 |
|----------|:--:|:--:|:--:|:--:|:--:|
| Bug Kritis | 7 | 2 | 3 | 5 | **3** ✅ |
| Security | 0 | 1 | 1 | 1 | **1** |
| Logic Issue | 3 | 3 | 4 | 5 | **5** |
| UX Issue | 6 | 2 | 3 | 4 | **3** |
| Dead Code | 0 | 0 | 0 | 2 | **1** |
| Fitur Baru | — | — | 1 | 3 | **3** |

---

## 🎯 Checklist Sebelum Serahkan ke Tester Real User

### Wajib Diselesaikan Terlebih Dahulu
- [ ] **Fix `clientId` → `client_id`** di public booking insert — fitur utama tidak bisa dipakai
- [ ] **Deploy Supabase Edge Function** `parse-booking` dan set `GROQ_API_KEY` secret — AI Asisten tidak akan berfungsi tanpa ini
- [ ] **Tambah validasi nomor WA** di form booking publik
- [ ] **Tambah `minimumDate`** di date picker form booking publik

### Disarankan Sebelum Testing
- [ ] Fix loading/not-found state di booking detail (return null → proper screen)
- [ ] Hubungkan `APP_CONFIG.SUPPORT_WHATSAPP` ke tombol Bantuan & Support
- [ ] Tambah banner peringatan di card Link Booking Publik bahwa domain belum aktif
- [ ] Hapus `Animated` import yang unused di onboarding
- [ ] Seragamkan versi antara `APP_CONFIG.VERSION` dan footer UI

### Bisa Ditunda Pasca Testing
- [ ] Batasi CORS edge function dari wildcard ke domain spesifik
- [ ] Perbaiki mapping `{{layanan}}` dari eventType ke service name
- [ ] Ganti label tombol "Tutup" di success screen public booking

---

## 💬 Catatan untuk Tester Real User

Jika kamu adalah tester yang membaca laporan ini, berikut catatan penting:

| Fitur | Status Tester |
|-------|:-------------:|
| Login / Register | ✅ Siap ditest |
| Dashboard & Kalender | ✅ Siap ditest |
| Buat Booking (form manual) | ✅ Siap ditest |
| Manajemen Klien | ✅ Siap ditest |
| Keuangan & Invoice | ✅ Siap ditest |
| **AI Asisten** (parse pesan WA) | ⚠️ Perlu deploy edge function dulu |
| **Link Booking Publik** | ⚠️ Form bisa ditest, tapi link share ke domain yang belum aktif |
| Onboarding | ✅ Siap ditest |
| Settings & Template WA | ✅ Siap ditest |
| Pengingat via WhatsApp | ✅ Siap ditest |

---

*Laporan ini dibuat dari hasil code review statis terhadap repository `sisamsamsi/jadwal_mua` branch `main`.*
*Reviewer: Claude Sonnet — 10 Mei 2026*
*Review ke-5 dari 5 sesi review.*
