// src/pages/admin/Customers.jsx — IMPROVED: real data, search+filter, export
import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Badge, Button, StatCard, Pagination } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { useApp } from '../../context/AppContext';
import { exportCSV } from '../../utils/exportData';

export default function Customers() {
  const { setCurrentPage, navigateTo } = useAdmin();
  const { customers, transactions, nowNP } = useApp();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Enrich customer data with real transaction metrics from the global state
  const enriched = customers.map(c => {
    // Robust matching: ID (loose) OR Name (trimmed) OR Phone (if available)
    const myTxns = transactions.filter(t => {
      const matchId = t.customerId && String(t.customerId) === String(c.id);
      const matchName = t.customer && c.name && t.customer.toLowerCase().trim() === c.name.toLowerCase().trim();
      const p1 = t.phone?.replace(/\D/g, '');
      const p2 = c.phone?.replace(/\D/g, '');
      const matchPhone = p1 && p2 && p1 === p2;
      return matchId || matchName || matchPhone;
    });
    
    const totalVal = myTxns.reduce((sum, t) => sum + (parseInt((t.amount || '').replace(/[^0-9]/g, ''), 10) || 0), 0);
    const lastVisit = myTxns.length > 0 ? myTxns[0].datetime || myTxns[0].date : '—';
    return { ...c, orders: myTxns.length, value: `Rs ${totalVal.toLocaleString()}`, lastVisit };
  });

  const filtered = enriched.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || (c.phone || '').includes(q) || (c.email || '').toLowerCase().includes(q);
    const matchType = !typeFilter || c.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const now = nowNP || new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const registered = customers.length;
  const guestsThisMonth = transactions.filter(t => {
    if (t.customerId || t.status === 'Voided') return false;
    const d = new Date(t.rawDate || t.datetime);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const totalValue = enriched.reduce((s, c) => {
    const n = parseInt((c.value || '').replace(/[^0-9]/g, ''), 10) || 0;
    return s + n;
  }, 0);

  // Sync page state if it goes out of bounds after filtering
  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    } else if (totalPages === 0 && page !== 1) {
      setPage(1);
    }
  }, [page, totalPages]);

  const handleExport = () => {
    const data = enriched.map(c => ({ Name: c.name, Phone: c.phone, Email: c.email, Orders: c.orders, 'Last Visit': c.lastVisit, 'Lifetime Value': c.value, Type: c.type }));
    exportCSV(data, `customers-${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <AdminLayout>
      <PageHeader
        breadcrumb="Registered & Guest Customers"
        title="Customers"
        actions={<Button variant="secondary" onClick={handleExport}>↓ Export CSV</Button>}
      />
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Registered" value={registered.toLocaleString()} />
        <StatCard label="Guests (This Month)" value={guestsThisMonth.toLocaleString()} />
        <StatCard label="Total Customers" value={(registered + guestsThisMonth).toLocaleString()} />
        <StatCard label="Total Lifetime Value" value={`Rs ${totalValue.toLocaleString()}`} />
      </div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search name, phone or email..." className="input-field" style={{ maxWidth: 280 }} />
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="input-field" style={{ maxWidth: 160 }}>
          <option value="">All Types</option>
          <option>Registered</option><option>Guest</option>
        </select>
        <button onClick={() => { setSearch(''); setTypeFilter(''); setPage(1); }}
          className="px-4 py-2 text-sm border border-[#e2e8f0] rounded-lg text-[#475569] hover:border-[#bfdbfe] bg-white">Reset</button>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        <table className="data-table">
          <thead>
            <tr><th>Customer</th><th>Phone</th><th>Email</th><th>Orders</th><th>Last Visit</th><th>Lifetime Value</th><th>Type</th><th></th></tr>
          </thead>
          <tbody>
            {paged.map(c => (
              <tr key={c.id}>
                <td className="font-semibold text-sm">{c.name}</td>
                <td className="text-sm mono" style={{ color: '#475569' }}>{c.phone || '—'}</td>
                <td className="text-sm" style={{ color: '#475569' }}>{c.email || '—'}</td>
                <td className="text-sm font-medium">{c.orders}</td>
                <td className="text-sm" style={{ color: '#475569' }}>{c.lastVisit}</td>
                <td className="text-sm font-semibold">{c.value}</td>
                <td><Badge status={c.type} /></td>
                <td>
                  <button className="btn-outline" onClick={() => navigateTo('view-customer', c)}>View</button>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr><td colSpan={8} className="text-center py-10 text-sm text-[#94a3b8]">No customers found</td></tr>
            )}
          </tbody>
        </table>
        <Pagination current={page} total={totalPages}
          label={`Showing ${filtered.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length} customers`}
          onPage={setPage}
          onPrev={() => setPage(p => Math.max(1, p - 1))} onNext={() => setPage(p => Math.min(totalPages, p + 1))} />
      </div>
    </AdminLayout>
  );
}
