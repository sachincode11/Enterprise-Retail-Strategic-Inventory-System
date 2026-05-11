import { useState, useEffect } from 'react';
import CashierSettingsLayout from './CashierSettingsLayout';
import { apiRequest } from '../../services/apiClient';

function SignalBar({ value }) {
  return (
    <div className="flex items-end gap-0.5">
      {[25,50,75,100].map(threshold => (
        <div key={threshold} className="w-1.5 rounded-sm" style={{ height: threshold/25*8 + 'px', background: value >= threshold ? '#22c55e' : '#e2e8f0' }} />
      ))}
    </div>
  );
}

export default function S3IoTDevices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    try {
      const res = await apiRequest('/iot/health');
      // Format backend registry to UI shape
      const mapped = res.registered_devices.map(d => ({
        name: d.device_id.includes('SCANNER') ? 'ESP32 Barcode Scanner' : 'IoT Device',
        id: d.device_id,
        status: d.status || 'Connected',
        last: new Date(d.last_seen).toLocaleTimeString(),
        signal: d.rssi ? Math.min(100, Math.max(0, (d.rssi + 100) * 2)) : 0, // Mock RSSI to % mapping
        scans: d.scans || 0,
        ip: d.ip_address || 'Unknown'
      }));
      setDevices(mapped);
    } catch (err) {
      console.error('Failed to fetch IoT health:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <CashierSettingsLayout activeId="s3">
      <div className="px-6 py-4 border-b flex justify-between items-center" style={{ borderColor:'#e2e8f0', background:'#f8fafc' }}>
        <div>
          <h3 className="text-sm font-semibold text-[#0f172a]">IoT Devices</h3>
          <p className="text-xs text-[#94a3b8] mt-0.5">Manage connected hardware and peripherals</p>
        </div>
        <button onClick={fetchDevices} className="text-[10px] font-bold text-[#1e3a5f] hover:underline">
          {loading ? 'Refreshing...' : 'Refresh Now'}
        </button>
      </div>

      {devices.length === 0 && !loading && (
        <div className="p-12 text-center">
          <p className="text-sm text-[#94a3b8]">No IoT devices registered yet.</p>
          <p className="text-xs text-[#cbd5e1] mt-1">Ensure your ESP32 is connected to WiFi and configured correctly.</p>
        </div>
      )}

      {devices.map((d, i) => (
        <div key={i} className="flex items-center justify-between px-6 py-4 border-b last:border-0 hover:bg-[#f8fafc] transition-colors" style={{ borderColor:'#e2e8f0' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: d.status === 'Connected' ? '#dcfce7' : '#f3f4f6' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={d.status==='Connected'?'#15803d':'#94a3b8'} strokeWidth="1.5">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0f172a]">{d.name}</p>
              <p className="text-xs text-[#94a3b8] font-mono">{d.id} · IP: {d.ip} · Last: {d.last}</p>
              {d.scans > 0 && <p className="text-[9px] font-bold text-[#1e3a5f] uppercase tracking-tighter mt-0.5">Total Scans: {d.scans}</p>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <SignalBar value={d.signal} />
            <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: d.status==='Connected'?'#dcfce7':'#f3f4f6', color: d.status==='Connected'?'#15803d':'#6b7280' }}>
              {d.status}
            </span>
            <button className="btn-outline text-xs">Configure</button>
          </div>
        </div>
      ))}

      <div className="px-6 py-4">
        <button className="btn-secondary text-xs flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="6" r="5"/><path d="M6 3v6M3 6h6" strokeLinecap="round"/></svg>
          Scan for New Devices
        </button>
      </div>
    </CashierSettingsLayout>
  );
}
