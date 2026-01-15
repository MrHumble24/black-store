import api from "@/shared/api/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type SaleItem = {
  id: number;
  saleId: number;
  variantId: number;
  quantity: number;
  sellPrice: number;
  warrantyEnd?: string;
  serialNumber?: string;
  variant?: {
    id: number;
    name: string;
    product: {
      id: number;
      name: string;
      brandId: number;
      categoryId: number;
    };
    inventory?: {
      costPrice: number;
    }[];
  };
};

export type Sale = {
  id: number;
  invoiceNo: string;
  customerName?: string;
  customerPhone?: string;
  paymentMethod: string;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  createdAt: string;
  items: SaleItem[];
  user?: { id: number; name: string };
};

export const salesApi = {
  getAll: () => api.get<Sale[]>("/sales"),
  getOne: (id: number) => api.get<Sale>(`/sales/${id}`),
  create: (data: any) => api.post<Sale>("/sales", data).then((res) => res.data),
};

export const salesQueries = {
  useAll: () =>
    useQuery({
      queryKey: ["sales"],
      queryFn: () => salesApi.getAll().then((res) => res.data),
    }),

  useOne: (id: number) =>
    useQuery({
      queryKey: ["sale", id],
      queryFn: () => salesApi.getOne(id).then((res) => res.data),
      enabled: !!id,
    }),

  useCreate: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: any) => salesApi.create(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["sales"] });
        queryClient.invalidateQueries({ queryKey: ["inventory"] });
        toast.success("Sale completed successfully");
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to complete sale");
      },
    });
  },
};
