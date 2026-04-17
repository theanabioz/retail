import { useState, useMemo, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useSaleStore } from '../../store/useSaleStore';
import { useTelegram } from '../../hooks/useTelegram';
import { useSettingsStore } from '../../store/useSettingsStore';
import { 
  LogOut, 
  ScanBarcode, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Play, 
  Square,
  History,
  Package,
  User,
  CreditCard,
  Banknote,
  Search,
  ChevronRight,
  Clock,
  ArrowLeft,
  Receipt,
  Save,
  Check,
  Settings,
  Sun,
  Moon,
  Monitor,
  ChevronUp,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SellerTab = 'checkout' | 'history' | 'stock' | 'shift' | 'settings';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  time: string;
  total: number;
  paymentMethod: 'card' | 'cash';
  items: OrderItem[];
}

const mockOrders: Order[] = [
  { 
    id: '1201', time: '12:45', total: 54.80, paymentMethod: 'card', 
    items: [
      { name: 'Herbal Oil 10ml', quantity: 1, price: 24.90 },
      { name: 'Pre-Rolled Herbal Stick', quantity: 2, price: 6.50 },
      { name: 'Botanical Balm 30g', quantity: 1, price: 16.90 }
    ]
  },
  { 
    id: '1202', time: '13:20', total: 56.70, paymentMethod: 'cash', 
    items: [
      { name: 'Herbal Blend 1g', quantity: 2, price: 8.90 },
      { name: 'Relax Gummies 20pcs', quantity: 1, price: 21.00 },
      { name: 'Terpene Drops', quantity: 1, price: 17.90 }
    ]
  }
];

export const SellerDashboard: React.FC = () => {
  const { logout, currentStoreId } = useAuthStore();
  const { products, stores, updateStock } = useInventoryStore();
  const { cart, addToCart, updateQuantity, clearCart, isShiftActive, toggleShift } = useSaleStore();
  const { tg } = useTelegram();
  const { theme, setTheme } = useSettingsStore();
  
  const [activeTab, setActiveTab] = useState<SellerTab>('checkout');
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSavingStock, setIsSavingStock] = useState(false);
  const [isCartExpanded, setIsCartExpanded] = useState(false);

  const currentStore = stores.find(s => s.id === currentStoreId);
  
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search)
  );

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    if (cartItemsCount === 0) {
      setIsCartExpanded(false);
    }
  }, [cartItemsCount]);

  const handleAddToCart = (product: any) => {
    addToCart(product);
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('light');
    }
  };

  const handleCheckout = () => {
    if (!paymentMethod) {
      alert('Please select payment method');
      return;
    }
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred('success');
    }
    alert(`Success! Sale of €${cartTotal.toFixed(2)} recorded via ${paymentMethod.toUpperCase()}`);
    clearCart();
    setPaymentMethod(null);
    setIsCartExpanded(false);
  };

  const handleSaveInventory = () => {
    setIsSavingStock(true);
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred('success');
    }
    setTimeout(() => setIsSavingStock(false), 2000);
  };

  const renderContent = () => {
    if (!isShiftActive && activeTab !== 'shift' && activeTab !== 'settings') {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--hint-color)' }}>
          <Clock size={64} style={{ marginBottom: '20px', opacity: 0.5 }} />
          <h2>Shift is Closed</h2>
          <p>You need to start your shift to access checkout and inventory.</p>
          <button onClick={() => setActiveTab('shift')} style={{ marginTop: '24px', backgroundColor: 'var(--button-color)', color: 'white', padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold' }}>Go to Shift Management</button>
        </div>
      );
    }

    switch (activeTab) {
      case 'checkout':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--hint-color)' }} />
                <input type="text" placeholder="Search product..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '40px', marginBottom: 0 }} />
              </div>
              <button className="card" style={{ padding: '0 12px', marginBottom: 0, display: 'flex', alignItems: 'center' }}><ScanBarcode size={24} /></button>
            </div>
            <div style={{ display: 'grid', gap: '10px', paddingBottom: cartItemsCount > 0 ? '80px' : '0' }}>
              {filteredProducts.map(product => (
                <div key={product.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '15px', color: theme === 'dark' ? '#FFFFFF' : '#000000' }}>{product.name}</div>
                    <div style={{ color: 'var(--hint-color)', fontSize: '12px' }}>€{product.price.toFixed(2)} • Stock: {product.stock[currentStoreId!] || 0}</div>
                  </div>
                  <button onClick={() => handleAddToCart(product)} style={{ backgroundColor: 'var(--button-color)', color: 'white', borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={20} /></button>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 'history':
        return (
          <AnimatePresence mode="wait">
            {!selectedOrder ? (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="history-list">
                <h3>Today's Sales</h3>
                <div style={{ display: 'grid', gap: '10px', marginTop: '16px' }}>
                  {mockOrders.map(order => (
                    <div key={order.id} className="card" onClick={() => setSelectedOrder(order)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>Sale #{order.id}</div>
                        <div style={{ fontSize: '12px', color: 'var(--hint-color)' }}>{order.time} • {order.items.length} items • {order.paymentMethod === 'card' ? 'Card' : 'Cash'}</div>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ fontWeight: 'bold' }}>€{order.total.toFixed(2)}</div>
                        <ChevronRight size={18} color="var(--hint-color)" />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} key="order-detail">
                <button onClick={() => setSelectedOrder(null)} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--button-color)', background: 'none', marginBottom: '20px', padding: 0 }}><ArrowLeft size={18} /> Back to History</button>
                <div className="card" style={{ padding: '24px', backgroundColor: 'var(--bg-color)', border: '1px dashed var(--secondary-bg-color)' }}>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <Receipt size={40} color="var(--button-color)" style={{ marginBottom: '12px' }} />
                    <h2 style={{ marginBottom: '4px' }}>Sale #{selectedOrder.id}</h2>
                    <p style={{ fontSize: '13px', color: 'var(--hint-color)' }}>{selectedOrder.time} • {selectedOrder.paymentMethod.toUpperCase()}</p>
                  </div>
                  <div style={{ borderTop: '1px solid var(--secondary-bg-color)', borderBottom: '1px solid var(--secondary-bg-color)', padding: '16px 0', marginBottom: '16px' }}>
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                        <span>{item.quantity}x {item.name}</span>
                        <span style={{ fontWeight: '600' }}>€{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '18px' }}>Total Amount</span>
                    <span style={{ fontWeight: '900', fontSize: '22px', color: 'var(--button-color)' }}>€{selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
                <button style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', backgroundColor: 'transparent', fontWeight: 'bold', marginTop: '20px' }}>Refund Transaction</button>
              </motion.div>
            )}
          </AnimatePresence>
        );

      case 'stock':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Store Stock</h3>
              <div style={{ fontSize: '12px', color: 'var(--hint-color)' }}>{currentStore?.name}</div>
            </div>
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              {products.map((p, idx) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: idx !== products.length - 1 ? '1px solid var(--bg-color)' : 'none' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '15px' }}>{p.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--hint-color)' }}>€{p.price.toFixed(2)} • {p.barcode}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => { updateStock(p.id, currentStoreId!, -1); tg?.HapticFeedback?.impactOccurred('light'); }} style={{ width: '32px', height: '32px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', color: 'var(--button-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={18} strokeWidth={3} /></button>
                    <span style={{ minWidth: '32px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px', color: (p.stock[currentStoreId!] || 0) < 10 ? 'var(--danger-color)' : 'inherit' }}>{p.stock[currentStoreId!] || 0}</span>
                    <button onClick={() => { updateStock(p.id, currentStoreId!, 1); tg?.HapticFeedback?.impactOccurred('light'); }} style={{ width: '32px', height: '32px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', color: 'var(--button-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={18} strokeWidth={3} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ height: '80px' }} />
            <div style={{ position: 'fixed', bottom: '90px', left: '16px', right: '16px', zIndex: 100 }}><button onClick={handleSaveInventory} style={{ width: '100%', backgroundColor: isSavingStock ? 'var(--success-color)' : 'var(--button-color)', color: 'white', padding: '16px', borderRadius: '16px', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', transition: '0.3s' }}>{isSavingStock ? <><Check size={20}/> Stock Updated</> : <><Save size={20}/> Save Changes</>}</button></div>
          </motion.div>
        );

      case 'shift':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3>Shift Management</h3>
            <div className="card" style={{ padding: '24px', textAlign: 'center', marginTop: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--hint-color)', textTransform: 'uppercase', marginBottom: '8px' }}>Work Time Today</div>
              <div style={{ fontSize: '42px', fontWeight: '900', color: isShiftActive ? 'var(--success-color)' : 'inherit' }}>08:42:15</div>
              <button onClick={toggleShift} style={{ width: '100%', padding: '16px', borderRadius: '16px', backgroundColor: isShiftActive ? 'var(--danger-color)' : 'var(--success-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontWeight: 'bold', fontSize: '18px', marginTop: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>{isShiftActive ? <><Square size={24} fill="white"/> End My Shift</> : <><Play size={24} fill="white"/> Start My Shift</>}</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              <div className="card"><div style={{ color: 'var(--hint-color)', fontSize: '11px' }}>Weekly Hours</div><div style={{ fontSize: '20px', fontWeight: 'bold' }}>38.5h</div></div>
              <div className="card"><div style={{ color: 'var(--hint-color)', fontSize: '11px' }}>Today's Sales</div><div style={{ fontSize: '20px', fontWeight: 'bold' }}>€1,240</div></div>
            </div>
          </motion.div>
        );

      case 'settings':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3>Settings</h3>
            <h4 style={{ color: 'var(--hint-color)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '12px', marginLeft: '4px' }}>Appearance</h4>
            <div className="card" style={{ padding: '4px', display: 'flex', gap: '4px', backgroundColor: 'var(--secondary-bg-color)' }}>
              <ThemeButton active={theme === 'light'} onClick={() => setTheme('light')} icon={<Sun size={18} />} label="Light" />
              <ThemeButton active={theme === 'dark'} onClick={() => setTheme('dark')} icon={<Moon size={18} />} label="Dark" />
              <ThemeButton active={theme === 'system'} onClick={() => setTheme('system')} icon={<Monitor size={18} />} label="System" />
            </div>
            <div className="card" style={{ padding: '0', marginTop: '20px' }}>
              <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--secondary-bg-color)' }}><span style={{ flex: 1 }}>Notifications</span><ChevronRight size={18} color="var(--hint-color)" /></div>
            </div>
            <button onClick={logout} className="card" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--danger-color)', marginTop: '20px' }}><LogOut size={20} /><span style={{ fontWeight: 'bold' }}>Switch Account / Role</span></button>
          </motion.div>
        );
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '100px', paddingTop: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div><h2 style={{ fontSize: '20px', marginBottom: 0 }}>{currentStore?.name}</h2><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isShiftActive ? 'var(--success-color)' : 'var(--danger-color)' }} /><span style={{ fontSize: '12px', color: 'var(--hint-color)' }}>{isShiftActive ? 'Shift Active' : 'Shift Closed'}</span></div></div>
        <div style={{ backgroundColor: 'var(--secondary-bg-color)', padding: '6px 10px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><User size={16} /><span style={{ fontSize: '13px', fontWeight: 'bold' }}>John</span></div>
      </div>
      
      <div style={{ minHeight: 'calc(100vh - 180px)' }}>{renderContent()}</div>

      <AnimatePresence>
        {activeTab === 'checkout' && cartItemsCount > 0 && (
          <>
            {!isCartExpanded && (
              <motion.div 
                initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
                onClick={() => setIsCartExpanded(true)}
                style={{ position: 'fixed', bottom: '80px', left: '16px', right: '16px', backgroundColor: 'var(--button-color)', borderRadius: '16px', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', boxShadow: '0 8px 24px rgba(51, 144, 236, 0.3)', zIndex: 90, cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ position: 'relative' }}>
                    <ShoppingCart size={24} />
                    <div style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: 'var(--danger-color)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '2px solid var(--button-color)' }}>{cartItemsCount}</div>
                  </div>
                  <span style={{ fontWeight: 'bold' }}>Review Sale</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '900', fontSize: '18px' }}>€{cartTotal.toFixed(2)}</span>
                  <ChevronUp size={20} />
                </div>
              </motion.div>
            )}

            {isCartExpanded && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartExpanded(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000 }}/>
                <motion.div 
                  initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '85vh', backgroundColor: 'var(--bg-color)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', zIndex: 2001, boxShadow: '0 -10px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ margin: 0 }}>Review Items</h3>
                    <button onClick={() => setIsCartExpanded(false)} style={{ background: 'var(--secondary-bg-color)', borderRadius: '50%', padding: '6px' }}><X size={20}/></button>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
                    {cart.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '12px', backgroundColor: 'var(--secondary-bg-color)', borderRadius: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{item.name}</div>
                          <div style={{ fontSize: '13px', color: 'var(--button-color)', fontWeight: 'bold' }}>€{(item.price * item.quantity).toFixed(2)}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ width: '32px', height: '32px', backgroundColor: 'var(--bg-color)', borderRadius: '8px' }}><Minus size={18}/></button>
                          <span style={{ fontWeight: '900', minWidth: '24px', textAlign: 'center', fontSize: '16px' }}>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ width: '32px', height: '32px', backgroundColor: 'var(--bg-color)', borderRadius: '8px' }}><Plus size={18}/></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 'auto' }}>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                      <button onClick={() => setPaymentMethod('card')} style={{ flex: 1, padding: '16px', borderRadius: '14px', border: `2px solid ${paymentMethod === 'card' ? 'var(--button-color)' : 'var(--secondary-bg-color)'}`, backgroundColor: paymentMethod === 'card' ? 'rgba(51, 144, 236, 0.1)' : 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <CreditCard size={24} color={paymentMethod === 'card' ? 'var(--button-color)' : 'var(--hint-color)'} />
                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Card</span>
                      </button>
                      <button onClick={() => setPaymentMethod('cash')} style={{ flex: 1, padding: '16px', borderRadius: '14px', border: `2px solid ${paymentMethod === 'cash' ? 'var(--button-color)' : 'var(--hint-color)'}`, backgroundColor: paymentMethod === 'cash' ? 'rgba(51, 144, 236, 0.1)' : 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <Banknote size={24} color={paymentMethod === 'cash' ? 'var(--button-color)' : 'var(--hint-color)'} />
                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Cash</span>
                      </button>
                    </div>

                    <button 
                      onClick={handleCheckout}
                      style={{ width: '100%', backgroundColor: 'var(--button-color)', color: 'white', padding: '18px', borderRadius: '18px', fontWeight: '900', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 8px 24px rgba(51, 144, 236, 0.25)' }}
                    >
                      <Check size={24} /> Confirm Sale • €{cartTotal.toFixed(2)}
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </>
        )}
      </AnimatePresence>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'var(--bg-color)', borderTop: '1px solid var(--secondary-bg-color)', display: 'flex', justifyContent: 'space-around', padding: '8px 4px 24px 4px', zIndex: 1000, boxShadow: '0 -4px 12px rgba(0,0,0,0.05)' }}>
        <TabItem active={activeTab === 'checkout'} icon={<ShoppingCart size={24} />} label="Checkout" onClick={() => { setActiveTab('checkout'); setSelectedOrder(null); }} />
        <TabItem active={activeTab === 'history'} icon={<History size={24} />} label="Orders" onClick={() => setActiveTab('history')} />
        <TabItem active={activeTab === 'stock'} icon={<Package size={24} />} label="My Stock" onClick={() => { setActiveTab('stock'); setSelectedOrder(null); }} />
        <TabItem active={activeTab === 'shift'} icon={<Clock size={24} />} label="Shift" onClick={() => { setActiveTab('shift'); setSelectedOrder(null); }} />
        <TabItem active={activeTab === 'settings'} icon={<Settings size={24} />} label="Options" onClick={() => { setActiveTab('settings'); setSelectedOrder(null); }} />
      </div>
    </div>
  );
};

const ThemeButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', backgroundColor: active ? 'var(--bg-color)' : 'transparent', color: active ? 'var(--button-color)' : 'var(--hint-color)', boxShadow: active ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', transition: '0.2s' }}>
    {icon} {label}
  </button>
);

const TabItem: React.FC<{ active: boolean; icon: React.ReactNode; label: string; onClick: () => void }> = ({ active, icon, label, onClick }) => (
  <button onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', color: active ? 'var(--button-color)' : 'var(--hint-color)', flex: 1, padding: '4px 0' }}>
    <motion.div animate={{ scale: active ? 1.1 : 1 }}>{icon}</motion.div>
    <span style={{ fontSize: '10px', fontWeight: active ? 'bold' : 'normal' }}>{label}</span>
  </button>
);
