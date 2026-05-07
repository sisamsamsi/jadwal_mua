export enum SkinType {
  NORMAL = "normal",
  OILY = "oily",
  DRY = "dry",
  COMBINATION = "combination",
  SENSITIVE = "sensitive",
}

export enum ServiceCategory {
  BRIDAL = "bridal",
  PARTY = "party",
  PHOTOSHOOT = "photoshoot",
  GRADUATION = "graduation",
  ENGAGEMENT = "engagement",
  TUTORIAL = "tutorial",
  OTHER = "other",
}

export enum BookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum PaymentType {
  DP = "dp",
  FULL = "full",
  INSTALLMENT = "installment",
  REFUND = "refund",
}

export enum PaymentMethod {
  CASH = "cash",
  BANK_TRANSFER = "bank_transfer",
  EWALLET = "ewallet",
  OTHER = "other",
}

export enum InvoiceStatus {
  UNPAID = "unpaid",
  PARTIAL = "partial",
  PAID = "paid",
  CANCELLED = "cancelled",
}

export enum ExpenseCategory {
  PRODUCT = "product",
  MARKETING = "marketing",
  TRANSPORT = "transport",
  EQUIPMENT = "equipment",
  RENT = "rent",
  STAFF = "staff",
  OTHER = "other",
}

export enum ProductCategory {
  FOUNDATION = "foundation",
  LIPSTICK = "lipstick",
  EYESHADOW = "eyeshadow",
  SKINCARE = "skincare",
  TOOLS = "tools",
  OTHER = "other",
}

export enum ReminderType {
  BOOKING_H7 = "booking_h7",
  BOOKING_H3 = "booking_h3",
  BOOKING_H1 = "booking_h1",
  BOOKING_HDAY = "booking_hday",
  PAYMENT_DUE = "payment_due",
  FOLLOW_UP = "follow_up",
}

export enum BookingLogAction {
  CREATE = "create",
  UPDATE = "update",
  CANCEL = "cancel",
  PAYMENT = "payment",
  STATUS_CHANGE = "status_change",
}
