import api from "@/shared/api/api";

export const purchasesApi = {
  getAll: () => api.get("/purchases"),
  getOne: (id: number) => api.get(`/purchases/${id}`),
  create: (data: any) => api.post("/purchases", data),
};
