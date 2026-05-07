import { supabase } from "./client";
import { Tables } from "../constants/supabase";
import type { Expense } from "../types/expense";

export const expenseService = {
  async getAll() {
    const { data, error } = await supabase
      .from(Tables.expenses)
      .select("*")
      .order("expense_date", { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(expense: Partial<Expense>) {
    const { data, error } = await supabase
      .from(Tables.expenses)
      .insert(expense)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, expense: Partial<Expense>) {
    const { error } = await supabase
      .from(Tables.expenses)
      .update(expense)
      .eq("id", id);
    if (error) throw error;
  },

  async delete(id: string) {
    const { error } = await supabase.from(Tables.expenses).delete().eq("id", id);
    if (error) throw error;
  }
};
