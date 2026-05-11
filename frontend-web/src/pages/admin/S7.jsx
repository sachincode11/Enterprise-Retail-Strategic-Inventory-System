// src/pages/admin/S7.jsx — Integrations
import { SettingsLayout } from './SettingsLayout';
import { integrations } from '../../data/mockData';

const statusColors = {
  Connected: { bg: '#dcfce7', text: '#15803d' },
  Healthy:   { bg: '#dcfce7', text: '#15803d' },
  Active:    { bg: '#dbeafe', text: '#1d4ed8' },
  Online:    { bg: '#f3f4f6', text: '#374151' },
};

export default function S7() {
  return (
    <SettingsLayout activeId="S7" onSave={() => {}}>
      <div className="px-6 py-4 border-b" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
        <h3 className="text-sm font-semibold text-[#0f172a]">Connected Integrations</h3>
      </div>
      {integrations.map((item, i) => {
        const colors = statusColors[item.status] || { bg: '#f3f4f6', text: '#374151' };
        return (
          <div key={i} className="flex items-center justify-between px-6 py-4 border-b last:border-0 hover:bg-[#f8fafc] transition-colors" style={{ borderColor: '#e2e8f0' }}>
            <div>
              <p className="text-sm font-semibold text-[#0f172a]">{item.name}</p>
              <p className="text-xs mt-0.5 text-[#94a3b8]">{item.desc}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: colors.bg, color: colors.text }}>{item.status}</span>
              {item.action && <button className="btn-outline">{item.action}</button>}
            </div>
          </div>
        );
      })}
    </SettingsLayout>
  );
}
