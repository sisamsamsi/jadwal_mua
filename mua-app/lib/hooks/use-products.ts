import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productRepository } from "../repositories/product-repository";

export const productKeys = {
  all: ["products"] as const,
};

export function useProducts() {
  return useQuery({
    queryKey: productKeys.all,
    queryFn: () => productRepository.getAll(),
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => productRepository.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => productRepository.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productRepository.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}
