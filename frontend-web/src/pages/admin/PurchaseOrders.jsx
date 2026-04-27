// src/pages/admin/PurchaseOrders.jsx — IMPROVED: real data, search, receive order updates stock
import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Badge, Button, StatCard, Pagination } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { useApp } from '../../context/AppContext';

export default function PurchaseOrders() {
  const { setCurrentPage, navigateTo } = useAdmin();
  const { orders, receiveOrder } = useApp();

  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [page, setPage]             = useState(1);
  const [receiving, setReceiving]   = useState(null);
  const PAGE_SIZE = 10;

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.id.toLowerCase().includes(q) || o.supplier.toLowerCase().includes(q);
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pendingCount  = orders.filter(o => o.status === 'Pending').length;
  const receivedCount = orders.filter(o => o.status === 'Received').length;

  const handleReceive = async (order) => {
    setReceiving(order.id);
    // Pass items if embedded; otherwise stock update won't happen from here
    await receiveOrder(order.id, order.orderItems || []);
    setReceiving(null);
  };

  return (
    <AdminLayout>
      <PageHeader
        breadcrumb="Supplier Orders"
        title="Purchase Orders"
        actions={<Button variant="primary" onClick={() => setCurrentPage('new-order')}>+ New Order</Button>}
      />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Pending Orders"  value={pendingCount}  progress={Math.round((pendingCount/Math.max(orders.length,1))*100)} />
        <StatCard label="Received"        value={receivedCount} progress={Math.round((receivedCount/Math.max(orders.length,1))*100)} />
        <StatCard label="Total Orders"    value={orders.length} />
      </div>
      <div className="flex items-center gap-3 mb-4">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search PO# or supplier..." className="input-field" style={{ maxWidth: 240 }} />
        <select value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="input-field" style={{ maxWidth: 140 }}>
          <option value="">All Status</option>
          <option>Pending</option><option>Received</option>
        </select>
        <button onClick={() => { setSearch(''); setStatus(''); setPage(1); }}
          className="px-4 py-2 text-sm border border-[#e2e8f0] rounded-lg text-[#475569] hover:border-[#bfdbfe] bg-white">Reset</button>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        <table className="data-table">
          <thead>
            <tr><th>PO Number</th><th>Supplier</th><th>Items</th><th>Ordered</th><th>Expected</th><th>Value</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {paged.map(po => (
              <tr key={po.id}>
                <td><span className="mono text-xs font-medium">{po.id}</span></td>
                <td className="text-sm font-semibold">{po.supplier}</td>
                <td className="text-sm">{po.items} items</td>
                <td className="text-sm" style={{ color: '#475569' }}>{po.ordered}</td>
                <td className="text-sm" style={{ color: '#475569' }}>{po.expected}</td>
                <td className="text-sm font-semibold">{po.value}</td>
                <td><Badge status={po.status} /></td>
                <td>
                  <div className="flex gap-1">
                    <button
                      onClick={() => navigateTo('view-purchase-order', po)}
                      className="btn-outline text-xs"
                    >View</button>
                    {po.status === 'Pending' ? (
                      <button
                        onClick={() => handleReceive(po)}
                        disabled={receiving === po.id}
                        className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50"
                      >
                        {receiving === po.id ? 'Updating…' : 'Receive'}
                      </button>
                    ) : (
                      <span className="text-xs text-[#94a3b8] px-2">Received</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr><td colSpan={8} className="text-center py-10 text-sm text-[#94a3b8]">No orders found</td></tr>
            )}
          </tbody>
        </table>
        <Pagination current={page} total={totalPages}
          label={`Showing ${(page-1)*PAGE_SIZE+1}–${Math.min(page*PAGE_SIZE,filtered.length)} of ${filtered.length} orders`}
          onPrev={() => setPage(p => Math.max(1,p-1))} onNext={() => setPage(p => Math.min(totalPages,p+1))} />
      </div>
    </AdminLayout>
  );
}
