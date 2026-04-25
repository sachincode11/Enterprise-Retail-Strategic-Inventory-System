// src/pages/admin/AuditLogSnapshot.jsx
import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Button, Pagination } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';

const severityColor = {
  Info:     { bg:'#dbeafe', text:'#1d4ed8' },
  Warning:  { bg:'#fef3c7', text:'#92400e' },
  Critical: { bg:'#fee2e2', text:'#991b1b' },
};

const extendedLog = [
  { time:'13 Apr 2026 09:12', user:'Anita S.',  action:'Login',             detail:'Admin login from 192.168.1.5',            severity:'Info'     },
  { time:'13 Apr 2026 09:18', user:'Anita S.',  action:'Price Change',      detail:'Basmati Rice 5kg: Rs 320 → Rs 340',       severity:'Warning'  },
  { time:'13 Apr 2026 10:02', user:'Kasim R.',  action:'Discount Applied',  detail:'SEASONAL2026 used on TXN-0091',            severity:'Info'     },
  { time:'13 Apr 2026 10:45', user:'System',    action:'Low Stock Alert',   detail:'Tata Salt 1kg dropped to 2 units',        severity:'Warning'  },
  { time:'13 Apr 2026 11:30', user:'Anita S.',  action:'Staff Added',       detail:'New staff: Roshan KC (Cashier)',           severity:'Info'     },
  { time:'13 Apr 2026 12:00', user:'Priya K.',  action:'Refund Issued',     detail:'TXN-0088 refunded Rs 3,400',              severity:'Warning'  },
  { time:'13 Apr 2026 13:15', user:'System',    action:'Backup Completed',  detail:'Daily DB backup successful',              severity:'Info'     },
  { time:'13 Apr 2026 14:02', user:'Anita S.',  action:'PO Created',        detail:'PO-2026-041 sent to Nepal Trading',       severity:'Info'     },
  { time:'12 Apr 2026 18:44', user:'Kasim R.',  action:'Failed Login',      detail:'3 failed PIN attempts — locked out',      severity:'Critical' },
  { time:'12 Apr 2026 17:30', user:'Anita S.',  action:'Supplier Updated',  detail:'Nepal Trading contact info changed',      severity:'Info'     },
];

export default function AuditLogSnapshot() {
  const { setCurrentPage } = useAdmin();
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? extendedLog : extendedLog.filter(e => e.severity === filter);

  return (
    <AdminLayout>
      <PageHeader
        breadcrumb={<span className="cursor-pointer hover:text-[#1e3a5f] transition-colors" onClick={() => setCurrentPage('reports')}>← Back to Reports</span>}
        title="Audit Log Snapshot"
        actions={
          <>
            <Button variant="secondary" onClick={() => setCurrentPage('reports')}>← Back</Button>
            <Button variant="secondary">↓ Export CSV</Button>
            <Button variant="secondary">↓ Export PDF</Button>
          </>
        }
      />
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label:'Total Events Today', value: extendedLog.filter(e=>e.time.startsWith('13 Apr')).length.toString() },
          { label:'Info',               value: extendedLog.filter(e=>e.severity==='Info').length.toString() },
          { label:'Warnings',           value: extendedLog.filter(e=>e.severity==='Warning').length.toString() },
          { label:'Critical',           value: extendedLog.filter(e=>e.severity==='Critical').length.toString() },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border p-5" style={{ borderColor:'#e2e8f0' }}>
            <p className="text-[11px] text-[#94a3b8] font-mono uppercase tracking-widest mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-[#0f172a]">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mb-4">
        <input placeholder="Search events..." className="input-field" style={{ maxWidth:220 }} />
        <input placeholder="User"             className="input-field" style={{ maxWidth:160 }} />
        <input type="date"                    className="input-field" style={{ maxWidth:160 }} />
        <div className="flex gap-1 ml-auto">
          {['All','Info','Warning','Critical'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={filter===f ? {background:'#1e3a5f',color:'#fff'} : {background:'#fff',border:'1px solid #e2e8f0',color:'#475569'}}
            >{f}</button>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor:'#e2e8f0' }}>
        <table className="data-table">
          <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Detail</th><th>Severity</th></tr></thead>
          <tbody>
            {filtered.map((entry, i) => {
              const sev = severityColor[entry.severity] || severityColor.Info;
              return (
                <tr key={i}>
                  <td className="text-xs font-mono text-[#475569]">{entry.time}</td>
                  <td className="text-sm font-medium">{entry.user}</td>
                  <td className="text-sm font-semibold text-[#0f172a]">{entry.action}</td>
                  <td className="text-sm text-[#475569]">{entry.detail}</td>
                  <td><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" style={{ background:sev.bg, color:sev.text }}>{entry.severity}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Pagination current={1} total={2} label={`Showing ${filtered.length} of ${extendedLog.length} events`} />
      </div>
    </AdminLayout>
  );
}
