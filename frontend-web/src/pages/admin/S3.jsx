// src/pages/admin/S3.jsx — Tax & Billing
import { useState } from 'react';
import { SettingsLayout } from './SettingsLayout';
import { Toggle } from '../../components/common';

function Row({ label, sub, children }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b last:border-0" style={{ borderColor:'#e2e8f0' }}>
      <div>
        <span className="text-sm font-medium text-[#0f172a] block">{label}</span>
        {sub && <span className="text-xs text-[#94a3b8]">{sub}</span>}
      </div>
      {children}
    </div>
  );
}

export default function S3() {
  const [inclusive,      setInclusive]      = useState(false);
  const [printBreakdown, setPrintBreakdown] = useState(true);

  return (
    <SettingsLayout activeId="S3">
      <div className="px-6 py-4 border-b" style={{ borderColor:'#e2e8f0', background:'#f8fafc' }}>
        <h3 className="text-sm font-semibold text-[#0f172a]">Tax Configuration</h3>
      </div>
      <Row label="Default VAT Rate" sub="Applied to all taxable items"><input className="input-field" defaultValue="13%" style={{ width:160 }} /></Row>
      <Row label="Tax Registration Number"><input className="input-field" defaultValue="PAN-00112233" style={{ width:220 }} /></Row>
      <Row label="Tax Inclusive Pricing" sub="Prices include VAT by default"><Toggle checked={inclusive} onChange={setInclusive} /></Row>
      <Row label="Print Tax Breakdown on Receipt"><Toggle checked={printBreakdown} onChange={setPrintBreakdown} /></Row>
    </SettingsLayout>
  );
}
