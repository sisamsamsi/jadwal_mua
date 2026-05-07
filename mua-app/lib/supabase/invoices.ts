import { supabase } from "./client";
import { Tables } from "../constants/supabase";
import type { Invoice } from "../types/invoice";

export const invoiceService = {
  async getAll() {
    const { data, error } = await supabase
      .from(Tables.invoices)
      .select(`*, booking: ${Tables.bookings}(*, client: ${Tables.clients}(name, phone, address))`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getByBookingId(bookingId: string) {
    const { data, error } = await supabase
      .from(Tables.invoices)
      .select("*")
      .eq("booking_id", bookingId)
      .single();
    if (error) throw error;
    return data;
  },

  async create(invoice: Partial<Invoice>) {
    const { data, error } = await supabase
      .from(Tables.invoices)
      .insert(invoice)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, invoice: Partial<Invoice>) {
    const { error } = await supabase
      .from(Tables.invoices)
      .update(invoice)
      .eq("id", id);
    if (error) throw error;
  },

  async delete(id: string) {
    const { error } = await supabase.from(Tables.invoices).delete().eq("id", id);
    if (error) throw error;
  }
};
