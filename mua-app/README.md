# MUA App (Expo) - Scaffold

Ini adalah scaffold awal untuk MUA App berdasarkan `BLUEPRINT_EXPO.md`.

Catatan penting:
- File `.env` berisi `SUPABASE_URL` dan `SUPABASE_ANON_KEY` (anon public key). Jangan commit kunci sensitif ke repo publik.
- Jalankan `npm install` (atau `yarn`) di dalam folder `mua-app` untuk menginstal dependensi.

Quick start:

```bash
cd mua-app
npm install
npx expo start
```

Type check:

```bash
npm run typecheck
```

Directory layout awal:
- `src/app` - file-based routes (expo-router)
- `src/lib/supabase` - supabase client + service wrappers
- `src/lib/stores` - zustand stores
- `src/lib/hooks` - react-query hooks
- `src/lib/repositories` - offline-first repositories (skeleton)

Build progress: lihat `BUILD_PROGRESS.md`.
