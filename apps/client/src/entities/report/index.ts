import api from "@/shared/api/api";
import { useQuery } from "@tanstack/react-query";

export const reportsApi = {
  getDashboard: () => api.get("/reports/dashboard"),
  getSales: (startDate: string, endDate: string) =>
    api.get(`/reports/sales?startDate=${startDate}&endDate=${endDate}`),
  getProfit: (startDate: string, endDate: string) =>
    api.get(`/reports/profit?startDate=${startDate}&endDate=${endDate}`),
  getInventoryValue: () => api.get("/reports/inventory-value"),
};

export const reportQueries = {
  useDashboard: () =>
    useQuery({
      queryKey: ["dashboard"],
      queryFn: () => reportsApi.getDashboard().then((r) => r.data),
      refetchInterval: 60000,
    }),
};
