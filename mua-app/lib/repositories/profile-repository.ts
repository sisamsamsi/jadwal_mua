import { db } from "../db/client";
import { profiles } from "../db/schema";
import { eq } from "drizzle-orm";
import { supabase } from "../supabase/client";

export const profileRepository = {
  async getById(id: string) {
    const result = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
    return result[0] || null;
  },

  async update(id: string, updates: any) {
    const now = new Date().toISOString();
    
    // Check if profile exists
    const existing = await this.getById(id);
    
    if (existing) {
      const data = {
        ...updates,
        isSynced: false,
        localUpdatedAt: now,
        updatedAt: now,
      };
      await db.update(profiles).set(data).where(eq(profiles.id, id));
    } else {
      // Create new local profile if missing
      const data = {
        id,
        email: updates.email || "", // Should ideally come from session
        ...updates,
        createdAt: now,
        updatedAt: now,
        isSynced: false,
        localUpdatedAt: now,
      };
      await db.insert(profiles).values(data);
    }

    // Background sync to Supabase
    const syncToSupabase = async () => {
      try {
        const { error } = await supabase.from("profiles").update(updates).eq("id", id);
        if (!error) {
          await db.update(profiles).set({ isSynced: true }).where(eq(profiles.id, id));
        }
      } catch (err) {
        console.error("Profile sync error:", err);
      }
    };
    
    syncToSupabase();

    return { id, ...updates };
  }
};
