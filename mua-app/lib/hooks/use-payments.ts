import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentRepository } from "../repositories/payment-repository";

export function usePayments(bookingId?: string) {
  const queryClient = useQueryClient();

  const paymentsQuery = useQuery({
    queryKey: bookingId ? ["payments", bookingId] : ["payments"],
    queryFn: () => bookingId ? paymentRepository.getByBookingId(bookingId) : paymentRepository.getAll(),
  });

  const createPaymentMutation = useMutation({
    mutationFn: (data: any) => paymentRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      if (bookingId) queryClient.invalidateQueries({ queryKey: ["payments", bookingId] });
    },
  });

  return {
    payments: paymentsQuery.data ?? [],
    isLoading: paymentsQuery.isLoading,
    createPayment: createPaymentMutation.mutateAsync,
  };
}
