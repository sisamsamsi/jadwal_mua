import NetInfo from "@react-native-community/netinfo";
import * as Crypto from "expo-crypto";
import { db } from "../db/client";
import { bridalParty, bookings } from "../db/schema";
import { eq, inArray } from "drizzle-orm";
import { supabase } from "../supabase/client";

export const bridalPartyRepository = {
  async getAll() {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return [];

    // Ambil semua ID booking milik user ini
    const userBookings = await db.select({ id: bookings.id }).from(bookings).where(eq(bookings.userId, userId));
    const bookingIds = userBookings.map(b => b.id);
    if (bookingIds.length === 0) return [];

    return await db.select().from(bridalParty).where(inArray(bridalParty.bookingId, bookingIds));
  },

  async getByBookingId(bookingId: string) {
    return await db.select().from(bridalParty).where(eq(bridalParty.bookingId, bookingId));
  },

  async create(data: any) {
    const now = new Date().toISOString();
    const id = Crypto.randomUUID();
    const newItem = {
      ...data,
      id,
      isSynced: false,
      localUpdatedAt: now,
    };
    await db.insert(bridalParty).values(newItem);
    return newItem;
  },

  async update(id: string, updates: any) {
    const now = new Date().toISOString();
    await db.update(bridalParty)
      .set({ ...updates, isSynced: false, localUpdatedAt: now })
      .where(eq(bridalParty.id, id));
  },

  async delete(id: string) {
    await db.delete(bridalParty).where(eq(bridalParty.id, id));
  }
};
