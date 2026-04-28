// src/pages/admin/Inventory.jsx — IMPROVED: live data, search, inline adjust, export
import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Badge, Button, StatCard, Pagination } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { useApp } from '../../context/AppContext';
import { exportCSV } from '../../utils/exportData';

export default function Inventory() {
  const { setCurrentPage } = useAdmin();
  const { products, updateProduct, addStock } = useApp();

  const [search, setSearch]     = useState('');
  const [catFilter, setCat]     = useState('');
  const [statusFilter, setStatus] = useState('');
  const [editId, setEditId]     = useState(null);
  const [editStock, setEditStock] = useState('');
  const [page, setPage]         = useState(1);
  const PAGE_SIZE = 10;

  const categories = [...new Set(products.map(p => p.category))];

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    const matchCat = !catFilter || p.category === catFilter;
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(p => Math.min(p, totalPages));
  }, [totalPages]);

  const inStock    = products.filter(p => p.status === 'Active').length;
  const lowStock   = products.filter(p => p.status === 'Low Stock').length;
  const outOfStock = products.filter(p => p.status === 'Out of Stock').length;

  const startEdit = (item) => { setEditId(item.id); setEditStock(String(item.stock)); };
  const cancelEdit = () => { setEditId(null); setEditStock(''); };
  const saveEdit = async (item) => {
    const newStock = parseInt(editStock, 10);
    if (isNaN(newStock) || newStock < 0) return;
    await updateProduct(item.id, { stock: newStock });
    setEditId(null);
  };

  const handleExport = () => {
    const data = products.map(p => ({ Name: p.name, SKU: p.sku, Category: p.category, Stock: p.stock, Status: p.status, Supplier: p.supplier }));
    exportCSV(data, `inventory-${new Date().toISOString().slice(0,10)}`);
  };

  return (
    <AdminLayout>
      <PageHeader
        breadcrumb="Real-time stock levels"
        title="Inventory"
        actions={
          <>
            <Button variant="secondary" onClick={handleExport}>↓ Export CSV</Button>
            <Button variant="primary" onClick={() => setCurrentPage('add-stock')}>+ Add Stock</Button>
          </>
        }
      />
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total SKUs"    value={products.length} />
        <StatCard label="In Stock"      value={inStock}    progress={Math.round((inStock/Math.max(products.length,1))*100)} />
        <StatCard label="Low Stock"     value={lowStock}   progress={Math.round((lowStock/Math.max(products.length,1))*100)} />
        <StatCard label="Out of Stock"  value={outOfStock} progress={Math.round((outOfStock/Math.max(products.length,1))*100)} />
      </div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search product or SKU..." className="input-field" style={{ maxWidth: 240 }} />
        <select value={catFilter} onChange={e => { setCat(e.target.value); setPage(1); }}
          className="input-field" style={{ maxWidth: 160 }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="input-field" style={{ maxWidth: 160 }}>
          <option value="">All Status</option>
          <option>Active</option><option>Low Stock</option><option>Out of Stock</option>
        </select>
        <button onClick={() => { setSearch(''); setCat(''); setStatus(''); setPage(1); }}
          className="px-4 py-2 text-sm border border-[#e2e8f0] rounded-lg text-[#475569] hover:border-[#bfdbfe] bg-white">Reset</button>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        <table className="data-table">
          <thead>
            <tr><th>Product</th><th>SKU</th><th>Category</th><th>Stock</th><th>Supplier</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {paged.map(item => {
              const isEditing = editId === item.id;
              const max = Math.max(item.stock, 50);
              const pct = Math.min((item.stock / max) * 100, 100);
              return (
                <tr key={item.id}>
                  <td className="font-medium text-sm">{item.name}</td>
                  <td><span className="mono text-xs" style={{ color: '#94a3b8' }}>{item.sku}</span></td>
                  <td className="text-sm">{item.category}</td>
                  <td>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input type="number" value={editStock} onChange={e => setEditStock(e.target.value)}
                          className="w-20 px-2 py-1 text-sm border rounded-lg border-[#1e3a5f] outline-none" min={0} />
                        <button onClick={() => saveEdit(item)} className="text-xs text-white bg-[#1e3a5f] px-2 py-1 rounded">Save</button>
                        <button onClick={cancelEdit} className="text-xs text-[#94a3b8] px-2 py-1">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold w-8">{item.stock}</span>
                        <div className="w-20 progress-bar">
                          <div className="progress-bar-fill" style={{ width: `${pct}%`, background: item.status === 'Out of Stock' ? '#dc2626' : item.status === 'Low Stock' ? '#d97706' : '#1e3a5f' }} />
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="text-sm" style={{ color: '#475569' }}>{item.supplier}</td>
                  <td><Badge status={item.status} /></td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn-outline text-xs" onClick={() => startEdit(item)}>Adjust</button>
                      {(item.status === 'Low Stock' || item.status === 'Out of Stock') && (
                        <button className="btn-primary text-xs px-3 py-1.5" onClick={() => setCurrentPage('new-order')}>Reorder</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {paged.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-sm text-[#94a3b8]">No items match your search</td></tr>
            )}
          </tbody>
        </table>
        <Pagination current={page} total={totalPages} label={`Showing ${(page-1)*PAGE_SIZE+1}–${Math.min(page*PAGE_SIZE,filtered.length)} of ${filtered.length} items`}
          onPage={setPage}
          onPrev={() => setPage(p => Math.max(1,p-1))} onNext={() => setPage(p => Math.min(totalPages,p+1))} />
      </div>
    </AdminLayout>
  );
}
