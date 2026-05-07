# BLUEPRINT LENGKAP — Aplikasi MUA (Make Up Artist) — EXPO VERSION

## Panduan untuk AI Coder (Codex / Gemini Flash)

> **PENTING**: Dokumen ini adalah panduan step-by-step untuk membangun aplikasi MUA.
> Kerjakan **SESUAI URUTAN** yang tertulis. Jangan loncat-loncat.
> Setiap STEP punya instruksi detail: file apa yang dibuat, kode apa yang ditulis.
> **JANGAN** lanjut ke STEP berikutnya kalau STEP sebelumnya belum selesai & bebas error.

---

## DAFTAR ISI

1. [Overview & Stack](#1-overview--stack)
2. [Project Structure](#2-project-structure)
3. [STEP 1 — Project Setup](#step-1--project-setup)
4. [STEP 2 — Theme & Design System (NativeWind)](#step-2--theme--design-system)
5. [STEP 3 — TypeScript Types & Zod Schemas](#step-3--types--zod-schemas)
6. [STEP 4 — Drizzle Local Database (SQLite)](#step-4--drizzle-local-database)
7. [STEP 5 — Supabase Service Layer](#step-5--supabase-service-layer)
8. [STEP 6 — Repositories (Offline-First)](#step-6--repositories)
9. [STEP 7 — Zustand Stores & TanStack Query Hooks](#step-7--stores--hooks)
10. [STEP 8 — Navigation & Routing (Expo Router)](#step-8--navigation--routing)
11. [STEP 9 — Screens: Auth (Login/Register)](#step-9--auth-screens)
12. [STEP 10 — Screens: Dashboard](#step-10--dashboard-screen)
13. [STEP 11 — Screens: Kalender & Booking](#step-11--kalender--booking)
14. [STEP 12 — Screens: Manajemen Klien](#step-12--manajemen-klien)
15. [STEP 13 — Screens: Manajemen Layanan & Paket](#step-13--manajemen-layanan--paket)
16. [STEP 14 — Screens: Keuangan (Invoice, Payment, Expense)](#step-14--keuangan)
17. [STEP 15 — Screens: Inventaris Produk](#step-15--inventaris-produk)
18. [STEP 16 — Notifikasi (expo-notifications + WhatsApp)](#step-16--notifikasi)
19. [STEP 17 — Sync Engine (Offline ↔ Online)](#step-17--sync-engine)
20. [STEP 18 — Testing & Build](#step-18--testing--build)
21. [Lampiran: Database Schema SQL](#lampiran-database-schema)

---

## 1. Overview & Stack

| Komponen | Teknologi | Package | Fungsi |
|----------|-----------|---------|--------|
| Framework | Expo (React Native) | expo ~52 | Cross-platform mobile |
| Language | TypeScript | typescript ^5.3 | Type safety |
| Navigation | Expo Router | expo-router ~4 | File-based routing |
| Remote DB | Supabase | @supabase/supabase-js ^2.45 | PostgreSQL + Auth + Storage + Realtime |
| Local DB | SQLite + Drizzle | expo-sqlite + drizzle-orm | Offline-first storage |
| Server State | TanStack Query | @tanstack/react-query ^5 | Data fetching, caching, mutations |
| Client State | Zustand | zustand ^5 | Auth state, UI state, sync queue |
| UI Styling | NativeWind | nativewind ^4 | TailwindCSS for React Native |
| Forms | React Hook Form + Zod | react-hook-form + zod | Form management + validation |
| Push Notif | Expo Notifications | expo-notifications | Push notification (FCM di Android) |
| Image Picker | Expo Image Picker | expo-image-picker | Foto klien/portfolio |
| Date/Time | date-fns | date-fns ^4 | Format tanggal |
| Linking | Expo Linking | expo-linking | WhatsApp deep link |
| Network Info | NetInfo | @react-native-community/netinfo | Deteksi online/offline |
| KV Storage | MMKV | react-native-mmkv | Fast key-value storage |
| Calendar | React Native Calendars | react-native-calendars | Kalender widget |
| Charts | Victory Native | victory-native ^41 | Grafik dashboard |
| Icons | Expo Vector Icons | @expo/vector-icons | Icon set (built-in) |

**Semua GRATIS. Tidak ada biaya infrastruktur.**

---

## 2. Project Structure

```
mua-app/
├── app.json                           # Expo config
├── babel.config.js                    # Babel + NativeWind preset
├── tailwind.config.js                 # TailwindCSS config
├── global.css                         # Tailwind directives
├── metro.config.js                    # Metro bundler config
├── drizzle.config.ts                  # Drizzle Kit config
├── tsconfig.json                      # TypeScript config
├── .env                               # SUPABASE_URL + SUPABASE_ANON_KEY
│
├── assets/                            # Static assets
│   ├── images/
│   │   └── logo.png
│   └── fonts/
│
├── src/
│   ├── app/                           # ← EXPO ROUTER (file-based routing)
│   │   ├── _layout.tsx                # Root layout (providers, fonts, splash)
│   │   ├── index.tsx                  # Entry redirect (→ auth atau tabs)
│   │   │
│   │   ├── (auth)/                    # Auth group
│   │   │   ├── _layout.tsx            # Auth stack layout
│   │   │   ├── login.tsx              # Login screen
│   │   │   ├── register.tsx           # Register screen
│   │   │   └── forgot-password.tsx    # Forgot password screen
│   │   │
│   │   ├── (tabs)/                    # Main app (tab navigator)
│   │   │   ├── _layout.tsx            # Tab layout (5 tabs)
│   │   │   ├── index.tsx              # Tab 1: Dashboard
│   │   │   ├── calendar.tsx           # Tab 2: Kalender
│   │   │   ├── clients.tsx            # Tab 3: Klien list
│   │   │   ├── finance.tsx            # Tab 4: Keuangan overview
│   │   │   └── profile.tsx            # Tab 5: Profil
│   │   │
│   │   ├── booking/                   # Booking routes (stack)
│   │   │   ├── _layout.tsx            # Stack layout
│   │   │   ├── [id].tsx               # Booking detail
│   │   │   └── new.tsx                # Booking form (create)
│   │   │
│   │   ├── client/                    # Client routes (stack)
│   │   │   ├── _layout.tsx
│   │   │   ├── [id].tsx               # Client detail
│   │   │   └── new.tsx                # Client form (create)
│   │   │
│   │   ├── service/                   # Service routes
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx              # Service list
│   │   │   └── new.tsx                # Service form
│   │   │
│   │   ├── package/                   # Package routes
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx              # Package list
│   │   │   └── new.tsx                # Package form
│   │   │
│   │   ├── invoice/                   # Invoice routes
│   │   │   ├── _layout.tsx
│   │   │   └── [id].tsx               # Invoice detail
│   │   │
│   │   ├── payment/                   # Payment routes
│   │   │   ├── _layout.tsx
│   │   │   └── new.tsx                # Payment form
│   │   │
│   │   ├── expense/                   # Expense routes
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx              # Expense list
│   │   │   └── new.tsx                # Expense form
│   │   │
│   │   ├── product/                   # Product routes
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx              # Product list
│   │   │   └── new.tsx                # Product form
│   │   │
│   │   └── settings.tsx               # Settings screen
│   │
│   ├── lib/                           # ← BUSINESS LOGIC
│   │   ├── constants/
│   │   │   ├── colors.ts              # Warna tema (rose gold)
│   │   │   ├── app.ts                 # App constants
│   │   │   └── supabase.ts            # Table names, bucket names, RPC
│   │   │
│   │   ├── types/                     # TypeScript interfaces + Zod schemas
│   │   │   ├── booking.ts
│   │   │   ├── client.ts
│   │   │   ├── service.ts
│   │   │   ├── package.ts
│   │   │   ├── payment.ts
│   │   │   ├── invoice.ts
│   │   │   ├── expense.ts
│   │   │   ├── product.ts
│   │   │   ├── profile.ts
│   │   │   ├── reminder.ts
│   │   │   ├── booking-log.ts
│   │   │   ├── client-photo.ts
│   │   │   └── bridal-party.ts
│   │   │
│   │   ├── db/                        # Drizzle ORM (SQLite lokal)
│   │   │   ├── client.ts              # Database connection (expo-sqlite + drizzle)
│   │   │   ├── schema.ts              # SEMUA table definitions Drizzle
│   │   │   └── migrations/
│   │   │       ├── 0000_init.sql      # Generated by drizzle-kit
│   │   │       └── meta/
│   │   │
│   │   ├── supabase/                  # Supabase remote data sources
│   │   │   ├── client.ts              # Supabase client initialization
│   │   │   ├── auth.ts                # Auth functions (signIn, signUp, signOut, resetPassword)
│   │   │   ├── bookings.ts            # Bookings CRUD + RPC
│   │   │   ├── clients.ts             # Clients CRUD
│   │   │   ├── services.ts            # Services CRUD
│   │   │   ├── packages.ts            # Packages + PackageItems CRUD
│   │   │   ├── payments.ts            # Payments CRUD
│   │   │   ├── invoices.ts            # Invoices CRUD
│   │   │   ├── expenses.ts            # Expenses CRUD
│   │   │   ├── products.ts            # Products CRUD
│   │   │   ├── client-photos.ts       # Client photos CRUD
│   │   │   └── storage.ts             # File upload/download
│   │   │
│   │   ├── repositories/              # Offline-first repositories
│   │   │   ├── booking-repository.ts
│   │   │   ├── client-repository.ts
│   │   │   ├── service-repository.ts
│   │   │   ├── package-repository.ts
│   │   │   ├── payment-repository.ts
│   │   │   ├── invoice-repository.ts
│   │   │   ├── expense-repository.ts
│   │   │   ├── product-repository.ts
│   │   │   ├── client-photo-repository.ts
│   │   │   └── sync-repository.ts
│   │   │
│   │   ├── hooks/                     # TanStack Query hooks (server state)
│   │   │   ├── use-auth.ts
│   │   │   ├── use-bookings.ts
│   │   │   ├── use-clients.ts
│   │   │   ├── use-services.ts
│   │   │   ├── use-packages.ts
│   │   │   ├── use-payments.ts
│   │   │   ├── use-invoices.ts
│   │   │   ├── use-expenses.ts
│   │   │   ├── use-products.ts
│   │   │   └── use-dashboard.ts
│   │   │
│   │   ├── stores/                    # Zustand stores (client state)
│   │   │   ├── auth-store.ts          # Auth session + user profile
│   │   │   ├── sync-store.ts          # Sync status + queue
│   │   │   └── ui-store.ts            # UI preferences (theme, filters)
│   │   │
│   │   └── utils/                     # Helper functions
│   │       ├── currency.ts            # Format Rp xxx.xxx
│   │       ├── date.ts                # Format tanggal Indonesia
│   │       ├── whatsapp.ts            # WhatsApp URL scheme + templates
│   │       └── validators.ts          # Zod schemas for form validation
│   │
│   └── components/                    # ← REUSABLE UI COMPONENTS
│       ├── ui/                        # Generic UI components
│       │   ├── Button.tsx
│       │   ├── Input.tsx
│       │   ├── Badge.tsx
│       │   ├── Card.tsx
│       │   ├── EmptyState.tsx
│       │   ├── LoadingSpinner.tsx
│       │   ├── ErrorDisplay.tsx
│       │   ├── ConfirmDialog.tsx
│       │   └── PhotoPicker.tsx
│       │
│       ├── booking/                   # Booking-specific components
│       │   ├── BookingCard.tsx
│       │   ├── BookingStatusStepper.tsx
│       │   ├── ClientSelector.tsx
│       │   ├── ServiceSelector.tsx
│       │   ├── ConflictWarning.tsx
│       │   └── BridalPartyForm.tsx
│       │
│       ├── client/                    # Client-specific components
│       │   ├── ClientCard.tsx
│       │   ├── ClientBookingHistory.tsx
│       │   ├── ClientPhotoGallery.tsx
│       │   └── SkinTypeSelector.tsx
│       │
│       ├── dashboard/                 # Dashboard components
│       │   ├── TodayBookingsCard.tsx
│       │   ├── RevenueSummaryCard.tsx
│       │   ├── QuickStatsCard.tsx
│       │   └── UpcomingReminderCard.tsx
│       │
│       ├── finance/                   # Finance components
│       │   ├── RevenueChart.tsx
│       │   ├── InvoiceCard.tsx
│       │   ├── ExpenseCard.tsx
│       │   └── PaymentHistoryList.tsx
│       │
│       ├── service/                   # Service components
│       │   ├── ServiceCard.tsx
│       │   └── CategoryChip.tsx
│       │
│       └── product/                   # Product components
│           ├── ProductCard.tsx
│           └── StockIndicator.tsx
```

---

## STEP 1 — Project Setup

### 1.1 Buat Project Expo

```bash
npx create-expo-app@latest mua-app --template blank-typescript
cd mua-app
```

### 1.2 Install Dependencies (COPY-PASTE SEMUA, JANGAN SKIP)

**Group 1: Core Expo**
```bash
npx expo install expo-router expo-linking expo-constants expo-status-bar expo-splash-screen expo-system-ui
npx expo install react-native-screens react-native-safe-area-context
```

**Group 2: Supabase**
```bash
npm install @supabase/supabase-js react-native-url-polyfill
npx expo install expo-secure-store
```

**Group 3: Local Database (Drizzle + SQLite)**
```bash
npx expo install expo-sqlite
npm install drizzle-orm
npm install -D drizzle-kit
```

**Group 4: State Management**
```bash
npm install @tanstack/react-query zustand
npm install react-native-mmkv
```

**Group 5: UI (NativeWind / TailwindCSS)**
```bash
npx expo install nativewind react-native-reanimated react-native-safe-area-context
npm install tailwindcss@^3.4.17 --save-dev
```

**Group 6: Forms + Validation**
```bash
npm install react-hook-form @hookform/resolvers zod
```

**Group 7: UI Components**
```bash
npx expo install react-native-calendars react-native-gesture-handler
npm install victory-native
npx expo install expo-image-picker expo-file-system
```

**Group 8: Utilities**
```bash
npm install date-fns uuid
npm install -D @types/uuid
npx expo install @react-native-community/netinfo
npx expo install expo-notifications expo-print expo-sharing
```

**Group 9: Environment Variables**
```bash
npm install react-native-dotenv --save-dev
```

### 1.3 Buat Folder Structure

```bash
mkdir -p src/app/\(auth\) src/app/\(tabs\)
mkdir -p src/app/booking src/app/client src/app/service src/app/package
mkdir -p src/app/invoice src/app/payment src/app/expense src/app/product
mkdir -p src/lib/constants src/lib/types src/lib/db/migrations
mkdir -p src/lib/supabase src/lib/repositories src/lib/hooks src/lib/stores src/lib/utils
mkdir -p src/components/ui src/components/booking src/components/client
mkdir -p src/components/dashboard src/components/finance src/components/service src/components/product
mkdir -p assets/images assets/fonts
```

### 1.4 Konfigurasi `app.json`

Hapus isi default, ganti dengan:

```json
{
  "expo": {
    "name": "MUA App",
    "slug": "mua-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/logo.png",
    "scheme": "mua-app",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/images/logo.png",
      "resizeMode": "contain",
      "backgroundColor": "#FAF7F5"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.muaapp.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/logo.png",
        "backgroundColor": "#FAF7F5"
      },
      "package": "com.muaapp.app",
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      [
        "expo-notifications",
        {
          "icon": "./assets/images/logo.png",
          "color": "#B76E79"
        }
      ],
      "expo-image-picker"
    ]
  }
}
```

### 1.5 Konfigurasi `tsconfig.json`

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

### 1.6 Konfigurasi `babel.config.js`

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      ["module:react-native-dotenv", {
        envName: "APP_ENV",
        moduleName: "@env",
        path: ".env",
      }],
      "react-native-reanimated/plugin",
    ],
  };
};
```

### 1.7 Konfigurasi `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary - Rose Gold (khas beauty industry)
        primary: {
          DEFAULT: "#B76E79",
          light: "#E8C4C8",
          dark: "#8B4A52",
        },
        // Secondary - Soft Gold
        secondary: {
          DEFAULT: "#D4A574",
          light: "#F0DCC8",
        },
        // App-specific
        background: "#FAF7F5",
        surface: "#FFFFFF",
        "text-primary": "#2D2D2D",
        "text-secondary": "#757575",
        "text-hint": "#BDBDBD",
        divider: "#EEEEEE",
        // Status
        success: "#4CAF50",
        warning: "#FF9800",
        error: "#F44336",
        info: "#2196F3",
        // Booking status colors
        "status-pending": "#FF9800",
        "status-confirmed": "#2196F3",
        "status-in-progress": "#9C27B0",
        "status-completed": "#4CAF50",
        "status-cancelled": "#F44336",
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
```

### 1.8 Buat `global.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 1.9 Konfigurasi `metro.config.js`

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Support SQL files for Drizzle migrations
config.resolver.sourceExts.push("sql");

module.exports = withNativeWind(config, { input: "./global.css" });
```

### 1.10 Konfigurasi `drizzle.config.ts`

```ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/migrations",
  dialect: "sqlite",
  driver: "expo",
} satisfies Config;
```

### 1.11 Buat `.env`

```
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### 1.12 Buat `src/lib/supabase/client.ts`

```ts
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import "react-native-url-polyfill/auto";

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? "";

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### 1.13 Buat NativeWind Env Declaration

File: `nativewind-env.d.ts` (di root project)

```ts
/// <reference types="nativewind/types" />
```

### 1.14 Buat Env Type Declaration

File: `env.d.ts` (di root project)

```ts
declare module "@env" {
  export const SUPABASE_URL: string;
  export const SUPABASE_ANON_KEY: string;
}
```

### 1.15 Verifikasi Setup

```bash
npx expo start
```

Pastikan app bisa jalan tanpa error sebelum lanjut.

> **⛔ CHECKPOINT: Jangan lanjut ke STEP 2 kalau `npx expo start` masih error.**

---

## STEP 2 — Theme & Design System

### 2.1 Warna Aplikasi (sudah ada di tailwind.config.js)

File: `src/lib/constants/colors.ts`

```ts
export const Colors = {
  // Primary - Rose Gold (khas beauty industry)
  primary: "#B76E79",
  primaryLight: "#E8C4C8",
  primaryDark: "#8B4A52",

  // Secondary - Soft Gold
  secondary: "#D4A574",
  secondaryLight: "#F0DCC8",

  // Neutral
  background: "#FAF7F5",
  surface: "#FFFFFF",
  textPrimary: "#2D2D2D",
  textSecondary: "#757575",
  textHint: "#BDBDBD",
  divider: "#EEEEEE",

  // Status Colors
  success: "#4CAF50",
  warning: "#FF9800",
  error: "#F44336",
  info: "#2196F3",

  // Booking Status
  statusPending: "#FF9800",
  statusConfirmed: "#2196F3",
  statusInProgress: "#9C27B0",
  statusCompleted: "#4CAF50",
  statusCancelled: "#F44336",

  // Payment Status
  paymentUnpaid: "#F44336",
  paymentPartial: "#FF9800",
  paymentPaid: "#4CAF50",
} as const;
```

### 2.2 App Constants

File: `src/lib/constants/app.ts`

```ts
export const AppConstants = {
  appName: "MUA App",
  currency: "Rp",
  locale: "id-ID",

  // Pagination
  pageSize: 20,

  // Booking defaults
  defaultTravelTimeMinutes: 30,
  minBookingDurationMinutes: 60,
  maxBookingDaysAhead: 365,

  // Reminder
  reminderHoursBeforeBooking: [24, 3],

  // Image
  maxImageSizeMb: 5,
  imageQuality: 80,

  // Sync
  syncIntervalMinutes: 5,
  maxRetryAttempts: 3,
} as const;
```

### 2.3 Supabase Constants

File: `src/lib/constants/supabase.ts`

```ts
export const Tables = {
  profiles: "profiles",
  clients: "clients",
  services: "services",
  packages: "packages",
  packageItems: "package_items",
  bookings: "bookings",
  bridalParty: "bridal_party",
  payments: "payments",
  invoices: "invoices",
  expenses: "expenses",
  products: "products",
  clientPhotos: "client_photos",
  reminders: "reminders",
  bookingLogs: "booking_logs",
} as const;

export const Buckets = {
  profilePhotos: "profile-photos",
  clientPhotos: "client-photos",
  paymentProofs: "payment-proofs",
  invoices: "invoices",
  receipts: "receipts",
} as const;

export const RpcFunctions = {
  checkBookingConflict: "check_booking_conflict",
  monthlyRevenue: "get_monthly_revenue",
  generateInvoiceNumber: "generate_invoice_number",
} as const;

export const Views = {
  bookingsDetail: "v_bookings_detail",
  todayBookings: "v_today_bookings",
  upcomingBookings: "v_upcoming_bookings",
  invoicesDetail: "v_invoices_detail",
  clientsSummary: "v_clients_summary",
  lowStockProducts: "v_low_stock_products",
  monthlyFinancialSummary: "v_monthly_financial_summary",
  popularServices: "v_popular_services",
} as const;
```

### 2.4 Utility: Currency Formatter

File: `src/lib/utils/currency.ts`

```ts
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  }
  if (amount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  }
  return formatCurrency(amount);
}
```

### 2.5 Utility: Date Formatter

File: `src/lib/utils/date.ts`

```ts
import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from "date-fns";
import { id } from "date-fns/locale";

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd MMMM yyyy", { locale: id });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd MMM yyyy", { locale: id });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "HH:mm");
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd MMM yyyy, HH:mm", { locale: id });
}

export function formatRelative(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isToday(d)) return "Hari ini";
  if (isTomorrow(d)) return "Besok";
  if (isYesterday(d)) return "Kemarin";
  return formatDistanceToNow(d, { locale: id, addSuffix: true });
}

export function formatMonthYear(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMMM yyyy", { locale: id });
}
```

### 2.6 Utility: WhatsApp Helper

File: `src/lib/utils/whatsapp.ts`

```ts
import * as Linking from "expo-linking";

function cleanPhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\+]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.substring(1);
  }
  return cleaned;
}

export async function sendWhatsApp(phone: string, message: string): Promise<void> {
  const formatted = cleanPhone(phone);
  const url = `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  }
}

export function bookingReminderMessage(params: {
  clientName: string;
  serviceName: string;
  date: string;
  time: string;
  location: string;
}): string {
  return `Halo ${params.clientName}! 👋

Ini reminder untuk jadwal makeup Anda:

📅 Tanggal: ${params.date}
⏰ Waktu: ${params.time}
💄 Layanan: ${params.serviceName}
📍 Lokasi: ${params.location}

Mohon konfirmasi kehadiran Anda. Terima kasih! 🙏`;
}

export function invoiceMessage(params: {
  clientName: string;
  invoiceNumber: string;
  totalAmount: string;
  paidAmount: string;
  remainingAmount: string;
}): string {
  return `Halo ${params.clientName}! 👋

Berikut detail tagihan Anda:

📄 Invoice: ${params.invoiceNumber}
💰 Total: ${params.totalAmount}
✅ Terbayar: ${params.paidAmount}
💳 Sisa: ${params.remainingAmount}

Silakan lakukan pembayaran ke:
🏦 BCA: 1234567890 a.n. [Nama MUA]

Kirim bukti transfer ke chat ini. Terima kasih! 🙏`;
}
```

### 2.7 Utility: Zod Validators

File: `src/lib/utils/validators.ts`

```ts
import { z } from "zod";

export const emailSchema = z
  .string({ required_error: "Email wajib diisi" })
  .email("Format email tidak valid");

export const passwordSchema = z
  .string({ required_error: "Password wajib diisi" })
  .min(6, "Password minimal 6 karakter");

export const phoneSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val || val.trim() === "") return true;
      return /^(\+62|62|0)[0-9]{8,13}$/.test(val.replace(/[\s\-]/g, ""));
    },
    { message: "Format nomor telepon tidak valid" }
  );

export const requiredString = (fieldName: string) =>
  z.string({ required_error: `${fieldName} wajib diisi` }).min(1, `${fieldName} wajib diisi`);

export const priceSchema = z
  .number({ required_error: "Harga wajib diisi" })
  .positive("Harga harus lebih dari 0");

export const stockSchema = z
  .number({ required_error: "Stok wajib diisi" })
  .int("Stok harus bilangan bulat")
  .min(0, "Stok tidak boleh negatif");
```

> **⛔ CHECKPOINT: Pastikan semua file di atas sudah dibuat. Run `npx tsc --noEmit` untuk cek TypeScript errors.**

---

## STEP 3 — TypeScript Types & Zod Schemas

### 3.1 Enum Types

Buat di masing-masing file type, tapi berikut enum-enum yang dipakai:

```ts
// Shared enums — letakkan di src/lib/types/enums.ts

export type SkinType = "normal" | "dry" | "oily" | "combination" | "sensitive";

export type ServiceCategory =
  | "bridal"
  | "party"
  | "photoshoot"
  | "daily"
  | "lesson"
  | "special_fx"
  | "other";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export type PaymentType = "dp" | "full" | "installment" | "final";

export type PaymentMethod =
  | "cash"
  | "transfer"
  | "ewallet"
  | "credit_card"
  | "other";

export type InvoiceStatus = "draft" | "sent" | "partial" | "paid" | "overdue" | "cancelled";

export type ExpenseCategory =
  | "product"
  | "tool"
  | "transport"
  | "marketing"
  | "training"
  | "rent"
  | "other";

export type ProductCategory = "face" | "eye" | "lip" | "skin" | "hair" | "tool" | "other";

export type ReminderType = "booking" | "payment" | "follow_up" | "restock" | "other";

export type BookingLogAction =
  | "created"
  | "confirmed"
  | "started"
  | "completed"
  | "cancelled"
  | "rescheduled"
  | "payment_added";
```

### 3.2 Contoh Type: BookingModel

File: `src/lib/types/booking.ts`

```ts
import { z } from "zod";
import type { BookingStatus } from "./enums";

// ============================================================
// INTERFACE — dipakai untuk TypeScript type checking
// ============================================================
export interface Booking {
  id: string;
  userId: string;
  clientId: string;
  serviceId: string | null;
  packageId: string | null;
  bookingDate: string;         // ISO date string "2025-06-15"
  startTime: string;            // "09:00"
  endTime: string;              // "12:00"
  locationName: string | null;
  locationAddress: string | null;
  locationLat: number | null;
  locationLng: number | null;
  travelTimeMinutes: number;
  numPersons: number;
  status: BookingStatus;
  notes: string | null;
  totalPrice: number;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// ZOD SCHEMA — dipakai untuk validasi form
// ============================================================
export const bookingFormSchema = z.object({
  clientId: z.string().min(1, "Pilih klien"),
  serviceId: z.string().nullable(),
  packageId: z.string().nullable(),
  bookingDate: z.string().min(1, "Tanggal wajib diisi"),
  startTime: z.string().min(1, "Waktu mulai wajib diisi"),
  endTime: z.string().min(1, "Waktu selesai wajib diisi"),
  locationName: z.string().nullable(),
  locationAddress: z.string().nullable(),
  travelTimeMinutes: z.number().min(0).default(0),
  numPersons: z.number().min(1).default(1),
  notes: z.string().nullable(),
  totalPrice: z.number().min(0, "Harga tidak boleh negatif"),
}).refine(
  (data) => data.serviceId || data.packageId,
  { message: "Pilih layanan atau paket", path: ["serviceId"] }
);

export type BookingFormData = z.infer<typeof bookingFormSchema>;
```

### 3.3 Buat Type untuk SEMUA tabel

Ikuti pola BookingModel di atas. Buat file untuk setiap tabel:

| File | Interface | Fields (sesuai database schema 001_create_tables.sql) |
|------|-----------|-------------------------------------------------------|
| `src/lib/types/enums.ts` | (semua enum types) | Lihat 3.1 |
| `src/lib/types/profile.ts` | `Profile` | id, email, fullName, phone, businessName, bio, profilePhotoUrl, city, instagramHandle, whatsappNumber, fcmToken, createdAt, updatedAt |
| `src/lib/types/client.ts` | `Client` | id, userId, name, phone, email, address, city, skinType, allergies, preferences, notes, tags, isActive, totalBookings, lastBookingDate, createdAt, updatedAt |
| `src/lib/types/service.ts` | `Service` | id, userId, name, category, description, durationMinutes, basePrice, additionalPersonPrice, isActive, sortOrder, createdAt, updatedAt |
| `src/lib/types/package.ts` | `Package` + `PackageItem` | id, userId, name, description, totalPrice, discountPercent, isActive, createdAt, updatedAt. PackageItem: id, packageId, serviceId, quantity, priceOverride |
| `src/lib/types/booking.ts` | `Booking` | (sudah dibuat di 3.2) |
| `src/lib/types/bridal-party.ts` | `BridalParty` | id, bookingId, name, role, serviceId, notes, price |
| `src/lib/types/payment.ts` | `Payment` | id, userId, bookingId, invoiceId, amount, paymentType, paymentMethod, paymentDate, referenceNumber, proofImageUrl, notes, createdAt |
| `src/lib/types/invoice.ts` | `Invoice` | id, userId, bookingId, invoiceNumber, subtotal, discount, tax, totalAmount, paidAmount, status, dueDate, notes, createdAt, updatedAt |
| `src/lib/types/expense.ts` | `Expense` | id, userId, category, description, amount, expenseDate, receiptImageUrl, notes, createdAt |
| `src/lib/types/product.ts` | `Product` | id, userId, name, brand, category, currentStock, minimumStock, purchasePrice, expiryDate, notes, isActive, createdAt, updatedAt |
| `src/lib/types/client-photo.ts` | `ClientPhoto` | id, clientId, bookingId, photoUrl, caption, photoType, createdAt |
| `src/lib/types/reminder.ts` | `Reminder` | id, userId, bookingId, reminderType, title, message, reminderDate, isSent, createdAt |
| `src/lib/types/booking-log.ts` | `BookingLog` | id, bookingId, action, description, previousStatus, newStatus, createdAt, createdBy |

**Setiap file WAJIB punya:**
1. TypeScript `interface` (untuk type checking)
2. Zod `schema` untuk form validation (jika tabel itu punya form input)

> **⛔ CHECKPOINT: Run `npx tsc --noEmit` — pastikan ZERO errors sebelum lanjut.**

---

## STEP 4 — Drizzle Local Database (SQLite)

### 4.1 Database Schema (Drizzle)

File: `src/lib/db/schema.ts`

```ts
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ============================================================
// PROFILES
// ============================================================
export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  phone: text("phone"),
  businessName: text("business_name"),
  bio: text("bio"),
  profilePhotoUrl: text("profile_photo_url"),
  city: text("city"),
  instagramHandle: text("instagram_handle"),
  whatsappNumber: text("whatsapp_number"),
  fcmToken: text("fcm_token"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  // Sync fields
  isSynced: integer("is_synced", { mode: "boolean" }).notNull().default(true),
  localUpdatedAt: text("local_updated_at"),
});

// ============================================================
// CLIENTS
// ============================================================
export const clients = sqliteTable("clients", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  city: text("city"),
  skinType: text("skin_type"),  // enum as text
  allergies: text("allergies"),
  preferences: text("preferences"),
  notes: text("notes"),
  tags: text("tags"),           // JSON array as text
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  totalBookings: integer("total_bookings").notNull().default(0),
  lastBookingDate: text("last_booking_date"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  isSynced: integer("is_synced", { mode: "boolean" }).notNull().default(true),
  localUpdatedAt: text("local_updated_at"),
});

// ============================================================
// SERVICES
// ============================================================
export const services = sqliteTable("services", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  basePrice: real("base_price").notNull().default(0),
  additionalPersonPrice: real("additional_person_price").default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  isSynced: integer("is_synced", { mode: "boolean" }).notNull().default(true),
  localUpdatedAt: text("local_updated_at"),
});

// ============================================================
// PACKAGES
// ============================================================
export const packages = sqliteTable("packages", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  totalPrice: real("total_price").notNull().default(0),
  discountPercent: real("discount_percent").default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  isSynced: integer("is_synced", { mode: "boolean" }).notNull().default(true),
  localUpdatedAt: text("local_updated_at"),
});

// ============================================================
// PACKAGE ITEMS
// ============================================================
export const packageItems = sqliteTable("package_items", {
  id: text("id").primaryKey(),
  packageId: text("package_id").notNull(),
  serviceId: text("service_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  priceOverride: real("price_override"),
  isSynced: integer("is_synced", { mode: "boolean" }).notNull().default(true),
  localUpdatedAt: text("local_updated_at"),
});

// ============================================================
// BOOKINGS
// ============================================================
export const bookings = sqliteTable("bookings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  clientId: text("client_id").notNull(),
  serviceId: text("service_id"),
  packageId: text("package_id"),
  bookingDate: text("booking_date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  locationName: text("location_name"),
  locationAddress: text("location_address"),
  locationLat: real("location_lat"),
  locationLng: real("location_lng"),
  travelTimeMinutes: integer("travel_time_minutes").notNull().default(0),
  numPersons: integer("num_persons").notNull().default(1),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  totalPrice: real("total_price").notNull().default(0),
  cancellationReason: text("cancellation_reason"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  isSynced: integer("is_synced", { mode: "boolean" }).notNull().default(true),
  localUpdatedAt: text("local_updated_at"),
});

// ============================================================
// BRIDAL PARTY
// ============================================================
export const bridalParty = sqliteTable("bridal_party", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull(),
  name: text("name").notNull(),
  role: text("role"),
  serviceId: text("service_id"),
  notes: text("notes"),
  price: real("price").default(0),
  isSynced: integer("is_synced", { mode: "boolean" }).notNull().default(true),
  localUpdatedAt: text("local_updated_at"),
});

// ============================================================
// PAYMENTS
// ============================================================
export const payments = sqliteTable("payments", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  bookingId: text("booking_id").notNull(),
  invoiceId: text("invoice_id"),
  amount: real("amount").notNull(),
  paymentType: text("payment_type").notNull(),
  paymentMethod: text("payment_method").notNull().default("transfer"),
  paymentDate: text("payment_date").notNull(),
  referenceNumber: text("reference_number"),
  proofImageUrl: text("proof_image_url"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  isSynced: integer("is_synced", { mode: "boolean" }).notNull().default(true),
  localUpdatedAt: text("local_updated_at"),
});

// ============================================================
// INVOICES
// ============================================================
export const invoices = sqliteTable("invoices", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  bookingId: text("booking_id").notNull(),
  invoiceNumber: text("invoice_number").notNull(),
  subtotal: real("subtotal").notNull().default(0),
  discount: real("discount").default(0),
  tax: real("tax").default(0),
  totalAmount: real("total_amount").notNull().default(0),
  paidAmount: real("paid_amount").notNull().default(0),
  status: text("status").notNull().default("draft"),
  dueDate: text("due_date"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  isSynced: integer("is_synced", { mode: "boolean" }).notNull().default(true),
  localUpdatedAt: text("local_updated_at"),
});

// ============================================================
// EXPENSES
// ============================================================
export const expenses = sqliteTable("expenses", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  expenseDate: text("expense_date").notNull(),
  receiptImageUrl: text("receipt_image_url"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  isSynced: integer("is_synced", { mode: "boolean" }).notNull().default(true),
  localUpdatedAt: text("local_updated_at"),
});

// ============================================================
// PRODUCTS
// ============================================================
export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  brand: text("brand"),
  category: text("category").notNull(),
  currentStock: integer("current_stock").notNull().default(0),
  minimumStock: integer("minimum_stock").notNull().default(5),
  purchasePrice: real("purchase_price").default(0),
  expiryDate: text("expiry_date"),
  notes: text("notes"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  isSynced: integer("is_synced", { mode: "boolean" }).notNull().default(true),
  localUpdatedAt: text("local_updated_at"),
});

// ============================================================
// CLIENT PHOTOS
// ============================================================
export const clientPhotos = sqliteTable("client_photos", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  bookingId: text("booking_id"),
  photoUrl: text("photo_url").notNull(),
  caption: text("caption"),
  photoType: text("photo_type").default("after"),
  createdAt: text("created_at").notNull(),
  isSynced: integer("is_synced", { mode: "boolean" }).notNull().default(true),
  localUpdatedAt: text("local_updated_at"),
});

// ============================================================
// REMINDERS
// ============================================================
export const reminders = sqliteTable("reminders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  bookingId: text("booking_id"),
  reminderType: text("reminder_type").notNull(),
  title: text("title").notNull(),
  message: text("message"),
  reminderDate: text("reminder_date").notNull(),
  isSent: integer("is_sent", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
  isSynced: integer("is_synced", { mode: "boolean" }).notNull().default(true),
  localUpdatedAt: text("local_updated_at"),
});

// ============================================================
// BOOKING LOGS
// ============================================================
export const bookingLogs = sqliteTable("booking_logs", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull(),
  action: text("action").notNull(),
  description: text("description"),
  previousStatus: text("previous_status"),
  newStatus: text("new_status"),
  createdAt: text("created_at").notNull(),
  createdBy: text("created_by"),
  isSynced: integer("is_synced", { mode: "boolean" }).notNull().default(true),
  localUpdatedAt: text("local_updated_at"),
});
```

### 4.2 Database Client

File: `src/lib/db/client.ts`

```ts
import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

const expo = openDatabaseSync("mua_app.db", { enableChangeListener: true });
export const db = drizzle(expo, { schema });
```

### 4.3 Generate Drizzle Migration

```bash
npx drizzle-kit generate
```

Ini akan generate file SQL di `src/lib/db/migrations/`.

### 4.4 Apply Migration saat App Start

Tambahkan di root layout (`src/app/_layout.tsx`) — akan diimplementasi di STEP 8.

```ts
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { db } from "@/lib/db/client";
import migrations from "@/lib/db/migrations/drizzle";

// Di dalam component:
const { success, error } = useMigrations(db, migrations);
```

> **⛔ CHECKPOINT: Run `npx drizzle-kit generate` — pastikan migration berhasil di-generate.**

---

## STEP 5 — Supabase Service Layer

### 5.1 Auth Service

File: `src/lib/supabase/auth.ts`

```ts
import { supabase } from "./client";

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
```

### 5.2 Contoh Remote Source: Bookings

File: `src/lib/supabase/bookings.ts`

```ts
import { supabase } from "./client";
import { Tables, RpcFunctions } from "../constants/supabase";
import type { Booking } from "../types/booking";

export const bookingsService = {
  // ============================================================
  // READ
  // ============================================================
  async getAll(params?: {
    fromDate?: string;
    toDate?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Booking[]> {
    let query = supabase
      .from(Tables.bookings)
      .select("*")
      .order("booking_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (params?.fromDate) query = query.gte("booking_date", params.fromDate);
    if (params?.toDate) query = query.lte("booking_date", params.toDate);
    if (params?.status) query = query.eq("status", params.status);
    if (params?.limit) query = query.limit(params.limit);
    if (params?.offset) query = query.range(params.offset, params.offset + (params.limit ?? 20) - 1);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as Booking[];
  },

  async getById(id: string): Promise<Booking> {
    const { data, error } = await supabase
      .from(Tables.bookings)
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as unknown as Booking;
  },

  async getByDate(date: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from(Tables.bookings)
      .select("*")
      .eq("booking_date", date)
      .neq("status", "cancelled")
      .order("start_time", { ascending: true });

    if (error) throw error;
    return (data ?? []) as unknown as Booking[];
  },

  // ============================================================
  // WRITE
  // ============================================================
  async create(booking: Omit<Booking, "id" | "createdAt" | "updatedAt">): Promise<Booking> {
    const { data, error } = await supabase
      .from(Tables.bookings)
      .insert(booking)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Booking;
  },

  async update(id: string, updates: Partial<Booking>): Promise<Booking> {
    const { data, error } = await supabase
      .from(Tables.bookings)
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Booking;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(Tables.bookings)
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // ============================================================
  // RPC (Server-side functions)
  // ============================================================
  async checkConflict(params: {
    bookingDate: string;
    startTime: string;
    endTime: string;
    travelTimeMinutes?: number;
    excludeBookingId?: string;
  }) {
    const { data, error } = await supabase.rpc(RpcFunctions.checkBookingConflict, {
      p_booking_date: params.bookingDate,
      p_start_time: params.startTime,
      p_end_time: params.endTime,
      p_travel_time_minutes: params.travelTimeMinutes ?? 0,
      p_exclude_booking_id: params.excludeBookingId ?? null,
    });

    if (error) throw error;
    return data ?? [];
  },

  // ============================================================
  // REALTIME
  // ============================================================
  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel("bookings-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: Tables.bookings },
        callback
      )
      .subscribe();
  },
};
```

### 5.3 Buat Remote Source untuk SEMUA tabel

Ikuti pola `bookingsService`. Buat file di `src/lib/supabase/` untuk setiap tabel:

| File | Deskripsi |
|------|-----------|
| `clients.ts` | `clientsService` — CRUD clients, search by name/phone |
| `services.ts` | `servicesService` — CRUD services, filter by category, order by sortOrder |
| `packages.ts` | `packagesService` — CRUD packages + package_items (join) |
| `payments.ts` | `paymentsService` — CRUD payments, filter by bookingId/invoiceId |
| `invoices.ts` | `invoicesService` — CRUD invoices, generate invoice number via RPC |
| `expenses.ts` | `expensesService` — CRUD expenses, filter by category + date range |
| `products.ts` | `productsService` — CRUD products, filter low stock |
| `client-photos.ts` | `clientPhotosService` — CRUD photos, filter by clientId |
| `storage.ts` | `storageService` — upload/download/delete files from Supabase Storage |

**Setiap service WAJIB punya**: `getAll()`, `getById()`, `create()`, `update()`, `delete()`.

### 5.4 Storage Service

File: `src/lib/supabase/storage.ts`

```ts
import { supabase } from "./client";
import { Buckets } from "../constants/supabase";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";

export const storageService = {
  async uploadImage(
    bucket: keyof typeof Buckets,
    filePath: string,
    fileName: string
  ): Promise<string> {
    const base64 = await FileSystem.readAsStringAsync(filePath, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const { data, error } = await supabase.storage
      .from(Buckets[bucket])
      .upload(fileName, decode(base64), {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(Buckets[bucket])
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  },

  async deleteImage(bucket: keyof typeof Buckets, path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(Buckets[bucket])
      .remove([path]);

    if (error) throw error;
  },
};
```

> **⛔ CHECKPOINT: Run `npx tsc --noEmit` — pastikan ZERO errors.**

---

## STEP 6 — Repositories (Offline-First)

### 6.1 Pola Repository

Setiap repository mengikuti pola **offline-first**:

```
READ  → Baca dari SQLite lokal (CEPAT) → Background sync dari Supabase
WRITE → Simpan ke SQLite (isSynced=false) → Push ke Supabase → Update SQLite (isSynced=true)
```

### 6.2 Contoh: Booking Repository

File: `src/lib/repositories/booking-repository.ts`

```ts
import { eq, and, gte, lte, not, asc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import NetInfo from "@react-native-community/netinfo";
import { db } from "../db/client";
import { bookings } from "../db/schema";
import { bookingsService } from "../supabase/bookings";
import type { Booking } from "../types/booking";
import type { BookingFormData } from "../types/booking";

async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected === true;
}

export const bookingRepository = {
  // ============================================================
  // READ: Baca dari lokal, sync background
  // ============================================================
  async getByDate(date: string): Promise<Booking[]> {
    // 1. Baca dari SQLite (instant)
    const localData = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.bookingDate, date),
          not(eq(bookings.status, "cancelled"))
        )
      )
      .orderBy(asc(bookings.startTime));

    // 2. Background sync dari Supabase (tidak blocking)
    if (await isOnline()) {
      syncBookingsFromRemote(date).catch(() => {});
    }

    return localData as unknown as Booking[];
  },

  async getUpcoming(): Promise<Booking[]> {
    const today = new Date().toISOString().split("T")[0];
    const weekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const localData = await db
      .select()
      .from(bookings)
      .where(
        and(
          gte(bookings.bookingDate, today),
          lte(bookings.bookingDate, weekLater),
          not(eq(bookings.status, "cancelled"))
        )
      )
      .orderBy(asc(bookings.bookingDate), asc(bookings.startTime));

    return localData as unknown as Booking[];
  },

  // ============================================================
  // WRITE: Simpan lokal dulu, sync ke remote
  // ============================================================
  async create(userId: string, formData: BookingFormData): Promise<Booking> {
    const now = new Date().toISOString();
    const id = uuidv4();

    const newBooking: typeof bookings.$inferInsert = {
      id,
      userId,
      clientId: formData.clientId,
      serviceId: formData.serviceId,
      packageId: formData.packageId,
      bookingDate: formData.bookingDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      locationName: formData.locationName,
      locationAddress: formData.locationAddress,
      travelTimeMinutes: formData.travelTimeMinutes,
      numPersons: formData.numPersons,
      status: "pending",
      notes: formData.notes,
      totalPrice: formData.totalPrice,
      createdAt: now,
      updatedAt: now,
      isSynced: false,
      localUpdatedAt: now,
    };

    // 1. Simpan ke SQLite
    await db.insert(bookings).values(newBooking);

    // 2. Push ke Supabase (jika online)
    if (await isOnline()) {
      try {
        const remote = await bookingsService.create({
          ...newBooking,
          userId,
        } as any);
        // Update local: mark as synced
        await db
          .update(bookings)
          .set({ isSynced: true })
          .where(eq(bookings.id, id));
        return remote;
      } catch (e) {
        // Sync gagal, data tetap tersimpan di lokal
        console.warn("Sync create booking failed:", e);
      }
    }

    return newBooking as unknown as Booking;
  },

  async update(id: string, updates: Partial<Booking>): Promise<void> {
    const now = new Date().toISOString();

    // 1. Update di SQLite
    await db
      .update(bookings)
      .set({
        ...updates,
        updatedAt: now,
        isSynced: false,
        localUpdatedAt: now,
      } as any)
      .where(eq(bookings.id, id));

    // 2. Push ke Supabase
    if (await isOnline()) {
      try {
        await bookingsService.update(id, updates);
        await db
          .update(bookings)
          .set({ isSynced: true })
          .where(eq(bookings.id, id));
      } catch (e) {
        console.warn("Sync update booking failed:", e);
      }
    }
  },

  async delete(id: string): Promise<void> {
    // Soft delete di lokal (set status cancelled)
    await db
      .update(bookings)
      .set({
        status: "cancelled",
        updatedAt: new Date().toISOString(),
        isSynced: false,
        localUpdatedAt: new Date().toISOString(),
      })
      .where(eq(bookings.id, id));

    // Hard delete di remote
    if (await isOnline()) {
      try {
        await bookingsService.delete(id);
        await db
          .update(bookings)
          .set({ isSynced: true })
          .where(eq(bookings.id, id));
      } catch (e) {
        console.warn("Sync delete booking failed:", e);
      }
    }
  },

  // ============================================================
  // CONFLICT CHECK
  // ============================================================
  async checkConflict(params: {
    bookingDate: string;
    startTime: string;
    endTime: string;
    travelTimeMinutes?: number;
    excludeBookingId?: string;
  }) {
    if (await isOnline()) {
      return bookingsService.checkConflict(params);
    }
    // Fallback: check lokal (simplified)
    return [];
  },

  // ============================================================
  // SYNC HELPERS
  // ============================================================
  async getUnsyncedCount(): Promise<number> {
    const unsynced = await db
      .select()
      .from(bookings)
      .where(eq(bookings.isSynced, false));
    return unsynced.length;
  },
};

// Private: sync dari remote ke lokal
async function syncBookingsFromRemote(date: string) {
  try {
    const remoteBookings = await bookingsService.getByDate(date);
    for (const booking of remoteBookings) {
      await db
        .insert(bookings)
        .values({
          ...(booking as any),
          isSynced: true,
          localUpdatedAt: new Date().toISOString(),
        })
        .onConflictDoUpdate({
          target: bookings.id,
          set: {
            ...(booking as any),
            isSynced: true,
            localUpdatedAt: new Date().toISOString(),
          },
        });
    }
  } catch (e) {
    // Sync gagal — data lokal tetap dipakai
  }
}
```

### 6.3 Buat Repository untuk SEMUA tabel

Ikuti pola `bookingRepository`. Setiap repository punya:
- **READ**: `getAll()`, `getById()`, `search()` → baca dari SQLite, background sync
- **WRITE**: `create()`, `update()`, `delete()` → simpan SQLite dulu, push ke Supabase
- **SYNC**: `getUnsyncedCount()`, helper `syncFromRemote()`

| File | Repository |
|------|-----------|
| `client-repository.ts` | `clientRepository` — + `search(query)` by name/phone |
| `service-repository.ts` | `serviceRepository` — + filter by category |
| `package-repository.ts` | `packageRepository` — + include packageItems |
| `payment-repository.ts` | `paymentRepository` — + filter by bookingId |
| `invoice-repository.ts` | `invoiceRepository` — + generate invoice number |
| `expense-repository.ts` | `expenseRepository` — + filter by category + date range |
| `product-repository.ts` | `productRepository` — + filter low stock |
| `client-photo-repository.ts` | `clientPhotoRepository` — + filter by clientId |
| `sync-repository.ts` | `syncRepository` — orchestrate full sync (lihat STEP 17) |

> **⛔ CHECKPOINT: Run `npx tsc --noEmit` — pastikan ZERO errors.**

---

## STEP 7 — Zustand Stores & TanStack Query Hooks

### 7.1 Auth Store (Zustand)

File: `src/lib/stores/auth-store.ts`

```ts
import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import type { Profile } from "../types/profile";

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,

  setSession: (session) =>
    set({ session, user: session?.user ?? null, isLoading: false }),

  setProfile: (profile) => set({ profile }),

  setLoading: (isLoading) => set({ isLoading }),

  reset: () =>
    set({ session: null, user: null, profile: null, isLoading: false }),
}));
```

### 7.2 Sync Store (Zustand)

File: `src/lib/stores/sync-store.ts`

```ts
import { create } from "zustand";

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: string | null;
  unsyncedCount: number;
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setLastSync: (date: string) => void;
  setUnsyncedCount: (count: number) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isOnline: true,
  isSyncing: false,
  lastSyncAt: null,
  unsyncedCount: 0,

  setOnline: (isOnline) => set({ isOnline }),
  setSyncing: (isSyncing) => set({ isSyncing }),
  setLastSync: (lastSyncAt) => set({ lastSyncAt }),
  setUnsyncedCount: (unsyncedCount) => set({ unsyncedCount }),
}));
```

### 7.3 UI Store (Zustand)

File: `src/lib/stores/ui-store.ts`

```ts
import { create } from "zustand";

interface UIState {
  selectedDate: string; // ISO date "2025-06-15"
  calendarView: "month" | "week" | "day";
  financeFilter: "all" | "unpaid" | "partial" | "paid";
  setSelectedDate: (date: string) => void;
  setCalendarView: (view: "month" | "week" | "day") => void;
  setFinanceFilter: (filter: "all" | "unpaid" | "partial" | "paid") => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedDate: new Date().toISOString().split("T")[0],
  calendarView: "month",
  financeFilter: "all",

  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setCalendarView: (calendarView) => set({ calendarView }),
  setFinanceFilter: (financeFilter) => set({ financeFilter }),
}));
```

### 7.4 TanStack Query: Booking Hooks

File: `src/lib/hooks/use-bookings.ts`

```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingRepository } from "../repositories/booking-repository";
import { useAuthStore } from "../stores/auth-store";
import type { BookingFormData } from "../types/booking";

// Query keys
export const bookingKeys = {
  all: ["bookings"] as const,
  byDate: (date: string) => ["bookings", "date", date] as const,
  upcoming: () => ["bookings", "upcoming"] as const,
  detail: (id: string) => ["bookings", "detail", id] as const,
};

// ============================================================
// QUERIES (data fetching)
// ============================================================

export function useBookingsByDate(date: string) {
  return useQuery({
    queryKey: bookingKeys.byDate(date),
    queryFn: () => bookingRepository.getByDate(date),
  });
}

export function useUpcomingBookings() {
  return useQuery({
    queryKey: bookingKeys.upcoming(),
    queryFn: () => bookingRepository.getUpcoming(),
  });
}

// ============================================================
// MUTATIONS (data writing)
// ============================================================

export function useCreateBooking() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (formData: BookingFormData) =>
      bookingRepository.create(user!.id, formData),
    onSuccess: () => {
      // Invalidate semua booking queries agar data fresh
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      bookingRepository.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}

export function useDeleteBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => bookingRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}

// ============================================================
// CONFLICT CHECK
// ============================================================
export function useCheckConflict() {
  return useMutation({
    mutationFn: (params: {
      bookingDate: string;
      startTime: string;
      endTime: string;
      travelTimeMinutes?: number;
      excludeBookingId?: string;
    }) => bookingRepository.checkConflict(params),
  });
}
```

### 7.5 Buat Hooks untuk SEMUA tabel

Ikuti pola `use-bookings.ts`. Buat file di `src/lib/hooks/`:

| File | Hooks |
|------|-------|
| `use-auth.ts` | `useSignIn()`, `useSignUp()`, `useSignOut()`, `useResetPassword()` |
| `use-clients.ts` | `useClients()`, `useClientById(id)`, `useSearchClients(query)`, `useCreateClient()`, `useUpdateClient()`, `useDeleteClient()` |
| `use-services.ts` | `useServices()`, `useCreateService()`, `useUpdateService()`, `useDeleteService()` |
| `use-packages.ts` | `usePackages()`, `useCreatePackage()`, `useUpdatePackage()`, `useDeletePackage()` |
| `use-payments.ts` | `usePaymentsByBooking(bookingId)`, `useCreatePayment()` |
| `use-invoices.ts` | `useInvoices(status?)`, `useInvoiceById(id)`, `useCreateInvoice()`, `useUpdateInvoice()` |
| `use-expenses.ts` | `useExpenses(category?, dateRange?)`, `useCreateExpense()`, `useDeleteExpense()` |
| `use-products.ts` | `useProducts()`, `useLowStockProducts()`, `useCreateProduct()`, `useUpdateProduct()` |
| `use-dashboard.ts` | `useTodayBookings()`, `useMonthlyRevenue()`, `useQuickStats()` |

**Setiap file WAJIB punya**:
- `queryKeys` object (untuk cache invalidation)
- `useXxx()` hooks pakai `useQuery` (untuk READ)
- `useCreateXxx()`, `useUpdateXxx()`, `useDeleteXxx()` pakai `useMutation` (untuk WRITE)
- `onSuccess` di mutation: `queryClient.invalidateQueries()`

> **⛔ CHECKPOINT: Run `npx tsc --noEmit` — pastikan ZERO errors.**

---

## STEP 8 — Navigation & Routing (Expo Router)

### 8.1 Root Layout

File: `src/app/_layout.tsx`

```tsx
import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { db } from "@/lib/db/client";
import migrations from "@/lib/db/migrations/drizzle";
import { useAuthStore } from "@/lib/stores/auth-store";
import { supabase } from "@/lib/supabase/client";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 menit
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const { success: dbReady, error: dbError } = useMigrations(db, migrations);
  const setSession = useAuthStore((s) => s.setSession);
  const setLoading = useAuthStore((s) => s.setLoading);

  // Listen auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Hide splash when ready
  useEffect(() => {
    if (dbReady) {
      SplashScreen.hideAsync();
    }
  }, [dbReady]);

  if (!dbReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="booking"
            options={{ headerShown: false, presentation: "card" }}
          />
          <Stack.Screen
            name="client"
            options={{ headerShown: false, presentation: "card" }}
          />
          <Stack.Screen
            name="service"
            options={{ headerShown: false, presentation: "card" }}
          />
          <Stack.Screen
            name="package"
            options={{ headerShown: false, presentation: "card" }}
          />
          <Stack.Screen
            name="invoice"
            options={{ headerShown: false, presentation: "card" }}
          />
          <Stack.Screen
            name="payment"
            options={{ headerShown: false, presentation: "card" }}
          />
          <Stack.Screen
            name="expense"
            options={{ headerShown: false, presentation: "card" }}
          />
          <Stack.Screen
            name="product"
            options={{ headerShown: false, presentation: "card" }}
          />
          <Stack.Screen name="settings" options={{ headerShown: true, title: "Pengaturan" }} />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
```

### 8.2 Entry Redirect

File: `src/app/index.tsx`

```tsx
import { Redirect } from "expo-router";
import { useAuthStore } from "@/lib/stores/auth-store";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { session, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#B76E79" />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
```

### 8.3 Auth Layout

File: `src/app/(auth)/_layout.tsx`

```tsx
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
```

### 8.4 Tab Layout (5 Tabs)

File: `src/app/(tabs)/_layout.tsx`

```tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/lib/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textHint,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.divider,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        headerStyle: {
          backgroundColor: Colors.surface,
        },
        headerTintColor: Colors.textPrimary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerTitle: "MUA App",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Jadwal",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: "Klien",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: "Keuangan",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

### 8.5 Stack Layouts untuk Detail Routes

Setiap folder route (booking, client, service, dll) butuh `_layout.tsx`:

File: `src/app/booking/_layout.tsx` (contoh, buat untuk SEMUA folder)

```tsx
import { Stack } from "expo-router";
import { Colors } from "@/lib/constants/colors";

export default function BookingLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.textPrimary,
        headerBackTitle: "Kembali",
      }}
    >
      <Stack.Screen name="[id]" options={{ title: "Detail Booking" }} />
      <Stack.Screen name="new" options={{ title: "Booking Baru" }} />
    </Stack>
  );
}
```

**Buat `_layout.tsx` yang sama untuk folder**: `client/`, `service/`, `package/`, `invoice/`, `payment/`, `expense/`, `product/`.

> **⛔ CHECKPOINT: Run `npx expo start` — pastikan navigasi tabs muncul tanpa error.**

---

## STEP 9–15: Screens (Spesifikasi UI)

> Setiap screen menggunakan **NativeWind** untuk styling (className="...").
> Setiap screen menggunakan **TanStack Query hooks** untuk data.
> Setiap form menggunakan **React Hook Form + Zod** untuk validasi.

### STEP 9 — Auth Screens

| Screen | File | Widget Utama |
|--------|------|-------------|
| LoginScreen | `src/app/(auth)/login.tsx` | Logo, email input, password input, tombol "Masuk" (primary button), link "Daftar" dan "Lupa Password" |
| RegisterScreen | `src/app/(auth)/register.tsx` | Nama, email, password, confirm password, tombol "Daftar" |
| ForgotPasswordScreen | `src/app/(auth)/forgot-password.tsx` | Email input, tombol "Kirim Link Reset" |

**Logika Auth:**
```tsx
// Di login.tsx:
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authService } from "@/lib/supabase/auth";
import { router } from "expo-router";

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

// Setelah login sukses:
router.replace("/(tabs)");
```

### STEP 10 — Dashboard Screen

File: `src/app/(tabs)/index.tsx`

| Komponen | Hook Data | Tampilan |
|----------|-----------|---------|
| Header | `useAuthStore` | "Halo, [Nama]!" + badge jumlah booking hari ini |
| TodayBookingsCard | `useBookingsByDate(today)` | List booking hari ini (waktu, nama klien, layanan, status badge) |
| RevenueSummaryCard | `useDashboard` | Pendapatan bulan ini (Rp), pending payment |
| QuickStatsCard | `useDashboard` | Total klien, total booking bulan ini, completion rate |
| UpcomingReminderCard | `useUpcomingBookings()` | 3 booking terdekat |

**Layout:** `ScrollView` dengan `className="flex-1 bg-background p-4"`.

### STEP 11 — Kalender & Booking

| Screen | File | Komponen |
|--------|------|----------|
| CalendarScreen | `src/app/(tabs)/calendar.tsx` | `react-native-calendars` Calendar component. Dot marking pada tanggal yang ada booking. Tap tanggal → tampilkan list booking di bawah kalender. |
| BookingDetailScreen | `src/app/booking/[id].tsx` | Info lengkap: klien, layanan, waktu, lokasi (link Google Maps), status stepper, daftar pembayaran, tombol aksi (konfirmasi, mulai, selesai, batal). Tombol "Kirim Reminder WA". |
| BookingFormScreen | `src/app/booking/new.tsx` | Form (React Hook Form): pilih klien (searchable picker), pilih layanan/paket, date picker, time picker (start & end), input lokasi, travel time, jumlah orang, harga total (auto-calculate), catatan. **WAJIB** cek conflict sebelum simpan. |

**Conflict Check Flow**:
```
User isi tanggal & waktu → Panggil useCheckConflict().mutateAsync()
  → Jika ada conflict → Tampilkan warning merah: "Bentrok dengan [nama klien] jam [waktu]"
  → Jika tidak ada conflict → Tampilkan badge hijau: "Jadwal tersedia ✓"
```

### STEP 12 — Manajemen Klien

| Screen | File | Komponen |
|--------|------|----------|
| ClientListScreen | `src/app/(tabs)/clients.tsx` | Search bar (TextInput), FlatList klien (foto, nama, tags, nomor HP). Tap → `router.push(/client/[id])`. FAB → `router.push(/client/new)`. |
| ClientDetailScreen | `src/app/client/[id].tsx` | Header: foto, nama, tags. Tabs (segmented control): Info, Riwayat Booking, Galeri Foto. Tombol: Edit, WA, Hapus. |
| ClientFormScreen | `src/app/client/new.tsx` | Form (RHF + Zod): nama*, HP, email, alamat, kota, tipe kulit (picker/dropdown), alergi, preferensi, tags (chip input), foto. |

### STEP 13 — Manajemen Layanan & Paket

| Screen | File | Komponen |
|--------|------|----------|
| ServiceListScreen | `src/app/service/index.tsx` | Grid/List layanan per kategori. Setiap item: nama, kategori badge, durasi, harga. FAB → form baru. |
| ServiceFormScreen | `src/app/service/new.tsx` | Form: nama*, kategori (picker/enum), deskripsi, durasi (menit), harga dasar, harga tambahan per orang, aktif/nonaktif (switch). |
| PackageListScreen | `src/app/package/index.tsx` | List paket: nama, list layanan included, total harga. |
| PackageFormScreen | `src/app/package/new.tsx` | Form: nama*, deskripsi, pilih layanan (multi-select checklist + quantity), diskon %, total harga (auto-calculate). |

### STEP 14 — Keuangan

| Screen | File | Komponen |
|--------|------|----------|
| FinanceOverviewScreen | `src/app/(tabs)/finance.tsx` | Revenue chart bulanan (victory-native), ringkasan: total pendapatan, pengeluaran, laba bersih. Quick links: Invoice, Pengeluaran. |
| InvoiceDetailScreen | `src/app/invoice/[id].tsx` | Info lengkap + list pembayaran. Tombol: Tambah Pembayaran, Kirim Invoice WA, Download PDF. |
| PaymentFormScreen | `src/app/payment/new.tsx` | Form: jumlah, tipe (DP/Lunas/Cicilan), metode, tanggal, nomor referensi, upload bukti transfer (expo-image-picker). |
| ExpenseListScreen | `src/app/expense/index.tsx` | Filter by kategori + bulan. Setiap item: deskripsi, kategori badge, jumlah, tanggal. |
| ExpenseFormScreen | `src/app/expense/new.tsx` | Form: kategori (picker), deskripsi*, jumlah*, tanggal, upload struk foto, catatan. |

### STEP 15 — Inventaris Produk

| Screen | File | Komponen |
|--------|------|----------|
| ProductListScreen | `src/app/product/index.tsx` | Filter: Semua / Stok Rendah / Expired. Setiap item: nama, brand, stok (color-coded), harga beli. |
| ProductFormScreen | `src/app/product/new.tsx` | Form: nama*, brand, kategori (picker), stok, minimum stok alert, harga beli, tanggal expired, catatan. |

---

## STEP 16 — Notifikasi (expo-notifications + WhatsApp)

### 16.1 Push Notification Setup

File: `src/lib/utils/notifications.ts`

```ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "../supabase/client";
import { Tables } from "../constants/supabase";

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  // Request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  // Get Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  // Set Android notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return token;
}

export async function savePushToken(userId: string, token: string) {
  await supabase
    .from(Tables.profiles)
    .update({ fcm_token: token })
    .eq("id", userId);
}

export async function scheduleLocalNotification(params: {
  title: string;
  body: string;
  date: Date;
  data?: Record<string, string>;
}): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: params.title,
      body: params.body,
      data: params.data ?? {},
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: params.date,
    },
  });
  return id;
}
```

### 16.2 WhatsApp Integration

Gunakan `sendWhatsApp()` dari STEP 2.6 (`src/lib/utils/whatsapp.ts`).
Tidak perlu WhatsApp Business API — cukup gunakan URL scheme `wa.me`.

---

## STEP 17 — Sync Engine (Offline ↔ Online)

### 17.1 Sync Strategy

```
┌─────────────────────────────────────────────────┐
│ SYNC ENGINE                                      │
│                                                  │
│ 1. App Start:                                    │
│    → Cek koneksi via NetInfo                     │
│    → Jika online: Pull semua data dari Supabase  │
│    → Simpan ke Drizzle (SQLite) lokal            │
│                                                  │
│ 2. User Create/Update/Delete:                    │
│    → Simpan ke SQLite (isSynced = false)         │
│    → Jika online: Push ke Supabase               │
│    → Jika sukses: Update SQLite (isSynced = true)│
│                                                  │
│ 3. Connectivity Change (offline → online):       │
│    → Scan semua tabel SQLite WHERE isSynced=false│
│    → Push semua unsynced data ke Supabase        │
│    → Pull data terbaru dari Supabase             │
│                                                  │
│ 4. Realtime (Supabase Realtime channel):         │
│    → Subscribe ke perubahan booking              │
│    → Update SQLite lokal saat ada perubahan      │
│                                                  │
│ Conflict Resolution: Last-write-wins             │
│ (berdasarkan updated_at timestamp)               │
└─────────────────────────────────────────────────┘
```

### 17.2 Sync Repository

File: `src/lib/repositories/sync-repository.ts`

```ts
import NetInfo from "@react-native-community/netinfo";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import * as schema from "../db/schema";
import { bookingsService } from "../supabase/bookings";
import { clientsService } from "../supabase/clients";
// import semua services lainnya...
import { useSyncStore } from "../stores/sync-store";

export const syncRepository = {
  /**
   * Full sync: pull SEMUA data dari Supabase → simpan ke SQLite.
   * Panggil saat app pertama kali start atau user pull-to-refresh.
   */
  async fullSync(): Promise<void> {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return;

    useSyncStore.getState().setSyncing(true);

    try {
      // Sync berurutan: parent tables dulu, child tables belakangan
      // 1. Clients
      const remoteClients = await clientsService.getAll();
      for (const client of remoteClients) {
        await db
          .insert(schema.clients)
          .values({ ...(client as any), isSynced: true, localUpdatedAt: new Date().toISOString() })
          .onConflictDoUpdate({
            target: schema.clients.id,
            set: { ...(client as any), isSynced: true, localUpdatedAt: new Date().toISOString() },
          });
      }

      // 2. Services
      // 3. Packages + PackageItems
      // 4. Bookings
      // 5. Payments
      // 6. Invoices
      // 7. Expenses
      // 8. Products
      // 9. Reminders
      // (ikuti pola yang sama untuk setiap tabel)

      useSyncStore.getState().setLastSync(new Date().toISOString());
    } catch (e) {
      console.warn("Full sync failed:", e);
    } finally {
      useSyncStore.getState().setSyncing(false);
    }
  },

  /**
   * Push sync: kirim data lokal yang belum di-sync ke Supabase.
   * Panggil saat koneksi berubah dari offline → online.
   */
  async pushUnsyncedData(): Promise<void> {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return;

    useSyncStore.getState().setSyncing(true);

    try {
      // Push unsynced bookings
      const unsyncedBookings = await db
        .select()
        .from(schema.bookings)
        .where(eq(schema.bookings.isSynced, false));

      for (const booking of unsyncedBookings) {
        try {
          await bookingsService.update(booking.id, booking as any);
          await db
            .update(schema.bookings)
            .set({ isSynced: true })
            .where(eq(schema.bookings.id, booking.id));
        } catch (e) {
          console.warn(`Failed to sync booking ${booking.id}:`, e);
        }
      }

      // Push unsynced clients, services, dst...
      // (ikuti pola yang sama untuk setiap tabel)

    } finally {
      useSyncStore.getState().setSyncing(false);
    }
  },

  /**
   * Start connectivity listener.
   * Panggil SEKALI di root layout.
   */
  startConnectivityListener(): () => void {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const wasOffline = !useSyncStore.getState().isOnline;
      const isNowOnline = state.isConnected === true;

      useSyncStore.getState().setOnline(isNowOnline);

      // Kalau baru saja online → push unsynced data
      if (wasOffline && isNowOnline) {
        syncRepository.pushUnsyncedData();
      }
    });

    return unsubscribe;
  },
};
```

---

## STEP 18 — Testing & Build

### 18.1 Type Check

```bash
npx tsc --noEmit
```

### 18.2 Jalankan App (Development)

```bash
npx expo start
```

Scan QR code dengan Expo Go app, atau tekan `a` untuk Android emulator.

### 18.3 Build APK (Production)

**Opsi A: Expo EAS Build (recommended)**
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

**Opsi B: Local build (tanpa EAS)**
```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
# APK di: android/app/build/outputs/apk/release/app-release.apk
```

### 18.4 Environment Variables untuk Production

Buat `eas.json`:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "env": {
        "SUPABASE_URL": "https://YOUR_PROJECT.supabase.co",
        "SUPABASE_ANON_KEY": "YOUR_ANON_KEY"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "env": {
        "SUPABASE_URL": "https://YOUR_PROJECT.supabase.co",
        "SUPABASE_ANON_KEY": "YOUR_ANON_KEY"
      }
    }
  }
}
```

---

## URUTAN PENGERJAAN (WAJIB DIIKUTI)

```
PHASE 1: Foundation (STEP 1-4)
  1. npx create-expo-app + install SEMUA dependencies
  2. Konfigurasi: app.json, babel, tailwind, metro, drizzle, tsconfig
  3. Buat SEMUA file di lib/constants/ + lib/utils/
  4. Buat SEMUA file di lib/types/ (interfaces + Zod schemas)
  5. Buat lib/db/schema.ts (Drizzle schema) + lib/db/client.ts
  6. Run: npx drizzle-kit generate
  7. Run: npx tsc --noEmit → HARUS zero errors

PHASE 2: Backend Layer (STEP 5-7)
  8. Buat lib/supabase/client.ts
  9. Buat SEMUA file di lib/supabase/ (remote services)
  10. Buat SEMUA file di lib/repositories/ (offline-first)
  11. Buat SEMUA file di lib/stores/ (Zustand)
  12. Buat SEMUA file di lib/hooks/ (TanStack Query)
  13. Run: npx tsc --noEmit → HARUS zero errors

PHASE 3: Navigation (STEP 8)
  14. Buat src/app/_layout.tsx (root layout + providers)
  15. Buat src/app/index.tsx (redirect)
  16. Buat src/app/(auth)/_layout.tsx
  17. Buat src/app/(tabs)/_layout.tsx (5 tabs)
  18. Buat _layout.tsx untuk SEMUA folder routes
  19. Run: npx expo start → HARUS bisa jalan

PHASE 4: Screens - Auth (STEP 9)
  20. Buat login.tsx + register.tsx + forgot-password.tsx
  21. Test: pastikan auth flow bekerja

PHASE 5: Screens - Core (STEP 10-12)
  22. Buat src/app/(tabs)/index.tsx (Dashboard) + dashboard components
  23. Buat src/app/(tabs)/calendar.tsx + booking/[id].tsx + booking/new.tsx
  24. Buat src/app/(tabs)/clients.tsx + client/[id].tsx + client/new.tsx

PHASE 6: Screens - Extended (STEP 13-15)
  25. Buat service/index.tsx + service/new.tsx
  26. Buat package/index.tsx + package/new.tsx
  27. Buat finance tab + invoice/[id].tsx + payment/new.tsx
  28. Buat expense/index.tsx + expense/new.tsx
  29. Buat product/index.tsx + product/new.tsx

PHASE 7: Integration (STEP 16-18)
  30. Setup expo-notifications + push token
  31. Implement sync engine + connectivity listener
  32. Run: npx tsc --noEmit → HARUS zero errors
  33. Run: npx expo start → FULL test semua flow
  34. Build APK
```

**PENTING UNTUK AI CODER**:
- Kerjakan per PHASE, jangan loncat
- Selesaikan SEMUA file dalam satu phase sebelum lanjut
- Selalu run `npx tsc --noEmit` di akhir setiap phase untuk cek TypeScript errors
- Selalu run `npx expo start` untuk test app bisa jalan
- Jika ada error, **FIX DULU** sebelum lanjut
- Jangan pakai `any` type sembarangan — gunakan interface yang sudah didefinisikan
- Semua form **WAJIB** pakai React Hook Form + Zod resolver
- Semua styling **WAJIB** pakai NativeWind className (bukan StyleSheet)

---

## Lampiran: Database Schema

Lihat file terpisah (TIDAK BERUBAH dari versi Flutter):
- `migrations/001_create_tables.sql`
- `migrations/002_rls_policies.sql`
- `migrations/003_views.sql`
- `migrations/004_seed_data.sql`
