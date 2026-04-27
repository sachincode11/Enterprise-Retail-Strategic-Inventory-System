// src/layouts/AdminSidebar.jsx
import { useAdmin } from '../context/AdminContext';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/Full logo.png';

const navItems = [
  { group: 'Overview', items: [
    { id: 'dashboard',    label: 'Dashboard',       icon: DashIcon  },
    { id: 'transactions', label: 'Transactions',    icon: TxnIcon   },
  ]},
  { group: 'Catalogue', items: [
    { id: 'products',        label: 'Products',        icon: ProdIcon },
    { id: 'inventory',       label: 'Inventory',       icon: InvIcon  },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: POIcon   },
    { id: 'suppliers',       label: 'Suppliers',       icon: SupIcon  },
  ]},
  { group: 'People', items: [
    { id: 'customers', label: 'Customers', icon: CustIcon  },
    { id: 'staff',     label: 'Staff',     icon: StaffIcon },
  ]},
  { group: 'Marketing', items: [
    { id: 'discounts', label: 'Discounts', icon: DiscIcon },
  ]},
  { group: 'Intelligence', items: [
    { id: 'reports', label: 'Reports',        icon: RepIcon },
    { id: 'ai',      label: 'AI Forecasting', icon: AIIcon  },
  ]},
];

const bottomItems = [
  { id: 'settings', label: 'Settings',  icon: SetIcon  },
  { id: 'profile',  label: 'My Profile',icon: ProfIcon },
  { id: '__logout', label: 'Log Out',   icon: LogIcon  },
];

export default function AdminSidebar() {
  const { currentPage, setCurrentPage } = useAdmin();
  const { logout } = useAuth();

  const handleNav = async (id) => {
    if (id === '__logout') { await logout(); return; }
    setCurrentPage(id);
  };

  return (
    <aside className="fixed left-0 top-0 h-screen flex flex-col" style={{ width: '192px', background: '#0f172a', zIndex: 50 }}>
      <div className="flex items-center gap-2 px-4 py-4 border-b" style={{ borderColor: '#1e293b' }}>
        <img src={logo} alt="Logo" className="w-38 h-auto" style={{ maxWidth: 140 }} />
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navItems.map(group => (
          <div key={group.group} className="mb-4">
            <p className="section-label" style={{ color: '#475569', fontSize: '10px' }}>{group.group}</p>
            {group.items.map(item => (
              <button key={item.id} onClick={() => handleNav(item.id)}
                className={`sidebar-link w-full text-left ${currentPage === item.id ? 'active' : ''}`}
              >
                <item.icon /><span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="border-t px-2 py-3" style={{ borderColor: '#1e293b' }}>
        {bottomItems.map(item => (
          <button key={item.id} onClick={() => handleNav(item.id)}
            className={`sidebar-link w-full text-left ${currentPage === item.id ? 'active' : ''}`}
          >
            <item.icon /><span>{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

function DashIcon()  { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>; }
function TxnIcon()  { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M2 8h8M2 12h10" strokeLinecap="round"/><path d="M12 10l2 2-2 2" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function ProdIcon() { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="14" height="10" rx="1"/><path d="M5 4V3a3 3 0 016 0v1" strokeLinecap="round"/></svg>; }
function InvIcon()  { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 4l7-3 7 3v8l-7 3-7-3V4z"/><path d="M1 4l7 3 7-3M8 7v7"/></svg>; }
function POIcon()   { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="1" width="12" height="14" rx="1"/><path d="M5 5h6M5 8h6M5 11h4" strokeLinecap="round"/></svg>; }
function SupIcon()  { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 11V6l4-4h6l4 4v5" strokeLinecap="round" strokeLinejoin="round"/><rect x="5" y="9" width="6" height="6"/><path d="M1 11h14"/></svg>; }
function CustIcon() { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="5" r="3"/><path d="M1 14c0-3 2-5 5-5h.5" strokeLinecap="round"/><circle cx="12" cy="10" r="2.5"/><path d="M9.5 15c0-1.5 1-2.5 2.5-2.5s2.5 1 2.5 2.5" strokeLinecap="round"/></svg>; }
function StaffIcon(){ return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5" strokeLinecap="round"/></svg>; }
function DiscIcon() { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="5" cy="5" r="2"/><circle cx="11" cy="11" r="2"/><path d="M14 2L2 14" strokeLinecap="round"/></svg>; }
function RepIcon()  { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12l4-4 3 2 4-5 3 2" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 14h14" strokeLinecap="round"/></svg>; }
function AIIcon()   { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4" strokeLinecap="round"/></svg>; }
function SetIcon()  { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.6 2.6l1.4 1.4M12 12l1.4 1.4M2.6 13.4l1.4-1.4M12 4l1.4-1.4" strokeLinecap="round"/></svg>; }
function ProfIcon() { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="6" r="3"/><path d="M2 15c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round"/></svg>; }
function LogIcon()  { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3" strokeLinecap="round"/><path d="M11 11l3-3-3-3M14 8H6" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
