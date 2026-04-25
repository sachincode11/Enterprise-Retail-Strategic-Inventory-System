// src/pages/admin/S4.jsx — Roles & Permissions (Floor Manager removed)
import { useState } from 'react';
import { SettingsLayout } from './SettingsLayout';
import { Toggle } from '../../components/common';
import { saveSettings } from '../../services/settingsService';

const permissions = [
  { id: 'refunds',       label: 'Cashier — Can process refunds',     sub: 'Requires PIN verification',       default: true  },
  { id: 'discounts',     label: 'Cashier — Can apply discounts',      sub: 'Up to max discount % in billing',  default: true  },
  { id: 'voids',         label: 'Cashier — Can void transactions',    sub: 'Requires supervisor PIN',          default: true  },
  { id: 'holdTxn',       label: 'Cashier — Can hold transactions',    sub: null,                               default: true  },
  { id: 'viewReports',   label: 'Cashier — Can view own shift report', sub: null,                              default: false },
  { id: 'editSettings',  label: 'Cashier — Can edit POS settings',    sub: 'Theme/auto-print only',            default: false },
];

// ROLES: Admin and Cashier only — Floor Manager removed
const ROLES = [
  { id: 'admin',   name: 'Admin',   color: '#1e3a5f', badge: '#eff6ff', description: 'Full system access — inventory, staff, reports, settings' },
  { id: 'cashier', name: 'Cashier', color: '#475569', badge: '#f1f5f9', description: 'POS billing, transactions, shift management' },
];

export default function S4() {
  const [perms, setPerms] = useState(Object.fromEntries(permissions.map(p => [p.id, p.default])));
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await saveSettings({ permissions: perms });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SettingsLayout activeId="S4" onSave={handleSave}>
      <div className="px-6 py-4 border-b" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
        <h3 className="text-sm font-semibold text-[#0f172a]">Roles & Permissions</h3>
        <p className="text-xs mt-0.5 text-[#94a3b8]">System has two roles: Admin and Cashier. Control cashier permissions below.</p>
        {saved && <p className="text-xs text-[#15803d] mt-1">Permissions saved.</p>}
      </div>

      {/* Role overview cards */}
      <div className="px-6 py-5 border-b grid grid-cols-2 gap-3" style={{ borderColor: '#e2e8f0' }}>
        {ROLES.map(role => (
          <div key={role.id} className="rounded-xl p-4 border" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: role.badge, color: role.color }}>
                {role.name}
              </span>
            </div>
            <p className="text-xs text-[#475569]">{role.description}</p>
          </div>
        ))}
      </div>

      <div className="px-6 py-4 border-b" style={{ borderColor: '#e2e8f0', background: '#fff' }}>
        <p className="text-xs font-semibold text-[#0f172a] uppercase tracking-widest font-mono">Cashier Permissions</p>
      </div>

      {permissions.map(p => (
        <div key={p.id} className="flex items-center justify-between px-6 py-4 border-b last:border-0" style={{ borderColor: '#e2e8f0' }}>
          <div>
            <span className="text-sm font-medium text-[#0f172a] block">{p.label}</span>
            {p.sub && <span className="text-xs text-[#94a3b8]">{p.sub}</span>}
          </div>
          <Toggle checked={perms[p.id]} onChange={val => setPerms(prev => ({ ...prev, [p.id]: val }))} />
        </div>
      ))}
    </SettingsLayout>
  );
}
