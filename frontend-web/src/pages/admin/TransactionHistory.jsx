// src/pages/admin/TransactionHistory.jsx
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Badge, Button, StatCard, Pagination } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { transactions } from '../../data/mockData';

const extra = [
  { id: '#TXN-0007', customer: 'Anaya Sharma', cashier: 'Priya K.', datetime: '11 Apr 2026, 10:15', items: 3, method: 'Card',   amount: 'Rs 1,240', status: 'Paid'     },
  { id: '#TXN-0008', customer: 'Dev Patel',    cashier: 'Raj M.',   datetime: '11 Apr 2026, 09:40', items: 1, method: 'Cash',   amount: 'Rs 320',   status: 'Paid'     },
  { id: '#TXN-0009', customer: 'Nisha Roy',    cashier: 'Priya K.', datetime: '10 Apr 2026, 18:55', items: 7, method: 'Wallet', amount: 'Rs 2,870', status: 'Refunded' },
  { id: '#TXN-0010', customer: 'Aman Verma',   cashier: 'Rahul S.', datetime: '10 Apr 2026, 16:30', items: 2, method: 'Cash',   amount: 'Rs 540',   status: 'Paid'     },
];
const allTxns = [...transactions, ...extra];

export default function TransactionHistory() {
  const { setCurrentPage } = useAdmin();
  return (
    <AdminLayout>
      <PageHeader
        breadcrumb={<span className="cursor-pointer hover:text-[#1e3a5f] transition-colors" onClick={() => setCurrentPage('transactions')}>← Back to Transactions</span>}
        title="Transaction History — Full Log"
        actions={
          <>
            <Button variant="secondary" onClick={() => setCurrentPage('transactions')}>← Back</Button>
            <Button variant="secondary">↓ Export CSV</Button>
            <Button variant="secondary">↓ Export PDF</Button>
          </>
        }
      />
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Transactions" value="3,240" progress={100} />
        <StatCard label="Paid"               value="3,192" progress={98}  />
        <StatCard label="Refunded"           value="36"    progress={10}  />
        <StatCard label="Pending"            value="12"    progress={5}   />
      </div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input placeholder="TXN ID"    className="input-field" style={{ maxWidth: 130 }} />
        <input placeholder="Customer"  className="input-field" style={{ maxWidth: 160 }} />
        <input placeholder="Cashier"   className="input-field" style={{ maxWidth: 140 }} />
        <input type="date"             className="input-field" style={{ maxWidth: 160 }} />
        <select className="input-field" style={{ maxWidth: 140 }}>
          <option value="">All Methods</option><option>Cash</option><option>Card</option><option>Wallet</option>
        </select>
        <select className="input-field" style={{ maxWidth: 140 }}>
          <option value="">All Status</option><option>Paid</option><option>Refunded</option><option>Pending</option>
        </select>
        <button className="btn-primary px-4 py-2 text-sm">Apply</button>
        <button className="btn-secondary px-3 py-2 text-sm">Reset</button>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        <table className="data-table">
          <thead>
            <tr><th>TXN ID ↕</th><th>Customer</th><th>Cashier</th><th>Date & Time ↕</th><th>Items</th><th>Method</th><th>Amount ↕</th><th>Status</th><th>Receipt</th></tr>
          </thead>
          <tbody>
            {allTxns.map(t => (
              <tr key={t.id}>
                <td><span className="mono text-xs font-medium">{t.id}</span></td>
                <td className="text-sm font-medium">{t.customer}</td>
                <td className="text-sm" style={{ color: '#475569' }}>{t.cashier}</td>
                <td className="text-sm" style={{ color: '#475569' }}>{t.datetime}</td>
                <td className="text-sm">{t.items}</td>
                <td className="text-sm">{t.method}</td>
                <td className="text-sm font-semibold">{t.amount}</td>
                <td><Badge status={t.status} /></td>
                <td><button className="btn-outline text-xs px-3 py-1.5">↓ Receipt</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination current={1} total={6} label="Showing 1–10 of 3,240 transactions" />
      </div>
    </AdminLayout>
  );
}
