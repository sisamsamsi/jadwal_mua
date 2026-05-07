import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoiceRepository } from "../repositories/invoice-repository";

export function useInvoices(bookingId?: string) {
  const queryClient = useQueryClient();

  const invoicesQuery = useQuery({
    queryKey: bookingId ? ["invoices", bookingId] : ["invoices"],
    queryFn: () => bookingId ? invoiceRepository.getByBookingId(bookingId) : invoiceRepository.getAll(),
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data: any) => invoiceRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      if (bookingId) queryClient.invalidateQueries({ queryKey: ["invoices", bookingId] });
    },
  });

  return {
    invoices: invoicesQuery.data ?? [],
    isLoading: invoicesQuery.isLoading,
    createInvoice: createInvoiceMutation.mutateAsync,
  };
}
