import { db } from "../db/client";
import { invoices } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { invoiceService } from "../supabase/invoices";
import { supabase } from "../supabase/client";

export const invoiceRepository = {
  async getAll() {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return [];

    return await db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(invoices.createdAt);
  },

  async getByBookingId(bookingId: string) {
    return await db.select().from(invoices).where(eq(invoices.bookingId, bookingId));
  },

  async create(data: any) {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    const newInvoice = {
      ...data,
      userId: userId || data.userId,
      isSynced: false,
      localUpdatedAt: new Date().toISOString(),
    };

    await db.insert(invoices).values(newInvoice);

    // Background sync
    invoiceService.create(data)
      .then(() => db.update(invoices).set({ isSynced: true }).where(eq(invoices.id, data.id)))
      .catch(() => {});

    return newInvoice;
  },

  async update(id: string, data: any) {
    await db.update(invoices)
      .set({ ...data, isSynced: false, localUpdatedAt: new Date().toISOString() })
      .where(eq(invoices.id, id));

    // Background sync
    invoiceService.update(id, data)
      .then(() => db.update(invoices).set({ isSynced: true }).where(eq(invoices.id, id)))
      .catch(() => {});
  },

  async delete(id: string) {
    await db.delete(invoices).where(eq(invoices.id, id));
    // Background sync
    invoiceService.delete(id).catch(() => {});
  }
};
