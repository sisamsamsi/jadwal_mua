import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingRepository } from "../repositories/booking-repository";
import { useAuthStore } from "../stores/auth-store";

export const bookingKeys = {
  all: ["bookings"] as const,
  byDate: (date: string) => ["bookings", "date", date] as const,
  detail: (id: string) => ["bookings", "detail", id] as const,
};

export function useBookingsByDate(date: string) {
  return useQuery({
    queryKey: bookingKeys.byDate(date),
    queryFn: () => bookingRepository.getByDate(date),
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  const user = useAuthStore((s: any) => s.session?.user);

  return useMutation({
    mutationFn: (payload: any) => bookingRepository.create(user?.id ?? "", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: bookingKeys.all }),
  });
}

export function useUpdateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: any) => bookingRepository.update(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: bookingKeys.all }),
  });
}

export function useDeleteBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookingRepository.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: bookingKeys.all }),
  });
}
