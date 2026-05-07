import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { packageRepository } from "../repositories/package-repository";

export function usePackages() {
  const queryClient = useQueryClient();

  const packagesQuery = useQuery({
    queryKey: ["packages"],
    queryFn: () => packageRepository.getAll(),
  });

  const createPackageMutation = useMutation({
    mutationFn: (data: any) => packageRepository.create(data, []),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["packages"] }),
  });

  const updatePackageMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      packageRepository.update(id, updates, []),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      queryClient.invalidateQueries({ queryKey: ["packages", "detail"] });
    },
  });

  const deletePackageMutation = useMutation({
    mutationFn: (id: string) => packageRepository.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["packages"] }),
  });

  return {
    packages: packagesQuery.data ?? [],
    isLoading: packagesQuery.isLoading,
    createPackage: createPackageMutation.mutateAsync,
    isCreating: createPackageMutation.isPending,
    updatePackage: updatePackageMutation.mutateAsync,
    isUpdating: updatePackageMutation.isPending,
    deletePackage: deletePackageMutation.mutateAsync,
  };
}

export function usePackage(id: string) {
  return useQuery({
    queryKey: ["packages", "detail", id],
    queryFn: () => packageRepository.getById(id),
    enabled: !!id,
  });
}
