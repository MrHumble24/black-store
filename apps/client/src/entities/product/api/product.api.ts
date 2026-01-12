import api from "@/shared/api/api";
import type { Product, ProductVariant } from "../model/types";

export const productsApi = {
  getAll: () => api.get<Product[]>("/products"),
  getOne: (id: number) => api.get<Product>(`/products/${id}`),
  create: (data: any) => api.post<Product>("/products", data),
  update: (id: number, data: any) =>
    api.patch<Product>(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
  search: (q: string) => api.get<ProductVariant[]>(`/products/search?q=${q}`),
  getLowStock: () => api.get("/products/low-stock"),
};
