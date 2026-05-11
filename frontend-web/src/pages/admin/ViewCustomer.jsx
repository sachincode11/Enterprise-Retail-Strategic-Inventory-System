// src/pages/admin/ViewCustomer.jsx — IMPROVED: real data, transactions link
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Badge, Button, StatCard } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { useApp } from '../../context/AppContext';

// Fallback for when accessed directly without editTarget
const FALLBACK = {
  id: 1, name: 'Guest Customer', phone: '—', email: '—',
  type: 'Guest', joined: '—', address: '—',
};

export default function ViewCustomer() {
  const { setCurrentPage, editTarget } = useAdmin();
  const { transactions } = useApp();

  // Use the customer passed via navigateTo, fallback to static
  const c = editTarget || FALLBACK;

  // Calculate real metrics from global transactions state
  const customerTxns = transactions.filter(t =>
    (t.customerId && t.customerId === c.id) || 
    (t.customer?.toLowerCase() === c.name?.toLowerCase())
  );
  
  const realSpend = customerTxns
    .filter(t => t.status === 'Paid')
    .reduce((s, t) => s + (parseInt((t.amount || '').replace(/[^0-9]/g, ''), 10) || 0), 0);
    
  const lastVisit = customerTxns.length > 0 ? customerTxns[0].datetime || customerTxns[0].date : '—';

  return (
    <AdminLayout>
      <PageHeader
        breadcrumb={<span className="cursor-pointer hover:text-[#1e3a5f] transition-colors" onClick={() => setCurrentPage('customers')}>← Customers</span>}
        title="Customer Profile"
        actions={
          <>
            <Button variant="secondary" onClick={() => setCurrentPage('customers')}>← Back</Button>
          </>
        }
      />

      {/* Hero */}
      <div className="bg-white rounded-xl border p-5 mb-4 flex items-center gap-5" style={{ borderColor: '#e2e8f0' }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
          style={{ background: '#1e3a5f' }}>
          {c.name?.[0] || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-[#0f172a]">{c.name}</h2>
            <Badge status={c.type} />
          </div>
          <p className="text-sm text-[#475569]">{c.phone} · {c.email}</p>
          <p className="text-xs text-[#94a3b8] mt-0.5">Member since {c.joined || c.created_at || '—'} · {c.address || '—'}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-[#94a3b8]">Last Visit</p>
          <p className="text-sm font-semibold text-[#0f172a]">{lastVisit}</p>
        </div>
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <StatCard label="Total Transactions" value={customerTxns.length} />
        <StatCard label="Lifetime Spend"     value={`Rs ${realSpend.toLocaleString('en-IN')}`} navy />
        <StatCard label="Refunds"            value={customerTxns.filter(t => t.status === 'Refunded').length} />
        <StatCard label="Avg. Basket"        value={customerTxns.length > 0 ? `Rs ${Math.round(realSpend / customerTxns.length).toLocaleString('en-IN')}` : 'Rs 0'} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Recent orders */}
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a]">Transaction History</h3>
          </div>
          <table className="data-table">
            <thead><tr><th>TXN ID</th><th>Date</th><th>Method</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {customerTxns.map((t, i) => (
                <tr key={i}>
                  <td><span className="mono text-xs">{t.id}</span></td>
                  <td className="text-sm text-[#475569]">{t.datetime || t.date}</td>
                  <td className="text-sm">{t.method}</td>
                  <td className="text-sm font-semibold">{t.amount}</td>
                  <td><Badge status={t.status} /></td>
                </tr>
              ))}
              {customerTxns.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-xs text-[#94a3b8]">No transaction history found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Info summary */}
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
          <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Customer Summary</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-[#94a3b8] uppercase tracking-wider mb-1">Customer Type</p>
              <p className="text-sm font-medium">{c.type}</p>
            </div>
            <div>
              <p className="text-xs text-[#94a3b8] uppercase tracking-wider mb-1">Address</p>
              <p className="text-sm font-medium">{c.address || 'No address provided.'}</p>
            </div>
            <div>
              <p className="text-xs text-[#94a3b8] uppercase tracking-wider mb-1">Status</p>
              <Badge status={c.is_active ? 'Active' : 'Inactive'} />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
