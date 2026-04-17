import { useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useSettingsStore } from './store/useSettingsStore';
import { useTelegram } from './hooks/useTelegram';
import { RoleSelector } from './components/RoleSelector';
import { SellerDashboard } from './views/Seller/SellerDashboard';
import { AdminDashboard } from './views/Admin/AdminDashboard';
import './index.css';

function App() {
  const { role } = useAuthStore();
  const { theme } = useSettingsStore();
  const { onReady, onExpand } = useTelegram();

  useEffect(() => {
    onReady();
    onExpand();
  }, [onReady, onExpand]);

  useEffect(() => {
    document.body.classList.remove('light', 'dark');
    if (theme !== 'system') {
      document.body.classList.add(theme);
    }
  }, [theme]);

  if (!role) {
    return <RoleSelector />;
  }

  return role === 'ADMIN' ? <AdminDashboard /> : <SellerDashboard />;
}

export default App;
