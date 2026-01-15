import { create } from "zustand";

export interface CartItem {
  variantId: number;
  sku: string;
  name: string;
  productName: string;
  sellPrice: number;
  quantity: number;
  inventoryItemId?: number; // For serialized items
  serialNumber?: string;
  productType: "SERIALIZED" | "BATCH";
}

interface PosState {
  cart: CartItem[];
  customerName: string;
  setCustomerName: (name: string) => void;
  addItem: (item: CartItem) => void;
  removeItem: (variantId: number, serialNumber?: string) => void;
  updateQuantity: (
    variantId: number,
    quantity: number,
    serialNumber?: string
  ) => void;
  updatePrice: (
    variantId: number,
    sellPrice: number,
    serialNumber?: string
  ) => void;
  clearCart: () => void;
  total: number;
}

export const usePosStore = create<PosState>((set) => ({
  cart: [],
  customerName: "",
  setCustomerName: (name) => set({ customerName: name }),
  addItem: (item) =>
    set((state) => {
      // If it's serialized, check if it's already in cart by serial number
      if (item.productType === "SERIALIZED") {
        const existing = state.cart.find(
          (i) =>
            i.variantId === item.variantId &&
            i.serialNumber === item.serialNumber
        );
        if (existing) return state; // Already in cart
        return {
          cart: [...state.cart, { ...item, quantity: 1 }],
          total: state.total + item.sellPrice,
        };
      }

      // If it's bulk, check if variant is already in cart
      const existingIndex = state.cart.findIndex(
        (i) => i.variantId === item.variantId
      );
      if (existingIndex > -1) {
        const newCart = [...state.cart];
        newCart[existingIndex].quantity += 1;
        return { cart: newCart, total: state.total + item.sellPrice };
      }

      return {
        cart: [...state.cart, item],
        total: state.total + item.sellPrice * item.quantity,
      };
    }),
  removeItem: (variantId, serialNumber) =>
    set((state) => {
      const item = state.cart.find(
        (i) => i.variantId === variantId && i.serialNumber === serialNumber
      );
      if (!item) return state;
      const newCart = state.cart.filter(
        (i) => !(i.variantId === variantId && i.serialNumber === serialNumber)
      );
      return {
        cart: newCart,
        total: state.total - item.sellPrice * item.quantity,
      };
    }),
  updateQuantity: (variantId, quantity, serialNumber) =>
    set((state) => {
      const newCart = state.cart.map((i) => {
        if (i.variantId === variantId && i.serialNumber === serialNumber) {
          return { ...i, quantity };
        }
        return i;
      });
      const newTotal = newCart.reduce(
        (acc, i) => acc + i.sellPrice * i.quantity,
        0
      );
      return { cart: newCart, total: newTotal };
    }),
  updatePrice: (variantId, sellPrice, serialNumber) =>
    set((state) => {
      const newCart = state.cart.map((i) => {
        if (i.variantId === variantId && i.serialNumber === serialNumber) {
          return { ...i, sellPrice };
        }
        return i;
      });
      const newTotal = newCart.reduce(
        (acc, i) => acc + i.sellPrice * i.quantity,
        0
      );
      return { cart: newCart, total: newTotal };
    }),
  clearCart: () => set({ cart: [], total: 0, customerName: "" }),
  total: 0,
}));
