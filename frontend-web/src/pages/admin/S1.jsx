// src/pages/admin/S1.jsx — General > Display & Appearance
import { SettingsLayout } from './SettingsLayout';
import { useSettings } from '../../hooks/useSettings';
import { LoadingSpinner } from '../../components/common';

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b last:border-0" style={{ borderColor: '#e2e8f0' }}>
      <span className="text-sm font-medium text-[#0f172a]">{label}</span>
      {children}
    </div>
  );
}
function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="px-3 py-1.5 rounded-lg border text-sm outline-none focus:border-[#1e3a5f] transition-all"
      style={{ borderColor: '#e2e8f0', minWidth: 200, color: '#0f172a', background: '#f8fafc' }}>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );
}

export default function S1() {
  const { settings, loading, saving, saved, update, save } = useSettings();
  if (loading) return <SettingsLayout activeId="S1"><LoadingSpinner /></SettingsLayout>;

  return (
    <SettingsLayout activeId="S1" onSave={() => save()}>
      <div className="px-6 py-4 border-b" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
        <h3 className="text-sm font-semibold text-[#0f172a]">Display & Appearance</h3>
        {saved && <p className="text-xs text-[#15803d] mt-1">Settings saved successfully.</p>}
      </div>
      <Row label="Language">
        <Select value={settings.language} onChange={v => update('language', v)} options={['English (EN)', 'Nepali (NE)']} />
      </Row>
      <Row label="Date Format">
        <Select value={settings.dateFormat} onChange={v => update('dateFormat', v)} options={['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']} />
      </Row>
      <Row label="Theme">
        <Select value={settings.theme} onChange={v => update('theme', v)} options={['Light', 'Dark', 'System']} />
      </Row>
      <Row label="Currency Symbol">
        <Select value={settings.currency} onChange={v => update('currency', v)} options={['Rs (NPR)', 'USD ($)', 'EUR (€)']} />
      </Row>
      <Row label="Timezone">
        <Select value={settings.timezone} onChange={v => update('timezone', v)} options={['Asia/Kathmandu (UTC+5:45)', 'Asia/Kolkata (UTC+5:30)', 'UTC']} />
      </Row>
      {saving && <p className="px-6 py-2 text-xs text-[#94a3b8]">Saving…</p>}
    </SettingsLayout>
  );
}
