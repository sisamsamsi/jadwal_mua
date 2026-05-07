import { supabase } from "./client";
import { Tables } from "../constants/supabase";

export const clientsService = {
  async getAll(params?: { limit?: number; offset?: number }) {
    let query: any = supabase.from(Tables.clients).select("*").order("name", { ascending: true });
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
    const { data, error } = await supabase.from(Tables.clients).insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase.from(Tables.clients).update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase.from(Tables.clients).delete().eq("id", id);
    if (error) throw error;
  },
};
