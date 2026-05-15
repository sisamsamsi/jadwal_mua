import NetInfo from "@react-native-community/netinfo";
import * as Crypto from "expo-crypto";
import { db } from "../db/client";
import { bookings, clients, services } from "../db/schema";
import { bookingsService } from "../supabase/bookings";
import { eq, and, not, asc } from "drizzle-orm";
import { scheduleBookingReminder, cancelNotificationByBookingId } from "../utils/notifications";

export const bookingRepository = {
  async getAll() {
    // 1. Read from local
    const local = await db.select().from(bookings).orderBy(asc(bookings.bookingDate));

    // 2. Background sync (non-blocking)
    NetInfo.fetch().then((state: any) => {
      if (state.isConnected) {
        // We sync for a range around today for general dashboard
        syncBookingsFromRemote().catch(() => {});
      }
    });

    return local as any;
  },

  async getByDate(date: string) {
    // 1. Read from local SQLite
    const local = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.bookingDate, date),
          not(eq(bookings.status, "cancelled")),
        ),
      )
      .orderBy(asc(bookings.startTime));

    // 2. Background sync (non-blocking)
    NetInfo.fetch().then((state: any) => {
      if (state.isConnected) {
        syncBookingsFromRemote().catch(() => {});
      }
    });

    return local as any;
  },

  async getById(id: string) {
    const rows = await db
      .select({
        booking: bookings,
        client: clients,
        service: services,
      })
      .from(bookings)
      .leftJoin(clients, eq(bookings.clientId, clients.id))
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .where(eq(bookings.id, id));
    
    if (rows.length === 0) return null;
    
    return {
      ...rows[0].booking,
      client: rows[0].client,
      service: rows[0].service,
    } as any;
  },

  async create(userId: string, formData: any) {
    const now = new Date().toISOString();
    const id = Crypto.randomUUID();

    const newBooking = {
      id,
      userId,
      clientId: formData.clientId,
      serviceId: formData.serviceId ?? null,
      packageId: formData.packageId ?? null,
      bookingDate: formData.bookingDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      locationName: formData.locationName ?? null,
      locationAddress: formData.locationAddress ?? null,
      locationLat: formData.locationLat ?? null,
      locationLng: formData.locationLng ?? null,
      travelTimeMinutes: formData.travelTimeMinutes ?? 0,
      numPersons: formData.numPersons ?? 1,
      status: "pending",
      eventType: formData.eventType ?? null,
      notes: formData.notes ?? null,
      totalPrice: formData.totalPrice ?? 0,
      createdAt: now,
      updatedAt: now,
      isSynced: false,
      localUpdatedAt: now,
    };

    // insert into local db
    await db.insert(bookings).values(newBooking);

    // try sync to remote if online
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      try {
        // create remotely (send same id so we can keep consistent)
        await bookingsService.create(newBooking as any);
        // mark local as synced
        await db
          .update(bookings)
          .set({ isSynced: true })
          .where(eq(bookings.id, id));
      } catch (e) {
        console.warn("Sync create booking failed:", e);
      }
    }
    // 4. Schedule local reminder (1 hour before)
    try {
      const [year, month, day] = formData.bookingDate.split("-").map(Number);
      const [hour, minute] = formData.startTime.split(":").map(Number);
      const bookingDateObj = new Date(year, month - 1, day, hour, minute);
      const reminderDate = new Date(bookingDateObj.getTime() - 60 * 60 * 1000); // 1 hour before
      
      await scheduleBookingReminder(
        id,
        "Pengingat Jadwal Makeup",
        `Kamu ada jadwal makeup jam ${formData.startTime}`,
        reminderDate
      );
    } catch (e) {
      console.warn("Failed to schedule notification:", e);
    }
 
    return newBooking as any;
  },

  async update(id: string, updates: Partial<any>) {
    const now = new Date().toISOString();

    await db
      .update(bookings)
      .set({
        ...updates,
        updatedAt: now,
        isSynced: false,
        localUpdatedAt: now,
      } as any)
      .where(eq(bookings.id, id));

    const state = await NetInfo.fetch();
    if (state.isConnected) {
      try {
        await bookingsService.update(id, updates as any);
        await db
          .update(bookings)
          .set({ isSynced: true })
          .where(eq(bookings.id, id));
      } catch (e) {
        console.warn("Sync update booking failed:", e);
      }
    }
  },

  async delete(id: string) {
    // Cancel notifikasi lokal jika ada
    try {
      await cancelNotificationByBookingId(id);
    } catch (e) {
      console.warn("Gagal membatalkan notifikasi:", e);
    }

    // 1. Hapus dari SQLite Lokal
    await db.delete(bookings).where(eq(bookings.id, id));

    // 2. Hapus dari Remote (Supabase) jika online
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      try {
        await bookingsService.delete(id);
      } catch (e) {
        console.warn("Sync delete booking failed:", e);
      }
    }
  },

  async checkConflict(params: {
    bookingDate: string;
    startTime: string;
    endTime: string;
    travelTimeMinutes?: number;
    excludeBookingId?: string;
    userId?: string;
  }) {
    // Prefer RPC if online
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      return bookingsService.checkConflict({
        bookingDate: params.bookingDate,
        startTime: params.startTime,
        endTime: params.endTime,
        travelTimeMinutes: params.travelTimeMinutes,
        excludeBookingId: params.excludeBookingId,
      });
    }

    // fallback: local naive check
    const rows = await db
      .select()
      .from(bookings)
      .where(eq(bookings.bookingDate, params.bookingDate));
    const results: any[] = [];

    const newStart = toTimestamp(
      params.bookingDate,
      params.startTime,
      -(params.travelTimeMinutes ?? 0),
    );
    const newEnd = toTimestamp(
      params.bookingDate,
      params.endTime,
      params.travelTimeMinutes ?? 0,
    );

    for (const r of rows) {
      if (params.excludeBookingId && r.id === params.excludeBookingId) continue;
      if (r.status === "cancelled" || r.status === "rescheduled") continue;
      const existingStart = toTimestamp(
        r.bookingDate,
        r.startTime,
        -(r.travelTimeMinutes ?? 0),
      );
      const existingEnd = toTimestamp(
        r.bookingDate,
        r.endTime,
        r.travelTimeMinutes ?? 0,
      );
      if (newStart < existingEnd && newEnd > existingStart) {
        results.push({
          conflicting_booking_id: r.id,
          conflicting_client_name: r.clientId,
          conflicting_start_time: r.startTime,
          conflicting_end_time: r.endTime,
        });
      }
    }

    return results;
  },

  async getUnsyncedCount() {
    const rows = await db
      .select()
      .from(bookings)
      .where(eq(bookings.isSynced, false));
    return rows.length;
  },
};

function toTimestamp(
  dateStr: string,
  timeStr: string,
  travelOffsetMinutes = 0,
) {
  const iso = `${dateStr}T${timeStr}`;
  const d = new Date(iso);
  return new Date(d.getTime() + travelOffsetMinutes * 60 * 1000).getTime();
}

function normalizeFromSupabase(b: any) {
  const normalized = {
    id: b.id,
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
    travelTimeMinutes: b.travel_time_minutes ?? 0,
    numPersons: b.num_persons ?? 1,
    status: b.status || "pending",
    eventType: b.event_type,
    notes: b.notes,
    totalPrice: b.total_price ?? 0,
    cancellationReason: b.cancellation_reason,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  };

  return normalized;
}

async function syncBookingsFromRemote() {
  try {
    const today = new Date().toISOString().split("T")[0];
    const remote = await bookingsService.getAll({ fromDate: today });
    for (const b of remote) {
      const normalized = normalizeFromSupabase(b);
      // upsert local
      try {
        await db
          .insert(bookings)
          .values({
            ...normalized,
            isSynced: true,
            localUpdatedAt: new Date().toISOString(),
          })
          .onConflictDoUpdate({
            target: bookings.id,
            set: {
              ...normalized,
              isSynced: true,
              localUpdatedAt: new Date().toISOString(),
            },
          });
      } catch (e) {
        // if onConflictDoUpdate not supported, fallback to simple insert or update
        try {
          await db
            .insert(bookings)
            .values({
              ...normalized,
              isSynced: true,
              localUpdatedAt: new Date().toISOString(),
            });
        } catch (err) {
          // try update
          await db
            .update(bookings)
            .set({
              ...normalized,
              isSynced: true,
              localUpdatedAt: new Date().toISOString(),
            })
            .where(eq(bookings.id, normalized.id));
        }
      }
    }
  } catch (e) {
    console.warn("syncBookingsFromRemote failed:", e);
  }
}
