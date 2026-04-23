// src/pages/admin/S6.jsx — Security / Access Control
import { useState } from 'react';
import { SettingsLayout } from './SettingsLayout';
import { Toggle } from '../../components/common';

function Row({ label, sub, children }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b last:border-0 transition-colors hover:bg-[#f8fafc]" style={{ borderColor:'#e2e8f0' }}>
      <div>
        <span className="text-sm font-medium text-[#0f172a] block">{label}</span>
        {sub && <span className="text-xs text-[#94a3b8]">{sub}</span>}
      </div>
      {children}
    </div>
  );
}
function FakeSelect({ placeholder }) {
  return (
    <div className="px-3 py-1.5 rounded-lg border text-sm flex items-center gap-2 cursor-pointer hover:border-[#1e3a5f] hover:text-[#1e3a5f] transition-all" style={{ borderColor:'#e2e8f0', minWidth:160, color:'#475569' }}>
      {placeholder}
      <svg className="ml-auto" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
  );
}

export default function S6() {
  const [pinVoids,    setPinVoids]    = useState(true);
  const [pinRefunds,  setPinRefunds]  = useState(true);
  const [twoFA,       setTwoFA]       = useState(true);

  return (
    <SettingsLayout activeId="S6">
      <div className="px-6 py-4 border-b" style={{ borderColor:'#e2e8f0', background:'#f8fafc' }}>
        <h3 className="text-sm font-semibold text-[#0f172a]">Access Control</h3>
        <p className="text-xs text-[#94a3b8] mt-0.5">Manage authentication and authorization settings.</p>
      </div>
      <Row label="Admin Auto Logout" sub="Automatically log out inactive admin sessions"><FakeSelect placeholder="30 minutes" /></Row>
      <Row label="Require PIN for Voids" sub="Cashiers must enter supervisor PIN to void items"><Toggle checked={pinVoids} onChange={setPinVoids} /></Row>
      <Row label="Require PIN for Refunds" sub="Prevents unauthorized refund processing"><Toggle checked={pinRefunds} onChange={setPinRefunds} /></Row>
      <Row label="Two-Factor Auth for All Admins" sub="Email OTP required on every admin login"><Toggle checked={twoFA} onChange={setTwoFA} /></Row>
      <Row label="Audit Log Retention" sub="How long activity logs are retained"><FakeSelect placeholder="90 days" /></Row>
    </SettingsLayout>
  );
}
