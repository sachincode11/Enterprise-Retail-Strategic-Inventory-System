// src/pages/admin/Reports.jsx
import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Button, StatCard, SectionCard, BarChart } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { monthlyRevenueTrend, cashierPerformance, auditLog } from '../../data/mockData';

const paymentSplit = [
  { method: '💵 Cash',   pct: 52, amount: 'Rs 12.5L', bar: 88 },
  { method: '💳 Card',   pct: 30, amount: 'Rs 7.2L',  bar: 56 },
  { method: '📱 Wallet', pct: 18, amount: 'Rs 4.4L',  bar: 34 },
];

export default function Reports() {
  const { setCurrentPage } = useAdmin();
  const [fromDate, setFromDate] = useState('');
  const [toDate,   setToDate]   = useState('');

  return (
    <AdminLayout>
      <PageHeader
        breadcrumb="Analytics & Insights"
        title="Reports"
        actions={
          <>
            <div className="flex items-center gap-2">
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="input-field text-sm" style={{ width: 150 }} />
              <span className="text-sm text-[#94a3b8]">—</span>
              <input type="date" value={toDate}   onChange={e => setToDate(e.target.value)}   className="input-field text-sm" style={{ width: 150 }} />
            </div>
            <Button variant="secondary">↓ Export PDF</Button>
          </>
        }
      />
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Revenue"      value="Rs 24.1L" progress={80} navy />
        <StatCard label="Transactions" value="3,240"    progress={60} />
        <StatCard label="Avg. Basket"  value="Rs 743"   progress={55} />
        <StatCard label="Refund Rate"  value="0.37%"    progress={5}  />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <SectionCard title="Monthly Revenue Trend">
          <div className="px-5 pb-4 pt-3"><BarChart data={monthlyRevenueTrend} height={140} /></div>
        </SectionCard>
        <SectionCard title="Payment Method Split">
          <div className="px-5 py-4 space-y-4">
            {paymentSplit.map(p => (
              <div key={p.method}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm text-[#0f172a]">{p.method}</span>
                  <span className="text-sm font-medium text-[#0f172a]">{p.pct}% · {p.amount}</span>
                </div>
                <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${p.bar}%` }} /></div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SectionCard title="Cashier Performance">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Cashier</th><th>Txns</th><th>Revenue</th><th>Avg Basket</th></tr></thead>
              <tbody>
                {cashierPerformance.map(c => (
                  <tr key={c.name}>
                    <td className="text-sm font-medium text-[#0f172a]">{c.name}</td>
                    <td className="text-sm">{c.txns.toLocaleString()}</td>
                    <td className="text-sm font-semibold">{c.revenue}</td>
                    <td className="text-sm">{c.avg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
        <SectionCard
          title="Audit Log Snapshot"
          headerRight={<button onClick={() => setCurrentPage('audit-log-snapshot')} className="text-xs text-[#94a3b8] hover:text-[#1e3a5f] transition-colors">View All →</button>}
        >
          <div className="px-5 py-3 space-y-4">
            {auditLog.map((log, i) => (
              <div key={i} className="border-b pb-3 last:border-0 last:pb-0" style={{ borderColor: '#e2e8f0' }}>
                <p className="text-sm font-medium text-[#0f172a]">{log.action}</p>
                <p className="text-xs mt-0.5 text-[#94a3b8]">{log.by}{log.ref && ` · ${log.ref}`} · {log.time}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AdminLayout>
  );
}
