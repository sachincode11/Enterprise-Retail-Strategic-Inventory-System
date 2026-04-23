// src/pages/admin/S6.jsx — Security / Access Control
import { useState } from 'react';
import { SettingsLayout } from './SettingsLayout';
import { Toggle } from '../../components/common';
import { saveSettings } from '../../services/settingsService';

function Row({ label, sub, children }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b last:border-0 hover:bg-[#f8fafc] transition-colors" style={{ borderColor: '#e2e8f0' }}>
      <div>
        <span className="text-sm font-medium text-[#0f172a] block">{label}</span>
        {sub && <span className="text-xs text-[#94a3b8]">{sub}</span>}
      </div>
      {children}
    </div>
  );
}

export default function S6() {
  const [pinVoids,   setPinVoids]   = useState(true);
  const [pinRefunds, setPinRefunds] = useState(true);
  const [twoFA,      setTwoFA]      = useState(true);
  const [autoLogout, setAutoLogout] = useState('30 minutes');
  const [logRetention, setLogRetention] = useState('90 days');
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await saveSettings({ requirePin: pinVoids, pinRefunds, twoFactor: twoFA });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SettingsLayout activeId="S6" onSave={handleSave}>
      <div className="px-6 py-4 border-b" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
        <h3 className="text-sm font-semibold text-[#0f172a]">Access Control</h3>
        <p className="text-xs text-[#94a3b8] mt-0.5">Manage authentication and authorization settings.</p>
        {saved && <p className="text-xs text-[#15803d] mt-1">Security settings saved.</p>}
      </div>
      <Row label="Admin Auto Logout" sub="Automatically log out inactive admin sessions">
        <select value={autoLogout} onChange={e => setAutoLogout(e.target.value)}
          className="px-3 py-1.5 rounded-lg border text-sm outline-none focus:border-[#1e3a5f]"
          style={{ borderColor: '#e2e8f0', minWidth: 160, color: '#475569' }}>
          <option>15 minutes</option><option>30 minutes</option><option>1 hour</option><option>Never</option>
        </select>
      </Row>
      <Row label="Require PIN for Voids" sub="Cashiers must enter supervisor PIN to void items">
        <Toggle checked={pinVoids} onChange={setPinVoids} />
      </Row>
      <Row label="Require PIN for Refunds" sub="Prevents unauthorized refund processing">
        <Toggle checked={pinRefunds} onChange={setPinRefunds} />
      </Row>
      <Row label="Two-Factor Auth for All Admins" sub="Email OTP required on every admin login">
        <Toggle checked={twoFA} onChange={setTwoFA} />
      </Row>
      <Row label="Audit Log Retention" sub="How long activity logs are retained">
        <select value={logRetention} onChange={e => setLogRetention(e.target.value)}
          className="px-3 py-1.5 rounded-lg border text-sm outline-none focus:border-[#1e3a5f]"
          style={{ borderColor: '#e2e8f0', minWidth: 160, color: '#475569' }}>
          <option>30 days</option><option>90 days</option><option>180 days</option><option>1 year</option>
        </select>
      </Row>
    </SettingsLayout>
  );
}
