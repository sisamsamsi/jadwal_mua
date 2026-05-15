import { supabase } from "@/lib/supabase/client";

export const aiService = {
  async parseBookingMessage(message: string) {
    try {
      const { data, error } = await supabase.functions.invoke("parse-booking", {
        body: { message }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("AI Parse Error:", error);
      throw error;
    }
  },

  async generateContent(task: 'caption' | 'whatsapp' | 'summary', context: any) {
    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { task, context }
      });

      if (error) throw error;
      return data?.content || "";
    } catch (error) {
      console.error("AI Generate Error:", error);
      throw error;
    }
  }
};
