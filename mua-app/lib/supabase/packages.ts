import { supabase } from "./client";
import { Tables } from "../constants/supabase";
import type { Package, PackageItem } from "../types/package";

export const packageService = {
  async getAll() {
    const { data, error } = await supabase
      .from(Tables.packages)
      .select(`*, items: ${Tables.packageItems}(*, service: ${Tables.services}(*))`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from(Tables.packages)
      .select(`*, items: ${Tables.packageItems}(*, service: ${Tables.services}(*))`)
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(pkg: Partial<Package>, items: Partial<PackageItem>[]) {
    const { data: newPkg, error: pkgError } = await supabase
      .from(Tables.packages)
      .insert(pkg)
      .select()
      .single();
    
    if (pkgError) throw pkgError;

    if (items.length > 0) {
      const itemsToInsert = items.map(item => ({
        ...item,
        package_id: newPkg.id
      }));
      const { error: itemsError } = await supabase
        .from(Tables.packageItems)
        .insert(itemsToInsert);
      
      if (itemsError) throw itemsError;
    }

    return newPkg;
  },

  async update(id: string, pkg: Partial<Package>, items?: Partial<PackageItem>[]) {
    const { error: pkgError } = await supabase
      .from(Tables.packages)
      .update(pkg)
      .eq("id", id);
    
    if (pkgError) throw pkgError;

    if (items) {
      // Simple strategy: delete all items and re-insert
      await supabase.from(Tables.packageItems).delete().eq("package_id", id);
      
      const itemsToInsert = items.map(item => ({
        ...item,
        package_id: id
      }));
      const { error: itemsError } = await supabase
        .from(Tables.packageItems)
        .insert(itemsToInsert);
      
      if (itemsError) throw itemsError;
    }
  },

  async delete(id: string) {
    const { error } = await supabase.from(Tables.packages).delete().eq("id", id);
    if (error) throw error;
  }
};
