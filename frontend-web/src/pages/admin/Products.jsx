// src/pages/admin/Products.jsx
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Badge, Button, Pagination, StatCard } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { products } from '../../data/mockData';

export default function Products() {
  const { setCurrentPage } = useAdmin();
  return (
    <AdminLayout>
      <PageHeader
        breadcrumb="Product Catalogue"
        title="Products"
        actions={
          <>
            <Button variant="secondary">↓ Export</Button>
            <Button variant="primary" onClick={() => setCurrentPage('add-product')}>+ Add Product</Button>
          </>
        }
      />
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Products"  value="342"  progress={100} />
        <StatCard label="Active"          value="318"  progress={93}  />
        <StatCard label="Low Stock"       value="7"    progress={15}  />
        <StatCard label="Out of Stock"    value="17"   progress={5}   />
      </div>
      <div className="flex items-center gap-3 mb-4">
        <input placeholder="Search product..." className="input-field" style={{ maxWidth: 220 }} />
        <input placeholder="Category"          className="input-field" style={{ maxWidth: 140 }} />
        <input placeholder="Status"            className="input-field" style={{ maxWidth: 120 }} />
        <button className="btn-primary px-4 py-2 text-sm">Filter</button>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        <table className="data-table">
          <thead>
            <tr><th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Supplier</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td className="font-semibold text-sm">{p.name}</td>
                <td><span className="mono text-xs" style={{ color: '#94a3b8' }}>{p.sku}</span></td>
                <td className="text-sm">{p.category}</td>
                <td className="text-sm font-semibold">{p.price}</td>
                <td className="text-sm">{p.stock}</td>
                <td className="text-sm" style={{ color: '#475569' }}>{p.supplier}</td>
                <td><Badge status={p.status} /></td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn-outline" onClick={() => setCurrentPage('add-product')}>Edit</button>
                    <button className="btn-outline" onClick={() => setCurrentPage('inventory')}>Stock</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination current={1} total={4} label="Showing 1–8 of 342 products" />
      </div>
    </AdminLayout>
  );
}
