// src/pages/admin/S4.jsx — Roles & Permissions
import { useState } from 'react';
import { SettingsLayout } from './SettingsLayout';
import { Toggle } from '../../components/common';

const permissions = [
  { id:'refunds',   label:'Cashier — Can process refunds',    sub: null,                         default: true  },
  { id:'discounts', label:'Cashier — Can apply discounts',    sub: null,                         default: true  },
  { id:'voids',     label:'Cashier — Can void transactions',  sub:'Requires supervisor PIN',     default: true  },
  { id:'reports',   label:'Cashier — Can view reports',       sub: null,                         default: false },
  { id:'inventory', label:'Floor Mgr — Can adjust inventory', sub: null,                         default: true  },
];

export default function S4() {
  const [perms, setPerms] = useState(Object.fromEntries(permissions.map(p => [p.id, p.default])));

  return (
    <SettingsLayout activeId="S4">
      <div className="px-6 py-4 border-b" style={{ borderColor:'#e2e8f0', background:'#f8fafc' }}>
        <h3 className="text-sm font-semibold text-[#0f172a]">Role Permissions</h3>
        <p className="text-xs mt-0.5 text-[#94a3b8]">Control what each role can access.</p>
      </div>
      {permissions.map(p => (
        <div key={p.id} className="flex items-center justify-between px-6 py-4 border-b last:border-0" style={{ borderColor:'#e2e8f0' }}>
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
