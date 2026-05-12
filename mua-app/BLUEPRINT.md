# Blueprint Pengembangan & Penyelesaian MUA App (Fixatif)

Dokumen ini berisi panduan teknis, alur, dan tutorial langkah demi langkah untuk menyelesaikan fitur-fitur yang masih tertunda di MUA App, termasuk pendaftaran ke platform eksternal.

---

## 1. Auth SSO (Google)

Untuk memudahkan user (MUA) login tanpa mengingat password, kita menggunakan Supabase Auth yang dihubungkan dengan Google.

### A. Tutorial Setup Google OAuth
1. **Buka Google Cloud Console** (console.cloud.google.com) dan login dengan akun Google Anda.
2. Buat **Project Baru** (misal: "MUA App Auth").
3. Buka menu **APIs & Services > OAuth consent screen**.
   - Pilih "External" jika aplikasi untuk publik.
   - Isi informasi aplikasi (Nama Aplikasi, Email Support, Logo).
   - Simpan dan Lanjutkan (Scopes biarkan default: email, profile).
4. Buka menu **Credentials**.
   - Klik **Create Credentials > OAuth client ID**.
   - Pilih Application type: **Web application**.
   - **Authorized redirect URIs**: Masukkan URL redirect dari Supabase Anda. Formatnya: `https://<project-ref>.supabase.co/auth/v1/callback` (Dapatkan `<project-ref>` dari dashboard Supabase Anda).
   - Klik Create. Anda akan mendapatkan **Client ID** dan **Client Secret**. Simpan ini.

### B. Konfigurasi di Supabase
1. Buka Dashboard Supabase project Anda.
2. Ke menu **Authentication > Providers**.
3. Buka **Google**, aktifkan (Turn on), lalu masukkan **Client ID** dan **Client Secret** dari langkah A.
4. Ke menu **Authentication > URL Configuration**.
   - **Site URL**: Masukkan skema aplikasi Anda (contoh: `mua-app://`).
   - **Redirect URLs**: Tambahkan `mua-app://**` agar Supabase mengizinkan pengalihan kembali ke aplikasi mobile.

### D. Implementasi di Codebase (Expo)
Untuk login sosial yang mulus di Expo, kita memerlukan `expo-web-browser` dan URL penangkap.
```typescript
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase/client';

WebBrowser.maybeCompleteAuthSession(); // Wajib untuk Android

const handleGoogleLogin = async () => {
  const redirectUrl = Linking.createURL('/login'); // mua-app://login
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
    },
  });

  if (data?.url) {
    // Buka browser untuk user login
    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
    if (res.type === 'success') {
      // Supabase otomatis menangkap sesi dari URL jika konfigurasi benar
    }
  }
};
```

---

## 2. Deploy Web App Open Booking (via Vercel)

Fitur booking mandiri klien (`app/book/[muaId].tsx`) bisa diakses via web browser. Kita akan mengekspor codebase Expo menjadi website statis dan meng-host-nya di Vercel.

### A. Persiapan Ekspor Web
1. Pastikan `app.json` sudah memiliki plugin web (biasanya default di Expo Router).
2. Di package.json, pastikan Anda bisa menjalankan `npx expo export -p web`.

### B. Tutorial Pendaftaran & Deploy di Vercel
1. Buka **Vercel.com** dan daftar menggunakan akun GitHub Anda.
2. Pastikan kode MUA App Anda sudah di-push ke repository GitHub Anda (privat/publik).
3. Di Vercel dashboard, klik **Add New > Project**.
4. Pilih repository GitHub MUA App Anda lalu klik **Import**.
5. Di halaman konfigurasi:
   - **Project Name**: mua-app-booking (atau sesuai keinginan).
   - **Framework Preset**: Pilih **Other**.
   - **Build Command**: `npx expo export -p web` (atau `npm run build` jika sudah didefinisikan di package.json).
   - **Output Directory**: `dist`
6. **Environment Variables**:
   Buka panel env, tambahkan:
   - `EXPO_PUBLIC_SUPABASE_URL` = (URL Supabase Anda)
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = (Anon key Supabase Anda)
7. Klik **Deploy**. Tunggu sekitar 2-3 menit.
8. Setelah selesai, Vercel akan memberikan domain gratis (contoh: `https://mua-app-booking.vercel.app`).
9. **Update Base URL**: Copy domain tersebut, buka codebase lokal Anda di file `lib/constants/app.ts`, dan update `PUBLIC_BOOKING_BASE_URL` menjadi domain Vercel tersebut.

---

## 3. Sistem Berlangganan & Trial (SaaS) - Fixatif

Sistem ini memberikan akses gratis selama 7 hari (trial) kepada pengguna baru, kemudian dilanjutkan dengan sistem berlangganan (subscription) bulanan seharga Rp 79.000/bln. Saat ini, fitur pembayaran di dalam aplikasi belum terintegrasi secara otomatis, sehingga tombol "Berlangganan" akan mengarahkan pengguna (redirect) ke WhatsApp admin.

### A. Desain Database di Supabase (Penyesuaian User Profil)
1. Kita perlu menambahkan field pada tabel profil MUA (misal tabel `users` atau `profiles`) untuk melacak status trial dan langganan.
```sql
ALTER TABLE profiles ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN subscription_status VARCHAR(20) DEFAULT 'trial'; -- 'trial', 'active', 'expired'
ALTER TABLE profiles ADD COLUMN subscription_ends_at TIMESTAMP WITH TIME ZONE;
```
2. Saat registrasi, aplikasi secara otomatis mengatur `trial_ends_at` menjadi 7 hari dari waktu pendaftaran, dan statusnya menjadi `trial`.

### B. Alur Aplikasi (Routing & Subscription Guard)
1. **Pembuatan Halaman Langganan (`app/(app)/subscription.tsx`):**
   Halaman ini menampilkan sisa waktu trial atau status langganan. Jika sudah mau habis atau kedaluwarsa, tampilkan tombol "Perpanjang Langganan".
2. **Tombol Redirect ke WhatsApp:**
   Tombol tersebut tidak memproses pembayaran in-app, melainkan membuka WhatsApp:
   ```typescript
   import * as Linking from 'expo-linking';
   
   const handleSubscribe = () => {
     const pesan = "Halo admin, saya ingin berlangganan aplikasi Fixatif bulanan (Rp 79.000). Akun saya: [Email/Nama MUA]";
     Linking.openURL(`https://wa.me/628XXXXXXXXXX?text=${encodeURIComponent(pesan)}`);
   };
   ```
3. **Penguncian Fitur di Aplikasi:**
   Pada setiap masuk aplikasi (atau `_layout.tsx` utama), cek apakah tanggal hari ini sudah melewati `trial_ends_at` atau `subscription_ends_at`.
   Jika iya, kunci sebagian besar navigasi aplikasi dan arahkan (redirect) pengguna ke halaman `/subscription` agar mereka memperpanjang langganan.

---

## 4. Penyelesaian Fitur "Placeholder" Lainnya

### A. Cetak / Unduh PDF Invoice
Saat ini di file `app/booking/invoice/[id].tsx` masih berupa alert.
1. **Instal Library**: `npx expo install expo-print expo-sharing`
2. **Implementasi HTML to PDF**:
   Buat string HTML yang merepresentasikan desain invoice (bisa copas CSS Tailwind dasar).
   ```javascript
   import * as Print from 'expo-print';
   import * as Sharing from 'expo-sharing';

   const handleDownload = async () => {
     const htmlContent = `<html><body><h1>Invoice MUA</h1><p>...</p></body></html>`;
     const { uri } = await Print.printToFileAsync({ html: htmlContent });
     await Sharing.shareAsync(uri); // Akan memunculkan opsi Save to Files atau Share ke WA
   };
   ```

### B. Lupa Password
1. Buat file `app/(auth)/forgot-password.tsx`.
2. Halaman ini hanya meminta alamat Email.
3. Fungsi Supabase:
   ```javascript
   await supabase.auth.resetPasswordForEmail(email, {
     redirectTo: 'mua-app://reset-password', // Deep link aplikasi Anda
   });
   ```
4. Supabase akan mengirim email ke user. Saat link di email diklik dari HP, aplikasi akan terbuka di halaman `app/(auth)/reset-password.tsx` (perlu dibuat) dimana user bisa mengetikkan password baru.

### C. Push Notifications (Pengingat H-1)
1. Karena aplikasi bisa "mati" (tidak dibuka), pengingat tidak bisa hanya mengandalkan kode lokal HP.
2. **Setup Supabase Edge Functions / Cron Job:**
   Buat fungsi terjadwal (misal jalan tiap jam 08:00 pagi). Fungsi ini akan mengecek tabel `bookings` untuk jadwal besok.
3. Jika ditemukan, fungsi mengirimkan request ke layanan Expo Push Notification API (`https://exp.host/--/api/v2/push/send`) menggunakan Push Token dari MUA tersebut.
5. **Update Aplikasi:** Anda harus menambahkan logika untuk meminta izin (permission) notifikasi saat pertama kali app dibuka, lalu menyimpan `ExpoPushToken` milik user ke profil mereka di Supabase.

---

## 5. Update Aplikasi Otomatis (OTA Updates)

Agar aplikasi bisa diperbarui tanpa harus mendownload ulang file APK (untuk distribusi di luar Play Store), kita menggunakan fitur **Expo Updates**. Ini memungkinkan user menerima fitur baru hanya dengan me-restart aplikasi.

### A. Persiapan
1. **Instal Library**: `npx expo install expo-updates`
2. **Konfigurasi `app.json`**: Pastikan memiliki `runtimeVersion` dan URL update yang sesuai dengan akun Expo Anda.

### B. Implementasi Cek Update di Dalam App
Tambahkan logika di `app/_layout.tsx` (atau di halaman Home) agar setiap kali app dibuka, ia mengecek apakah ada versi baru di server.

```javascript
import * as Updates from 'expo-updates';

async function onFetchUpdateAsync() {
  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      Alert.alert(
        "Update Tersedia", 
        "Versi terbaru Fixatif sudah tersedia. Ingin memperbarui aplikasi sekarang?",
        [
          { text: "Nanti" },
          { text: "Update & Restart", onPress: async () => {
              await Updates.fetchUpdateAsync();
              await Updates.reloadAsync(); // App akan restart dengan versi baru
          }}
        ]
      );
    }
  } catch (error) {
    // Error biasanya terjadi di mode development, abaikan saja
  }
}
```

### C. Cara Publish Update
Setiap kali ada perubahan kode (bukan perubahan native), jalankan:
`npx expo export --platform android` lalu publish ke server Expo/EAS. User akan langsung menerima notifikasi update tersebut saat membuka aplikasi.

