import { create } from 'zustand';
import type { Product } from './useInventoryStore';

interface CartItem extends Product {
  quantity: number;
}

interface SaleState {
  cart: CartItem[];
  isShiftActive: boolean;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleShift: () => void;
}

export const useSaleStore = create<SaleState>((set) => ({
  cart: [],
  isShiftActive: false,
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
      return { cart: [...state.cart, { ...product, quantity: 1 }] };
    }),
  removeFromCart: (productId) =>
    set((state) => ({ cart: state.cart.filter((item) => item.id !== productId) })),
  updateQuantity: (productId, quantity) =>
    set((state) => ({
      cart: state.cart.map((item) =>
        item.id === productId ? { ...item, quantity: Math.max(0, quantity) } : item
      ).filter(item => item.quantity > 0),
    })),
  clearCart: () => set({ cart: [] }),
  toggleShift: () => set((state) => ({ isShiftActive: !state.isShiftActive })),
}));
