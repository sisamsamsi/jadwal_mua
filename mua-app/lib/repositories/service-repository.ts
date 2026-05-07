import NetInfo from "@react-native-community/netinfo";
import * as Crypto from "expo-crypto";
import { db } from "../db/client";
import { services } from "../db/schema";
import { servicesService } from "../supabase/services";
import { eq, asc } from "drizzle-orm";

export const serviceRepository = {
  async getAll() {
    const local = await db
      .select()
      .from(services)
      .orderBy(asc(services.sortOrder));
    NetInfo.fetch().then((s: any) => {
      if (s.isConnected) {
        syncServicesFromRemote().catch(() => {});
      }
    });
    return local as any;
  },

  async getById(id: string) {
    const rows = await db.select().from(services).where(eq(services.id, id));
    return rows[0] as any;
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
    await db.insert(services).values(rec);

    const s = await NetInfo.fetch();
    if (s.isConnected) {
      try {
        await servicesService.create({ ...rec });
        await db
          .update(services)
          .set({ isSynced: true })
          .where(eq(services.id, id));
      } catch (e) {
        console.warn("Sync create service failed:", e);
      }
    }

    return rec as any;
  },

  async update(id: string, updates: any) {
    const now = new Date().toISOString();
    await db
      .update(services)
      .set({
        ...updates,
        updatedAt: now,
        isSynced: false,
        localUpdatedAt: now,
      } as any)
      .where(eq(services.id, id));

    const s = await NetInfo.fetch();
    if (s.isConnected) {
      try {
        await servicesService.update(id, updates);
        await db
          .update(services)
          .set({ isSynced: true })
          .where(eq(services.id, id));
      } catch (e) {
        console.warn("Sync update service failed:", e);
      }
    }
  },

  async delete(id: string) {
    await db.delete(services).where(eq(services.id, id));

    const s = await NetInfo.fetch();
    if (s.isConnected) {
      try {
        await servicesService.delete(id);
      } catch (e) {
        console.warn("Sync delete service failed:", e);
      }
    }
  },
};

async function syncServicesFromRemote() {
  try {
    const remote = await servicesService.getAll();
    for (const s of remote) {
      try {
        await db
          .insert(services)
          .values({
            ...(s as any),
            isSynced: true,
            localUpdatedAt: new Date().toISOString(),
          })
          .onConflictDoUpdate({
            target: services.id,
            set: {
              ...(s as any),
              isSynced: true,
              localUpdatedAt: new Date().toISOString(),
            },
          });
      } catch (e) {
        try {
          await db
            .insert(services)
            .values({
              ...(s as any),
              isSynced: true,
              localUpdatedAt: new Date().toISOString(),
            });
        } catch (err) {
          await db
            .update(services)
            .set({
              ...(s as any),
              isSynced: true,
              localUpdatedAt: new Date().toISOString(),
            })
            .where(eq(services.id, s.id));
        }
      }
    }
  } catch (e) {
    console.warn("syncServicesFromRemote failed:", e);
  }
}
