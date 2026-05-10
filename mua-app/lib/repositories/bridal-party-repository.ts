import NetInfo from "@react-native-community/netinfo";
import * as Crypto from "expo-crypto";
import { db } from "../db/client";
import { bridalParty } from "../db/schema";
import { eq } from "drizzle-orm";

export const bridalPartyRepository = {
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
