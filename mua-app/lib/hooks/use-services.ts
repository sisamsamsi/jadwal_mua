import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { serviceRepository } from "../repositories/service-repository";

export const serviceKeys = {
  all: ["services"] as const,
  detail: (id: string) => ["services", "detail", id] as const,
};

export function useServices() {
  return useQuery({ 
    queryKey: serviceKeys.all, 
    queryFn: () => serviceRepository.getAll() 
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({ 
    mutationFn: (payload: any) => serviceRepository.create(payload), 
    onSuccess: () => qc.invalidateQueries({ queryKey: serviceKeys.all }) 
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({ 
    mutationFn: ({ id, updates }: any) => serviceRepository.update(id, updates), 
    onSuccess: () => qc.invalidateQueries({ queryKey: serviceKeys.all }) 
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({ 
    mutationFn: (id: string) => serviceRepository.delete(id), 
    onSuccess: () => qc.invalidateQueries({ queryKey: serviceKeys.all }) 
  });
}
