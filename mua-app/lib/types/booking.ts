import { z } from "zod";
import { BookingStatus } from "./enums";

export const bookingFormSchema = z.object({
  client_id: z.string().uuid("Klien wajib dipilih"),
  service_id: z.string().uuid().nullable().optional(),
  package_id: z.string().uuid().nullable().optional(),
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid"),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Waktu mulai tidak valid"),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "Waktu selesai tidak valid"),
  location_name: z.string().min(1, "Lokasi wajib diisi"),
  location_address: z.string().optional(),
  travel_time_minutes: z.number().min(0).default(0),
  num_persons: z.number().min(1).default(1),
  total_price: z.number().min(0),
  notes: z.string().optional(),
  status: z.nativeEnum(BookingStatus).default(BookingStatus.PENDING),
}).refine((data: any) => data.service_id || data.package_id, {
  message: "Pilih minimal satu layanan atau paket",
  path: ["service_id"]
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

export interface Booking extends BookingFormValues {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_synced: boolean;
}
