import api from "@/shared/api/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Product, ProductVariant } from "@/entities/product";
import type { Warehouse } from "@/entities/warehouse";

export type InventoryItem = {
  id: number;
  variantId: number;
  warehouseId: number;
  purchaseId?: number;
  quantity: number;
  costPrice: number;
  status: "AVAILABLE" | "SOLD" | "DEFECTIVE" | "RESERVED";
  serialNumber?: string;
  batchNumber?: string;
  expiryDate?: string;
  receivedAt: string;
  createdAt: string;
  updatedAt: string;
  variant?: ProductVariant & { product: Product };
  warehouse?: Warehouse;
  purchase?: {
    id: number;
    provider?: { name: string };
    type: "PROVIDER" | "WALKING_CUSTOMER";
    sellerInfo?: string;
  };
};

export type UpdateInventoryPayload = {
  status?: InventoryItem["status"];
  quantity?: number;
  warehouseId?: number;
};

export type TransferInventoryPayload = {
  variantId: number;
  fromWarehouseId: number;
  toWarehouseId: number;
  quantity: number;
  inventoryItemId?: number; // Required for SERIALIZED
  notes?: string;
};

export const inventoryApi = {
  getAll: (params?: {
    warehouseId?: number;
    variantId?: number;
    status?: string;
  }) => api.get<InventoryItem[]>("/inventory", { params }),
  getOne: (id: number) => api.get<InventoryItem>(`/inventory/${id}`),
  create: (data: any) => api.post<InventoryItem>("/inventory", data),
  update: (id: number, data: UpdateInventoryPayload) =>
    api.patch<InventoryItem>(`/inventory/${id}`, data),
  transfer: (data: TransferInventoryPayload) =>
    api.post("/inventory/transfer", data),
};

export const inventoryQueries = {
  useAll: (params?: {
    warehouseId?: number;
    variantId?: number;
    status?: string;
  }) =>
    useQuery({
      queryKey: ["inventory", params],
      queryFn: () => inventoryApi.getAll(params).then((res) => res.data),
    }),

  useOne: (id: number) =>
    useQuery({
      queryKey: ["inventory-item", id],
      queryFn: () => inventoryApi.getOne(id).then((res) => res.data),
      enabled: !!id,
    }),

  useCreate: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: any) => inventoryApi.create(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["inventory"] });
        toast.success("Inventory item created successfully");
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || "Failed to create inventory item"
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
        data: UpdateInventoryPayload;
      }) => inventoryApi.update(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["inventory"] });
        toast.success("Inventory updated successfully");
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || "Failed to update inventory"
        );
      },
    });
  },

  useTransfer: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: TransferInventoryPayload) =>
        inventoryApi.transfer(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["inventory"] });
        toast.success("Stock transferred successfully");
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || "Failed to transfer stock"
        );
      },
    });
  },
};
