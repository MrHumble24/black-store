import api from "@/shared/api/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type Provider = {
  id: number;
  name: string;
  contact?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateProviderPayload = {
  name: string;
  contact?: string;
};

export type UpdateProviderPayload = Partial<CreateProviderPayload> & {
  isActive?: boolean;
};

export const providersApi = {
  getAll: () => api.get<Provider[]>("/providers"),
  getOne: (id: number) => api.get<Provider>(`/providers/${id}`),
  create: (data: CreateProviderPayload) =>
    api.post<Provider>("/providers", data),
  update: (id: number, data: UpdateProviderPayload) =>
    api.patch<Provider>(`/providers/${id}`, data),
  delete: (id: number) => api.delete(`/providers/${id}`),
};

export const providerQueries = {
  useAll: () =>
    useQuery({
      queryKey: ["providers"],
      queryFn: () => providersApi.getAll().then((res) => res.data),
    }),

  useOne: (id: number) =>
    useQuery({
      queryKey: ["provider", id],
      queryFn: () => providersApi.getOne(id).then((res) => res.data),
      enabled: !!id,
    }),

  useCreate: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: CreateProviderPayload) => providersApi.create(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["providers"] });
        toast.success("Provider created successfully");
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || "Failed to create provider"
        );
      },
    });
  },

  useUpdate: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: number; data: UpdateProviderPayload }) =>
        providersApi.update(id, data),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ["providers"] });
        queryClient.invalidateQueries({ queryKey: ["provider", variables.id] });
        toast.success("Provider updated successfully");
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || "Failed to update provider"
        );
      },
    });
  },

  useDelete: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: number) => providersApi.delete(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["providers"] });
        toast.success("Provider deleted successfully");
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || "Failed to delete provider"
        );
      },
    });
  },
};
