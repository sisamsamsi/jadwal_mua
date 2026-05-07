import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { packageRepository } from "../repositories/package-repository";

export function usePackages() {
  const queryClient = useQueryClient();

  const packagesQuery = useQuery({
    queryKey: ["packages"],
    queryFn: () => packageRepository.getAll(),
  });

  const createPackageMutation = useMutation({
    mutationFn: ({ data, items }: { data: any; items: any[] }) => packageRepository.create(data, items),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["packages"] }),
  });

  const updatePackageMutation = useMutation({
    mutationFn: ({ id, data, items }: { id: string; data: any; items?: any[] }) =>
      packageRepository.update(id, data, items),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["packages"] }),
  });

  const deletePackageMutation = useMutation({
    mutationFn: (id: string) => packageRepository.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["packages"] }),
  });

  return {
    packages: packagesQuery.data ?? [],
    isLoading: packagesQuery.isLoading,
    createPackage: createPackageMutation.mutateAsync,
    updatePackage: updatePackageMutation.mutateAsync,
    deletePackage: deletePackageMutation.mutateAsync,
  };
}
