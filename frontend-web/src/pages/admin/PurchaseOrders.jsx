// src/pages/admin/PurchaseOrders.jsx
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Badge, Button, StatCard, Pagination } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { purchaseOrders } from '../../data/mockData';

export default function PurchaseOrders() {
  const { setCurrentPage } = useAdmin();
  return (
    <AdminLayout>
      <PageHeader
        breadcrumb="Supplier Orders"
        title="Purchase Orders"
        actions={<Button variant="primary" onClick={() => setCurrentPage('new-order')}>+ New Order</Button>}
      />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Pending Orders" value="3" progress={20} />
        <StatCard label="This Month"     value="14" progress={55} />
        <StatCard label="Avg. Lead Time" value="3.2d" />
      </div>
      <div className="flex items-center gap-3 mb-4">
        <input placeholder="PO Number"  className="input-field" style={{ maxWidth: 160 }} />
        <input placeholder="Supplier"   className="input-field" style={{ maxWidth: 160 }} />
        <input placeholder="Status"     className="input-field" style={{ maxWidth: 140 }} />
        <input placeholder="Date range" className="input-field" style={{ maxWidth: 160 }} />
        <button className="btn-primary px-4 py-2 text-sm">Filter</button>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        <table className="data-table">
          <thead>
            <tr><th>PO Number</th><th>Supplier</th><th>Items</th><th>Ordered</th><th>Expected</th><th>Value</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {purchaseOrders.map(po => (
              <tr key={po.id}>
                <td><span className="mono text-xs font-medium">{po.id}</span></td>
                <td className="text-sm font-semibold">{po.supplier}</td>
                <td className="text-sm">{po.items} items</td>
                <td className="text-sm" style={{ color: '#475569' }}>{po.ordered}</td>
                <td className="text-sm" style={{ color: '#475569' }}>{po.expected}</td>
                <td className="text-sm font-semibold">{po.value}</td>
                <td><Badge status={po.status} /></td>
                <td><button className="btn-outline" onClick={() => setCurrentPage('view-purchase-order')}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination current={1} total={2} label="Showing 1–5 of 41 orders" />
      </div>
    </AdminLayout>
  );
}
