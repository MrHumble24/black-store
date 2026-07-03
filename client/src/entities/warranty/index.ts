import api from "@/shared/api/api";

export const warrantyApi = {
  generate: (orderItemId: number) =>
    api.get(`/warranty/generate/${orderItemId}`),
  getForSale: (saleId: number) => api.get(`/warranty/sale/${saleId}`),
};
