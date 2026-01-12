import api from "@/shared/api/api";

export const expensesApi = {
  getAll: (params?: {
    startDate?: string;
    endDate?: string;
    category?: string;
  }) => api.get("/expenses", { params }),
  create: (data: any) => api.post("/expenses", data),
  getSummary: (startDate: string, endDate: string) =>
    api.get(`/expenses/summary?startDate=${startDate}&endDate=${endDate}`),
};
