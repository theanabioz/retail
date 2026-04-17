import { create } from 'zustand';

export interface Product {
  id: string;
  name: string;
  price: number;
  barcode: string;
  stock: Record<string, number>; // StoreID -> Quantity
}

export interface Store {
  id: string;
  name: string;
  address: string;
}

interface InventoryState {
  products: Product[];
  stores: Store[];
  updateStock: (productId: string, storeId: string, delta: number) => void;
  addProduct: (product: Product) => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  stores: [
    { id: '1', name: 'Central Mall Store', address: 'Alexanderplatz 1, Berlin' },
    { id: '2', name: 'City Station Outlet', address: 'Gare du Nord, Paris' },
  ],
  products: [
    { id: 'p1', name: 'Americano Coffee', price: 3.50, barcode: '111', stock: { '1': 100, '2': 50 } },
    { id: 'p2', name: 'Butter Croissant', price: 2.20, barcode: '222', stock: { '1': 20, '2': 15 } },
    { id: 'p3', name: 'Tuna Sandwich', price: 5.90, barcode: '333', stock: { '1': 10, '2': 8 } },
    { id: 'p4', name: 'Fresh Orange Juice', price: 4.00, barcode: '444', stock: { '1': 30, '2': 25 } },
  ],
  updateStock: (productId, storeId, delta) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId
          ? { ...p, stock: { ...p.stock, [storeId]: (p.stock[storeId] || 0) + delta } }
          : p
      ),
    })),
  addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
}));
