// src/pages/cashier/S1General.jsx
import { useState } from 'react';
import CashierSettingsLayout from './CashierSettingsLayout';
import { Toggle } from '../../components/common';
import { saveSettings } from '../../services/settingsService';

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b last:border-0" style={{ borderColor: '#e2e8f0' }}>
      <span className="text-sm font-medium text-[#0f172a]">{label}</span>
      {children}
    </div>
  );
}

export default function S1General() {
  const [language,     setLanguage]     = useState('English (EN)');
  const [dateFormat,   setDateFormat]   = useState('DD/MM/YYYY');
  const [currency,     setCurrency]     = useState('Rs (NPR)');
  const [receiptFooter,setReceiptFooter]= useState('Thank you for shopping!');
  const [autoPrint,    setAutoPrint]    = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await saveSettings({ language, dateFormat, currency, receiptFooter, autoPrint });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <CashierSettingsLayout activeId="s1" onSave={handleSave}>
      <div className="px-6 py-4 border-b" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
        <h3 className="text-sm font-semibold text-[#0f172a]">General Settings</h3>
        <p className="text-xs text-[#94a3b8] mt-0.5">Display, language and regional preferences</p>
        {saved && <p className="text-xs text-[#15803d] mt-1">Saved successfully.</p>}
      </div>
      <Row label="Language">
        <select value={language} onChange={e => setLanguage(e.target.value)}
          className="px-3 py-1.5 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e8f0', minWidth: 180 }}>
          <option>English (EN)</option><option>Nepali (NE)</option>
        </select>
      </Row>
      <Row label="Date Format">
        <select value={dateFormat} onChange={e => setDateFormat(e.target.value)}
          className="px-3 py-1.5 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e8f0', minWidth: 180 }}>
          <option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option>
        </select>
      </Row>
      <Row label="Currency Symbol">
        <select value={currency} onChange={e => setCurrency(e.target.value)}
          className="px-3 py-1.5 rounded-lg border text-sm outline-none" style={{ borderColor: '#e2e8f0', minWidth: 180 }}>
          <option>Rs (NPR)</option><option>USD ($)</option>
        </select>
      </Row>
      <Row label="Receipt Footer">
        <input value={receiptFooter} onChange={e => setReceiptFooter(e.target.value)}
          className="input-field text-sm" style={{ width: 260 }} />
      </Row>
      <Row label="Auto-print Receipt">
        <Toggle checked={autoPrint} onChange={setAutoPrint} />
      </Row>
    </CashierSettingsLayout>
  );
}
