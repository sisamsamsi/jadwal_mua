# EBOOK BRIEF: PANDUAN PENGGUNAAN APLIKASI FIXATIF
*Pendamping Digital Terlengkap & Asisten AI untuk Makeup Artist (MUA) Profesional*

---

## 🌟 Pendahuluan: Apa itu Fixatif?
**Fixatif** adalah aplikasi manajemen bisnis digital (*CRM & Smart Scheduler*) yang dirancang khusus untuk memenuhi kebutuhan unik para Makeup Artist (MUA) di Indonesia. Aplikasi ini menggabungkan pencatatan jadwal offline-first yang super cepat dengan teknologi sinkronisasi cloud real-time, kecerdasan buatan (AI) untuk pemasaran, serta sistem pemesanan mandiri oleh klien (*Open Booking*).

Aplikasi dibangun dengan prinsip **Offline-First**, artinya semua data disimpan di SQLite lokal sehingga MUA tetap dapat bekerja meskipun tanpa koneksi internet di lokasi *makeup* yang terpencil, dan otomatis disinkronkan ke Supabase Cloud ketika jaringan kembali aktif.

---

## 🔑 Bab 1: Langkah Awal (Onboarding & Konfigurasi Pertama)

Saat pertama kali membuka Fixatif, terdapat beberapa langkah persiapan sederhana agar aplikasi bekerja maksimal untuk bisnis Anda:

### 1. Masuk ke Aplikasi (Login & Registrasi)
*   **Opsi Autentikasi:** MUA dapat masuk menggunakan akun **Google (SSO)** secara instan atau menggunakan alamat **Email**.
*   **Keuntungan Akun:** Akun terdaftar otomatis menikmati pencadangan data SQLite ke Supabase Cloud secara berkala untuk mencegah data hilang saat ganti perangkat.

### 2. Melengkapi Profil MUA
Masuk ke menu **Pengaturan (Settings)** > **Edit Profil Bisnis**:
*   **Profil Profesional:** Kakak bisa mengatur Nama Bisnis, Nama Lengkap, Nomor WhatsApp, dan Detail Instruksi Pembayaran (rekening bank/e-wallet). Informasi ini akan digunakan secara dinamis pada kop invoice digital dan halaman Open Booking Kakak.

### 3. Menyiapkan Daftar Layanan & Paket
Sebelum menerima booking, daftarkan jasa yang Kakak tawarkan di menu **Layanan** dan **Paket**:
*   **Layanan Satuan (Single Service):** Digunakan untuk mendaftarkan jasa rias tunggal. Contoh: *Makeup Akad* atau *Makeup Wisuda*. Layanan ini memiliki durasi pengerjaan dan harga dasar.
*   **Paket Layanan (Bundled Package):** Gabungan beberapa layanan sekaligus dengan harga total kustom. Dipilih oleh MUA saat memasukkan data booking rombongan/paket besar secara internal di aplikasi.

---

## 📅 Bab 2: Fitur Utama & Alur Kerja Harian

### 1. Dashboard & Kalender Interaktif
*   **Tampilan Kalender:** Menampilkan titik-titik jadwal aktif secara rapi. Kakak bisa melihat jadwal hari ini, besok, atau bulan depan dalam satu ketukan.
*   **Status Jadwal:** Setiap booking memiliki indikator status yang jelas:
    *   `🟡 Pending` - Pengajuan jadwal baru atau pembayaran DP belum dikonfirmasi.
    *   `🟢 FIX` - Booking dikonfirmasi sah setelah pembayaran DP diverifikasi.
    *   `🔵 Selesai` - Acara riasan telah sukses dilaksanakan.
    *   `🔴 Batal` - Jadwal dibatalkan.

### 2. Input Jadwal Baru & Deteksi Bentrok Otomatis (Anti-Bentrok)
MUA dapat memasukkan jadwal secara manual saat menerima pemesanan langsung:
*   **Deteksi Bentrok Real-time:** Saat Kakak mengisi Tanggal, Jam Mulai, dan Jam Selesai, aplikasi secara otomatis menghitung irisan waktu dengan jadwal lain di hari tersebut. Jika terdeteksi tumpang tindih waktu (atau jarak waktu kurang dari waktu jeda perjalanan 30 menit), aplikasi akan langsung memunculkan peringatan warna merah: **"Jadwal Bentrok / Mepet dengan [Nama Klien Lain]!"**. 

### 3. Rincian Rias Per Orang (Bridal Party Detail)
Pernikahan sering kali melibatkan banyak orang yang dirias (Pengantin, Ibu, Mertua, Pagar Ayu). Fixatif memfasilitasi pencatatan detail ini dengan rapi:
*   Kakak bisa menambahkan nama-nama anggota keluarga pengantin yang akan dirias di dalam satu booking induk.
*   Catat **Ukuran Baju**, **Deskripsi Baju** (misal: Kebaya Biru Payet), **Request Makeup** (misal: Bold untuk resepsi, Natural untuk wisuda), serta **Catatan Khusus** (misal: kulit sensitif/alergi kosmetik tertentu).

### 4. Keuangan, Down Payment (DP), & Refund
*   **Pencatatan Pembayaran:** Catat nominal DP/uang muka yang dikirim klien dan sisa tagihan dihitung secara otomatis.
*   **Pencatatan Refund:** Jika terjadi pembatalan, Kakak bisa mencatat nominal refund dana yang dikembalikan ke klien secara transparan.

---

## 🔗 Bab 3: Fitur Unggulan - Link Open Booking (Mandiri Klien)

*Fitur ini adalah mesin otomatis penerima jadwal tanpa Kakak perlu membalas chat satu per satu.*

### 🛠️ Cara Kerja Open Booking:
1.  **Dapatkan Link Kakak:** Di bagian pengaturan, MUA akan mendapatkan sebuah tautan unik berbasis `muaId` Kakak.
2.  **Proses Mandiri Klien (Halaman Web `book/[muaId]`):**
    *   Klien membuka link dan melihat Profil Bisnis dan WhatsApp Kakak.
    *   Klien mengisi data wajib: Nama Lengkap, Nomor WhatsApp, Tanggal Acara, Jam Mulai, dan Catatan Tambahan.
    *   Klien memilih salah satu **Layanan Satuan** aktif yang ditawarkan (paket bundling eksklusif hanya dapat dikelola secara internal oleh MUA di dalam aplikasi).
3.  **Proses di Database & Notifikasi:**
    *   Saat klien mengeklik "Ajukan Booking", sistem Supabase secara otomatis mencocokkan apakah klien sudah terdaftar di database. Jika belum, sistem akan membuat data klien baru di tabel `clients` dan mencatat booking di tabel `bookings` dengan status `pending` secara real-time.
    *   Jadwal baru tersebut otomatis ter-sync ke HP Kakak dan memicu notifikasi booking masuk!

---

## 🤖 Bab 4: Fitur Unggulan - Fixatif AI Assistant
*Asisten pintar bertenaga AI (LLM Llama 3) yang siap memangkas waktu kerja administrasi Kakak hingga 90%.*

Aplikasi menyediakan dua jenis integrasi AI yang sangat praktis:

### 1. AI WhatsApp Chat Parser (Saat Input Booking Baru)
Fitur paling revolusioner di layar **Booking Baru**:
*   **Cara Pakai:** Ketuk tombol **Asisten AI** di bagian atas kanan layar input booking baru. Tempelkan salinan pesan mentah chat WhatsApp dari klien (misal: *"Halo Kak, aku Rina, mau booking makeup wisuda tgl 12 Des jam 8 pagi di Gedung Serbaguna ya..."*).
*   **Proses AI:** AI akan secara cerdas memproses teks mentah tersebut untuk mengekstrak:
    *   Nama Klien (Aplikasi melakukan pencocokan dua arah toleran kesalahan tulisan dengan database klien Kakak).
    *   Nama Layanan (Otomatis dicocokkan dengan daftar Layanan aktif Kakak untuk memuat harga dasar).
    *   Tanggal Acara (diformat otomatis menjadi YYYY-MM-DD).
    *   Jam Mulai, Jam Selesai, Lokasi Acara, Jumlah Orang, Jenis Acara, dan Catatan Tambahan.
*   **Hasil Instan:** Form booking akan otomatis terisi penuh secara instan! Kakak tinggal meninjau ulang dan mengeklik Simpan.

### 2. AI Content & Operational Generator (Di Detail Booking)
Ketuk logo **Sparkles (Bintang AI)** di bagian atas detail booking yang sudah tersimpan:
*   💬 **Draf Pesan WhatsApp Otomatis:** Membuat pesan konfirmasi atau pengingat jadwal yang sopan dan ramah dalam Bahasa Indonesia, merincikan detail tanggal/jam acara, lokasi *venue*, catatan rias, serta nominal sisa tagihan secara presisi lengkap dengan emoji estetik.
*   📸 **Instagram Copywriting Caption:** Menyusun hook pembuka yang memuji kecantikan klien, menceritakan tipe riasan yang digunakan (misal: flawless modern glam), memberikan ajakan interaksi / booking (CTA), serta menyusun hashtag MUA populer secara otomatis.
*   📝 **Ringkasan Persiapan Operasional:** AI menganalisis catatan riasan klien, lalu memberikan rekomendasi kosmetik khusus yang wajib dibawa (misal: jika catatan tertulis "kulit berminyak/outdoor", AI mengingatkan membawa primer mattifying), serta estimasi waktu keberangkatan yang aman.

---

## 📊 Bab 5: Perbandingan Paket Fitur (FREE vs PREMIUM)

Aplikasi Fixatif membagi batasan fitur secara adil sesuai dengan logika teknis yang diimplementasikan di dalam codebase:

| Fitur / Batasan | Paket FREE (Gratis) | Paket PREMIUM (Berlangganan) |
| :--- | :---: | :---: |
| **Batas Maksimal Jumlah Booking** | 🔒 Terbatas Maksimal **10 Booking** |  **Tanpa Batas Booking** |
| **Offline-First Database & Cloud Backup** |  (SQLite + Supabase Sync) |  (SQLite + Supabase Sync) |
| **Layanan, Paket, & Klien Lokal** |  (Tanpa Batas) |  (Tanpa Batas) |
| **Pendeteksi Jadwal Bentrok** |  |  |
| **Link Open Booking (Halaman Mandiri Klien)** |  |  |
| **Cetak & Unduh Invoice PDF** | ❌ (Terhalang PremiumGate) |  (Bebas cetak/unduh PDF resmi) |
| **WhatsApp Chat Share (Teks Invoice)** |  |  |
| **AI WhatsApp Chat Parser (Auto-Fill)** | ❌ (Terhalang PremiumGate) |  (Bebas pakai saat buat booking) |
| **AI Content & Prep Generator (WA, IG, Checklist)** | ❌ (Terhalang PremiumGate) |  (Bebas akses di detail booking) |

---

> [!IMPORTANT]
> **Catatan Teknis Poin Free vs Premium:**
> 1. Fitur backup database lokal ke cloud Supabase berjalan untuk semua user terdaftar (baik free maupun premium) untuk menjaga integritas data.
> 2. Batasan 10 booking pada versi FREE dikontrol secara ketat pada modul pembuatan booking baru (`app/booking/new.tsx`), di mana tombol Simpan akan menolak menyimpan jika total jadwal aktif terdeteksi sudah mencapai angka 10.
> 3. Semua asisten kecerdasan buatan (AI) dibatasi hanya untuk premium karena panggilan Supabase Edge Functions (`parse-booking` dan `ai-assistant`) membutuhkan resource komputasi cloud eksternal.
