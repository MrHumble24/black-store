import api from "@/shared/api/api";

export const returnsApi = {
  getAll: (status?: string) => api.get("/returns", { params: { status } }),
  create: (data: any) => api.post("/returns", data),
  process: (id: number, data: any) => api.patch(`/returns/${id}/process`, data),
};
