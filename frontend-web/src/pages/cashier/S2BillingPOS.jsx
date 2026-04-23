// src/pages/cashier/S2BillingPOS.jsx
import { useState } from 'react';
import CashierSettingsLayout from './CashierSettingsLayout';
import { Toggle } from '../../components/common';

export default function S2BillingPOS() {
  const [quickKeys,    setQuickKeys]    = useState(true);
  const [barcodeSound, setBarcodeSound] = useState(true);
  const [holdTxn,      setHoldTxn]      = useState(true);

  return (
    <CashierSettingsLayout activeId="s2">
      <div className="px-6 py-4 border-b" style={{ borderColor:'#e2e8f0', background:'#f8fafc' }}>
        <h3 className="text-sm font-semibold text-[#0f172a]">Billing & POS</h3>
        <p className="text-xs text-[#94a3b8] mt-0.5">Configure POS behaviour and payment options</p>
      </div>

      {/* Default payment */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor:'#e2e8f0' }}>
        <span className="text-sm font-medium text-[#0f172a]">Default Payment Method</span>
        <select className="input-field text-sm" style={{ width:180 }} defaultValue="Cash">
          <option>Cash</option><option>Card</option><option>Wallet</option>
        </select>
      </div>

      {/* Tax rate */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor:'#e2e8f0' }}>
        <div>
          <span className="text-sm font-medium text-[#0f172a] block">Default Tax Rate</span>
          <span className="text-xs text-[#94a3b8]">Applied automatically to all items</span>
        </div>
        <input className="input-field text-sm" defaultValue="13%" style={{ width:120 }} />
      </div>

      {/* Discount limit */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor:'#e2e8f0' }}>
        <div>
          <span className="text-sm font-medium text-[#0f172a] block">Max Cashier Discount</span>
          <span className="text-xs text-[#94a3b8]">Maximum discount % a cashier can apply</span>
        </div>
        <input className="input-field text-sm" defaultValue="10%" style={{ width:120 }} />
      </div>

      {/* Toggles */}
      {[
        { label:'Quick-key Product Buttons',  sub:'Show shortcut buttons for top products', state:quickKeys,    set:setQuickKeys    },
        { label:'Barcode Scan Sound',         sub:'Play beep when a product is scanned',    state:barcodeSound, set:setBarcodeSound },
        { label:'Allow Hold Transactions',    sub:'Cashier can park a transaction on hold', state:holdTxn,      set:setHoldTxn      },
      ].map(item => (
        <div key={item.label} className="flex items-center justify-between px-6 py-4 border-b last:border-0" style={{ borderColor:'#e2e8f0' }}>
          <div>
            <span className="text-sm font-medium text-[#0f172a] block">{item.label}</span>
            <span className="text-xs text-[#94a3b8]">{item.sub}</span>
          </div>
          <Toggle checked={item.state} onChange={item.set} />
        </div>
      ))}
    </CashierSettingsLayout>
  );
}
