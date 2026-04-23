// src/pages/admin/Transaction.jsx
import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Badge, Button, StatCard, Pagination, EmptyState, LoadingSpinner } from '../../components/common';
import { useService } from '../../hooks/useService';
import { useSearch } from '../../hooks/useSearch';
import { getTransactions } from '../../services/transactionService';
import { exportCSV, exportJSON } from '../../utils/exportData';

export default function Transaction() {
  const { data: transactions, loading } = useService(getTransactions);
  const { query, setQuery, filters, setFilters, filtered, clearFilters } = useSearch(transactions || [], ['id', 'customer', 'cashier', 'method', 'status']);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <AdminLayout>
      <PageHeader
        breadcrumb="All Stores"
        title="Transaction History"
        actions={
          <>
            <Button variant="secondary" onClick={() => transactions && exportCSV(transactions, 'transactions')}>Export CSV</Button>
            <Button variant="secondary" onClick={() => transactions && exportJSON(transactions, 'transactions')}>Export JSON</Button>
          </>
        }
      />
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Today"       value={transactions?.filter(t => t.status === 'Paid').length ?? '—'}     progress={40} />
        <StatCard label="This Month"  value="3,240"                                                             progress={70} />
        <StatCard label="Refunds"     value={transactions?.filter(t => t.status === 'Refunded').length ?? '—'} progress={10} />
        <StatCard label="Avg. Basket" value="Rs 658" />
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} placeholder="Search TXN ID, customer..." className="input-field" style={{ maxWidth: 220 }} />
        <select value={filters.method || 'All'} onChange={e => { setFilters(f => ({ ...f, method: e.target.value })); setPage(1); }} className="input-field" style={{ maxWidth: 130 }}>
          {['All', 'Cash', 'Card', 'QR', 'Wallet'].map(m => <option key={m}>{m}</option>)}
        </select>
        <select value={filters.status || 'All'} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }} className="input-field" style={{ maxWidth: 130 }}>
          {['All', 'Paid', 'Pending', 'Refunded', 'Voided'].map(s => <option key={s}>{s}</option>)}
        </select>
        {(query || filters.method || filters.status) && (
          <button onClick={() => { clearFilters(); setPage(1); }} className="btn-outline text-xs">Reset</button>
        )}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        {loading ? <LoadingSpinner /> : (
          <>
            <table className="data-table">
              <thead>
                <tr><th>TXN ID</th><th>Customer</th><th>Cashier</th><th>Date & Time</th><th>Items</th><th>Method</th><th>Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {paginated.length === 0
                  ? <tr><td colSpan={8}><EmptyState message="No transactions match." action={clearFilters} actionLabel="Clear filters" /></td></tr>
                  : paginated.map(t => (
                    <tr key={t.id}>
                      <td><span className="mono text-xs font-medium">{t.id}</span></td>
                      <td className="text-sm font-medium">{t.customer}</td>
                      <td className="text-sm" style={{ color: '#475569' }}>{t.cashier}</td>
                      <td className="text-sm" style={{ color: '#475569' }}>{t.datetime}</td>
                      <td className="text-sm">{t.items}</td>
                      <td className="text-sm">{t.method}</td>
                      <td className="text-sm font-semibold">{t.amount}</td>
                      <td><Badge status={t.status} /></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
            <Pagination current={page} total={Math.ceil(filtered.length / PER_PAGE)} label={`${filtered.length} transactions`} onPage={setPage} />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
