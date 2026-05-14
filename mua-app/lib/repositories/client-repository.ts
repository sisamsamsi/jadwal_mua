import NetInfo from "@react-native-community/netinfo";
import * as Crypto from "expo-crypto";
import { db } from "../db/client";
import { clients } from "../db/schema";
import { clientsService } from "../supabase/clients";
import { eq, asc } from "drizzle-orm";

export const clientRepository = {
  async getAll() {
    // read local first
    const local = await db.select().from(clients).orderBy(asc(clients.name));

    // background sync
    NetInfo.fetch().then((s: any) => {
      if (s.isConnected) {
        syncClientsFromRemote().catch(() => {});
      }
    });

    return local as any;
  },

  async getById(id: string) {
    const rows = await db.select().from(clients).where(eq(clients.id, id));
    return rows[0] || null;
  },

  async create(payload: any) {
    const now = new Date().toISOString();
    const id = Crypto.randomUUID();
    const rec = {
      ...payload,
      id,
      createdAt: now,
      updatedAt: now,
      isSynced: false,
      localUpdatedAt: now,
    };
    await db.insert(clients).values(rec);

    const s = await NetInfo.fetch();
    if (s.isConnected) {
      try {
        await clientsService.create({ ...rec });
        await db.update(clients).set({ isSynced: true }).where(eq(clients.id, id));
      } catch (e) {
        console.warn("Sync create client failed:", e);
      }
    }

    return rec as any;
  },

  async update(id: string, updates: any) {
    const now = new Date().toISOString();
    await db
      .update(clients)
      .set({
        ...updates,
        updatedAt: now,
        isSynced: false,
        localUpdatedAt: now,
      } as any)
      .where(eq(clients.id, id));

    const s = await NetInfo.fetch();
    if (s.isConnected) {
      try {
        await clientsService.update(id, updates);
        await db.update(clients).set({ isSynced: true }).where(eq(clients.id, id));
      } catch (e) {
        console.warn("Sync update client failed:", e);
      }
    }
  },

  async delete(id: string) {
    await db.delete(clients).where(eq(clients.id, id));

    const s = await NetInfo.fetch();
    if (s.isConnected) {
      try {
        await clientsService.delete(id);
      } catch (e) {
        console.warn("Sync delete client failed:", e);
      }
    }
  },
};

function normalizeFromSupabase(c: any) {
  const normalized = {
    ...c,
    fullName: c.full_name,
    phoneNumber: c.phone_number,
    skinType: c.skin_type,
    skinConcerns: c.skin_concerns,
    allergies: c.allergies,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };

  // Remove snake_case
  delete (normalized as any).full_name;
  delete (normalized as any).phone_number;
  delete (normalized as any).skin_type;
  delete (normalized as any).skin_concerns;
  delete (normalized as any).allergies;
  delete (normalized as any).created_at;
  delete (normalized as any).updated_at;

  return normalized;
}

async function syncClientsFromRemote() {
  try {
    const remote = await clientsService.getAll();
    for (const c of remote) {
      const normalized = normalizeFromSupabase(c);
      try {
        await db
          .insert(clients)
          .values({
            ...normalized,
            isSynced: true,
            localUpdatedAt: new Date().toISOString(),
          })
          .onConflictDoUpdate({
            target: clients.id,
            set: {
              ...normalized,
              isSynced: true,
              localUpdatedAt: new Date().toISOString(),
            },
          });
      } catch (e) {
        try {
          await db
            .insert(clients)
            .values({
              ...normalized,
              isSynced: true,
              localUpdatedAt: new Date().toISOString(),
            });
        } catch (err) {
          await db
            .update(clients)
            .set({
              ...normalized,
              isSynced: true,
              localUpdatedAt: new Date().toISOString(),
            })
            .where(eq(clients.id, normalized.id));
        }
      }
    }
  } catch (e) {
    console.warn("syncClientsFromRemote failed:", e);
  }
}
