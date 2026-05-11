// src/pages/cashier/S3IoTDevices.jsx
// IoT Device Management — ESP32 GM67 Barcode Scanner integration
import { useState, useEffect, useCallback, useRef } from 'react';
import CashierSettingsLayout from './CashierSettingsLayout';
import { apiRequest } from '../../services/apiClient';

// ─── Constants ────────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS   = 10_000;   // refresh device list every 10 s
const STALE_THRESHOLD_MS = 45_000;   // device is "offline" if no ping in 45 s

// ─── Helpers ─────────────────────────────────────────────────────────────────
function rssiToPercent(rssi) {
  if (!rssi || rssi === 0) return 0;
  // RSSI range: -100 dBm (worst) → -40 dBm (best) → clamp to 0–100 %
  return Math.min(100, Math.max(0, ((rssi + 100) / 60) * 100));
}

function rssiLabel(rssi) {
  if (!rssi || rssi === 0) return 'No Signal';
  if (rssi >= -55) return 'Excellent';
  if (rssi >= -67) return 'Good';
  if (rssi >= -78) return 'Fair';
  return 'Weak';
}

function rssiColor(rssi) {
  if (!rssi || rssi === 0) return '#94a3b8';
  if (rssi >= -55) return '#22c55e';
  if (rssi >= -67) return '#84cc16';
  if (rssi >= -78) return '#eab308';
  return '#ef4444';
}

function formatAge(isoString) {
  if (!isoString) return 'Never';
  const age = Math.round((Date.now() - new Date(isoString).getTime()) / 1000);
  if (age < 60)  return `${age}s ago`;
  if (age < 3600) return `${Math.floor(age / 60)}m ago`;
  return `${Math.floor(age / 3600)}h ago`;
}

function deviceOnline(device) {
  if (!device.last_seen) return false;
  return (Date.now() - new Date(device.last_seen).getTime()) < STALE_THRESHOLD_MS;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SignalBars({ rssi }) {
  const pct   = rssiToPercent(rssi);
  const color  = rssiColor(rssi);
  const bars   = [25, 50, 75, 100];
  return (
    <div className="flex items-end gap-[3px]" title={`RSSI: ${rssi || 'N/A'} dBm`}>
      {bars.map((threshold, i) => (
        <div
          key={threshold}
          className="w-1.5 rounded-sm transition-all"
          style={{
            height: `${(i + 1) * 5 + 3}px`,
            background: pct >= threshold ? color : '#e2e8f0',
          }}
        />
      ))}
    </div>
  );
}

function StatusBadge({ online }) {
  return (
    <span
      className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5"
      style={{
        background: online ? '#dcfce7' : '#f3f4f6',
        color:      online ? '#15803d' : '#6b7280',
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full inline-block"
        style={{
          background: online ? '#22c55e' : '#9ca3af',
          animation:  online ? 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' : 'none',
        }}
      />
      {online ? 'Online' : 'Offline'}
    </span>
  );
}

function DeviceIcon({ online }) {
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: online ? '#f0fdf4' : '#f8fafc', border: `1.5px solid ${online ? '#bbf7d0' : '#e2e8f0'}` }}
    >
      {/* Barcode scanner icon */}
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={online ? '#16a34a' : '#94a3b8'} strokeWidth="1.75" strokeLinecap="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <line x1="7"  y1="9"  x2="7"  y2="15" />
        <line x1="10" y1="9"  x2="10" y2="15" />
        <line x1="13" y1="9"  x2="13" y2="15" />
        <line x1="17" y1="9"  x2="17" y2="15" />
      </svg>
    </div>
  );
}

function ConfigureModal({ device, onClose }) {
  if (!device) return null;
  const online  = deviceOnline(device);
  const signal  = rssiToPercent(device.rssi);
  const sigLbl  = rssiLabel(device.rssi);
  const sigClr  = rssiColor(device.rssi);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
          <div>
            <p className="text-[10px] font-mono text-[#94a3b8] uppercase tracking-widest">Device Details</p>
            <h3 className="text-sm font-bold text-[#0f172a] mt-0.5">{device.device_id}</h3>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge online={online} />
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#f1f5f9] text-[#94a3b8] hover:text-[#0f172a] transition-colors text-lg leading-none">×</button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Signal strength */}
          <div className="p-4 rounded-xl border" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
            <p className="text-[10px] font-mono text-[#94a3b8] uppercase tracking-widest mb-2">Signal Strength</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-[#e2e8f0] overflow-hidden">
                <div className="h-2 rounded-full transition-all" style={{ width: `${signal}%`, background: sigClr }} />
              </div>
              <span className="text-xs font-bold font-mono" style={{ color: sigClr }}>{sigLbl}</span>
              <span className="text-[10px] text-[#94a3b8] font-mono">{device.rssi ? `${device.rssi} dBm` : 'N/A'}</span>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Device ID',   value: device.device_id  },
              { label: 'Store ID',    value: device.store_id   },
              { label: 'IP Address',  value: device.ip_address || 'Unknown' },
              { label: 'Firmware',    value: device.firmware   || 'N/A'     },
              { label: 'Total Scans', value: (device.scans || 0).toLocaleString() },
              { label: 'Uptime',      value: device.uptime_s ? `${Math.floor(device.uptime_s / 60)}m ${device.uptime_s % 60}s` : 'N/A' },
              { label: 'Last Seen',   value: formatAge(device.last_seen), full: true },
            ].map(row => (
              <div
                key={row.label}
                className={`p-3 rounded-lg border ${row.full ? 'col-span-2' : ''}`}
                style={{ borderColor: '#e2e8f0', background: '#fff' }}
              >
                <p className="text-[9px] font-mono text-[#94a3b8] uppercase tracking-widest mb-0.5">{row.label}</p>
                <p className="text-sm font-semibold text-[#0f172a] font-mono truncate">{row.value}</p>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-[#475569] border border-[#e2e8f0] rounded-xl hover:bg-[#f8fafc] transition-colors"
            >
              Close
            </button>
            <button
              disabled={!online}
              className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#1e3a5f' }}
              onClick={() => {
                // Future: send OTA/config push to device
                alert('OTA config push coming in a future firmware update.');
              }}
            >
              Push Config
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SetupGuide() {
  const [open, setOpen] = useState(false);
  const steps = [
    { n: 1, title: 'Flash the firmware', body: 'Open the iot/Scanner project in VS Code with PlatformIO. Click Upload to flash the ESP32.' },
    { n: 2, title: 'Set your WiFi credentials', body: 'Edit iot/Scanner/include/Config.h — set WIFI_SSID and WIFI_PASSWORD to match your LAN network.' },
    { n: 3, title: 'Set the backend IP', body: 'In Config.h set API_BASE_URL to http://192.168.1.77:8000 (your machine\'s LAN IP).' },
    { n: 4, title: 'Start backend on LAN', body: 'Run start-backend.bat — this binds uvicorn to 0.0.0.0:8000 so the ESP32 can reach it.' },
    { n: 5, title: 'Power the ESP32', body: 'Connect via USB or a 5V supply. Within 15 seconds it should connect to WiFi and start sending heartbeats.' },
    { n: 6, title: 'Verify here', body: 'This page auto-refreshes every 10 s. A green Online badge means the device is live and scanning.' },
  ];
  return (
    <div className="border rounded-xl overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#f8fafc] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#eff6ff] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0f172a]">Setup Guide</p>
            <p className="text-xs text-[#94a3b8]">How to connect your ESP32 GM67 scanner</p>
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" className="transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      {open && (
        <div className="px-6 pb-5 pt-0 border-t" style={{ borderColor: '#e2e8f0', background: '#fafcff' }}>
          <ol className="space-y-3 mt-4">
            {steps.map(s => (
              <li key={s.n} className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-[#1e3a5f] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{s.n}</span>
                <div>
                  <p className="text-sm font-semibold text-[#0f172a]">{s.title}</p>
                  <p className="text-xs text-[#64748b] mt-0.5">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-4 p-3 rounded-lg border border-dashed" style={{ borderColor: '#bfdbfe', background: '#eff6ff' }}>
            <p className="text-[10px] font-mono text-[#1e3a5f] font-bold">SHARED SECRET</p>
            <p className="text-xs text-[#1e3a5f] font-mono mt-0.5 break-all">ersis-iot-dev-secret</p>
            <p className="text-[10px] text-[#94a3b8] mt-1">Set as <code>IOT_DEVICE_SECRET</code> in Config.h and backend .env</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function S3IoTDevices() {
  const [devices,         setDevices]         = useState([]);
  const [wsClients,       setWsClients]       = useState({});
  const [loading,         setLoading]         = useState(true);
  const [lastRefreshed,   setLastRefreshed]   = useState(null);
  const [error,           setError]           = useState(null);
  const [configDevice,    setConfigDevice]    = useState(null);
  const timerRef = useRef(null);

  const fetchDevices = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await apiRequest('/iot/health');
      setDevices(res.registered_devices || []);
      setWsClients(res.ws_connections   || {});
      setLastRefreshed(new Date());
    } catch (err) {
      setError('Could not reach the IoT health endpoint. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices(false);
    timerRef.current = setInterval(() => fetchDevices(true), POLL_INTERVAL_MS);
    return () => clearInterval(timerRef.current);
  }, [fetchDevices]);

  const onlineDevices  = devices.filter(d => deviceOnline(d));
  const offlineDevices = devices.filter(d => !deviceOnline(d));
  const totalWsClients = Object.values(wsClients).reduce((s, n) => s + n, 0);

  return (
    <CashierSettingsLayout activeId="s3">
      {/* Page header */}
      <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
        <div>
          <h3 className="text-sm font-semibold text-[#0f172a]">IoT Devices</h3>
          <p className="text-xs text-[#94a3b8] mt-0.5">Manage connected hardware and peripherals</p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-[10px] font-mono text-[#94a3b8]">
              Updated {formatAge(lastRefreshed.toISOString())}
            </span>
          )}
          <button
            onClick={() => fetchDevices(false)}
            disabled={loading}
            className="text-[10px] font-bold text-[#1e3a5f] hover:underline disabled:opacity-50 flex items-center gap-1"
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 00-9-9" strokeLinecap="round"/></svg>
                Refreshing...
              </>
            ) : 'Refresh Now'}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 border-b" style={{ borderColor: '#e2e8f0' }}>
        {[
          { label: 'Total Devices',   value: devices.length,         color: '#0f172a' },
          { label: 'Online Now',       value: onlineDevices.length,   color: '#15803d' },
          { label: 'POS Clients (WS)', value: totalWsClients,         color: '#1e3a5f' },
        ].map((stat, i) => (
          <div key={i} className="px-6 py-3 text-center border-r last:border-0" style={{ borderColor: '#e2e8f0' }}>
            <p className="text-xl font-bold font-mono" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-mono">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="mx-6 mt-4 p-3 rounded-xl border flex items-center gap-2" style={{ borderColor: '#fecaca', background: '#fff5f5' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          <p className="text-xs text-[#dc2626]">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && devices.length === 0 && (
        <div className="px-6 pt-8 pb-4 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#f1f5f9] flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round">
              <rect x="3" y="5" width="18" height="14" rx="2"/><line x1="7" y1="9" x2="7" y2="15"/><line x1="10" y1="9" x2="10" y2="15"/><line x1="13" y1="9" x2="13" y2="15"/><line x1="17" y1="9" x2="17" y2="15"/>
            </svg>
          </div>
          <p className="text-sm font-semibold text-[#0f172a] mb-1">No devices registered yet</p>
          <p className="text-xs text-[#94a3b8] max-w-xs mx-auto">Flash the ESP32 firmware and connect it to WiFi. It will automatically appear here once it sends its first heartbeat.</p>
        </div>
      )}

      {/* Device list — Online */}
      {onlineDevices.length > 0 && (
        <div>
          <div className="px-6 pt-4 pb-1">
            <p className="text-[10px] font-mono font-bold text-[#94a3b8] uppercase tracking-widest">Online ({onlineDevices.length})</p>
          </div>
          {onlineDevices.map((d) => (
            <DeviceRow key={d.device_id} device={d} online={true} onConfigure={() => setConfigDevice(d)} />
          ))}
        </div>
      )}

      {/* Device list — Offline */}
      {offlineDevices.length > 0 && (
        <div>
          <div className="px-6 pt-4 pb-1">
            <p className="text-[10px] font-mono font-bold text-[#94a3b8] uppercase tracking-widest">Offline / Stale ({offlineDevices.length})</p>
          </div>
          {offlineDevices.map((d) => (
            <DeviceRow key={d.device_id} device={d} online={false} onConfigure={() => setConfigDevice(d)} />
          ))}
        </div>
      )}

      {/* WS client info */}
      {Object.keys(wsClients).length > 0 && (
        <div className="mx-6 mt-4 p-4 rounded-xl border" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
          <p className="text-[10px] font-mono font-bold text-[#94a3b8] uppercase tracking-widest mb-2">Live POS WebSocket Clients</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(wsClients).map(([storeId, count]) => (
              <span key={storeId} className="text-xs font-mono bg-white border border-[#e2e8f0] px-2.5 py-1 rounded-lg text-[#1e3a5f]">
                Store {storeId}: {count} client{count !== 1 ? 's' : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Setup guide */}
      <div className="mx-6 mt-4 mb-2">
        <SetupGuide />
      </div>

      {/* Configure modal */}
      {configDevice && <ConfigureModal device={configDevice} onClose={() => setConfigDevice(null)} />}
    </CashierSettingsLayout>
  );
}

// ─── DeviceRow ────────────────────────────────────────────────────────────────
function DeviceRow({ device, online, onConfigure }) {
  const friendlyName = device.device_id?.includes('SCANNER')
    ? 'ESP32 Barcode Scanner'
    : `IoT Device`;

  return (
    <div
      className="flex items-center justify-between px-6 py-4 border-b last:border-0 hover:bg-[#f8fafc] transition-colors group"
      style={{ borderColor: '#e2e8f0' }}
    >
      <div className="flex items-center gap-3">
        <DeviceIcon online={online} />
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-[#0f172a]">{friendlyName}</p>
            {(device.scans > 0) && (
              <span className="text-[9px] font-bold bg-[#eff6ff] text-[#1e3a5f] px-1.5 py-0.5 rounded uppercase tracking-wider">
                {device.scans} scans
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#94a3b8] font-mono mt-0.5">
            {device.device_id}
            {device.ip_address && device.ip_address !== '' ? ` · ${device.ip_address}` : ''}
            {device.firmware   && device.firmware !== ''   ? ` · v${device.firmware}` : ''}
          </p>
          <p className="text-[10px] text-[#cbd5e1] font-mono mt-0.5">
            Last seen: {formatAge(device.last_seen)}
            {device.uptime_s ? ` · Up ${Math.floor(device.uptime_s / 60)}m` : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end gap-1">
          <SignalBars rssi={device.rssi} />
          <span className="text-[9px] font-mono text-[#94a3b8]">
            {device.rssi ? `${device.rssi} dBm` : 'N/A'}
          </span>
        </div>
        <StatusBadge online={online} />
        <button
          onClick={onConfigure}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#e2e8f0] text-[#475569] hover:border-[#1e3a5f] hover:text-[#1e3a5f] transition-all opacity-0 group-hover:opacity-100"
        >
          Details
        </button>
      </div>
    </div>
  );
}
