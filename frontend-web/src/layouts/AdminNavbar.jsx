// src/layouts/AdminNavbar.jsx
import { useAdmin } from '../context/AdminContext';
import { useAuth } from '../context/AuthContext';
import { store } from '../data/mockData';

export default function AdminNavbar() {
  const { setCurrentPage } = useAdmin();
  const { user } = useAuth();
  const name     = user?.name?.split(' ').map((n, i) => i === 0 ? n : n[0] + '.').join(' ') || 'Admin';
  const initials = user?.initials || 'AD';

  return (
    <header
      className="fixed top-0 right-0 flex items-center justify-between px-5"
      style={{ left: '192px', height: '52px', background: '#0f172a', zIndex: 40, borderBottom: '1px solid #1e293b' }}
    >
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono font-medium" style={{ color: '#475569' }}>{store.id}</span>
        <span style={{ color: '#334155' }}>—</span>
        <span className="text-sm" style={{ color: '#cbd5e1' }}>{store.name}</span>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={() => setCurrentPage('notifications')} className="relative p-1.5 rounded-lg transition-colors hover:bg-white/5" style={{ color: '#cbd5e1' }}>
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a2 2 0 01-2-2h4a2 2 0 01-2 2z" />
          </svg>
          <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} />
        </button>
        <button onClick={() => setCurrentPage('profile')} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="text-right">
            <p className="text-sm font-medium" style={{ color: '#cbd5e1' }}>
              {name} · <span style={{ color: '#64748b' }}>Admin</span>
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: '#1e3a5f', border: '1px solid #2d4a6f' }}>
            {initials}
          </div>
        </button>
      </div>
    </header>
  );
}
