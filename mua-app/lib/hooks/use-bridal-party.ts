import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bridalPartyRepository } from "../repositories/bridal-party-repository";

export const bridalPartyKeys = {
  byBooking: (bookingId: string) => ["bridal-party", bookingId] as const,
};

export function useBridalParty(bookingId: string) {
  return useQuery({
    queryKey: bridalPartyKeys.byBooking(bookingId),
    queryFn: () => bridalPartyRepository.getByBookingId(bookingId),
    enabled: !!bookingId,
  });
}

export function useCreateBridalPartyMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => bridalPartyRepository.create(data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: bridalPartyKeys.byBooking(variables.bookingId) });
    },
  });
}

export function useUpdateBridalPartyMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates, bookingId }: any) => bridalPartyRepository.update(id, updates),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: bridalPartyKeys.byBooking(variables.bookingId) });
    },
  });
}

export function useDeleteBridalPartyMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: any) => bridalPartyRepository.delete(id),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: bridalPartyKeys.byBooking(variables.bookingId) });
    },
  });
}
