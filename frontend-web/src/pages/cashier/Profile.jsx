// src/pages/cashier/Profile.jsx — IMPROVED: Change PIN removed
import { useState } from 'react';
import CashierLayout from '../../layouts/CashierLayout';
import { Toggle } from '../../components/common';
import { useAuth } from '../../context/AuthContext';

const shiftHistory = [
  { id: '#0842', date: '22 Mar 2026', status: 'Active', hours: '08:00 – ongoing', txns: 91  },
  { id: '#0834', date: '21 Mar 2026', status: null,     hours: '08:00 – 17:00',   txns: 118 },
  { id: '#0826', date: '20 Mar 2026', status: null,     hours: '08:00 – 16:30',   txns: 104 },
  { id: '#0814', date: '19 Mar 2026', status: null,     hours: '08:00 – 17:00',   txns: 97  },
];
const recentActivity = [
  { action: 'Completed transaction #TXN-0091', detail: 'Rs 1,416 · Cash',   time: '14:48' },
  { action: 'Applied discount to #TXN-0091',   detail: 'Seasonal Sale 10%', time: '14:46' },
  { action: 'Processed refund #TXN-0088',      detail: 'Rs 3,400 · Card',   time: '13:55' },
  { action: 'Login — Shift #0842 started',     detail: 'kasim@store.np',    time: '08:14' },
];

export default function Profile() {
  const { user } = useAuth();
  const [receiptSound, setReceiptSound] = useState(true);
  const [notifAlerts,  setNotifAlerts]  = useState(true);

  const displayName  = user?.name || 'Kasim Rijal';
  const displayEmail = user?.email || 'kasim@store.np';
  const initials     = user?.initials || 'KR';

  return (
    <CashierLayout>
      <div className="p-8 max-w-[900px]">
        <div className="mb-6">
          <p className="text-xs text-[#94a3b8] font-mono mb-1">Account</p>
          <h1 className="text-2xl font-bold text-[#0f172a]">My Profile</h1>
        </div>

        {/* Hero */}
        <div className="rounded-xl p-6 mb-5 flex items-center gap-5" style={{ background: '#0f172a' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ background: '#1e3a5f' }}>
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{displayName}</h2>
            <p className="text-sm mt-0.5" style={{ color: '#94a3b8' }}>Cashier · KTM-001 — Kathmandu</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)', color: '#cbd5e1' }}>Shift #0842</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                <span className="text-xs text-[#94a3b8]">On Shift</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Personal info — read only for cashier */}
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4">Personal Information</h3>
            <div className="space-y-3">
              {[
                { label: 'Full Name',  value: displayName },
                { label: 'Email',      value: displayEmail },
                { label: 'Phone',      value: '+977-9841-000123' },
                { label: 'Store',      value: 'KTM-001 — Kathmandu' },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-xs text-[#94a3b8] mb-1">{f.label}</p>
                  <p className="text-sm font-medium text-[#0f172a]">{f.value}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#94a3b8] mt-4 pt-4 border-t" style={{ borderColor: '#e2e8f0' }}>
              To update your information, contact your Admin.
            </p>
          </div>

          {/* Preferences — NO Change PIN section (removed per requirements) */}
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4">Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#0f172a]">Receipt Sound</p>
                  <p className="text-xs text-[#94a3b8]">Play sound on transaction complete</p>
                </div>
                <Toggle checked={receiptSound} onChange={setReceiptSound} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#0f172a]">Low Stock Alerts</p>
                  <p className="text-xs text-[#94a3b8]">Show alerts for low inventory</p>
                </div>
                <Toggle checked={notifAlerts} onChange={setNotifAlerts} />
              </div>
            </div>
            {/* PIN management note — PIN is managed by Admin */}
            <div className="mt-5 pt-4 border-t" style={{ borderColor: '#e2e8f0' }}>
              <div className="rounded-lg p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <p className="text-xs font-medium text-[#0f172a] mb-1">PIN Management</p>
                <p className="text-xs text-[#94a3b8]">Your PIN is managed by the Admin. Contact your store administrator to reset it.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Shift History */}
        <div className="bg-white rounded-xl border p-5 mb-4" style={{ borderColor: '#e2e8f0' }}>
          <h3 className="text-sm font-semibold text-[#0f172a] mb-4">Shift History</h3>
          <table className="data-table">
            <thead><tr><th>Shift ID</th><th>Date</th><th>Hours</th><th>Transactions</th><th>Status</th></tr></thead>
            <tbody>
              {shiftHistory.map(s => (
                <tr key={s.id}>
                  <td><span className="mono text-xs font-medium">{s.id}</span></td>
                  <td className="text-sm">{s.date}</td>
                  <td className="text-sm text-[#475569]">{s.hours}</td>
                  <td className="text-sm font-semibold">{s.txns}</td>
                  <td>
                    {s.status
                      ? <span className="text-xs px-2 py-0.5 rounded bg-[#dcfce7] text-[#15803d] font-medium">{s.status}</span>
                      : <span className="text-xs text-[#94a3b8]">Closed</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
          <h3 className="text-sm font-semibold text-[#0f172a] mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0" style={{ borderColor: '#e2e8f0' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#1e3a5f] mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#0f172a]">{a.action}</p>
                  <p className="text-xs text-[#94a3b8]">{a.detail}</p>
                </div>
                <span className="text-xs font-mono text-[#94a3b8]">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CashierLayout>
  );
}
