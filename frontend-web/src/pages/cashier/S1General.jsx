// src/pages/cashier/S1General.jsx
import CashierSettingsLayout from './CashierSettingsLayout';

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b last:border-0" style={{borderColor:'#e2e8f0'}}>
      <span className="text-sm font-medium text-[#0f172a]">{label}</span>
      {children}
    </div>
  );
}

function FakeSelect({ value }) {
  return (
    <div className="px-3 py-1.5 rounded-lg border text-sm flex items-center gap-2 cursor-pointer hover:border-[#1e3a5f] transition-all" style={{borderColor:'#e2e8f0', minWidth:160, color:'#475569'}}>
      {value}
      <svg className="ml-auto" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
  );
}

export default function S1General() {
  return (
    <CashierSettingsLayout activeId="s1">
      <div className="px-6 py-4 border-b" style={{borderColor:'#e2e8f0', background:'#f8fafc'}}>
        <h3 className="text-sm font-semibold text-[#0f172a]">General Settings</h3>
        <p className="text-xs text-[#94a3b8] mt-0.5">Display, language and regional preferences</p>
      </div>
      <Row label="Language"><FakeSelect value="English (EN)" /></Row>
      <Row label="Date Format"><FakeSelect value="DD/MM/YYYY" /></Row>
      <Row label="Currency Symbol"><FakeSelect value="Rs (NPR)" /></Row>
      <Row label="Receipt Footer">
        <input className="input-field text-sm" defaultValue="Thank you for shopping!" style={{width:260}} />
      </Row>
      <Row label="Auto-print Receipt">
        <div className="w-11 h-6 rounded-full bg-[#1e3a5f] relative cursor-pointer">
          <span className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-white shadow-sm" />
        </div>
      </Row>
    </CashierSettingsLayout>
  );
}
