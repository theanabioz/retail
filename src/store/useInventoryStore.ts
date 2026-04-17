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
  addStore: (store: Store) => void;
  removeProduct: (productId: string) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  stores: [
    { id: '1', name: 'Central Mall Store', address: 'Alexanderplatz 1, Berlin' },
    { id: '2', name: 'City Station Outlet', address: 'Gare du Nord, Paris' },
  ],
  products: [
    { id: 'p1', name: 'Herbal Oil 10ml', price: 24.90, barcode: '810101', stock: { '1': 18, '2': 12 } },
    { id: 'p2', name: 'Botanical Balm 30g', price: 19.50, barcode: '810102', stock: { '1': 14, '2': 9 } },
    { id: 'p3', name: 'Relax Gummies 20pcs', price: 21.00, barcode: '810103', stock: { '1': 22, '2': 16 } },
    { id: 'p4', name: 'Aroma Cartridge', price: 29.90, barcode: '810104', stock: { '1': 11, '2': 7 } },
    { id: 'p5', name: 'Herbal Blend 1g', price: 8.90, barcode: '810105', stock: { '1': 40, '2': 28 } },
    { id: 'p6', name: 'Herbal Blend 3g', price: 22.90, barcode: '810106', stock: { '1': 24, '2': 15 } },
    { id: 'p7', name: 'Pre-Rolled Herbal Stick', price: 6.50, barcode: '810107', stock: { '1': 35, '2': 20 } },
    { id: 'p8', name: 'Starter Kit', price: 39.00, barcode: '810108', stock: { '1': 8, '2': 5 } },
    { id: 'p9', name: 'Premium Flower Pack', price: 27.50, barcode: '810109', stock: { '1': 13, '2': 10 } },
    { id: 'p10', name: 'Terpene Drops', price: 17.90, barcode: '810110', stock: { '1': 19, '2': 14 } },
  ],
  updateStock: (productId, storeId, delta) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId
          ? { ...p, stock: { ...p.stock, [storeId]: Math.max(0, (p.stock[storeId] || 0) + delta) } }
          : p
      ),
    })),
  addProduct: (product) => set((state) => ({ products: [product, ...state.products] })),
  addStore: (store) => set((state) => ({
    stores: [store, ...state.stores],
    products: state.products.map((product) => ({
      ...product,
      stock: {
        ...product.stock,
        [store.id]: 0,
      },
    })),
  })),
  removeProduct: (productId) => set((state) => ({ 
    products: state.products.filter(p => p.id !== productId) 
  })),
  updateProduct: (productId, updates) => set((state) => ({
    products: state.products.map(p => p.id === productId ? { ...p, ...updates } : p)
  })),
}));
