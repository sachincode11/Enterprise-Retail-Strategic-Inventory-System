// src/layouts/CashierTopbar.jsx — IMPROVED: live Nepal time shown in topbar
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function CashierTopbar() {
  const { user }  = useAuth();
  const { nowNP } = useApp();

  const name     = user?.name || 'Cashier';
  const initials = user?.initials || 'CA';

  const timeStr = nowNP.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'Asia/Kathmandu',
  });

  return (
    <header className="h-[52px] flex items-center justify-between px-5 shrink-0 border-b"
      style={{ background: '#0f172a', borderColor: '#1e293b' }}>
      <div className="flex items-center gap-3">
        <span className="text-white font-bold text-base tracking-tight">Invo</span>
        <span style={{ color: '#334155' }}>|</span>
        <span className="text-xs font-mono tracking-widest uppercase" style={{ color: '#475569' }}>Cashier Terminal</span>
      </div>
      <div className="flex items-center gap-3">
        <StatusPill label="IoT Connected" />
        <StatusPill label="WS Live" />
        {/* Live Nepal clock */}
        <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ color: '#64748b', background: 'rgba(255,255,255,0.04)', border: '1px solid #1e293b' }}>
          NPT {timeStr}
        </span>
        <span className="text-xs" style={{ color: '#64748b' }}>
          {name} · <span className="capitalize">Cashier</span>
        </span>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
          style={{ background: '#1e3a5f', border: '1px solid #2d4a6f' }}>
          {initials}
        </div>
      </div>
    </header>
  );
}

function StatusPill({ label }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full px-3 py-1"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
      <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</span>
    </div>
  );
}
