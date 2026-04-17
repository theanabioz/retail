import { create } from 'zustand';

export type UserRole = 'ADMIN' | 'SELLER';

interface AuthState {
  role: UserRole | null;
  currentStoreId: string | null;
  telegramId: string | null;
  fullName: string | null;
  assignedStoreIds: string[];
  setRole: (role: UserRole) => void;
  setCurrentStoreId: (id: string) => void;
  setAuthenticatedUser: (payload: {
    role: UserRole;
    telegramId: string;
    fullName: string;
    assignedStoreIds: string[];
    currentStoreId?: string | null;
  }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  role: null,
  currentStoreId: null,
  telegramId: null,
  fullName: null,
  assignedStoreIds: [],
  setRole: (role) => set({ role }),
  setCurrentStoreId: (id) => set({ currentStoreId: id }),
  setAuthenticatedUser: ({ role, telegramId, fullName, assignedStoreIds, currentStoreId }) =>
    set({
      role,
      telegramId,
      fullName,
      assignedStoreIds,
      currentStoreId: currentStoreId ?? assignedStoreIds[0] ?? null,
    }),
  logout: () =>
    set({
      role: null,
      currentStoreId: null,
      telegramId: null,
      fullName: null,
      assignedStoreIds: [],
    }),
}));
