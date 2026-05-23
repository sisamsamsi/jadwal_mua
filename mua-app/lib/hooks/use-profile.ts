import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileRepository } from "../repositories/profile-repository";
import { profilesService } from "../supabase/profiles";
import { useAuthStore } from "../stores/auth-store";
import { useSettingsStore } from "../stores/settings-store";

/**
 * Hook utama untuk data profil.
 * Fetch langsung dari Supabase agar subscription status selalu fresh.
 * Fallback ke SQLite lokal jika offline (staleTime memungkinkan ini).
 */
export function useProfile() {
  const session = useAuthStore(s => s.session);
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      try {
        // Fetch langsung dari Supabase — selalu data terbaru
        const remoteProfile = await profilesService.getById(userId);
        // Simpan ke SQLite sebagai cache offline (fire and forget)
        if (remoteProfile) {
          const mappedProfile = {
            id: remoteProfile.id,
            email: remoteProfile.email,
            fullName: remoteProfile.full_name,
            phone: remoteProfile.phone,
            businessName: remoteProfile.business_name,
            bio: remoteProfile.bio,
            profilePhotoUrl: remoteProfile.profile_photo_url,
            city: remoteProfile.city,
            instagramHandle: remoteProfile.instagram_handle,
            whatsappNumber: remoteProfile.whatsapp_number,
            fcmToken: remoteProfile.fcm_token,
            createdAt: remoteProfile.created_at,
            updatedAt: remoteProfile.updated_at,
            subscriptionStatus: remoteProfile.subscription_status,
            trialEndsAt: remoteProfile.trial_ends_at,
            subscriptionEndsAt: remoteProfile.subscription_ends_at,
          };

          profileRepository.update(userId, mappedProfile, true).catch(() => {/* Abaikan error SQLite saat update cache */});
          
          // Backward compatibility check untuk Zustand store
          const status = mappedProfile.subscriptionStatus ?? "trial";
          const trialEndsAt = mappedProfile.trialEndsAt ? new Date(mappedProfile.trialEndsAt) : null;
          const subscriptionEndsAt = mappedProfile.subscriptionEndsAt ? new Date(mappedProfile.subscriptionEndsAt) : null;
          const now = new Date();
          const isPremium = status === "active" 
            ? (subscriptionEndsAt ? subscriptionEndsAt > now : true) 
            : (status === "trial" ? (trialEndsAt ? trialEndsAt > now : false) : false);

          useSettingsStore.getState().setLicenseStatus(isPremium);

          return mappedProfile;
        }
        return null;
      } catch (err) {
        console.warn("useProfile: Failed to fetch remote profile, falling back to local SQLite", err);
        // Fallback ke SQLite jika offline / Supabase tidak terjangkau
        const localProfile = await profileRepository.getById(userId);
        if (localProfile) {
          const status = localProfile.subscriptionStatus ?? "trial";
          const trialEndsAt = localProfile.trialEndsAt ? new Date(localProfile.trialEndsAt) : null;
          const subscriptionEndsAt = localProfile.subscriptionEndsAt ? new Date(localProfile.subscriptionEndsAt) : null;
          const now = new Date();
          const isPremium = status === "active" 
            ? (subscriptionEndsAt ? subscriptionEndsAt > now : true) 
            : (status === "trial" ? (trialEndsAt ? trialEndsAt > now : false) : false);

          useSettingsStore.getState().setLicenseStatus(isPremium);
        }
        return localProfile;
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 menit — re-fetch otomatis setelah 2 menit
    gcTime: 1000 * 60 * 10,   // Simpan cache 10 menit
    retry: 1,
  });
}

/**
 * Hook untuk memaksa refresh profil dari Supabase.
 * Gunakan ini setelah AppState berubah ke 'active'.
 */
export function useRefreshProfile() {
  const queryClient = useQueryClient();
  const session = useAuthStore(s => s.session);
  const userId = session?.user?.id;

  return () => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    }
  };
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const session = useAuthStore(s => s.session);
  const userId = session?.user?.id;

  return useMutation({
    mutationFn: (updates: any) => userId
      ? profileRepository.update(userId, updates)
      : Promise.reject("No user ID"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    },
  });
}
