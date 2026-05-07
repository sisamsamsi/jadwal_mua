-- ============================================================================
-- MUA App - Database Views
-- Migration 003: Useful Views untuk query yang sering dipakai
-- ============================================================================

-- --------------------------------------------------------------------------
-- View 1: Booking lengkap dengan info klien & layanan
-- --------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_bookings_detail AS
SELECT
    b.id AS booking_id,
    b.user_id,
    b.booking_date,
    b.start_time,
    b.end_time,
    b.status,
    b.location_name,
    b.location_address,
    b.travel_time_minutes,
    b.num_persons,
    b.total_price,
    b.notes AS booking_notes,
    b.created_at AS booking_created_at,
    -- Client info
    c.id AS client_id,
    c.name AS client_name,
    c.phone AS client_phone,
    c.email AS client_email,
    c.skin_type AS client_skin_type,
    c.allergies AS client_allergies,
    -- Service info
    s.id AS service_id,
    s.name AS service_name,
    s.category AS service_category,
    s.duration_minutes AS service_duration,
    s.base_price AS service_price,
    -- Package info
    pk.id AS package_id,
    pk.name AS package_name,
    pk.total_price AS package_price,
    -- Payment summary
    COALESCE(pay.total_paid, 0) AS total_paid,
    b.total_price - COALESCE(pay.total_paid, 0) AS remaining_balance,
    CASE
        WHEN COALESCE(pay.total_paid, 0) >= b.total_price THEN 'lunas'
        WHEN COALESCE(pay.total_paid, 0) > 0 THEN 'sebagian'
        ELSE 'belum_bayar'
    END AS payment_status
FROM bookings b
JOIN clients c ON c.id = b.client_id
LEFT JOIN services s ON s.id = b.service_id
LEFT JOIN packages pk ON pk.id = b.package_id
LEFT JOIN LATERAL (
    SELECT SUM(CASE WHEN payment_type != 'refund' THEN amount ELSE -ABS(amount) END) AS total_paid
    FROM payments
    WHERE booking_id = b.id
) pay ON TRUE;

-- --------------------------------------------------------------------------
-- View 2: Dashboard hari ini
-- --------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_today_bookings AS
SELECT
    b.id AS booking_id,
    b.user_id,
    b.start_time,
    b.end_time,
    b.status,
    b.location_name,
    b.total_price,
    c.name AS client_name,
    c.phone AS client_phone,
    s.name AS service_name,
    s.category AS service_category,
    pk.name AS package_name
FROM bookings b
JOIN clients c ON c.id = b.client_id
LEFT JOIN services s ON s.id = b.service_id
LEFT JOIN packages pk ON pk.id = b.package_id
WHERE b.booking_date = CURRENT_DATE
  AND b.status NOT IN ('cancelled')
ORDER BY b.start_time;

-- --------------------------------------------------------------------------
-- View 3: Upcoming bookings (7 hari ke depan)
-- --------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_upcoming_bookings AS
SELECT
    b.id AS booking_id,
    b.user_id,
    b.booking_date,
    b.start_time,
    b.end_time,
    b.status,
    b.location_name,
    b.location_address,
    b.total_price,
    c.name AS client_name,
    c.phone AS client_phone,
    s.name AS service_name,
    pk.name AS package_name,
    b.booking_date - CURRENT_DATE AS days_until
FROM bookings b
JOIN clients c ON c.id = b.client_id
LEFT JOIN services s ON s.id = b.service_id
LEFT JOIN packages pk ON pk.id = b.package_id
WHERE b.booking_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
  AND b.status IN ('pending', 'confirmed')
ORDER BY b.booking_date, b.start_time;

-- --------------------------------------------------------------------------
-- View 4: Invoice dengan detail pembayaran
-- --------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_invoices_detail AS
SELECT
    i.id AS invoice_id,
    i.user_id,
    i.invoice_number,
    i.total_amount,
    i.paid_amount,
    i.status AS invoice_status,
    i.due_date,
    i.issued_date,
    -- Booking info
    b.booking_date,
    b.status AS booking_status,
    -- Client info
    c.name AS client_name,
    c.phone AS client_phone,
    -- Service info
    COALESCE(s.name, pk.name) AS service_name,
    -- Overdue check
    CASE
        WHEN i.status IN ('unpaid', 'partial') AND i.due_date < CURRENT_DATE
        THEN TRUE
        ELSE FALSE
    END AS is_overdue,
    CASE
        WHEN i.due_date IS NOT NULL
        THEN i.due_date - CURRENT_DATE
        ELSE NULL
    END AS days_until_due
FROM invoices i
JOIN bookings b ON b.id = i.booking_id
JOIN clients c ON c.id = b.client_id
LEFT JOIN services s ON s.id = b.service_id
LEFT JOIN packages pk ON pk.id = b.package_id;

-- --------------------------------------------------------------------------
-- View 5: Ringkasan klien dengan statistik
-- --------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_clients_summary AS
SELECT
    c.id AS client_id,
    c.user_id,
    c.name,
    c.phone,
    c.email,
    c.skin_type,
    c.tags,
    c.is_active,
    c.created_at,
    -- Booking stats
    COUNT(b.id) AS total_bookings,
    COUNT(CASE WHEN b.status = 'completed' THEN 1 END) AS completed_bookings,
    MAX(b.booking_date) AS last_booking_date,
    MIN(b.booking_date) AS first_booking_date,
    -- Revenue stats
    COALESCE(SUM(CASE WHEN b.status != 'cancelled' THEN b.total_price ELSE 0 END), 0) AS total_revenue
FROM clients c
LEFT JOIN bookings b ON b.client_id = c.id
GROUP BY c.id, c.user_id, c.name, c.phone, c.email, c.skin_type, c.tags, c.is_active, c.created_at;

-- --------------------------------------------------------------------------
-- View 6: Produk dengan stok rendah
-- --------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_low_stock_products AS
SELECT
    p.id AS product_id,
    p.user_id,
    p.name,
    p.brand,
    p.category,
    p.current_stock,
    p.min_stock_alert,
    p.purchase_price,
    p.expiry_date,
    CASE
        WHEN p.expiry_date IS NOT NULL AND p.expiry_date < CURRENT_DATE
        THEN TRUE
        ELSE FALSE
    END AS is_expired,
    CASE
        WHEN p.expiry_date IS NOT NULL AND p.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
        THEN TRUE
        ELSE FALSE
    END AS expiring_soon
FROM products p
WHERE p.is_active = TRUE
  AND (p.current_stock <= p.min_stock_alert
       OR (p.expiry_date IS NOT NULL AND p.expiry_date <= CURRENT_DATE + INTERVAL '30 days'))
ORDER BY p.current_stock;

-- --------------------------------------------------------------------------
-- View 7: Rekap keuangan bulanan
-- --------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_monthly_financial_summary AS
SELECT
    b.user_id,
    DATE_TRUNC('month', b.booking_date)::DATE AS month,
    -- Booking stats
    COUNT(DISTINCT b.id) AS total_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) AS completed_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id END) AS cancelled_bookings,
    -- Revenue
    COALESCE(SUM(CASE WHEN b.status != 'cancelled' THEN b.total_price ELSE 0 END), 0) AS gross_revenue,
    -- Unique clients
    COUNT(DISTINCT b.client_id) AS unique_clients
FROM bookings b
GROUP BY b.user_id, DATE_TRUNC('month', b.booking_date);

-- --------------------------------------------------------------------------
-- View 8: Layanan terpopuler
-- --------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_popular_services AS
SELECT
    s.id AS service_id,
    s.user_id,
    s.name AS service_name,
    s.category,
    s.base_price,
    COUNT(b.id) AS total_bookings,
    COALESCE(SUM(b.total_price), 0) AS total_revenue,
    COUNT(DISTINCT b.client_id) AS unique_clients
FROM services s
LEFT JOIN bookings b ON b.service_id = s.id AND b.status != 'cancelled'
WHERE s.is_active = TRUE
GROUP BY s.id, s.user_id, s.name, s.category, s.base_price
ORDER BY total_bookings DESC;
