import { supabase } from "./client";
import { Tables } from "../constants/supabase";

const mapToSupabase = (payload: any) => {
  const mapped: any = { ...payload };
  if (payload.userId) { mapped.user_id = payload.userId; delete mapped.userId; }
  if (payload.skinType) { mapped.skin_type = payload.skinType; delete mapped.skinType; }
  if (payload.createdAt) { mapped.created_at = payload.createdAt; delete mapped.createdAt; }
  if (payload.updatedAt) { mapped.updated_at = payload.updatedAt; delete mapped.updatedAt; }
  
  delete mapped.isSynced;
  delete mapped.localUpdatedAt;
  
  return mapped;
};

export const clientsService = {
  async getAll(params?: { limit?: number; offset?: number; userId?: string }) {
    let query: any = supabase.from(Tables.clients).select("*").order("name", { ascending: true });
    if (params?.userId) query = query.eq("user_id", params.userId);
    if (params?.limit) query = query.limit(params.limit);
    if (params?.offset && params?.limit) query = query.range(params.offset, params.offset + params.limit - 1);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase.from(Tables.clients).select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  },

  async create(payload: any) {
    const mapped = mapToSupabase(payload);
    const { data, error } = await supabase.from(Tables.clients).insert(mapped).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: any) {
    const mapped = mapToSupabase(updates);
    const { data, error } = await supabase.from(Tables.clients).update(mapped).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase.from(Tables.clients).delete().eq("id", id);
    if (error) throw error;
  },
};
