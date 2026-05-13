# 🔬 Laporan Forensik & Panduan Perbaikan
## Fixatif — Web Deployment (Vercel) Open Booking Page
**Tanggal:** 10 Mei 2026
**Gejala:** Halaman `/book/[muaId]` di Vercel blank putih total
**Error di browser console:**
- `Uncaught SyntaxError: Cannot use 'import.meta' outside a module`
- `Content Security Policy blocks the use of 'eval' in JavaScript`

---

## Gambaran Masalah

```
User buka link Vercel → blank putih
        ↓
Browser console menampilkan 2 error
        ↓
Seluruh JavaScript gagal dieksekusi
        ↓
React tidak sempat render apapun
```

Setelah investigasi kode, ditemukan **4 akar masalah** yang saling berkaitan. Harus diselesaikan **semua** — menyelesaikan sebagian saja tidak akan memperbaiki halaman.

---

## 🔍 Akar Masalah

---

### Masalah 1 — Babel Menggunakan Substitusi Sintaksis yang Tidak Valid

**File:** `mua-app/babel.config.js`

Di dalam `babel.config.js` terdapat fungsi kustom `replaceImportMeta` yang mencoba mengubah sintaksis `import.meta` menjadi `process` agar bisa berjalan di Metro Web:

```js
// BERMASALAH — ada di babel.config.js saat ini
const replaceImportMeta = function () {
  return {
    visitor: {
      MetaProperty(path) {
        path.replaceWithSourceString("process"); // ← tidak valid di CommonJS
      },
    },
  };
};
```

`replaceWithSourceString("process")` mem-parsing string mentah tanpa mendaftarkan node objek global yang valid. Di lingkungan Metro Web (CommonJS target), ini menghasilkan sintaksis `import.meta` yang tidak terselesaikan — browser memblokir seluruh eksekusi skrip dan muncul error:
> `Cannot use 'import.meta' outside a module`

---

### Masalah 2 — Paket `react-native-dotenv` Konflik dengan Expo SDK

**File:** `mua-app/package.json` baris 82

```json
"react-native-dotenv": "^3.4.11"
```

Expo SDK 54 sudah memiliki penanganan variabel environment mandiri berbasis prefix `EXPO_PUBLIC_`. Kehadiran `react-native-dotenv` menyuntikkan sintaksis ESM (ECMAScript Module) tambahan ke dalam bundle web statis yang memperparah konflik `import.meta` di atas.

---

### Masalah 3 — Supabase Client Menggunakan Native Module di Browser

**File:** `mua-app/lib/supabase/client.ts`

```ts
// BERMASALAH — expo-secure-store adalah native module
import * as SecureStore from "expo-secure-store";

const ExpoSecureStoreAdapter = {
  getItem: async (key) => await SecureStore.getItemAsync(key),
  // ...
};

export const supabase = createClient(URL, KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter, // ← crash di browser
  },
});
```

`expo-secure-store` hanya bisa berjalan di iOS dan Android — menggunakan Keychain dan Keystore native. Di browser, module ini tidak ada sama sekali. Akibatnya Supabase client gagal diinisialisasi → seluruh halaman tidak bisa load data apapun → blank putih.

> **Ini adalah penyebab terbesar halaman tetap blank** meski error Babel sudah diperbaiki.

---

### Masalah 4 — Content Security Policy Terlalu Ketat

**File:** `mua-app/vercel.json`

```json
"Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-eval'..."
```

CSP yang ditulis di `vercel.json` konflik dengan CSP default yang ditambahkan Vercel secara otomatis. Hasilnya dua header CSP berjalan bersamaan dan saling bertentangan — browser menolak eksekusi beberapa skrip yang seharusnya diizinkan.

---

## 🛠️ Panduan Perbaikan — Langkah demi Langkah

> Ikuti urutan ini. Jangan lewati satu langkah pun.

---

### Langkah 1 — Hapus Paket Konflik, Install Pengganti yang Benar

Jalankan di terminal dalam folder `mua-app/`:

```bash
npm uninstall react-native-dotenv
npm install --save-dev babel-plugin-transform-import-meta
```

---

### Langkah 2 — Ganti Isi `babel.config.js`

Ganti **seluruh isi** file dengan kode berikut:

```js
module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      ["inline-import", { extensions: [".sql"] }],
      "babel-plugin-transform-import-meta", // ← pengganti replaceImportMeta
      "react-native-reanimated/plugin",
    ],
  };
};
```

**Apa yang berubah:**
- Fungsi kustom `replaceImportMeta` dihapus seluruhnya
- Diganti dengan `babel-plugin-transform-import-meta` yang telah tersertifikasi dan terbukti bekerja di Metro Web

---

### Langkah 3 — Perbaiki Supabase Client agar Kompatibel dengan Browser

Tambahkan pengecekan platform di `lib/supabase/client.ts`:

```ts
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("EXPO_PUBLIC_SUPABASE_URL atau EXPO_PUBLIC_SUPABASE_ANON_KEY belum diisi.");
}

const MAX_SIZE = 2048;

const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      const chunkedInfo = await SecureStore.getItemAsync(`${key}_chunked`);
      if (chunkedInfo) {
        const chunks = parseInt(chunkedInfo);
        if (isNaN(chunks)) return null;
        let data = "";
        for (let i = 0; i < chunks; i++) {
          const chunk = await SecureStore.getItemAsync(`${key}_${i}`);
          if (chunk) data += chunk;
        }
        return data;
      }
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      if (value.length > MAX_SIZE) {
        const chunks = Math.ceil(value.length / MAX_SIZE);
        await SecureStore.setItemAsync(`${key}_chunked`, chunks.toString());
        for (let i = 0; i < chunks; i++) {
          await SecureStore.setItemAsync(`${key}_${i}`, value.slice(i * MAX_SIZE, (i + 1) * MAX_SIZE));
        }
        await SecureStore.deleteItemAsync(key);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch {}
  },
  removeItem: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}
  },
};

export const supabase = createClient(
  SUPABASE_URL ?? "",
  SUPABASE_ANON_KEY ?? "",
  {
    auth: {
      // Web: tidak pakai SecureStore (tidak tersedia di browser)
      // Mobile: tetap pakai SecureStore seperti biasa
      storage: Platform.OS === "web" ? undefined : ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: Platform.OS !== "web",
      detectSessionInUrl: false,
    },
  }
);
```

**Apa yang berubah:**
- Ditambahkan `Platform.OS === "web"` check
- Di browser: tidak menggunakan `ExpoSecureStoreAdapter` (native module)
- Di mobile: tetap menggunakan `ExpoSecureStoreAdapter` seperti sebelumnya
- Halaman open booking adalah form publik — tidak butuh session tersimpan di browser

---

### Langkah 4 — Sederhanakan `vercel.json`

Ganti **seluruh isi** `vercel.json` dengan kode berikut:

```json
{
  "buildCommand": "npx expo export -p web",
  "outputDirectory": "dist",
  "cleanUrls": true,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Apa yang berubah:**
- Header CSP yang konflik dihapus seluruhnya
- Vercel akan menggunakan security header default-nya sendiri yang sudah cukup
- Rewrite rules disederhanakan agar semua path diarahkan ke `index.html`

---

### Langkah 5 — Tambah Environment Variable di Vercel Dashboard

Buka **Vercel Dashboard → Project → Settings → Environment Variables**

Tambahkan dua variabel berikut:

| Key | Value |
|-----|-------|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://[project-ref].supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `eyxxx...` (anon key dari Supabase) |

> **Penting:** Tanpa langkah ini, Supabase client akan mendapat `undefined` meski kode sudah benar. File `.env` lokal tidak ikut ter-upload ke Vercel.

---

### Langkah 6 — Push & Redeploy dengan Clean Cache

```bash
# Commit semua perubahan
git add .
git commit -m "fix: resolve web deployment blank page - babel, supabase web compat, vercel config"
git push origin main
```

Kemudian di Vercel Dashboard:

```
Deployments → pilih deployment terbaru
      ↓
Klik ikon titik tiga (⋮)
      ↓
Pilih "Redeploy"
      ↓
✅ Centang "Redeploy with clean build cache"
      ↓
Klik Redeploy
```

> **Wajib centang clean cache** — Vercel menyimpan cache build lama yang masih berisi file bermasalah. Tanpa clean cache, error lama bisa tetap muncul meski kode sudah diperbaiki.

---

## ✅ Checklist Perbaikan

- [ ] `npm uninstall react-native-dotenv`
- [ ] `npm install --save-dev babel-plugin-transform-import-meta`
- [ ] `babel.config.js` — hapus `replaceImportMeta`, tambah `babel-plugin-transform-import-meta`
- [ ] `lib/supabase/client.ts` — tambah `Platform.OS` check untuk storage
- [ ] `vercel.json` — hapus CSP header, sederhanakan rewrite rules
- [ ] Tambah `EXPO_PUBLIC_SUPABASE_URL` di Vercel Dashboard
- [ ] Tambah `EXPO_PUBLIC_SUPABASE_ANON_KEY` di Vercel Dashboard
- [ ] Push ke GitHub
- [ ] Redeploy dengan **clean build cache** di Vercel

---

## Alur Perbaikan Ringkas

```
Masalah 1 & 2   → Langkah 1 & 2  (Babel + dotenv)
      ↓
Masalah 3       → Langkah 3      (Supabase web compat)
      ↓
Masalah 4       → Langkah 4      (vercel.json)
      ↓
                   Langkah 5      (env variable Vercel)
      ↓
                   Langkah 6      (push + redeploy clean)
      ↓
Halaman /book/[muaId] berjalan normal di browser ✅
```

---

*Laporan ini merupakan gabungan dari hasil analisis forensik eksternal dan code review internal repository `sisamsamsi/jadwal_mua`.*
*Fixatif — Kunci jadwalmu, pastikan sempurna.*
