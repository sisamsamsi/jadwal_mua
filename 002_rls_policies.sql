-- ============================================================================
-- MUA App - Row-Level Security (RLS) Policies untuk Supabase
-- Migration 002: Enable RLS & Create Policies
-- ============================================================================
-- Setiap MUA hanya bisa mengakses data miliknya sendiri.
-- RLS memastikan keamanan di level database.
-- ============================================================================

-- ============================================================================
-- 1. ENABLE RLS pada semua tabel
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bridal_party ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. PROFILES POLICIES
-- ============================================================================
-- User hanya bisa melihat dan mengedit profilnya sendiri
CREATE POLICY "profiles_select_own"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Tidak boleh delete profile (soft delete via is_active)
-- DELETE tidak ada policy = tidak bisa delete via API

-- ============================================================================
-- 3. CLIENTS POLICIES
-- ============================================================================
-- MUA hanya bisa akses klien miliknya
CREATE POLICY "clients_select_own"
    ON clients FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "clients_insert_own"
    ON clients FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clients_update_own"
    ON clients FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clients_delete_own"
    ON clients FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 4. SERVICES POLICIES
-- ============================================================================
CREATE POLICY "services_select_own"
    ON services FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "services_insert_own"
    ON services FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "services_update_own"
    ON services FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "services_delete_own"
    ON services FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 5. PACKAGES POLICIES
-- ============================================================================
CREATE POLICY "packages_select_own"
    ON packages FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "packages_insert_own"
    ON packages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "packages_update_own"
    ON packages FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "packages_delete_own"
    ON packages FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 6. PACKAGE_ITEMS POLICIES
-- ============================================================================
-- Akses berdasarkan kepemilikan package
CREATE POLICY "package_items_select_own"
    ON package_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM packages
            WHERE packages.id = package_items.package_id
              AND packages.user_id = auth.uid()
        )
    );

CREATE POLICY "package_items_insert_own"
    ON package_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM packages
            WHERE packages.id = package_items.package_id
              AND packages.user_id = auth.uid()
        )
    );

CREATE POLICY "package_items_update_own"
    ON package_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM packages
            WHERE packages.id = package_items.package_id
              AND packages.user_id = auth.uid()
        )
    );

CREATE POLICY "package_items_delete_own"
    ON package_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM packages
            WHERE packages.id = package_items.package_id
              AND packages.user_id = auth.uid()
        )
    );

-- ============================================================================
-- 7. BOOKINGS POLICIES
-- ============================================================================
CREATE POLICY "bookings_select_own"
    ON bookings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "bookings_insert_own"
    ON bookings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookings_update_own"
    ON bookings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookings_delete_own"
    ON bookings FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 8. BRIDAL_PARTY POLICIES
-- ============================================================================
-- Akses berdasarkan kepemilikan booking
CREATE POLICY "bridal_party_select_own"
    ON bridal_party FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = bridal_party.booking_id
              AND bookings.user_id = auth.uid()
        )
    );

CREATE POLICY "bridal_party_insert_own"
    ON bridal_party FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = bridal_party.booking_id
              AND bookings.user_id = auth.uid()
        )
    );

CREATE POLICY "bridal_party_update_own"
    ON bridal_party FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = bridal_party.booking_id
              AND bookings.user_id = auth.uid()
        )
    );

CREATE POLICY "bridal_party_delete_own"
    ON bridal_party FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = bridal_party.booking_id
              AND bookings.user_id = auth.uid()
        )
    );

-- ============================================================================
-- 9. PAYMENTS POLICIES
-- ============================================================================
-- Akses berdasarkan kepemilikan booking
CREATE POLICY "payments_select_own"
    ON payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = payments.booking_id
              AND bookings.user_id = auth.uid()
        )
    );

CREATE POLICY "payments_insert_own"
    ON payments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = payments.booking_id
              AND bookings.user_id = auth.uid()
        )
    );

CREATE POLICY "payments_update_own"
    ON payments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = payments.booking_id
              AND bookings.user_id = auth.uid()
        )
    );

CREATE POLICY "payments_delete_own"
    ON payments FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = payments.booking_id
              AND bookings.user_id = auth.uid()
        )
    );

-- ============================================================================
-- 10. INVOICES POLICIES
-- ============================================================================
CREATE POLICY "invoices_select_own"
    ON invoices FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "invoices_insert_own"
    ON invoices FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "invoices_update_own"
    ON invoices FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "invoices_delete_own"
    ON invoices FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 11. EXPENSES POLICIES
-- ============================================================================
CREATE POLICY "expenses_select_own"
    ON expenses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "expenses_insert_own"
    ON expenses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "expenses_update_own"
    ON expenses FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "expenses_delete_own"
    ON expenses FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 12. PRODUCTS POLICIES
-- ============================================================================
CREATE POLICY "products_select_own"
    ON products FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "products_insert_own"
    ON products FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "products_update_own"
    ON products FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "products_delete_own"
    ON products FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 13. CLIENT_PHOTOS POLICIES
-- ============================================================================
-- Akses berdasarkan kepemilikan client
CREATE POLICY "client_photos_select_own"
    ON client_photos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM clients
            WHERE clients.id = client_photos.client_id
              AND clients.user_id = auth.uid()
        )
    );

CREATE POLICY "client_photos_insert_own"
    ON client_photos FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM clients
            WHERE clients.id = client_photos.client_id
              AND clients.user_id = auth.uid()
        )
    );

CREATE POLICY "client_photos_update_own"
    ON client_photos FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM clients
            WHERE clients.id = client_photos.client_id
              AND clients.user_id = auth.uid()
        )
    );

CREATE POLICY "client_photos_delete_own"
    ON client_photos FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM clients
            WHERE clients.id = client_photos.client_id
              AND clients.user_id = auth.uid()
        )
    );

-- ============================================================================
-- 14. REMINDERS POLICIES
-- ============================================================================
-- Akses berdasarkan kepemilikan booking
CREATE POLICY "reminders_select_own"
    ON reminders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = reminders.booking_id
              AND bookings.user_id = auth.uid()
        )
    );

CREATE POLICY "reminders_insert_own"
    ON reminders FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = reminders.booking_id
              AND bookings.user_id = auth.uid()
        )
    );

CREATE POLICY "reminders_update_own"
    ON reminders FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = reminders.booking_id
              AND bookings.user_id = auth.uid()
        )
    );

CREATE POLICY "reminders_delete_own"
    ON reminders FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = reminders.booking_id
              AND bookings.user_id = auth.uid()
        )
    );

-- ============================================================================
-- 15. BOOKING_LOGS POLICIES
-- ============================================================================
-- Read-only untuk pemilik booking
CREATE POLICY "booking_logs_select_own"
    ON booking_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = booking_logs.booking_id
              AND bookings.user_id = auth.uid()
        )
    );

-- Insert dilakukan oleh trigger, bukan user langsung
-- Tidak ada policy INSERT/UPDATE/DELETE untuk user

-- ============================================================================
-- 16. STORAGE POLICIES (Supabase Storage Buckets)
-- ============================================================================
-- Buat bucket untuk file uploads

-- Bucket: profile-photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Bucket: client-photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-photos', 'client-photos', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Bucket: payment-proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Bucket: invoices (PDF)
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Bucket: receipts (foto bon pengeluaran)
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: user hanya bisa akses folder miliknya
-- Pattern: {bucket}/{user_id}/{filename}

-- Profile photos
CREATE POLICY "profile_photos_select"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "profile_photos_insert"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "profile_photos_update"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "profile_photos_delete"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

-- Client photos
CREATE POLICY "client_photos_storage_select"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'client-photos' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "client_photos_storage_insert"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'client-photos' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "client_photos_storage_update"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'client-photos' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "client_photos_storage_delete"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'client-photos' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

-- Payment proofs
CREATE POLICY "payment_proofs_select"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "payment_proofs_insert"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "payment_proofs_delete"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

-- Invoices PDF
CREATE POLICY "invoices_storage_select"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'invoices' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "invoices_storage_insert"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'invoices' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "invoices_storage_delete"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'invoices' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

-- Receipts
CREATE POLICY "receipts_storage_select"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "receipts_storage_insert"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "receipts_storage_delete"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::TEXT);
