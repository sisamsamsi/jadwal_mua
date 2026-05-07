import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Nama produk wajib diisi"),
  brand: z.string().optional(),
  category: z.string().min(1, "Kategori wajib diisi"),
  current_stock: z.number().int().min(0).default(0),
  minimum_stock: z.number().int().min(0).default(5),
  purchase_price: z.number().min(0).optional(),
  expiry_date: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().default(true),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export interface Product extends ProductFormValues {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_synced: boolean;
}
