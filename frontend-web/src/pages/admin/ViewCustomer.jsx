// src/pages/admin/ViewCustomer.jsx
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Badge, Button, StatCard } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';

const customer = { id:1, name:'Sunita KC', phone:'+977-9812-009934', email:'sunita@email.com', orders:28, lastVisit:'Yesterday', value:'Rs 31,200', type:'Registered', joined:'12 Jan 2025', address:'Lalitpur, Kathmandu', dob:'15 Jun 1990' };
const recentOrders = [
  { id:'TXN-0001', date:'Yesterday 14:32', items:5, method:'Card',   amount:'Rs 1,840', status:'Paid'     },
  { id:'TXN-0002', date:'9 Apr 2026 10:15',items:2, method:'Wallet', amount:'Rs 540',   status:'Paid'     },
  { id:'TXN-0003', date:'7 Apr 2026 16:00',items:8, method:'Cash',   amount:'Rs 3,200', status:'Paid'     },
  { id:'TXN-0004', date:'1 Apr 2026 11:45',items:1, method:'Card',   amount:'Rs 450',   status:'Refunded' },
];
const topItems = [
  { name:'Amul Full Cream Milk 1L',   count:14, spend:'Rs 1,190' },
  { name:'Organic Basmati Rice 5kg',  count:6,  spend:'Rs 2,040' },
  { name:'Wai Wai Noodles',           count:22, spend:'Rs 550'   },
];

export default function ViewCustomer() {
  const { setCurrentPage } = useAdmin();
  return (
    <AdminLayout>
      <PageHeader
        breadcrumb={<span className="cursor-pointer hover:text-[#1e3a5f] transition-colors" onClick={() => setCurrentPage('customers')}>← Back to Customers</span>}
        title="Customer Profile"
        actions={
          <>
            <Button variant="secondary" onClick={() => setCurrentPage('customers')}>← Back</Button>
            <Button variant="outline">Edit Profile</Button>
            <Button variant="primary">Send Offer</Button>
          </>
        }
      />
      <div className="grid grid-cols-3 gap-5">
        <div className="space-y-5">
          <div className="bg-white rounded-xl border p-5" style={{ borderColor:'#e2e8f0' }}>
            <div className="flex items-center gap-3 mb-4 pb-4 border-b" style={{ borderColor:'#e2e8f0' }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white" style={{ background:'#1e3a5f' }}>
                {customer.name.split(' ').map(n=>n[0]).join('')}
              </div>
              <div><p className="font-semibold text-[#0f172a]">{customer.name}</p><Badge status={customer.type} /></div>
            </div>
            <div className="space-y-2.5">
              {[{label:'Phone',value:customer.phone},{label:'Email',value:customer.email},{label:'Address',value:customer.address},{label:'Joined',value:customer.joined}].map(f => (
                <div key={f.label} className="flex justify-between text-sm">
                  <span className="text-[#94a3b8]">{f.label}</span>
                  <span className="font-medium text-[#0f172a]">{f.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <StatCard label="Total Orders"      value={customer.orders} />
            <StatCard label="Lifetime Value"    value={customer.value}  />
            <StatCard label="Last Visit"        value={customer.lastVisit} />
          </div>
        </div>
        <div className="col-span-2 space-y-5">
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor:'#e2e8f0' }}>
            <div className="px-5 py-4 border-b" style={{ borderColor:'#e2e8f0' }}><h3 className="text-sm font-semibold text-[#0f172a]">Recent Orders</h3></div>
            <table className="data-table">
              <thead><tr><th>TXN ID</th><th>Date</th><th>Items</th><th>Method</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.id}>
                    <td><span className="mono text-xs">{o.id}</span></td>
                    <td className="text-sm text-[#475569]">{o.date}</td>
                    <td className="text-sm">{o.items}</td>
                    <td className="text-sm">{o.method}</td>
                    <td className="text-sm font-semibold">{o.amount}</td>
                    <td><Badge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white rounded-xl border p-5" style={{ borderColor:'#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4">Top Purchased Items</h3>
            <div className="space-y-3">
              {topItems.map(item => (
                <div key={item.name} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor:'#e2e8f0' }}>
                  <p className="text-sm font-medium text-[#0f172a]">{item.name}</p>
                  <div className="flex gap-4 text-xs text-[#94a3b8]">
                    <span>{item.count}x</span>
                    <span className="font-semibold text-[#0f172a]">{item.spend}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
