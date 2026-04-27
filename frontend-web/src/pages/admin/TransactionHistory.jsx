// src/pages/admin/TransactionHistory.jsx — IMPROVED: uses live transactions from AppContext, export works
import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Badge, Button, StatCard, Pagination } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { useApp } from '../../context/AppContext';
import { exportCSV } from '../../utils/exportData';

export default function TransactionHistory() {
  const { setCurrentPage } = useAdmin();
  const { transactions } = useApp();

  const [search, setSearch]         = useState('');
  const [cashierFilter, setCashier] = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');
  const [page, setPage]             = useState(1);
  const PER_PAGE = 12;

  const filtered = transactions.filter(t => {
    const q = search.toLowerCase();
    const matchSearch  = !q || t.id.toLowerCase().includes(q) || t.customer.toLowerCase().includes(q);
    const matchCashier = !cashierFilter || (t.cashier || '').toLowerCase().includes(cashierFilter.toLowerCase());
    const matchStatus  = !statusFilter || t.status === statusFilter;
    return matchSearch && matchCashier && matchStatus;
  });

  const totalPages  = Math.ceil(filtered.length / PER_PAGE);
  const paginated   = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalRevenue= transactions.filter(t => t.status === 'Paid').reduce((s, t) => s + (parseInt((t.amount || '').replace(/[^0-9]/g, ''), 10) || 0), 0);
  const refundCount = transactions.filter(t => t.status === 'Refunded').length;

  const handleExport = () => {
    const rows = filtered.map(t => ({ ID: t.id, Customer: t.customer, Cashier: t.cashier, DateTime: t.datetime, Items: t.items, Method: t.method, Amount: t.amount, Status: t.status }));
    exportCSV(rows, `transactions-full-${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <AdminLayout>
      <PageHeader
        breadcrumb={<span className="cursor-pointer hover:text-[#1e3a5f] transition-colors" onClick={() => setCurrentPage('transactions')}>← Back</span>}
        title="Transaction History — Full Log"
        actions={
          <>
            <Button variant="secondary" onClick={() => setCurrentPage('transactions')}>← Back</Button>
            <Button variant="secondary" onClick={handleExport}>↓ Export CSV</Button>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard label="Total Transactions" value={transactions.length.toLocaleString()} progress={100} />
        <StatCard label="Paid"               value={transactions.filter(t => t.status === 'Paid').length.toLocaleString()} progress={92} navy />
        <StatCard label="Refunded"           value={refundCount.toLocaleString()} progress={refundCount} />
        <StatCard label="Total Revenue"      value={`Rs ${totalRevenue.toLocaleString('en-IN')}`} />
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="TXN ID or Customer…" className="input-field" style={{ maxWidth: 200 }} />
        <input value={cashierFilter} onChange={e => { setCashier(e.target.value); setPage(1); }}
          placeholder="Cashier…" className="input-field" style={{ maxWidth: 140 }} />
        <select value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1); }} className="input-field" style={{ maxWidth: 140 }}>
          <option value="">All Status</option>
          <option>Paid</option><option>Refunded</option><option>Voided</option>
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field" style={{ maxWidth: 160 }} />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field" style={{ maxWidth: 160 }} />
        <button onClick={() => { setSearch(''); setCashier(''); setStatus(''); setDateFrom(''); setDateTo(''); setPage(1); }}
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
