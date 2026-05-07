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
