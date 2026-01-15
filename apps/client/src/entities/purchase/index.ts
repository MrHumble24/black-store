import api from "@/shared/api/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Provider } from "../provider";

export type PurchaseItem = {
  id: number;
  variantId: number;
  warehouseId: number;
  serialNumber?: string;
  quantity: number;
  costPrice: number;
  variant?: any;
};

export type Purchase = {
  id: number;
  providerId: number;
  userId: number;
  referenceNo?: string;
  totalCost: number;
  createdAt: string;
  provider?: Provider;
  user?: { id: number; name: string };
  items?: PurchaseItem[];
};

export const purchasesApi = {
  getAll: () => api.get<Purchase[]>("/purchases"),
  getOne: (id: number) => api.get<Purchase>(`/purchases/${id}`),
  create: (data: any) => api.post<Purchase>("/purchases", data),
};

export const purchaseQueries = {
  useAll: () =>
    useQuery({
      queryKey: ["purchases"],
      queryFn: () => purchasesApi.getAll().then((res) => res.data),
    }),

  useOne: (id: number) =>
    useQuery({
      queryKey: ["purchase", id],
      queryFn: () => purchasesApi.getOne(id).then((res) => res.data),
      enabled: !!id,
    }),

  useCreate: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: any) => purchasesApi.create(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["purchases"] });
        queryClient.invalidateQueries({ queryKey: ["inventory"] });
        toast.success("Purchase recorded successfully");
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || "Failed to record purchase"
        );
      },
    });
  },
};
