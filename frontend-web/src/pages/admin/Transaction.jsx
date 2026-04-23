// src/pages/admin/Transaction.jsx
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Badge, Button, StatCard, Pagination } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { transactions } from '../../data/mockData';

export default function Transaction() {
  const { setCurrentPage } = useAdmin();
  return (
    <AdminLayout>
      <PageHeader
        breadcrumb="All Stores"
        title="Transaction History"
        actions={
          <>
            <Button variant="secondary">↓ Export CSV</Button>
            <Button variant="secondary">↓ Export PDF</Button>
            <Button variant="primary" onClick={() => setCurrentPage('transaction-history')}>View Full History</Button>
          </>
        }
      />
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Today"      value="128"     progress={40} />
        <StatCard label="This Month" value="3,240"   progress={70} />
        <StatCard label="Refunds"    value="12"      progress={10} />
        <StatCard label="Avg. Basket"value="Rs 658" />
      </div>
      <div className="flex items-center gap-3 mb-4">
        <input placeholder="TXN ID"   className="input-field" style={{ maxWidth: 120 }} />
        <input placeholder="Customer" className="input-field" style={{ maxWidth: 150 }} />
        <input placeholder="Cashier"  className="input-field" style={{ maxWidth: 140 }} />
        <input placeholder="Date"     className="input-field" style={{ maxWidth: 140 }} />
        <input placeholder="Method"   className="input-field" style={{ maxWidth: 120 }} />
        <button className="btn-primary px-4 py-2 text-sm">Apply</button>
        <button className="btn-secondary px-3 py-2 text-sm">Reset</button>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        <table className="data-table">
          <thead>
            <tr><th>TXN ID ↕</th><th>Customer</th><th>Cashier</th><th>Date & Time</th><th>Items</th><th>Method</th><th>Amount</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t.id}>
                <td><span className="mono text-xs font-medium">{t.id}</span></td>
                <td className="text-sm font-medium">{t.customer}</td>
                <td className="text-sm" style={{ color: '#475569' }}>{t.cashier}</td>
                <td className="text-sm" style={{ color: '#475569' }}>{t.datetime}</td>
                <td className="text-sm">{t.items}</td>
                <td className="text-sm">{t.method}</td>
                <td className="text-sm font-semibold">{t.amount}</td>
                <td><Badge status={t.status} /></td>
                <td><button className="btn-outline" onClick={() => setCurrentPage('transaction-history')}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination current={1} total={3} label="Showing 1–6 of 3,240 transactions" />
      </div>
    </AdminLayout>
  );
}
