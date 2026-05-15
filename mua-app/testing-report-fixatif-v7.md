# 🧪 Laporan Testing Komprehensif — Fixatif App
**Commit:** `e718252` — "Notification, Login SSO Google"
**Tanggal Review:** 15 Mei 2026
**Reviewer:** Claude Sonnet (Review ke-7)
**Scope:** Login · Daftar · SSO Google · Push Notification · Semua Fitur · UX · Dead Code · Logic · Security

---

## ✅ Yang Sudah Berjalan dengan Baik

| # | Fitur | Status |
|---|-------|--------|
| 1 | Login email + password dengan validasi `react-hook-form` | ✅ Solid |
| 2 | Register dengan validasi lengkap + konfirmasi password | ✅ Solid |
| 3 | Lupa Password — form + kirim email reset | ✅ Baru & Berfungsi |
| 4 | `index.tsx` — tidak ada triple redirect race condition | ✅ Fix sebelumnya teraplikasi |
| 5 | Migration loading state terpisah dari error state | ✅ |
| 6 | Safety timeout 3 detik jika Supabase lambat | ✅ |
| 7 | Keep-alive heartbeat Supabase otomatis saat login | ✅ Solusi cerdas |
| 8 | OTA Update check via `expo-updates` | ✅ Baru & Berfungsi |
| 9 | Subscription screen saat expired | ✅ Alur baru |
| 10 | Push token registrasi di `_layout.tsx` setelah login | ✅ |
| 11 | `scheduleBookingReminder` terpanggil di booking repository | ✅ |
| 12 | Facebook SSO ditandai "Coming Soon" dengan Alert | ✅ Tepat |
| 13 | `displayName` di dashboard sudah pakai `user_metadata.full_name` | ✅ Fix lama teraplikasi |
| 14 | SSO Google menggunakan `WebBrowser.openAuthSessionAsync` | ✅ Pendekatan benar |

---

## 🔴 Bug & Error Kritis

---

### 1. SSO Google — Deep Link Redirect Tidak Konsisten & Belum Terdaftar

**File:** `app/(auth)/login.tsx` baris 38 + `lib/supabase/auth.ts` baris 17

`login.tsx` membuat redirect URL secara dinamis:
```ts
const redirectUrl = Linking.createURL('/login');
// Di Expo Go dev: exp://192.168.x.x:8081/--/login
// Di production build: mua-app://login
// Di Simulator: exp://127.0.0.1:8081/--/login
```

Setiap environment menghasilkan URL yang berbeda. Supabase dan Google Cloud Console hanya menerima URL yang terdaftar persis. Jika URL tidak cocok → `redirect_uri_mismatch` error → SSO gagal.

**Yang harus dilakukan:**
1. Di **Google Cloud Console → Authorized redirect URIs**, daftarkan:
   ```
   https://[project-ref].supabase.co/auth/v1/callback
   ```
2. Di **Supabase Dashboard → Authentication → URL Configuration**, tambahkan:
   ```
   mua-app://login
   ```
3. Di `login.tsx`, gunakan URL statis bukan dinamis untuk production:
   ```ts
   // GANTI:
   const redirectUrl = Linking.createURL('/login');

   // DENGAN:
   const redirectUrl = __DEV__
     ? Linking.createURL('/login')
     : 'mua-app://login';
   ```

---

### 2. Reset Password — Deep Link Tidak Tertangani → "Unmatched Route"

**File:** `lib/supabase/auth.ts` baris 49

```ts
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'mua-app://reset-password',  // ← path ini tidak ada
});
```

Ketika user klik link di email, app dibuka di `mua-app://reset-password`. Expo Router akan mencari route `/reset-password` di root — tapi screen ada di `app/(auth)/reset-password.tsx` yang di-resolve sebagai `/reset-password` (group auth tidak masuk URL).

Perlu dicek apakah route ini tertangkap dengan benar. Jika tidak, user mendapat "Unmatched Route" setelah klik email reset password — fitur ini tidak bisa dipakai.

**Fix:** Tambahkan handler di `_layout.tsx` untuk menangkap deep link reset password:
```ts
// Di useEffect yang sudah ada:
const url = await Linking.getInitialURL();
if (url?.includes('reset-password') || url?.includes('type=recovery')) {
  router.replace('/(auth)/reset-password');
}
```

Dan daftarkan di Supabase:
```
mua-app://reset-password
```

---

### 3. `subscription.tsx` — Nomor Admin WA Masih Placeholder

**File:** `app/subscription.tsx` baris 19

```ts
// Layar ini muncul ketika user expired — wajib berfungsi!
const adminWA = "628123456789"; // ← nomor fake
```

Sementara `settings/subscription.tsx` sudah pakai nomor benar `628884000585`. Layar `subscription.tsx` adalah yang pertama muncul saat user expired — ini adalah momen kritis monetisasi. Nomor placeholder di sini berarti user yang masa trial-nya habis tidak bisa menghubungi admin.

---

### 4. `settings/subscription.tsx` — Membaca Data dari Sumber yang Salah

**File:** `app/settings/subscription.tsx` baris 14-17

```ts
// SALAH — membaca dari Supabase Auth user_metadata
// Subscription data TIDAK disimpan di sana
const subscriptionStatus = user?.user_metadata?.subscription_status || "trial";
const trialEndsAt = user?.user_metadata?.trial_ends_at || new Date(...);
```

Data langganan disimpan di tabel `profiles` via `profileRepository`, bukan di `user_metadata`. Akibatnya layar ini selalu menampilkan "trial" dan tanggal yang salah, tidak peduli status langganan user sebenarnya.

**Fix:**
```tsx
// Ganti dengan:
import { useProfile } from "@/lib/hooks/use-profile";
const { data: profile } = useProfile();
const subscriptionStatus = profile?.subscriptionStatus ?? "trial";
const trialEndsAt = profile?.trialEndsAt;
```

---

## 🟠 Logic Issue

---

### 5. `_layout.tsx` — `getSession()` Dipanggil Dua Kali

**File:** `app/_layout.tsx` baris 193 & 224

```ts
// Panggilan PERTAMA — baris 193, untuk auth
supabase.auth.getSession().then(({ data }) => {
  setSession(data.session ?? null);
  setLoading(false);
});

// Panggilan KEDUA — baris 224, untuk sync
supabase.auth.getSession().then(({ data }) => {
  if (data.session) {
    syncRepository.fullSync();
  }
});
```

Dua request jaringan ke Supabase untuk hal yang sama. Cukup simpan result pertama:
```ts
supabase.auth.getSession().then(({ data }) => {
  setSession(data.session ?? null);
  setLoading(false);
  if (data.session) syncRepository.fullSync(); // ← gabung di sini
});
```

---

### 6. Validasi Password Minimum Tidak Konsisten

| Layar | Minimum |
|-------|---------|
| `register.tsx` | 8 karakter |
| `reset-password.tsx` | **6 karakter** |

User yang daftar dengan password 7 karakter tidak bisa, tapi setelah reset bisa set password 6-7 karakter. Standarkan ke 8 karakter di kedua layar.

---

### 7. `authService.signInWithOAuth()` — Dead Code di `auth.ts`

**File:** `lib/supabase/auth.ts` baris 13-21

```ts
// Fungsi ini tidak pernah dipanggil dari manapun
// login.tsx memanggil supabase.auth.signInWithOAuth() langsung
async signInWithOAuth(provider: 'google' | 'facebook') {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: 'mua-app://login', // ← berbeda dari yang di login.tsx
    },
  });
```

Selain tidak terpakai, `redirectTo` di sini berbeda dari yang di `login.tsx` — potensi confusion jika suatu saat dipakai. Hapus fungsi ini.

---

### 8. Push Notification — `scheduleBookingReminder` Dipanggil tapi Tidak Ada Mekanisme Cancel saat Booking Dihapus

**File:** `lib/repositories/booking-repository.ts` baris 123

`scheduleBookingReminder()` terpanggil saat booking dibuat — bagus. Tapi saat booking **dihapus**, `cancelNotification()` tidak dipanggil. Akibatnya notifikasi tetap muncul di HP meski bookingnya sudah dihapus.

**Fix:** Tambahkan di `deleteBooking()`:
```ts
async delete(id: string) {
  const booking = await db.select().from(bookings).where(eq(bookings.id, id));
  // Cancel notifikasi jika ada
  if (booking[0]?.notificationId) {
    await cancelNotification(booking[0].notificationId);
  }
  await db.delete(bookings).where(eq(bookings.id, id));
}
```

---

### 9. Subscription Check di `_layout.tsx` — `profileRepository.getById()` di dalam `useEffect` tanpa Error Boundary

**File:** `app/_layout.tsx` baris 115-145

```ts
// Jika profileRepository.getById() throw error,
// seluruh navigasi crash tanpa pesan yang jelas
const profile = await profileRepository.getById(session.user.id);
```

Ada `try/catch` di luar tapi error hanya di-log ke console — tidak ada fallback navigasi. Jika profile gagal diambil (SQLite issue, dll), user terjebak di loading.

---

## 🟡 UX Issue

---

### 10. `reset-password.tsx` — Tidak Ada Tombol Kembali

Layar ini diakses dari deep link email. Jika user buka secara tidak sengaja atau salah, tidak ada cara keluar selain tutup app. `forgot-password.tsx` sudah punya tombol `<ChevronLeft>` — `reset-password.tsx` butuh yang sama, minimal navigate ke `/login`.

---

### 11. Dua Layar Subscription yang Berbeda Membingungkan

| Layar | Akses | Data |
|-------|-------|------|
| `app/subscription.tsx` | Otomatis saat expired | `useProfile()` ✅ |
| `app/settings/subscription.tsx` | Manual dari Settings | `user_metadata` ❌ |

Dua layar, dua sumber data berbeda, tampilan berbeda. User melihat informasi yang berbeda tergantung dari mana dia membuka subscription page. Satukan ke satu layar atau minimal samakan sumber datanya.

---

### 12. 8 `console.log()` Debug di `_layout.tsx` untuk Production

```ts
console.log("RootLayout: Waiting for...", {...});
console.log("RootLayout: Fetching session...");
console.log("RootLayout: Session fetched", !!data.session);
console.log("Keep-alive: Heartbeat sent to Supabase");
console.log("RootLayout: Auth state changed", !!session);
// ... dst
```

Log ini menampilkan informasi auth di production — tidak berbahaya tapi tidak profesional dan membebani performa. Hapus atau bungkus dengan `if (__DEV__)`.

---

### 13. `(tabs)/plus.tsx` — File Redirect Redundan

```tsx
// app/(tabs)/plus.tsx
export default function PlusScreen() {
  return <Redirect href="/(tabs)/home" />;
}
```

Tab "plus" adalah custom FAB button yang navigasinya sudah dihandle di `_layout.tsx` tabs. File `plus.tsx` hanya redirect ke home dan tidak pernah seharusnya tampil. File ini bisa dihapus atau diisi dengan `null` untuk kejelasan.

---

## 🔒 Security

### 14. Deep Link Reset Password Tidak Divalidasi

Ketika `mua-app://reset-password` dibuka, `reset-password.tsx` langsung aktif tanpa verifikasi bahwa link tersebut valid (memiliki token Supabase yang sah). Jika seseorang tahu skema URL app, mereka bisa membuka layar ini secara langsung.

Supabase sebenarnya menyertakan token di URL — perlu diverifikasi sebelum mengizinkan update password:
```ts
// Cek apakah ada session valid dari magic link
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  // Redirect ke login — bukan dari email yang valid
  router.replace('/(auth)/login');
}
```

---

## 📊 Scorecard Keseluruhan — 7 Review

| Kategori | #1 | #2 | #3 | #4 | #5 | #6 | **#7** |
|----------|:--:|:--:|:--:|:--:|:--:|:--:|:------:|
| Bug Kritis | 7 | 2 | 3 | 5 | 3 | 3 | **4** |
| Logic Issue | 3 | 3 | 4 | 5 | 4 | 5 | **4** |
| UX Issue | 6 | 2 | 3 | 4 | 3 | 4 | **4** |
| Security | 0 | 1 | 1 | 1 | 1 | 1 | **2** |
| Dead Code | 0 | 0 | 0 | 2 | 1 | 1 | **2** |
| Fitur Baru Teruji | — | — | 1 | 3 | 3 | 3 | **5** |

> **Catatan:** Kenaikan bug kritis dari 3 → 4 karena penambahan fitur SSO dan Reset Password yang membawa kompleksitas baru (deep link handling). Secara keseluruhan kualitas kode meningkat signifikan dibanding review pertama.

---

## 🎯 Prioritas Fix Sebelum Tester Real User

### 🔴 Wajib Selesai Dulu

| # | Item | File |
|---|------|------|
| 1 | Daftarkan URL redirect Google SSO di Google Console & Supabase | Konfigurasi eksternal |
| 2 | Fix deep link `reset-password` agar tertangani oleh router | `_layout.tsx` |
| 3 | Ganti nomor WA admin di `subscription.tsx` | `app/subscription.tsx:19` |
| 4 | Fix `settings/subscription.tsx` pakai `useProfile()` bukan `user_metadata` | `settings/subscription.tsx` |

### 🟠 Penting Sebelum Launch

| # | Item | File |
|---|------|------|
| 5 | Tambah `cancelNotification()` saat booking dihapus | `booking-repository.ts` |
| 6 | Hapus double `getSession()` call | `_layout.tsx` |
| 7 | Seragamkan minimum password (8 char) di register & reset | `reset-password.tsx` |
| 8 | Hapus `authService.signInWithOAuth()` dead code | `lib/supabase/auth.ts` |
| 9 | Tambah tombol kembali di `reset-password.tsx` | `reset-password.tsx` |

### 🟡 Bisa Dikerjakan Paralel / Setelah Launch

| # | Item | File |
|---|------|------|
| 10 | Hapus 8 `console.log()` atau bungkus `if (__DEV__)` | `_layout.tsx` |
| 11 | Validasi session di `reset-password.tsx` | `reset-password.tsx` |
| 12 | Hapus atau isi `plus.tsx` dengan komentar yang jelas | `app/(tabs)/plus.tsx` |
| 13 | Unifikasi dua subscription screen | `subscription.tsx` & `settings/subscription.tsx` |

---

## 💬 Status Fitur untuk Tester Real User

| Fitur | Status | Catatan |
|-------|:------:|---------|
| Login Email/Password | ✅ Siap | |
| Register | ✅ Siap | |
| Lupa Password | ⚠️ Perlu Fix | Deep link belum tertangani |
| Reset Password via Email | ⚠️ Perlu Fix | Deep link & validasi |
| SSO Google | ⚠️ Perlu Konfigurasi | Setup Google Console + Supabase |
| SSO Facebook | ⏳ Coming Soon | Sudah diberi label |
| Dashboard & Kalender | ✅ Siap | |
| Buat Booking + AI Asisten | ✅ Siap | |
| Invoice & Keuangan | ✅ Siap | |
| Open Booking Link (Web) | ✅ Siap | |
| Push Notification | ✅ Partial | Token terdaftar, reminder terjadwal |
| Subscription Screen | ⚠️ Perlu Fix | Nomor WA & data source |
| OTA Update | ✅ Siap | |

---

*Laporan ini dibuat dari code review statis terhadap repository `sisamsamsi/jadwal_mua` branch `main`.*
*Fixatif — Kunci jadwalmu, pastikan sempurna · Review ke-7 · 15 Mei 2026*
