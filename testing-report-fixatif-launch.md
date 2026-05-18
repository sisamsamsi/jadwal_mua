# 🧪 Laporan Testing Final — Persiapan Launching Fixatif
**Commit:** `ea90047`
**Tanggal:** 18 Mei 2026
**Reviewer:** Claude Sonnet (Review ke-9 — Launch Preparation)
**Scope:** Login · Register · SSO · Push Notification · Semua Fitur · UX · Dead Code · Security

---

## ✅ Konfirmasi Fix dari Review Sebelumnya

| # | Item | Status |
|---|------|--------|
| 1 | `setNotificationHandler` untuk foreground notification | ✅ Ada di baris 42 |
| 2 | SSO token parsing dengan `hashIndex` — lebih aman dari `replace('#','?')` | ✅ |
| 3 | Deep link handler OAuth callback di `_layout.tsx` | ✅ |
| 4 | Password minimum seragam **8 karakter** di register & reset-password | ✅ |
| 5 | `authService.signInWithOAuth()` dead code sudah dihapus | ✅ |
| 6 | `intentFilters` Android sudah ada di `app.json` | ✅ |
| 7 | `Promise.race()` timeout 2 detik untuk Supabase di navigation guard | ✅ |
| 8 | `realtimeChannelRef` pakai `useRef` — memory leak teratasi | ✅ |
| 9 | `useProfile()` normalisasi snake_case → camelCase | ✅ |
| 10 | `settings/subscription.tsx` sudah pakai `useProfile()` | ✅ |
| 11 | `scheduleBookingReminder` pakai format trigger `SchedulableTriggerInputTypes.DATE` | ✅ |
| 12 | Open booking kirim push notif langsung ke Expo Push server | ✅ Solusi bagus |
| 13 | `userId` sudah disertakan di `handleCreateClient` & `handleCreateService` | ✅ |
| 14 | `staleTime` dan `refetchOnWindowFocus` di `useProfile()` | ✅ |

---

## 🔴 Bug Kritis — Wajib Sebelum Launch

---

### 1. Subscription Screen Tidak Punya Auto-Navigate & Tombol Cek Status

**File:** `app/subscription.tsx`

Jumlah `useEffect` di file ini: **0**

Ketika admin mengaktifkan langganan user di panel admin → Supabase diupdate → tapi user yang sedang di halaman ini tidak akan pernah otomatis masuk ke dashboard. Tidak ada:
- `useEffect` yang memantau `profile.subscriptionStatus` dan navigate ke home jika aktif
- Tombol "Cek Status" untuk trigger manual refetch
- Pull-to-refresh

Satu-satunya cara user bisa masuk setelah admin aktifkan adalah **force close lalu buka ulang**. Ini UX yang sangat buruk untuk momen penting seperti aktivasi langganan.

**Lokasi fix:**
- Tambah `useEffect` yang watch `profile?.subscriptionStatus` dan `router.replace('/(tabs)/home')` jika status `active` atau trial masih valid
- Tambah tombol "Sudah Bayar? Cek Status" yang memanggil `refetch()`
- Tambah `RefreshControl` pada `ScrollView`

---

### 2. Push Notifikasi Booking Baru Bisa Gagal Diam-diam Jika Token Null

**File:** `app/book/[muaId].tsx` baris 171

```ts
const { data: profileData } = await supabase.from("profiles")
  .select("fcm_token").eq("id", muaId).single();
// fcm_token bisa null jika:
// - MUA belum pernah buka app setelah grant permission
// - Token expired/tidak diperbarui
// - MUA pakai iOS dan permission belum granted

await fetch("https://exp.host/--/api/v2/push/send", {
  body: JSON.stringify({ to: profileData?.fcm_token, ... })
  // Jika fcm_token = null, request dikirim dengan to: null
  // Expo Push server menerima tapi tidak mengirim ke siapapun
  // Tidak ada error — gagal diam-diam
});
```

MUA tidak tahu ada booking masuk. Ini bug kritis untuk core value proposition app.

**Lokasi fix:** Di `book/[muaId].tsx`, tambahkan cek sebelum kirim:
```ts
if (!profileData?.fcm_token) {
  console.warn("MUA push token not found, notification skipped");
  return; // atau simpan ke tabel antrian notifikasi
}
```

Dan pastikan `fcm_token` selalu diperbarui saat login di `_layout.tsx` (sudah ada logikanya, tapi perlu dipastikan tersimpan ke kolom `fcm_token` di Supabase `profiles`, bukan hanya di SQLite lokal).

---

### 3. Realtime Channel: `showImmediateNotification` Diimport tapi Tidak Dipanggil

**File:** `app/_layout.tsx` baris 39

```ts
import { ..., showImmediateNotification } from "@/lib/utils/notifications";
// ↑ diimport tapi tidak pernah dipanggil di seluruh file
```

Realtime handler sekarang hanya memanggil `syncRepository.fullSync()` — tidak ada notifikasi lokal yang ditampilkan. Logika baru mengandalkan Expo Push Server dari `book/[muaId].tsx`. Ini desain yang baik, tapi import `showImmediateNotification` jadi dead import yang membingungkan.

**Lokasi fix:** Hapus `showImmediateNotification` dari import di `_layout.tsx`.

---

## 🟠 Logic Issue

---

### 4. `isSynced` dan `isSyncTimedOut` Dideklarasikan tapi Tidak Dipakai

**File:** `app/_layout.tsx` baris 77-78

```ts
const [isSynced, setIsSynced] = useState(false);       // ← diset tapi tidak dibaca di guard
const [isSyncTimedOut, setIsSyncTimedOut] = useState(false); // ← diset tapi tidak dibaca di mana pun
```

Navigation guard hanya mengecek `isLoading` dan `isHydrated`. Kedua state ini menyebabkan re-render yang tidak perlu setiap kali `fullSync()` selesai atau timeout, tanpa manfaat apapun.

**Lokasi fix:** Hapus kedua state ini beserta pemanggilan `setIsSynced()` dan `setIsSyncTimedOut()`.

---

### 5. `settings/subscription.tsx` — Trial Hardcoded "7 Hari" Tidak Konsisten

**File:** `app/settings/subscription.tsx` baris 19 & 59

```ts
// Jika expiryDate null → pakai 7 hari dari sekarang sebagai fallback
const trialEndsAt = expiryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

// Badge label:
{subscriptionStatus === 'trial' ? 'Free Trial (7 Hari)' : 'Premium Member'}
```

Di onboarding dan marketing poster disebutkan **14 hari** trial. `settings/subscription.tsx` menampilkan "7 Hari". Ini inkonsistens yang membingungkan user.

---

### 6. OTA Update Alert Muncul di Tengah Flow User

**File:** `app/_layout.tsx`

`onFetchUpdateAsync()` dipanggil langsung saat mount tanpa delay. Jika user sedang mengisi form booking dan OTA tersedia, Alert "Update Tersedia" muncul di tengah-tengah, memotong alur kerja.

**Lokasi fix:** Tambahkan delay minimum 30 detik sebelum cek OTA:
```ts
setTimeout(onFetchUpdateAsync, 30000);
```

---

### 7. `console.log("Updates error:", error)` Tanpa `__DEV__` Guard

**File:** `app/_layout.tsx` baris 269

```ts
} catch (error) {
  console.log("Updates error:", error); // ← production log tanpa guard
}
```

Satu-satunya `console.log` tanpa `__DEV__` yang tersisa. Minor tapi perlu dibersihkan sebelum launch.

---

## 🟡 UX Issue

---

### 8. Tombol Back di Subscription Screen Bisa Crash Navigation

**File:** `app/subscription.tsx`

```ts
<TouchableOpacity onPress={() => router.back()}>
```

Ketika user di-redirect ke `/subscription` karena expired (dari navigation guard), tidak ada halaman sebelumnya di stack. `router.back()` akan mencoba pop stack yang kosong → layar hitam atau crash navigasi.

**Lokasi fix:** Ganti dengan navigasi eksplisit atau sembunyikan tombol back jika tidak ada history:
```ts
// Cek apakah bisa back
onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')}
```

---

### 9. OTA Update Tidak Ada Indikator "Sedang Menginstall"

Setelah user tap "Update & Restart", proses `fetchUpdateAsync()` + `reloadAsync()` berjalan tanpa feedback visual. User tidak tahu harus menunggu. Jika proses lambat, user bisa force-close sebelum download selesai.

**Lokasi fix:** Tambahkan `setIsUpdating(true)` sebelum `fetchUpdateAsync()` dan tampilkan overlay loading "Mengunduh pembaruan..." sebelum `reloadAsync()`.

---

### 10. Benefit AI Asisten Tidak Disebutkan di Subscription Screen

**File:** `app/subscription.tsx`

Daftar benefit yang tampil:
```
✅ Manajemen Jadwal Tanpa Batas
✅ Sistem Invoice & Kwitansi Otomatis
✅ Laporan Keuangan & Laba Rugi
✅ Booking Link untuk Klien
✅ Manajemen Inventaris Produk
```

**Tidak ada "AI Asisten dari Pesan WA"** — padahal ini fitur pembeda utama yang disebutkan di poster marketing dan onboarding. Ini melemahkan daya jual di momen konversi paling kritis.

---

## 🔒 Security

### 11. Reset Password Tidak Validasi Session Recovery

**File:** `app/(auth)/reset-password.tsx`

Layar ini dibuka via deep link `mua-app://reset-password`. Tidak ada pengecekan apakah deep link berasal dari email yang valid (token recovery Supabase). Siapapun yang mengetahui skema URL bisa membuka layar ini dan mencoba mengubah password.

**Lokasi fix:**
```ts
useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    if (!data.session) {
      showAlert("Link Tidak Valid", "Link reset password sudah kadaluarsa.");
      router.replace("/(auth)/login");
    }
  });
}, []);
```

---

## 📊 Scorecard Akhir — 9 Review

| Kategori | #1 | #3 | #5 | #7 | #8 | **#9** |
|----------|:--:|:--:|:--:|:--:|:--:|:------:|
| Bug Kritis | 7 | 3 | 3 | 4 | 4 | **3** |
| Logic Issue | 3 | 4 | 4 | 4 | 5 | **4** |
| UX Issue | 6 | 3 | 3 | 4 | 4 | **3** |
| Security | 0 | 1 | 1 | 2 | 2 | **1** |
| Dead Code | 0 | 0 | 1 | 2 | 1 | **1** |

---

## 🚀 Checklist Launch Readiness

### 🔴 Wajib Selesai Sebelum Launch

| # | Item | File |
|---|------|------|
| 1 | Tambah `useEffect` auto-navigate + tombol "Cek Status" di subscription screen | `app/subscription.tsx` |
| 2 | Validasi `fcm_token` tidak null sebelum kirim push notif | `app/book/[muaId].tsx` |
| 3 | Hapus dead import `showImmediateNotification` | `app/_layout.tsx:39` |
| 4 | Validasi session recovery di reset-password | `app/(auth)/reset-password.tsx` |

### 🟠 Sangat Disarankan Sebelum Launch

| # | Item | File |
|---|------|------|
| 5 | Hapus dead state `isSynced` dan `isSyncTimedOut` | `app/_layout.tsx:77-78` |
| 6 | Fix tombol back di subscription screen | `app/subscription.tsx` |
| 7 | Tambah "AI Asisten dari Pesan WA" ke daftar benefit | `app/subscription.tsx` |
| 8 | Seragamkan trial "7 Hari" → "14 Hari" di settings/subscription | `app/settings/subscription.tsx` |

### 🟡 Bisa Segera Setelah Launch

| # | Item | File |
|---|------|------|
| 9 | OTA alert: tambah delay 30 detik sebelum muncul | `app/_layout.tsx` |
| 10 | OTA install: tambah overlay "Mengunduh..." | `app/_layout.tsx` |
| 11 | Hapus `console.log("Updates error:", error)` atau bungkus `__DEV__` | `app/_layout.tsx:269` |

---

## 💬 Status Fitur — Launch Readiness

| Fitur | Status | Catatan |
|-------|:------:|---------|
| Login Email/Password | ✅ Siap | |
| Register | ✅ Siap | |
| Lupa & Reset Password | ✅ Siap | Tambah validasi session (security) |
| SSO Google | ✅ Siap | intentFilters & token parsing sudah benar |
| SSO Facebook | ⏳ Coming Soon | Sudah dilabeli |
| Onboarding | ✅ Siap | |
| Dashboard & Kalender | ✅ Siap | |
| Buat Booking + Conflict Detection | ✅ Siap | |
| AI Asisten (parse pesan WA) | ✅ Siap | Butuh edge function terdeploy |
| Bridal Party | ✅ Siap | |
| Invoice | ✅ Siap | |
| Keuangan | ✅ Siap | |
| Manajemen Klien & Layanan | ✅ Siap | |
| Template WA | ✅ Siap | |
| H-1 Reminder Notifikasi | ✅ Siap | Format trigger sudah benar |
| Push Notif Booking dari Web | ⚠️ Perlu Fix | Validasi `fcm_token` null |
| Open Booking Link (Web) | ✅ Siap | |
| Subscription Gating | ⚠️ Perlu Fix | Auto-navigate & cek status manual |
| OTA Update | ✅ Fungsional | UX perlu dipoles |
| Cloud Sync (Offline-first) | ✅ Siap | |

---

## 📝 Catatan untuk Tester Real User

Sebelum diserahkan ke tester, pastikan:
1. **Supabase Realtime** diaktifkan untuk tabel `bookings` di Dashboard
2. **Edge Function** `parse-booking` sudah terdeploy dengan `GROQ_API_KEY` tersimpan di secrets
3. **URL Redirect SSO** terdaftar di Google Console & Supabase untuk lingkungan tester
4. **Nomor admin WA** `628884000585` aktif dan siap menerima pesan dari user yang ingin berlangganan

---

*Laporan ini dibuat dari code review statis terhadap repository `sisamsamsi/jadwal_mua` branch `main`.*
*Fixatif — Kunci jadwalmu, pastikan sempurna · Review ke-9 · Launch Preparation · 18 Mei 2026*
