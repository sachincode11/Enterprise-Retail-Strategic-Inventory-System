// src/pages/admin/S2.jsx — Store Details
import { SettingsLayout } from './SettingsLayout';
import { useSettings } from '../../hooks/useSettings';
import { LoadingSpinner } from '../../components/common';

function Row({ label, sub, children }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b last:border-0" style={{ borderColor: '#e2e8f0' }}>
      <div>
        <span className="text-sm font-medium text-[#0f172a] block">{label}</span>
        {sub && <span className="text-xs text-[#94a3b8]">{sub}</span>}
      </div>
      {children}
    </div>
  );
}

export default function S2() {
  const { settings, loading, saving, saved, update, save } = useSettings();
  if (loading) return <SettingsLayout activeId="S2"><LoadingSpinner /></SettingsLayout>;

  return (
    <SettingsLayout activeId="S2" onSave={() => save()}>
      <div className="px-6 py-4 border-b" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
        <h3 className="text-sm font-semibold text-[#0f172a]">Store Details</h3>
        <p className="text-xs mt-0.5 text-[#94a3b8]">Displayed on receipts and system-wide.</p>
        {saved && <p className="text-xs text-[#15803d] mt-1">Saved successfully.</p>}
      </div>
      <Row label="Store Name">
        <input className="input-field" value={settings.storeName} onChange={e => update('storeName', e.target.value)} style={{ width: 260 }} />
      </Row>
      <Row label="Store ID" sub="Read-only">
        <input className="input-field" value={settings.storeId} readOnly style={{ width: 260, color: '#94a3b8', background: '#f8fafc' }} />
      </Row>
      <Row label="Address">
        <input className="input-field" value={settings.address} onChange={e => update('address', e.target.value)} style={{ width: 300 }} />
      </Row>
      <Row label="Phone">
        <input className="input-field" value={settings.phone} onChange={e => update('phone', e.target.value)} style={{ width: 260 }} />
      </Row>
      <Row label="Business Hours">
        <input className="input-field" value={settings.businessHours} onChange={e => update('businessHours', e.target.value)} style={{ width: 200 }} />
      </Row>
      <Row label="Email">
        <input className="input-field" value={settings.email} onChange={e => update('email', e.target.value)} style={{ width: 260 }} />
      </Row>
      {saving && <p className="px-6 py-2 text-xs text-[#94a3b8]">Saving…</p>}
    </SettingsLayout>
  );
}
