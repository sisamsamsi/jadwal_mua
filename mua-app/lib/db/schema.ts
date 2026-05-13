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
  isSynced: integer("is_synced", { mode: "boolean" }).notNull().default(true),
  localUpdatedAt: text("local_updated_at"),
  subscriptionStatus: text("subscription_status").default("trial"),
  trialEndsAt: text("trial_ends_at"),
  subscriptionEndsAt: text("subscription_ends_at"),
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
  skinType: text("skin_type"),
  allergies: text("allergies"),
  preferences: text("preferences"),
  notes: text("notes"),
  tags: text("tags"),
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
  eventType: text("event_type"), // e.g., Akad, Resepsi, Fitting, Rapat
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
  clothingDesc: text("clothing_desc"),
  clothingSize: text("clothing_size"),
  makeupRequest: text("makeup_request"),
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
