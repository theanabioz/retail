import { useState, useMemo } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useInventoryStore, type Store as StoreType, type Product } from '../../store/useInventoryStore';
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
  Save
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

type TimeRange = 'day' | 'week' | 'month' | 'all';

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
    { name: 'Americano Coffee', sales: Math.round(142 * m), revenue: Math.round(497 * m) },
    { name: 'Butter Croissant', sales: Math.round(98 * m), revenue: Math.round(215 * m) },
    { name: 'Tuna Sandwich', sales: Math.round(45 * m), revenue: Math.round(265 * m) },
  ];
};

type AdminTab = 'stats' | 'inventory' | 'stores' | 'users' | 'settings';

export const AdminDashboard: React.FC = () => {
  const { logout } = useAuthStore();
  const { stores, products, updateStock, addProduct, removeProduct, updateProduct } = useInventoryStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [detailStore, setDetailStore] = useState<StoreType | null>(null);
  const [storeDetailTab, setStoreDetailTab] = useState<'performance' | 'stock'>('performance');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [storeTimeRange, setStoreTimeRange] = useState<TimeRange>('week');
  
  // UI State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', barcode: '' });
  const [showSaveSuccess, setShowSaveSaveSuccess] = useState(false);

  // Global calculations
  const salesData = useMemo(() => getSalesData(timeRange), [timeRange]);
  const topProductsData = useMemo(() => getTopProducts(timeRange), [timeRange]);
  const totalRevenue = useMemo(() => salesData.reduce((acc, d) => acc + d.revenue, 0), [salesData]);

  // Per-store calculations
  const storeSalesData = useMemo(() => detailStore ? getSalesData(storeTimeRange, detailStore.id) : [], [detailStore, storeTimeRange]);
  const storeTopProducts = useMemo(() => detailStore ? getTopProducts(storeTimeRange, detailStore.id) : [], [detailStore, storeTimeRange]);
  
  const lowStockCount = useMemo(() => {
    return products.filter(p => Object.values(p.stock).some(s => s < 10)).length;
  }, [products]);

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

  const handleSaveStock = () => {
    setShowSaveSaveSuccess(true);
    setTimeout(() => setShowSaveSaveSuccess(false), 2000);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'stats':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="stats">
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Global Performance</h3>
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
              <div className="card" style={{ padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--hint-color)', fontSize: '11px', marginBottom: '4px' }}>
                  <TrendingUp size={14} /> Total Revenue
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>€{totalRevenue.toLocaleString()}</div>
              </div>
              <div className="card" style={{ padding: '12px', border: lowStockCount > 0 ? '1px solid #ff4d4f33' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: lowStockCount > 0 ? 'var(--danger-color)' : 'var(--hint-color)', fontSize: '11px', marginBottom: '4px' }}>
                  <AlertCircle size={14} /> Low Stock
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: lowStockCount > 0 ? 'var(--danger-color)' : 'inherit' }}>{lowStockCount} Items</div>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
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

            <div style={{ marginTop: '20px' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Inventory</h3>
              <button onClick={() => { setEditingProduct(null); setFormData({ name: '', price: '', barcode: '' }); setIsEditorOpen(true); }} style={{ backgroundColor: 'var(--button-color)', color: 'white', padding: '8px 16px', borderRadius: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}><Plus size={18} /> Add Product</button>
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
              {products.map(product => (
                <div key={product.id} className="card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '17px' }}>{product.name}</div>
                      <div style={{ color: 'var(--button-color)', fontWeight: 'bold', fontSize: '15px' }}>€{product.price.toFixed(2)}</div>
                      <div style={{ fontSize: '11px', color: 'var(--hint-color)', marginTop: '2px' }}>Barcode: {product.barcode}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => { setEditingProduct(product); setFormData({ name: product.name, price: product.price.toString(), barcode: product.barcode }); setIsEditorOpen(true); }} style={{ padding: '8px', backgroundColor: 'var(--bg-color)', borderRadius: '10px', color: 'var(--button-color)' }}><Pencil size={18}/></button>
                      <button onClick={() => { if(confirm('Delete this product?')) removeProduct(product.id) }} style={{ padding: '8px', backgroundColor: 'var(--bg-color)', borderRadius: '10px', color: 'var(--danger-color)' }}><Trash2 size={18}/></button>
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-color)', borderRadius: '12px', padding: '12px', display: 'grid', gap: '10px' }}>
                    {stores.map(store => (
                      <div key={store.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: '500' }}>{store.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <button onClick={() => updateStock(product.id, store.id, -1)} style={{ width: '28px', height: '28px', backgroundColor: 'var(--secondary-bg-color)', borderRadius: '6px', fontWeight: 'bold' }}>-</button>
                          <span style={{ minWidth: '30px', textAlign: 'center' , fontWeight: 'bold', fontSize: '14px' }}>{product.stock[store.id] || 0}</span>
                          <button onClick={() => updateStock(product.id, store.id, 1)} style={{ width: '28px', height: '28px', backgroundColor: 'var(--secondary-bg-color)', borderRadius: '6px', fontWeight: 'bold' }}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <ProductEditor isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} onSave={handleSaveProduct} formData={formData} setFormData={setFormData} isEdit={!!editingProduct} />
          </motion.div>
        );

      case 'stores':
        return (
          <AnimatePresence mode="wait">
            {!detailStore ? (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="store-list">
                <h3>Retail Locations</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {stores.map(store => (
                    <div key={store.id} className="card" onClick={() => { setDetailStore(store); setStoreDetailTab('performance'); }} style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}><div style={{ backgroundColor: 'var(--bg-color)', padding: '10px', borderRadius: '12px' }}><Store size={24} color="var(--button-color)" /></div><div style={{ flex: 1 }}><div style={{ fontWeight: 'bold' }}>{store.name}</div><div style={{ fontSize: '12px', color: 'var(--hint-color)' }}>{store.address}</div></div><ChevronRight size={20} color="var(--hint-color)" /></div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} key="store-detail">
                <button onClick={() => setDetailStore(null)} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--button-color)', background: 'none', marginBottom: '16px', padding: 0 }}><ArrowLeft size={18} /> Back</button>
                
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ marginBottom: '4px' }}>{detailStore.name}</h2>
                  <p style={{ fontSize: '13px', color: 'var(--hint-color)' }}>{detailStore.address}</p>
                </div>

                {/* Sub-tabs Switcher */}
                <div style={{ display: 'flex', backgroundColor: 'var(--secondary-bg-color)', padding: '4px', borderRadius: '14px', marginBottom: '24px' }}>
                  <button onClick={() => setStoreDetailTab('performance')} style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: storeDetailTab === 'performance' ? 'var(--bg-color)' : 'transparent', color: storeDetailTab === 'performance' ? 'var(--button-color)' : 'var(--hint-color)', transition: '0.2s' }}>
                    <BarChart3 size={18}/> Performance
                  </button>
                  <button onClick={() => setStoreDetailTab('stock')} style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: storeDetailTab === 'stock' ? 'var(--bg-color)' : 'transparent', color: storeDetailTab === 'stock' ? 'var(--button-color)' : 'var(--hint-color)', transition: '0.2s' }}>
                    <Package size={18}/> Stock
                  </button>
                </div>

                {storeDetailTab === 'performance' ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
                      <div className="card"><div style={{ color: 'var(--hint-color)', fontSize: '11px' }}>Revenue ({storeTimeRange})</div><div style={{ fontSize: '18px', fontWeight: 'bold' }}>€{storeSalesData.reduce((acc, d) => acc + d.revenue, 0).toLocaleString()}</div></div>
                      <div className="card"><div style={{ color: 'var(--hint-color)', fontSize: '11px' }}>Average Daily</div><div style={{ fontSize: '18px', fontWeight: 'bold' }}>€{(storeSalesData.reduce((acc, d) => acc + d.revenue, 0) / storeSalesData.length).toFixed(0)}</div></div>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                      <h4 style={{ marginBottom: '12px' }}>Top Products at this location</h4>
                      <div className="card" style={{ padding: '0' }}>
                        {storeTopProducts.map((p, idx) => (
                          <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: idx !== storeTopProducts.length - 1 ? '1px solid var(--bg-color)' : 'none' }}>
                            <span style={{ fontSize: '14px' }}>{p.name}</span>
                            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>€{p.revenue.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ display: 'grid', gap: '12px', marginBottom: '80px' }}>
                      {products.map((product) => (
                        <div key={product.id} className="card" style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div>
                              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{product.name}</div>
                              <div style={{ fontSize: '12px', color: 'var(--hint-color)' }}>{product.barcode}</div>
                            </div>
                            <div style={{ color: 'var(--button-color)', fontWeight: 'bold' }}>€{product.price.toFixed(2)}</div>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', backgroundColor: 'var(--bg-color)', padding: '12px', borderRadius: '12px' }}>
                            <button onClick={() => updateStock(product.id, detailStore.id, -1)} style={{ width: '44px', height: '44px', backgroundColor: 'var(--secondary-bg-color)', borderRadius: '12px', fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '24px', fontWeight: '900', minWidth: '50px' }}>{product.stock[detailStore.id] || 0}</div>
                              <div style={{ fontSize: '10px', color: 'var(--hint-color)', textTransform: 'uppercase' }}>units</div>
                            </div>
                            <button onClick={() => updateStock(product.id, detailStore.id, 1)} style={{ width: '44px', height: '44px', backgroundColor: 'var(--secondary-bg-color)', borderRadius: '12px', fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Fixed Save Button for Stock */}
                    <div style={{ position: 'fixed', bottom: '90px', left: '16px', right: '16px', zIndex: 100 }}>
                      <button 
                        onClick={handleSaveStock}
                        style={{ width: '100%', backgroundColor: showSaveSuccess ? 'var(--success-color)' : 'var(--button-color)', color: 'white', padding: '16px', borderRadius: '16px', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', transition: '0.3s' }}
                      >
                        {showSaveSuccess ? <><Check size={20}/> Changes Saved</> : <><Save size={20}/> Save Inventory</>}
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        );

      case 'users':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="users">
            <h3>Staff Management</h3>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}><div style={{ backgroundColor: 'var(--bg-color)', padding: '10px', borderRadius: '12px' }}><Users size={24} color="var(--button-color)" /></div><div><div style={{ fontWeight: 'bold' }}>John Doe</div><div style={{ fontSize: '12px', color: 'var(--hint-color)' }}>Central Mall Store</div></div></div>
          </motion.div>
        );

      case 'settings':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="settings">
            <h3>Settings</h3>
            <div className="card" style={{ padding: '0' }}><div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--bg-color)' }}><span style={{ flex: 1 }}>Notifications</span><ChevronRight size={18} color="var(--hint-color)" /></div><div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}><span style={{ flex: 1 }}>Appearance</span><ChevronRight size={18} color="var(--hint-color)" /></div></div>
            <button onClick={logout} className="card" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--danger-color)', marginTop: '12px' }}><LogOut size={20} /><span style={{ fontWeight: '600' }}>Log Out</span></button>
          </motion.div>
        );
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '100px', paddingTop: '10px' }}>
      <div style={{ marginBottom: '20px' }}><h1 style={{ fontSize: '24px' }}>Admin Panel</h1></div>
      <div style={{ minHeight: 'calc(100vh - 160px)' }}>{renderContent()}</div>
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'var(--bg-color)', borderTop: '1px solid var(--secondary-bg-color)', display: 'flex', justifyContent: 'space-around', padding: '8px 4px 24px 4px', zIndex: 1000, boxShadow: '0 -2px 10px rgba(0,0,0,0.05)' }}>
        <TabItem active={activeTab === 'stats'} icon={<BarChart3 size={24} />} label="Stats" onClick={() => { setActiveTab('stats'); setDetailStore(null); }} />
        <TabItem active={activeTab === 'inventory'} icon={<Package size={24} />} label="Stock" onClick={() => { setActiveTab('inventory'); setDetailStore(null); }} />
        <TabItem active={activeTab === 'stores'} icon={<Store size={24} />} label="Stores" onClick={() => setActiveTab('stores')} />
        <TabItem active={activeTab === 'users'} icon={<Users size={24} />} label="Staff" onClick={() => { setActiveTab('users'); setDetailStore(null); }} />
        <TabItem active={activeTab === 'settings'} icon={<Settings size={24} />} label="Options" onClick={() => { setActiveTab('settings'); setDetailStore(null); }} />
      </div>
    </div>
  );
};

// Reusable Components
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
            <div><label style={{ fontSize: '12px', color: 'var(--hint-color)', marginLeft: '4px' }}>Product Name</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Americano Coffee" style={{ marginBottom: 0 }} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><label style={{ fontSize: '12px', color: 'var(--hint-color)', marginLeft: '4px' }}>Price (€)</label><input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0.00" style={{ marginBottom: 0 }} /></div>
              <div><label style={{ fontSize: '12px', color: 'var(--hint-color)', marginLeft: '4px' }}>Barcode</label><input value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} placeholder="123456" style={{ marginBottom: 0 }} /></div>
            </div>
            <button onClick={onSave} style={{ width: '100%', backgroundColor: 'var(--button-color)', color: 'white', padding: '16px', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}><Check size={20} /> {isEdit ? 'Update Product' : 'Create Product'}</button>
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
