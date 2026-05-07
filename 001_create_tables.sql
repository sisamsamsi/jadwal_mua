-- ============================================================================
-- MUA App - Database Schema untuk Supabase (PostgreSQL)
-- Migration 001: Create Tables
-- ============================================================================
-- Jalankan di Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================================

-- ============================================================================
-- 0. EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- untuk uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";        -- untuk gen_random_uuid()

-- ============================================================================
-- 1. ENUM TYPES
-- ============================================================================

-- Tipe kulit klien
CREATE TYPE skin_type_enum AS ENUM (
    'normal',
    'oily',
    'dry',
    'combination',
    'sensitive'
);

-- Kategori layanan MUA
CREATE TYPE service_category_enum AS ENUM (
    'bridal',
    'party',
    'photoshoot',
    'editorial',
    'tutorial',
    'touch_up',
    'special_fx',
    'other'
);

-- Status booking
CREATE TYPE booking_status_enum AS ENUM (
    'pending',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled',
    'rescheduled'
);

-- Tipe pembayaran
CREATE TYPE payment_type_enum AS ENUM (
    'dp',
    'full',
    'installment',
    'refund'
);

-- Metode pembayaran
CREATE TYPE payment_method_enum AS ENUM (
    'cash',
    'bank_transfer',
    'ewallet',
    'qris',
    'other'
);

-- Status invoice
CREATE TYPE invoice_status_enum AS ENUM (
    'unpaid',
    'partial',
    'paid',
    'overdue',
    'cancelled'
);

-- Kategori pengeluaran
CREATE TYPE expense_category_enum AS ENUM (
    'product',
    'transport',
    'equipment',
    'rent',
    'marketing',
    'training',
    'other'
);

-- Tipe foto klien
CREATE TYPE photo_type_enum AS ENUM (
    'before',
    'after',
    'portfolio',
    'inspiration'
);

-- Tipe reminder
CREATE TYPE reminder_type_enum AS ENUM (
    'booking_h7',
    'booking_h3',
    'booking_h1',
    'booking_hday',
    'payment_due',
    'payment_overdue',
    'follow_up'
);

-- Channel reminder
CREATE TYPE reminder_channel_enum AS ENUM (
    'push',
    'whatsapp',
    'both'
);

-- Status reminder
CREATE TYPE reminder_status_enum AS ENUM (
    'pending',
    'sent',
    'failed',
    'cancelled'
);

-- Tipe lisensi
CREATE TYPE license_type_enum AS ENUM (
    'lite',
    'pro',
    'all_access'
);

-- Role dalam bridal party
CREATE TYPE bridal_role_enum AS ENUM (
    'bride',
    'groom',
    'bridesmaid',
    'mother_of_bride',
    'mother_of_groom',
    'sister',
    'flower_girl',
    'guest',
    'other'
);

-- ============================================================================
-- 2. HELPER FUNCTION: auto-update updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. TABLES
-- ============================================================================

-- --------------------------------------------------------------------------
-- 3.1 PROFILES (extends Supabase auth.users)
-- --------------------------------------------------------------------------
-- Supabase Auth sudah menyediakan tabel auth.users.
-- Tabel ini menyimpan data profil tambahan MUA yang terhubung ke auth.users.
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    business_name VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    profile_photo_url TEXT,
    bio TEXT,
    instagram_handle VARCHAR(100),
    whatsapp_number VARCHAR(20),
    license_key VARCHAR(255),
    license_type license_type_enum DEFAULT 'lite',
    license_expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'Profil MUA - ekstensi dari auth.users Supabase';
COMMENT ON COLUMN profiles.id IS 'Sama dengan auth.users.id';
COMMENT ON COLUMN profiles.license_key IS 'Kunci lisensi untuk validasi APK';
COMMENT ON COLUMN profiles.whatsapp_number IS 'Nomor WA aktif untuk integrasi reminder';

-- --------------------------------------------------------------------------
-- 3.2 CLIENTS (data klien/pelanggan MUA)
-- --------------------------------------------------------------------------
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    skin_type skin_type_enum,
    allergies TEXT,
    preferences TEXT,
    tags TEXT[] DEFAULT '{}',
    photo_url TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE clients IS 'Data klien/pelanggan MUA';
COMMENT ON COLUMN clients.user_id IS 'FK ke profiles - MUA pemilik data klien ini';
COMMENT ON COLUMN clients.tags IS 'Label klien: VIP, Bride, Regular, dll';
COMMENT ON COLUMN clients.skin_type IS 'Tipe kulit untuk referensi produk';

-- --------------------------------------------------------------------------
-- 3.3 SERVICES (layanan yang ditawarkan MUA)
-- --------------------------------------------------------------------------
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category service_category_enum NOT NULL DEFAULT 'other',
    description TEXT,
    duration_minutes INT NOT NULL DEFAULT 60,
    base_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    extra_person_price DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE services IS 'Daftar layanan MUA (bridal, party, photoshoot, dll)';
COMMENT ON COLUMN services.duration_minutes IS 'Estimasi durasi layanan dalam menit';
COMMENT ON COLUMN services.extra_person_price IS 'Harga tambahan per orang (untuk group booking)';

-- --------------------------------------------------------------------------
-- 3.4 PACKAGES (paket bundling layanan)
-- --------------------------------------------------------------------------
CREATE TABLE packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    total_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE packages IS 'Paket bundling layanan (misal: Paket Bridal = Trial + Wedding Day)';

-- --------------------------------------------------------------------------
-- 3.5 PACKAGE_ITEMS (item dalam paket)
-- --------------------------------------------------------------------------
CREATE TABLE package_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1,
    notes TEXT,
    UNIQUE(package_id, service_id)
);

COMMENT ON TABLE package_items IS 'Relasi many-to-many antara packages dan services';

-- --------------------------------------------------------------------------
-- 3.6 BOOKINGS (jadwal/booking utama)
-- --------------------------------------------------------------------------
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location_name VARCHAR(255),
    location_address TEXT,
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    travel_time_minutes INT DEFAULT 0,
    num_persons INT DEFAULT 1,
    status booking_status_enum DEFAULT 'pending',
    notes TEXT,
    total_price DECIMAL(12,2) DEFAULT 0,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraint: end_time harus setelah start_time
    CONSTRAINT chk_booking_time CHECK (end_time > start_time),
    -- Constraint: minimal 1 orang
    CONSTRAINT chk_num_persons CHECK (num_persons >= 1),
    -- Constraint: harus ada service atau package
    CONSTRAINT chk_service_or_package CHECK (service_id IS NOT NULL OR package_id IS NOT NULL)
);

COMMENT ON TABLE bookings IS 'Jadwal/booking MUA - tabel utama penjadwalan';
COMMENT ON COLUMN bookings.travel_time_minutes IS 'Buffer waktu perjalanan ke lokasi (menit)';
COMMENT ON COLUMN bookings.status IS 'Status: pending → confirmed → in_progress → completed/cancelled';

-- --------------------------------------------------------------------------
-- 3.7 BRIDAL_PARTY (anggota bridal party dalam satu booking)
-- --------------------------------------------------------------------------
CREATE TABLE bridal_party (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role bridal_role_enum DEFAULT 'guest',
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    scheduled_time TIME,
    price DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE bridal_party IS 'Anggota bridal party (bride, bridesmaid, ibu, dll)';

-- --------------------------------------------------------------------------
-- 3.8 PAYMENTS (pencatatan pembayaran per booking)
-- --------------------------------------------------------------------------
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    payment_type payment_type_enum NOT NULL DEFAULT 'dp',
    payment_method payment_method_enum DEFAULT 'bank_transfer',
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    proof_photo_url TEXT,
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraint: amount harus positif (kecuali refund)
    CONSTRAINT chk_payment_amount CHECK (
        (payment_type = 'refund' AND amount <= 0) OR
        (payment_type != 'refund' AND amount > 0)
    )
);

COMMENT ON TABLE payments IS 'Catatan pembayaran (DP, pelunasan, cicilan, refund)';
COMMENT ON COLUMN payments.proof_photo_url IS 'URL bukti transfer/pembayaran di Supabase Storage';
COMMENT ON COLUMN payments.reference_number IS 'Nomor referensi transfer/transaksi';

-- --------------------------------------------------------------------------
-- 3.9 INVOICES (invoice per booking)
-- --------------------------------------------------------------------------
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    status invoice_status_enum DEFAULT 'unpaid',
    due_date DATE,
    issued_date DATE DEFAULT CURRENT_DATE,
    pdf_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraint: paid tidak boleh lebih dari total
    CONSTRAINT chk_paid_amount CHECK (paid_amount <= total_amount),
    -- Invoice number unik per user
    CONSTRAINT uq_invoice_number_per_user UNIQUE (user_id, invoice_number)
);

COMMENT ON TABLE invoices IS 'Invoice/tagihan per booking';
COMMENT ON COLUMN invoices.invoice_number IS 'Nomor invoice unik per MUA (format: INV-YYYYMM-XXX)';

-- --------------------------------------------------------------------------
-- 3.10 EXPENSES (pencatatan pengeluaran MUA)
-- --------------------------------------------------------------------------
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category expense_category_enum NOT NULL DEFAULT 'other',
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_photo_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_expense_amount CHECK (amount > 0)
);

COMMENT ON TABLE expenses IS 'Pencatatan pengeluaran bisnis MUA';

-- --------------------------------------------------------------------------
-- 3.11 PRODUCTS (inventaris produk makeup)
-- --------------------------------------------------------------------------
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    category VARCHAR(100),
    current_stock INT DEFAULT 0,
    min_stock_alert INT DEFAULT 1,
    purchase_price DECIMAL(12,2) DEFAULT 0,
    expiry_date DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_stock_positive CHECK (current_stock >= 0)
);

COMMENT ON TABLE products IS 'Inventaris produk makeup MUA';
COMMENT ON COLUMN products.min_stock_alert IS 'Notifikasi ketika stok di bawah angka ini';

-- --------------------------------------------------------------------------
-- 3.12 CLIENT_PHOTOS (foto portfolio / before-after)
-- --------------------------------------------------------------------------
CREATE TABLE client_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    photo_url TEXT NOT NULL,
    photo_type photo_type_enum DEFAULT 'portfolio',
    caption TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE client_photos IS 'Foto klien: before/after, portfolio, inspirasi';
COMMENT ON COLUMN client_photos.is_public IS 'Jika TRUE, foto bisa ditampilkan di portfolio publik';

-- --------------------------------------------------------------------------
-- 3.13 REMINDERS (pengingat booking & pembayaran)
-- --------------------------------------------------------------------------
CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    reminder_type reminder_type_enum NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    channel reminder_channel_enum DEFAULT 'both',
    status reminder_status_enum DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE reminders IS 'Pengingat otomatis untuk booking dan pembayaran';
COMMENT ON COLUMN reminders.scheduled_at IS 'Waktu reminder dijadwalkan untuk dikirim';

-- --------------------------------------------------------------------------
-- 3.14 BOOKING_LOGS (audit trail perubahan status booking)
-- --------------------------------------------------------------------------
CREATE TABLE booking_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    old_status booking_status_enum,
    new_status booking_status_enum NOT NULL,
    changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE booking_logs IS 'Audit trail setiap perubahan status booking';

-- ============================================================================
-- 4. INDEXES (untuk performa query)
-- ============================================================================

-- Profiles
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_license_key ON profiles(license_key) WHERE license_key IS NOT NULL;

-- Clients
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_name ON clients(user_id, name);
CREATE INDEX idx_clients_phone ON clients(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_clients_tags ON clients USING GIN(tags);

-- Services
CREATE INDEX idx_services_user_id ON services(user_id);
CREATE INDEX idx_services_category ON services(user_id, category);
CREATE INDEX idx_services_active ON services(user_id) WHERE is_active = TRUE;

-- Packages
CREATE INDEX idx_packages_user_id ON packages(user_id);

-- Bookings (index paling penting untuk performa)
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_client_id ON bookings(client_id);
CREATE INDEX idx_bookings_date ON bookings(user_id, booking_date);
CREATE INDEX idx_bookings_status ON bookings(user_id, status);
CREATE INDEX idx_bookings_date_status ON bookings(user_id, booking_date, status);
CREATE INDEX idx_bookings_upcoming ON bookings(user_id, booking_date, start_time)
    WHERE status IN ('pending', 'confirmed');

-- Bridal Party
CREATE INDEX idx_bridal_party_booking ON bridal_party(booking_id);

-- Payments
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- Invoices
CREATE INDEX idx_invoices_booking ON invoices(booking_id);
CREATE INDEX idx_invoices_user_status ON invoices(user_id, status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date) WHERE status IN ('unpaid', 'partial');

-- Expenses
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(user_id, expense_date);
CREATE INDEX idx_expenses_category ON expenses(user_id, category);

-- Products
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_low_stock ON products(user_id)
    WHERE current_stock <= min_stock_alert AND is_active = TRUE;

-- Client Photos
CREATE INDEX idx_client_photos_client ON client_photos(client_id);
CREATE INDEX idx_client_photos_booking ON client_photos(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX idx_client_photos_public ON client_photos(client_id) WHERE is_public = TRUE;

-- Reminders
CREATE INDEX idx_reminders_booking ON reminders(booking_id);
CREATE INDEX idx_reminders_pending ON reminders(scheduled_at)
    WHERE status = 'pending';

-- Booking Logs
CREATE INDEX idx_booking_logs_booking ON booking_logs(booking_id);

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Auto-update updated_at untuk semua tabel yang punya kolom updated_at
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_packages_updated_at
    BEFORE UPDATE ON packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. FUNCTIONS (helper functions)
-- ============================================================================

-- --------------------------------------------------------------------------
-- 6.1 Generate invoice number: INV-YYYYMM-XXX
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_invoice_number(p_user_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    v_year_month VARCHAR(6);
    v_count INT;
    v_number VARCHAR(50);
BEGIN
    v_year_month := TO_CHAR(NOW(), 'YYYYMM');

    SELECT COUNT(*) + 1 INTO v_count
    FROM invoices
    WHERE user_id = p_user_id
      AND invoice_number LIKE 'INV-' || v_year_month || '-%';

    v_number := 'INV-' || v_year_month || '-' || LPAD(v_count::TEXT, 3, '0');
    RETURN v_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_invoice_number IS 'Generate nomor invoice unik: INV-YYYYMM-XXX';

-- --------------------------------------------------------------------------
-- 6.2 Check booking conflict (deteksi jadwal bentrok)
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_booking_conflict(
    p_user_id UUID,
    p_booking_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_travel_time_minutes INT DEFAULT 0,
    p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS TABLE (
    conflicting_booking_id UUID,
    conflicting_client_name VARCHAR,
    conflicting_start_time TIME,
    conflicting_end_time TIME
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.id,
        c.name,
        b.start_time,
        b.end_time
    FROM bookings b
    JOIN clients c ON c.id = b.client_id
    WHERE b.user_id = p_user_id
      AND b.booking_date = p_booking_date
      AND b.status NOT IN ('cancelled', 'rescheduled')
      AND (p_exclude_booking_id IS NULL OR b.id != p_exclude_booking_id)
      -- Cek overlap dengan mempertimbangkan travel time
      AND (
          (p_start_time - (p_travel_time_minutes || ' minutes')::INTERVAL)::TIME
          < (b.end_time + (b.travel_time_minutes || ' minutes')::INTERVAL)::TIME
          AND
          (p_end_time + (p_travel_time_minutes || ' minutes')::INTERVAL)::TIME
          > (b.start_time - (b.travel_time_minutes || ' minutes')::INTERVAL)::TIME
      );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_booking_conflict IS 'Cek apakah booking baru bentrok dengan jadwal yang sudah ada (termasuk travel time)';

-- --------------------------------------------------------------------------
-- 6.3 Get monthly revenue summary
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_monthly_revenue(
    p_user_id UUID,
    p_year INT,
    p_month INT
)
RETURNS TABLE (
    total_bookings BIGINT,
    total_revenue DECIMAL(12,2),
    total_paid DECIMAL(12,2),
    total_unpaid DECIMAL(12,2),
    total_expenses DECIMAL(12,2),
    net_profit DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH booking_stats AS (
        SELECT
            COUNT(*) AS cnt,
            COALESCE(SUM(total_price), 0) AS revenue
        FROM bookings
        WHERE user_id = p_user_id
          AND EXTRACT(YEAR FROM booking_date) = p_year
          AND EXTRACT(MONTH FROM booking_date) = p_month
          AND status NOT IN ('cancelled')
    ),
    payment_stats AS (
        SELECT COALESCE(SUM(p.amount), 0) AS paid
        FROM payments p
        JOIN bookings b ON b.id = p.booking_id
        WHERE b.user_id = p_user_id
          AND EXTRACT(YEAR FROM p.payment_date) = p_year
          AND EXTRACT(MONTH FROM p.payment_date) = p_month
          AND p.payment_type != 'refund'
    ),
    expense_stats AS (
        SELECT COALESCE(SUM(amount), 0) AS expenses
        FROM expenses
        WHERE user_id = p_user_id
          AND EXTRACT(YEAR FROM expense_date) = p_year
          AND EXTRACT(MONTH FROM expense_date) = p_month
    )
    SELECT
        bs.cnt,
        bs.revenue,
        ps.paid,
        bs.revenue - ps.paid,
        es.expenses,
        ps.paid - es.expenses
    FROM booking_stats bs, payment_stats ps, expense_stats es;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_monthly_revenue IS 'Ringkasan keuangan bulanan: booking, revenue, expenses, profit';

-- --------------------------------------------------------------------------
-- 6.4 Auto-create profile on signup (Supabase Auth trigger)
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: otomatis buat profil saat user baru mendaftar
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

COMMENT ON FUNCTION handle_new_user IS 'Auto-create profiles entry saat user baru sign up via Supabase Auth';

-- --------------------------------------------------------------------------
-- 6.5 Auto-log booking status changes
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO booking_logs (booking_id, old_status, new_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_booking_status_log
    AFTER UPDATE OF status ON bookings
    FOR EACH ROW EXECUTE FUNCTION log_booking_status_change();

-- --------------------------------------------------------------------------
-- 6.6 Auto-update invoice paid_amount & status
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_invoice_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_total_paid DECIMAL(12,2);
    v_total_amount DECIMAL(12,2);
BEGIN
    -- Hitung total pembayaran untuk booking ini
    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM payments
    WHERE booking_id = NEW.booking_id
      AND payment_type != 'refund';

    -- Kurangi refund
    SELECT v_total_paid - COALESCE(SUM(ABS(amount)), 0) INTO v_total_paid
    FROM payments
    WHERE booking_id = NEW.booking_id
      AND payment_type = 'refund';

    -- Update invoice
    UPDATE invoices
    SET paid_amount = v_total_paid,
        status = CASE
            WHEN v_total_paid >= total_amount THEN 'paid'::invoice_status_enum
            WHEN v_total_paid > 0 THEN 'partial'::invoice_status_enum
            ELSE 'unpaid'::invoice_status_enum
        END
    WHERE booking_id = NEW.booking_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_payment_update_invoice
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_invoice_on_payment();
