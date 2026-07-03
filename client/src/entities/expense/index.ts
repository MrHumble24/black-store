import api from "@/shared/api/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type ExpenseCategory =
  | "RENT"
  | "UTILITIES"
  | "SALARY"
  | "TRANSPORT"
  | "REPAIRS"
  | "MARKETING"
  | "SUPPLIES"
  | "OTHER";

export type Expense = {
  id: number;
  category: ExpenseCategory;
  amount: number;
  description: string;
  receiptNo?: string;
  expenseDate: string;
  createdById: number;
  createdAt: string;
  createdBy?: { id: number; name: string };
};

export const expensesApi = {
  getAll: (params?: {
    startDate?: string;
    endDate?: string;
    category?: string;
  }) => api.get<Expense[]>("/expenses", { params }),
  getOne: (id: number) => api.get<Expense>(`/expenses/${id}`),
  create: (data: any) => api.post<Expense>("/expenses", data),
  update: (id: number, data: any) =>
    api.patch<Expense>(`/expenses/${id}`, data),
  delete: (id: number) => api.delete(`/expenses/${id}`),
  getSummary: (startDate: string, endDate: string) =>
    api.get<{ byCategory: any[]; total: number }>("/expenses/summary", {
      params: { startDate, endDate },
    }),
};

export const expenseQueries = {
  useAll: (params?: {
    startDate?: string;
    endDate?: string;
    category?: string;
  }) =>
    useQuery({
      queryKey: ["expenses", params],
      queryFn: () => expensesApi.getAll(params).then((res) => res.data),
    }),

  useSummary: (startDate: string, endDate: string) =>
    useQuery({
      queryKey: ["expenses-summary", startDate, endDate],
      queryFn: () =>
        expensesApi.getSummary(startDate, endDate).then((res) => res.data),
      enabled: !!startDate && !!endDate,
    }),

  useCreate: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: any) => expensesApi.create(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["expenses"] });
        queryClient.invalidateQueries({ queryKey: ["expenses-summary"] });
        toast.success("Expense recorded successfully");
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || "Failed to record expense"
        );
      },
    });
  },

  useDelete: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: number) => expensesApi.delete(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["expenses"] });
        queryClient.invalidateQueries({ queryKey: ["expenses-summary"] });
        toast.success("Expense deleted");
      },
    });
  },
};
