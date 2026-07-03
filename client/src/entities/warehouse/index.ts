import api from "@/shared/api/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type Warehouse = {
  id: number;
  name: string;
  address?: string;
  isShop: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateWarehousePayload = {
  name: string;
  address?: string;
  isShop?: boolean;
};

export type UpdateWarehousePayload = Partial<CreateWarehousePayload> & {
  isActive?: boolean;
};

export const warehousesApi = {
  getAll: () => api.get<Warehouse[]>("/warehouses"),
  getOne: (id: number) => api.get<Warehouse>(`/warehouses/${id}`),
  create: (data: CreateWarehousePayload) =>
    api.post<Warehouse>("/warehouses", data),
  update: (id: number, data: UpdateWarehousePayload) =>
    api.patch<Warehouse>(`/warehouses/${id}`, data),
  delete: (id: number) => api.delete(`/warehouses/${id}`),
};

export const warehouseQueries = {
  useAll: () =>
    useQuery({
      queryKey: ["warehouses"],
      queryFn: () => warehousesApi.getAll().then((res) => res.data),
    }),

  useOne: (id: number) =>
    useQuery({
      queryKey: ["warehouse", id],
      queryFn: () => warehousesApi.getOne(id).then((res) => res.data),
      enabled: !!id,
    }),

  useCreate: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: CreateWarehousePayload) => warehousesApi.create(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["warehouses"] });
        toast.success("Warehouse created successfully");
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || "Failed to create warehouse"
        );
      },
    });
  },

  useUpdate: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({
        id,
        data,
      }: {
        id: number;
        data: UpdateWarehousePayload;
      }) => warehousesApi.update(id, data),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ["warehouses"] });
        queryClient.invalidateQueries({
          queryKey: ["warehouse", variables.id],
        });
        toast.success("Warehouse updated successfully");
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || "Failed to update warehouse"
        );
      },
    });
  },

  useDelete: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: number) => warehousesApi.delete(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["warehouses"] });
        toast.success("Warehouse deleted successfully");
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || "Failed to delete warehouse"
        );
      },
    });
  },
};
