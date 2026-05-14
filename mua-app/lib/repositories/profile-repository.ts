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
        // Map camelCase to snake_case for Supabase
        const supabaseUpdates: any = {};
        
        // Basic fields
        if (updates.email) supabaseUpdates.email = updates.email;
        if (updates.fullName) supabaseUpdates.full_name = updates.fullName;
        if (updates.businessName) supabaseUpdates.business_name = updates.businessName;
        if (updates.phone) supabaseUpdates.phone = updates.phone;
        if (updates.bio) supabaseUpdates.bio = updates.bio;
        if (updates.profilePhotoUrl) supabaseUpdates.profile_photo_url = updates.profilePhotoUrl;
        if (updates.city) supabaseUpdates.city = updates.city;
        if (updates.instagramHandle) supabaseUpdates.instagram_handle = updates.instagramHandle;
        if (updates.whatsappNumber) supabaseUpdates.whatsapp_number = updates.whatsappNumber;
        if (updates.fcmToken) supabaseUpdates.fcm_token = updates.fcmToken;
        
        // Subscription / License fields
        if (updates.subscriptionStatus) supabaseUpdates.subscription_status = updates.subscriptionStatus;
        if (updates.trialEndsAt) supabaseUpdates.trial_ends_at = updates.trialEndsAt;
        if (updates.subscriptionEndsAt) supabaseUpdates.subscription_ends_at = updates.subscriptionEndsAt;
        
        // Handle any other fields that might be passed directly in snake_case or already mapped
        // This is a safety measure
        Object.keys(updates).forEach(key => {
          if (!key.includes('_') && !supabaseUpdates[key] && !['fullName', 'businessName', 'profilePhotoUrl', 'instagramHandle', 'whatsappNumber', 'fcmToken', 'subscriptionStatus', 'trialEndsAt', 'subscriptionEndsAt'].includes(key)) {
            // If it's camelCase and not in our manual map, we could auto-convert, 
            // but let's stick to the manual map for now to be safe.
          }
        });

        const { error } = await supabase.from("profiles").upsert({
          id,
          ...supabaseUpdates,
          updated_at: new Date().toISOString()
        });
        
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
