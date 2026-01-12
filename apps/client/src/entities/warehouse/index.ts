import api from "@/shared/api/api";

export const warehousesApi = {
  getAll: () => api.get("/warehouses"),
  create: (data: any) => api.post("/warehouses", data),
};
