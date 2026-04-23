// src/layouts/CashierSettingsLayout.jsx  (also used as a page-level layout)
import CashierLayout from '../../layouts/CashierLayout';
import { useCashier } from '../../context/CashierContext';

// Sections: Payment, Transaction, Cash Drawer, Sound REMOVED from cashier settings
const sections = [
  { id: 's1', label: 'General'       },
  { id: 's2', label: 'Billing & POS' },
  { id: 's3', label: 'IoT Devices'   },
  { id: 's4', label: 'Notifications' },
  { id: 's5', label: 'Security'      },
];

export default function CashierSettingsLayout({ activeId, children, onSave = () => {} }) {
  const { setCurrentPage } = useCashier();
  return (
    <CashierLayout>
      <div className="p-8">
        <div className="mb-6">
          <p className="text-xs text-[#94a3b8] font-mono mb-1">Configuration</p>
          <h1 className="text-2xl font-bold text-[#0f172a]">Settings</h1>
        </div>
        <div className="flex gap-4">
          <div className="bg-white rounded-xl border overflow-hidden flex-shrink-0" style={{ width: 180, borderColor: '#e2e8f0', alignSelf: 'flex-start' }}>
            {sections.map(s => (
              <button key={s.id} onClick={() => setCurrentPage(s.id)}
                className="w-full flex items-center px-4 py-3 text-sm text-left border-b last:border-0 transition-all"
                style={{
                  borderColor: '#e2e8f0',
                  background:  activeId === s.id ? '#eff6ff' : 'transparent',
                  fontWeight:  activeId === s.id ? 600 : 400,
                  color:       activeId === s.id ? '#1e3a5f' : '#475569',
                }}
                onMouseEnter={e => { if (activeId !== s.id) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={e => { if (activeId !== s.id) e.currentTarget.style.background = 'transparent'; }}
              >{s.label}</button>
            ))}
          </div>
          <div className="flex-1 bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
            {children}
            <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: '#e2e8f0' }}>
              <button className="btn-secondary">Discard</button>
              <button className="btn-primary" onClick={onSave}>Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    </CashierLayout>
  );
}
