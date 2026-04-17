import { create } from 'zustand';
import { fetchCatalog } from '../lib/api';

export interface Product {
  id: string;
  apiId?: string;
  name: string;
  price: number;
  barcode: string;
  stock: Record<string, number>; // StoreID -> Quantity
}

export interface Store {
  id: string;
  apiId?: string;
  name: string;
  address: string;
}

interface InventoryState {
  products: Product[];
  stores: Store[];
  isCatalogLoading: boolean;
  hasLoadedCatalog: boolean;
  loadCatalog: () => Promise<void>;
  updateStock: (productId: string, storeId: string, delta: number) => void;
  addProduct: (product: Product) => void;
  addStore: (store: Store) => void;
  removeProduct: (productId: string) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  stores: [
    { id: '1', name: 'Old Town Cannabis Shop', address: 'Rua 5 de Outubro 42, Albufeira' },
    { id: '2', name: 'Beach Cannabis Shop', address: 'Avenida da Liberdade 18, Albufeira' },
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
  isCatalogLoading: false,
  hasLoadedCatalog: false,
  loadCatalog: async () => {
    set({ isCatalogLoading: true });

    try {
      const { stores, products, inventory } = await fetchCatalog();

      const legacyStoreIdByName: Record<string, string> = {
        'Old Town Cannabis Shop': '1',
        'Beach Cannabis Shop': '2',
      };

      const mappedStores = stores.map((store, index) => ({
        id: legacyStoreIdByName[store.name] || String(index + 1),
        apiId: store.id,
        name: store.name,
        address: store.address,
      }));

      const storeIdByApiId = new Map(
        stores.map((store, index) => [
          store.id,
          legacyStoreIdByName[store.name] || String(index + 1),
        ])
      );

      const mappedProducts = products.map((product, index) => {
        const legacyProductId = `p${index + 1}`;
        const stock = inventory
          .filter((balance) => balance.product_id === product.id)
          .reduce<Record<string, number>>((acc, balance) => {
            const mappedStoreId = storeIdByApiId.get(balance.store_id);
            if (mappedStoreId) {
              acc[mappedStoreId] = balance.quantity;
            }
            return acc;
          }, {});

        return {
          id: legacyProductId,
          apiId: product.id,
          name: product.name,
          price: Number(product.default_price),
          barcode: product.barcode,
          stock,
        };
      });

      set({
        stores: mappedStores,
        products: mappedProducts,
        hasLoadedCatalog: true,
        isCatalogLoading: false,
      });
    } catch (error) {
      console.error('Failed to load catalog from API', error);
      set({ isCatalogLoading: false });
    }
  },
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
