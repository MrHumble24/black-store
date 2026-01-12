import api from "@/shared/api/api";

export const inventoryApi = {
  getAll: (params?: {
    warehouseId?: number;
    variantId?: number;
    status?: string;
  }) => api.get("/inventory", { params }),
  getOne: (id: number) => api.get(`/inventory/${id}`),
  transfer: (data: any) => api.post("/inventory/transfer", data),
};
