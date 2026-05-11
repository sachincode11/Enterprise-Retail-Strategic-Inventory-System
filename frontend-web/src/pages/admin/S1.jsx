// src/pages/admin/S1.jsx — General: Language fixed to English, Currency NPR, Timezone Nepal
import { SettingsLayout } from './SettingsLayout';
import { useSettings } from '../../hooks/useSettings';
import { LoadingSpinner } from '../../components/common';
import { formatDate } from '../../utils/format';
import { useApp } from '../../context/AppContext';

function Row({ label, sub, children }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b last:border-0" style={{ borderColor: '#e2e8f0' }}>
      <div>
        <span className="text-sm font-medium text-[#0f172a]">{label}</span>
        {sub && <p className="text-xs text-[#94a3b8] mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function ReadOnly({ value }) {
  return (
    <span className="px-3 py-1.5 rounded-lg text-sm border" style={{ borderColor: '#e2e8f0', background: '#f8fafc', color: '#475569', minWidth: 200, display: 'inline-block', textAlign: 'right' }}>
      {value}
    </span>
  );
}

export default function S1() {
  const { settings, loading, saving, saved, update, save } = useSettings();
  const { refreshSettings } = useApp();
  
  if (loading || !settings) return <SettingsLayout activeId="S1"><LoadingSpinner /></SettingsLayout>;

  const handleSave = async () => {
    await save();
    await refreshSettings();
  };

  return (
    <SettingsLayout activeId="S1" onSave={handleSave}>
      <div className="px-6 py-4 border-b" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
        <h3 className="text-sm font-semibold text-[#0f172a]">Display & Appearance</h3>
        <p className="text-xs text-[#94a3b8] mt-0.5">Regional settings for Kathmandu Main Store</p>
        {saved && <p className="text-xs text-[#15803d] mt-1">Settings saved.</p>}
      </div>

      {/* Language: ONLY English */}
      <Row label="Language" sub="System language — English only">
        <ReadOnly value="English (EN)" />
      </Row>

      {/* Date Format: editable */}
      <Row label="Date Format" sub={`Preview: ${formatDate(new Date(), settings?.dateFormat)}`}>
        <select value={settings?.dateFormat || ''} onChange={e => update('dateFormat', e.target.value)}
          className="px-3 py-1.5 rounded-lg border text-sm outline-none focus:border-[#1e3a5f]"
          style={{ borderColor: '#e2e8f0', minWidth: 200, background: '#f8fafc' }}>
          <option value="DD/MM/YYYY">{formatDate(new Date(), 'DD/MM/YYYY')} (DD/MM/YYYY)</option>
          <option value="MM/DD/YYYY">{formatDate(new Date(), 'MM/DD/YYYY')} (MM/DD/YYYY)</option>
          <option value="YYYY-MM-DD">{formatDate(new Date(), 'YYYY-MM-DD')} (YYYY-MM-DD)</option>
          <option value="DD MMM, YYYY">{formatDate(new Date(), 'DD MMM, YYYY')} (DD MMM, YYYY)</option>
        </select>
      </Row>

      {/* Theme: editable */}
      <Row label="Theme">
        <select value={settings?.theme || 'Light'} onChange={e => update('theme', e.target.value)}
          className="px-3 py-1.5 rounded-lg border text-sm outline-none focus:border-[#1e3a5f]"
          style={{ borderColor: '#e2e8f0', minWidth: 200, background: '#f8fafc' }}>
          <option>Light</option><option>Dark</option><option>System</option>
        </select>
      </Row>

      {/* Currency: editable (NPR for now) */}
      <Row label="Currency" sub="Nepali Rupee (NPR) — fixed for this store">
        <select value={settings?.currency || ''} onChange={e => update('currency', e.target.value)}
          className="px-3 py-1.5 rounded-lg border text-sm outline-none focus:border-[#1e3a5f]"
          style={{ borderColor: '#e2e8f0', minWidth: 200, background: '#f8fafc' }}>
          <option value="Rs (NPR)">Rs (NPR)</option>
        </select>
      </Row>

      {/* Timezone: fixed to Nepal */}
      <Row label="Timezone" sub="Nepal Standard Time — fixed (UTC+5:45)">
        <ReadOnly value="Asia/Kathmandu (UTC+5:45)" />
      </Row>

      {saving && <p className="px-6 py-2 text-xs text-[#94a3b8]">Saving…</p>}
    </SettingsLayout>
  );
}
