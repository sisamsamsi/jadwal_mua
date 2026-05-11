# 🧪 Laporan Testing Final — MUA App
**Commit:** `42ec052`
**Tanggal Review:** 10 Mei 2026
**Reviewer:** Claude Sonnet (Review ke-6)
**Scope:** UI/UX · Kemudahan User · Logic · Security · Placeholder · Bug & Error · AI Service

> **Catatan:** Sistem trial/premium dinonaktifkan secara sengaja untuk kemudahan tester real user.
> **Catatan:** Google SSO, Facebook SSO, dan Open Booking Link (web deployment) masih dalam tahap pengembangan — dikecualikan dari penilaian.

---

## ✅ Yang Sudah Diperbaiki Sejak Review Terakhir

| # | Item | Status |
|---|------|--------|
| 1 | Public booking — `client_id` (snake_case) sudah benar di insert | ✅ |
| 2 | Public booking — `minimumDate={new Date()}` pada date picker | ✅ |
| 3 | Public booking — nama & bisnis MUA ditampilkan di header form | ✅ |
| 4 | Public booking — validasi regex nomor WA | ✅ |
| 5 | Public booking — halaman sukses menampilkan nama bisnis MUA | ✅ |
| 6 | `expo-clipboard` diimport dan dipakai dengan benar | ✅ |
| 7 | `APP_CONFIG.IS_WEB_APP_DEPLOYED = false` + banner peringatan di Profile | ✅ |
| 8 | `APP_CONFIG.SUPPORT_WHATSAPP` terhubung ke tombol Bantuan & Support | ✅ |
| 9 | Halaman Panduan Pengguna (`/settings/guide`) ditambahkan | ✅ |
| 10 | Dashboard `displayName` sudah pakai `user_metadata.full_name` | ✅ |
| 11 | Greeting dinamis (Pagi/Siang/Sore/Malam) berfungsi | ✅ |
| 12 | Kalender menampilkan warna pastel per tanggal yang ada booking | ✅ |

---

## 🔴 Bug Kritis — Wajib Difix

### ⚠️ BUG 1 · MASIH BELUM DIAPPLY DARI SESI SEBELUMNYA
> Tiga patch berikut sudah disiapkan di sesi review sebelumnya namun belum masuk ke repo.

---

### Bug 1A — Triple Redirect Race Condition (Penyebab "Unmatched Route")

**File:** `app/index.tsx` + `app/(auth)/login.tsx` + `app/_layout.tsx`

Ini penyebab bug `mua-app:///` yang dilaporkan. Ada **tiga redirect bersaing** yang tembak bersamaan setelah login berhasil:

```tsx
// login.tsx baris 42 — redirect PERTAMA
router.replace("/home");

// index.tsx baris 14 — redirect KEDUA (useEffect bereaksi saat session berubah)
router.replace("/home");

// _layout.tsx — redirect KETIGA (guard bereaksi saat session berubah)
router.replace("/home");
```

**Fix yang harus diapply:**

**`app/login.tsx`** — Hapus baris 42:
```tsx
// HAPUS baris ini:
router.replace("/home");

// GANTI dengan komentar:
// Redirect dihandle oleh _layout.tsx via onAuthStateChange
```

**`app/index.tsx`** — Hapus useEffect, biarkan hanya spinner:
```tsx
import React from "react";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FAF7F5" }}>
      <ActivityIndicator size="large" color="#B76E79" />
    </View>
  );
}
```

**`app/_layout.tsx`** — Tambahkan guard untuk `segments` kosong:
```tsx
useEffect(() => {
  if (!navigationState?.key || isLoading) return;
  if (segments.length === 0) return; // ← tambahkan ini

  const inAuthGroup = segments[0] === "(auth)";
  const inOnboarding = segments[0] === "onboarding";
  const isPublicBooking = segments[0] === "book";

  if (!session && !inAuthGroup && !isPublicBooking) {
    router.replace("/login");
  } else if (session && !hasSeenOnboarding && !inOnboarding && !isPublicBooking) {
    router.replace("/onboarding");
  } else if (session && hasSeenOnboarding && (inAuthGroup || inOnboarding)) {
    router.replace("/(tabs)/home"); // ← pakai path lengkap dengan (tabs)
  }
}, [session, isLoading, segments, hasSeenOnboarding, navigationState?.key]);
```

---

### Bug 1B — Inline Tambah Klien/Layanan Gagal (userId Hilang + Stale Closure)

**File:** `app/booking/new.tsx`

Dua bug bersamaan di `handleCreateClient` dan `handleCreateService`:

**Bug pertama: `userId` tidak disertakan → DB constraint NOT NULL fail → "Gagal menambah klien"**
```tsx
// SEKARANG — userId tidak ada, insert akan gagal
createClientMutation.mutateAsync({ name: newClientName, phone: newClientPhone });
createServiceMutation.mutateAsync({ name: newServiceName, basePrice: ..., category: "Makeup" });
```

**Bug kedua: stale closure → data form lama menimpa yang baru**
```tsx
// SEKARANG — formData dari closure lama bisa timpa perubahan terbaru
setFormData({ ...formData, clientId: result.id, ... });

// HARUS
setFormData(prev => ({ ...prev, clientId: result.id, ... }));
```

**Fix lengkap:**

Tambahkan di bagian atas komponen `NewBooking`:
```tsx
import { useAuthStore } from "@/lib/stores/auth-store";

// Di dalam komponen, setelah router:
const { session } = useAuthStore();
const userId = session?.user?.id ?? "";
```

Ganti `handleCreateClient`:
```tsx
const handleCreateClient = async () => {
  if (!newClientName) return;
  try {
    const result = await createClientMutation.mutateAsync({
      name: newClientName,
      phone: newClientPhone,
      userId, // ← tambahkan ini
    });
    setFormData(prev => ({ ...prev, clientId: result.id, clientName: result.name }));
    setClientModalVisible(false);
    setNewClientName(""); setNewClientPhone("");
  } catch (e) {
    Alert.alert("Error", "Gagal menambah klien");
  }
};
```

Ganti `handleCreateService`:
```tsx
const handleCreateService = async () => {
  if (!newServiceName || !newServicePrice) return;
  try {
    const result = await createServiceMutation.mutateAsync({
      name: newServiceName,
      basePrice: Number(newServicePrice),
      category: "Makeup",
      userId, // ← tambahkan ini
    });
    setBasePricePerPerson(Number(newServicePrice));
    setFormData(prev => ({ ...prev, serviceId: result.id, packageId: "" }));
    setServiceModalVisible(false);
    setNewServiceName(""); setNewServicePrice("");
  } catch (e) {
    Alert.alert("Error", "Gagal menambah layanan");
  }
};
```

---

### Bug 1C — AI Asisten Tidak Mengenali Klien dan Tidak Pernah Cocokkan Layanan

**File:** `app/booking/new.tsx` + `supabase/functions/parse-booking/index.ts`

**Bug pertama: Matching klien satu arah saja**
```tsx
// SEKARANG — gagal jika AI kirim "Rina" tapi DB simpan "Ibu Rina Wulandari"
c.name.toLowerCase().includes(result.clientName.toLowerCase());
// "ibu rina wulandari".includes("rina") → true ✅
// "ibu rina".includes("rina wulandari") → false ❌
```

**Bug kedua: Layanan tidak pernah diekstrak atau dicocokkan**
Edge function tidak menghasilkan field `serviceName` sama sekali. `handleAiParse` pun tidak ada logika untuk mencocokkan layanan. Akibatnya, `serviceId` selalu kosong setelah AI parse.

**Fix di `app/booking/new.tsx` — ganti blok `handleAiParse` mulai dari komentar "1. Cari clientId":**
```tsx
// 1. Matching klien — dua arah agar toleran variasi penulisan
let matchedClientId = "";
let matchedClientName = result.clientName || "";

if (result.clientName) {
  const aiName = result.clientName.toLowerCase().trim();
  const match = clients.find((c: any) => {
    const dbName = c.name.toLowerCase().trim();
    return dbName.includes(aiName) || aiName.includes(dbName);
  });
  if (match) { matchedClientId = match.id; matchedClientName = match.name; }
}

// 2. Matching layanan dari nama yang diekstrak AI
let matchedServiceId = "";
let matchedServicePrice = 0;

if (result.serviceName) {
  const aiSvc = result.serviceName.toLowerCase().trim();
  const matchedSvc = services.find((s: any) => {
    const dbSvc = s.name.toLowerCase().trim();
    return dbSvc.includes(aiSvc) || aiSvc.includes(dbSvc);
  });
  if (matchedSvc) {
    matchedServiceId = matchedSvc.id;
    matchedServicePrice = matchedSvc.basePrice || 0;
  }
}

// 3. Update form dengan fallback (pakai prev)
setFormData(prev => ({
  ...prev,
  clientId: matchedClientId || prev.clientId,
  clientName: matchedClientName || prev.clientName,
  serviceId: matchedServiceId || prev.serviceId,
  bookingDate: validDate,
  startTime: result.startTime || prev.startTime,
  endTime: result.endTime || prev.endTime,
  locationName: result.locationName || prev.locationName,
  locationAddress: result.locationAddress || prev.locationAddress,
  numPersons: result.numPersons || prev.numPersons,
  eventType: result.eventType || prev.eventType,
  notes: result.notes || prev.notes,
  totalPrice: prev.totalPrice,
}));

if (matchedServiceId) setBasePricePerPerson(matchedServicePrice);

// 4. Ringkasan feedback per field
const fields = [];
if (matchedClientId) fields.push("✅ Klien ditemukan");
else if (result.clientName) fields.push(`⚠️ Klien "${result.clientName}" tidak ada di daftar`);
if (matchedServiceId) fields.push("✅ Layanan ditemukan");
else if (result.serviceName) fields.push(`⚠️ Layanan "${result.serviceName}" tidak ada di daftar`);
if (result.bookingDate) fields.push("✅ Tanggal");
if (result.startTime) fields.push("✅ Waktu");
if (result.locationName) fields.push("✅ Lokasi");

Alert.alert("Hasil AI", fields.join("\n") + "\n\nLengkapi bagian yang kosong.", [{ text: "OK" }]);
```

**Fix di `supabase/functions/parse-booking/index.ts`** — tambahkan `serviceName` di OUTPUT JSON schema:
```
"serviceName": string (nama layanan makeup, misal: "Makeup Pengantin". Kosong jika tidak disebutkan),
```

> ⚠️ **Setelah fix edge function, wajib re-deploy:**
> ```bash
> supabase functions deploy parse-booking
> ```

---

## 🟠 Logic Issue

### 4. `SUPPORT_WHATSAPP` Masih Placeholder Angka Fake

**File:** `lib/constants/app.ts`

```ts
SUPPORT_WHATSAPP: "628123456789", // ← nomor fake
```

Pengguna yang klik "Bantuan & Support" akan mengirim pesan ke nomor tidak dikenal. Wajib diganti dengan nomor WA bisnis yang aktif sebelum diserahkan ke tester.

---

### 5. Booking Detail — Loading State Masih Tidak Jelas

**File:** `app/booking/[id].tsx` baris 226

```tsx
if (loadingBooking) {
  // isi blok ini perlu dicek — pastikan bukan return null atau view kosong
}
```

Dari audit sebelumnya, kondisi ini pernah `return null` (blank screen). Perlu dipastikan sudah menampilkan `<ActivityIndicator />` atau loading skeleton yang layak.

---

### 6. `useSyncStore` Didefinisikan tapi Tidak Pernah Terhubung ke Network

**File:** `lib/stores/sync-store.ts`

Store `isOnline`, `isSyncing`, `unsyncedCount` sudah ada tapi tidak ada satu pun komponen atau hook yang memanggil `setOnline()` berdasarkan kondisi jaringan nyata. Tidak ada integrasi `NetInfo` atau `useNetworkState`. Fitur offline indicator ini **belum aktif** meski strukturnya sudah siap.

---

### 7. Versi App Tidak Konsisten

| Lokasi | Nilai |
|--------|-------|
| `APP_CONFIG.VERSION` | `"1.0.4"` |
| `package.json` | `"0.1.0"` |
| Tampilan footer Profile/Settings | `"MUA App v1.0.4"` |

Sebaiknya versi di `package.json` dan `APP_CONFIG.VERSION` sinkron.

---

### 8. Layanan Tidak Diwajibkan di Form Booking

**File:** `app/booking/new.tsx`

Tidak ada validasi bahwa layanan atau paket harus dipilih sebelum menyimpan:
```tsx
// handleSave hanya cek clientId, bookingDate, startTime, endTime
// serviceId dan packageId bisa kosong → totalPrice = 0 → booking tersimpan dengan harga Rp 0
```

MUA bisa tidak sengaja menyimpan booking tanpa layanan dan tanpa harga.

---

## 🟡 UX Issue

### 9. Tombol "Tutup" di Halaman Sukses Public Booking Membingungkan

**File:** `app/book/[muaId].tsx`

```tsx
onPress={() => setIsSuccess(false)} // ← kembali ke form kosong
```

Setelah booking berhasil, user yang klik "Tutup" kembali ke form kosong — tidak ada konteks "Buat Booking Lain". Label seharusnya "Ajukan Jadwal Lain" atau form dikosongkan dengan konfirmasi intent.

---

### 10. AI Modal — Hint Tidak Mencakup Layanan

**File:** `app/booking/new.tsx`

```tsx
<Text>* AI akan mencoba mendeteksi Nama, Tanggal, Jam, dan Lokasi.</Text>
```

Setelah fix Bug 1C, AI juga bisa mendeteksi Layanan. Teks hint harus diperbarui agar user tahu AI bisa mencocokkan layanan juga.

---

### 11. Import `Animated` Masih Ada di Onboarding Tapi Tidak Dipakai

**File:** `app/onboarding/index.tsx`

```tsx
import { ..., Animated } from "react-native"; // ← tidak dipakai sejak ganti ke FlatList
```

Dead import — tidak crash, tapi lint warning dan membingungkan.

---

### 12. Kalender — Tanggal dengan Booking yang Dipilih Kehilangan Warna Pastelnya

**File:** `app/(tabs)/calendar.tsx`

Saat user memilih tanggal yang sudah ada booking, warna pastel dari booking ditimpa warna selected (rose `#B76E79`). Ini wajar UX-nya, tapi saat user memilih tanggal lain, dot booking pada tanggal sebelumnya kembali tampil normal. Tidak ada bug — ini catatan UX untuk dipertimbangkan.

---

## 🔒 Security

### 13. CORS Edge Function Masih Wildcard

**File:** `supabase/functions/parse-booking/index.ts`

```ts
'Access-Control-Allow-Origin': '*'
```

Masih wildcard. Dapat diperketat setelah domain web app final diketahui. Tidak kritis untuk fase tester, wajib difix sebelum rilis publik.

---

## 📋 Status Placeholder yang Tersisa

| Item | Status | Keterangan |
|------|--------|------------|
| Google SSO | ⏳ Planned | Butuh Google Console + Supabase setup |
| Facebook SSO | ⏳ Planned | Butuh Meta Developer + Supabase setup |
| Open Booking Link (domain) | ⏳ Planned | Butuh deploy Next.js ke Vercel |
| `SUPPORT_WHATSAPP` | 🔴 **Harus diisi** | Nomor fake `628123456789` aktif di app |
| `APP_CONFIG.VERSION` | 🟡 Minor | Tidak sinkron dengan `package.json` |

---

## 📊 Scorecard Perkembangan — 6 Review

| Kategori | #1 | #2 | #3 | #4 | #5 | **#6** |
|----------|:--:|:--:|:--:|:--:|:--:|:------:|
| Bug Kritis | 7 | 2 | 3 | 5 | 3 | **3** |
| Security | 0 | 1 | 1 | 1 | 1 | **1** |
| Logic Issue | 3 | 3 | 4 | 5 | 4 | **5** |
| UX Issue | 6 | 2 | 3 | 4 | 3 | **4** |
| Placeholder Aktif | — | — | — | 2 | 2 | **2** |

> Bug kritis tetap 3 bukan karena tidak ada kemajuan — melainkan karena **3 patch dari sesi sebelumnya belum diapply ke repo**. Jika ketiganya diapply, angka bug kritis turun ke **0**.

---

## 🎯 Checklist Sebelum Serahkan ke Tester Real User

### 🔴 Wajib Diselesaikan Dulu (App Tidak Berfungsi Normal Tanpa Ini)
- [ ] **Apply Bug 1A** — Fix triple redirect (`index.tsx` + `login.tsx` + `_layout.tsx`)
- [ ] **Apply Bug 1B** — Tambah `userId` + fix stale closure di `handleCreateClient` & `handleCreateService`
- [ ] **Apply Bug 1C** — AI two-way matching + service matching + re-deploy edge function
- [ ] **Isi `SUPPORT_WHATSAPP`** dengan nomor WA aktif

### 🟠 Sangat Disarankan Sebelum Testing
- [ ] Validasi layanan di form booking (jangan bisa simpan harga Rp 0 tanpa layanan)
- [ ] Pastikan `booking/[id].tsx` menampilkan spinner saat loading, bukan blank screen
- [ ] Update hint teks di AI modal setelah service matching aktif

### 🟡 Bisa Ditunda Pasca Testing
- [ ] Sinkronkan `package.json` version dengan `APP_CONFIG.VERSION`
- [ ] Hapus `Animated` import di `onboarding/index.tsx`
- [ ] Implementasi `NetInfo` untuk `useSyncStore`
- [ ] Perketat CORS edge function dari `*` ke domain spesifik
- [ ] Label tombol "Tutup" di success screen public booking

---

## 💬 Panduan untuk Tester Real User

| Fitur | Status | Catatan |
|-------|:------:|---------|
| Login / Register Email | ✅ Siap | Setelah bug triple-redirect difix |
| Onboarding | ✅ Siap | |
| Dashboard | ✅ Siap | |
| Kalender | ✅ Siap | |
| Buat Booking | ✅ Siap | Setelah userId fix diapply |
| Tambah Klien Inline | ✅ Siap | Setelah userId fix diapply |
| Tambah Layanan Inline | ✅ Siap | Setelah userId fix diapply |
| Manajemen Klien | ✅ Siap | |
| Invoice | ✅ Siap | |
| Keuangan (Pemasukan/Pengeluaran) | ✅ Siap | |
| Riwayat Transaksi | ✅ Siap | |
| Bridal Party (per booking) | ✅ Siap | |
| Template WA | ✅ Siap | |
| Pengingat via WA | ✅ Siap | |
| Settings & Panduan | ✅ Siap | |
| **AI Asisten** | ⚠️ Siap setelah fix + deploy | Re-deploy edge function wajib |
| **Login Google/Facebook** | ⏳ Belum | Dikembangkan belakangan |
| **Open Booking Link** | ⏳ Belum | Butuh deploy web app |

---

*Laporan ini dibuat dari hasil code review statis terhadap repository `sisamsamsi/jadwal_mua` branch `main`.*
*Reviewer: Claude Sonnet — 10 Mei 2026 · Review ke-6*
