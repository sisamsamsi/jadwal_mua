import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { expenseRepository } from "../repositories/expense-repository";

export function useExpenses() {
  return useQuery({
    queryKey: ["expenses"],
    queryFn: () => expenseRepository.getAll(),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => expenseRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => expenseRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}
