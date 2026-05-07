import { z } from "zod";
import { SkinType } from "./enums";

export const clientFormSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  phone: z.string().min(8, "Nomor HP tidak valid"),
  email: z.string().email("Email tidak valid").nullable().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  skin_type: z.nativeEnum(SkinType).optional(),
  allergies: z.string().optional(),
  preferences: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  is_active: z.boolean().default(true),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;

export interface Client extends ClientFormValues {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_synced: boolean;
}
