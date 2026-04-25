// src/pages/admin/Transaction.jsx — IMPROVED: uses AppContext global transactions
import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Badge, Button, StatCard, Pagination } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { useApp } from '../../context/AppContext';
import { exportCSV } from '../../utils/exportData';

export default function Transaction() {
  const { setCurrentPage } = useAdmin();
  const { transactions } = useApp();

  const [query, setQuery]         = useState('');
  const [methodFilter, setMethod] = useState('All');
  const [statusFilter, setStatus] = useState('All');
  const [page, setPage]           = useState(1);
  const PER_PAGE = 10;

  const filtered = (transactions || []).filter(t => {
    const q = query.toLowerCase();
    const matchSearch = !q || t.id.toLowerCase().includes(q) || t.customer.toLowerCase().includes(q);
    const matchMethod = methodFilter === 'All' || t.method === methodFilter;
    const matchStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchSearch && matchMethod && matchStatus;
  });

  const totalPages  = Math.ceil(filtered.length / PER_PAGE);
  const paginated   = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalRevenue= (transactions || []).filter(t => t.status === 'Paid')
    .reduce((s, t) => s + (parseInt((t.amount || '').replace(/[^0-9]/g, ''), 10) || 0), 0);

  const handleExport = () => {
    exportCSV(filtered.map(t => ({ ID: t.id, Customer: t.customer, Cashier: t.cashier, DateTime: t.datetime, Items: t.items, Method: t.method, Amount: t.amount, Status: t.status })),
      `transactions-${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <AdminLayout>
      <PageHeader
        breadcrumb="All Stores"
        title="Transaction History"
        actions={
          <>
            <Button variant="secondary" onClick={handleExport}>↓ Export CSV</Button>
            <Button variant="secondary" onClick={() => setCurrentPage('transaction-history')}>Full Log →</Button>
          </>
        }
      />
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Transactions" value={(transactions || []).length} progress={40} />
        <StatCard label="Paid"               value={(transactions || []).filter(t => t.status === 'Paid').length} progress={70} navy />
        <StatCard label="Refunds"            value={(transactions || []).filter(t => t.status === 'Refunded').length} progress={10} />
        <StatCard label="Total Revenue"      value={`Rs ${totalRevenue.toLocaleString('en-IN')}`} />
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input value={query} onChange={e => { setQuery(e.target.value); setPage(1); }}
          placeholder="Search TXN ID, customer…" className="input-field" style={{ maxWidth: 220 }} />
        <select value={methodFilter} onChange={e => { setMethod(e.target.value); setPage(1); }} className="input-field" style={{ maxWidth: 130 }}>
          {['All', 'Cash', 'Card', 'QR'].map(m => <option key={m}>{m}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1); }} className="input-field" style={{ maxWidth: 130 }}>
          {['All', 'Paid', 'Refunded', 'Voided'].map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={() => { setQuery(''); setMethod('All'); setStatus('All'); setPage(1); }}
          className="px-4 py-2 text-sm border border-[#e2e8f0] rounded-lg text-[#475569] hover:border-[#bfdbfe] bg-white">Reset</button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        <table className="data-table">
          <thead>
            <tr><th>TXN ID</th><th>Customer</th><th>Cashier</th><th>Date & Time</th><th>Items</th><th>Method</th><th>Amount</th><th>Status</th></tr>
          </thead>
          <tbody>
            {paginated.map((t, i) => (
              <tr key={i}>
                <td><span className="mono text-xs font-medium">{t.id}</span></td>
                <td className="text-sm font-medium">{t.customer}</td>
                <td className="text-sm text-[#475569]">{t.cashier || '—'}</td>
                <td className="text-sm text-[#475569]">{t.datetime}</td>
                <td className="text-sm">{t.items}</td>
                <td className="text-sm">{t.method}</td>
                <td className="text-sm font-bold">{t.amount}</td>
                <td><Badge status={t.status} /></td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr><td colSpan={8} className="text-center py-10 text-sm text-[#94a3b8]">No transactions found</td></tr>
            )}
          </tbody>
        </table>
        <Pagination current={page} total={totalPages}
          label={`Showing ${Math.min((page-1)*PER_PAGE+1, filtered.length)}–${Math.min(page*PER_PAGE, filtered.length)} of ${filtered.length}`}
          onPrev={() => setPage(p => Math.max(1, p-1))} onNext={() => setPage(p => Math.min(totalPages, p+1))} onPage={setPage} />
      </div>
    </AdminLayout>
  );
}
