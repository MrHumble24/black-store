import api from "@/shared/api/api";

export const lookupApi = {
  scan: (code: string) => api.get(`/lookup?code=${encodeURIComponent(code)}`),
  getVariant: (id: number) => api.get(`/lookup/variant/${id}`),
  getSerials: (variantId: number) =>
    api.get(`/lookup/variant/${variantId}/serials`),
};
