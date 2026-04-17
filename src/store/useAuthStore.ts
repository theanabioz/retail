import { create } from 'zustand';

export type UserRole = 'ADMIN' | 'SELLER';

interface AuthState {
  role: UserRole | null;
  currentStoreId: string | null;
  setRole: (role: UserRole) => void;
  setCurrentStoreId: (id: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  role: null,
  currentStoreId: null,
  setRole: (role) => set({ role }),
  setCurrentStoreId: (id) => set({ currentStoreId: id }),
  logout: () => set({ role: null, currentStoreId: null }),
}));
