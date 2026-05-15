import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentRepository } from "../repositories/payment-repository";

export function usePayments() {
  return useQuery({
    queryKey: ["payments"],
    queryFn: () => paymentRepository.getAll(),
  });
}

export function usePaymentsByBooking(bookingId: string) {
  return useQuery({
    queryKey: ["payments", bookingId],
    queryFn: () => paymentRepository.getByBookingId(bookingId),
    enabled: !!bookingId,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => paymentRepository.create(data),
    onSuccess: (_, variables) => {
      // Invalidate semua yang berkaitan agar UI terupdate
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      if (variables.bookingId) {
        queryClient.invalidateQueries({ queryKey: ["payments", variables.bookingId] });
      }
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => paymentRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}
