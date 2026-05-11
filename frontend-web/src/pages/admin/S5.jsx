// src/pages/admin/S5.jsx — Admin Alerts / Notifications
import { LoadingSpinner, Toggle } from '../../components/common';
import { SettingsLayout } from './SettingsLayout';
import { useSettings } from '../../hooks/useSettings';
import { useApp } from '../../context/AppContext';

const alerts = [
  { id: 'daily_revenue', label: 'Daily Revenue Summary Email',  sub: null,                                   default: true  },
  { id: 'low_stock',     label: 'Low Stock Alerts',             sub: null,                                   default: true  },
  { id: 'large_refund',  label: 'Large Refund Notifications',   sub: 'Refunds above Rs 1,000',               default: true  },
  { id: 'new_customer',  label: 'New Customer Registrations',   sub: null,                                   default: false },
  { id: 'ai_forecast',   label: 'AI Forecast Ready',            sub: 'Notify when new forecast is generated', default: true  },
];

export default function S5() {
  const { settings, loading, saving, saved, update, save } = useSettings();
  const { refreshSettings } = useApp();

  if (loading || !settings) return <SettingsLayout activeId="S5"><LoadingSpinner /></SettingsLayout>;

  const handleSave = async () => {
    await save();
    await refreshSettings();
  };

  const states = settings?.notifications || Object.fromEntries(alerts.map(a => [a.id, a.default]));

  const toggleAlert = (id, val) => {
    update('notifications', { ...states, [id]: val });
  };

  return (
    <SettingsLayout activeId="S5" onSave={handleSave}>
      <div className="px-6 py-4 border-b" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
        <h3 className="text-sm font-semibold text-[#0f172a]">Admin Alerts</h3>
        <p className="text-xs mt-0.5 text-[#94a3b8]">Configure which system alerts you want to receive.</p>
        {saved && <p className="text-xs text-[#15803d] mt-1">Notification preferences saved.</p>}
      </div>
      {alerts.map(a => (
        <div key={a.id} className="flex items-center justify-between px-6 py-4 border-b last:border-0" style={{ borderColor: '#e2e8f0' }}>
          <div>
            <span className="text-sm font-medium text-[#0f172a] block">{a.label}</span>
            {a.sub && <span className="text-xs text-[#94a3b8]">{a.sub}</span>}
          </div>
          <Toggle checked={!!states[a.id]} onChange={val => toggleAlert(a.id, val)} />
        </div>
      ))}
      {saving && <p className="px-6 py-2 text-xs text-[#94a3b8]">Saving…</p>}
    </SettingsLayout>
  );
}
