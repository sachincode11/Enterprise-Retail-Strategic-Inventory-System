// src/pages/cashier/S5Security.jsx — IMPROVED: Change PIN removed; shows read-only PIN policy
import CashierSettingsLayout from './CashierSettingsLayout';
import { Toggle } from '../../components/common';
import { useState } from 'react';

export default function S5Security() {
  const [pinRefunds, setPinRefunds] = useState(true);
  const [pinVoids,   setPinVoids]   = useState(true);

  return (
    <CashierSettingsLayout activeId="s5">
      <div className="px-6 py-4 border-b" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
        <h3 className="text-sm font-semibold text-[#0f172a]">Security</h3>
        <p className="text-xs text-[#94a3b8] mt-0.5">PIN and access control settings for your cashier terminal</p>
      </div>

      {/* PIN info — change PIN removed per requirements; managed by Admin */}
      <div className="px-6 py-5 border-b" style={{ borderColor: '#e2e8f0' }}>
        <p className="text-sm font-semibold text-[#0f172a] mb-2">Cashier PIN</p>
        <div className="rounded-lg p-4 border" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#eff6ff' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#1e3a5f" strokeWidth="1.5">
                <rect x="3" y="6" width="8" height="6" rx="1"/><path d="M5 6V4a2 2 0 014 0v2"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-[#0f172a]">PIN managed by Admin</p>
              <p className="text-xs text-[#475569] mt-0.5 leading-relaxed">
                Your 4-digit PIN is assigned and managed by your store administrator. To reset your PIN, contact your Admin. Your PIN is required to process transactions and refunds.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Read-only toggles — these reflect admin-set policy */}
      <div className="px-6 py-5 border-b" style={{ borderColor: '#e2e8f0' }}>
        <p className="text-xs font-mono text-[#94a3b8] uppercase tracking-widest mb-4">PIN Requirements (Set by Admin)</p>
        <div className="space-y-4">
          {[
            { label: 'Require PIN for Transactions', sub: 'PIN needed before every payment is processed', state: true },
            { label: 'Require PIN for Refunds',      sub: 'Supervisor PIN needed to process refunds',    state: pinRefunds },
            { label: 'Require PIN for Voids',        sub: 'Supervisor PIN needed to void a transaction', state: pinVoids },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#0f172a]">{item.label}</p>
                <p className="text-xs text-[#94a3b8]">{item.sub}</p>
              </div>
              {/* Locked to ON — cashier cannot disable */}
              <div className="flex items-center gap-2">
                <Toggle checked={item.state} onChange={() => {}} />
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                  <rect x="3" y="6" width="8" height="6" rx="1"/><path d="M5 6V4a2 2 0 014 0v2"/>
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 py-5">
        <p className="text-xs text-[#94a3b8]">
          Security settings are controlled by your store admin. If you believe a setting is incorrect, contact your administrator.
        </p>
      </div>
    </CashierSettingsLayout>
  );
}
