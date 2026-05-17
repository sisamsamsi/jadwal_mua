import NetInfo from "@react-native-community/netinfo";
import { db } from "../db/client";
import * as schema from "../db/schema";
import { bookingsService } from "../supabase/bookings";
import { clientsService } from "../supabase/clients";
import { servicesService } from "../supabase/services";
import { profilesService } from "../supabase/profiles";
import { supabase } from "../supabase/client";
import { useSyncStore } from "../stores/sync-store";
import { eq, and, gte, not } from "drizzle-orm";
import { Platform } from "react-native";
import { scheduleAllBookingReminders } from "../utils/notifications";

export const syncRepository = {
  async fullSync() {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return;

    useSyncStore.getState().setSyncing(true);

    try {
      // Clients
      const remoteClients = await clientsService.getAll();
      for (const c of remoteClients) {
        const normalized = {
          id: c.id,
          userId: c.user_id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          address: c.address,
          city: c.city,
          skinType: c.skin_type,
          allergies: c.allergies,
          preferences: c.preferences,
          notes: c.notes,
          tags: c.tags ? (Array.isArray(c.tags) ? c.tags.join(",") : c.tags) : "",
          isActive: c.is_active ?? true,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
          isSynced: true,
          localUpdatedAt: new Date().toISOString()
        };

        try {
          await db.insert(schema.clients).values(normalized).onConflictDoUpdate({ target: schema.clients.id, set: normalized });
        } catch (e) {
          try {
            await db.insert(schema.clients).values(normalized);
          } catch (err) {
            await db.update(schema.clients).set(normalized).where(eq(schema.clients.id, normalized.id));
          }
        }
      }

      // Services
      const remoteServices = await servicesService.getAll();
      for (const s of remoteServices) {
        const normalized = {
          ...s,
          userId: s.user_id,
          durationMinutes: s.duration_minutes,
          basePrice: s.base_price,
          additionalPersonPrice: s.extra_person_price, // Match Supabase column
          isActive: s.is_active,
          sortOrder: s.sort_order,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
          isSynced: true,
          localUpdatedAt: new Date().toISOString()
        };
        // Remove snake_case
        delete (normalized as any).user_id;
        delete (normalized as any).duration_minutes;
        delete (normalized as any).base_price;
        delete (normalized as any).extra_person_price;
        delete (normalized as any).is_active;
        delete (normalized as any).sort_order;
        delete (normalized as any).created_at;
        delete (normalized as any).updated_at;

        try {
          await db.insert(schema.services).values(normalized).onConflictDoUpdate({ target: schema.services.id, set: normalized });
        } catch (e) {
          try {
            await db.insert(schema.services).values(normalized);
          } catch (err) {
            await db.update(schema.services).set(normalized).where(eq(schema.services.id, normalized.id));
          }
        }
      }

      // Bookings
      // Sync from 30 days ago to 1 year ahead to ensure all relevant bookings are captured
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 30);
      const fromDateStr = fromDate.toISOString().split("T")[0];
      
      const remoteBookings = await bookingsService.getAll({ fromDate: fromDateStr });
      for (const b of remoteBookings) {
        const normalized = {
          ...b,
          userId: b.user_id,
          clientId: b.client_id,
          serviceId: b.service_id,
          packageId: b.package_id,
          bookingDate: b.booking_date,
          startTime: b.start_time,
          endTime: b.end_time,
          locationName: b.location_name,
          locationAddress: b.location_address,
          locationLat: b.location_lat,
          locationLng: b.location_lng,
          travelTimeMinutes: b.travel_time_minutes,
          numPersons: b.num_persons,
          eventType: b.event_type,
          totalPrice: b.total_price,
          createdAt: b.created_at,
          updatedAt: b.updated_at,
          isSynced: true,
          localUpdatedAt: new Date().toISOString()
        };
        // Remove snake_case
        delete (normalized as any).user_id;
        delete (normalized as any).client_id;
        delete (normalized as any).service_id;
        delete (normalized as any).package_id;
        delete (normalized as any).booking_date;
        delete (normalized as any).start_time;
        delete (normalized as any).end_time;
        delete (normalized as any).location_name;
        delete (normalized as any).location_address;
        delete (normalized as any).location_lat;
        delete (normalized as any).location_lng;
        delete (normalized as any).travel_time_minutes;
        delete (normalized as any).num_persons;
        delete (normalized as any).event_type;
        delete (normalized as any).total_price;
        delete (normalized as any).created_at;
        delete (normalized as any).updated_at;

        try {
          await db.insert(schema.bookings).values(normalized).onConflictDoUpdate({ target: schema.bookings.id, set: normalized });
        } catch (e) {
          try {
            await db.insert(schema.bookings).values(normalized);
          } catch (err) {
            await db.update(schema.bookings).set(normalized).where(eq(schema.bookings.id, normalized.id));
          }
        }
      }

      // Profile Sync
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        try {
          const remoteProfile = await profilesService.getById(session.user.id);
          if (remoteProfile) {
            const normalized = {
              id: remoteProfile.id,
              email: remoteProfile.email,
              fullName: remoteProfile.full_name,
              phone: remoteProfile.phone,
              businessName: remoteProfile.business_name,
              bio: remoteProfile.bio,
              profilePhotoUrl: remoteProfile.profile_photo_url,
              city: remoteProfile.city,
              instagramHandle: remoteProfile.instagram_handle,
              whatsappNumber: remoteProfile.whatsapp_number,
              fcmToken: remoteProfile.fcm_token,
              createdAt: remoteProfile.created_at,
              updatedAt: remoteProfile.updated_at,
              subscriptionStatus: remoteProfile.subscription_status,
              trialEndsAt: remoteProfile.trial_ends_at,
              subscriptionEndsAt: remoteProfile.subscription_ends_at,
              isSynced: true,
              localUpdatedAt: new Date().toISOString()
            };
            
            await db.insert(schema.profiles).values(normalized).onConflictDoUpdate({ 
              target: schema.profiles.id, 
              set: normalized 
            });
          }
        } catch (profileErr) {
          console.warn("Profile sync failed:", profileErr);
        }
      }

      // Schedule reminders for all future synced bookings on mobile
      if (Platform.OS !== 'web') {
        try {
          const todayStr = new Date().toISOString().split("T")[0];
          const futureBookings = await db
            .select()
            .from(schema.bookings)
            .where(
              and(
                gte(schema.bookings.bookingDate, todayStr),
                not(eq(schema.bookings.status, 'cancelled'))
              )
            );
          
          for (const b of futureBookings) {
            await scheduleAllBookingReminders(b as any);
          }
        } catch (notifErr) {
          console.warn("Failed to schedule reminders after full sync:", notifErr);
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

