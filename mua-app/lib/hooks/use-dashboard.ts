import { useQuery } from "@tanstack/react-query";
import { bookingRepository } from "../repositories/booking-repository";
import { clientRepository } from "../repositories/client-repository";
import { paymentRepository } from "../repositories/payment-repository";

export function useDashboardStats() {
  const statsQuery = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const allBookings = await bookingRepository.getAll();
      const clients = await clientRepository.getAll();
      const payments = await paymentRepository.getAll();

      // Gunakan semua booking agar filter UI bisa bekerja (termasuk status cancelled)
      const bookings = allBookings;

      const clientMap = clients.reduce((acc: any, client: any) => {
        acc[client.id] = client.name;
        return acc;
      }, {});

      const totalRevenue = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      const pendingBookings = bookings.filter((b: any) => b.status === "pending" || b.status === "confirmed").length;
      
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      
      // Agenda Hari Ini
      const todayBookings = bookings
        .filter((b: any) => b.bookingDate === todayStr)
        .map((b: any) => ({
          ...b,
          clientName: clientMap[b.clientId] || "Klien Umum"
        }));

      // Jadwal Mendatang (Setelah hari ini)
      const upcomingBookings = bookings
        .filter((b: any) => b.bookingDate > todayStr)
        .sort((a: any, b: any) => a.bookingDate.localeCompare(b.bookingDate))
        .slice(0, 5) // Ambil 5 jadwal terdekat
        .map((b: any) => ({
          ...b,
          clientName: clientMap[b.clientId] || "Klien Umum"
        }));

      return {
        totalRevenue,
        pendingBookings,
        totalClients: clients.length,
        todayBookingsCount: todayBookings.length,
        todayBookings,
        upcomingBookings,
      };
    },
  });

  return {
    stats: statsQuery.data,
    isLoading: statsQuery.isLoading,
  };
}
