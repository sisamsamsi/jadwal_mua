# 🧪 Laporan Testing — MUA App
**Commit:** `c38d257` + `dbd0969`
**Tanggal Review:** 10 Mei 2026
**Scope:** UI/UX · Kemudahan User · Logic Issue · Security · Placeholder · Bug & Error

---

## ✅ Yang Sudah Diperbaiki dari Review Sebelumnya

| # | Item | Status |
|---|------|--------|
| 1 | `test_route.tsx` sudah dihapus | ✅ |
| 2 | `register.tsx` — `alert()` diganti `Alert.alert()` | ✅ |
| 3 | Register — validasi lengkap (required, format email, min 8 karakter) | ✅ |
| 4 | Register — field konfirmasi password ditambahkan | ✅ |
| 5 | Register — error Supabase diterjemahkan ke Bahasa Indonesia | ✅ |
| 6 | Register — redirect ke login dengan Alert info terlebih dahulu | ✅ |
| 7 | Profile badge — dinamis (Lisensi Aktif vs Mode Trial) | ✅ |
| 8 | Profile "Bantuan & Support" — sudah ada Alert, tidak mati lagi | ✅ |
| 9 | Profile `displayName` — pakai `user_metadata.full_name` terlebih dahulu | ✅ |
| 10 | Booking form — field lokasi & catatan sekarang tampil di UI | ✅ |
| 11 | Judul & tombol simpan booking — dinamis (1 orang vs rombongan) | ✅ |
| 12 | AI Asisten terintegrasi dengan Groq API | ✅ Fitur baru |

---

## 🔴 Bug & Error Kritis

### 1. 🚨 GROQ API Key Terekspos di Dalam APK — Security Critical

**File:** `lib/services/ai-service.ts`

```ts
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
```

Prefix `EXPO_PUBLIC_` berarti key ini **dibundle langsung ke dalam file JavaScript APK**. Siapapun yang melakukan decompile APK dengan tools seperti `apktool` dapat membaca key ini dalam hitungan menit. Risiko yang ditimbulkan:

- Penyalahgunaan kuota Groq yang ditanggung pemilik key
- Akses tak sah ke API atas nama kamu
- Potensi data leakage jika key memiliki permission lebih luas

**Solusi wajib:** Buat proxy melalui **Supabase Edge Function**:

```
App → Supabase Edge Function (simpan GROQ_API_KEY di server) → Groq API
```

Key Groq disimpan di environment variable Supabase (server-side) dan tidak pernah sampai ke device user.

---

### 2. AI Parse Mengisi `clientName` tapi `clientId` Tetap Kosong — Form Tidak Bisa Disimpan

**File:** `app/booking/new.tsx`

Setelah AI berhasil mengekstrak data, `result` berisi `clientName: "Ibu Rina"` namun `clientId` tetap string kosong `""`. Validasi saat menyimpan mengharuskan `clientId` tidak kosong:

```tsx
// handleAiParse — result di-spread langsung tanpa clientId
setFormData(prev => ({ ...prev, ...result, totalPrice: prev.totalPrice }));

// handleSave — validasi ini SELALU GAGAL setelah AI parse
if (!formData.clientId || ...) {
  Alert.alert("Error", "Mohon lengkapi data wajib (Klien, Tanggal, Waktu)");
}
```

User melihat nama klien sudah terisi di form namun tidak bisa menyimpan dan mendapat pesan error yang membingungkan.

**Solusi:** Setelah AI parse, cari `clientId` dari list `clients` berdasarkan nama yang mirip, lalu set otomatis. Atau tampilkan instruksi agar user mengetuk kartu klien yang sesuai.

---

### 3. AI Bisa Mengembalikan `null` untuk `endTime` — Bug Tampilan & Logika

**File:** `lib/services/ai-service.ts` + `app/booking/new.tsx`

System prompt menyatakan: *"Jika data tidak ditemukan, beri nilai null"*. Jika pesan WA tidak menyebut jam selesai, AI mengembalikan `endTime: null`. Akibatnya:

- Tombol jam selesai menampilkan teks literal `"null"`
- Validasi `formData.endTime <= formData.startTime` → `null <= "08:00"` → `true` → error yang salah
- `DateTimePickerModal` menerima `null` sebagai nilai awal, berpotensi crash

**Solusi:** Tambahkan fallback di `handleAiParse`:

```tsx
setFormData(prev => ({
  ...prev,
  ...result,
  endTime: result.endTime || prev.endTime,
  startTime: result.startTime || prev.startTime,
  bookingDate: result.bookingDate || prev.bookingDate,
  totalPrice: prev.totalPrice
}));
```

---

### 4. `.env.example` Tidak Mencantumkan `EXPO_PUBLIC_GROQ_API_KEY`

**File:** `.env.example`

```bash
# Isi .env.example saat ini — tidak lengkap
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_public_key_here
# ← EXPO_PUBLIC_GROQ_API_KEY tidak ada
```

Pembeli atau developer yang melakukan setup ulang tidak akan mengetahui bahwa key ini dibutuhkan. Fitur AI Asisten akan gagal secara diam-diam tanpa pesan error yang jelas.

---

## 🟠 Logic Issue

### 5. `home.tsx` — `displayName` Masih Pakai Prefix Email, Belum Difix

**File:** `app/(tabs)/home.tsx` baris 31

Profile screen sudah diperbaiki menggunakan `user_metadata.full_name`, namun Dashboard belum diperbarui:

```tsx
// home.tsx — BELUM DIUPDATE
const displayName = userEmail.split("@")[0];

// Seharusnya konsisten dengan profile.tsx:
const displayName =
  session?.user?.user_metadata?.full_name ??
  session?.user?.user_metadata?.name ??
  userEmail.split("@")[0];
```

---

### 6. Profile — Tombol Edit Foto (Ikon Settings) Masih Mati

**File:** `app/(tabs)/profile.tsx` baris 44

```tsx
onPress={() => {}}  // ← tidak berubah dari review sebelumnya
```

User tidak dapat mengedit nama, nomor WhatsApp, atau nama bisnis mereka dari dalam aplikasi. Sudah dilaporkan di dua review sebelumnya dan belum diperbaiki.

---

### 7. `checkConflict` Tidak Ada di Dependency Array `useEffect` — Stale Closure Bug

**File:** `app/booking/new.tsx`

```tsx
useEffect(() => {
  const conflict = checkConflict(...); // fungsi didefinisikan di luar effect
  ...
}, [formData.bookingDate, formData.startTime, formData.endTime, allBookings]);
//  ↑ checkConflict tidak ada di sini
```

Dalam kondisi tertentu saat re-render, fungsi `checkConflict` yang sudah stale (lama) dapat digunakan sehingga hasil pengecekan konflik tidak akurat.

**Solusi:** Bungkus `checkConflict` dengan `useCallback` dan tambahkan ke dependency array.

---

### 8. `isLicenseActive` Masih Belum Di-enforce ke Fitur Apapun

Flag `isLicenseActive` ada di store dan badge profile sudah dinamis, namun tidak ada satu fitur pun yang benar-benar terkunci ketika nilainya `false`. Seluruh fitur tetap dapat diakses bebas tanpa lisensi aktif. Ini sudah dilaporkan di tiga review berturut-turut.

---

### 9. AI Parse `bookingDate` — Tidak Ada Validasi Format dari AI

Jika LLM mengembalikan tanggal dalam format selain `YYYY-MM-DD` (misalnya `"12 Desember 2025"` atau `"12/12/2025"`), string tersebut langsung masuk ke `formData.bookingDate` tanpa validasi. Date picker kemudian menampilkan string yang tidak valid tanpa pesan error apapun.

---

## 🟡 UX Issue

### 10. AI Modal — Tidak Ada Feedback Field Mana yang Berhasil Diisi

Setelah parse berhasil, modal langsung menutup dengan Alert *"Data berhasil diekstrak"*. User tidak mengetahui field mana yang berhasil diisi AI dan mana yang perlu dilengkapi secara manual.

**Saran:** Tampilkan ringkasan singkat sebelum modal menutup, contoh:
> *"Terisi: Tanggal, Jam Mulai, Lokasi. Perlu dilengkapi: Klien, Jam Selesai."*

---

### 11. AI Modal — Tidak Ada Batas Panjang Teks Input

User dapat mem-paste seluruh percakapan WhatsApp yang panjang (ratusan baris). Ini dapat menyebabkan request yang lambat, timeout, atau penggunaan token yang tidak perlu.

**Saran:** Tambahkan batas karakter (misalnya 1.000 karakter) dengan counter yang terlihat.

---

## 📊 Scorecard Perkembangan

| Kategori | Review #1 | Review #2 | Review #3 | Sekarang |
|----------|:---------:|:---------:|:---------:|:--------:|
| Bug Kritis | 7 | 2 | 1 | **3** |
| Security | 0 | 1 | 2 | **1** ⚠️ |
| Logic Issue | 3 | 3 | 3 | **4** |
| UX Issue | 6 | 2 | 6 | **3** |
| File Sampah | 0 | 0 | 1 | **0** ✅ |

> Catatan: Kenaikan jumlah bug kritis bukan berarti app memburuk — melainkan karena penambahan fitur AI baru yang membawa risiko baru. Progress keseluruhan tetap positif.

---

## 🎯 Prioritas Fix Sebelum Dijual

| # | Item | Urgensi |
|---|------|:-------:|
| 1 | Pindahkan Groq API call ke Supabase Edge Function | 🔴 Wajib |
| 2 | Fix `clientId` kosong setelah AI parse | 🔴 Wajib |
| 3 | Tambah fallback `null` untuk field kritis dari AI | 🔴 Wajib |
| 4 | Tambah `EXPO_PUBLIC_GROQ_API_KEY` ke `.env.example` | 🔴 Wajib |
| 5 | Fix `displayName` di `home.tsx` | 🟠 Penting |
| 6 | Fix tombol edit profil user | 🟠 Penting |
| 7 | Implementasi enforcement lisensi (gating fitur) | 🟠 Penting |
| 8 | Fix stale closure `checkConflict` di `useEffect` | 🟠 Penting |
| 9 | AI feedback ringkasan field yang terisi | 🟡 Disarankan |
| 10 | Batas karakter AI input + validasi format tanggal | 🟡 Disarankan |

---

*Laporan ini dibuat otomatis dari hasil code review statis terhadap repository `sisamsamsi/jadwal_mua` branch `main`.*
*Reviewer: Claude Sonnet — 10 Mei 2026*
