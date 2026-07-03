import api from "@/shared/api/api";
import { useQuery } from "@tanstack/react-query";

export type SalesSummary = {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  salesByDay: Array<{ date: string; total: number; count: number }>;
  topProducts: Array<{
    id: number;
    name: string;
    productName: string;
    sku: string;
    quantitySold: number;
    revenue: number;
  }>;
  topSellers: Array<{
    id: number;
    name: string;
    totalSales: number;
    orderCount: number;
  }>;
};

export type ProfitReport = {
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  grossMargin: number;
  netMargin: number;
};

export type InventoryValue = {
  totalValue: number;
  totalItems: number;
  byWarehouse: Array<{ name: string; value: number; items: number }>;
  byCategory: Array<{ name: string; value: number; items: number }>;
};

export const reportsApi = {
  getDashboard: () => api.get("/reports/dashboard"),
  getSales: (startDate: string, endDate: string) =>
    api.get<SalesSummary>(
      `/reports/sales?startDate=${startDate}&endDate=${endDate}`
    ),
  getProfit: (startDate: string, endDate: string) =>
    api.get<ProfitReport>(
      `/reports/profit?startDate=${startDate}&endDate=${endDate}`
    ),
  getInventoryValue: () => api.get<InventoryValue>("/reports/inventory-value"),
};

export const reportQueries = {
  useDashboard: () =>
    useQuery({
      queryKey: ["dashboard"],
      queryFn: () => reportsApi.getDashboard().then((r) => r.data),
      refetchInterval: 60000,
    }),

  useSales: (startDate: string, endDate: string) =>
    useQuery({
      queryKey: ["reports-sales", startDate, endDate],
      queryFn: () =>
        reportsApi.getSales(startDate, endDate).then((res) => res.data),
      enabled: !!startDate && !!endDate,
    }),

  useProfit: (startDate: string, endDate: string) =>
    useQuery({
      queryKey: ["reports-profit", startDate, endDate],
      queryFn: () =>
        reportsApi.getProfit(startDate, endDate).then((res) => res.data),
      enabled: !!startDate && !!endDate,
    }),

  useInventoryValue: () =>
    useQuery({
      queryKey: ["reports-inventory-value"],
      queryFn: () => reportsApi.getInventoryValue().then((res) => res.data),
    }),
};
