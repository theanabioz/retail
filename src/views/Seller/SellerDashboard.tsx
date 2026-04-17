import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useSaleStore } from '../../store/useSaleStore';
import { useTelegram } from '../../hooks/useTelegram';
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
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SellerTab = 'checkout' | 'history' | 'stock' | 'shift';

export const SellerDashboard: React.FC = () => {
  const { logout, currentStoreId } = useAuthStore();
  const { products, stores } = useInventoryStore();
  const { cart, addToCart, updateQuantity, clearCart, isShiftActive, toggleShift } = useSaleStore();
  const { tg } = useTelegram();
  
  const [activeTab, setActiveTab] = useState<SellerTab>('checkout');
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | null>(null);

  const currentStore = stores.find(s => s.id === currentStoreId);
  
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search)
  );

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

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
    alert(`Success! Total €${cartTotal.toFixed(2)} paid via ${paymentMethod.toUpperCase()}`);
    clearCart();
    setPaymentMethod(null);
  };

  const renderContent = () => {
    if (!isShiftActive && activeTab !== 'shift') {
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
            {/* Search & Scan */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--hint-color)' }} />
                <input type="text" placeholder="Search product..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '40px', marginBottom: 0 }} />
              </div>
              <button className="card" style={{ padding: '0 12px', marginBottom: 0, display: 'flex', alignItems: 'center' }}><ScanBarcode size={24} /></button>
            </div>

            {/* Product List */}
            <div style={{ display: 'grid', gap: '10px' }}>
              {filteredProducts.map(product => (
                <div key={product.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '15px', color: '#000000' }}>{product.name}</div>
                    <div style={{ color: 'var(--hint-color)', fontSize: '12px' }}>€{product.price.toFixed(2)} • Stock: {product.stock[currentStoreId!] || 0}</div>
                  </div>
                  <button 
                    onClick={() => handleAddToCart(product)}
                    style={{ backgroundColor: 'var(--button-color)', color: 'white', borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Plus size={20} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 'history':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3>Recent Orders</h3>
            <div style={{ display: 'grid', gap: '10px', marginTop: '16px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><div style={{ fontWeight: 'bold' }}>Order #120{i}</div><div style={{ fontSize: '12px', color: 'var(--hint-color)' }}>12:45 • 3 items • Card</div></div>
                  <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 'bold' }}>€{(24.5 + i).toFixed(2)}</div><ChevronRight size={18} color="var(--hint-color)" /></div>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 'stock':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3>Store Inventory</h3>
            <div style={{ display: 'grid', gap: '10px', marginTop: '16px' }}>
              {products.map(p => (
                <div key={p.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><div style={{ fontWeight: 'bold' }}>{p.name}</div><div style={{ fontSize: '12px', color: 'var(--hint-color)' }}>{p.barcode}</div></div>
                  <div style={{ fontWeight: 'bold', color: (p.stock[currentStoreId!] || 0) < 10 ? 'var(--danger-color)' : 'inherit' }}>{p.stock[currentStoreId!] || 0} units</div>
                </div>
              ))}
            </div>
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
            <button onClick={logout} className="card" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--danger-color)', marginTop: '24px' }}><LogOut size={20} /><span style={{ fontWeight: 'bold' }}>Switch Account / Role</span></button>
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
        {activeTab === 'checkout' && cart.length > 0 && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} style={{ position: 'fixed', bottom: '80px', left: 0, right: 0, backgroundColor: 'var(--bg-color)', boxShadow: '0 -10px 30px rgba(0,0,0,0.1)', padding: '20px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 100 }}>
            <div style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: '20px' }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 'bold', fontSize: '14px' }}>{item.name}</div><div style={{ fontSize: '12px', color: 'var(--button-color)' }}>€{(item.price * item.quantity).toFixed(2)}</div></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ padding: '4px', backgroundColor: 'var(--secondary-bg-color)', borderRadius: '6px' }}><Minus size={16}/></button><span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span><button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ padding: '4px', backgroundColor: 'var(--secondary-bg-color)', borderRadius: '6px' }}><Plus size={16}/></button></div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <button onClick={() => setPaymentMethod('card')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: `2px solid ${paymentMethod === 'card' ? 'var(--button-color)' : 'var(--secondary-bg-color)'}`, backgroundColor: paymentMethod === 'card' ? 'rgba(51, 144, 236, 0.1)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><CreditCard size={18} color={paymentMethod === 'card' ? 'var(--button-color)' : 'var(--hint-color)'} /><span style={{ fontSize: '13px', fontWeight: 'bold' }}>Card</span></button>
              <button onClick={() => setPaymentMethod('cash')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: `2px solid ${paymentMethod === 'cash' ? 'var(--button-color)' : 'var(--secondary-bg-color)'}`, backgroundColor: paymentMethod === 'cash' ? 'rgba(51, 144, 236, 0.1)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Banknote size={18} color={paymentMethod === 'cash' ? 'var(--button-color)' : 'var(--hint-color)'} /><span style={{ fontSize: '13px', fontWeight: 'bold' }}>Cash</span></button>
            </div>
            <button onClick={handleCheckout} style={{ width: '100%', backgroundColor: 'var(--button-color)', color: 'white', padding: '16px', borderRadius: '16px', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><ShoppingCart size={20}/> Pay €{cartTotal.toFixed(2)}</button>
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'var(--bg-color)', borderTop: '1px solid var(--secondary-bg-color)', display: 'flex', justifyContent: 'space-around', padding: '8px 4px 24px 4px', zIndex: 1000, boxShadow: '0 -4px 12px rgba(0,0,0,0.05)' }}>
        <TabItem active={activeTab === 'checkout'} icon={<ShoppingCart size={24} />} label="Checkout" onClick={() => setActiveTab('checkout')} />
        <TabItem active={activeTab === 'history'} icon={<History size={24} />} label="Orders" onClick={() => setActiveTab('history')} />
        <TabItem active={activeTab === 'stock'} icon={<Package size={24} />} label="My Stock" onClick={() => setActiveTab('stock')} />
        <TabItem active={activeTab === 'shift'} icon={<Clock size={24} />} label="Shift" onClick={() => setActiveTab('shift')} />
      </div>
    </div>
  );
};

const TabItem: React.FC<{ active: boolean; icon: React.ReactNode; label: string; onClick: () => void }> = ({ active, icon, label, onClick }) => (
  <button onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', color: active ? 'var(--button-color)' : 'var(--hint-color)', flex: 1, padding: '4px 0' }}>
    <motion.div animate={{ scale: active ? 1.1 : 1 }}>{icon}</motion.div>
    <span style={{ fontSize: '10px', fontWeight: active ? 'bold' : 'normal' }}>{label}</span>
  </button>
);
