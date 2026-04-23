// src/pages/admin/Customers.jsx
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Badge, Button, StatCard, Pagination } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { customers } from '../../data/mockData';

export default function Customers() {
  const { setCurrentPage } = useAdmin();
  return (
    <AdminLayout>
      <PageHeader
        breadcrumb="Registered & Guest Customers"
        title="Customers"
        actions={<Button variant="secondary">↓ Export</Button>}
      />
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Registered"    value="1,847" progress={70} />
        <StatCard label="Guests (This Month)" value="412" />
        <StatCard label="Avg. Orders / Cust." value="8.4" />
        <StatCard label="Avg. Lifetime Value" value="Rs 4,820" />
      </div>
      <div className="flex items-center gap-3 mb-4">
        <input placeholder="Search customer..." className="input-field" style={{ maxWidth: 220 }} />
        <input placeholder="Type"              className="input-field" style={{ maxWidth: 140 }} />
        <input placeholder="Last visit"        className="input-field" style={{ maxWidth: 160 }} />
        <button className="btn-primary px-4 py-2 text-sm">Filter</button>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        <table className="data-table">
          <thead>
            <tr><th>Customer</th><th>Phone</th><th>Email</th><th>Orders</th><th>Last Visit</th><th>Lifetime Value</th><th>Type</th><th></th></tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id}>
                <td className="font-semibold text-sm">{c.name}</td>
                <td className="text-sm mono" style={{ color: '#475569' }}>{c.phone}</td>
                <td className="text-sm" style={{ color: '#475569' }}>{c.email}</td>
                <td className="text-sm font-medium">{c.orders}</td>
                <td className="text-sm" style={{ color: '#475569' }}>{c.lastVisit}</td>
                <td className="text-sm font-semibold">{c.value}</td>
                <td><Badge status={c.type} /></td>
                <td><button className="btn-outline" onClick={() => setCurrentPage('view-customer')}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination current={1} total={2} label="Showing 1–5 of 1,847 customers" />
      </div>
    </AdminLayout>
  );
}
