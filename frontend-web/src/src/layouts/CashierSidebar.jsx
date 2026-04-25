// src/layouts/CashierSidebar.jsx
import { useCashier } from '../context/CashierContext';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/Full logo.png';

const navItems = [
  { id: 'dashboard',    label: 'Dashboard',    icon: DashIcon     },
  { id: 'pos',          label: 'POS Billing',  icon: POSIcon      },
  { id: 'transactions', label: 'Transactions', icon: TxnIcon      },
  { id: 'products',     label: 'Products',     icon: ProductsIcon },
];
const bottomItems = [
  { id: 'profile',     label: 'My Profile', icon: ProfileIcon  },
  { id: 'settings',    label: 'Settings',   icon: SettingsIcon },
  { id: '__logout',    label: 'Log Out',    icon: LogoutIcon   },
];

export default function CashierSidebar() {
  const { currentPage, setCurrentPage } = useCashier();
  const { logout } = useAuth();

  const handleNav = async (id) => {
    if (id === '__logout') { await logout(); return; }
    if (id === 'settings') { setCurrentPage('s1'); return; }
    setCurrentPage(id);
  };

  return (
    <aside className="w-[210px] min-h-screen flex flex-col shrink-0" style={{ background: '#0f172a' }}>
      <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: '#1e293b' }}>
        <button onClick={() => setCurrentPage('dashboard')} className="flex items-center">
          <img src={logo} alt="Logo" className="w-36 h-auto" />
        </button>
      </div>
      <nav className="flex-1 px-3 pt-4">
        <p className="text-[10px] font-mono uppercase tracking-widest px-2 mb-2" style={{ color: '#475569' }}>Main</p>
        <ul className="space-y-0.5">
          {navItems.map(item => {
            const isActive = currentPage === item.id;
            return (
              <li key={item.id}>
                <button onClick={() => handleNav(item.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150"
                  style={{ background: isActive ? '#1e3a5f' : 'transparent', color: isActive ? '#ffffff' : '#94a3b8', boxShadow: isActive ? '0 2px 8px rgba(30,58,95,0.4)' : 'none' }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(14,165,233,0.1)'; e.currentTarget.style.color = '#ffffff'; }}}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}}
                >
                  <item.icon />{item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mx-3 mb-3 rounded-lg px-3 py-3" style={{ background: '#1e293b' }}>
        <p className="text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: '#475569' }}>IoT Device</p>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
          <span className="text-xs font-mono" style={{ color: '#94a3b8' }}>ESP32 · Active</span>
        </div>
      </div>
      <div className="px-3 pb-5 pt-3 border-t" style={{ borderColor: '#1e293b' }}>
        <ul className="space-y-0.5">
          {bottomItems.map(item => {
            const isActive = currentPage === item.id || (item.id === 'settings' && currentPage?.startsWith('s'));
            const isLogout = item.id === '__logout';
            return (
              <li key={item.id}>
                <button onClick={() => handleNav(item.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150"
                  style={{ background: isActive ? '#1e3a5f' : 'transparent', color: isActive ? '#ffffff' : isLogout ? '#64748b' : '#94a3b8' }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = isLogout ? 'rgba(239,68,68,0.08)' : 'rgba(14,165,233,0.1)'; e.currentTarget.style.color = isLogout ? '#f87171' : '#ffffff'; }}}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isLogout ? '#64748b' : '#94a3b8'; }}}
                >
                  <item.icon />{item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

function DashIcon()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>; }
function POSIcon()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M7 15h2M11 15h2"/></svg>; }
function TxnIcon()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4"/></svg>; }
function ProductsIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>; }
function ProfileIcon()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>; }
function SettingsIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>; }
function LogoutIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
