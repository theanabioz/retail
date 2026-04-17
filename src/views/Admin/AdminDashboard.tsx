import { useState, useMemo } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useInventoryStore, type Store as StoreType, type Product } from '../../store/useInventoryStore';
import { useStaffStore, type StaffMember } from '../../store/useStaffStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { 
  LogOut, 
  BarChart3, 
  Package, 
  Store, 
  Users, 
  Settings, 
  ChevronRight,
  ArrowLeft,
  TrendingUp,
  Award,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Save,
  Clock,
  UserPlus,
  Sun,
  Moon,
  Monitor,
  Receipt,
  ShoppingCart
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

type TimeRange = 'day' | 'week' | 'month' | 'all';

interface SaleRecord {
  id: string;
  storeId: string;
  storeName: string;
  date: string;
  time: string;
  total: number;
  items: string;
}

// Global Mock Sales Feed
const mockSalesFeed: SaleRecord[] = [
  { id: '101', storeId: '1', storeName: 'Central Mall', date: '2026-04-17', time: '14:25', total: 24.50, items: '1x Herbal Oil 10ml' },
  { id: '102', storeId: '2', storeName: 'City Station', date: '2026-04-17', time: '14:10', total: 29.90, items: '1x Aroma Cartridge' },
  { id: '103', storeId: '1', storeName: 'Central Mall', date: '2026-04-17', time: '13:45', total: 27.00, items: '2x Pre-Rolled Herbal Stick, 1x Herbal Blend 1g' },
  { id: '104', storeId: '2', storeName: 'City Station', date: '2026-04-17', time: '13:15', total: 39.00, items: '1x Starter Kit' },
  { id: '105', storeId: '1', storeName: 'Central Mall', date: '2026-04-17', time: '12:50', total: 17.90, items: '1x Terpene Drops' },
  { id: '106', storeId: '2', storeName: 'City Station', date: '2026-04-16', time: '18:35', total: 21.00, items: '1x Relax Gummies 20pcs' },
  { id: '107', storeId: '1', storeName: 'Central Mall', date: '2026-04-16', time: '17:05', total: 45.80, items: '2x Herbal Blend 3g' },
  { id: '108', storeId: '2', storeName: 'City Station', date: '2026-04-16', time: '16:40', total: 55.00, items: '2x Premium Flower Pack' },
  { id: '109', storeId: '1', storeName: 'Central Mall', date: '2026-04-15', time: '15:15', total: 19.50, items: '1x Botanical Balm 30g' },
  { id: '110', storeId: '2', storeName: 'City Station', date: '2026-04-15', time: '13:55', total: 26.70, items: '3x Herbal Blend 1g' },
  { id: '111', storeId: '1', storeName: 'Central Mall', date: '2026-04-14', time: '11:20', total: 33.00, items: '1x Relax Gummies 20pcs, 2x Pre-Rolled Herbal Stick' },
  { id: '112', storeId: '2', storeName: 'City Station', date: '2026-04-14', time: '09:50', total: 24.90, items: '1x Herbal Oil 10ml' },
];

// Mock data factories
const getSalesData = (range: TimeRange, storeId: string = 'all') => {
  const seed = storeId === 'all' ? 1 : (parseInt(storeId) % 2 === 0 ? 0.6 : 0.4);
  switch (range) {
    case 'day':
      return Array.from({ length: 24 }, (_, i) => ({
        name: `${i.toString().padStart(2, '0')}:00`,
        revenue: i >= 8 && i <= 22 ? Math.round((100 + Math.random() * 500) * seed) : Math.round(Math.random() * 50)
      }));
    case 'month':
      return [
        { name: 'Week 1', revenue: Math.round(8400 * seed) }, { name: 'Week 2', revenue: Math.round(9200 * seed) },
        { name: 'Week 3', revenue: Math.round(7800 * seed) }, { name: 'Week 4', revenue: Math.round(10500 * seed) },
      ];
    case 'all':
      return [
        { name: '2023', revenue: Math.round(85000 * seed) }, { name: '2024', revenue: Math.round(124000 * seed) },
        { name: '2025', revenue: Math.round(45000 * seed) },
      ];
    default:
      return [
        { name: 'Mon', revenue: Math.round(1400 * seed) }, { name: 'Tue', revenue: Math.round(1300 * seed) },
        { name: 'Wed', revenue: Math.round(980 * seed) }, { name: 'Thu', revenue: Math.round(1200 * seed) },
        { name: 'Fri', revenue: Math.round(1800 * seed) }, { name: 'Sat', revenue: Math.round(2390 * seed) },
        { name: 'Sun', revenue: Math.round(2100 * seed) },
      ];
  }
};

const getTopProducts = (range: TimeRange, storeId: string = 'all') => {
  const multipliers: Record<TimeRange, number> = { day: 0.15, week: 1, month: 4.2, all: 52 };
  const storeSeed = storeId === 'all' ? 1 : 0.6;
  const m = multipliers[range] * storeSeed;
  return [
    { name: 'Herbal Blend 1g', sales: Math.round(142 * m), revenue: Math.round(1264 * m) },
    { name: 'Pre-Rolled Herbal Stick', sales: Math.round(98 * m), revenue: Math.round(637 * m) },
    { name: 'Herbal Oil 10ml', sales: Math.round(45 * m), revenue: Math.round(1121 * m) },
  ];
};

type AdminTab = 'stats' | 'inventory' | 'stores' | 'users' | 'settings';
type SalesFeedFilter = 'today' | 'yesterday' | 'date';

export const AdminDashboard: React.FC = () => {
  const { logout } = useAuthStore();
  const { stores, products, updateStock, addProduct, addStore, removeProduct, updateProduct } = useInventoryStore();
  const { staff, addStaff, removeStaff, updateStaff, getSellerHours, shifts } = useStaffStore();
  const { theme, setTheme } = useSettingsStore();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [detailStore, setDetailStore] = useState<StoreType | null>(null);
  const [detailStaff, setDetailStaff] = useState<StaffMember | null>(null);
  const [storeDetailTab, setStoreDetailTab] = useState<'performance' | 'stock'>('performance');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [storeTimeRange, setStoreTimeRange] = useState<TimeRange>('week');
  const [isNetworkSalesOpen, setIsNetworkSalesOpen] = useState(false);
  const [isStoreSalesOpen, setIsStoreSalesOpen] = useState(false);
  const [salesFeedFilter, setSalesFeedFilter] = useState<SalesFeedFilter>('today');
  const [selectedSalesFromDate, setSelectedSalesFromDate] = useState('2026-04-14');
  const [selectedSalesToDate, setSelectedSalesToDate] = useState('2026-04-17');
  
  // UI State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', barcode: '' });

  const [isStoreEditorOpen, setIsStoreEditorOpen] = useState(false);
  const [storeFormData, setStoreFormData] = useState({ name: '', address: '' });
  
  const [isStaffEditorOpen, setIsStaffEditorOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [staffFormData, setStaffFormData] = useState({ name: '', storeId: '' });

  // Global calculations
  const salesData = useMemo(() => getSalesData(timeRange), [timeRange]);
  const topProductsData = useMemo(() => getTopProducts(timeRange), [timeRange]);
  const totalRevenue = useMemo(() => salesData.reduce((acc, d) => acc + d.revenue, 0), [salesData]);

  // Per-store calculations
  const storeSalesData = useMemo(() => detailStore ? getSalesData(storeTimeRange, detailStore.id) : [], [detailStore, storeTimeRange]);
  
  const lowStockCount = useMemo(() => {
    return products.filter(p => Object.values(p.stock).some(s => s < 10)).length;
  }, [products]);

  const filteredNetworkSales = useMemo(() => {
    if (salesFeedFilter === 'today') {
      return mockSalesFeed.filter((sale) => sale.date === '2026-04-17');
    }

    if (salesFeedFilter === 'yesterday') {
      return mockSalesFeed.filter((sale) => sale.date === '2026-04-16');
    }

    return mockSalesFeed.filter((sale) => sale.date >= selectedSalesFromDate && sale.date <= selectedSalesToDate);
  }, [salesFeedFilter, selectedSalesFromDate, selectedSalesToDate]);

  const filteredStoreSales = useMemo(() => {
    if (!detailStore) {
      return [];
    }

    const storeSales = mockSalesFeed.filter((sale) => sale.storeId === detailStore.id);

    if (salesFeedFilter === 'today') {
      return storeSales.filter((sale) => sale.date === '2026-04-17');
    }

    if (salesFeedFilter === 'yesterday') {
      return storeSales.filter((sale) => sale.date === '2026-04-16');
    }

    return storeSales.filter((sale) => sale.date >= selectedSalesFromDate && sale.date <= selectedSalesToDate);
  }, [detailStore, salesFeedFilter, selectedSalesFromDate, selectedSalesToDate]);

  const timeLabels: Record<TimeRange, string> = {
    day: 'vs yesterday',
    week: 'vs last week',
    month: 'vs last month',
    all: 'vs last year'
  };

  const handleSaveProduct = () => {
    if (!formData.name || !formData.price) return;
    if (editingProduct) {
      updateProduct(editingProduct.id, { name: formData.name, price: parseFloat(formData.price), barcode: formData.barcode });
    } else {
      addProduct({ id: 'p' + Date.now(), name: formData.name, price: parseFloat(formData.price), barcode: formData.barcode || Math.floor(Math.random() * 1000000).toString(), stock: stores.reduce((acc, s) => ({ ...acc, [s.id]: 0 }), {}) });
    }
    setIsEditorOpen(false);
  };

  const handleSaveStaff = () => {
    if (!staffFormData.name || !staffFormData.storeId) return;
    if (editingStaff) {
      updateStaff(editingStaff.id, { name: staffFormData.name, storeId: staffFormData.storeId });
    } else {
      addStaff({ id: 's' + Date.now(), name: staffFormData.name, storeId: staffFormData.storeId, status: 'offline', joinedDate: new Date().toISOString().split('T')[0] });
    }
    setIsStaffEditorOpen(false);
  };

  const handleSaveStore = () => {
    if (!storeFormData.name || !storeFormData.address) return;

    addStore({
      id: 'st' + Date.now(),
      name: storeFormData.name,
      address: storeFormData.address,
    });

    setIsStoreEditorOpen(false);
    setStoreFormData({ name: '', address: '' });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'stats':
        if (isNetworkSalesOpen) {
          return (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key="network-sales-detail">
              <button onClick={() => setIsNetworkSalesOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--button-color)', background: 'none', marginBottom: '16px', padding: 0 }}>
                <ArrowLeft size={18} /> Back
              </button>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '24px', marginBottom: '4px' }}>Network Sales Feed</h3>
                <p style={{ color: 'var(--hint-color)', fontSize: '13px' }}>Latest sales across all retail locations</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', backgroundColor: 'var(--secondary-bg-color)', padding: '4px', borderRadius: '12px', marginBottom: salesFeedFilter === 'date' ? '12px' : 0 }}>
                  <button
                    onClick={() => setSalesFeedFilter('today')}
                    style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', fontSize: '13px', fontWeight: salesFeedFilter === 'today' ? 'bold' : 'normal', backgroundColor: salesFeedFilter === 'today' ? 'var(--bg-color)' : 'transparent', color: salesFeedFilter === 'today' ? 'var(--button-color)' : 'var(--hint-color)', boxShadow: salesFeedFilter === 'today' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setSalesFeedFilter('yesterday')}
                    style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', fontSize: '13px', fontWeight: salesFeedFilter === 'yesterday' ? 'bold' : 'normal', backgroundColor: salesFeedFilter === 'yesterday' ? 'var(--bg-color)' : 'transparent', color: salesFeedFilter === 'yesterday' ? 'var(--button-color)' : 'var(--hint-color)', boxShadow: salesFeedFilter === 'yesterday' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
                  >
                    Yesterday
                  </button>
                  <button
                    onClick={() => setSalesFeedFilter('date')}
                    style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', fontSize: '13px', fontWeight: salesFeedFilter === 'date' ? 'bold' : 'normal', backgroundColor: salesFeedFilter === 'date' ? 'var(--bg-color)' : 'transparent', color: salesFeedFilter === 'date' ? 'var(--button-color)' : 'var(--hint-color)', boxShadow: salesFeedFilter === 'date' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
                  >
                    Any Date
                  </button>
                </div>

                {salesFeedFilter === 'date' && (
                  <div className="card" style={{ padding: '8px', marginBottom: 0, display: 'grid', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--bg-color)', borderRadius: '10px', padding: '10px 12px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--hint-color)', minWidth: '32px', margin: 0 }}>
                        From
                      </label>
                      <input
                        type="date"
                        value={selectedSalesFromDate}
                        max={selectedSalesToDate}
                        onChange={(e) => setSelectedSalesFromDate(e.target.value)}
                        style={{ marginBottom: 0, minWidth: 0, flex: 1, padding: 0, border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 600, WebkitAppearance: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--bg-color)', borderRadius: '10px', padding: '10px 12px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--hint-color)', minWidth: '32px', margin: 0 }}>
                        To
                      </label>
                      <input
                        type="date"
                        value={selectedSalesToDate}
                        min={selectedSalesFromDate}
                        onChange={(e) => setSelectedSalesToDate(e.target.value)}
                        style={{ marginBottom: 0, minWidth: 0, flex: 1, padding: 0, border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 600, WebkitAppearance: 'none' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="card" style={{ padding: '0' }}>
                {filteredNetworkSales.length > 0 ? (
                  filteredNetworkSales.map((sale, idx) => (
                    <div
                      key={sale.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '14px 16px',
                        borderBottom: idx !== filteredNetworkSales.length - 1 ? '1px solid var(--bg-color)' : 'none'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>€{sale.total.toFixed(2)}</span>
                          <span style={{ fontSize: '10px', color: 'var(--button-color)', backgroundColor: 'var(--secondary-bg-color)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                            {sale.storeName}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--hint-color)' }}>{sale.items}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: 'var(--hint-color)', fontWeight: '500' }}>{sale.time}</div>
                        <div style={{ fontSize: '10px', color: 'var(--hint-color)', marginTop: '2px' }}>{sale.date}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '18px 16px', color: 'var(--hint-color)', fontSize: '13px' }}>
                    No sales found for the selected date.
                  </div>
                )}
              </div>
            </motion.div>
          );
        }

        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="stats">
            <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>Global Performance</h3>
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
            <div className="card" style={{ height: '220px', padding: '16px 8px 16px 0' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--hint-color)" opacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} interval={timeRange === 'day' ? 3 : 0} tick={{ fontSize: 10, fill: 'var(--hint-color)' }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} itemStyle={{ fontSize: '12px', color: 'var(--button-color)' }} formatter={(value) => [`€${value}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="var(--button-color)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
              <div className="card" style={{ padding: '12px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--hint-color)', fontSize: '11px', marginBottom: '4px' }}><TrendingUp size={14} /> Total Revenue</div><div style={{ fontSize: '18px', fontWeight: 'bold' }}>€{totalRevenue.toLocaleString()}</div></div>
              <div className="card" style={{ padding: '12px', border: lowStockCount > 0 ? '1px solid #ff4d4f33' : 'none' }}><div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: lowStockCount > 0 ? 'var(--danger-color)' : 'var(--hint-color)', fontSize: '11px', marginBottom: '4px' }}><AlertCircle size={14} /> Low Stock</div><div style={{ fontSize: '18px', fontWeight: 'bold', color: lowStockCount > 0 ? 'var(--danger-color)' : 'inherit' }}>{lowStockCount} Items</div></div>
            </div>

            {/* Global Recent Sales Feed */}
            <div style={{ marginTop: '24px' }}>
              <button
                onClick={() => setIsNetworkSalesOpen(true)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '16px', background: 'none', width: '100%', padding: 0, color: 'inherit' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Receipt size={18} color="var(--button-color)" />
                  <h4 style={{ margin: 0, fontSize: '16px' }}>Network Sales Feed</h4>
                </div>
                <ChevronRight size={18} color="var(--hint-color)" />
              </button>
              <div
                className="card"
                onClick={() => setIsNetworkSalesOpen(true)}
                style={{ padding: '0', cursor: 'pointer' }}
              >
                {mockSalesFeed.slice(0, 5).map((sale, idx) => (
                  <div key={sale.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: idx !== 4 ? '1px solid var(--bg-color)' : 'none' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>€{sale.total.toFixed(2)}</span>
                        <span style={{ fontSize: '10px', color: 'var(--button-color)', backgroundColor: 'var(--secondary-bg-color)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{sale.storeName}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--hint-color)', marginTop: '2px' }}>{sale.items}</div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--hint-color)', fontWeight: '500' }}>{sale.time}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Award size={18} color="var(--button-color)" />
                <h4 style={{ margin: 0 }}>Top Selling Products</h4>
              </div>
              <div className="card" style={{ padding: '0' }}>
                {topProductsData.map((p, idx) => (
                  <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: idx !== topProductsData.length - 1 ? '1px solid var(--bg-color)' : 'none' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--hint-color)' }}>{p.sales.toLocaleString()} sold</div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>€{p.revenue.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <h4 style={{ marginBottom: '12px' }}>Store Performance</h4>
              {stores.map((s, idx) => (
                <div key={s.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Store size={16} color="var(--button-color)" /><span style={{ fontSize: '14px' }}>{s.name}</span></div>
                  <div style={{ textAlign: 'right' }}><div style={{ fontSize: '14px', fontWeight: 'bold' }}>€{(totalRevenue * (idx === 0 ? 0.6 : 0.4)).toFixed(0)}</div><div style={{ fontSize: '10px', color: 'var(--success-color)' }}>+12% {timeLabels[timeRange]}</div></div>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 'inventory':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="inventory">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}><h3 style={{ fontSize: '24px' }}>Inventory</h3><button onClick={() => { setEditingProduct(null); setFormData({ name: '', price: '', barcode: '' }); setIsEditorOpen(true); }} style={{ backgroundColor: 'var(--button-color)', color: 'white', padding: '8px 16px', borderRadius: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}><Plus size={18} /> Add Product</button></div>
            <div style={{ display: 'grid', gap: '12px' }}>{products.map(product => (<div key={product.id} className="card" style={{ padding: '16px' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}><div><div style={{ fontWeight: 'bold', fontSize: '17px' }}>{product.name}</div><div style={{ color: 'var(--button-color)', fontWeight: 'bold', fontSize: '15px' }}>€{product.price.toFixed(2)}</div><div style={{ fontSize: '11px', color: 'var(--hint-color)', marginTop: '2px' }}>Barcode: {product.barcode}</div></div><div style={{ display: 'flex', gap: '8px' }}><button onClick={() => { setEditingProduct(product); setFormData({ name: product.name, price: product.price.toString(), barcode: product.barcode }); setIsEditorOpen(true); }} style={{ padding: '8px', backgroundColor: 'var(--bg-color)', borderRadius: '10px', color: 'var(--button-color)' }}><Pencil size={18}/></button><button onClick={() => { if(confirm('Delete this product?')) removeProduct(product.id) }} style={{ padding: '8px', backgroundColor: 'var(--bg-color)', borderRadius: '10px', color: 'var(--danger-color)' }}><Trash2 size={18}/></button></div></div><div style={{ backgroundColor: 'var(--bg-color)', borderRadius: '12px', padding: '12px', display: 'grid', gap: '10px' }}>{stores.map(store => (<div key={store.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '13px', fontWeight: '500' }}>{store.name}</span><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><button onClick={() => updateStock(product.id, store.id, -1)} style={{ width: '28px', height: '28px', backgroundColor: 'var(--secondary-bg-color)', borderRadius: '6px', fontWeight: 'bold' }}>-</button><span style={{ minWidth: '30px', textAlign: 'center' , fontWeight: 'bold', fontSize: '14px' }}>{product.stock[store.id] || 0}</span><button onClick={() => updateStock(product.id, store.id, 1)} style={{ width: '28px', height: '28px', backgroundColor: 'var(--secondary-bg-color)', borderRadius: '6px', fontWeight: 'bold' }}>+</button></div></div>))}</div></div>))}</div>
            <ProductEditor isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} onSave={handleSaveProduct} formData={formData} setFormData={setFormData} isEdit={!!editingProduct} />
          </motion.div>
        );

      case 'stores':
        return (
          <AnimatePresence mode="wait">
            {!detailStore ? (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="store-list">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '24px', marginBottom: 0 }}>Retail Locations</h3>
                  <button
                    onClick={() => {
                      setStoreFormData({ name: '', address: '' });
                      setIsStoreEditorOpen(true);
                    }}
                    style={{ backgroundColor: 'var(--button-color)', color: 'white', padding: '8px 16px', borderRadius: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
                  >
                    <Plus size={18} /> Add Store
                  </button>
                </div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {stores.map(store => (
                    <div key={store.id} className="card" onClick={() => { setDetailStore(store); setStoreDetailTab('performance'); }} style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}><div style={{ backgroundColor: 'var(--bg-color)', padding: '10px', borderRadius: '12px' }}><Store size={24} color="var(--button-color)" /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 'bold' }}>{store.name}</div><div style={{ fontSize: '12px', color: 'var(--hint-color)' }}>{store.address}</div></div><ChevronRight size={20} color="var(--hint-color)" /></div>
                  ))}
                </div>
                <StoreEditor isOpen={isStoreEditorOpen} onClose={() => setIsStoreEditorOpen(false)} onSave={handleSaveStore} formData={storeFormData} setFormData={setStoreFormData} />
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} key="store-detail">
                {isStoreSalesOpen ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ paddingBottom: '40px' }}>
                    <button onClick={() => setIsStoreSalesOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--button-color)', background: 'none', marginBottom: '16px', padding: 0 }}>
                      <ArrowLeft size={18} /> Back
                    </button>

                    <div style={{ marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '24px', marginBottom: '4px' }}>Recent Sales</h3>
                      <p style={{ color: 'var(--hint-color)', fontSize: '13px' }}>Latest sales for {detailStore.name}</p>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', backgroundColor: 'var(--secondary-bg-color)', padding: '4px', borderRadius: '12px', marginBottom: salesFeedFilter === 'date' ? '12px' : 0 }}>
                        <button
                          onClick={() => setSalesFeedFilter('today')}
                          style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', fontSize: '13px', fontWeight: salesFeedFilter === 'today' ? 'bold' : 'normal', backgroundColor: salesFeedFilter === 'today' ? 'var(--bg-color)' : 'transparent', color: salesFeedFilter === 'today' ? 'var(--button-color)' : 'var(--hint-color)', boxShadow: salesFeedFilter === 'today' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
                        >
                          Today
                        </button>
                        <button
                          onClick={() => setSalesFeedFilter('yesterday')}
                          style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', fontSize: '13px', fontWeight: salesFeedFilter === 'yesterday' ? 'bold' : 'normal', backgroundColor: salesFeedFilter === 'yesterday' ? 'var(--bg-color)' : 'transparent', color: salesFeedFilter === 'yesterday' ? 'var(--button-color)' : 'var(--hint-color)', boxShadow: salesFeedFilter === 'yesterday' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
                        >
                          Yesterday
                        </button>
                        <button
                          onClick={() => setSalesFeedFilter('date')}
                          style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', fontSize: '13px', fontWeight: salesFeedFilter === 'date' ? 'bold' : 'normal', backgroundColor: salesFeedFilter === 'date' ? 'var(--bg-color)' : 'transparent', color: salesFeedFilter === 'date' ? 'var(--button-color)' : 'var(--hint-color)', boxShadow: salesFeedFilter === 'date' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
                        >
                          Any Date
                        </button>
                      </div>

                      {salesFeedFilter === 'date' && (
                        <div className="card" style={{ padding: '8px', marginBottom: 0, display: 'grid', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--bg-color)', borderRadius: '10px', padding: '10px 12px' }}>
                            <label style={{ fontSize: '11px', color: 'var(--hint-color)', minWidth: '32px', margin: 0 }}>
                              From
                            </label>
                            <input
                              type="date"
                              value={selectedSalesFromDate}
                              max={selectedSalesToDate}
                              onChange={(e) => setSelectedSalesFromDate(e.target.value)}
                              style={{ marginBottom: 0, minWidth: 0, flex: 1, padding: 0, border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 600, WebkitAppearance: 'none' }}
                            />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--bg-color)', borderRadius: '10px', padding: '10px 12px' }}>
                            <label style={{ fontSize: '11px', color: 'var(--hint-color)', minWidth: '32px', margin: 0 }}>
                              To
                            </label>
                            <input
                              type="date"
                              value={selectedSalesToDate}
                              min={selectedSalesFromDate}
                              onChange={(e) => setSelectedSalesToDate(e.target.value)}
                              style={{ marginBottom: 0, minWidth: 0, flex: 1, padding: 0, border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 600, WebkitAppearance: 'none' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="card" style={{ padding: '0' }}>
                      {filteredStoreSales.length > 0 ? (
                        filteredStoreSales.map((sale, idx) => (
                          <div key={sale.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: idx !== filteredStoreSales.length - 1 ? '1px solid var(--bg-color)' : 'none' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>€{sale.total.toFixed(2)}</div>
                              <div style={{ fontSize: '11px', color: 'var(--hint-color)', marginTop: '2px' }}>{sale.items}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '12px', color: 'var(--hint-color)' }}>{sale.time}</div>
                              <div style={{ fontSize: '10px', color: 'var(--hint-color)', marginTop: '2px' }}>{sale.date}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '18px 16px', color: 'var(--hint-color)', fontSize: '13px' }}>
                          No sales found for the selected date.
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <>
                    <button onClick={() => setDetailStore(null)} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--button-color)', background: 'none', marginBottom: '16px', padding: 0 }}><ArrowLeft size={18} /> Back</button>
                    <div style={{ marginBottom: '20px' }}><h2>{detailStore.name}</h2><p style={{ color: 'var(--hint-color)' }}>{detailStore.address}</p></div>
                    
                    <div style={{ display: 'flex', backgroundColor: 'var(--secondary-bg-color)', padding: '4px', borderRadius: '14px', marginBottom: '24px' }}>
                      <button onClick={() => setStoreDetailTab('performance')} style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: storeDetailTab === 'performance' ? 'var(--bg-color)' : 'transparent', color: storeDetailTab === 'performance' ? 'var(--button-color)' : 'var(--hint-color)', transition: '0.2s' }}><BarChart3 size={18}/> Performance</button>
                      <button onClick={() => setStoreDetailTab('stock')} style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: storeDetailTab === 'stock' ? 'var(--bg-color)' : 'transparent', color: storeDetailTab === 'stock' ? 'var(--button-color)' : 'var(--hint-color)', transition: '0.2s' }}><Package size={18}/> Stock</button>
                    </div>

                    {storeDetailTab === 'performance' ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ paddingBottom: '40px' }}>
                      <TimeRangeSelector value={storeTimeRange} onChange={setStoreTimeRange} />
                      
                      <div className="card" style={{ height: '220px', padding: '16px 8px 16px 0' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={storeSalesData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--hint-color)" opacity={0.1} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} interval={storeTimeRange === 'day' ? 3 : 0} tick={{ fontSize: 10, fill: 'var(--hint-color)' }} />
                            <YAxis hide />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} itemStyle={{ fontSize: '12px' }} formatter={(v) => [`€${v}`, 'Revenue']} />
                            <Bar dataKey="revenue" fill="var(--button-color)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                        <div className="card" style={{ padding: '12px' }}>
                          <div style={{ color: 'var(--hint-color)', fontSize: '11px' }}>Total Revenue</div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>€{storeSalesData.reduce((acc, d) => acc + d.revenue, 0).toLocaleString()}</div>
                        </div>
                        <div className="card" style={{ padding: '12px' }}>
                          <div style={{ color: 'var(--hint-color)', fontSize: '11px' }}>Today's Sales</div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{Math.round(Math.random() * 20 + 10)}</div>
                        </div>
                      </div>

                      <div style={{ marginTop: '24px' }}>
                        <button
                          onClick={() => setIsStoreSalesOpen(true)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '16px', background: 'none', width: '100%', padding: 0, color: 'inherit' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ShoppingCart size={18} color="var(--button-color)" />
                            <h4 style={{ margin: 0, fontSize: '16px' }}>Recent Sales (Today)</h4>
                          </div>
                          <ChevronRight size={18} color="var(--hint-color)" />
                        </button>
                        <div className="card" onClick={() => setIsStoreSalesOpen(true)} style={{ padding: '0', cursor: 'pointer' }}>
                          {mockSalesFeed.filter(s => s.storeId === detailStore.id).slice(0, 5).map((sale, idx) => (
                            <div key={sale.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: idx !== 4 ? '1px solid var(--bg-color)' : 'none' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>€{sale.total.toFixed(2)}</div>
                                <div style={{ fontSize: '11px', color: 'var(--hint-color)', marginTop: '2px' }}>{sale.items}</div>
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--hint-color)' }}>{sale.time}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                    ) : (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: '80px' }}>
                          {products.map((product, idx) => {
                            const stockCount = product.stock[detailStore.id] || 0;
                            const isLowStock = stockCount < 10;

                            return (
                              <div
                                key={product.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '12px',
                                  padding: '14px 16px',
                                  borderBottom: idx !== products.length - 1 ? '1px solid var(--bg-color)' : 'none'
                                }}
                              >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '2px' }}>{product.name}</div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--hint-color)' }}>{product.barcode}</span>
                                    <span style={{ fontSize: '11px', color: 'var(--button-color)', fontWeight: 'bold' }}>€{product.price.toFixed(2)}</span>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                                  <button
                                    onClick={() => updateStock(product.id, detailStore.id, -1)}
                                    style={{
                                      width: '32px',
                                      height: '32px',
                                      backgroundColor: 'var(--bg-color)',
                                      borderRadius: '8px',
                                      color: 'var(--button-color)',
                                      fontSize: '18px',
                                      fontWeight: 'bold',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    -
                                  </button>

                                  <div style={{ minWidth: '44px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '17px', fontWeight: '900', color: isLowStock ? 'var(--danger-color)' : 'inherit', lineHeight: 1.1 }}>
                                      {stockCount}
                                    </div>
                                    <div style={{ fontSize: '9px', color: 'var(--hint-color)', textTransform: 'uppercase', marginTop: '2px' }}>
                                      units
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => updateStock(product.id, detailStore.id, 1)}
                                    style={{
                                      width: '32px',
                                      height: '32px',
                                      backgroundColor: 'var(--bg-color)',
                                      borderRadius: '8px',
                                      color: 'var(--button-color)',
                                      fontSize: '18px',
                                      fontWeight: 'bold',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ position: 'fixed', bottom: '90px', left: '16px', right: '16px', zIndex: 100 }}><button onClick={() => alert('Saved!')} style={{ width: '100%', backgroundColor: 'var(--button-color)', color: 'white', padding: '16px', borderRadius: '16px', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}><Save size={20}/> Save Inventory</button></div>
                      </motion.div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        );

      case 'users':
        return (
          <AnimatePresence mode="wait">
            {!detailStaff ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="staff-list">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}><h3 style={{ fontSize: '24px' }}>Staff</h3><button onClick={() => { setEditingStaff(null); setStaffFormData({ name: '', storeId: stores[0]?.id || '' }); setIsStaffEditorOpen(true); }} style={{ backgroundColor: 'var(--button-color)', color: 'white', padding: '8px 16px', borderRadius: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}><UserPlus size={18} /> Add Staff</button></div>
                <div style={{ display: 'grid', gap: '12px' }}>{staff.map(member => (<div key={member.id} className="card" onClick={() => setDetailStaff(member)} style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}><div style={{ position: 'relative' }}><div style={{ backgroundColor: 'var(--secondary-bg-color)', padding: '12px', borderRadius: '50%' }}><Users size={24} color="var(--button-color)" /></div><div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', borderRadius: '50%', backgroundColor: member.status === 'online' ? 'var(--success-color)' : 'var(--hint-color)', border: '2px solid var(--bg-color)' }} /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 'bold' }}>{member.name}</div><div style={{ fontSize: '12px', color: 'var(--hint-color)' }}>{stores.find(s => s.id === member.storeId)?.name}</div></div><ChevronRight size={20} color="var(--hint-color)" /></div>))}</div>
                <StaffEditor isOpen={isStaffEditorOpen} onClose={() => setIsStaffEditorOpen(false)} onSave={handleSaveStaff} formData={staffFormData} setFormData={setStaffFormData} stores={stores} isEdit={!!editingStaff} />
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key="staff-detail">
                <button onClick={() => setDetailStaff(null)} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--button-color)', background: 'none', marginBottom: '20px', padding: 0 }}><ArrowLeft size={18} /> Back</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}><div style={{ backgroundColor: 'var(--secondary-bg-color)', padding: '20px', borderRadius: '50%' }}><Users size={32} color="var(--button-color)" /></div><div><h2 style={{ marginBottom: '4px' }}>{detailStaff.name}</h2><span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '10px', backgroundColor: detailStaff.status === 'online' ? '#e6f7ed' : '#f0f0f0', color: detailStaff.status === 'online' ? 'var(--success-color)' : 'var(--hint-color)', fontWeight: 'bold' }}>{detailStaff.status.toUpperCase()}</span></div></div>
                <h3>Shift History</h3>
                {shifts.filter(s => s.sellerId === detailStaff.id).map(shift => (<div key={shift.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px' }}><div><div style={{ fontWeight: '600', fontSize: '14px' }}>{new Date(shift.start).toLocaleDateString()}</div><div style={{ fontSize: '12px', color: 'var(--hint-color)' }}>{new Date(shift.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {shift.end ? new Date(shift.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Active'}</div></div><div style={{ fontWeight: 'bold', color: 'var(--button-color)' }}>{shift.end ? `${((new Date(shift.end).getTime() - new Date(shift.start).getTime()) / (1000 * 60 * 60)).toFixed(1)}h` : '...'}</div></div>))}
              </motion.div>
            )}
          </AnimatePresence>
        );

      case 'settings':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="settings">
            <h3 style={{ fontSize: '24px' }}>Settings</h3>
            
            <h4 style={{ color: 'var(--hint-color)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '12px', marginLeft: '4px' }}>Appearance</h4>
            <div className="card" style={{ padding: '4px', display: 'flex', gap: '4px', backgroundColor: 'var(--secondary-bg-color)' }}>
              <ThemeButton active={theme === 'light'} onClick={() => setTheme('light')} icon={<Sun size={18} />} label="Light" />
              <ThemeButton active={theme === 'dark'} onClick={() => setTheme('dark')} icon={<Moon size={18} />} label="Dark" />
              <ThemeButton active={theme === 'system'} onClick={() => setTheme('system')} icon={<Monitor size={18} />} label="System" />
            </div>

            <div className="card" style={{ padding: '0', marginTop: '20px' }}>
              <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--bg-color)' }}><span style={{ flex: 1 }}>Notifications</span><ChevronRight size={18} color="var(--hint-color)" /></div>
              <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}><span style={{ flex: 1 }}>Security</span><ChevronRight size={18} color="var(--hint-color)" /></div>
            </div>
            
            <button onClick={logout} className="card" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--danger-color)', marginTop: '20px' }}><LogOut size={20} /><span style={{ fontWeight: '600' }}>Log Out</span></button>
          </motion.div>
        );
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '100px', paddingTop: '10px' }}>
      <div style={{ minHeight: 'calc(100vh - 120px)' }}>{renderContent()}</div>
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'var(--bg-color)', borderTop: '1px solid var(--secondary-bg-color)', display: 'flex', justifyContent: 'space-around', padding: '8px 4px 24px 4px', zIndex: 1000, boxShadow: '0 -2px 10px rgba(0,0,0,0.05)' }}>
        <TabItem active={activeTab === 'stats'} icon={<BarChart3 size={24} />} label="Stats" onClick={() => { setActiveTab('stats'); setDetailStore(null); setDetailStaff(null); setIsNetworkSalesOpen(false); setIsStoreSalesOpen(false); }} />
        <TabItem active={activeTab === 'inventory'} icon={<Package size={24} />} label="Stock" onClick={() => { setActiveTab('inventory'); setDetailStore(null); setDetailStaff(null); setIsNetworkSalesOpen(false); setIsStoreSalesOpen(false); }} />
        <TabItem active={activeTab === 'stores'} icon={<Store size={24} />} label="Stores" onClick={() => { setActiveTab('stores'); setDetailStaff(null); setIsNetworkSalesOpen(false); setIsStoreSalesOpen(false); }} />
        <TabItem active={activeTab === 'users'} icon={<Users size={24} />} label="Staff" onClick={() => { setActiveTab('users'); setDetailStore(null); setDetailStaff(null); setIsNetworkSalesOpen(false); setIsStoreSalesOpen(false); }} />
        <TabItem active={activeTab === 'settings'} icon={<Settings size={24} />} label="Options" onClick={() => { setActiveTab('settings'); setDetailStore(null); setDetailStaff(null); setIsNetworkSalesOpen(false); setIsStoreSalesOpen(false); }} />
      </div>
    </div>
  );
};

// Sub-components
const ThemeButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', backgroundColor: active ? 'var(--bg-color)' : 'transparent', color: active ? 'var(--button-color)' : 'var(--hint-color)', boxShadow: active ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', transition: '0.2s' }}>
    {icon} {label}
  </button>
);

const TimeRangeSelector: React.FC<{ value: TimeRange; onChange: (v: TimeRange) => void }> = ({ value, onChange }) => (
  <div style={{ display: 'flex', backgroundColor: 'var(--secondary-bg-color)', padding: '4px', borderRadius: '12px', marginBottom: '20px' }}>
    {(['day', 'week', 'month', 'all'] as TimeRange[]).map((range) => (
      <button key={range} onClick={() => onChange(range)} style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', fontSize: '13px', fontWeight: value === range ? 'bold' : 'normal', backgroundColor: value === range ? 'var(--bg-color)' : 'transparent', color: value === range ? 'var(--button-color)' : 'var(--hint-color)', boxShadow: value === range ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>
        {range.charAt(0).toUpperCase() + range.slice(1)}
      </button>
    ))}
  </div>
);

const ProductEditor: React.FC<{ isOpen: boolean; onClose: () => void; onSave: () => void; formData: any; setFormData: any; isEdit: boolean }> = ({ isOpen, onClose, onSave, formData, setFormData, isEdit }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000 }}/>
        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'var(--bg-color)', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: '24px', zIndex: 2001, boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}><h3>{isEdit ? 'Edit Product' : 'Add New Product'}</h3><button onClick={onClose} style={{ background: 'var(--secondary-bg-color)', borderRadius: '50%', padding: '4px' }}><X size={20}/></button></div>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div><label style={{ fontSize: '12px', color: 'var(--hint-color)', marginLeft: '4px' }}>Product Name</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Herbal Oil 10ml" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><label style={{ fontSize: '12px', color: 'var(--hint-color)', marginLeft: '4px' }}>Price (€)</label><input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0.00" /></div>
              <div><label style={{ fontSize: '12px', color: 'var(--hint-color)', marginLeft: '4px' }}>Barcode</label><input value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} placeholder="123456" /></div>
            </div>
            <button onClick={onSave} style={{ width: '100%', backgroundColor: 'var(--button-color)', color: 'white', padding: '16px', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}><Check size={20} /> {isEdit ? 'Update Product' : 'Create Product'}</button>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const StaffEditor: React.FC<{ isOpen: boolean; onClose: () => void; onSave: () => void; formData: any; setFormData: any; stores: any[]; isEdit: boolean }> = ({ isOpen, onClose, onSave, formData, setFormData, stores, isEdit }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000 }}/>
        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'var(--bg-color)', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: '24px', zIndex: 2001, boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}><h3>{isEdit ? 'Edit Staff' : 'Add New Staff'}</h3><button onClick={onClose} style={{ background: 'var(--secondary-bg-color)', borderRadius: '50%', padding: '4px' }}><X size={20}/></button></div>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div><label style={{ fontSize: '12px', color: 'var(--hint-color)', marginLeft: '4px' }}>Full Name</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" /></div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--hint-color)', marginLeft: '4px' }}>Assign Store</label>
              <select value={formData.storeId} onChange={e => setFormData({...formData, storeId: e.target.value})}>
                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <button onClick={onSave} style={{ width: '100%', backgroundColor: 'var(--button-color)', color: 'white', padding: '16px', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}><Check size={20} /> {isEdit ? 'Update Staff' : 'Add to Staff'}</button>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const StoreEditor: React.FC<{ isOpen: boolean; onClose: () => void; onSave: () => void; formData: { name: string; address: string }; setFormData: React.Dispatch<React.SetStateAction<{ name: string; address: string }>> }> = ({ isOpen, onClose, onSave, formData, setFormData }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000 }}/>
        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'var(--bg-color)', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: '24px', zIndex: 2001, boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}><h3>Add New Store</h3><button onClick={onClose} style={{ background: 'var(--secondary-bg-color)', borderRadius: '50%', padding: '4px' }}><X size={20}/></button></div>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div><label style={{ fontSize: '12px', color: 'var(--hint-color)', marginLeft: '4px' }}>Store Name</label><input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Riverside Plaza" /></div>
            <div><label style={{ fontSize: '12px', color: 'var(--hint-color)', marginLeft: '4px' }}>Address</label><input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="e.g. Oxford Street 221, London" /></div>
            <button onClick={onSave} style={{ width: '100%', backgroundColor: 'var(--button-color)', color: 'white', padding: '16px', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}><Check size={20} /> Add Store</button>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const TabItem: React.FC<{ active: boolean; icon: React.ReactNode; label: string; onClick: () => void }> = ({ active, icon, label, onClick }) => (
  <button onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', color: active ? 'var(--button-color)' : 'var(--hint-color)', flex: 1, padding: '4px 0' }}>
    <motion.div animate={{ scale: active ? 1.1 : 1 }}>{icon}</motion.div>
    <span style={{ fontSize: '10px', fontWeight: active ? 'bold' : 'normal' }}>{label}</span>
  </button>
);
