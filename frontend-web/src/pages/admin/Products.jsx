// src/pages/admin/Products.jsx
import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Badge, Button, Pagination, StatCard, ConfirmDialog, EmptyState, LoadingSpinner, Toast } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { useService, useAction } from '../../hooks/useService';
import { useSearch } from '../../hooks/useSearch';
import { getProducts, deleteProduct } from '../../services/productService';
import { exportCSV, exportJSON } from '../../utils/exportData';

const CATEGORIES = ['All', 'Grains', 'Dairy', 'Instant Food', 'Condiments', 'Household', 'Beverages', 'Oils & Fats', 'Snacks'];
const STATUSES   = ['All', 'Active', 'Low Stock', 'Out of Stock'];

export default function Products() {
  const { navigateTo } = useAdmin();
  const { data: products, loading, refetch } = useService(getProducts);
  const { execute } = useAction();
  const { query, setQuery, filters, setFilters, filtered, clearFilters } = useSearch(products || [], ['name', 'sku', 'category', 'supplier']);

  const [page, setPage]           = useState(1);
  const [deleteId, setDeleteId]   = useState(null);
  const [toast, setToast]         = useState({ visible: false, message: '' });
  const PER_PAGE = 10;

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 2500);
  };

  const handleDelete = async () => {
    await execute(() => deleteProduct(deleteId));
    refetch();
    showToast('Product deleted successfully.');
  };

  const handleExport = (fmt) => {
    if (!products) return;
    const rows = products.map(({ id, name, sku, category, priceNum, stock, supplier, status }) => ({ id, name, sku, category, price: priceNum, stock, supplier, status }));
    fmt === 'csv' ? exportCSV(rows, 'products') : exportJSON(rows, 'products');
  };

  return (
    <AdminLayout>
      <PageHeader
        breadcrumb="Product Catalogue"
        title="Products"
        actions={
          <>
            <div className="relative group">
              <Button variant="secondary">Export</Button>
              <div className="absolute right-0 top-full mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-lg overflow-hidden z-10 hidden group-hover:block" style={{ minWidth: 120 }}>
                <button onClick={() => handleExport('csv')}  className="block w-full text-left px-4 py-2.5 text-sm hover:bg-[#f8fafc] text-[#0f172a]">Export CSV</button>
                <button onClick={() => handleExport('json')} className="block w-full text-left px-4 py-2.5 text-sm hover:bg-[#f8fafc] text-[#0f172a]">Export JSON</button>
              </div>
            </div>
            <Button variant="primary" onClick={() => navigateTo('add-product')}>+ Add Product</Button>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Products"  value={products?.length ?? '—'}                                                      progress={100} />
        <StatCard label="Active"          value={products?.filter(p => p.status === 'Active').length ?? '—'}                   progress={93}  />
        <StatCard label="Low Stock"       value={products?.filter(p => p.status === 'Low Stock').length ?? '—'}                progress={15}  />
        <StatCard label="Out of Stock"    value={products?.filter(p => p.status === 'Out of Stock').length ?? '—'}             progress={5}   />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#94a3b8" strokeWidth="1.5"><circle cx="7" cy="7" r="5"/><path d="M11 11l3 3" strokeLinecap="round"/></svg>
          <input value={query} onChange={e => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search products..." className="input-field pl-8" style={{ width: 240 }} />
        </div>
        <select value={filters.category || 'All'} onChange={e => { setFilters(f => ({ ...f, category: e.target.value })); setPage(1); }}
          className="input-field" style={{ width: 150 }}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filters.status || 'All'} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
          className="input-field" style={{ width: 140 }}>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        {(query || filters.category || filters.status) && (
          <button onClick={() => { clearFilters(); setPage(1); }} className="btn-outline text-xs">Clear filters</button>
        )}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        {loading ? <LoadingSpinner /> : (
          <>
            <table className="data-table">
              <thead>
                <tr><th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Supplier</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {paginated.length === 0
                  ? <tr><td colSpan={8}><EmptyState message="No products match your search." action={clearFilters} actionLabel="Clear filters" /></td></tr>
                  : paginated.map(p => (
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
                          <button className="btn-outline" onClick={() => navigateTo('add-product', p)}>Edit</button>
                          <button className="btn-outline" style={{ color: '#ef4444', borderColor: '#fecaca' }} onClick={() => setDeleteId(p.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
            <Pagination current={page} total={Math.ceil(filtered.length / PER_PAGE)} label={`Showing ${paginated.length} of ${filtered.length} products`} onPage={setPage} />
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
      />
      <Toast message={toast.message} visible={toast.visible} />
    </AdminLayout>
  );
}
