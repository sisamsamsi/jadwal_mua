import { supabase } from "./client";
import { Tables, RpcFunctions } from "../constants/supabase";

const mapToSupabase = (payload: any) => {
  const mapped: any = { ...payload };
  if (payload.userId) { mapped.user_id = payload.userId; delete mapped.userId; }
  if (payload.clientId) { mapped.client_id = payload.clientId; delete mapped.clientId; }
  if (payload.serviceId) { mapped.service_id = payload.serviceId; delete mapped.serviceId; }
  if (payload.packageId) { mapped.package_id = payload.packageId; delete mapped.packageId; }
  if (payload.bookingDate) { mapped.booking_date = payload.bookingDate; delete mapped.bookingDate; }
  if (payload.startTime) { mapped.start_time = payload.startTime; delete mapped.startTime; }
  if (payload.endTime) { mapped.end_time = payload.endTime; delete mapped.endTime; }
  if (payload.locationName) { mapped.location_name = payload.locationName; delete mapped.locationName; }
  if (payload.locationAddress) { mapped.location_address = payload.locationAddress; delete mapped.locationAddress; }
  if (payload.locationLat) { mapped.location_lat = payload.locationLat; delete mapped.locationLat; }
  if (payload.locationLng) { mapped.location_lng = payload.locationLng; delete mapped.locationLng; }
  if (payload.travelTimeMinutes !== undefined) { mapped.travel_time_minutes = payload.travelTimeMinutes; delete mapped.travelTimeMinutes; }
  if (payload.numPersons !== undefined) { mapped.num_persons = payload.numPersons; delete mapped.numPersons; }
  if (payload.eventType) { mapped.event_type = payload.eventType; delete mapped.eventType; }
  if (payload.totalPrice !== undefined) { mapped.total_price = payload.totalPrice; delete mapped.totalPrice; }
  if (payload.createdAt) { mapped.created_at = payload.createdAt; delete mapped.createdAt; }
  if (payload.updatedAt) { mapped.updated_at = payload.updatedAt; delete mapped.updatedAt; }
  
  delete mapped.isSynced;
  delete mapped.localUpdatedAt;
  
  return mapped;
};

export const bookingsService = {
  async getAll(params?: {
    fromDate?: string;
    toDate?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    let query: any = supabase
      .from(Tables.bookings)
      .select("*")
      .order("booking_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (params?.fromDate) query = query.gte("booking_date", params.fromDate);
    if (params?.toDate) query = query.lte("booking_date", params.toDate);
    if (params?.status) query = query.eq("status", params.status);
    if (params?.limit) query = query.limit(params.limit);
    if (params?.offset && params?.limit)
      query = query.range(params.offset, params.offset + params.limit - 1);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from(Tables.bookings)
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async getByDate(date: string) {
    const { data, error } = await supabase
      .from(Tables.bookings)
      .select("*")
      .eq("booking_date", date)
      .neq("status", "cancelled")
      .order("start_time", { ascending: true });
    if (error) throw error;
    return data;
  },

  async create(payload: any) {
    const mapped = mapToSupabase(payload);
    const { data, error } = await supabase
      .from(Tables.bookings)
      .insert(mapped)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: any) {
    const mapped = mapToSupabase(updates);
    const { data, error } = await supabase
      .from(Tables.bookings)
      .update(mapped)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from(Tables.bookings)
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  async checkConflict(params: {
    bookingDate: string;
    startTime: string;
    endTime: string;
    travelTimeMinutes?: number;
    excludeBookingId?: string;
  }) {
    // Try to get current user id from session
    let currentUserId: string | null = null;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      currentUserId = sessionData?.session?.user?.id ?? null;
    } catch (e) {
      currentUserId = null;
    }

    const { data, error } = await supabase.rpc(
      RpcFunctions.checkBookingConflict,
      {
        p_user_id: currentUserId,
        p_booking_date: params.bookingDate,
        p_start_time: params.startTime,
        p_end_time: params.endTime,
        p_travel_time_minutes: params.travelTimeMinutes ?? 0,
        p_exclude_booking_id: params.excludeBookingId ?? null,
      },
    );

    if (error) throw error;
    return data ?? [];
  },
};
