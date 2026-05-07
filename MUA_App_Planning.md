# Perencanaan Aplikasi MUA (Make Up Artist) - Penjadwalan & Pencatatan

## 1. Ringkasan Proyek

Aplikasi mobile untuk membantu Make Up Artist (MUA) dalam mengelola bisnis mereka: penjadwalan event, pencatatan klien, manajemen keuangan, dan operasional sehari-hari. Aplikasi dijual lepas dalam format APK (model SaaS sekali bayar atau berlangganan).

---

## 2. Hasil Riset Kompetitor

### Kompetitor Internasional
| Aplikasi | Fitur Utama | Harga |
|----------|-------------|-------|
| **Vagaro** | Booking, POS, client management, loyalty program | $23.99/bln |
| **GlossGenius** | Booking website, payment, staff management, marketing | $24+/bln |
| **StyleSeat** | Client discovery, booking, payment, marketing | Komisi per transaksi |
| **Zencal** | Booking online, deposit, reminder, intake forms | Freemium |
| **Glambook** | Freelance MUA focused, zero commission, portfolio | Free/Premium |

### Kompetitor Lokal (Indonesia)
| Aplikasi | Fitur Utama | Harga |
|----------|-------------|-------|
| **MUAgenda** | Dashboard MUA, booking, invoice otomatis, reminder | Berlangganan |
| **Jadwalin** | Penjadwalan UMKM, invoice, offline-capable, WhatsApp integration | Rp 115.000 - 155.000 (sekali bayar) |
| **BookingMUA** | Marketplace MUA, booking per kota | Platform marketplace |

### Insight dari Kompetitor
- Mayoritas kompetitor internasional **berbasis SaaS bulanan** → peluang di model **sekali bayar** untuk pasar Indonesia
- **Jadwalin** sudah membuktikan model sekali bayar laku di Indonesia (Rp 115.000 - 155.000)
- Fitur yang paling dicari: **penjadwalan anti-bentrok**, **invoice otomatis**, **reminder WhatsApp**, **offline support**
- Pain point MUA Indonesia: admin manual 4-6 jam/hari, jadwal bentrok, invoice manual, pembayaran tercecer

---

## 3. Fitur Aplikasi (Berdasarkan Riset)

### 3.1 Fitur Inti (MVP - Phase 1)

#### A. Manajemen Jadwal & Booking
- **Kalender visual** — tampilan harian, mingguan, bulanan dengan color-coding per status
- **Buat booking baru** — tanggal, waktu, lokasi, jenis layanan, jumlah orang
- **Deteksi bentrok otomatis** — alert jika jadwal overlap
- **Travel time buffer** — otomatis menambahkan waktu perjalanan antar lokasi
- **Status booking** — Pending → Confirmed → In Progress → Completed → Cancelled
- **Recurring booking** — untuk klien reguler (contoh: makeup bulanan)

#### B. Manajemen Klien
- **Database klien** — nama, telepon, alamat, foto, catatan alergi/preferensi
- **Riwayat layanan** — semua layanan yang pernah diberikan per klien
- **Preferensi klien** — skin type, warna favorit, gaya makeup, produk yang cocok/alergi
- **Foto before/after** — galeri per klien untuk referensi
- **Tag/label klien** — VIP, Regular, Bride, dll

#### C. Manajemen Layanan
- **Daftar layanan** — nama, deskripsi, durasi, harga
- **Kategori layanan** — Bridal, Party, Photoshoot, Tutorial, Touch-up, dll
- **Paket layanan** — bundling layanan (misal: Paket Bridal = Trial + Wedding Day + Retouch)
- **Harga fleksibel** — per orang tambahan, per jam tambahan, surcharge weekend/hari libur

#### D. Pencatatan Keuangan
- **Invoice otomatis** — generate dari booking, kirim via WhatsApp/email
- **Tracking pembayaran** — DP, pelunasan, cicilan
- **Status pembayaran** — Belum Bayar → DP → Lunas
- **Rekap pendapatan** — harian, mingguan, bulanan, tahunan
- **Pencatatan pengeluaran** — beli produk, transport, sewa alat, dll
- **Laporan laba/rugi sederhana**

#### E. Notifikasi & Reminder
- **Reminder booking** — H-3, H-1, dan hari-H ke MUA dan klien
- **Reminder pembayaran** — untuk klien yang belum melunasi
- **Integrasi WhatsApp** — kirim reminder, invoice, dan konfirmasi via WhatsApp
- **Push notification** — dari aplikasi

### 3.2 Fitur Tambahan (Phase 2)

#### F. Portfolio & Galeri
- **Portfolio digital** — showcase karya terbaik per kategori
- **Before/After showcase** — dengan izin klien
- **Watermark otomatis** pada foto portfolio

#### G. Manajemen Tim (untuk MUA dengan asisten)
- **Multi-user** — assign booking ke asisten/partner MUA
- **Jadwal per anggota tim** — masing-masing punya kalender sendiri
- **Laporan per anggota** — tracking performa masing-masing

#### H. Manajemen Inventaris Produk
- **Stok produk** — tracking produk makeup yang dimiliki
- **Alert stok rendah** — notifikasi ketika stok menipis
- **Catatan produk per klien** — produk apa yang digunakan untuk siapa

#### I. Fitur Bridal Khusus
- **Timeline getting-ready** — jadwal detail hari-H (jam tiba, mulai makeup, selesai, dll)
- **Bridal party management** — ibu, pengiring, saudari dalam satu booking group
- **Trial booking** — linked ke booking wedding day
- **Checklist persiapan** — skincare prep reminder untuk bride

#### J. Laporan & Analitik
- **Dashboard statistik** — total booking, revenue, klien baru, repeat rate
- **Grafik tren** — pendapatan per bulan, layanan terpopuler
- **Export data** — ke Excel/PDF untuk pembukuan

### 3.3 Fitur Nice-to-Have (Phase 3 / Future)
- **Booking online untuk klien** — halaman booking publik (web)
- **Integrasi payment gateway** — Midtrans, GoPay, OVO, Dana
- **Rating & review dari klien**
- **Integrasi Google Calendar / Apple Calendar**
- **Multi-bahasa** (Indonesia & English)
- **Dark mode**
- **Backup & restore data**
- **Cetak invoice / struk thermal**

---

## 4. Arsitektur Teknologi

### 4.1 Stack yang Diusulkan

```
┌──────────────────────────────────────────────┐
│                 FLUTTER APP                   │
│          (Android APK Distribution)           │
│                                               │
│  State Management: Riverpod / Bloc            │
│  Local DB: Drift (SQLite) untuk offline       │
│  Navigation: GoRouter                         │
│  UI: Material Design 3                        │
├──────────────────────────────────────────────┤
│            SUPABASE (Free Tier)               │
│                                               │
│  🔐 Supabase Auth (login/register)            │
│  🗄️ PostgreSQL Database (500 MB gratis)       │
│  📦 Supabase Storage (1 GB gratis)            │
│  ⚡ Realtime Subscriptions                    │
│  🔒 Row-Level Security (RLS)                  │
│  🛠️ Edge Functions (serverless)               │
├──────────────────────────────────────────────┤
│         FIREBASE (Free Tier - Optional)       │
│                                               │
│  📨 Firebase Cloud Messaging (push notif)     │
│  📊 Firebase Analytics (opsional)             │
│  🐛 Firebase Crashlytics (opsional)           │
└──────────────────────────────────────────────┘
```

### 4.2 Mengapa Stack Ini?

| Komponen | Alasan | Biaya |
|----------|--------|-------|
| **Flutter** | Cross-platform (Android fokus utama, iOS potensial), single codebase, performa native, UI kustomisasi tinggi | Gratis (open-source) |
| **Supabase Auth** | Mendukung email/password, Google Sign-In, phone OTP, magic link. SDK Flutter resmi tersedia | Gratis (50.000 MAU) |
| **Supabase PostgreSQL** | Database relasional — cocok untuk data terstruktur (booking, klien, keuangan). SQL powerful untuk laporan. Row-Level Security built-in | Gratis (500 MB) |
| **Supabase Storage** | Untuk foto klien, portfolio, invoice PDF. Terintegrasi dengan RLS | Gratis (1 GB) |
| **Supabase Realtime** | Real-time subscriptions untuk update data live (misal: status booking berubah) | Gratis |
| **Firebase Cloud Messaging** | Push notification gratis, terintegrasi langsung dengan Flutter. Supabase belum punya fitur push notif native | Gratis |
| **Drift (SQLite lokal)** | Offline-first support — data tetap bisa diakses tanpa internet, sync ke Supabase ketika online | Gratis (open-source) |

### 4.3 Catatan Penting tentang Stack

#### Supabase sebagai Backend Utama
- **Supabase** = open-source Firebase alternative, dibangun di atas PostgreSQL
- SDK Flutter resmi: `supabase_flutter` — setup mudah, dokumentasi lengkap
- **Row-Level Security (RLS)** — security policy langsung di level database, sangat aman
- **Realtime** — subscribe ke perubahan data secara live via WebSocket
- **Edge Functions** — serverless functions untuk logika bisnis (misal: generate invoice PDF)
- **Free Tier sangat generous**:
  - 500 MB database
  - 1 GB file storage
  - 50.000 MAU auth
  - 500.000 Edge Function invocations
  - 2 GB bandwidth
  - Unlimited API requests

#### Firebase Cloud Messaging (Tambahan)
- Supabase belum punya push notification native
- Gunakan **Firebase Cloud Messaging (FCM)** hanya untuk push notification
- FCM sepenuhnya gratis tanpa batas
- Integrasi: Supabase Edge Function → trigger FCM → push ke device

#### Supabase vs Firebase Firestore
| Aspek | Supabase | Firebase Firestore |
|-------|----------|--------------------|
| Database | PostgreSQL (relational) | NoSQL (document) |
| Query | SQL penuh, JOIN, aggregate | Limited query capabilities |
| Pricing | Free tier generous | Free tier tapi NoSQL |
| Offline | Perlu Drift/SQLite | Built-in offline |
| Open Source | Ya | Tidak |
| Cocok untuk app ini? | **Ya** — data relasional (booking, klien, keuangan) | Kurang ideal — NoSQL tidak cocok untuk laporan keuangan |

### 4.4 Arsitektur Offline-First

Karena dijual sebagai APK lepas, penting untuk mendukung penggunaan offline:

```
┌─────────────────────────────────────┐
│            FLUTTER APP              │
│                                     │
│  ┌─────────┐    ┌──────────────┐   │
│  │  UI/UX  │◄──►│  Repository  │   │
│  └─────────┘    └──────┬───────┘   │
│                         │           │
│              ┌──────────┴────────┐  │
│              │                   │  │
│     ┌────────▼──────┐  ┌────────▼──────┐
│     │  Local SQLite  │  │  Remote API   │
│     │  (Drift)       │  │  (Supabase)   │
│     │  PRIMARY       │  │  SYNC         │
│     └───────────────┘  └───────────────┘
│                                     │
│  Strategy:                          │
│  1. Baca dari local DB (instant)    │
│  2. Sync ke remote di background    │
│  3. Conflict resolution: last-write │
│  4. Supabase Realtime untuk live sync│
└─────────────────────────────────────┘
```

---

## 5. Database Schema (High-Level)

### Tabel Utama

```sql
-- Users / MUA Profile
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    business_name VARCHAR(255),
    address TEXT,
    profile_photo_url TEXT,
    license_key VARCHAR(255),          -- untuk model APK lepas
    license_type VARCHAR(50),          -- 'lite', 'pro', 'all_access'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Clients
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    skin_type VARCHAR(50),             -- normal, oily, dry, combination, sensitive
    allergies TEXT,
    preferences TEXT,                  -- catatan preferensi makeup
    tags TEXT[],                        -- ['VIP', 'Bride', 'Regular']
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Services
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),             -- 'bridal', 'party', 'photoshoot', 'tutorial'
    description TEXT,
    duration_minutes INT NOT NULL,
    base_price DECIMAL(12,2) NOT NULL,
    extra_person_price DECIMAL(12,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Service Packages
CREATE TABLE packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    total_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE package_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID REFERENCES packages(id),
    service_id UUID REFERENCES services(id),
    quantity INT DEFAULT 1
);

-- Bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    client_id UUID REFERENCES clients(id),
    service_id UUID REFERENCES services(id),
    package_id UUID REFERENCES packages(id),      -- nullable, jika booking paket
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location_name VARCHAR(255),
    location_address TEXT,
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    travel_time_minutes INT DEFAULT 0,
    num_persons INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'pending',          -- pending, confirmed, in_progress, completed, cancelled
    notes TEXT,
    total_price DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Bridal Party Members (untuk fitur bridal group)
CREATE TABLE bridal_party (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),                 -- 'bride', 'bridesmaid', 'mother_of_bride', etc
    service_id UUID REFERENCES services(id),
    scheduled_time TIME,
    notes TEXT
);

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id),
    amount DECIMAL(12,2) NOT NULL,
    payment_type VARCHAR(50),          -- 'dp', 'full', 'installment'
    payment_method VARCHAR(50),        -- 'cash', 'transfer', 'ewallet', 'qris'
    payment_date DATE,
    proof_photo_url TEXT,              -- bukti transfer
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id),
    invoice_number VARCHAR(50) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'unpaid',   -- unpaid, partial, paid
    due_date DATE,
    pdf_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Expenses (pengeluaran)
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    category VARCHAR(100),             -- 'product', 'transport', 'equipment', 'rent', 'other'
    description TEXT,
    amount DECIMAL(12,2) NOT NULL,
    expense_date DATE NOT NULL,
    receipt_photo_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Product Inventory
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    category VARCHAR(100),             -- 'foundation', 'lipstick', 'eyeshadow', etc
    current_stock INT DEFAULT 0,
    min_stock_alert INT DEFAULT 1,
    purchase_price DECIMAL(12,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Client Photos (portfolio / before-after)
CREATE TABLE client_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id),
    booking_id UUID REFERENCES bookings(id),
    photo_url TEXT NOT NULL,
    photo_type VARCHAR(50),            -- 'before', 'after', 'portfolio'
    is_public BOOLEAN DEFAULT FALSE,   -- izin tampil di portfolio
    created_at TIMESTAMP DEFAULT NOW()
);

-- Reminders
CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id),
    reminder_type VARCHAR(50),         -- 'booking_h3', 'booking_h1', 'booking_hday', 'payment'
    scheduled_at TIMESTAMP NOT NULL,
    sent_at TIMESTAMP,
    channel VARCHAR(50),               -- 'push', 'whatsapp', 'both'
    status VARCHAR(50) DEFAULT 'pending'  -- pending, sent, failed
);
```

---

## 6. Model Bisnis & Distribusi

### 6.1 Model Harga (Referensi dari Jadwalin)

| Tier | Harga | Fitur |
|------|-------|-------|
| **Lite** | Rp 125.000 (sekali bayar) | Jadwal, klien, invoice dasar, backup manual |
| **Pro** | Rp 175.000 (sekali bayar) | Semua Lite + keuangan lengkap, export Excel, WhatsApp reminder |
| **All Access** | Rp 225.000 (sekali bayar) | Semua Pro + tim, portfolio, inventaris, branding, update selamanya |

### 6.2 Opsi Monetisasi Tambahan
- **In-app purchase** untuk upgrade tier
- **Subscription opsional** untuk fitur cloud sync & backup otomatis
- **White-label** — MUA besar bisa custom branding (premium)

### 6.3 Distribusi APK
- **Distribusi utama**: Google Play Store (APK/AAB)
- **Distribusi langsung**: Website sendiri (download APK langsung)
- **Lisensi**: License key per pembelian, validasi via Supabase
- **Update**: Auto-update via Play Store, atau in-app update checker untuk distribusi langsung

---

## 7. User Flow Utama

### 7.1 Flow Booking Baru
```
Buka Kalender → Pilih Tanggal → + Booking Baru
  → Pilih/Tambah Klien
  → Pilih Layanan/Paket
  → Set Waktu & Durasi
  → Set Lokasi (dengan estimasi travel time)
  → Set Harga & DP
  → Simpan → Generate Invoice → Kirim via WhatsApp
```

### 7.2 Flow Hari-H
```
Dashboard Hari Ini → Lihat Booking Hari Ini (timeline)
  → Tap Booking → Lihat Detail (klien, lokasi, catatan)
  → Navigasi ke Lokasi (Google Maps)
  → Update Status: In Progress
  → Selesai → Upload Foto Before/After
  → Update Status: Completed
  → Kirim Invoice Pelunasan
```

### 7.3 Flow Keuangan
```
Tab Keuangan → Rekap Bulan Ini
  → Lihat Detail Pendapatan per Booking
  → Lihat Pengeluaran
  → Laba/Rugi Bulanan
  → Export ke Excel/PDF
```

---

## 8. Wireframe Konsep (Deskripsi)

### Halaman Utama (Dashboard)
```
┌─────────────────────────────┐
│  Halo, [Nama MUA]! 👋       │
│  [Hari ini: 3 Booking]      │
├─────────────────────────────┤
│  ┌─────────────────────────┐│
│  │ BOOKING HARI INI        ││
│  │ 08:00 - Rina (Bridal)   ││
│  │ 13:00 - Maya (Party)    ││
│  │ 17:00 - Sari (Photoshoot││
│  └─────────────────────────┘│
│                              │
│  ┌──────────┐ ┌────────────┐│
│  │ Revenue  │ │ Pending    ││
│  │ Rp 2.5M  │ │ Payment: 3 ││
│  └──────────┘ └────────────┘│
│                              │
│  ┌──────────┐ ┌────────────┐│
│  │ Klien    │ │ Booking    ││
│  │ Total: 48│ │ Bulan: 15  ││
│  └──────────┘ └────────────┘│
├─────────────────────────────┤
│ 🏠   📅   ➕   👤   ⚙️     │
│ Home Calendar Add Client Set│
└─────────────────────────────┘
```

### Bottom Navigation
1. **Home** — Dashboard ringkasan
2. **Kalender** — Tampilan jadwal
3. **+ (FAB)** — Tambah booking baru (quick action)
4. **Klien** — Database klien
5. **Lainnya** — Keuangan, Inventaris, Portfolio, Pengaturan

---

## 9. Estimasi Timeline Pengembangan

### Phase 1 - MVP (8-10 minggu)
| Minggu | Deliverable |
|--------|-------------|
| 1-2 | Setup project, arsitektur, Supabase + FCM config, auth (login/register) |
| 3-4 | Manajemen layanan, database klien, CRUD dasar |
| 5-6 | Kalender & booking (fitur utama), deteksi bentrok |
| 7-8 | Pencatatan keuangan, invoice, tracking pembayaran |
| 9 | Notifikasi & reminder (push + WhatsApp) |
| 10 | Testing, bug fixing, polish UI, persiapan rilis |

### Phase 2 - Enhancement (4-6 minggu)
| Minggu | Deliverable |
|--------|-------------|
| 11-12 | Portfolio/galeri, foto before/after |
| 13-14 | Manajemen tim, inventaris produk |
| 15-16 | Fitur bridal khusus, laporan & analitik |

### Phase 3 - Advanced (4-6 minggu)
| Minggu | Deliverable |
|--------|-------------|
| 17-18 | Booking online (web), integrasi payment gateway |
| 19-20 | Google Calendar sync, dark mode, multi-bahasa |
| 21-22 | Optimisasi, testing menyeluruh, rilis final |

---

## 10. Estimasi Biaya Infrastruktur (Bulanan)

| Service | Estimasi Biaya | Catatan |
|---------|---------------|---------|
| Supabase Auth | **Gratis** | s/d 50.000 MAU |
| Supabase PostgreSQL | **Gratis** | 500 MB database, unlimited API requests |
| Supabase Storage | **Gratis** | 1 GB file storage |
| Supabase Realtime | **Gratis** | Real-time subscriptions |
| Supabase Edge Functions | **Gratis** | 500.000 invocations/bulan |
| Firebase Cloud Messaging | **Gratis** | Push notification tanpa batas |
| Firebase Analytics (opsional) | **Gratis** | Basic analytics |
| Firebase Crashlytics (opsional) | **Gratis** | Crash reporting |
| **Total** | **$0/bulan** | **Sepenuhnya gratis untuk fase awal & skala kecil-menengah** |

---

## 11. Risiko & Mitigasi

| Risiko | Mitigasi |
|--------|---------|
| Supabase free tier limit (500 MB DB, 1 GB storage) | Monitor usage, upgrade ke Pro ($25/bln) jika sudah profitable. Untuk awal sangat cukup |
| Supabase tidak punya offline support bawaan | Gunakan Drift (SQLite) sebagai primary DB lokal, sync strategy sederhana (last-write-wins) |
| Distribusi APK di luar Play Store | Implementasi license key validation + update checker |
| Push notification perlu Firebase terpisah | Integrasi FCM minimal, hanya untuk push notif. Setup sekali lalu jarang diubah |
| WhatsApp API kompleks | Gunakan URL scheme (`wa.me`) untuk fase awal, migrasi ke WhatsApp Business API nanti |
| Supabase downtime | Drift (SQLite lokal) sebagai fallback, app tetap jalan offline |

---

## 12. Nama Aplikasi (Saran)

Beberapa opsi nama:
1. **GlamBook** — singkat, profesional, langsung terkait beauty industry
2. **MUAPlanner** — deskriptif, jelas fungsinya
3. **BeautyFlow** — modern, menunjukkan alur kerja yang smooth
4. **RiasKu** — lokal Indonesia, personal ("Rias" = makeup, "Ku" = milikku)
5. **GlowDesk** — modern, mengesankan produktivitas

---

## 13. Langkah Selanjutnya

1. **Konfirmasi scope MVP** — fitur mana yang masuk Phase 1?
2. **Pilih nama aplikasi**
3. **Setup project Flutter + Supabase + Firebase (FCM)**
4. **Design UI/UX detail** (Figma)
5. **Mulai development Phase 1**

---

*Dokumen ini adalah hasil riset dan perencanaan awal. Siap untuk didiskusikan dan disesuaikan berdasarkan kebutuhan spesifik.*
