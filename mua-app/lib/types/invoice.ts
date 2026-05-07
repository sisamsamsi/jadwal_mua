import { z } from "zod";

export const invoiceSchema = z.object({
  booking_id: z.string().uuid(),
  invoice_number: z.string(),
  subtotal: z.number().min(0),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  total_amount: z.number().min(0),
  paid_amount: z.number().min(0).default(0),
  status: z.enum(["draft", "sent", "paid", "partially_paid", "cancelled"]).default("draft"),
  due_date: z.string().optional(),
  notes: z.string().optional(),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export interface Invoice extends InvoiceFormValues {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_synced: boolean;
}
