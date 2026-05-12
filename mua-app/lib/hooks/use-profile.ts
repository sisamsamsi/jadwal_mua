import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileRepository } from "../repositories/profile-repository";
import { useAuthStore } from "../stores/auth-store";

export function useProfile() {
  const session = useAuthStore(s => s.session);
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ["profile", userId],
    queryFn: () => userId ? profileRepository.getById(userId) : null,
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const session = useAuthStore(s => s.session);
  const userId = session?.user?.id;

  return useMutation({
    mutationFn: (updates: any) => userId ? profileRepository.update(userId, updates) : Promise.reject("No user ID"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    },
  });
}
