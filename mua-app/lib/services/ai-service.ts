import { supabase } from "@/lib/supabase/client";

export const aiService = {
  async parseBookingMessage(message: string) {
    try {
      // Memanggil Supabase Edge Function 'parse-booking'
      // Ini AMAN karena API Key Groq disimpan di server (Supabase Secrets)
      const { data, error } = await supabase.functions.invoke("parse-booking", {
        body: { message }
      });

      if (error) {
        console.error("Edge Function Error:", error);
        throw new Error("Gagal menghubungi asisten AI di server.");
      }

      return data;
    } catch (error) {
      console.error("AI Parse Error:", error);
      throw error;
    }
  }
};
