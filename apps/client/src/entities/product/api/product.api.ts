import api from "@/shared/api/api";
import type { Product, ProductVariant } from "../model/types";

export type CreateVariantPayload = {
  sku: string;
  name: string;
  specs: Record<string, string>;
};

export type UpdateVariantPayload = {
  sku?: string;
  name?: string;
  specs?: Record<string, string>;
  isActive?: boolean;
};

export type CreateProductPayload = {
  name: string;
  modelCode?: string;
  description?: string;
  type: "SERIALIZED" | "BATCH";
  minStock?: number;
  brandId: number;
  categoryId: number;
  variants?: CreateVariantPayload[];
};

export type UpdateProductPayload = Partial<
  Omit<CreateProductPayload, "type" | "variants">
>;

export const productsApi = {
  getAll: () => api.get<Product[]>("/products"),
  getOne: (id: number) => api.get<Product>(`/products/${id}`),
  create: (data: CreateProductPayload) => api.post<Product>("/products", data),
  update: (id: number, data: UpdateProductPayload) =>
    api.patch<Product>(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
  search: (q: string) => api.get<ProductVariant[]>(`/products/search?q=${q}`),
  getLowStock: () => api.get("/products/low-stock"),

  // Variant operations
  addVariant: (productId: number, data: CreateVariantPayload) =>
    api.post<ProductVariant>(`/products/${productId}/variants`, data),
  updateVariant: (variantId: number, data: UpdateVariantPayload) =>
    api.patch<ProductVariant>(`/products/variants/${variantId}`, data),
  deleteVariant: (variantId: number) =>
    api.delete(`/products/variants/${variantId}`),
};
