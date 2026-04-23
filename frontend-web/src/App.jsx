// src/App.jsx
import { useState, useEffect } from 'react';
import CashierApp from './pages/cashier/CashierApp';
import AdminApp from './pages/admin/AdminApp';

function getRoleFromHash() {
  const hash = window.location.hash;
  if (hash.startsWith('#/admin'))   return 'admin';
  if (hash.startsWith('#/cashier')) return 'cashier';
  return null;
}

export default function App() {
  const [role, setRole] = useState(getRoleFromHash);

  useEffect(() => {
    const onHashChange = () => setRole(getRoleFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  function navigate(to) {
    window.location.hash = `/${to}`;
    setRole(to);
  }

  if (role === 'admin')   return <AdminApp />;
  if (role === 'cashier') return <CashierApp />;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#0a0a0a' }}>
      <div className="mb-12 text-center">
        <div className="font-bold text-white" style={{ fontSize: 64, letterSpacing: '-2px', fontFamily: 'DM Sans, sans-serif' }}>
          inv<span style={{ color: '#84cc16' }}>o</span>
          <span style={{ color: '#84cc16', fontSize: 32, marginLeft: 4 }}>six</span>
        </div>
        <p className="text-xs tracking-[0.25em] uppercase mt-2" style={{ color: '#4a4a4a', fontFamily: 'DM Mono, monospace' }}>
          Select your workspace
        </p>
      </div>

      <div className="flex gap-4">
        <RoleCard
          label="Admin Dashboard"
          description="Manage inventory, staff, reports & settings"
          icon={<AdminIcon />}
          onClick={() => navigate('admin')}
        />
        <RoleCard
          label="Cashier Terminal"
          description="POS billing, transactions & shift management"
          icon={<CashierIcon />}
          onClick={() => navigate('cashier')}
        />
      </div>
    </div>
  );
}

function RoleCard({ label, description, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-start gap-4 p-6 rounded-2xl border text-left transition-all duration-200"
      style={{ background: '#141414', borderColor: '#2a2a2a', width: 260 }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#84cc16'; e.currentTarget.style.background = '#161a12'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.background = '#141414'; }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#1f1f1f', color: '#84cc16' }}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-white mb-1">{label}</p>
        <p className="text-xs" style={{ color: '#5a5a5a' }}>{description}</p>
      </div>
      <div className="mt-auto text-xs" style={{ color: '#3a3a3a', fontFamily: 'DM Mono, monospace' }}>Enter →</div>
    </button>
  );
}

function AdminIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
}
function CashierIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M7 15h2M11 15h2"/></svg>;
}
