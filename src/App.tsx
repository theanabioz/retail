import { useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useTelegram } from './hooks/useTelegram';
import { RoleSelector } from './components/RoleSelector';
import { SellerDashboard } from './views/Seller/SellerDashboard';
import { AdminDashboard } from './views/Admin/AdminDashboard';
import './index.css';

function App() {
  const { role } = useAuthStore();
  const { onReady, onExpand } = useTelegram();

  useEffect(() => {
    onReady();
    onExpand();
  }, [onReady, onExpand]);

  if (!role) {
    return <RoleSelector />;
  }

  return role === 'ADMIN' ? <AdminDashboard /> : <SellerDashboard />;
}

export default App;
