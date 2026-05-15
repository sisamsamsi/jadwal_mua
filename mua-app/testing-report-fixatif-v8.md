# 🧪 Laporan Testing Komprehensif — Fixatif App
**Commit:** `2bb2f68`
**Tanggal Review:** 16 Mei 2026
**Reviewer:** Claude Sonnet (Review ke-8)
**Scope:** Login · Daftar · SSO Google · Push Notification · Semua Fitur · UX · Dead Code · Logic · Security

---

## ✅ Yang Sudah Diperbaiki dari Review Sebelumnya

| # | Item | Status |
|---|------|--------|
| 1 | `subscription.tsx` sudah pakai `useProfile()` — data benar | ✅ |
| 2 | Deep link handler untuk reset-password di `_layout.tsx` | ✅ |
| 3 | `cancelNotificationByBookingId` ditambahkan | ✅ |
| 4 | `scheduleSubscriptionReminder` dan `showImmediateNotification` ditambahkan | ✅ |
| 5 | Realtime booking listener — notifikasi saat booking baru dari web | ✅ Fitur bagus |
| 6 | Double `getSession()` sudah digabung | ✅ |
| 7 | Tab `plus` kini navigasi ke `/booking/new` | ✅ |
| 8 | Google SSO pakai image logo resmi | ✅ |
| 9 | `console.log` sebagian sudah dibungkus `if (__DEV__)` | ✅ |

---

## 🔴 BUG KRITIS #1 — SSO Google: "Loading Terus" (Root Cause Lengkap)

**File:** `app/(auth)/login.tsx` · `app/_layout.tsx` · `app.json`

Screenshot menunjukkan Google "Choose an account" berhasil muncul — artinya konfigurasi Google Console dan Supabase sudah **benar**. Masalah terjadi **setelah** user memilih akun.

---

### Trace Alur yang Terjadi

```
User pilih akun Google ✅
        ↓
Google → Supabase callback ✅
        ↓
Supabase → redirect ke mua-app://login#access_token=...
        ↓
Android (Expo Go): TIDAK TAHU cara handle mua-app:// ❌
Chrome Custom Tab tidak bisa menutup sendiri
Browser tetap loading selamanya
        ↓
WebBrowser.openAuthSessionAsync tidak pernah return 'success'
setSession() tidak dipanggil
onAuthStateChange tidak fire
Navigasi ke home tidak terjadi → loading selamanya
```

Ada **3 lapis masalah** yang harus diselesaikan bersamaan:

---

### Masalah A — `redirectUrl` Hardcoded Tidak Bekerja di Expo Go

**File:** `app/(auth)/login.tsx` baris 30

```ts
// SEKARANG — hardcoded, tidak bekerja di Expo Go
const redirectUrl = 'mua-app://login';
```

Di Expo Go, scheme aktif adalah `exp://` bukan `mua-app://`. Android tidak bisa menangkap redirect ke `mua-app://` karena scheme ini tidak terdaftar di Expo Go.

**Fix:**
```ts
import * as Linking from 'expo-linking';

// Otomatis sesuai environment:
// Expo Go   : exp://192.168.x.x:8081/--/login
// Standalone: mua-app://login
const redirectUrl = Linking.createURL('login');
```

Setelah fix ini, tambahkan URL Expo Go ke **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**:
```
exp://[IP-dev-machine]:8081/--/login
```

---

### Masalah B — `app.json` Tidak Ada `intentFilters` untuk Android

Tanpa `intentFilters`, Android tidak tahu bahwa app perlu menangani URL dengan scheme `mua-app://`. Chrome Custom Tab tidak bisa menutup dan kembali ke app.

**Fix — Tambahkan di `app.json` bagian `android`:**
```json
"android": {
  "intentFilters": [
    {
      "action": "VIEW",
      "autoVerify": true,
      "data": [{ "scheme": "mua-app" }],
      "category": ["BROWSABLE", "DEFAULT"]
    }
  ]
}
```

> ⚠️ Perubahan ini membutuhkan **build ulang APK** — tidak bisa hot reload.

---

### Masalah C — `handleDeepLink` Tidak Menangkap Token OAuth

**File:** `app/_layout.tsx`

```ts
// SEKARANG — hanya handle reset-password, token OAuth diabaikan
const handleDeepLink = (url: string | null) => {
  if (url?.includes('reset-password') || url?.includes('type=recovery')) {
    router.replace('/(auth)/reset-password');
  }
  // ← access_token dari SSO tidak ditangani sama sekali!
};
```

Bahkan jika deep link `mua-app://login#access_token=...` berhasil ditangkap oleh app, fungsi ini mengabaikannya. Token tidak diproses, session tidak dibuat.

**Fix:**
```ts
const handleDeepLink = (url: string | null) => {
  if (!url) return;

  // Handle password reset
  if (url.includes('reset-password') || url.includes('type=recovery')) {
    router.replace('/(auth)/reset-password');
    return;
  }

  // Handle OAuth callback dari Google SSO
  if (url.includes('access_token')) {
    try {
      // Hash fragment (#) diubah ke query string (?) agar bisa di-parse
      const hashIndex = url.indexOf('#');
      const tokenString = hashIndex >= 0
        ? url.slice(hashIndex + 1)
        : url.split('?')[1] ?? '';
      const params = new URLSearchParams(tokenString);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        // onAuthStateChange akan fire → navigasi ke home otomatis
      }
    } catch (e) {
      console.error('OAuth deep link parse error:', e);
    }
  }
};
```

---

### Urutan Fix Wajib untuk SSO Berfungsi

```
Step 1: Ganti redirectUrl → Linking.createURL('login')
         ↓
Step 2: Tambah intentFilters di app.json
         ↓
Step 3: Tambah handler access_token di handleDeepLink
         ↓
Step 4: Daftarkan Expo Go URL di Supabase Redirect URLs
         ↓
Step 5: Build ulang APK (wajib setelah ubah app.json)
         ↓
Step 6: Test — browser menutup otomatis → masuk dashboard ✅
```

---

## 🔴 Bug Kritis Lainnya

### 2. Parsing Token di `login.tsx` Rawan Error

**File:** `app/(auth)/login.tsx` baris 46

```ts
// RAWAN — jika URL sudah ada '?', menjadi dua tanda tanya
const parsedUrl = new URL(res.url.replace('#', '?'));
```

Jika URL berbentuk `mua-app://login?code=xxx#access_token=yyy`, hasilnya adalah URL tidak valid dengan dua `?`. URL parsing akan throw error, token tidak terekstrak.

**Fix:**
```ts
const hashIndex = res.url.indexOf('#');
const tokenString = hashIndex >= 0
  ? res.url.slice(hashIndex + 1)
  : res.url.split('?')[1] ?? '';
const params = new URLSearchParams(tokenString);
const accessToken = params.get('access_token');
const refreshToken = params.get('refresh_token');
```

---

### 3. Nomor WA Admin Masih Placeholder di `subscription.tsx`

**File:** `app/subscription.tsx` baris 19

```ts
const adminWA = "628123456789"; // ← nomor fake, momen kritis monetisasi
```

Layar ini muncul saat user expired. User yang ingin berlangganan diarahkan ke nomor tidak valid.

---

### 4. `settings/subscription.tsx` Masih Pakai Data yang Salah

**File:** `app/settings/subscription.tsx`

```ts
// SALAH — user_metadata tidak berisi data subscription
const subscriptionStatus = user?.user_metadata?.subscription_status || "trial";
const trialEndsAt = user?.user_metadata?.trial_ends_at || ...
```

Data subscription disimpan di tabel `profiles` via `profileRepository`, bukan di Supabase Auth `user_metadata`. Layar ini selalu tampil "trial" dengan tanggal default, bukan data aktual user.

**Fix:** Ganti ke `useProfile()` seperti `app/subscription.tsx`.

---

## 🟠 Logic Issue

### 5. `realtimeChannel` Potensi Memory Leak & Duplikasi Notifikasi

**File:** `app/_layout.tsx`

```ts
let realtimeChannel: any = null; // declared inside useEffect

// Di dalam onAuthStateChange:
if (realtimeChannel) supabase.removeChannel(realtimeChannel);
const channel = supabase.channel('public-bookings-listener');
// ↑ closure menangkap realtimeChannel dari render sebelumnya
// Setiap auth state change membuat channel baru
// Reference lama di closure tidak terupdate → channel lama tidak ter-remove
```

Setiap kali auth state berubah, channel Supabase baru dibuat tanpa memastikan channel lama terhapus. Potensi notifikasi booking masuk tampil duplikat.

**Fix:** Gunakan `useRef` untuk menyimpan reference channel:
```ts
const realtimeChannelRef = useRef<any>(null);

// Di dalam onAuthStateChange:
if (realtimeChannelRef.current) {
  supabase.removeChannel(realtimeChannelRef.current);
}
realtimeChannelRef.current = supabase.channel('public-bookings-listener');
```

---

### 6. Validasi Password Minimum Tidak Konsisten

| Layar | Minimum | Kode |
|-------|---------|------|
| `register.tsx` | 8 karakter | `minLength: { value: 8 }` |
| `reset-password.tsx` | **6 karakter** | `if (password.length < 6)` |

User bisa reset password ke 6-7 karakter, tapi tidak bisa membuat akun baru dengan panjang yang sama. Seragamkan ke 8 karakter.

---

### 7. Push Notification — Tidak Ada Feedback jika Izin Ditolak

**File:** `lib/utils/notifications.ts`

```ts
if (finalStatus !== "granted") {
  console.log("Failed to get push token!");
  return null; // ← diam-diam gagal
}
```

Jika user menolak izin notifikasi, tidak ada Alert atau penjelasan. User tidak tahu mengapa reminder booking tidak bekerja.

---

### 8. `authService.signInWithOAuth()` — Dead Code

**File:** `lib/supabase/auth.ts`

Fungsi ini tidak pernah dipanggil dari mana pun. `login.tsx` memanggil `supabase.auth.signInWithOAuth()` langsung. Membingungkan saat maintenance.

---

## 🟡 UX Issue

### 9. Tidak Ada Spinner Visual saat SSO Loading

Tombol berubah teks menjadi "Menghubungkan..." tapi tidak ada spinner. Jika browser loading lama, user tidak yakin apakah proses berjalan atau sudah macet.

### 10. `reset-password.tsx` Tidak Ada Tombol Kembali

Tidak ada cara keluar dari layar ini jika deep link dibuka secara tidak sengaja atau tidak valid.

---

## 🔒 Security

### 11. Reset Password Tidak Validasi Session dari Magic Link

**File:** `app/(auth)/reset-password.tsx`

`updateUserPassword()` bisa dipanggil siapapun yang tahu URL skema deep link tanpa token valid dari email.

**Fix:**
```ts
useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    if (!data.session) {
      showAlert("Link Tidak Valid", "Link reset password sudah kadaluarsa.");
      router.replace('/(auth)/login');
    }
  });
}, []);
```

---

## 📊 Scorecard — 8 Review

| Kategori | #1 | #2 | #3 | #4 | #5 | #6 | #7 | **#8** |
|----------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:------:|
| Bug Kritis | 7 | 2 | 3 | 5 | 3 | 3 | 4 | **4** |
| Logic Issue | 3 | 3 | 4 | 5 | 4 | 5 | 4 | **4** |
| UX Issue | 6 | 2 | 3 | 4 | 3 | 4 | 4 | **2** ↓ |
| Security | 0 | 1 | 1 | 1 | 1 | 1 | 2 | **2** |
| Dead Code | 0 | 0 | 0 | 2 | 1 | 1 | 2 | **1** ↓ |

---

## 🎯 Prioritas Fix

### 🔴 SSO Google (3 fix harus bersamaan)

| # | Fix | File |
|---|-----|------|
| 1 | Ganti `'mua-app://login'` → `Linking.createURL('login')` | `login.tsx:30` |
| 2 | Tambah `intentFilters` di `app.json` bagian android | `app.json` |
| 3 | Tambah handler `access_token` di `handleDeepLink` | `_layout.tsx` |
| 4 | Daftarkan Expo Go URL di Supabase Redirect URLs | Dashboard |
| 5 | **Build ulang APK** setelah ubah `app.json` | Terminal |

### 🔴 Monetisasi

| # | Fix | File |
|---|-----|------|
| 6 | Ganti nomor WA admin `628123456789` | `subscription.tsx:19` |
| 7 | Fix `settings/subscription.tsx` → pakai `useProfile()` | `settings/subscription.tsx` |

### 🟠 Penting

| # | Fix | File |
|---|-----|------|
| 8 | Fix URL parsing token — ganti `replace('#','?')` | `login.tsx:46` |
| 9 | Fix `realtimeChannel` → gunakan `useRef` | `_layout.tsx` |
| 10 | Seragamkan password minimum 8 karakter | `reset-password.tsx:30` |
| 11 | Alert jika izin push notification ditolak | `notifications.ts` |
| 12 | Validasi session di `reset-password.tsx` | `reset-password.tsx` |

### 🟡 Bisa Ditunda

| # | Fix | File |
|---|-----|------|
| 13 | Hapus `authService.signInWithOAuth()` dead code | `lib/supabase/auth.ts` |
| 14 | Tambah tombol kembali di `reset-password.tsx` | `reset-password.tsx` |
| 15 | Tambah spinner visual saat SSO loading | `login.tsx` |

---

## 💬 Catatan untuk Testing SSO di Expo Go

Karena Expo Go tidak mendukung custom scheme `mua-app://`, ada dua opsi untuk testing SSO sebelum build final:

**Opsi 1 — Gunakan Development Build (direkomendasikan)**
```bash
eas build --profile development --platform android
```
Development build mendukung custom scheme dan semua native module sepenuhnya.

**Opsi 2 — Test di Expo Go dengan URL dinamis**
Setelah fix Masalah A, Expo Go akan generate URL seperti `exp://192.168.x.x:8081/--/login`. Daftarkan URL ini di Supabase, lalu test dari Expo Go.

---

*Laporan ini dibuat dari code review statis terhadap repository `sisamsamsi/jadwal_mua` branch `main`.*
*Fixatif — Kunci jadwalmu, pastikan sempurna · Review ke-8 · 16 Mei 2026*
