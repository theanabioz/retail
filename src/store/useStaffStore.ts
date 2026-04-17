import { create } from 'zustand';

export interface Shift {
  id: string;
  sellerId: string;
  storeId: string;
  start: string; // ISO String
  end: string | null; // ISO String or null if active
}

export interface StaffMember {
  id: string;
  name: string;
  storeId: string;
  status: 'online' | 'offline';
  joinedDate: string;
}

interface StaffState {
  staff: StaffMember[];
  shifts: Shift[];
  addStaff: (member: StaffMember) => void;
  removeStaff: (id: string) => void;
  updateStaff: (id: string, updates: Partial<StaffMember>) => void;
  getSellerHours: (sellerId: string, range: 'day' | 'week' | 'month') => number;
}

export const useStaffStore = create<StaffState>((set, get) => ({
  staff: [
    { id: 's1', name: 'John Doe', storeId: '1', status: 'online', joinedDate: '2025-01-15' },
    { id: 's2', name: 'Jane Smith', storeId: '2', status: 'offline', joinedDate: '2025-02-10' },
    { id: 's3', name: 'Mike Ross', storeId: '1', status: 'offline', joinedDate: '2025-03-01' },
  ],
  shifts: [
    // Mock shift history for analytics
    { id: 'sh1', sellerId: 's1', storeId: '1', start: '2026-04-16T08:00:00', end: '2026-04-16T17:00:00' },
    { id: 'sh2', sellerId: 's1', storeId: '1', start: '2026-04-15T09:00:00', end: '2026-04-15T18:00:00' },
    { id: 'sh3', sellerId: 's2', storeId: '2', start: '2026-04-16T10:00:00', end: '2026-04-16T19:00:00' },
  ],
  addStaff: (member) => set((state) => ({ staff: [member, ...state.staff] })),
  removeStaff: (id) => set((state) => ({ staff: state.staff.filter(s => s.id !== id) })),
  updateStaff: (id, updates) => set((state) => ({
    staff: state.staff.map(s => s.id === id ? { ...s, ...updates } : s)
  })),
  getSellerHours: (sellerId, range) => {
    const now = new Date();
    const sellerShifts = get().shifts.filter(s => s.sellerId === sellerId && s.end);
    
    // Simple mock logic for calculation
    return sellerShifts.reduce((acc, shift) => {
      const start = new Date(shift.start);
      const end = new Date(shift.end!);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return acc + hours;
    }, 0);
  }
}));
