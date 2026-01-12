import api from "@/shared/api/api";

export type Sale = {
  id: number;
  invoiceNo: string;
  customerName?: string;
  totalAmount: number;
  createdAt: string;
  items: any[];
};

export const salesApi = {
  getAll: () => api.get<Sale[]>("/sales"),
  getOne: (id: number) => api.get<Sale>(`/sales/${id}`),
  create: (data: any) => api.post<Sale>("/sales", data),
};
