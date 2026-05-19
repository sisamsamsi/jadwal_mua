import { db } from "../db/client";
import { expenses } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { expenseService } from "../supabase/expenses";
import { supabase } from "../supabase/client";

export const expenseRepository = {
  async getAll() {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return [];

    return await db.select().from(expenses).where(eq(expenses.userId, userId)).orderBy(expenses.expenseDate);
  },

  async create(data: any) {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    const newExpense = {
      ...data,
      userId: userId || data.userId,
      isSynced: false,
      localUpdatedAt: new Date().toISOString(),
    };

    await db.insert(expenses).values(newExpense);

    // Background sync
    expenseService.create(data)
      .then(() => db.update(expenses).set({ isSynced: true }).where(eq(expenses.id, data.id)))
      .catch(() => {});

    return newExpense;
  },

  async update(id: string, data: any) {
    await db.update(expenses)
      .set({ ...data, isSynced: false, localUpdatedAt: new Date().toISOString() })
      .where(eq(expenses.id, id));

    // Background sync
    expenseService.update(id, data)
      .then(() => db.update(expenses).set({ isSynced: true }).where(eq(expenses.id, id)))
      .catch(() => {});
  },

  async delete(id: string) {
    await db.delete(expenses).where(eq(expenses.id, id));
    // Background sync
    expenseService.delete(id).catch(() => {});
  },
  
  async deleteAll() {
    await db.delete(expenses);
    // Note: Ini hanya menghapus data lokal saat ini
  }
};
