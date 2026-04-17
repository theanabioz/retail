import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useSaleStore } from '../../store/useSaleStore';
import { LogOut, ScanBarcode, ShoppingCart, Plus, Minus, Trash2, Play, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SellerDashboard: React.FC = () => {
  const { logout, currentStoreId } = useAuthStore();
  const { products, stores } = useInventoryStore();
  const { cart, addToCart, updateQuantity, clearCart, isShiftActive, toggleShift } = useSaleStore();
  const [search, setSearch] = useState('');

  const currentStore = stores.find(s => s.id === currentStoreId);
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search)
  );

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleCheckout = () => {
    alert(`Order confirmed! Total: €${cartTotal.toFixed(2)}`);
    clearCart();
  };

  return (
    <div className="container" style={{ paddingBottom: '100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ marginBottom: 0 }}>{currentStore?.name}</h2>
          <p style={{ fontSize: '12px', color: 'var(--hint-color)' }}>{currentStore?.address}</p>
        </div>
        <button onClick={logout} style={{ background: 'none', color: 'var(--danger-color)' }}><LogOut size={24}/></button>
      </div>

      {/* Shift Control */}
      <button 
        onClick={toggleShift}
        style={{ 
          width: '100%', 
          padding: '16px', 
          borderRadius: '12px', 
          backgroundColor: isShiftActive ? 'var(--danger-color)' : 'var(--success-color)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontWeight: 'bold',
          marginBottom: '20px'
        }}
      >
        {isShiftActive ? <><Square size={20}/> End Shift</> : <><Play size={20}/> Start Shift</>}
      </button>

      {isShiftActive ? (
        <>
          {/* Search & Scan */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Search product or scan barcode..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </div>
            <button className="card" style={{ padding: '0 12px', marginBottom: 0 }}>
              <ScanBarcode size={24} />
            </button>
          </div>

          {/* Product List */}
          <div style={{ display: 'grid', gap: '10px' }}>
            {filteredProducts.map(product => (
              <motion.div 
                layout
                key={product.id} 
                className="card" 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px' }}
              >
                <div>
                  <div style={{ fontWeight: '600' }}>{product.name}</div>
                  <div style={{ color: 'var(--hint-color)', fontSize: '14px' }}>
                    €{product.price.toFixed(2)} • Stock: {product.stock[currentStoreId!] || 0}
                  </div>
                </div>
                <button 
                  onClick={() => addToCart(product)}
                  style={{ 
                    backgroundColor: 'var(--button-color)', 
                    color: 'white', 
                    borderRadius: '50%', 
                    width: '36px', 
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Plus size={20} />
                </button>
              </motion.div>
            ))}
          </div>

          {/* Cart Bottom Sheet */}
          <AnimatePresence>
            {cart.length > 0 && (
              <motion.div 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
                style={{ 
                  position: 'fixed', 
                  bottom: 0, 
                  left: 0, 
                  right: 0, 
                  backgroundColor: 'var(--bg-color)',
                  boxShadow: '0 -4px 10px rgba(0,0,0,0.1)',
                  padding: '16px',
                  borderTopLeftRadius: '20px',
                  borderTopRightRadius: '20px',
                  zIndex: 100
                }}
              >
                <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '16px' }}>
                  {cart.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                        <div style={{ fontSize: '12px' }}>€{(item.price * item.quantity).toFixed(2)}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={18}/></button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={18}/></button>
                        <button onClick={() => updateQuantity(item.id, 0)} style={{ color: 'var(--danger-color)', marginLeft: '8px' }}><Trash2 size={18}/></button>
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={handleCheckout}
                  style={{ 
                    width: '100%', 
                    padding: '16px', 
                    borderRadius: '12px', 
                    backgroundColor: 'var(--button-color)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontWeight: 'bold'
                  }}
                >
                  <ShoppingCart size={20}/> Total: €{cartTotal.toFixed(2)} — Checkout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--hint-color)' }}>
          <p>Shift is closed. Please start your shift to begin sales.</p>
        </div>
      )}
    </div>
  );
};
