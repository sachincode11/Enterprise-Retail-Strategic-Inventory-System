// src/pages/cashier/S2BillingPOS.jsx
// REMOVED: Payment, Transaction, Cash Drawer, and Sound settings as per requirements.
// KEPT: Quick Keys, Barcode Scan Sound toggle renamed, Hold Transactions.
import { useState } from 'react';
import CashierSettingsLayout from './CashierSettingsLayout';
import { Toggle } from '../../components/common';
import { saveSettings } from '../../services/settingsService';

export default function S2BillingPOS() {
  const [quickKeys,      setQuickKeys]      = useState(true);
  const [holdTxn,        setHoldTxn]        = useState(true);
  const [requireCustomer,setRequireCustomer] = useState(false);
  const [taxRate,        setTaxRate]        = useState('13');
  const [maxDiscount,    setMaxDiscount]    = useState('10');
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await saveSettings({ quickKeys, holdTransactions: holdTxn, requireCustomer, taxRate, maxDiscount });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <CashierSettingsLayout activeId="s2" onSave={handleSave}>
      <div className="px-6 py-4 border-b" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
        <h3 className="text-sm font-semibold text-[#0f172a]">Billing & POS</h3>
        <p className="text-xs text-[#94a3b8] mt-0.5">Configure POS behaviour and checkout options</p>
        {saved && <p className="text-xs text-[#15803d] mt-1">Saved successfully.</p>}
      </div>

      {/* Tax rate */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#e2e8f0' }}>
        <div>
          <span className="text-sm font-medium text-[#0f172a] block">Default Tax Rate (%)</span>
          <span className="text-xs text-[#94a3b8]">Applied automatically to all items</span>
        </div>
        <input value={taxRate} onChange={e => setTaxRate(e.target.value)} className="input-field text-sm" style={{ width: 120 }} />
      </div>

      {/* Max discount */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#e2e8f0' }}>
        <div>
          <span className="text-sm font-medium text-[#0f172a] block">Max Cashier Discount (%)</span>
          <span className="text-xs text-[#94a3b8]">Maximum discount a cashier can apply</span>
        </div>
        <input value={maxDiscount} onChange={e => setMaxDiscount(e.target.value)} className="input-field text-sm" style={{ width: 120 }} />
      </div>

      {/* Toggles — Payment/Transaction/Cash Drawer/Sound removed */}
      {[
        { label: 'Quick-key Product Buttons',  sub: 'Show shortcut buttons for top products',      state: quickKeys,       set: setQuickKeys       },
        { label: 'Allow Hold Transactions',    sub: 'Cashier can park a transaction on hold',      state: holdTxn,         set: setHoldTxn         },
        { label: 'Require Customer Selection', sub: 'Force cashier to select a customer per sale', state: requireCustomer, set: setRequireCustomer },
      ].map(item => (
        <div key={item.label} className="flex items-center justify-between px-6 py-4 border-b last:border-0" style={{ borderColor: '#e2e8f0' }}>
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
