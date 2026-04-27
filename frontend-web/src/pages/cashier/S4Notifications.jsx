// src/pages/cashier/S4Notifications.jsx — IMPROVED: persists via localStorage
import { useState, useEffect } from 'react';
import CashierSettingsLayout from './CashierSettingsLayout';
import { Toggle } from '../../components/common';
import { lsGet, lsSet } from '../../utils/storage';

const alertOptions = [
  { id: 'low_stock',    label: 'Low Stock Alerts',          sub: 'Notify when product stock falls below threshold', default: true  },
  { id: 'txn_complete', label: 'Transaction Complete Sound', sub: 'Beep on successful payment',                     default: true  },
  { id: 'refund_alert', label: 'Refund Notifications',      sub: 'Alert when a refund is processed',               default: true  },
  { id: 'shift_end',    label: 'Shift End Reminder',        sub: 'Remind 15 minutes before shift ends',            default: false },
  { id: 'new_customer', label: 'New Customer Registration',  sub: 'Alert when a new customer is added',            default: false },
];

const LS_KEY = 'invosix_cashier_notifications';
const DEFAULTS = Object.fromEntries(alertOptions.map(a => [a.id, a.default]));

export default function S4Notifications() {
  const [states, setStates] = useState(() => lsGet(LS_KEY, DEFAULTS));
  const [saved,  setSaved]  = useState(false);

  const toggle = (id, val) => {
    const next = { ...states, [id]: val };
    setStates(next);
    lsSet(LS_KEY, next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <CashierSettingsLayout activeId="s4">
      <div className="px-6 py-4 border-b" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
        <h3 className="text-sm font-semibold text-[#0f172a]">Notifications</h3>
        <p className="text-xs text-[#94a3b8] mt-0.5">Control which alerts are shown during your shift</p>
        {saved && <p className="text-xs text-[#15803d] mt-1">Preferences saved.</p>}
      </div>
      {alertOptions.map(a => (
        <div key={a.id} className="flex items-center justify-between px-6 py-4 border-b last:border-0" style={{ borderColor: '#e2e8f0' }}>
          <div>
            <span className="text-sm font-medium text-[#0f172a] block">{a.label}</span>
            <span className="text-xs text-[#94a3b8]">{a.sub}</span>
          </div>
          <Toggle checked={states[a.id]} onChange={val => toggle(a.id, val)} />
        </div>
      ))}
    </CashierSettingsLayout>
  );
}
