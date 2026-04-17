import { create } from 'zustand';
import {
  createStaff,
  fetchStaffActivity,
  fetchStaffList,
  fetchStaffShifts,
  updateStaffMember,
  type ApiStaff,
  type ApiStaffActivity,
  type ApiStaffShift,
} from '../lib/api';
import { useInventoryStore } from './useInventoryStore';

export interface Shift {
  id: string;
  sellerId: string;
  storeId: string;
  start: string;
  end: string | null;
}

export interface StaffActivity {
  id: string;
  sellerId: string;
  type: 'shift_start' | 'sale' | 'break_start' | 'break_end' | 'shift_end';
  title: string;
  time: string;
  date: string;
  meta: string;
}

export interface StaffMember {
  id: string;
  apiId?: string;
  telegramId?: string;
  name: string;
  storeId: string;
  status: 'online' | 'offline';
  joinedDate: string;
}

interface StaffState {
  staff: StaffMember[];
  shifts: Shift[];
  activity: StaffActivity[];
  loadStaff: () => Promise<void>;
  loadStaffShifts: (staffId: string) => Promise<void>;
  loadStaffActivity: (staffId: string) => Promise<void>;
  addStaff: (member: { telegramId: string; name: string; storeId: string }) => Promise<void>;
  updateStaff: (id: string, updates: Partial<StaffMember>) => Promise<void>;
  getSellerHours: (sellerId: string, range: 'day' | 'week' | 'month') => number;
}

const mapStoreId = (apiStoreId: string) =>
  useInventoryStore.getState().stores.find((store) => store.apiId === apiStoreId)?.id ?? apiStoreId;

const mapApiStaff = (member: ApiStaff): StaffMember => ({
  id: member.id,
  apiId: member.id,
  telegramId: member.telegram_id,
  name: member.full_name,
  storeId: mapStoreId(member.assigned_store_ids[0] ?? ''),
  status: member.latest_shift_status,
  joinedDate: member.joined_date,
});

const mapApiShift = (shift: ApiStaffShift): Shift => ({
  id: shift.id,
  sellerId: shift.seller_id,
  storeId: mapStoreId(shift.store_id),
  start: shift.started_at,
  end: shift.ended_at ?? null,
});

const mapApiActivity = (activity: ApiStaffActivity, sellerId: string): StaffActivity => {
  const createdAt = new Date(activity.created_at);
  return {
    id: activity.id,
    sellerId,
    type: activity.event_type,
    title: activity.title,
    time: createdAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
    date: createdAt.toISOString().slice(0, 10),
    meta: activity.meta ?? '',
  };
};

export const useStaffStore = create<StaffState>((set, get) => ({
  staff: [],
  shifts: [],
  activity: [],
  loadStaff: async () => {
    const staff = await fetchStaffList();
    set({ staff: staff.map(mapApiStaff) });
  },
  loadStaffShifts: async (staffId) => {
    const shifts = await fetchStaffShifts(staffId);
    set((state) => ({
      shifts: [
        ...state.shifts.filter((shift) => shift.sellerId !== staffId),
        ...shifts.map(mapApiShift),
      ],
    }));
  },
  loadStaffActivity: async (staffId) => {
    const activity = await fetchStaffActivity(staffId);
    set((state) => ({
      activity: [
        ...state.activity.filter((entry) => entry.sellerId !== staffId),
        ...activity.map((entry) => mapApiActivity(entry, staffId)),
      ],
    }));
  },
  addStaff: async (member) => {
    const store = useInventoryStore.getState().stores.find((item) => item.id === member.storeId);
    const created = await createStaff({
      telegramId: member.telegramId,
      fullName: member.name,
      storeId: store?.apiId ?? member.storeId,
    });
    set((state) => ({ staff: [mapApiStaff(created), ...state.staff] }));
  },
  updateStaff: async (id, updates) => {
    const store = updates.storeId
      ? useInventoryStore.getState().stores.find((item) => item.id === updates.storeId)
      : undefined;
    const updated = await updateStaffMember(id, {
      fullName: updates.name,
      storeId: store?.apiId,
    });
    set((state) => ({
      staff: state.staff.map((member) => (member.id === id ? mapApiStaff(updated) : member)),
    }));
  },
  getSellerHours: (sellerId, _range) => {
    const sellerShifts = get().shifts.filter((shift) => shift.sellerId === sellerId && shift.end);
    return sellerShifts.reduce((acc, shift) => {
      const start = new Date(shift.start);
      const end = new Date(shift.end!);
      return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);
  },
}));
