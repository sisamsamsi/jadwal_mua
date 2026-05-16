-- 1. Buat tipe ENUM untuk subscription_status jika belum ada
DO $$ BEGIN
    CREATE TYPE subscription_status_enum AS ENUM ('trial', 'active', 'expired', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tambahkan kolom ke tabel profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_status subscription_status_enum DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Jika kolom subscription_status sudah ada tapi bertipe TEXT, migrasi ke ENUM:
-- ALTER TABLE profiles ALTER COLUMN subscription_status DROP DEFAULT;
-- ALTER TABLE profiles 
--     ALTER COLUMN subscription_status TYPE subscription_status_enum 
--     USING subscription_status::subscription_status_enum;
-- ALTER TABLE profiles ALTER COLUMN subscription_status SET DEFAULT 'trial'::subscription_status_enum;

-- 4. Hapus kolom lama (opsional - cadangkan data jika perlu)
-- ALTER TABLE profiles 
--     DROP COLUMN IF EXISTS license_type,
--     DROP COLUMN IF EXISTS license_expires_at,
--     DROP COLUMN IF EXISTS license_key;

-- 5. Pastikan Admin (Service Role) memiliki akses penuh melalui RLS
-- Biasanya service_role sudah bypass RLS, tapi ini untuk kepastian:
CREATE POLICY "Admin full access"
  ON profiles FOR ALL
  USING (true)
  WITH CHECK (true);
