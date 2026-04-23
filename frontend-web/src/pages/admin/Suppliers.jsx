// src/pages/admin/Suppliers.jsx
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Badge, Button, Pagination } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { suppliers } from '../../data/mockData';

export default function Suppliers() {
  const { setCurrentPage } = useAdmin();
  return (
    <AdminLayout>
      <PageHeader
        breadcrumb="Vendor Management"
        title="Suppliers"
        actions={<Button variant="primary" onClick={() => setCurrentPage('add-supplier')}>+ Add Supplier</Button>}
      />
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#94a3b8" strokeWidth="1.5"><circle cx="7" cy="7" r="5"/><path d="M11 11l3 3" strokeLinecap="round"/></svg>
          <input placeholder="Search supplier..." className="input-field pl-8" style={{ width: 260 }} />
        </div>
        <button className="btn-primary px-4 py-2 text-sm">Search</button>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        <table className="data-table">
          <thead>
            <tr><th>Supplier</th><th>Contact</th><th>Products</th><th>Last Order</th><th>Lead Time</th><th>Total Ordered</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {suppliers.map(s => (
              <tr key={s.id}>
                <td>
                  <p className="text-sm font-semibold">{s.name}</p>
                  <p className="text-xs" style={{ color: '#94a3b8' }}>{s.email}</p>
                </td>
                <td className="text-sm mono">{s.contact}</td>
                <td className="text-sm">{s.products} products</td>
                <td className="text-sm" style={{ color: '#475569' }}>{s.lastOrder}</td>
                <td className="text-sm">{s.leadTime}</td>
                <td className="text-sm font-semibold">{s.total}</td>
                <td><Badge status={s.status} /></td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn-outline" onClick={() => setCurrentPage('add-supplier')}>Edit</button>
                    <button className="btn-outline" onClick={() => setCurrentPage('new-order')}>New PO</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination current={1} total={1} label="Showing 1–4 of 4 suppliers" />
      </div>
    </AdminLayout>
  );
}
