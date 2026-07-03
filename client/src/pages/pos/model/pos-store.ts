import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  variantId: number;
  sku: string;
  name: string;
  productName: string;
  sellPrice: number;
  quantity: number;
  inventoryItemId?: number;
  serialNumber?: string;
  productType: "SERIALIZED" | "BATCH";
}

export type PaymentMethod = "CASH" | "CARD" | "TRANSFER" | "OTHER";

interface HeldCart {
  id: string;
  label: string;
  cart: CartItem[];
  customerName: string;
  customerPhone: string;
  createdAt: number;
}

interface PosState {
  cart: CartItem[];
  customerName: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  discountAmount: number;
  taxAmount: number;
  invoiceNo: string;
  createdAt: string;
  heldCarts: HeldCart[];

  // Actions
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  setInvoiceNo: (no: string) => void;
  setCreatedAt: (date: string) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setDiscountAmount: (amount: number) => void;
  setTaxAmount: (amount: number) => void;
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

  // Holding Logic
  holdCurrentCart: (label: string) => void;
  resumeCart: (id: string) => void;
  deleteHeldCart: (id: string) => void;

  // Selectors
  getSubtotal: () => number;
  getTotal: () => number;
}

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      cart: [],
      customerName: "",
      customerPhone: "",
      paymentMethod: "CASH",
      discountAmount: 0,
      taxAmount: 0,
      invoiceNo: "",
      createdAt: "",
      heldCarts: [],

      setCustomerName: (name) => set({ customerName: name }),
      setCustomerPhone: (phone) => set({ customerPhone: phone }),
      setInvoiceNo: (no) => set({ invoiceNo: no }),
      setCreatedAt: (date) => set({ createdAt: date }),
      setPaymentMethod: (method) => set({ paymentMethod: method }),
      setDiscountAmount: (amount) => set({ discountAmount: amount }),
      setTaxAmount: (amount) => set({ taxAmount: amount }),

      addItem: (item) =>
        set((state) => {
          if (item.productType === "SERIALIZED") {
            const existing = state.cart.find(
              (i) =>
                i.variantId === item.variantId &&
                i.serialNumber === item.serialNumber
            );
            if (existing) return state;
            return { cart: [...state.cart, { ...item, quantity: 1 }] };
          }

          const existingIndex = state.cart.findIndex(
            (i) => i.variantId === item.variantId
          );
          if (existingIndex > -1) {
            const newCart = [...state.cart];
            newCart[existingIndex].quantity += 1;
            return { cart: newCart };
          }

          return { cart: [...state.cart, item] };
        }),

      removeItem: (variantId, serialNumber) =>
        set((state) => ({
          cart: state.cart.filter(
            (i) =>
              !(i.variantId === variantId && i.serialNumber === serialNumber)
          ),
        })),

      updateQuantity: (variantId, quantity, serialNumber) =>
        set((state) => ({
          cart: state.cart.map((i) =>
            i.variantId === variantId && i.serialNumber === serialNumber
              ? { ...i, quantity }
              : i
          ),
        })),

      updatePrice: (variantId, sellPrice, serialNumber) =>
        set((state) => ({
          cart: state.cart.map((i) =>
            i.variantId === variantId && i.serialNumber === serialNumber
              ? { ...i, sellPrice }
              : i
          ),
        })),

      clearCart: () =>
        set({
          cart: [],
          customerName: "",
          customerPhone: "",
          discountAmount: 0,
          taxAmount: 0,
          paymentMethod: "CASH",
          invoiceNo: "",
          createdAt: "",
        }),

      holdCurrentCart: (label) =>
        set((state) => ({
          heldCarts: [
            ...state.heldCarts,
            {
              id: Math.random().toString(36).substr(2, 9),
              label,
              cart: state.cart,
              customerName: state.customerName,
              customerPhone: state.customerPhone,
              createdAt: Date.now(),
            },
          ],
          cart: [],
          customerName: "",
          customerPhone: "",
          discountAmount: 0,
          taxAmount: 0,
          invoiceNo: "",
          createdAt: "",
        })),

      resumeCart: (id) =>
        set((state) => {
          const held = state.heldCarts.find((c) => c.id === id);
          if (!held) return state;
          return {
            cart: held.cart,
            customerName: held.customerName,
            customerPhone: held.customerPhone,
            heldCarts: state.heldCarts.filter((c) => c.id !== id),
          };
        }),

      deleteHeldCart: (id) =>
        set((state) => ({
          heldCarts: state.heldCarts.filter((c) => c.id !== id),
        })),

      getSubtotal: () => {
        return get().cart.reduce(
          (sum, item) => sum + item.sellPrice * item.quantity,
          0
        );
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        return subtotal - get().discountAmount + get().taxAmount;
      },
    }),
    { name: "pos-storage" }
  )
);
