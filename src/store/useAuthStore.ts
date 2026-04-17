import { create } from 'zustand';

export type UserRole = 'ADMIN' | 'SELLER';

interface AdminSessionSnapshot {
  role: UserRole;
  currentStoreId: string | null;
  telegramId: string | null;
  fullName: string | null;
  assignedStoreIds: string[];
}

interface AuthState {
  role: UserRole | null;
  currentStoreId: string | null;
  telegramId: string | null;
  fullName: string | null;
  assignedStoreIds: string[];
  adminSession: AdminSessionSnapshot | null;
  setRole: (role: UserRole) => void;
  setCurrentStoreId: (id: string) => void;
  setAuthenticatedUser: (payload: {
    role: UserRole;
    telegramId: string;
    fullName: string;
    assignedStoreIds: string[];
    currentStoreId?: string | null;
  }) => void;
  enterStoreView: (payload: { storeId: string; storeName: string }) => void;
  exitStoreView: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  role: null,
  currentStoreId: null,
  telegramId: null,
  fullName: null,
  assignedStoreIds: [],
  adminSession: null,
  setRole: (role) => set({ role }),
  setCurrentStoreId: (id) => set({ currentStoreId: id }),
  setAuthenticatedUser: ({ role, telegramId, fullName, assignedStoreIds, currentStoreId }) =>
    set({
      role,
      telegramId,
      fullName,
      assignedStoreIds,
      currentStoreId: currentStoreId ?? assignedStoreIds[0] ?? null,
      adminSession: null,
    }),
  enterStoreView: ({ storeId, storeName }) =>
    set((state) => {
      if (state.role !== 'ADMIN') {
        return state;
      }

      return {
        role: 'SELLER',
        currentStoreId: storeId,
        assignedStoreIds: [storeId],
        fullName: `${storeName} View`,
        adminSession: state.adminSession ?? {
          role: 'ADMIN',
          currentStoreId: state.currentStoreId,
          telegramId: state.telegramId,
          fullName: state.fullName,
          assignedStoreIds: state.assignedStoreIds,
        },
      };
    }),
  exitStoreView: () =>
    set((state) => {
      if (!state.adminSession) {
        return state;
      }

      return {
        role: state.adminSession.role,
        currentStoreId: state.adminSession.currentStoreId,
        telegramId: state.adminSession.telegramId,
        fullName: state.adminSession.fullName,
        assignedStoreIds: state.adminSession.assignedStoreIds,
        adminSession: null,
      };
    }),
  logout: () =>
    set({
      role: null,
      currentStoreId: null,
      telegramId: null,
      fullName: null,
      assignedStoreIds: [],
      adminSession: null,
    }),
}));
