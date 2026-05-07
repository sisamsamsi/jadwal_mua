import { z } from "zod";

export const profileFormSchema = z.object({
  full_name: z.string().min(1, "Nama lengkap wajib diisi"),
  phone: z.string().optional(),
  business_name: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  bio: z.string().optional(),
  instagram_handle: z.string().optional(),
  whatsapp_number: z.string().optional(),
  avatar_url: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export interface Profile extends ProfileFormValues {
  id: string;
  email: string;
  license_type: string;
  license_key: string | null;
  license_expires_at: string | null;
  created_at: string;
  updated_at: string;
}
