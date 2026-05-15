import { useProfile } from "./use-profile";

/**
 * Hook untuk mengecek status langganan user.
 * Sumber data: tabel `profiles` via SQLite lokal (sudah disinkronkan dari Supabase).
 */
export function useSubscription() {
  const { data: profile, isLoading } = useProfile();

  const status = profile?.subscriptionStatus ?? "trial";
  const trialEndsAt = profile?.trialEndsAt ? new Date(profile.trialEndsAt) : null;
  const subscriptionEndsAt = profile?.subscriptionEndsAt ? new Date(profile.subscriptionEndsAt) : null;

  const now = new Date();

  const isPremium = (() => {
    if (status === "active") {
      return subscriptionEndsAt ? subscriptionEndsAt > now : true;
    }
    if (status === "trial") {
      return trialEndsAt ? trialEndsAt > now : false;
    }
    return false;
  })();

  const isTrial = status === "trial";
  const isExpired = !isPremium;
  const daysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  return {
    isPremium,
    isTrial,
    isExpired,
    status,
    daysLeft,
    isLoading,
  };
}
