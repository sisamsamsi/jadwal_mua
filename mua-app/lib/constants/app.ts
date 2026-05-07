export const AppConstants = {
  appName: "MUA Jadwal",
  currency: {
    code: "IDR",
    symbol: "Rp",
    locale: "id-ID",
  },
  booking: {
    defaultDurationMinutes: 60,
    minAdvanceBookingDays: 1,
    travelBufferMinutes: 30,
  },
  sync: {
    fullSyncIntervalMs: 1000 * 60 * 60, // 1 hour
    retryIntervalMs: 1000 * 60 * 5,    // 5 minutes
  },
  pagination: {
    defaultLimit: 20,
  },
  storage: {
    maxImageSizeMb: 5,
    buckets: {
      profiles: "profiles",
      clients: "client-photos",
      payments: "payment-proofs",
      invoices: "invoices",
      receipts: "receipts",
    }
  }
};
