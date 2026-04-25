// src/pages/admin/ViewCustomer.jsx — IMPROVED: reads customer from editTarget (passed via navigateTo)
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Badge, Button, StatCard } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { useApp } from '../../context/AppContext';

// Fallback for when accessed directly without editTarget
const FALLBACK = {
  id: 1, name: 'Sunita KC', phone: '+977-9812-009934', email: 'sunita@email.com',
  orders: 28, lastVisit: 'Yesterday', value: 'Rs 31,200', type: 'Registered',
  joined: '12 Jan 2025', address: 'Lalitpur, Kathmandu',
};

const RECENT_ORDERS = [
  { id: 'TXN-0001', date: 'Yesterday 14:32', items: 5, method: 'Card',   amount: 'Rs 1,840', status: 'Paid'     },
  { id: 'TXN-0002', date: '9 Apr 2026 10:15',items: 2, method: 'Wallet', amount: 'Rs 540',   status: 'Paid'     },
  { id: 'TXN-0003', date: '7 Apr 2026 16:00',items: 8, method: 'Cash',   amount: 'Rs 3,200', status: 'Paid'     },
  { id: 'TXN-0004', date: '1 Apr 2026 11:45',items: 1, method: 'Card',   amount: 'Rs 450',   status: 'Refunded' },
];

const TOP_ITEMS = [
  { name: 'Amul Full Cream Milk 1L',  count: 14, spend: 'Rs 1,190' },
  { name: 'Organic Basmati Rice 5kg', count: 6,  spend: 'Rs 2,040' },
  { name: 'Wai Wai Noodles',          count: 22, spend: 'Rs 550'   },
];

export default function ViewCustomer() {
  const { setCurrentPage, editTarget } = useAdmin();
  const { transactions } = useApp();

  // Use the customer passed via navigateTo, fallback to static
  const c = editTarget || FALLBACK;

  // Count this customer's real transactions
  const customerTxns = transactions.filter(t =>
    t.customer?.toLowerCase() === c.name?.toLowerCase()
  );
  const realSpend = customerTxns
    .filter(t => t.status === 'Paid')
    .reduce((s, t) => s + (parseInt((t.amount || '').replace(/[^0-9]/g, ''), 10) || 0), 0);

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
          <p className="text-xs text-[#94a3b8] mt-0.5">Member since {c.joined || '—'} · {c.address || '—'}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-[#94a3b8]">Last Visit</p>
          <p className="text-sm font-semibold text-[#0f172a]">{c.lastVisit}</p>
        </div>
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <StatCard label="Total Orders"     value={customerTxns.length || c.orders} progress={60} />
        <StatCard label="Lifetime Spend"   value={realSpend > 0 ? `Rs ${realSpend.toLocaleString('en-IN')}` : c.value} progress={70} navy />
        <StatCard label="Refunds"          value={customerTxns.filter(t => t.status === 'Refunded').length} progress={5} />
        <StatCard label="Preferred Method" value={customerTxns[0]?.method || 'Cash'} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Recent orders — mix real + static */}
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a]">Recent Transactions</h3>
          </div>
          <table className="data-table">
            <thead><tr><th>TXN ID</th><th>Date</th><th>Items</th><th>Method</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {(customerTxns.length > 0 ? customerTxns.slice(0, 5) : RECENT_ORDERS).map((t, i) => (
                <tr key={i}>
                  <td><span className="mono text-xs">{t.id}</span></td>
                  <td className="text-sm text-[#475569]">{t.datetime || t.date}</td>
                  <td className="text-sm">{t.items}</td>
                  <td className="text-sm">{t.method}</td>
                  <td className="text-sm font-semibold">{t.amount}</td>
                  <td><Badge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top purchased items */}
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
          <h3 className="text-sm font-semibold text-[#0f172a] mb-4">Top Purchased Items</h3>
          <div className="space-y-3">
            {TOP_ITEMS.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: '#e2e8f0' }}>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-[#94a3b8] w-5">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-[#0f172a]">{item.name}</p>
                    <p className="text-xs text-[#94a3b8]">{item.count} purchases</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-[#1e3a5f]">{item.spend}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t" style={{ borderColor: '#e2e8f0' }}>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-[#94a3b8]">Customer Type</p><p className="font-medium">{c.type}</p></div>
              <div><p className="text-xs text-[#94a3b8]">Avg. Basket</p><p className="font-medium">Rs {Math.round(parseInt((c.value || '0').replace(/[^0-9]/g, '')) / Math.max(c.orders, 1)).toLocaleString('en-IN')}</p></div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
