# Analisis Pasif: Kesesuaian Project MUA dengan Blueprint

> **Tanggal Analisis**: 2026-05-07  
> **Referensi**: `BLUEPRINT_EXPO.md` (Expo version) + `MUA_App_Planning.md` (planning awal, Flutter → Expo)  
> **Scope**: Read-only, tidak ada perubahan kode

---

## 1. Ringkasan Eksekutif

Project `mua-app` sudah **berhasil berpindah dari Flutter ke Expo (React Native)** dengan mempertahankan seluruh fitur dan fungsi yang direncanakan di `MUA_App_Planning.md`. Fondasi teknis sudah terpasang, namun implementasi masih berada di **±40% dari total blueprint** — baru mencakup Phase 1 (Foundation) dan sebagian Phase 2-3 (Auth, Core Booking/Client/Service). Layer-layer penting seperti screen tambahan, components, utilitas, types, dan fitur lanjutan (keuangan, inventaris, notifikasi, sync engine) **belum diimplementasikan**.

---

## 2. Perbandingan Stack Teknologi

### MUA_App_Planning.md (Awal — Flutter)
| Komponen | Flutter Stack |
|----------|--------------|
| Framework | Flutter (Dart) |
| State | Riverpod / Bloc |
| Local DB | Drift (SQLite) |
| Navigation | GoRouter |
| UI | Material Design 3 |
| Push Notif | Firebase Cloud Messaging |

### BLUEPRINT_EXPO.md (Final — Expo)
| Komponen | Expo Stack |
|----------|-----------|
| Framework | Expo ~52 (React Native) |
| State | Zustand ^5 + TanStack Query ^5 |
| Local DB | expo-sqlite + Drizzle ORM |
| Navigation | Expo Router ~4 |
| UI | NativeWind ^4 (TailwindCSS) |
| Push Notif | expo-notifications (FCM di Android) |

**✅ Kesimpulan Stack**: Migrasi Flutter → Expo sudah benar dan konseptual equivalent — semua fitur yang direncanakan tetap dapat diimplementasikan. Backend Supabase, arsitektur offline-first, dan model bisnis **tidak berubah** antara kedua dokumen.

---

## 3. Analisis Kesesuaian File & Struktur

### 3.1 Konfigurasi Root (STEP 1 Blueprint)

| File | Blueprint | Aktual | Status |
|------|-----------|--------|--------|
| `app.json` | ✅ Wajib (dengan `newArchEnabled`, `googleServicesFile`) | ✅ Ada, tapi **kurang** `newArchEnabled: true` dan `googleServicesFile` | ⚠️ Partial |
| `babel.config.js` | ✅ Wajib | ✅ Ada | ✅ |
| `tailwind.config.js` | ✅ Wajib | ✅ Ada | ✅ |
| `global.css` | ✅ Wajib | ✅ Ada | ✅ |
| `metro.config.js` | ✅ Wajib | ✅ Ada | ✅ |
| `drizzle.config.ts` | ✅ Wajib | ✅ Ada | ✅ |
| `tsconfig.json` | ✅ Wajib | ✅ Ada | ✅ |
| `.env` | ✅ Wajib | ✅ Ada | ✅ |
| `nativewind-env.d.ts` | ✅ Wajib | ❌ Tidak ada | ❌ Missing |
| `env.d.ts` | ✅ Wajib | ❌ Tidak ada (ada `global.d.ts`) | ⚠️ Renamed? |

> **Catatan `app.json`**: Blueprint mensyaratkan `"newArchEnabled": true` untuk kompatibilitas React Native New Architecture, dan `"googleServicesFile": "./google-services.json"` untuk FCM Android. Keduanya belum ada di aktual.

---

### 3.2 Struktur Routing `src/app/` (STEP 8 Blueprint)

| Route | Blueprint | Aktual | Status |
|-------|-----------|--------|--------|
| `_layout.tsx` | ✅ | ✅ Ada | ✅ |
| `index.tsx` | ✅ | ✅ Ada | ✅ |
| `(auth)/_layout.tsx` | ✅ | ✅ Ada | ✅ |
| `(auth)/login.tsx` | ✅ | ✅ Ada | ✅ |
| `(auth)/register.tsx` | ✅ | ✅ Ada | ✅ |
| `(auth)/forgot-password.tsx` | ✅ | ❌ Tidak ada | ❌ Missing |
| `(tabs)/_layout.tsx` | ✅ | ✅ Ada | ✅ |
| `(tabs)/index.tsx` (Dashboard) | ✅ | ✅ Ada | ✅ |
| `(tabs)/calendar.tsx` | ✅ | ✅ Ada | ✅ |
| `(tabs)/clients.tsx` | ✅ | ✅ Ada | ✅ |
| `(tabs)/finance.tsx` | ✅ | ✅ Ada (placeholder) | ⚠️ Placeholder |
| `(tabs)/profile.tsx` | ✅ | ✅ Ada (placeholder) | ⚠️ Placeholder |
| `booking/_layout.tsx` | ✅ | ✅ Ada | ✅ |
| `booking/[id].tsx` | ✅ | ✅ Ada | ✅ |
| `booking/new.tsx` | ✅ | ✅ Ada | ✅ |
| `client/_layout.tsx` | ✅ | ❌ Tidak ada | ❌ Missing |
| `client/[id].tsx` | ✅ | ❌ Tidak ada | ❌ Missing |
| `client/new.tsx` | ✅ | ❌ Tidak ada | ❌ Missing |
| `service/` (semua) | ✅ | ❌ Tidak ada | ❌ Missing |
| `package/` (semua) | ✅ | ❌ Tidak ada | ❌ Missing |
| `invoice/` (semua) | ✅ | ❌ Tidak ada | ❌ Missing |
| `payment/` (semua) | ✅ | ❌ Tidak ada | ❌ Missing |
| `expense/` (semua) | ✅ | ❌ Tidak ada | ❌ Missing |
| `product/` (semua) | ✅ | ❌ Tidak ada | ❌ Missing |
| `settings.tsx` | ✅ | ❌ Tidak ada | ❌ Missing |

**Score Routing**: 11/24 route tersedia = **~46%**

---

### 3.3 `src/lib/` — Business Logic Layer

#### Constants
| File | Blueprint | Aktual | Status |
|------|-----------|--------|--------|
| `constants/colors.ts` | ✅ | ❌ Tidak ada | ❌ Missing |
| `constants/app.ts` | ✅ | ❌ Tidak ada | ❌ Missing |
| `constants/supabase.ts` | ✅ | ✅ Ada | ✅ |

#### Types (STEP 3 Blueprint)
| File | Blueprint | Aktual | Status |
|------|-----------|--------|--------|
| `types/enums.ts` | ✅ | ❌ | ❌ Missing |
| `types/booking.ts` | ✅ | ❌ | ❌ Missing |
| `types/client.ts` | ✅ | ❌ | ❌ Missing |
| `types/service.ts` | ✅ | ❌ | ❌ Missing |
| `types/package.ts` | ✅ | ❌ | ❌ Missing |
| `types/payment.ts` | ✅ | ❌ | ❌ Missing |
| `types/invoice.ts` | ✅ | ❌ | ❌ Missing |
| `types/expense.ts` | ✅ | ❌ | ❌ Missing |
| `types/product.ts` | ✅ | ❌ | ❌ Missing |
| `types/client-photo.ts` | ✅ | ❌ | ❌ Missing |
| `types/reminder.ts` | ✅ | ❌ | ❌ Missing |
| `types/booking-log.ts` | ✅ | ❌ | ❌ Missing |
| `types/profile.ts` | ✅ | ❌ | ❌ Missing |
| `types/bridal-party.ts` | ✅ | ❌ | ❌ Missing |

> **⚠️ Kritis**: Folder `src/lib/types/` **tidak ada sama sekali**. Ini berarti semua type interface dan Zod schema (yang jadi dasar form validation) belum dibuat.

#### Local DB (STEP 4 Blueprint)
| File | Blueprint | Aktual | Status |
|------|-----------|--------|--------|
| `db/schema.ts` | ✅ | ✅ Ada (lengkap, 12 tabel) | ✅ |
| `db/client.ts` | ✅ | ✅ Ada | ✅ |
| `db/migrations/` | ✅ (generate via drizzle-kit) | ❌ Tidak ada folder migrations | ❌ Missing |

> **Catatan**: `drizzle-kit generate` belum pernah dijalankan — tidak ada folder `migrations/` yang berisi file SQL hasil generate.

#### Supabase Services (STEP 5 Blueprint)
| File | Blueprint | Aktual | Status |
|------|-----------|--------|--------|
| `supabase/client.ts` | ✅ | ✅ Ada | ✅ |
| `supabase/auth.ts` | ✅ | ✅ Ada | ✅ |
| `supabase/bookings.ts` | ✅ | ✅ Ada | ✅ |
| `supabase/clients.ts` | ✅ | ✅ Ada | ✅ |
| `supabase/services.ts` | ✅ | ✅ Ada | ✅ |
| `supabase/packages.ts` | ✅ | ❌ Tidak ada | ❌ Missing |
| `supabase/payments.ts` | ✅ | ❌ Tidak ada | ❌ Missing |
| `supabase/invoices.ts` | ✅ | ❌ Tidak ada | ❌ Missing |
| `supabase/expenses.ts` | ✅ | ❌ Tidak ada | ❌ Missing |
| `supabase/products.ts` | ✅ | ❌ Tidak ada | ❌ Missing |
| `supabase/client-photos.ts` | ✅ | ❌ Tidak ada | ❌ Missing |
| `supabase/storage.ts` | ✅ | ❌ Tidak ada | ❌ Missing |

> Ada file `supabase/client.ts` (duplikasi dengan `supabase/clients.ts`?) — perlu dicek apakah ini typo atau memang ada dua file berbeda.

**Score Supabase Services**: 5/12 = **~42%**

#### Repositories (STEP 6 Blueprint)
| File | Blueprint | Aktual | Status |
|------|-----------|--------|--------|
| `repositories/booking-repository.ts` | ✅ | ✅ Ada | ✅ |
| `repositories/client-repository.ts` | ✅ | ✅ Ada | ✅ |
| `repositories/service-repository.ts` | ✅ | ✅ Ada | ✅ |
| `repositories/sync-repository.ts` | ✅ | ✅ Ada | ✅ |
| `repositories/package-repository.ts` | ✅ | ❌ Tidak ada | ❌ Missing |
| `repositories/payment-repository.ts` | ✅ | ❌ Tidak ada | ❌ Missing |
| `repositories/invoice-repository.ts` | ✅ | ❌ Tidak ada | ❌ Missing |
| `repositories/expense-repository.ts` | ✅ | ❌ Tidak ada | ❌ Missing |
| `repositories/product-repository.ts` | ✅ | ❌ Tidak ada | ❌ Missing |
| `repositories/client-photo-repository.ts` | ✅ | ❌ Tidak ada | ❌ Missing |

**Score Repositories**: 4/10 = **40%**

#### Hooks TanStack Query (STEP 7 Blueprint)
| File | Blueprint | Aktual | Status |
|------|-----------|--------|--------|
| `hooks/use-auth.ts` | ✅ | ✅ Ada | ✅ |
| `hooks/use-bookings.ts` | ✅ | ✅ Ada | ✅ |
| `hooks/use-clients.ts` | ✅ | ✅ Ada | ✅ |
| `hooks/use-services.ts` | ✅ | ✅ Ada | ✅ |
| `hooks/use-packages.ts` | ✅ | ❌ Tidak ada | ❌ Missing |
| `hooks/use-payments.ts` | ✅ | ❌ Tidak ada | ❌ Missing |
| `hooks/use-invoices.ts` | ✅ | ❌ Tidak ada | ❌ Missing |
| `hooks/use-expenses.ts` | ✅ | ❌ Tidak ada | ❌ Missing |
| `hooks/use-products.ts` | ✅ | ❌ Tidak ada | ❌ Missing |
| `hooks/use-dashboard.ts` | ✅ | ❌ Tidak ada | ❌ Missing |

**Score Hooks**: 4/10 = **40%**

#### Zustand Stores (STEP 7 Blueprint)
| File | Blueprint | Aktual | Status |
|------|-----------|--------|--------|
| `stores/auth-store.ts` | ✅ | ✅ Ada | ✅ |
| `stores/sync-store.ts` | ✅ | ✅ Ada | ✅ |
| `stores/ui-store.ts` | ✅ | ❌ Tidak ada | ❌ Missing |

**Score Stores**: 2/3 = **67%**

#### Utils
| File | Blueprint | Aktual | Status |
|------|-----------|--------|--------|
| `utils/currency.ts` | ✅ | ❌ Tidak ada | ❌ Missing |
| `utils/date.ts` | ✅ | ❌ Tidak ada | ❌ Missing |
| `utils/whatsapp.ts` | ✅ | ❌ Tidak ada | ❌ Missing |
| `utils/validators.ts` | ✅ | ❌ Tidak ada | ❌ Missing |

> **⚠️ Kritis**: Folder `src/lib/utils/` **tidak ada**. Ini berarti semua helper function (format Rupiah, format tanggal Indonesia, WhatsApp URL builder) belum tersedia.

---

### 3.4 `src/components/` (Blueprint Section)

| Folder | Blueprint | Aktual | Status |
|--------|-----------|--------|--------|
| `components/ui/` (Button, Input, dll) | ✅ 9 komponen | ❌ Folder kosong | ❌ Missing |
| `components/booking/` | ✅ 6 komponen | ❌ Folder kosong | ❌ Missing |
| `components/client/` | ✅ 4 komponen | ❌ Folder kosong | ❌ Missing |
| `components/dashboard/` | ✅ 4 komponen | ❌ Folder kosong | ❌ Missing |
| `components/finance/` | ✅ 4 komponen | ❌ Folder kosong | ❌ Missing |
| `components/service/` | ✅ 2 komponen | ❌ Folder kosong | ❌ Missing |
| `components/product/` | ✅ 2 komponen | ❌ Folder kosong | ❌ Missing |

> **⚠️ Kritis**: Direktori `src/components/` ada tapi **kosong sepenuhnya**. Seluruh reusable UI components belum dibuat.

---

## 4. Analisis Kesesuaian Dependencies

### Versi Kritis yang Perlu Diperhatikan

| Package | Blueprint (Target) | Aktual `package.json` | Risiko |
|---------|-------------------|----------------------|--------|
| `expo` | `~52` | `^48.0.0` | 🔴 **Major version gap** — Expo 48 vs 52 sangat berbeda (New Architecture, SDK APIs) |
| `expo-router` | `~4` | `^1.0.0` | 🔴 **Major version gap** — Router v1 vs v4, API routing berubah drastis |
| `nativewind` | `^4` | `^2.0.0` | 🔴 **Major version gap** — NativeWind v2 vs v4, setup config berbeda |
| `expo-sqlite` | Expo SDK 52 version | `^11.0.0` | 🟡 Perlu sinkronisasi dengan SDK |
| `drizzle-orm` | Latest | `^0.19.0` | 🟡 Versi lama, API mungkin berbeda |
| `zustand` | `^5` | `^4.0.0` | 🟡 Versi 4 vs 5, ada breaking changes |
| `victory-native` | `^41` | `^40.0.0` | 🟡 Minor, umumnya aman |
| `date-fns` | `^4` | `^2.29.3` | 🟡 Major gap, API berbeda |

> **⚠️ Sangat Kritis**: Perbedaan versi `expo` (48 vs 52) dan `expo-router` (v1 vs v4) adalah masalah paling besar. Blueprint ditulis untuk Expo SDK 52 + Router v4, tapi `package.json` menggunakan versi yang jauh lebih lama. Ini berpotensi menyebabkan:
> - API incompatibility
> - Fitur New Architecture tidak tersedia
> - Routing syntax yang berbeda (`expo-router` v1 vs v4 memiliki perbedaan signifikan di file-based routing)

### Missing Dependencies (Ada di Blueprint, Tidak di package.json)
| Package | Kegunaan |
|---------|----------|
| `expo-linking` | WhatsApp deep link |
| `expo-constants` | App constants |
| `expo-status-bar` | Status bar management |
| `expo-splash-screen` | Splash screen handling |
| `expo-system-ui` | System UI management |
| `react-native-screens` | Screen optimization |
| `react-native-safe-area-context` | Safe area insets |
| `react-native-gesture-handler` | Gesture handling |
| `@hookform/resolvers` | Zod integration dengan react-hook-form |
| `expo-file-system` | File system (untuk upload foto) |
| `expo-print` | Print invoice |
| `expo-sharing` | Share invoice |
| `uuid` + `@types/uuid` | UUID generation |
| `react-native-dotenv` | Env vars (hanya di devDependencies) |
| `base64-arraybuffer` | Upload image ke Supabase Storage |

---

## 5. Kesesuaian dengan Fitur MUA_App_Planning.md

### Phase 1 — MVP Features (Fitur Inti)

| Fitur | Planning | Blueprint | Implementasi Aktual | Status |
|-------|----------|-----------|--------------------|----- --|
| Kalender visual | ✅ | ✅ STEP 11 | ⚠️ Skeleton ada di `calendar.tsx` | Partial |
| Buat booking baru | ✅ | ✅ STEP 11 | ✅ `booking/new.tsx` ada | Partial |
| Deteksi bentrok otomatis | ✅ | ✅ via RPC `check_booking_conflict` | ❌ Belum di UI | Missing |
| Travel time buffer | ✅ | ✅ ada di schema | ❌ Belum di UI form | Missing |
| Status booking (flow) | ✅ | ✅ | ❌ Belum di UI | Missing |
| Database klien | ✅ | ✅ STEP 12 | ⚠️ List ada, detail/edit missing | Partial |
| Preferensi klien (skin type, alergi) | ✅ | ✅ ada di schema | ❌ Belum di UI | Missing |
| Foto before/after klien | ✅ | ✅ STEP 12 | ❌ Belum | Missing |
| Daftar layanan CRUD | ✅ | ✅ STEP 13 | ❌ Belum ada screens `service/` | Missing |
| Paket layanan | ✅ | ✅ STEP 13 | ❌ Belum ada screens `package/` | Missing |
| Invoice otomatis | ✅ | ✅ STEP 14 | ❌ Belum | Missing |
| Tracking pembayaran | ✅ | ✅ STEP 14 | ❌ Belum | Missing |
| Rekap pendapatan | ✅ | ✅ STEP 14 | ⚠️ `finance.tsx` placeholder | Missing |
| Pencatatan pengeluaran | ✅ | ✅ STEP 14 | ❌ Belum | Missing |
| Reminder booking (push notif) | ✅ | ✅ STEP 16 | ❌ Belum | Missing |
| Integrasi WhatsApp | ✅ | ✅ STEP 16 | ❌ `utils/whatsapp.ts` missing | Missing |

### Phase 2 — Enhancement Features

| Fitur | Planning | Blueprint | Status |
|-------|----------|-----------|--------|
| Portfolio & Galeri | ✅ | ✅ via `client-photos` | ❌ Belum |
| Manajemen Inventaris Produk | ✅ | ✅ STEP 15 | ❌ Belum |
| Bridal party management | ✅ | ✅ schema ada | ❌ Belum |
| Sync Engine offline↔online | ✅ | ✅ STEP 17 | ⚠️ `sync-repository.ts` skeleton ada |
| Laporan & Analitik | ✅ | ✅ via `use-dashboard.ts` | ❌ Belum |

---

## 6. Gap Summary — Apa yang Belum Ada

### 🔴 Critical (Harus segera)

1. **Versi Dependencies salah** — `expo@48` & `expo-router@1` harus di-upgrade ke SDK 52 & Router v4 sesuai blueprint
2. **`src/lib/types/`** — Seluruh folder types (14 files) belum ada → tidak ada TypeScript interface & Zod schema
3. **`src/lib/utils/`** — Seluruh folder utils (4 files) belum ada → tidak ada currency/date formatter & WhatsApp helper
4. **`src/components/`** — Seluruh komponen UI (27+ komponen) belum ada → screens menggunakan inline styling atau tidak berfungsi penuh
5. **Drizzle migrations** — `npx drizzle-kit generate` belum dijalankan → `src/lib/db/migrations/` tidak ada

### 🟡 Important (Segera setelah critical)

6. **Screens yang missing**: `client/`, `service/`, `package/`, `invoice/`, `payment/`, `expense/`, `product/`, `settings.tsx`
7. **Supabase services yang missing**: `packages.ts`, `payments.ts`, `invoices.ts`, `expenses.ts`, `products.ts`, `client-photos.ts`, `storage.ts`
8. **Repositories yang missing**: package, payment, invoice, expense, product, client-photo
9. **Hooks yang missing**: use-packages, use-payments, use-invoices, use-expenses, use-products, use-dashboard
10. **`(auth)/forgot-password.tsx`** — screen reset password belum ada

### 🟢 Minor (Bisa dikerjakan belakangan)

11. **`app.json`** belum punya `newArchEnabled: true` dan `googleServicesFile`
12. **`nativewind-env.d.ts`** belum ada (type declaration untuk NativeWind)
13. **`stores/ui-store.ts`** belum ada
14. **`constants/colors.ts`** dan **`constants/app.ts`** belum ada
15. **Tab Finance & Profile** — masih placeholder kosong
16. **Push notification setup** (STEP 16) belum diimplementasikan
17. **Sync Engine penuh** (STEP 17) — sync-repository baru skeleton

---

## 7. Progress Scorecard

| Layer | Selesai | Total | % |
|-------|---------|-------|---|
| Root Config | 8 | 10 | 80% |
| App Routes / Screens | 11 | 24 | 46% |
| Types | 0 | 14 | 0% |
| Utils | 0 | 4 | 0% |
| DB (Drizzle) | 2 | 3 | 67% |
| Supabase Services | 5 | 12 | 42% |
| Repositories | 4 | 10 | 40% |
| TanStack Hooks | 4 | 10 | 40% |
| Zustand Stores | 2 | 3 | 67% |
| UI Components | 0 | 27+ | 0% |
| **Total Keseluruhan** | **~36** | **~117** | **~31%** |

---

## 8. Catatan Khusus: Transisi Flutter → Expo

Meskipun MUA_App_Planning.md ditulis dengan stack Flutter, semua **fitur bisnis** yang direncanakan tetap 100% relevan dan dapat diimplementasikan di Expo. Tidak ada fitur yang "hilang" dalam transisi ini. Yang berubah hanya teknologi implementasinya:

| Aspek | Flutter | Expo (Aktual) |
|-------|---------|---------------|
| Local DB | Drift | Drizzle + expo-sqlite ✅ |
| State | Riverpod/Bloc | Zustand + TanStack Query ✅ |
| Navigation | GoRouter | Expo Router ✅ |
| UI | Material 3 | NativeWind (TailwindCSS) ✅ |
| Push Notif | Firebase (langsung) | expo-notifications + FCM ✅ |
| Offline-first | Drift pattern | Repository pattern ✅ |

**Fitur bisnis dari MUA_App_Planning.md yang sudah di-cover di BLUEPRINT_EXPO.md:**
- ✅ Semua fitur MVP Phase 1 (A-E) — ada di STEP 9-16
- ✅ Semua fitur Phase 2 (F-J) — ada di STEP 11-17
- ✅ Model bisnis sekali bayar + license key
- ✅ Offline-first architecture
- ✅ WhatsApp integration
- ✅ Database schema yang setara

---

## 9. Rekomendasi Prioritas Pengerjaan

Berdasarkan analisis ini, urutan pengerjaan yang disarankan mengikuti STEP di blueprint:

```
[URGENT] Fix dependency versions (expo SDK, expo-router, nativewind)
    ↓
[STEP 2] Buat src/lib/constants/ (colors.ts, app.ts)
    ↓
[STEP 3] Buat src/lib/types/ (semua 14 type files)
    ↓
[STEP 2] Buat src/lib/utils/ (currency, date, whatsapp, validators)
    ↓
[STEP 4] Run drizzle-kit generate → buat migrations
    ↓
[STEP 5] Lengkapi supabase services (packages, payments, invoices, dll)
    ↓
[STEP 6] Lengkapi repositories
    ↓
[STEP 7] Lengkapi hooks + ui-store
    ↓
[STEP 9-15] Buat semua screens yang missing + components
    ↓
[STEP 16] Implementasi notifikasi + WhatsApp
    ↓
[STEP 17] Implementasi sync engine penuh
```
