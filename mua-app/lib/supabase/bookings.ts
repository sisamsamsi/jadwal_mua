import { supabase } from "./client";
import { Tables, RpcFunctions } from "../constants/supabase";

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
    const { data, error } = await supabase
      .from(Tables.bookings)
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from(Tables.bookings)
      .update(updates)
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
