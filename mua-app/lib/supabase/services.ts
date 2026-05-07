import { supabase } from "./client";
import { Tables } from "../constants/supabase";

export const servicesService = {
  async getAll(params?: { userId?: string }) {
    let query: any = supabase.from(Tables.services).select("*").order("sort_order", { ascending: true });
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
    const { data, error } = await supabase.from(Tables.services).insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase.from(Tables.services).update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase.from(Tables.services).delete().eq("id", id);
    if (error) throw error;
  },
};
