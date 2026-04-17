import React from 'react';
import { useAuthStore, type UserRole } from '../store/useAuthStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { UserCog, Store, ShieldCheck } from 'lucide-react';

export const RoleSelector: React.FC = () => {
  const { setRole, setCurrentStoreId } = useAuthStore();
  const { stores } = useInventoryStore();

  const handleSelect = (role: UserRole, storeId?: string) => {
    setRole(role);
    if (storeId) setCurrentStoreId(storeId);
  };

  return (
    <div className="container" style={{ textAlign: 'center', paddingTop: '40px' }}>
      <ShieldCheck size={64} color="var(--button-color)" style={{ marginBottom: '24px' }} />
      <h1>Retail Manager</h1>
      <p style={{ color: 'var(--hint-color)', marginBottom: '32px' }}>Choose your role to enter the system</p>
      
      <div style={{ display: 'grid', gap: '16px' }}>
        <button 
          className="card" 
          onClick={() => handleSelect('ADMIN')}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}
        >
          <UserCog size={32} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 'bold' }}>Administrator</div>
            <div style={{ fontSize: '12px', color: 'var(--hint-color)' }}>Full access to analytics and management</div>
          </div>
        </button>

        <h3 style={{ marginTop: '20px' }}>Seller (Choose Location)</h3>
        {stores.map(store => (
          <button 
            key={store.id}
            className="card" 
            onClick={() => handleSelect('SELLER', store.id)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}
          >
            <Store size={32} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 'bold' }}>{store.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--hint-color)' }}>{store.address}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
