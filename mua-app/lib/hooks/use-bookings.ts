import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingRepository } from "../repositories/booking-repository";
import { clientRepository } from "../repositories/client-repository";
import { useAuthStore } from "../stores/auth-store";

export const bookingKeys = {
  all: ["bookings"] as const,
  byDate: (date: string) => ["bookings", "date", date] as const,
  detail: (id: string) => ["bookings", "detail", id] as const,
};

export function useBookings() {
  return useQuery({
    queryKey: bookingKeys.all,
    queryFn: async () => {
      const bookings = await bookingRepository.getAll();
      const clients = await clientRepository.getAll();
      const clientMap = clients.reduce((acc: any, c: any) => ({ ...acc, [c.id]: c.name }), {});
      return bookings.map((b: any) => ({ ...b, clientName: clientMap[b.clientId] || "Klien Tidak Dikenal" }));
    },
  });
}

export function useBookingsByDate(date: string) {
  return useQuery({
    queryKey: bookingKeys.byDate(date),
    queryFn: async () => {
      const bookings = await bookingRepository.getByDate(date);
      const clients = await clientRepository.getAll();
      const clientMap = clients.reduce((acc: any, c: any) => ({ ...acc, [c.id]: c.name }), {});
      return bookings.map((b: any) => ({ ...b, clientName: clientMap[b.clientId] || "Klien Tidak Dikenal" }));
    },
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: async () => {
      const booking = await bookingRepository.getById(id);
      if (!booking) return null;
      const client = await clientRepository.getById(booking.clientId);
      return { ...booking, clientName: client?.name || "Klien Tidak Dikenal" };
    },
    enabled: !!id,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  const user = useAuthStore((s: any) => s.session?.user);

  return useMutation({
    mutationFn: (payload: any) => bookingRepository.create(user?.id ?? "", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.all });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useUpdateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: any) => bookingRepository.update(id, updates),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: bookingKeys.all });
      qc.invalidateQueries({ queryKey: bookingKeys.detail(variables.id) });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useDeleteBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookingRepository.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.all });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}
