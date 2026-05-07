import { z } from "zod";

export const expenseSchema = z.object({
  description: z.string().min(1, "Deskripsi wajib diisi"),
  category: z.string().min(1, "Kategori wajib diisi"),
  amount: z.number().min(0),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid"),
  notes: z.string().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

export interface Expense extends ExpenseFormValues {
  id: string;
  user_id: string;
  created_at: string;
  is_synced: boolean;
}
