import { z } from "zod";

export const paymentSchema = z.object({
  booking_id: z.string().uuid(),
  amount: z.number().min(0),
  payment_type: z.string(), // e.g. "DP", "Final", "Full"
  payment_method: z.string().default("transfer"),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional(),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;

export interface Payment extends PaymentFormValues {
  id: string;
  user_id: string;
  created_at: string;
  is_synced: boolean;
}
