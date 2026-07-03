export type ProductVariant = {
  id: number;
  sku: string;
  modelCode?: string;
  name: string;
  specs: Record<string, string>;
  totalStock?: number;
  sellPrice?: number | string;
  inventory?: Array<{
    id: number;
    quantity: number;
    costPrice: number;
    warehouseId: number;
  }>;
};

export type Product = {
  id: number;
  name: string;
  description?: string;
  type: "SERIALIZED" | "BATCH";
  minStock: number;
  brandId: number;
  categoryId: number;
  brand: { id: number; name: string };
  category: { id: number; name: string };
  variants: ProductVariant[];
};
