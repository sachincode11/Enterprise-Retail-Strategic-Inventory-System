// src/pages/cashier/S5Security.jsx
import { useState } from 'react';
import CashierSettingsLayout from './CashierSettingsLayout';
import { Toggle } from '../../components/common';

export default function S5Security() {
  const [pinRefunds, setPinRefunds] = useState(true);
  const [pinVoids,   setPinVoids]   = useState(true);
  const [autoLock,   setAutoLock]   = useState(false);

  return (
    <CashierSettingsLayout activeId="s5">
      <div className="px-6 py-4 border-b" style={{ borderColor:'#e2e8f0', background:'#f8fafc' }}>
        <h3 className="text-sm font-semibold text-[#0f172a]">Security</h3>
        <p className="text-xs text-[#94a3b8] mt-0.5">PIN and access control for cashier terminal</p>
      </div>

      {/* Change PIN */}
      <div className="px-6 py-5 border-b" style={{ borderColor:'#e2e8f0' }}>
        <p className="text-sm font-semibold text-[#0f172a] mb-3">Change Cashier PIN</p>
        <div className="grid grid-cols-3 gap-3" style={{ maxWidth:420 }}>
          <div>
            <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Current PIN</label>
            <input type="password" maxLength={4} placeholder="••••" className="input-field text-center tracking-widest text-lg" />
          </div>
          <div>
            <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">New PIN</label>
            <input type="password" maxLength={4} placeholder="••••" className="input-field text-center tracking-widest text-lg" />
          </div>
          <div>
            <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Confirm</label>
            <input type="password" maxLength={4} placeholder="••••" className="input-field text-center tracking-widest text-lg" />
          </div>
        </div>
        <button className="btn-primary text-xs mt-3 px-4 py-2">Update PIN</button>
      </div>

      {/* Toggles */}
      {[
        { label:'Require PIN for Refunds', sub:'Supervisor PIN needed to process refunds', state:pinRefunds, set:setPinRefunds },
        { label:'Require PIN for Voids',   sub:'Supervisor PIN needed to void a transaction', state:pinVoids, set:setPinVoids   },
        { label:'Auto-lock Terminal',      sub:'Lock terminal after 5 minutes of inactivity',state:autoLock, set:setAutoLock   },
      ].map(item => (
        <div key={item.label} className="flex items-center justify-between px-6 py-4 border-b last:border-0" style={{ borderColor:'#e2e8f0' }}>
          <div>
            <span className="text-sm font-medium text-[#0f172a] block">{item.label}</span>
            <span className="text-xs text-[#94a3b8]">{item.sub}</span>
          </div>
          <Toggle checked={item.state} onChange={item.set} />
        </div>
      ))}

      {/* Session info */}
      <div className="px-6 py-4">
        <div className="rounded-lg p-4" style={{ background:'#f8fafc', border:'1px solid #e2e8f0' }}>
          <p className="text-xs font-semibold text-[#0f172a] mb-1">Current Session</p>
          <p className="text-xs text-[#94a3b8]">Kasim Rijal · Shift #0842 · Started 08:14 AM</p>
          <p className="text-xs text-[#94a3b8] mt-0.5">Terminal: KTM-001-T1 · KTM-001 Kathmandu</p>
        </div>
      </div>
    </CashierSettingsLayout>
  );
}
