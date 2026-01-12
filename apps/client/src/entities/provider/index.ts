import api from "@/shared/api/api";

export const providersApi = {
  getAll: () => api.get("/providers"),
  create: (data: any) => api.post("/providers", data),
};
