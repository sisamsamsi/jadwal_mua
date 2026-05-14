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
        serviceRepository.pushUnsyncedServices().catch(() => {});
      }
    });
    return local as any;
  },

  async getById(id: string) {
    const rows = await db.select().from(services).where(eq(services.id, id));
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

  async pushUnsyncedServices() {
    try {
      const unsynced = await db.select().from(services).where(eq(services.isSynced, false));
      if (unsynced.length === 0) return;

      console.log(`Pushing ${unsynced.length} unsynced services...`);
      for (const service of unsynced) {
        try {
          await servicesService.update(service.id, service);
          await db.update(services).set({ isSynced: true }).where(eq(services.id, service.id));
        } catch (err) {
          // If update fails, try create (maybe it doesn't exist on remote yet)
          try {
            await servicesService.create(service);
            await db.update(services).set({ isSynced: true }).where(eq(services.id, service.id));
          } catch (createErr) {
            console.error(`Failed to push service ${service.id}:`, createErr);
          }
        }
      }
    } catch (e) {
      console.error("pushUnsyncedServices failed:", e);
    }
  }
};


async function syncServicesFromRemote() {
  try {
    const remote = await servicesService.getAll();
    for (const s of remote) {
      // Normalize snake_case from Supabase to camelCase for Drizzle
      const normalized = {
        ...s,
        userId: s.user_id,
        durationMinutes: s.duration_minutes,
        basePrice: s.base_price,
        additionalPersonPrice: s.extra_person_price,
        isActive: s.is_active,
        sortOrder: s.sort_order,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      };
      
      // Remove snake_case fields to avoid Drizzle errors
      delete (normalized as any).user_id;
      delete (normalized as any).duration_minutes;
      delete (normalized as any).base_price;
      delete (normalized as any).extra_person_price;
      delete (normalized as any).is_active;
      delete (normalized as any).sort_order;
      delete (normalized as any).created_at;
      delete (normalized as any).updated_at;

      try {
        await db
          .insert(services)
          .values({
            ...normalized,
            isSynced: true,
            localUpdatedAt: new Date().toISOString(),
          })
          .onConflictDoUpdate({
            target: services.id,
            set: {
              ...normalized,
              isSynced: true,
              localUpdatedAt: new Date().toISOString(),
            },
          });
      } catch (e) {
        console.error("Failed to sync individual service:", e);
      }
    }
  } catch (e) {
    console.warn("syncServicesFromRemote failed:", e);
  }
}
