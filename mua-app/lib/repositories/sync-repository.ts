import NetInfo from "@react-native-community/netinfo";
import { db } from "../db/client";
import * as schema from "../db/schema";
import { bookingsService } from "../supabase/bookings";
import { clientsService } from "../supabase/clients";
import { servicesService } from "../supabase/services";
import { useSyncStore } from "../stores/sync-store";
import { eq } from "drizzle-orm";

export const syncRepository = {
  async fullSync() {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return;

    useSyncStore.getState().setSyncing(true);

    try {
      // Clients
      const remoteClients = await clientsService.getAll();
      for (const c of remoteClients) {
        try {
          await db.insert(schema.clients).values({ ...(c as any), isSynced: true, localUpdatedAt: new Date().toISOString() }).onConflictDoUpdate({ target: schema.clients.id, set: { ...(c as any), isSynced: true, localUpdatedAt: new Date().toISOString() } });
        } catch (e) {
          try {
            await db.insert(schema.clients).values({ ...(c as any), isSynced: true, localUpdatedAt: new Date().toISOString() });
          } catch (err) {
            await db.update(schema.clients).set({ ...(c as any), isSynced: true, localUpdatedAt: new Date().toISOString() }).where(eq(schema.clients.id, c.id));
          }
        }
      }

      // Services
      const remoteServices = await servicesService.getAll();
      for (const s of remoteServices) {
        try {
          await db.insert(schema.services).values({ ...(s as any), isSynced: true, localUpdatedAt: new Date().toISOString() }).onConflictDoUpdate({ target: schema.services.id, set: { ...(s as any), isSynced: true, localUpdatedAt: new Date().toISOString() } });
        } catch (e) {
          try {
            await db.insert(schema.services).values({ ...(s as any), isSynced: true, localUpdatedAt: new Date().toISOString() });
          } catch (err) {
            await db.update(schema.services).set({ ...(s as any), isSynced: true, localUpdatedAt: new Date().toISOString() }).where(eq(schema.services.id, s.id));
          }
        }
      }

      // Bookings
      const today = new Date().toISOString().split("T")[0];
      const remoteBookings = await bookingsService.getByDate(today);
      for (const b of remoteBookings) {
        try {
          await db.insert(schema.bookings).values({ ...(b as any), isSynced: true, localUpdatedAt: new Date().toISOString() }).onConflictDoUpdate({ target: schema.bookings.id, set: { ...(b as any), isSynced: true, localUpdatedAt: new Date().toISOString() } });
        } catch (e) {
          try {
            await db.insert(schema.bookings).values({ ...(b as any), isSynced: true, localUpdatedAt: new Date().toISOString() });
          } catch (err) {
            await db.update(schema.bookings).set({ ...(b as any), isSynced: true, localUpdatedAt: new Date().toISOString() }).where(eq(schema.bookings.id, b.id));
          }
        }
      }

      useSyncStore.getState().setLastSync(new Date().toISOString());
    } catch (e) {
      console.warn("Full sync failed:", e);
    } finally {
      useSyncStore.getState().setSyncing(false);
    }
  },

  async pushUnsyncedData() {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return;

    useSyncStore.getState().setSyncing(true);

    try {
      const unsyncedBookings = await db.select().from(schema.bookings).where(eq(schema.bookings.isSynced, false));
      for (const b of unsyncedBookings) {
        try {
          await bookingsService.create(b as any);
          await db.update(schema.bookings).set({ isSynced: true }).where(eq(schema.bookings.id, b.id));
        } catch (e) {
          console.warn(`Failed to sync booking ${b.id}:`, e);
        }
      }

      // similar push logic for clients/services/payments etc can be added here
    } finally {
      useSyncStore.getState().setSyncing(false);
    }
  },

  startConnectivityListener() {
    const unsubscribe = NetInfo.addEventListener((state: any) => {
      const wasOffline = !useSyncStore.getState().isOnline;
      const isNowOnline = state.isConnected === true;

      useSyncStore.getState().setOnline(isNowOnline);

      if (wasOffline && isNowOnline) {
        // push unsynced and full sync
        this.pushUnsyncedData();
        this.fullSync();
      }
    });

    return unsubscribe;
  },
};

