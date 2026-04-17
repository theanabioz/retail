import { useState, useMemo } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useInventoryStore, type Store as StoreType } from '../../store/useInventoryStore';
import { 
  LogOut, 
  BarChart3, 
  Package, 
  Store, 
  Users, 
  Settings, 
  Download, 
  ChevronRight,
  ArrowLeft,
  TrendingUp,
  Award,
  AlertCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

type TimeRange = 'day' | 'week' | 'month' | 'all';

// Mock data factory based on time range
const getSalesData = (range: TimeRange) => {
  switch (range) {
    case 'day':
      return Array.from({ length: 24 }, (_, i) => ({
        name: `${i.toString().padStart(2, '0')}:00`,
        revenue: i >= 8 && i <= 22 
          ? Math.round(100 + Math.random() * 500) // Business hours
          : Math.round(Math.random() * 50)        // Night hours
      }));
    case 'month':

      return [
        { name: 'Week 1', revenue: 8400 }, { name: 'Week 2', revenue: 9200 },
        { name: 'Week 3', revenue: 7800 }, { name: 'Week 4', revenue: 10500 },
      ];
    case 'all':
      return [
        { name: '2023', revenue: 85000 }, { name: '2024', revenue: 124000 },
        { name: '2025', revenue: 45000 },
      ];
    default:
      return [
        { name: 'Mon', revenue: 1400 }, { name: 'Tue', revenue: 1300 },
        { name: 'Wed', revenue: 980 }, { name: 'Thu', revenue: 1200 },
        { name: 'Fri', revenue: 1800 }, { name: 'Sat', revenue: 2390 },
        { name: 'Sun', revenue: 2100 },
      ];
  }
};

const getTopProducts = (range: TimeRange) => {
  const multipliers: Record<TimeRange, number> = { day: 0.15, week: 1, month: 4.2, all: 52 };
  const m = multipliers[range];
  return [
    { name: 'Americano Coffee', sales: Math.round(142 * m), revenue: Math.round(497 * m) },
    { name: 'Butter Croissant', sales: Math.round(98 * m), revenue: Math.round(215 * m) },
    { name: 'Tuna Sandwich', sales: Math.round(45 * m), revenue: Math.round(265 * m) },
  ];
};

type AdminTab = 'stats' | 'inventory' | 'stores' | 'users' | 'settings';

export const AdminDashboard: React.FC = () => {
  const { logout } = useAuthStore();
  const { stores, products, updateStock } = useInventoryStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [detailStore, setDetailStore] = useState<StoreType | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  const salesData = useMemo(() => getSalesData(timeRange), [timeRange]);
  const topProductsData = useMemo(() => getTopProducts(timeRange), [timeRange]);
  const totalRevenue = useMemo(() => salesData.reduce((acc, d) => acc + d.revenue, 0), [salesData]);
  
  const lowStockCount = useMemo(() => {
    return products.filter(p => Object.values(p.stock).some(s => s < 10)).length;
  }, [products]);

  const timeLabels: Record<TimeRange, string> = {
    day: 'vs yesterday',
    week: 'vs last week',
    month: 'vs last month',
    all: 'vs last year'
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'stats':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="stats">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px' }}>Global Performance</h3>
              <button style={{ color: 'var(--link-color)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Download size={16}/> Export
              </button>
            </div>

            {/* Time Range Selector */}
            <div style={{ 
              display: 'flex', 
              backgroundColor: 'var(--secondary-bg-color)', 
              padding: '4px', 
              borderRadius: '12px', 
              marginBottom: '20px' 
            }}>
              {(['day', 'week', 'month', 'all'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: timeRange === range ? 'bold' : 'normal',
                    backgroundColor: timeRange === range ? 'var(--bg-color)' : 'transparent',
                    color: timeRange === range ? 'var(--button-color)' : 'var(--hint-color)',
                    boxShadow: timeRange === range ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
            
            {/* Main Chart */}
            <div className="card" style={{ height: '220px', padding: '16px 8px 16px 0' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--hint-color)" opacity={0.2} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    interval={timeRange === 'day' ? 3 : 0} 
                    tick={{ fontSize: 10, fill: 'var(--hint-color)' }} 
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontSize: '12px', color: 'var(--button-color)' }}
                    formatter={(value) => [`€${value}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="var(--button-color)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Stats Grid */}
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

            {/* Top Products Section */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Award size={18} color="var(--button-color)" />
                <h4 style={{ margin: 0 }}>Top Selling Products</h4>
              </div>
              <div className="card" style={{ padding: '0' }}>
                {topProductsData.map((p, idx) => (
                  <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: idx !== topProductsData.length - 1 ? '1px solid var(--bg-color)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--hint-color)', width: '20px' }}>{idx + 1}</span>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>{p.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--hint-color)' }}>{p.sales.toLocaleString()} sold</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>€{p.revenue.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Store Rankings */}
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ marginBottom: '12px' }}>Store Performance</h4>
              <div style={{ display: 'grid', gap: '8px' }}>
                {stores.map((s, idx) => (
                  <div key={s.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', marginBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Store size={16} color="var(--button-color)" />
                      <span style={{ fontSize: '14px' }}>{s.name}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>€{(totalRevenue * (idx === 0 ? 0.6 : 0.4)).toFixed(0)}</div>
                      <div style={{ fontSize: '10px', color: 'var(--success-color)' }}>+12% {timeLabels[timeRange]}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 'inventory':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="inventory">
            <h3>Network Inventory</h3>
            {products.map(product => (
              <div key={product.id} className="card">
                <div style={{ fontWeight: 'bold', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  {product.name}
                  <span style={{ color: 'var(--button-color)' }}>€{product.price.toFixed(2)}</span>
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {stores.map(store => (
                    <div key={store.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', opacity: 0.8 }}>
                      <span>{store.name}</span>
                      <span>{product.stock[store.id] || 0} units</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid var(--bg-color)', paddingTop: '8px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <span>Total Stock</span>
                    <span>{Object.values(product.stock).reduce((a, b) => a + b, 0)} units</span>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        );

      case 'stores':
        return (
          <AnimatePresence mode="wait">
            {!detailStore ? (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="store-list">
                <h3>Retail Locations</h3>
                {stores.map(store => (
                  <div 
                    key={store.id} 
                    className="card" 
                    onClick={() => setDetailStore(store)}
                    style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
                  >
                    <div style={{ backgroundColor: 'var(--bg-color)', padding: '10px', borderRadius: '12px' }}>
                      <Store size={24} color="var(--button-color)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold' }}>{store.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--hint-color)' }}>{store.address}</div>
                    </div>
                    <ChevronRight size={20} color="var(--hint-color)" />
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} key="store-detail">
                <button 
                  onClick={() => setDetailStore(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--button-color)', background: 'none', marginBottom: '16px', padding: 0 }}
                >
                  <ArrowLeft size={18} /> Back
                </button>
                
                <div style={{ marginBottom: '20px' }}>
                  <h2>{detailStore.name}</h2>
                  <p style={{ color: 'var(--hint-color)' }}>{detailStore.address}</p>
                </div>

                <div className="card">
                  <h3 style={{ marginBottom: '12px' }}>Store Inventory</h3>
                  {products.map(product => (
                    <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--bg-color)' }}>
                      <span>{product.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button 
                          onClick={() => updateStock(product.id, detailStore.id, -1)}
                          style={{ width: '28px', height: '28px', background: 'var(--bg-color)', borderRadius: '6px' }}
                        >-</button>
                        <span style={{ minWidth: '30px', textAlign: 'center' }}>{product.stock[detailStore.id] || 0}</span>
                        <button 
                          onClick={() => updateStock(product.id, detailStore.id, 1)}
                          style={{ width: '28px', height: '28px', background: 'var(--bg-color)', borderRadius: '6px' }}
                        >+</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="card">
                  <h3>Activity</h3>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '8px' }}>12 Orders Today</div>
                  <div style={{ fontSize: '16px', color: 'var(--success-color)' }}>€450.20 Revenue</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        );

      case 'users':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="users">
            <h3>Staff Management</h3>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: 'var(--bg-color)', padding: '10px', borderRadius: '12px' }}>
                <Users size={24} color="var(--button-color)" />
              </div>
              <div>
                <div style={{ fontWeight: 'bold' }}>John Doe</div>
                <div style={{ fontSize: '12px', color: 'var(--hint-color)' }}>Central Mall Store</div>
              </div>
            </div>
          </motion.div>
        );

      case 'settings':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="settings">
            <h3>Settings</h3>
            <div className="card" style={{ padding: '0' }}>
              <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--bg-color)' }}>
                <span style={{ flex: 1 }}>Notifications</span>
                <ChevronRight size={18} color="var(--hint-color)" />
              </div>
              <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ flex: 1 }}>Appearance</span>
                <ChevronRight size={18} color="var(--hint-color)" />
              </div>
            </div>
            <button 
              onClick={logout}
              className="card" 
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--danger-color)', marginTop: '12px' }}
            >
              <LogOut size={20} />
              <span style={{ fontWeight: '600' }}>Log Out</span>
            </button>
          </motion.div>
        );
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '100px', paddingTop: '10px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px' }}>Admin Panel</h1>
      </div>

      <div style={{ minHeight: 'calc(100vh - 160px)' }}>
        {renderContent()}
      </div>

      <div style={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        backgroundColor: 'var(--bg-color)', 
        borderTop: '1px solid var(--secondary-bg-color)',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '8px 4px 24px 4px', 
        zIndex: 1000,
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
      }}>
        <TabItem active={activeTab === 'stats'} icon={<BarChart3 size={24} />} label="Stats" onClick={() => { setActiveTab('stats'); setDetailStore(null); }} />
        <TabItem active={activeTab === 'inventory'} icon={<Package size={24} />} label="Stock" onClick={() => { setActiveTab('inventory'); setDetailStore(null); }} />
        <TabItem active={activeTab === 'stores'} icon={<Store size={24} />} label="Stores" onClick={() => setActiveTab('stores')} />
        <TabItem active={activeTab === 'users'} icon={<Users size={24} />} label="Staff" onClick={() => { setActiveTab('users'); setDetailStore(null); }} />
        <TabItem active={activeTab === 'settings'} icon={<Settings size={24} />} label="Options" onClick={() => { setActiveTab('settings'); setDetailStore(null); }} />
      </div>
    </div>
  );
};

const TabItem: React.FC<{ active: boolean; icon: React.ReactNode; label: string; onClick: () => void }> = ({ active, icon, label, onClick }) => (
  <button 
    onClick={onClick}
    style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
      background: 'none', color: active ? 'var(--button-color)' : 'var(--hint-color)',
      flex: 1, padding: '4px 0'
    }}
  >
    <motion.div animate={{ scale: active ? 1.1 : 1 }}>{icon}</motion.div>
    <span style={{ fontSize: '10px', fontWeight: active ? 'bold' : 'normal' }}>{label}</span>
  </button>
);
