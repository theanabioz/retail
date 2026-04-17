import WebApp from '@twa-dev/sdk';
import type { UserRole } from '../store/useAuthStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface ApiStore {
  id: string;
  name: string;
  address: string;
  is_active: boolean;
}

export interface ApiProduct {
  id: string;
  name: string;
  barcode: string;
  default_price: string;
  is_active: boolean;
}

export interface ApiInventoryBalance {
  store_id: string;
  product_id: string;
  quantity: number;
}

export interface ApiMeResponse {
  telegram_id: string;
  role: 'admin' | 'seller';
  full_name: string;
  username?: string | null;
  assigned_store_ids: string[];
}

export interface ApiBreak {
  id: string;
  started_at: string;
  ended_at?: string | null;
}

export interface ApiShift {
  id: string;
  store_id: string;
  seller_id: string;
  status: string;
  started_at: string;
  ended_at?: string | null;
  breaks: ApiBreak[];
}

export interface ApiSaleItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  base_price: string;
  sold_price: string;
  line_total: string;
}

export interface ApiSale {
  id: string;
  store_id: string;
  store_name: string;
  seller_id: string;
  total_amount: string;
  payment_method: 'card' | 'cash';
  status: string;
  created_at: string;
  items: ApiSaleItem[];
}

export interface ApiStaff {
  id: string;
  telegram_id: string;
  full_name: string;
  username?: string | null;
  role: string;
  is_active: boolean;
  assigned_store_ids: string[];
  latest_shift_status: 'online' | 'offline';
  joined_date: string;
}

export interface ApiStaffShift {
  id: string;
  seller_id: string;
  store_id: string;
  started_at: string;
  ended_at?: string | null;
}

export interface ApiStaffActivity {
  id: string;
  event_type: 'shift_start' | 'sale' | 'break_start' | 'break_end' | 'shift_end';
  title: string;
  meta?: string | null;
  created_at: string;
}

export interface ApiDashboardBucket {
  name: string;
  revenue: string;
}

export interface ApiDashboardTopProduct {
  name: string;
  sales: number;
  revenue: string;
}

export interface ApiDashboardStorePerformance {
  store_id: string;
  store_name: string;
  revenue: string;
  sales_count: number;
}

export interface ApiDashboardSummary {
  total_revenue: string;
  sales_data: ApiDashboardBucket[];
  top_products: ApiDashboardTopProduct[];
  store_performance: ApiDashboardStorePerformance[];
}

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {};
  const initData = WebApp?.initData;

  if (initData) {
    headers['X-Telegram-Init-Data'] = initData;
  }

  return headers;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function authenticateTelegram(): Promise<{
  telegramId: string;
  role: UserRole;
  fullName: string;
  assignedStoreIds: string[];
}> {
  const response = await fetchJson<{
    telegram_id: string;
    role: 'admin' | 'seller';
    full_name: string;
    assigned_store_ids: string[];
  }>('/auth/telegram', {
    method: 'POST',
    body: JSON.stringify({ init_data: WebApp.initData }),
  });

  return {
    telegramId: response.telegram_id,
    role: response.role === 'admin' ? 'ADMIN' : 'SELLER',
    fullName: response.full_name,
    assignedStoreIds: response.assigned_store_ids,
  };
}

export async function fetchMe(): Promise<{
  telegramId: string;
  role: UserRole;
  fullName: string;
  assignedStoreIds: string[];
}> {
  const response = await fetchJson<ApiMeResponse>('/me');
  return {
    telegramId: response.telegram_id,
    role: response.role === 'admin' ? 'ADMIN' : 'SELLER',
    fullName: response.full_name,
    assignedStoreIds: response.assigned_store_ids,
  };
}

export async function fetchCatalog() {
  const [stores, products, inventory] = await Promise.all([
    fetchJson<ApiStore[]>('/stores'),
    fetchJson<ApiProduct[]>('/products'),
    fetchJson<ApiInventoryBalance[]>('/inventory'),
  ]);

  return { stores, products, inventory };
}

export async function createStore(payload: { name: string; address: string }): Promise<ApiStore> {
  return fetchJson<ApiStore>('/stores', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function disableStore(storeId: string): Promise<ApiStore> {
  return fetchJson<ApiStore>(`/stores/${storeId}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: false }),
  });
}

export async function createProduct(payload: {
  name: string;
  barcode: string;
  price: number;
}): Promise<ApiProduct> {
  return fetchJson<ApiProduct>('/products', {
    method: 'POST',
    body: JSON.stringify({
      name: payload.name,
      barcode: payload.barcode,
      default_price: payload.price,
    }),
  });
}

export async function updateProductByApiId(
  productId: string,
  payload: { name?: string; barcode?: string; price?: number }
): Promise<ApiProduct> {
  return fetchJson<ApiProduct>(`/products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: payload.name,
      barcode: payload.barcode,
      default_price: payload.price,
    }),
  });
}

export async function disableProduct(productId: string): Promise<ApiProduct> {
  return fetchJson<ApiProduct>(`/products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: false }),
  });
}

export async function updateInventoryQuantity(
  storeId: string,
  productId: string,
  quantity: number
): Promise<ApiInventoryBalance> {
  return fetchJson<ApiInventoryBalance>(`/inventory/${storeId}/${productId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  });
}

export async function fetchCurrentShift(): Promise<ApiShift | null> {
  return fetchJson<ApiShift | null>('/shifts/current');
}

export async function startShift(storeId: string): Promise<ApiShift> {
  return fetchJson<ApiShift>('/shifts/start', {
    method: 'POST',
    body: JSON.stringify({ store_id: storeId }),
  });
}

export async function endShift(): Promise<ApiShift> {
  return fetchJson<ApiShift>('/shifts/end', {
    method: 'POST',
  });
}

export async function startBreak(): Promise<{ shift: ApiShift }> {
  return fetchJson<{ shift: ApiShift }>('/shifts/break/start', {
    method: 'POST',
  });
}

export async function endBreak(): Promise<{ shift: ApiShift }> {
  return fetchJson<{ shift: ApiShift }>('/shifts/break/end', {
    method: 'POST',
  });
}

export async function fetchSales(params?: {
  storeId?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<ApiSale[]> {
  const searchParams = new URLSearchParams();
  if (params?.storeId) searchParams.set('store_id', params.storeId);
  if (params?.fromDate) searchParams.set('from_date', params.fromDate);
  if (params?.toDate) searchParams.set('to_date', params.toDate);

  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const response = await fetchJson<{ sales: ApiSale[] }>(`/sales${suffix}`);
  return response.sales;
}

export async function fetchDashboardSummary(range: 'day' | 'week' | 'month' | 'all'): Promise<ApiDashboardSummary> {
  return fetchJson<ApiDashboardSummary>(`/dashboard/summary?range=${range}`);
}

export async function createSale(payload: {
  storeId: string;
  paymentMethod: 'card' | 'cash';
  items: { productId: string; quantity: number; soldPrice: number }[];
}): Promise<ApiSale> {
  return fetchJson<ApiSale>('/sales', {
    method: 'POST',
    body: JSON.stringify({
      store_id: payload.storeId,
      payment_method: payload.paymentMethod,
      items: payload.items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
        sold_price: item.soldPrice,
      })),
    }),
  });
}

export async function fetchStaffList(): Promise<ApiStaff[]> {
  return fetchJson<ApiStaff[]>('/staff');
}

export async function createStaff(payload: {
  telegramId: string;
  fullName: string;
  storeId: string;
}): Promise<ApiStaff> {
  return fetchJson<ApiStaff>('/staff', {
    method: 'POST',
    body: JSON.stringify({
      telegram_id: payload.telegramId,
      full_name: payload.fullName,
      store_id: payload.storeId,
    }),
  });
}

export async function updateStaffMember(
  staffId: string,
  payload: { fullName?: string; storeId?: string }
): Promise<ApiStaff> {
  return fetchJson<ApiStaff>(`/staff/${staffId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      full_name: payload.fullName,
      store_id: payload.storeId,
    }),
  });
}

export async function disableStaffMember(staffId: string): Promise<ApiStaff> {
  return fetchJson<ApiStaff>(`/staff/${staffId}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: false }),
  });
}

export async function fetchStaffShifts(staffId: string): Promise<ApiStaffShift[]> {
  const shifts = await fetchJson<Array<Omit<ApiStaffShift, 'seller_id'>>>(`/staff/${staffId}/shifts`);
  return shifts.map((shift) => ({ ...shift, seller_id: staffId }));
}

export async function fetchStaffActivity(staffId: string): Promise<ApiStaffActivity[]> {
  return fetchJson<ApiStaffActivity[]>(`/staff/${staffId}/activity`);
}
