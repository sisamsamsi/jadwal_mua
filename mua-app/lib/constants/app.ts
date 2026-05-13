// lib/constants/app.ts
export const APP_CONFIG = {
  // Ganti dengan domain asli Anda setelah deploy web app
  PUBLIC_BOOKING_BASE_URL: "https://fixatif.vercel.app/book",
  // ⚠️ WAJIB DIISI SEBELUM RILIS: Ganti dengan nomor WA bisnis aktif Anda (format: 62xxx tanpa + atau spasi)
  // Contoh: "6281234567890" untuk nomor +62 812-3456-7890
  SUPPORT_WHATSAPP: "628884000585", // TODO: ganti dengan nomor WA aktif Anda
  VERSION: "1.0.4", // Sinkron dengan package.json
  // Flag untuk menandai apakah web app sudah dideploy (ubah ke true setelah deploy)
  IS_WEB_APP_DEPLOYED: true,
};

export const AppConstants = {
  currency: {
    code: "IDR",
    locale: "id-ID",
  },
};

