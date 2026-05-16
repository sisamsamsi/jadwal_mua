import { supabase } from "./client";

export const profilesService = {
  async getById(id: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getAll() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*");
    
    if (error) throw error;
    return data;
  }
};
