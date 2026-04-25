// src/pages/cashier/S3IoTDevices.jsx
import CashierSettingsLayout from './CashierSettingsLayout';

const devices = [
  { name:'ESP32 Weight Scale',   id:'ESP32-WS-001', status:'Connected', last:'Just now',  signal:98 },
  { name:'Barcode Scanner USB',  id:'USB-BC-002',   status:'Connected', last:'5 min ago', signal:100},
  { name:'Thermal Printer',      id:'TP-USB-003',   status:'Connected', last:'2 min ago', signal:100},
  { name:'NFC Reader Module',    id:'NFC-004',      status:'Inactive',  last:'2 days ago',signal:0  },
];

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
  return (
    <CashierSettingsLayout activeId="s3">
      <div className="px-6 py-4 border-b" style={{ borderColor:'#e2e8f0', background:'#f8fafc' }}>
        <h3 className="text-sm font-semibold text-[#0f172a]">IoT Devices</h3>
        <p className="text-xs text-[#94a3b8] mt-0.5">Manage connected hardware and peripherals</p>
      </div>

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
              <p className="text-xs text-[#94a3b8] font-mono">{d.id} · Last seen {d.last}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <SignalBar value={d.signal} />
            <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: d.status==='Connected'?'#dcfce7':'#f3f4f6', color: d.status==='Connected'?'#15803d':'#6b7280' }}>
              {d.status}
            </span>
            <button className="btn-outline text-xs">{d.status==='Connected' ? 'Configure' : 'Enable'}</button>
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
