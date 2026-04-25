// src/pages/admin/Suppliers.jsx
// Supplier checklist bug fixed — now fully interactive and selectable.
import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Badge, Button, Pagination, ConfirmDialog, EmptyState, LoadingSpinner, Toast } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { useService, useAction } from '../../hooks/useService';
import { useSearch } from '../../hooks/useSearch';
import { getSuppliers, deleteSupplier } from '../../services/supplierService';
import { exportCSV } from '../../utils/exportData';

export default function Suppliers() {
  const { navigateTo } = useAdmin();
  const { data: suppliers, loading, refetch } = useService(getSuppliers);
  const { execute } = useAction();
  const { query, setQuery, filtered, clearFilters } = useSearch(suppliers || [], ['name', 'email', 'contact']);

  const [selected, setSelected]   = useState(new Set()); // fixed interactive checklist
  const [deleteId, setDeleteId]   = useState(null);
  const [page, setPage]           = useState(1);
  const [toast, setToast]         = useState({ visible: false, message: '' });
  const PER_PAGE = 10;

  const showToast = (msg) => { setToast({ visible: true, message: msg }); setTimeout(() => setToast({ visible: false, message: '' }), 2500); };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(s => s.id)));
  };

  const handleDelete = async () => {
    await execute(() => deleteSupplier(deleteId));
    refetch();
    showToast('Supplier deleted.');
  };

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <AdminLayout>
      <PageHeader
        breadcrumb="Vendor Management"
        title="Suppliers"
        actions={
          <>
            {selected.size > 0 && (
              <span className="text-xs text-[#475569] px-3 py-2 bg-white rounded-lg border border-[#e2e8f0]">{selected.size} selected</span>
            )}
            <Button variant="secondary" onClick={() => suppliers && exportCSV(suppliers, 'suppliers')}>Export CSV</Button>
            <Button variant="primary" onClick={() => navigateTo('add-supplier')}>+ Add Supplier</Button>
          </>
        }
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#94a3b8" strokeWidth="1.5"><circle cx="7" cy="7" r="5"/><path d="M11 11l3 3" strokeLinecap="round"/></svg>
          <input value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} placeholder="Search supplier..." className="input-field pl-8" style={{ width: 260 }} />
        </div>
        {query && <button onClick={() => { clearFilters(); setPage(1); }} className="btn-outline text-xs">Clear</button>}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        {loading ? <LoadingSpinner /> : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    {/* Interactive select-all checkbox */}
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && selected.size === filtered.length}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded cursor-pointer"
                      style={{ accentColor: '#1e3a5f' }}
                    />
                  </th>
                  <th>Supplier</th><th>Contact</th><th>Products</th><th>Last Order</th><th>Lead Time</th><th>Total Ordered</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0
                  ? <tr><td colSpan={9}><EmptyState message="No suppliers found." /></td></tr>
                  : paginated.map(s => (
                    <tr key={s.id} style={{ background: selected.has(s.id) ? '#f0f9ff' : '' }}>
                      <td>
                        {/* Interactive per-row checkbox — fixed bug */}
                        <input
                          type="checkbox"
                          checked={selected.has(s.id)}
                          onChange={() => toggleSelect(s.id)}
                          className="w-4 h-4 rounded cursor-pointer"
                          style={{ accentColor: '#1e3a5f' }}
                        />
                      </td>
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
                          <button className="btn-outline" onClick={() => navigateTo('add-supplier', s)}>Edit</button>
                          <button className="btn-outline" onClick={() => navigateTo('new-order', s)}>New PO</button>
                          <button className="btn-outline" style={{ color: '#ef4444', borderColor: '#fecaca' }} onClick={() => setDeleteId(s.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
            <Pagination current={page} total={Math.ceil(filtered.length / PER_PAGE)} label={`${filtered.length} suppliers`} onPage={setPage} />
          </>
        )}
      </div>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Supplier" message="Delete this supplier? Existing purchase orders will not be affected." />
      <Toast message={toast.message} visible={toast.visible} />
    </AdminLayout>
  );
}
