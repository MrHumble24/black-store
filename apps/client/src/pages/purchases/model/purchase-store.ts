import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PurchaseItem = {
  variantId: number;
  name: string;
  sku: string;
  quantity: number;
  costPrice: number;
  serialNumber?: string;
  productType: "SERIALIZED" | "BATCH";
};

interface PurchaseState {
  type: "PROVIDER" | "WALKING_CUSTOMER";
  providerId: string;
  sellerInfo: string;
  warehouseId: string;
  referenceNo: string;
  createdAt: string;
  items: PurchaseItem[];

  // Actions
  setType: (type: "PROVIDER" | "WALKING_CUSTOMER") => void;
  setProviderId: (id: string) => void;
  setSellerInfo: (info: string) => void;
  setWarehouseId: (id: string) => void;
  setReferenceNo: (no: string) => void;
  setCreatedAt: (date: string) => void;
  addItem: (item: PurchaseItem) => void;
  removeItem: (index: number) => void;
  updateItem: (index: number, updates: Partial<PurchaseItem>) => void;
  resetForm: () => void;
}

export const usePurchaseStore = create<PurchaseState>()(
  persist(
    (set) => ({
      type: "PROVIDER",
      providerId: "",
      sellerInfo: "",
      warehouseId: "",
      referenceNo: "",
      createdAt: new Date().toISOString().split("T")[0],
      items: [],

      setType: (type) => set({ type }),
      setProviderId: (id) => set({ providerId: id }),
      setSellerInfo: (info) => set({ sellerInfo: info }),
      setWarehouseId: (id) => set({ warehouseId: id }),
      setReferenceNo: (no) => set({ referenceNo: no }),
      setCreatedAt: (date) => set({ createdAt: date }),

      addItem: (item) =>
        set((state) => ({
          items: [...state.items, item],
        })),

      removeItem: (index) =>
        set((state) => ({
          items: state.items.filter((_, i) => i !== index),
        })),

      updateItem: (index, updates) =>
        set((state) => {
          const newItems = [...state.items];
          newItems[index] = { ...newItems[index], ...updates };
          return { items: newItems };
        }),

      resetForm: () =>
        set({
          type: "PROVIDER",
          providerId: "",
          sellerInfo: "",
          warehouseId: "",
          referenceNo: "",
          createdAt: new Date().toISOString().split("T")[0],
          items: [],
        }),
    }),
    {
      name: "purchase-form-storage",
    }
  )
);
