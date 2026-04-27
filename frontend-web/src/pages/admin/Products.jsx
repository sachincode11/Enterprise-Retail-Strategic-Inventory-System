// src/pages/admin/Products.jsx — IMPROVED: uses AppContext for live shared data
import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Badge, Button, Pagination, StatCard, ConfirmDialog, Toast } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { useApp } from '../../context/AppContext';
import { exportCSV } from '../../utils/exportData';

const CATEGORIES = ['All', 'Grains', 'Dairy', 'Instant Food', 'Condiments', 'Household', 'Beverages', 'Oils & Fats', 'Snacks'];
const STATUSES   = ['All', 'Active', 'Low Stock', 'Out of Stock'];

export default function Products() {
  const { navigateTo, setCurrentPage, setEditTarget } = useAdmin();
  const { products, deleteProduct } = useApp();

  const [query, setQuery]         = useState('');
  const [catFilter, setCat]       = useState('All');
  const [statusFilter, setStatus] = useState('All');
  const [page, setPage]           = useState(1);
  const [deleteId, setDeleteId]   = useState(null);
  const [toast, setToast]         = useState({ visible: false, message: '' });
  const PER_PAGE = 10;

  const showToast = (message) => { setToast({ visible: true, message }); setTimeout(() => setToast({ visible: false, message: '' }), 2500); };

  const filtered = products.filter(p => {
    const q = query.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
    const matchCat    = catFilter === 'All' || p.category === catFilter;
    const matchStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleDelete = async () => {
    await deleteProduct(deleteId);
    setDeleteId(null);
    showToast('Product deleted successfully.');
  };

  const handleExport = () => {
    const rows = products.map(({ name, sku, category, priceNum, stock, supplier, status }) =>
      ({ Name: name, SKU: sku, Category: category, Price: priceNum, Stock: stock, Supplier: supplier, Status: status }));
    exportCSV(rows, `products-${new Date().toISOString().slice(0, 10)}`);
  };

  const handleEdit = (product) => { setEditTarget(product); setCurrentPage('add-product'); };

  return (
    <AdminLayout>
      <Toast visible={toast.visible} message={toast.message} />
      <PageHeader
        breadcrumb="Product Catalogue"
        title="Products"
        actions={
          <>
            <Button variant="secondary" onClick={handleExport}>↓ Export CSV</Button>
            <Button variant="primary" onClick={() => { setEditTarget(null); setCurrentPage('add-product'); }}>+ Add Product</Button>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard label="Total Products"  value={products.length} progress={55} />
        <StatCard label="Active"          value={products.filter(p => p.status === 'Active').length} progress={75} navy />
        <StatCard label="Low Stock"       value={products.filter(p => p.status === 'Low Stock').length} progress={25} />
        <StatCard label="Out of Stock"    value={products.filter(p => p.status === 'Out of Stock').length} progress={10} />
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input value={query} onChange={e => { setQuery(e.target.value); setPage(1); }}
          placeholder="Search name, SKU or category…" className="input-field" style={{ maxWidth: 260 }} />
        <select value={catFilter} onChange={e => { setCat(e.target.value); setPage(1); }} className="input-field" style={{ maxWidth: 160 }}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1); }} className="input-field" style={{ maxWidth: 160 }}>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={() => { setQuery(''); setCat('All'); setStatus('All'); setPage(1); }}
          className="px-4 py-2 text-sm border border-[#e2e8f0] rounded-lg text-[#475569] hover:border-[#bfdbfe] bg-white">Reset</button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        <table className="data-table">
          <thead>
            <tr><th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Supplier</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {paginated.map(p => (
              <tr key={p.id}>
                <td className="font-semibold text-sm text-[#0f172a]">{p.name}</td>
                <td><span className="mono text-xs text-[#94a3b8]">{p.sku}</span></td>
                <td className="text-sm">{p.category}</td>
                <td className="text-sm font-mono font-semibold">Rs {p.priceNum?.toLocaleString('en-IN')}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold w-8">{p.stock}</span>
                    <div className="w-16 progress-bar">
                      <div className="progress-bar-fill" style={{
                        width: `${Math.min((p.stock / 50) * 100, 100)}%`,
                        background: p.status === 'Out of Stock' ? '#dc2626' : p.status === 'Low Stock' ? '#d97706' : '#1e3a5f',
                      }} />
                    </div>
                  </div>
                </td>
                <td className="text-sm text-[#475569]">{p.supplier}</td>
                <td><Badge status={p.status} /></td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn-outline" onClick={() => handleEdit(p)}>Edit</button>
                    <button onClick={() => setDeleteId(p.id)}
                      className="w-7 h-7 rounded border flex items-center justify-center hover:bg-[#fef2f2]" style={{ borderColor: '#e2e8f0' }}>
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#dc2626" strokeWidth="1.5">
                        <path d="M1 3h10M4 3V1.5h4V3M9.5 3l-.5 7.5H3L2.5 3"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr><td colSpan={8} className="text-center py-10 text-sm text-[#94a3b8]">No products match your filters</td></tr>
            )}
          </tbody>
        </table>
        <Pagination current={page} total={totalPages}
          label={`Showing ${Math.min((page-1)*PER_PAGE+1, filtered.length)}–${Math.min(page*PER_PAGE, filtered.length)} of ${filtered.length}`}
          onPrev={() => setPage(p => Math.max(1, p-1))} onNext={() => setPage(p => Math.min(totalPages, p+1))} onPage={setPage} />
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Product"
        message="This will permanently remove the product from inventory. This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </AdminLayout>
  );
}
