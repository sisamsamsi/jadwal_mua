# 🛠️ Blueprint Web Admin Fixatif
**Stack:** Next.js 14 + NextAuth.js + Supabase + Tailwind CSS
**Deploy:** Vercel (project terpisah dari open booking)
**URL:** `fixatif-admin.vercel.app`
**Tanggal:** Mei 2026

---

## Struktur Folder

```
fixatif-admin/
├── app/
│   ├── layout.tsx                        ← root layout
│   ├── globals.css                       ← tailwind import
│   ├── page.tsx                          ← halaman login (redirect ke /admin)
│   ├── admin/
│   │   ├── layout.tsx                    ← layout admin (cek session)
│   │   ├── page.tsx                      ← redirect ke /admin/dashboard
│   │   └── dashboard/
│   │       └── page.tsx                  ← halaman utama admin
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts              ← handler NextAuth Google SSO
│       └── users/
│           ├── route.ts                  ← GET semua user
│           └── [id]/
│               └── route.ts             ← PATCH update status user
├── components/
│   ├── UserTable.tsx                     ← tabel daftar user
│   ├── StatusBadge.tsx                   ← badge status langganan
│   └── StatsCard.tsx                     ← kartu ringkasan statistik
├── lib/
│   ├── supabase.ts                       ← Supabase admin client
│   └── auth.ts                          ← konfigurasi NextAuth
├── .env.local                            ← environment variables
├── .env.example                          ← contoh env (di-commit)
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## 1. Environment Variables

**File: `.env.example`**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyxxx...   # service role — JANGAN EXPO_PUBLIC_

# NextAuth
NEXTAUTH_URL=https://fixatif-admin.vercel.app
NEXTAUTH_SECRET=random-string-minimal-32-karakter

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# Email owner yang diizinkan login (pisah koma jika lebih dari 1)
ADMIN_EMAILS=emailkamu@gmail.com
```

> **Penting:** Gunakan `SUPABASE_SERVICE_ROLE_KEY` (bukan anon key) agar admin bisa baca semua data tanpa terhalang RLS.

---

## 2. Supabase Table — `profiles` (Subscription Fields)

Pastikan tabel `profiles` memiliki kolom berikut (sudah ada di skema mobile app):

```sql
-- Tambahkan kolom langganan jika belum ada (biasanya sudah ada dari skema awal)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;

-- RLS — Pastikan admin (service role) bisa akses
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access"
  ON profiles FOR ALL
  USING (true)
  WITH CHECK (true);
```

---

## 3. Kode File per File

---

### `package.json`

```json
{
  "name": "fixatif-admin",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "14.2.3",
    "next-auth": "^4.24.7",
    "react": "^18",
    "react-dom": "^18",
    "@supabase/supabase-js": "^2.39.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "typescript": "^5",
    "autoprefixer": "^10",
    "postcss": "^8",
    "tailwindcss": "^3.3.0"
  }
}
```

---

### `lib/supabase.ts`

```ts
import { createClient } from "@supabase/supabase-js";

// Gunakan service role key — bisa bypass RLS untuk kebutuhan admin
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

---

### `lib/auth.ts`

```ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase());

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // Hanya email yang terdaftar di ADMIN_EMAILS yang bisa masuk
    async signIn({ user }) {
      return ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? "");
    },
    async session({ session }) {
      return session;
    },
  },
  pages: {
    signIn: "/",           // redirect ke halaman login custom
    error: "/?error=true", // jika login ditolak
  },
};
```

---

### `app/api/auth/[...nextauth]/route.ts`

```ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

---

### `app/api/users/route.ts`
*GET — ambil semua user beserta status langganan*

```ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  // Cek session — hanya admin yang bisa akses
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ambil semua user dari auth.users
  const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
  if (userError) return NextResponse.json({ error: userError.message }, { status: 500 });

  // Ambil semua profiles (termasuk status langganan)
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, business_name, subscription_status, trial_ends_at, subscription_ends_at");

  // Gabungkan data
  const merged = users.users.map((u) => {
    const profile = profiles?.find((p) => p.id === u.id);
    return {
      id: u.id,
      email: u.email,
      name: profile?.full_name || u.user_metadata?.full_name || "-",
      businessName: profile?.business_name || "-",
      createdAt: u.created_at,
      lastSignIn: u.last_sign_in_at,
      status: profile?.subscription_status ?? "trial",
      trialEndsAt: profile?.trial_ends_at,
      subscriptionEndsAt: profile?.subscription_ends_at,
      plan: "monthly", // default
      notes: "",
    };
  });

  return NextResponse.json(merged);
}
```

---

### `app/api/users/[id]/route.ts`
*PATCH — update status, tanggal expired, atau catatan user*

```ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { status, subscriptionEndsAt, notes } = body;

  const updatePayload: any = { updated_at: new Date().toISOString() };
  if (status) updatePayload.subscription_status = status;
  if (subscriptionEndsAt) updatePayload.subscription_ends_at = subscriptionEndsAt;
  // if (notes !== undefined) updatePayload.notes = notes; // profiles table might not have notes

  const { error } = await supabaseAdmin
    .from("profiles")
    .update(updatePayload)
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
```

---

### `app/page.tsx`
*Halaman login*

```tsx
"use client";
import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const hasError = params.get("error");

  useEffect(() => {
    if (status === "authenticated") router.replace("/admin/dashboard");
  }, [status]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm text-center">

        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl bg-rose-brand flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-3xl">F</span>
        </div>
        <h1 className="text-2xl font-bold text-rose-brand">Fixatif</h1>
        <p className="text-sm text-gray-400 mb-2">Panel Admin</p>
        <p className="text-xs text-gray-300 mb-8">
          Kunci jadwalmu, pastikan sempurna
        </p>

        {/* Error */}
        {hasError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm
                          rounded-xl p-3 mb-4">
            Akun ini tidak memiliki akses admin.
          </div>
        )}

        {/* Tombol Login Google */}
        <button
          onClick={() => signIn("google")}
          className="w-full flex items-center justify-center gap-3 border
                     border-gray-200 rounded-xl px-4 py-3 text-sm font-medium
                     text-gray-700 hover:bg-gray-50 transition"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92
              c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77
              c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84
              C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43
              .35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15
              C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84
              c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Masuk dengan Google
        </button>

        <p className="text-xs text-gray-300 mt-6">
          Hanya akun owner yang bisa masuk
        </p>
      </div>
    </div>
  );
}
```

---

### `app/admin/layout.tsx`
*Guard — redirect ke login jika tidak ada session*

```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  return (
    <div className="min-h-screen bg-cream">
      {/* Topbar */}
      <nav className="bg-white border-b border-rose-light px-6 py-4
                      flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-brand flex items-center
                          justify-center text-white font-bold text-sm">
            F
          </div>
          <div>
            <span className="font-bold text-gray-800">Fixatif</span>
            <span className="text-xs text-gray-400 ml-2">Admin Panel</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{session.user?.email}</span>
          <a href="/api/auth/signout"
             className="text-sm text-rose-brand hover:underline font-medium">
            Keluar
          </a>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
```

---

### `app/admin/dashboard/page.tsx`
*Halaman utama — statistik + tabel user*

```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import UserTable from "@/components/UserTable";

async function getStats() {
  const { data: profiles } = await supabaseAdmin.from("profiles").select("subscription_status");
  const total = profiles?.length ?? 0;
  const active = profiles?.filter((s) => s.subscription_status === "active").length ?? 0;
  const trial = profiles?.filter((s) => s.subscription_status === "trial").length ?? 0;
  const expired = profiles?.filter((s) => s.subscription_status === "expired").length ?? 0;
  return { total, active, trial, expired };
}

async function getUsers() {
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  const { data: profiles } = await supabaseAdmin
    .from("profiles").select("*");

  return users?.users.map((u) => {
    const profile = profiles?.find((p) => p.id === u.id);
    return {
      id: u.id,
      email: u.email ?? "-",
      name: profile?.full_name ?? u.user_metadata?.full_name ?? "-",
      businessName: profile?.business_name ?? "-",
      createdAt: u.created_at,
      lastSignIn: u.last_sign_in_at ?? null,
      status: (profile?.subscription_status ?? "trial") as string,
      trialEndsAt: profile?.trial_ends_at ?? null,
      subscriptionEndsAt: profile?.subscription_ends_at ?? null,
      notes: "",
    };
  }) ?? [];
}

export default async function DashboardPage() {
  const stats = await getStats();
  const users = await getUsers();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">
          Kelola user dan langganan Fixatif
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total User",   value: stats.total,   color: "text-gray-700" },
          { label: "Aktif",        value: stats.active,  color: "text-green-600" },
          { label: "Trial",        value: stats.trial,   color: "text-yellow-500" },
          { label: "Expired",      value: stats.expired, color: "text-red-500" },
        ].map((c) => (
          <div key={c.label}
               className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">{c.label}</p>
            <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Tabel User */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center
                        justify-between">
          <h2 className="font-semibold text-gray-800">Daftar User</h2>
          <span className="text-sm text-gray-400">{users.length} user terdaftar</span>
        </div>
        <UserTable initialUsers={users} />
      </div>
    </div>
  );
}
```

---

### `components/UserTable.tsx`
*Tabel interaktif — toggle status, perpanjang, tambah catatan*

```tsx
"use client";
import { useState } from "react";
import StatusBadge from "./StatusBadge";

type User = {
  id: string; email: string; name: string; businessName: string;
  createdAt: string; lastSignIn: string | null;
  status: string; trialEndsAt: string | null;
  subscriptionEndsAt: string | null; notes: string;
};

type Props = { initialUsers: User[] };

export default function UserTable({ initialUsers }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [loading, setLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("id-ID", {
      day: "2-digit", month: "short", year: "numeric"
    }) : "-";

  const updateUser = async (id: string, payload: object) => {
    setLoading(id);
    await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...payload } : u))
    );
    setLoading(null);
  };

  const activate = (id: string) => {
    const ends = new Date();
    ends.setMonth(ends.getMonth() + 1);
    updateUser(id, {
      status: "active",
      subscriptionEndsAt: ends.toISOString(),
    });
  };

  const expire = (id: string) => updateUser(id, { status: "expired" });

  const filtered = users.filter((u) => {
    const matchSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.businessName.toLowerCase().includes(search.toLowerCase()) ||
      u.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || u.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div>
      {/* Search & Filter */}
      <div className="px-6 py-3 flex gap-3 border-b border-gray-100">
        <input
          type="text"
          placeholder="Cari nama, bisnis, atau email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2
                     text-sm focus:outline-none focus:border-rose-brand"
        />
        {["all", "trial", "active", "expired"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-medium capitalize
              transition ${filter === f
                ? "bg-rose-brand text-white"
                : "bg-gray-100 text-gray-500 hover:bg-rose-light"
              }`}>
            {f === "all" ? "Semua" : f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-400 text-xs uppercase">
            <tr>
              {["User", "Bisnis", "Status", "Trial/Expired", "Login Terakhir", "Aksi"].map((h) => (
                <th key={h} className="px-6 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-rose-light/30 transition">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-800">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </td>
                <td className="px-6 py-4 text-gray-600">{u.businessName}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={u.status} />
                </td>
                <td className="px-6 py-4 text-gray-500 text-xs">
                  {u.status === "trial"
                    ? `Trial s/d ${fmt(u.trialEndsAt)}`
                    : u.status === "active"
                    ? `Aktif s/d ${fmt(u.subscriptionEndsAt)}`
                    : fmt(u.subscriptionEndsAt)}
                </td>
                <td className="px-6 py-4 text-gray-400 text-xs">
                  {fmt(u.lastSignIn)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {u.status !== "active" && (
                      <button onClick={() => activate(u.id)}
                        disabled={loading === u.id}
                        className="px-3 py-1.5 bg-green-500 text-white text-xs
                                   font-medium rounded-lg hover:bg-green-600
                                   disabled:opacity-50 transition">
                        {loading === u.id ? "..." : "Aktifkan"}
                      </button>
                    )}
                    {u.status === "active" && (
                      <button onClick={() => expire(u.id)}
                        disabled={loading === u.id}
                        className="px-3 py-1.5 bg-red-500 text-white text-xs
                                   font-medium rounded-lg hover:bg-red-600
                                   disabled:opacity-50 transition">
                        {loading === u.id ? "..." : "Nonaktifkan"}
                      </button>
                    )}
                    {u.status === "active" && (
                      <button onClick={() => activate(u.id)}
                        disabled={loading === u.id}
                        className="px-3 py-1.5 bg-blue-500 text-white text-xs
                                   font-medium rounded-lg hover:bg-blue-600
                                   disabled:opacity-50 transition">
                        +1 Bulan
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-300">
                  Tidak ada user yang ditemukan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

### `components/StatusBadge.tsx`

```tsx
const CONFIG: Record<string, { label: string; className: string }> = {
  trial:     { label: "Trial",     className: "bg-yellow-100 text-yellow-700" },
  active:    { label: "Aktif",     className: "bg-green-100  text-green-700"  },
  expired:   { label: "Expired",   className: "bg-red-100    text-red-600"    },
  cancelled: { label: "Berhenti",  className: "bg-gray-100   text-gray-500"   },
};

export default function StatusBadge({ status }: { status: string }) {
  const c = CONFIG[status] ?? CONFIG.trial;
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${c.className}`}>
      {c.label}
    </span>
  );
}
```

---

### `app/admin/page.tsx`
*Redirect dari /admin ke /admin/dashboard*

```tsx
import { redirect } from "next/navigation";
export default function AdminPage() {
  redirect("/admin/dashboard");
}
```

---

## 4. Konfigurasi Login Google

**Di Google Cloud Console:**
```
APIs & Services → Credentials → Create OAuth 2.0 Client
Authorized redirect URIs:
  https://fixatif-admin.vercel.app/api/auth/callback/google
  http://localhost:3000/api/auth/callback/google   ← untuk dev lokal
```

**Di `.env.local`:**
```bash
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
NEXTAUTH_URL=http://localhost:3000     # ganti ke URL Vercel saat deploy
NEXTAUTH_SECRET=isi-random-string-panjang
```

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

---

## 5. Cek Langganan dari App Mobile

Agar app Fixatif (Expo) bisa mengecek status langganan user saat login, tambahkan ini di `_layout.tsx` atau `auth-store.ts`:

```ts
// Di RootLayout.tsx atau melalui syncRepository.fullSync()
// Data akan otomatis tersinkronisasi ke SQLite lokal.

// Contoh pengecekan manual (jika diperlukan):
const { data: profile } = await supabase
  .from("profiles")
  .select("subscription_status, trial_ends_at, subscription_ends_at")
  .eq("id", session.user.id)
  .single();

// Simpan ke local DB / store
await profileRepository.update(session.user.id, {
  subscriptionStatus: profile.subscription_status,
  trialEndsAt: profile.trial_ends_at,
  subscriptionEndsAt: profile.subscription_ends_at,
});
```

Buat `lib/stores/subscription-store.ts`:
```ts
import { create } from "zustand";

interface SubscriptionState {
  status: "trial" | "active" | "expired" | "cancelled";
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  isActive: () => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  status: "trial",
  trialEndsAt: null,
  subscriptionEndsAt: null,
  isActive: () => {
    const { status, trialEndsAt, subscriptionEndsAt } = get();
    if (status === "active") {
      return subscriptionEndsAt
        ? new Date(subscriptionEndsAt) > new Date()
        : true;
    }
    if (status === "trial") {
      return trialEndsAt
        ? new Date(trialEndsAt) > new Date()
        : false;
    }
    return false;
  },
}));
```

---

## 6. Deploy ke Vercel

```bash
# 1. Push ke GitHub repo baru
git init
git add .
git commit -m "feat: fixatif admin panel"
git remote add origin https://github.com/username/fixatif-admin
git push -u origin main

# 2. Buka vercel.com → Add New Project → import fixatif-admin
# 3. Tambah semua environment variables dari .env.example
# 4. Deploy
```

Setelah deploy, update `NEXTAUTH_URL` di Vercel env:
```
NEXTAUTH_URL=https://fixatif-admin.vercel.app
```

Dan tambahkan URL redirect di Google Cloud Console:
```
https://fixatif-admin.vercel.app/api/auth/callback/google
```

---

## 7. Tampilan Akhir

```
fixatif-admin.vercel.app/
        ↓
┌─────────────────────────────────────┐
│  F  Fixatif  Admin Panel            │
│                                     │
│     [Masuk dengan Google]           │
│                                     │
│     Hanya akun owner yang bisa      │
└─────────────────────────────────────┘

Setelah login → /admin/dashboard
┌─────────────────────────────────────────────────┐
│ F Fixatif Admin  |  email@gmail.com  | Keluar   │
├─────────────────────────────────────────────────┤
│                                                 │
│  [24 Total]  [8 Aktif]  [12 Trial]  [4 Expired]│
│                                                 │
│  Daftar User                    24 user         │
│  [Cari...] [Semua] [Trial] [Aktif] [Expired]   │
├──────────┬──────────┬────────┬──────────┬───────┤
│ User     │ Bisnis   │ Status │ Expired  │ Aksi  │
├──────────┼──────────┼────────┼──────────┼───────┤
│ Rina W.  │ MUA Rina │ 🟡Trial│ 25 Mei   │[Aktif]│
│ Siti A.  │ Glam MUA │ 🟢Aktif│ 14 Jun   │[+1Bln]│
│ Budi S.  │ -        │ 🔴Exp  │ 1 Apr    │[Aktif]│
└──────────┴──────────┴────────┴──────────┴───────┘
```

---

## Checklist Implementasi

- [ ] Buat project Next.js baru: `npx create-next-app@latest fixatif-admin`
- [ ] Copy semua kode dari blueprint ini ke file yang sesuai
- [ ] Jalankan SQL di Supabase untuk buat tabel `subscriptions`
- [ ] Setup Google OAuth di Google Cloud Console
- [ ] Isi `.env.local` dengan semua variabel yang dibutuhkan
- [ ] Test lokal: `npm run dev` → buka `localhost:3000`
- [ ] Push ke GitHub → deploy ke Vercel
- [ ] Tambah URL redirect Google di Google Cloud Console
- [ ] Update `NEXTAUTH_URL` di Vercel env ke URL production
- [ ] Test login Google di production
- [ ] Integrasikan subscription check ke app Expo (opsional)

---

*Blueprint ini dibuat untuk Fixatif Admin Panel.*
*Kunci jadwalmu, pastikan sempurna — Fixatif.*
