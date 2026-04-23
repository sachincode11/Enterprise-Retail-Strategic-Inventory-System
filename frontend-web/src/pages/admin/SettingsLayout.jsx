// src/pages/admin/SettingsLayout.jsx
import AdminLayout from '../../layouts/AdminLayout';
import { useAdmin } from '../../context/AdminContext';

const settingsSections = [
  { id:'S1', label:'General',        icon: GenIcon   },
  { id:'S2', label:'Store',          icon: StoreIcon },
  { id:'S3', label:'Tax & Billing',  icon: TaxIcon   },
  { id:'S4', label:'Roles & Access', icon: RoleIcon  },
  { id:'S5', label:'Notifications',  icon: NotifIcon },
  { id:'S6', label:'Security',       icon: SecIcon   },
  { id:'S7', label:'Integrations',   icon: IntIcon   },
];

export function SettingsLayout({ activeId, children }) {
  const { setCurrentPage } = useAdmin();
  const isSecurityPage = activeId === 'S6';

  return (
    <AdminLayout>
      <div className="mb-6">
        <p className="text-xs mb-0.5 text-[#94a3b8]">System Configuration</p>
        <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]">Settings</h1>
      </div>
      <div className="flex gap-4">
        {/* Left nav */}
        <div className="bg-white rounded-xl border overflow-hidden flex-shrink-0" style={{ width:200, borderColor:'#e2e8f0', alignSelf:'flex-start' }}>
          {settingsSections.map(s => (
            <button key={s.id} onClick={() => setCurrentPage(s.id)}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left border-b last:border-0 transition-all"
              style={{
                borderColor: '#e2e8f0',
                background:  activeId === s.id ? '#eff6ff' : 'transparent',
                fontWeight:  activeId === s.id ? 600 : 400,
                color:       activeId === s.id ? '#1e3a5f' : '#475569',
              }}
              onMouseEnter={e => { if (activeId !== s.id) e.currentTarget.style.background = '#f8fafc'; }}
              onMouseLeave={e => { if (activeId !== s.id) e.currentTarget.style.background = 'transparent'; }}
            >
              <s.icon active={activeId === s.id} />{s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-xl border overflow-hidden" style={{ borderColor:'#e2e8f0' }}>
          {children}
          {!isSecurityPage && (
            <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor:'#e2e8f0' }}>
              <button className="btn-secondary">Discard</button>
              <button className="btn-primary">Save Changes</button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function GenIcon({ active })   { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: active?1:0.5 }}><rect x="1" y="1" width="5" height="5" rx="1"/><rect x="8" y="1" width="5" height="5" rx="1"/><rect x="1" y="8" width="5" height="5" rx="1"/><rect x="8" y="8" width="5" height="5" rx="1"/></svg>; }
function StoreIcon({ active }) { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: active?1:0.5 }}><rect x="1" y="1" width="12" height="12" rx="1"/><path d="M4 7h6M4 10h4" strokeLinecap="round"/></svg>; }
function TaxIcon({ active })   { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: active?1:0.5 }}><circle cx="7" cy="7" r="6"/><path d="M7 4v3l2 2" strokeLinecap="round"/></svg>; }
function RoleIcon({ active })  { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: active?1:0.5 }}><circle cx="5" cy="4" r="2.5"/><path d="M1 12c0-2.5 1.8-4 4-4s4 1.5 4 4" strokeLinecap="round"/><path d="M10 6l1.5 1.5L14 5" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function NotifIcon({ active }) { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: active?1:0.5 }}><path d="M7 1a5 5 0 00-5 5v2.5l-1 1.5h12l-1-1.5V6a5 5 0 00-5-5z"/><path d="M5.5 12a1.5 1.5 0 003 0"/></svg>; }
function SecIcon({ active })   { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: active?1:0.5 }}><path d="M7 1l5 2v4c0 3-5 6-5 6S2 10 2 7V3l5-2z"/></svg>; }
function IntIcon({ active })   { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: active?1:0.5 }}><circle cx="3" cy="7" r="2"/><circle cx="11" cy="3" r="2"/><circle cx="11" cy="11" r="2"/><path d="M5 7h2M9 3H7l-2 4M9 11H7" strokeLinecap="round"/></svg>; }
