// src/pages/admin/Inventory.jsx
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Badge, Button, StatCard, Pagination } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { inventory } from '../../data/mockData';

export default function Inventory() {
  const { setCurrentPage } = useAdmin();
  return (
    <AdminLayout>
      <PageHeader
        breadcrumb="Real-time stock levels"
        title="Inventory"
        actions={
          <>
            <Button variant="secondary">↓ Export</Button>
            <Button variant="primary" onClick={() => setCurrentPage('add-stock')}>+ Add Stock</Button>
          </>
        }
      />
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total SKUs"    value="342" />
        <StatCard label="In Stock"      value="318" progress={93} />
        <StatCard label="Low Stock"     value="7"   progress={15} />
        <StatCard label="Out of Stock"  value="17"  progress={5}  />
      </div>
      <div className="flex items-center gap-3 mb-4">
        <input placeholder="Search product..." className="input-field" style={{ maxWidth: 220 }} />
        <input placeholder="Category"          className="input-field" style={{ maxWidth: 140 }} />
        <input placeholder="Status"            className="input-field" style={{ maxWidth: 140 }} />
        <input placeholder="Supplier"          className="input-field" style={{ maxWidth: 160 }} />
        <button className="btn-primary px-4 py-2 text-sm">Filter</button>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        <table className="data-table">
          <thead>
            <tr><th>Product</th><th>SKU</th><th>Category</th><th>Stock ↕</th><th>Reorder At</th><th>Last Restock</th><th>Supplier</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {inventory.map(item => {
              const max = Math.max(item.stock, item.reorderAt * 2, 50);
              const pct = Math.min((item.stock / max) * 100, 100);
              return (
                <tr key={item.id}>
                  <td className="font-medium text-sm">{item.name}</td>
                  <td><span className="mono text-xs" style={{ color: '#94a3b8' }}>{item.sku}</span></td>
                  <td className="text-sm">{item.category}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold w-6">{item.stock}</span>
                      <div className="w-20 progress-bar">
                        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: item.status === 'Out of Stock' ? '#dc2626' : item.status === 'Low Stock' ? '#d97706' : '#1e3a5f' }} />
                      </div>
                    </div>
                  </td>
                  <td className="text-sm">{item.reorderAt}</td>
                  <td className="text-sm" style={{ color: '#475569' }}>{item.lastRestock}</td>
                  <td className="text-sm" style={{ color: '#475569' }}>{item.supplier}</td>
                  <td><Badge status={item.status} /></td>
                  <td>
                    {item.status === 'In Stock'
                      ? <button className="btn-outline" onClick={() => setCurrentPage('add-stock')}>Adjust</button>
                      : <button className="btn-primary text-xs px-3 py-1.5" onClick={() => setCurrentPage('new-order')}>Reorder</button>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Pagination current={1} total={2} label="Showing 1–5 of 342 items" />
      </div>
    </AdminLayout>
  );
}
