// src/pages/admin/S3.jsx — Tax & Billing
import { SettingsLayout } from './SettingsLayout';
import { Toggle, LoadingSpinner } from '../../components/common';
import { useSettings } from '../../hooks/useSettings';

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

export default function S3() {
  const { settings, loading, saving, saved, update, save } = useSettings();
  if (loading) return <SettingsLayout activeId="S3"><LoadingSpinner /></SettingsLayout>;

  return (
    <SettingsLayout activeId="S3" onSave={() => save()}>
      <div className="px-6 py-4 border-b" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
        <h3 className="text-sm font-semibold text-[#0f172a]">Tax Configuration</h3>
        {saved && <p className="text-xs text-[#15803d] mt-1">Saved successfully.</p>}
      </div>
      <Row label="Default VAT Rate" sub="Applied to all taxable items">
        <input className="input-field" defaultValue="13%" style={{ width: 160 }} />
      </Row>
      <Row label="Tax Registration Number">
        <input className="input-field" defaultValue="PAN-00112233" style={{ width: 220 }} />
      </Row>
      <Row label="Tax Inclusive Pricing" sub="Prices include VAT by default">
        <Toggle checked={settings.taxInclusive ?? false} onChange={v => update('taxInclusive', v)} />
      </Row>
      <Row label="Print Tax Breakdown on Receipt">
        <Toggle checked={settings.printTaxBreakdown ?? true} onChange={v => update('printTaxBreakdown', v)} />
      </Row>
      {saving && <p className="px-6 py-2 text-xs text-[#94a3b8]">Saving…</p>}
    </SettingsLayout>
  );
}
