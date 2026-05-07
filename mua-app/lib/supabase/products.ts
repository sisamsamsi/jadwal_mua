import { supabase } from "./client";
import { Tables } from "../constants/supabase";
import type { Product } from "../types/product";

export const productService = {
  async getAll() {
    const { data, error } = await supabase
      .from(Tables.products)
      .select("*")
      .order("name", { ascending: true });
    if (error) throw error;
    return data;
  },

  async create(product: Partial<Product>) {
    const { data, error } = await supabase
      .from(Tables.products)
      .insert(product)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, product: Partial<Product>) {
    const { error } = await supabase
      .from(Tables.products)
      .update(product)
      .eq("id", id);
    if (error) throw error;
  },

  async delete(id: string) {
    const { error } = await supabase.from(Tables.products).delete().eq("id", id);
    if (error) throw error;
  }
};
