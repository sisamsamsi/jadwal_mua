import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { expenseRepository } from "../repositories/expense-repository";

export const expenseKeys = {
  all: ["expenses"] as const,
};

export function useExpenses() {
  return useQuery({
    queryKey: expenseKeys.all,
    queryFn: () => expenseRepository.getAll(),
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => expenseRepository.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: expenseKeys.all }),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expenseRepository.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: expenseKeys.all }),
  });
}
