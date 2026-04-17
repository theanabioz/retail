import { useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useInventoryStore } from './store/useInventoryStore';
import { useSettingsStore } from './store/useSettingsStore';
import { useTelegram } from './hooks/useTelegram';
import { authenticateTelegram } from './lib/api';
import { RoleSelector } from './components/RoleSelector';
import { SellerDashboard } from './views/Seller/SellerDashboard';
import { AdminDashboard } from './views/Admin/AdminDashboard';
import './index.css';

function App() {
  const { role, setAuthenticatedUser } = useAuthStore();
  const { theme } = useSettingsStore();
  const { stores, hasLoadedCatalog, loadCatalog } = useInventoryStore();
  const { onReady, onExpand, tg } = useTelegram();

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

  useEffect(() => {
    if (!hasLoadedCatalog) {
      void loadCatalog();
    }
  }, [hasLoadedCatalog, loadCatalog]);

  useEffect(() => {
    if (!tg?.initData || role || !hasLoadedCatalog) {
      return;
    }

    void authenticateTelegram()
      .then((user) => {
        const mappedAssignedStoreIds = user.assignedStoreIds
          .map((apiStoreId) => stores.find((store) => store.apiId === apiStoreId)?.id)
          .filter((value): value is string => Boolean(value));

        setAuthenticatedUser({
          role: user.role,
          telegramId: user.telegramId,
          fullName: user.fullName,
          assignedStoreIds: mappedAssignedStoreIds,
          currentStoreId: user.role === 'SELLER' ? mappedAssignedStoreIds[0] ?? null : null,
        });
      })
      .catch((error) => {
        console.error('Telegram auth failed', error);
      });
  }, [hasLoadedCatalog, role, setAuthenticatedUser, stores, tg?.initData]);

  if (tg?.initData && !role) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '64px' }}>
        <h1>Signing In</h1>
        <p style={{ color: 'var(--hint-color)' }}>Verifying your Telegram identity...</p>
      </div>
    );
  }

  if (!role) {
    return <RoleSelector />;
  }

  return role === 'ADMIN' ? <AdminDashboard /> : <SellerDashboard />;
}

export default App;
