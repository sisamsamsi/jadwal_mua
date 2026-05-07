import { z } from "zod";

export const packageSchema = z.object({
  name: z.string().min(1, "Nama paket wajib diisi"),
  description: z.string().optional(),
  total_price: z.number().min(0),
  is_active: z.boolean().default(true),
});

export type PackageFormValues = z.infer<typeof packageSchema>;

export interface Package extends PackageFormValues {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_synced: boolean;
}

export interface PackageItem {
  id: string;
  package_id: string;
  service_id: string;
  created_at: string;
  is_synced: boolean;
}
