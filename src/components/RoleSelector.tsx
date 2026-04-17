import React from 'react';
import { ShieldCheck, Smartphone } from 'lucide-react';

interface RoleSelectorProps {
  diagnostics?: {
    hasTelegramObject: boolean;
    hasInitData: boolean;
    initDataLength: number;
    telegramUserId: string | null;
    platform: string | null;
  };
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ diagnostics }) => {
  return (
    <div className="container" style={{ textAlign: 'center', paddingTop: '56px' }}>
      <ShieldCheck size={64} color="var(--button-color)" style={{ marginBottom: '20px' }} />
      <h1>Retail Manager</h1>
      <p style={{ color: 'var(--hint-color)', marginBottom: '28px' }}>
        Open this app from Telegram to authenticate securely.
      </p>

      <div className="card" style={{ padding: '24px', display: 'grid', gap: '12px', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Smartphone size={22} color="var(--button-color)" />
          <div style={{ fontWeight: '700' }}>Telegram Login Required</div>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--hint-color)', lineHeight: 1.5 }}>
          This production build accepts only Telegram Mini App authentication. Launch it from your bot to continue.
        </div>
      </div>

      <div
        className="card"
        style={{
          marginTop: '16px',
          padding: '16px',
          textAlign: 'left',
          fontSize: '12px',
          color: 'var(--hint-color)',
          display: 'grid',
          gap: '6px',
        }}
      >
        <div style={{ fontWeight: '700', color: 'var(--text-color)' }}>Telegram Debug</div>
        <div>WebApp object: {diagnostics?.hasTelegramObject ? 'yes' : 'no'}</div>
        <div>initData: {diagnostics?.hasInitData ? 'yes' : 'no'}</div>
        <div>initData length: {diagnostics?.initDataLength ?? 0}</div>
        <div>User ID: {diagnostics?.telegramUserId ?? 'none'}</div>
        <div>Platform: {diagnostics?.platform ?? 'unknown'}</div>
      </div>
    </div>
  );
};
