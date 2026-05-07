import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientRepository } from "../repositories/client-repository";

export const clientKeys = {
  all: ["clients"] as const,
  detail: (id: string) => ["clients", "detail", id] as const,
};

export function useClients() {
  return useQuery({ 
    queryKey: clientKeys.all, 
    queryFn: () => clientRepository.getAll() 
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () => clientRepository.getById(id),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({ 
    mutationFn: (payload: any) => clientRepository.create(payload), 
    onSuccess: () => qc.invalidateQueries({ queryKey: clientKeys.all }) 
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({ 
    mutationFn: ({ id, updates }: any) => clientRepository.update(id, updates), 
    onSuccess: () => qc.invalidateQueries({ queryKey: clientKeys.all }) 
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({ 
    mutationFn: (id: string) => clientRepository.delete(id), 
    onSuccess: () => qc.invalidateQueries({ queryKey: clientKeys.all }) 
  });
}
