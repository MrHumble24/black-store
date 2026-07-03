import api from "@/shared/api/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type ReturnReason =
  | "DEFECTIVE"
  | "WRONG_ITEM"
  | "CUSTOMER_CHANGE_MIND"
  | "WARRANTY_CLAIM"
  | "OTHER";

export type ReturnStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "RESTOCKED"
  | "DISPOSED";

export type Return = {
  id: number;
  saleId: number;
  orderItemId: number;
  reason: ReturnReason;
  status: ReturnStatus;
  notes?: string;
  refundAmount: number;
  createdById: number;
  processedById?: number;
  createdAt: string;
  updatedAt: string;
  sale?: any;
  orderItem?: any;
  createdBy?: { id: number; name: string };
  processedBy?: { id: number; name: string };
};

export const returnsApi = {
  getAll: (status?: string) =>
    api.get<Return[]>("/returns", { params: { status } }),
  getOne: (id: number) => api.get<Return>(`/returns/${id}`),
  create: (data: any) => api.post<Return>("/returns", data),
  process: (id: number, data: any) =>
    api.patch<Return>(`/returns/${id}/process`, data),
};

export const returnQueries = {
  useAll: (status?: string) =>
    useQuery({
      queryKey: ["returns", status],
      queryFn: () => returnsApi.getAll(status).then((res) => res.data),
    }),

  useOne: (id: number) =>
    useQuery({
      queryKey: ["return", id],
      queryFn: () => returnsApi.getOne(id).then((res) => res.data),
      enabled: !!id,
    }),

  useCreate: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: any) => returnsApi.create(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["returns"] });
        queryClient.invalidateQueries({ queryKey: ["sales"] });
        toast.success("Return request created");
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || "Failed to create return request",
        );
      },
    });
  },

  useProcess: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: number; data: any }) =>
        returnsApi.process(id, data),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ["returns"] });
        queryClient.invalidateQueries({ queryKey: ["return", variables.id] });
        queryClient.invalidateQueries({ queryKey: ["inventory"] });
        toast.success("Return processed successfully");
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || "Failed to process return",
        );
      },
    });
  },
};
