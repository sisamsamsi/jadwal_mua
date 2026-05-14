import { supabase } from "./client";
import { Tables } from "../constants/supabase";

const mapToSupabase = (payload: any) => {
  const mapped: any = { ...payload };
  if (payload.userId) { mapped.user_id = payload.userId; delete mapped.userId; }
  if (payload.durationMinutes) { mapped.duration_minutes = payload.durationMinutes; delete mapped.durationMinutes; }
  if (payload.basePrice) { mapped.base_price = payload.basePrice; delete mapped.basePrice; } // Wait, payload.basePrice -> base_price
  if (payload.additionalPersonPrice) { mapped.additional_person_price = payload.additionalPersonPrice; delete mapped.additionalPersonPrice; }
  if (payload.isActive !== undefined) { mapped.is_active = payload.isActive; delete mapped.isActive; }
  if (payload.sortOrder !== undefined) { mapped.sort_order = payload.sortOrder; delete mapped.sortOrder; }
  if (payload.createdAt) { mapped.created_at = payload.createdAt; delete mapped.createdAt; }
  if (payload.updatedAt) { mapped.updated_at = payload.updatedAt; delete mapped.updatedAt; }
  
  // Clean up internal Drizzle fields if any
  delete mapped.isSynced;
  delete mapped.localUpdatedAt;
  
  return mapped;
};

export const servicesService = {
  async getAll(params?: { userId?: string }) {
    // Menghapus .order("sort_order") untuk menghindari kegagalan query jika kolom belum siap
    let query: any = supabase.from(Tables.services).select("*");
    if (params?.userId) query = query.eq("user_id", params.userId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase.from(Tables.services).select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  },

  async create(payload: any) {
    const mapped = mapToSupabase(payload);
    const { data, error } = await supabase.from(Tables.services).insert(mapped).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: any) {
    const mapped = mapToSupabase(updates);
    const { data, error } = await supabase.from(Tables.services).update(mapped).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase.from(Tables.services).delete().eq("id", id);
    if (error) throw error;
  },
};

