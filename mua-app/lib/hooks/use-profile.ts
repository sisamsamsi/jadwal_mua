import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileRepository } from "../repositories/profile-repository";
import { profilesService } from "../supabase/profiles";
import { useAuthStore } from "../stores/auth-store";

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
          profileRepository.update(userId, {
            subscriptionStatus: remoteProfile.subscription_status,
            trialEndsAt: remoteProfile.trial_ends_at,
            subscriptionEndsAt: remoteProfile.subscription_ends_at,
            fullName: remoteProfile.full_name,
            businessName: remoteProfile.business_name,
            phone: remoteProfile.phone,
            bio: remoteProfile.bio,
            profilePhotoUrl: remoteProfile.profile_photo_url,
            city: remoteProfile.city,
            instagramHandle: remoteProfile.instagram_handle,
            whatsappNumber: remoteProfile.whatsapp_number,
          }).catch(() => {/* Abaikan error SQLite saat update cache */});
        }
        return remoteProfile;
      } catch {
        // Fallback ke SQLite jika offline / Supabase tidak terjangkau
        return profileRepository.getById(userId);
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
