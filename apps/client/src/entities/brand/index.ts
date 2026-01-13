import api from "@/shared/api/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type Brand = {
  id: number;
  name: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateBrandPayload = {
  name: string;
};

export type UpdateBrandPayload = {
  name?: string;
  isActive?: boolean;
};

export const brandsApi = {
  getAll: () => api.get<Brand[]>("/brands"),
  getOne: (id: number) => api.get<Brand>(`/brands/${id}`),
  create: (data: CreateBrandPayload) => api.post<Brand>("/brands", data),
  update: (id: number, data: UpdateBrandPayload) =>
    api.patch<Brand>(`/brands/${id}`, data),
  delete: (id: number) => api.delete(`/brands/${id}`),
};

export const brandQueries = {
  useAll: () =>
    useQuery({
      queryKey: ["brands"],
      queryFn: () => brandsApi.getAll().then((res) => res.data),
    }),

  useOne: (id: number) =>
    useQuery({
      queryKey: ["brand", id],
      queryFn: () => brandsApi.getOne(id).then((res) => res.data),
      enabled: !!id,
    }),

  useCreate: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: CreateBrandPayload) => brandsApi.create(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["brands"] });
        toast.success("Brand created successfully");
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to create brand");
      },
    });
  },

  useUpdate: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: number; data: UpdateBrandPayload }) =>
        brandsApi.update(id, data),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ["brands"] });
        queryClient.invalidateQueries({ queryKey: ["brand", variables.id] });
        toast.success("Brand updated successfully");
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to update brand");
      },
    });
  },

  useDelete: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: number) => brandsApi.delete(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["brands"] });
        toast.success("Brand deleted successfully");
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to delete brand");
      },
    });
  },
};
