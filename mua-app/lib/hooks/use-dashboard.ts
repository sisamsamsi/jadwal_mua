import { useQuery } from "@tanstack/react-query";
import { bookingRepository } from "../repositories/booking-repository";
import { clientRepository } from "../repositories/client-repository";
import { paymentRepository } from "../repositories/payment-repository";

export function useDashboardStats() {
  const statsQuery = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const bookings = await bookingRepository.getAll();
      const clients = await clientRepository.getAll();
      const payments = await paymentRepository.getAll();

      const totalRevenue = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      const pendingPayments = bookings.filter((b: any) => b.status !== "completed").length;
      
      const today = new Date().toISOString().split("T")[0];
      const todayBookings = bookings.filter((b: any) => b.bookingDate === today);

      return {
        totalRevenue,
        pendingPayments,
        totalClients: clients.length,
        todayBookingsCount: todayBookings.length,
        todayBookings,
      };
    },
  });

  return {
    stats: statsQuery.data,
    isLoading: statsQuery.isLoading,
  };
}
