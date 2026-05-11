// src/pages/admin/Products.jsx — IMPROVED: uses AppContext for live shared data
import { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Badge, Button, Pagination, StatCard, ConfirmDialog, Toast, LoadingSpinner } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { useApp } from '../../context/AppContext';
import { exportCSV } from '../../utils/exportData';

const STATUSES = ['All', 'Active', 'Low Stock', 'Out of Stock'];

export default function Products() {
  const { setCurrentPage, setEditTarget } = useAdmin();
  const { products, categories, deleteProduct, loading, currencySymbol } = useApp();

  const [query, setQuery] = useState('');
  const [catFilter, setCat] = useState('All');
  const [statusFilter, setStatus] = useState('All');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const PER_PAGE = 10;

  const showToast = (message) => { setToast({ visible: true, message }); setTimeout(() => setToast({ visible: false, message: '' }), 2500); };

  const filtered = products.filter(p => {
    const q = query.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
    const matchCat = catFilter === 'All' || p.category === catFilter;
    const matchStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {
    if (totalPages === 0 && page !== 1) {
      setPage(1);
      return;
    }
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleDelete = async () => {
    try {
      await deleteProduct(deleteId);
      setDeleteId(null);
      showToast('Product deleted successfully.');
    } catch (error) {
      setDeleteId(null);
      showToast(error?.message || 'Failed to delete product.', 'error');
    }
  };

  const handleExport = () => {
    const rows = products.map(({ name, sku, category, priceNum, stock, supplier, status }) =>
      ({ Name: name, SKU: sku, Category: category, Price: priceNum, Stock: stock, Supplier: supplier, Status: status }));
    exportCSV(rows, `products-${new Date().toISOString().slice(0, 10)}`);
  };

  const handleEdit = (product) => { setEditTarget(product); setCurrentPage('edit-product'); };

  return (
    <AdminLayout>
      <Toast visible={toast.visible} message={toast.message} />
      {loading ? (
        <div className="flex items-center justify-center min-h-[55vh]">
          <div className="rounded-xl border bg-white px-8 py-10 flex flex-col items-center gap-4" style={{ borderColor: '#e2e8f0' }}>
            <LoadingSpinner size={28} />
            <div className="text-center">
              <p className="text-sm font-semibold text-[#0f172a]">Loading products</p>
              <p className="text-xs text-[#94a3b8] mt-1">Fetching data from the backend database…</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <PageHeader
            breadcrumb="Product Catalogue"
            title="Products"
            actions={
              <>
                <Button variant="secondary" onClick={() => setCurrentPage('categories')}>Manage Categories</Button>
                <Button variant="secondary" onClick={handleExport}>↓ Export CSV</Button>
                <Button variant="primary" onClick={() => { setEditTarget(null); setCurrentPage('add-product'); }}>+ Add Product</Button>
              </>
            }
          />

          <div className="grid grid-cols-4 gap-4 mb-5">
            <StatCard label="Total Products" value={products.length} />
            <StatCard label="Active" value={products.filter(p => p.status === 'Active').length} navy />
            <StatCard label="Low Stock" value={products.filter(p => p.status === 'Low Stock').length} />
            <StatCard label="Out of Stock" value={products.filter(p => p.status === 'Out of Stock').length} />
          </div>

          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <input value={query} onChange={e => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search name, SKU or category…" className="input-field" style={{ maxWidth: 260 }} />
            <select value={catFilter} onChange={e => { setCat(e.target.value); setPage(1); }} className="input-field" style={{ maxWidth: 160 }}>
              <option>All</option>
              {categories.map(c => <option key={c.category_id} value={c.category_name}>{c.category_name}</option>)}
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
                    <td className="font-semibold text-sm text-[#0f172a]">
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          <div className="w-8 h-8 rounded border overflow-hidden flex-shrink-0" style={{ borderColor: '#e2e8f0' }}>
                            <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded border flex items-center justify-center bg-[#f8fafc] flex-shrink-0" style={{ borderColor: '#e2e8f0' }}>
                            <svg className="w-4 h-4 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                          </div>
                        )}
                        <span>{p.name}</span>
                      </div>
                    </td>
                    <td><span className="mono text-xs text-[#94a3b8]">{p.sku}</span></td>
                    <td className="text-sm">{p.category}</td>
                    <td className="text-sm font-mono font-semibold">{currencySymbol} {p.priceNum?.toLocaleString('en-IN')}</td>
                    <td>
                      <span className="text-sm font-semibold">{p.stock}</span>
                    </td>
                    <td className="text-sm text-[#475569]">{p.supplier}</td>
                    <td><Badge status={p.status} /></td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn-outline" onClick={() => handleEdit(p)}>Edit</button>
                        <button onClick={() => setDeleteId(p.id)}
                          className="w-7 h-7 rounded border flex items-center justify-center hover:bg-[#fef2f2]" style={{ borderColor: '#e2e8f0' }}>
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#dc2626" strokeWidth="1.5">
                            <path d="M1 3h10M4 3V1.5h4V3M9.5 3l-.5 7.5H3L2.5 3" />
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
              label={`Showing ${Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–${Math.min(page * PER_PAGE, filtered.length)} of ${filtered.length}`}
              onPrev={() => setPage(p => Math.max(1, p - 1))} onNext={() => setPage(p => Math.min(totalPages, p + 1))} onPage={setPage} />
          </div>

          <ConfirmDialog
            isOpen={!!deleteId}
            title="Delete Product"
            message="This will permanently remove the product from inventory. This cannot be undone."
            onConfirm={handleDelete}
            onCancel={() => setDeleteId(null)}
          />
        </>
      )}
    </AdminLayout>
  );
}
