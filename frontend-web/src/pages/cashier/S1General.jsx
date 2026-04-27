// src/pages/cashier/S1General.jsx — IMPROVED: cashier can ONLY change theme/auto-print; everything else locked
import { useState, useEffect } from 'react';
import CashierSettingsLayout from './CashierSettingsLayout';
import { Toggle } from '../../components/common';
import { getSettings, saveSettings } from '../../services/settingsService';

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b last:border-0" style={{ borderColor: '#e2e8f0' }}>
      <span className="text-sm font-medium text-[#0f172a]">{label}</span>
      {children}
    </div>
  );
}

function LockedField({ value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="px-3 py-1.5 rounded-lg text-sm border text-[#94a3b8]"
        style={{ borderColor: '#e2e8f0', background: '#f8fafc', minWidth: 180, display: 'inline-block', textAlign: 'right' }}>
        {value}
      </span>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#94a3b8" strokeWidth="1.5">
        <rect x="3" y="6" width="8" height="6" rx="1"/><path d="M5 6V4a2 2 0 014 0v2"/>
      </svg>
    </div>
  );
}

export default function S1General() {
  const [autoPrint, setAutoPrint] = useState(true);
  const [theme, setTheme]         = useState('Light');
  const [saved, setSaved]         = useState(false);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    getSettings().then(res => {
      setAutoPrint(res.data.autoPrint ?? true);
      setTheme(res.data.theme || 'Light');
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    await saveSettings({ autoPrint, theme });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <CashierSettingsLayout activeId="s1"><div className="p-8 text-sm text-[#94a3b8]">Loading…</div></CashierSettingsLayout>;

  return (
    <CashierSettingsLayout activeId="s1" onSave={handleSave}>
      <div className="px-6 py-4 border-b" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
        <h3 className="text-sm font-semibold text-[#0f172a]">General Settings</h3>
        <p className="text-xs text-[#94a3b8] mt-0.5">You can change theme and auto-print. Other settings are managed by Admin.</p>
        {saved && <p className="text-xs text-[#15803d] mt-1">Preferences saved.</p>}
      </div>

      {/* Locked fields — visible but non-editable */}
      <Row label="Language">
        <LockedField value="English (EN)" />
      </Row>
      <Row label="Date Format">
        <LockedField value="DD/MM/YYYY" />
      </Row>
      <Row label="Currency Symbol">
        <LockedField value="Rs (NPR)" />
      </Row>

      {/* Editable: Theme */}
      <Row label="Theme">
        <select value={theme} onChange={e => setTheme(e.target.value)}
          className="px-3 py-1.5 rounded-lg border text-sm outline-none focus:border-[#1e3a5f]"
          style={{ borderColor: '#e2e8f0', minWidth: 180, background: '#f8fafc' }}>
          <option>Light</option><option>Dark</option>
        </select>
      </Row>

      {/* Editable: Auto-print */}
      <Row label="Auto-print Receipt">
        <Toggle checked={autoPrint} onChange={setAutoPrint} />
      </Row>
    </CashierSettingsLayout>
  );
}
