import { create } from 'zustand';
import type { Product } from './useInventoryStore';

export interface CartItem extends Product {
  quantity: number;
  unitPrice: number;
}

export interface BreakEntry {
  id: string;
  start: string;
  end: string | null;
}

interface SaleState {
  cart: CartItem[];
  isShiftActive: boolean;
  shiftStartedAt: string | null;
  isOnBreak: boolean;
  breakEntries: BreakEntry[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateUnitPrice: (productId: string, unitPrice: number) => void;
  clearCart: () => void;
  toggleShift: () => void;
  toggleBreak: () => void;
}

export const useSaleStore = create<SaleState>((set) => ({
  cart: [],
  isShiftActive: false,
  shiftStartedAt: null,
  isOnBreak: false,
  breakEntries: [],
  addToCart: (product) =>
    set((state) => {
      const existing = state.cart.find((item) => item.id === product.id);
      if (existing) {
        return {
          cart: state.cart.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          ),
        };
      }
      return { cart: [...state.cart, { ...product, quantity: 1, unitPrice: product.price }] };
    }),
  removeFromCart: (productId) =>
    set((state) => ({ cart: state.cart.filter((item) => item.id !== productId) })),
  updateQuantity: (productId, quantity) =>
    set((state) => ({
      cart: state.cart.map((item) =>
        item.id === productId ? { ...item, quantity: Math.max(0, quantity) } : item
      ).filter(item => item.quantity > 0),
    })),
  updateUnitPrice: (productId, unitPrice) =>
    set((state) => ({
      cart: state.cart.map((item) =>
        item.id === productId
          ? { ...item, unitPrice: Number.isFinite(unitPrice) ? Math.max(0, unitPrice) : item.unitPrice }
          : item
      ),
    })),
  clearCart: () => set({ cart: [] }),
  toggleShift: () =>
    set((state) => {
      if (state.isShiftActive) {
        return {
          isShiftActive: false,
          shiftStartedAt: null,
          isOnBreak: false,
          breakEntries: [],
        };
      }

      return {
        isShiftActive: true,
        shiftStartedAt: new Date().toISOString(),
        isOnBreak: false,
        breakEntries: [],
      };
    }),
  toggleBreak: () =>
    set((state) => {
      if (!state.isShiftActive) {
        return state;
      }

      if (state.isOnBreak) {
        return {
          isOnBreak: false,
          breakEntries: state.breakEntries.map((entry, index) =>
            index === state.breakEntries.length - 1 && entry.end === null
              ? { ...entry, end: new Date().toISOString() }
              : entry
          ),
        };
      }

      return {
        isOnBreak: true,
        breakEntries: [
          ...state.breakEntries,
          {
            id: `br-${Date.now()}`,
            start: new Date().toISOString(),
            end: null,
          },
        ],
      };
    }),
}));
