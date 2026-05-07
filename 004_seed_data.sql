-- ============================================================================
-- MUA App - Seed Data (Data Contoh)
-- Migration 004: Sample data untuk testing & demo
-- ============================================================================
-- CATATAN: Seed data ini untuk testing. Jangan jalankan di production.
-- Data ini memerlukan user yang sudah terdaftar via Supabase Auth.
--
-- Cara pakai:
-- 1. Register user di Supabase Auth terlebih dahulu
-- 2. Ganti '<USER_ID>' dengan UUID dari auth.users
-- 3. Jalankan di SQL Editor Supabase
-- ============================================================================

-- Ganti dengan UUID user yang sudah terdaftar
-- Contoh: DO $$ DECLARE v_user_id UUID := 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
DO $$
DECLARE
    v_user_id UUID;
    v_client_1 UUID;
    v_client_2 UUID;
    v_client_3 UUID;
    v_client_4 UUID;
    v_client_5 UUID;
    v_service_1 UUID;
    v_service_2 UUID;
    v_service_3 UUID;
    v_service_4 UUID;
    v_service_5 UUID;
    v_package_1 UUID;
    v_booking_1 UUID;
    v_booking_2 UUID;
    v_booking_3 UUID;
    v_booking_4 UUID;
    v_booking_5 UUID;
BEGIN
    -- ================================================================
    -- Ambil user pertama yang terdaftar (untuk testing)
    -- Ganti dengan ID spesifik jika perlu
    -- ================================================================
    SELECT id INTO v_user_id FROM profiles LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'Tidak ada user terdaftar. Register user terlebih dahulu via Supabase Auth.';
        RETURN;
    END IF;

    -- ================================================================
    -- Update profile MUA
    -- ================================================================
    UPDATE profiles SET
        full_name = 'Rina Beautya',
        phone = '081234567890',
        business_name = 'Rina MUA Studio',
        address = 'Jl. Sudirman No. 123, Kelurahan Menteng',
        city = 'Jakarta Pusat',
        province = 'DKI Jakarta',
        bio = 'Professional MUA with 5+ years experience. Specializing in bridal & editorial makeup.',
        instagram_handle = '@rina.beautya',
        whatsapp_number = '6281234567890',
        license_type = 'all_access'
    WHERE id = v_user_id;

    -- ================================================================
    -- Services (Layanan)
    -- ================================================================
    v_service_1 := gen_random_uuid();
    v_service_2 := gen_random_uuid();
    v_service_3 := gen_random_uuid();
    v_service_4 := gen_random_uuid();
    v_service_5 := gen_random_uuid();

    INSERT INTO services (id, user_id, name, category, description, duration_minutes, base_price, extra_person_price, sort_order) VALUES
    (v_service_1, v_user_id, 'Bridal Makeup - Wedding Day', 'bridal',
     'Makeup pengantin untuk hari pernikahan. Termasuk: base makeup, eye makeup, lip, dan touch up.', 120, 3500000, 500000, 1),
    (v_service_2, v_user_id, 'Bridal Trial', 'bridal',
     'Trial makeup pengantin sebelum hari H. Untuk menentukan look yang diinginkan.', 90, 1500000, 0, 2),
    (v_service_3, v_user_id, 'Party / Pesta Makeup', 'party',
     'Makeup untuk acara pesta, wisuda, lamaran, dll.', 60, 800000, 300000, 3),
    (v_service_4, v_user_id, 'Photoshoot Makeup', 'photoshoot',
     'Makeup untuk foto studio, pre-wedding, katalog, dll.', 90, 1200000, 400000, 4),
    (v_service_5, v_user_id, 'Makeup Tutorial Private', 'tutorial',
     'Kelas makeup private 1-on-1. Belajar teknik dasar sampai advance.', 120, 1000000, 0, 5);

    -- ================================================================
    -- Package (Paket Layanan)
    -- ================================================================
    v_package_1 := gen_random_uuid();

    INSERT INTO packages (id, user_id, name, description, total_price, discount_percentage) VALUES
    (v_package_1, v_user_id, 'Paket Bridal Complete',
     'Paket lengkap pengantin: Trial + Wedding Day makeup + Touch up. Termasuk makeup untuk 2 pengiring.',
     6000000, 10);

    INSERT INTO package_items (package_id, service_id, quantity, notes) VALUES
    (v_package_1, v_service_1, 1, 'Makeup pengantin hari H'),
    (v_package_1, v_service_2, 1, 'Trial makeup H-14');

    -- ================================================================
    -- Clients (Klien)
    -- ================================================================
    v_client_1 := gen_random_uuid();
    v_client_2 := gen_random_uuid();
    v_client_3 := gen_random_uuid();
    v_client_4 := gen_random_uuid();
    v_client_5 := gen_random_uuid();

    INSERT INTO clients (id, user_id, name, phone, email, address, city, skin_type, allergies, preferences, tags, notes) VALUES
    (v_client_1, v_user_id, 'Sari Dewi', '081345678901', 'sari.dewi@email.com',
     'Jl. Gatot Subroto No. 45, Pancoran', 'Jakarta Selatan',
     'combination', 'Alergi latex sponge', 'Suka natural look, warna nude/pink. Foundation medium coverage.',
     ARRAY['Bride', 'VIP'], 'Pengantin - Wedding 15 Juli 2026. Venue: Hotel Mulia.'),

    (v_client_2, v_user_id, 'Maya Putri', '081456789012', 'maya.putri@email.com',
     'Jl. Kemang Raya No. 78', 'Jakarta Selatan',
     'oily', NULL, 'Bold makeup lover. Suka smokey eye dan red lip.',
     ARRAY['Regular'], 'Langganan bulanan untuk acara-acara kantor.'),

    (v_client_3, v_user_id, 'Dian Ayu', '081567890123', 'dian.ayu@email.com',
     'Jl. Bintaro Utama No. 12', 'Tangerang Selatan',
     'dry', 'Alergi paraben', 'Korean makeup style. Suka dewy finish.',
     ARRAY['Regular'], 'Sering request produk Korea.'),

    (v_client_4, v_user_id, 'Ratna Sari', '081678901234', NULL,
     'Jl. Pluit Karang No. 33', 'Jakarta Utara',
     'normal', NULL, 'Flawless matte look. Warna earth tone.',
     ARRAY['VIP'], 'Istri pejabat. Selalu bayar on time. Request makeup yang tahan lama.'),

    (v_client_5, v_user_id, 'Anisa Rahma', '081789012345', 'anisa.r@email.com',
     'Jl. Margonda Raya No. 99', 'Depok',
     'sensitive', 'Kulit sangat sensitif, hanya bisa pakai produk hypoallergenic',
     'Minimalis makeup. Suka no-makeup makeup look.',
     ARRAY['Bride'], 'Calon pengantin - planning wedding Agustus 2026.');

    -- ================================================================
    -- Bookings (Jadwal)
    -- ================================================================
    v_booking_1 := gen_random_uuid();
    v_booking_2 := gen_random_uuid();
    v_booking_3 := gen_random_uuid();
    v_booking_4 := gen_random_uuid();
    v_booking_5 := gen_random_uuid();

    INSERT INTO bookings (id, user_id, client_id, service_id, package_id, booking_date, start_time, end_time,
                          location_name, location_address, travel_time_minutes, num_persons, status, total_price, notes) VALUES
    -- Booking 1: Bridal trial (completed)
    (v_booking_1, v_user_id, v_client_1, v_service_2, NULL,
     CURRENT_DATE - INTERVAL '14 days', '09:00', '10:30',
     'Rina MUA Studio', 'Jl. Sudirman No. 123', 0, 1, 'completed', 1500000,
     'Trial untuk wedding 15 Juli. Look: Natural Glam.'),

    -- Booking 2: Party makeup (confirmed, besok)
    (v_booking_2, v_user_id, v_client_2, v_service_3, NULL,
     CURRENT_DATE + INTERVAL '1 day', '17:00', '18:00',
     'Hotel Indonesia Kempinski', 'Jl. MH Thamrin No. 1', 30, 1, 'confirmed', 800000,
     'Acara gala dinner kantor. Request bold smokey eye.'),

    -- Booking 3: Photoshoot (confirmed, 3 hari lagi)
    (v_booking_3, v_user_id, v_client_3, v_service_4, NULL,
     CURRENT_DATE + INTERVAL '3 days', '08:00', '09:30',
     'Studio Foto Kelapa Gading', 'Jl. Boulevard Raya, Kelapa Gading', 45, 2, 'confirmed', 1600000,
     'Pre-wedding photoshoot outdoor. 2 orang (pasangan). Korean style.'),

    -- Booking 4: Bridal complete package (confirmed, minggu depan)
    (v_booking_4, v_user_id, v_client_1, NULL, v_package_1,
     CURRENT_DATE + INTERVAL '7 days', '05:00', '07:00',
     'Hotel Mulia Senayan', 'Jl. Asia Afrika, Senayan', 40, 3, 'confirmed', 6000000,
     'Wedding Day! Bride + 2 bridesmaid. Harus sudah di venue jam 5 pagi.'),

    -- Booking 5: Tutorial (pending, 5 hari lagi)
    (v_booking_5, v_user_id, v_client_5, v_service_5, NULL,
     CURRENT_DATE + INTERVAL '5 days', '13:00', '15:00',
     'Rumah klien', 'Jl. Margonda Raya No. 99, Depok', 60, 1, 'pending', 1000000,
     'Private tutorial basic makeup. Fokus: skincare prep & natural daily look.');

    -- ================================================================
    -- Bridal Party (untuk booking 4 - wedding)
    -- ================================================================
    INSERT INTO bridal_party (booking_id, name, role, service_id, scheduled_time, price, notes) VALUES
    (v_booking_4, 'Sari Dewi', 'bride', v_service_1, '05:00', 3500000, 'Pengantin utama. Natural glam look.'),
    (v_booking_4, 'Lisa Permata', 'bridesmaid', v_service_3, '05:30', 500000, 'Pengiring 1. Soft pink look.'),
    (v_booking_4, 'Nia Kurnia', 'bridesmaid', v_service_3, '06:00', 500000, 'Pengiring 2. Soft pink look.');

    -- ================================================================
    -- Payments (Pembayaran)
    -- ================================================================
    -- Booking 1 (completed) - lunas
    INSERT INTO payments (booking_id, amount, payment_type, payment_method, payment_date, notes) VALUES
    (v_booking_1, 1500000, 'full', 'bank_transfer', CURRENT_DATE - INTERVAL '14 days', 'Bayar lunas via BCA transfer');

    -- Booking 2 - DP 50%
    INSERT INTO payments (booking_id, amount, payment_type, payment_method, payment_date, notes) VALUES
    (v_booking_2, 400000, 'dp', 'ewallet', CURRENT_DATE - INTERVAL '3 days', 'DP 50% via GoPay');

    -- Booking 3 - DP 50%
    INSERT INTO payments (booking_id, amount, payment_type, payment_method, payment_date, notes) VALUES
    (v_booking_3, 800000, 'dp', 'bank_transfer', CURRENT_DATE - INTERVAL '5 days', 'DP 50% via BCA transfer');

    -- Booking 4 (wedding) - DP 30%
    INSERT INTO payments (booking_id, amount, payment_type, payment_method, payment_date, notes) VALUES
    (v_booking_4, 1800000, 'dp', 'bank_transfer', CURRENT_DATE - INTERVAL '30 days', 'DP 30% via Mandiri transfer');

    -- ================================================================
    -- Invoices
    -- ================================================================
    INSERT INTO invoices (booking_id, user_id, invoice_number, total_amount, paid_amount, status, due_date, issued_date) VALUES
    (v_booking_1, v_user_id, generate_invoice_number(v_user_id), 1500000, 1500000, 'paid',
     CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE - INTERVAL '15 days'),
    (v_booking_2, v_user_id, generate_invoice_number(v_user_id), 800000, 400000, 'partial',
     CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE - INTERVAL '3 days'),
    (v_booking_3, v_user_id, generate_invoice_number(v_user_id), 1600000, 800000, 'partial',
     CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE - INTERVAL '5 days'),
    (v_booking_4, v_user_id, generate_invoice_number(v_user_id), 6000000, 1800000, 'partial',
     CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE - INTERVAL '30 days'),
    (v_booking_5, v_user_id, generate_invoice_number(v_user_id), 1000000, 0, 'unpaid',
     CURRENT_DATE + INTERVAL '4 days', CURRENT_DATE);

    -- ================================================================
    -- Expenses (Pengeluaran)
    -- ================================================================
    INSERT INTO expenses (user_id, category, description, amount, expense_date, notes) VALUES
    (v_user_id, 'product', 'Restok foundation MAC Studio Fix (3 shade)', 1350000, CURRENT_DATE - INTERVAL '7 days', 'Shade NC25, NC30, NC35'),
    (v_user_id, 'product', 'Lipstick set Charlotte Tilbury (5 warna)', 2500000, CURRENT_DATE - INTERVAL '10 days', 'Pillow Talk, Walk of Shame, dll'),
    (v_user_id, 'transport', 'Bensin + tol ke venue Hotel Mulia (trial run)', 150000, CURRENT_DATE - INTERVAL '14 days', NULL),
    (v_user_id, 'equipment', 'Ring light baru 18 inch', 850000, CURRENT_DATE - INTERVAL '20 days', 'Merk Neewer, beli di Tokopedia'),
    (v_user_id, 'marketing', 'Boost Instagram post portofolio', 200000, CURRENT_DATE - INTERVAL '5 days', '3 hari boost'),
    (v_user_id, 'transport', 'Grab ke lokasi photoshoot Kelapa Gading', 75000, CURRENT_DATE - INTERVAL '2 days', NULL);

    -- ================================================================
    -- Products (Inventaris)
    -- ================================================================
    INSERT INTO products (user_id, name, brand, category, current_stock, min_stock_alert, purchase_price, expiry_date, notes) VALUES
    (v_user_id, 'Studio Fix Fluid Foundation NC25', 'MAC', 'foundation', 2, 1, 450000, '2027-06-01', 'Shade paling laris'),
    (v_user_id, 'Studio Fix Fluid Foundation NC30', 'MAC', 'foundation', 3, 1, 450000, '2027-06-01', NULL),
    (v_user_id, 'Studio Fix Fluid Foundation NC35', 'MAC', 'foundation', 1, 1, 450000, '2027-06-01', 'Stok menipis!'),
    (v_user_id, 'Pillow Talk Lipstick', 'Charlotte Tilbury', 'lipstick', 2, 1, 500000, '2028-01-01', 'Best seller untuk bridal'),
    (v_user_id, 'Pro Filt''r Soft Matte Foundation', 'Fenty Beauty', 'foundation', 0, 1, 520000, '2027-03-01', 'HABIS - perlu restok!'),
    (v_user_id, 'Naked Eyeshadow Palette', 'Urban Decay', 'eyeshadow', 1, 1, 750000, '2027-12-01', 'Palette utama untuk natural look'),
    (v_user_id, 'Setting Spray All Nighter', 'Urban Decay', 'setting_spray', 3, 2, 350000, '2027-09-01', 'Wajib untuk outdoor event'),
    (v_user_id, 'Beauty Blender Original', 'BeautyBlender', 'tools', 5, 3, 150000, NULL, 'Ganti setiap 3 bulan');

    -- ================================================================
    -- Reminders
    -- ================================================================
    -- Reminder untuk booking 2 (besok)
    INSERT INTO reminders (booking_id, reminder_type, scheduled_at, channel, status) VALUES
    (v_booking_2, 'booking_h1', CURRENT_DATE + INTERVAL '1 day' - INTERVAL '12 hours', 'both', 'pending'),
    (v_booking_2, 'booking_hday', CURRENT_DATE + INTERVAL '1 day' - INTERVAL '2 hours', 'push', 'pending');

    -- Reminder untuk booking 3 (3 hari lagi)
    INSERT INTO reminders (booking_id, reminder_type, scheduled_at, channel, status) VALUES
    (v_booking_3, 'booking_h3', CURRENT_DATE, 'whatsapp', 'pending'),
    (v_booking_3, 'booking_h1', CURRENT_DATE + INTERVAL '2 days', 'both', 'pending');

    -- Reminder untuk booking 4 (wedding - 7 hari lagi)
    INSERT INTO reminders (booking_id, reminder_type, scheduled_at, channel, status) VALUES
    (v_booking_4, 'booking_h7', CURRENT_DATE, 'both', 'pending'),
    (v_booking_4, 'booking_h3', CURRENT_DATE + INTERVAL '4 days', 'both', 'pending'),
    (v_booking_4, 'booking_h1', CURRENT_DATE + INTERVAL '6 days', 'both', 'pending'),
    (v_booking_4, 'payment_due', CURRENT_DATE + INTERVAL '4 days', 'whatsapp', 'pending');

    -- Reminder untuk booking 5
    INSERT INTO reminders (booking_id, reminder_type, scheduled_at, channel, status) VALUES
    (v_booking_5, 'booking_h3', CURRENT_DATE + INTERVAL '2 days', 'both', 'pending');

    RAISE NOTICE 'Seed data berhasil dimasukkan untuk user: %', v_user_id;
END $$;
