// src/pages/admin/S2.jsx — Store Details
import { SettingsLayout } from './SettingsLayout';

function Row({ label, sub, children }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b last:border-0" style={{ borderColor:'#e2e8f0' }}>
      <div>
        <span className="text-sm font-medium text-[#0f172a] block">{label}</span>
        {sub && <span className="text-xs text-[#94a3b8]">{sub}</span>}
      </div>
      {children}
    </div>
  );
}

export default function S2() {
  return (
    <SettingsLayout activeId="S2">
      <div className="px-6 py-4 border-b" style={{ borderColor:'#e2e8f0', background:'#f8fafc' }}>
        <h3 className="text-sm font-semibold text-[#0f172a]">Store Details</h3>
        <p className="text-xs mt-0.5 text-[#94a3b8]">Displayed on receipts and system-wide.</p>
      </div>
      <Row label="Store Name"><input className="input-field" defaultValue="Kathmandu Main Store" style={{ width:260 }} /></Row>
      <Row label="Store ID" sub="Read-only"><input className="input-field" defaultValue="KTM-001" readOnly style={{ width:260, color:'#94a3b8', background:'#f8fafc' }} /></Row>
      <Row label="Address"><input className="input-field" defaultValue="New Baneshwor, Kathmandu, Nepal" style={{ width:300 }} /></Row>
      <Row label="Phone"><input className="input-field" defaultValue="+977-1-441-0000" style={{ width:260 }} /></Row>
      <Row label="Business Hours"><input className="input-field" defaultValue="08:00 – 20:00" style={{ width:200 }} /></Row>
      <Row label="Email"><input className="input-field" defaultValue="admin@store.np" style={{ width:260 }} /></Row>
    </SettingsLayout>
  );
}
