export type ProductVariant = {
  id: number;
  sku: string;
  name: string;
  specs: Record<string, string>;
  totalStock?: number;
};

export type Product = {
  id: number;
  name: string;
  modelCode?: string;
  description?: string;
  type: "SERIALIZED" | "BATCH";
  minStock: number;
  brand: { id: number; name: string };
  category: { id: number; name: string };
  variants: ProductVariant[];
};
