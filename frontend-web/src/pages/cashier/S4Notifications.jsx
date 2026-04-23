// src/pages/cashier/S4Notifications.jsx
import { useState } from 'react';
import CashierSettingsLayout from './CashierSettingsLayout';
import { Toggle } from '../../components/common';

const alertOptions = [
  { id:'low_stock',     label:'Low Stock Alerts',         sub:'Notify when product stock falls below threshold', default:true  },
  { id:'txn_complete',  label:'Transaction Complete Sound',sub:'Beep on successful payment',                     default:true  },
  { id:'refund_alert',  label:'Refund Notifications',     sub:'Alert when a refund is processed',               default:true  },
  { id:'shift_end',     label:'Shift End Reminder',       sub:'Remind 15 minutes before shift ends',            default:false },
  { id:'new_customer',  label:'New Customer Registration',sub:'Alert when a new customer is added',             default:false },
];

export default function S4Notifications() {
  const [states, setStates] = useState(
    Object.fromEntries(alertOptions.map(a => [a.id, a.default]))
  );

  return (
    <CashierSettingsLayout activeId="s4">
      <div className="px-6 py-4 border-b" style={{ borderColor:'#e2e8f0', background:'#f8fafc' }}>
        <h3 className="text-sm font-semibold text-[#0f172a]">Notifications</h3>
        <p className="text-xs text-[#94a3b8] mt-0.5">Control which alerts are shown during your shift</p>
      </div>

      {alertOptions.map(a => (
        <div key={a.id} className="flex items-center justify-between px-6 py-4 border-b last:border-0" style={{ borderColor:'#e2e8f0' }}>
          <div>
            <span className="text-sm font-medium text-[#0f172a] block">{a.label}</span>
            <span className="text-xs text-[#94a3b8]">{a.sub}</span>
          </div>
          <Toggle
            checked={states[a.id]}
            onChange={val => setStates(prev => ({ ...prev, [a.id]: val }))}
          />
        </div>
      ))}
    </CashierSettingsLayout>
  );
}
