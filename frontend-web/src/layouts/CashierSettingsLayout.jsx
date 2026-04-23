// src/layouts/CashierSettingsLayout.jsx
import CashierLayout from './CashierLayout';
import { useCashier } from '../context/CashierContext';

const sections = [
  { id:'s1', label:'General'        },
  { id:'s2', label:'Billing / POS'  },
  { id:'s3', label:'IoT Devices'    },
  { id:'s4', label:'Notifications'  },
  { id:'s5', label:'Security'       },
];

export default function CashierSettingsLayout({ activeId, children }) {
  const { setCurrentPage } = useCashier();
  return (
    <CashierLayout>
      <div className="p-8 max-w-[900px]">
        <div className="mb-6">
          <p className="text-xs text-[#94a3b8] font-mono mb-1">Terminal Configuration</p>
          <h1 className="text-2xl font-bold text-[#0f172a]">Settings</h1>
        </div>
        <div className="flex gap-5">
          {/* Left nav */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden flex-shrink-0" style={{ width:180, alignSelf:'flex-start' }}>
            {sections.map(s => (
              <button key={s.id} onClick={() => setCurrentPage(s.id)}
                className="w-full flex items-center px-4 py-3 text-sm text-left border-b last:border-0 transition-all"
                style={{ borderColor:'#e2e8f0', background: activeId===s.id?'#eff6ff':'transparent', fontWeight: activeId===s.id?600:400, color: activeId===s.id?'#1e3a5f':'#475569' }}
                onMouseEnter={e => { if (activeId!==s.id) e.currentTarget.style.background='#f8fafc'; }}
                onMouseLeave={e => { if (activeId!==s.id) e.currentTarget.style.background='transparent'; }}
              >{s.label}</button>
            ))}
          </div>
          {/* Content */}
          <div className="flex-1 bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
            {children}
            <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor:'#e2e8f0' }}>
              <button className="btn-secondary">Discard</button>
              <button className="btn-primary">Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    </CashierLayout>
  );
}

export function Section({ title, description, children }) {
  return (
    <div>
      <div className="px-6 py-4 border-b" style={{ borderColor:'#e2e8f0', background:'#f8fafc' }}>
        <h3 className="text-sm font-semibold text-[#0f172a]">{title}</h3>
        {description && <p className="text-xs text-[#94a3b8] mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function Row({ label, description, children }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b last:border-0" style={{ borderColor:'#e2e8f0' }}>
      <div>
        <p className="text-sm font-medium text-[#0f172a]">{label}</p>
        {description && <p className="text-xs text-[#94a3b8] mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}
