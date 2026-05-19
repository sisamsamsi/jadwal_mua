import { db } from "../db/client";
import { payments } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { paymentService } from "../supabase/payments";
import { supabase } from "../supabase/client";

export const paymentRepository = {
  async getAll() {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return [];

    return await db.select().from(payments).where(eq(payments.userId, userId)).orderBy(payments.createdAt);
  },

  async getByBookingId(bookingId: string) {
    return await db.select().from(payments).where(eq(payments.bookingId, bookingId));
  },

  async create(data: any) {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    const newPayment = {
      ...data,
      userId: userId || data.userId,
      isSynced: false,
      localUpdatedAt: new Date().toISOString(),
    };

    await db.insert(payments).values(newPayment);

    // Background sync
    paymentService.create(data)
      .then(() => db.update(payments).set({ isSynced: true }).where(eq(payments.id, data.id)))
      .catch(() => {});

    return newPayment;
  },

  async update(id: string, data: any) {
    await db.update(payments)
      .set({ ...data, isSynced: false, localUpdatedAt: new Date().toISOString() })
      .where(eq(payments.id, id));

    // Background sync
    paymentService.update(id, data)
      .then(() => db.update(payments).set({ isSynced: true }).where(eq(payments.id, id)))
      .catch(() => {});
  },

  async delete(id: string) {
    await db.delete(payments).where(eq(payments.id, id));
    // Background sync
    paymentService.delete(id).catch(() => {});
  },

  async deleteAll() {
    await db.delete(payments);
    // Note: This only clears local for now
  }
};
