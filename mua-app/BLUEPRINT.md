# Blueprint Pengembangan & Penyelesaian MUA App

Dokumen ini berisi panduan teknis, alur, dan tutorial langkah demi langkah untuk menyelesaikan fitur-fitur yang masih tertunda di MUA App, termasuk pendaftaran ke platform eksternal.

---

## 1. Auth SSO (Google, Facebook, Instagram)

Untuk memudahkan user (MUA) login tanpa mengingat password, kita menggunakan Supabase Auth yang dihubungkan dengan Google dan Meta (Facebook/Instagram).

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

### B. Tutorial Setup Facebook / Instagram OAuth
1. **Buka Meta for Developers** (developers.facebook.com) dan buat akun developer jika belum.
2. Klik **My Apps > Create App**.
3. Pilih tipe aplikasi (biasanya "Consumer" atau "None") dan isi nama aplikasi (misal: "MUA App").
4. Di dashboard aplikasi, tambahkan produk **Facebook Login**.
5. Pilih platform **Web**.
   - Masukkan **Site URL**: `https://<project-ref>.supabase.co`
6. Di menu kiri, buka **Facebook Login > Settings**.
   - Pada kolom **Valid OAuth Redirect URIs**, masukkan: `https://<project-ref>.supabase.co/auth/v1/callback`.
7. Buka menu **App Settings > Basic**.
   - Di sini Anda akan melihat **App ID** dan **App Secret** (klik Show untuk melihatnya). Simpan kedua data ini.
   - *(Catatan: Untuk menggunakan login Instagram dasar, biasanya di-handle melalui akun Meta/Facebook yang sama, namun Meta memiliki proses review yang cukup ketat sebelum aplikasi bisa public).*

### C. Konfigurasi di Supabase
1. Buka Dashboard Supabase project Anda.
2. Ke menu **Authentication > Providers**.
3. Buka **Google**, aktifkan (Turn on), lalu masukkan **Client ID** dan **Client Secret** dari langkah A.
4. Buka **Facebook**, aktifkan, lalu masukkan **App ID** dan **App Secret** dari langkah B.
5. Ke menu **Authentication > URL Configuration**.
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

## 3. Sistem Kode Aktivasi SaaS

Sistem ini memastikan hanya MUA yang memiliki "Lisensi" atau "Kode Undangan" yang bisa mendaftar.

### A. Desain Database di Supabase
1. Buka SQL Editor di Supabase, jalankan query berikut:
```sql
CREATE TABLE activation_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES auth.users(id) NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
2. Anda (sebagai super-admin) dapat memasukkan kode secara manual dari dashboard Supabase untuk dibagikan ke calon pembeli/user.

### B. Alur Aplikasi (Routing Guard)
1. **Pembuatan Halaman Aktivasi (`app/(auth)/activation.tsx`):**
   Halaman ini berisi satu input teks untuk memasukkan kode.
2. **Logika Validasi:**
   Saat user klik "Gunakan Kode", aplikasi mencari kode di tabel `activation_codes` yang `is_used = false`.
   Jika valid, simpan status ini di `SecureStore` atau status lokal (misal: `hasValidInvite = true`), lalu navigasikan ke halaman `/register`.
3. **Penguncian di `_layout.tsx`:**
   Ubah logika pengalihan. Jika user belum login, dan `hasValidInvite` masih `false`, secara otomatis akan dilempar terus ke `/activation`.
4. **Saat Pendaftaran Sukses:**
   Setelah user berhasil membuat akun di halaman `/register`, lakukan update ke Supabase: `UPDATE activation_codes SET is_used = true, used_by = <user_id> WHERE code = <kode_tadi>`.

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
4. **Update Aplikasi:** Anda harus menambahkan logika untuk meminta izin (permission) notifikasi saat pertama kali app dibuka, lalu menyimpan `ExpoPushToken` milik user ke profil mereka di Supabase.
