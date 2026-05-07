import { supabase } from "./client";
import { Tables } from "../constants/supabase";
import type { Payment } from "../types/payment";

export const paymentService = {
  async getAll() {
    const { data, error } = await supabase
      .from(Tables.payments)
      .select(`*, booking: ${Tables.bookings}(*, client: ${Tables.clients}(name))`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getByBookingId(bookingId: string) {
    const { data, error } = await supabase
      .from(Tables.payments)
      .select("*")
      .eq("booking_id", bookingId)
      .order("payment_date", { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(payment: Partial<Payment>) {
    const { data, error } = await supabase
      .from(Tables.payments)
      .insert(payment)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, payment: Partial<Payment>) {
    const { error } = await supabase
      .from(Tables.payments)
      .update(payment)
      .eq("id", id);
    if (error) throw error;
  },

  async delete(id: string) {
    const { error } = await supabase.from(Tables.payments).delete().eq("id", id);
    if (error) throw error;
  }
};
