import { z } from "zod";
import { ServiceCategory } from "./enums";

export const serviceFormSchema = z.object({
  name: z.string().min(1, "Nama layanan wajib diisi"),
  category: z.nativeEnum(ServiceCategory),
  description: z.string().optional(),
  duration_minutes: z.number().min(1, "Durasi wajib diisi"),
  base_price: z.number().min(0, "Harga tidak boleh negatif"),
  extra_person_price: z.number().min(0).default(0),
  is_active: z.boolean().default(true),
  sort_order: z.number().default(0),
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;

export interface Service extends ServiceFormValues {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_synced: boolean;
}
