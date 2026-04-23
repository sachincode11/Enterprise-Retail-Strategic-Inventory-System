// src/pages/admin/Discounts.jsx
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Badge, Button, StatCard } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { discounts } from '../../data/mockData';

export default function Discounts() {
  const { setCurrentPage } = useAdmin();
  return (
    <AdminLayout>
      <PageHeader
        breadcrumb="Promotions & Offers"
        title="Discounts"
        actions={<Button variant="primary" onClick={() => setCurrentPage('add-discount')}>+ New Discount</Button>}
      />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Active Discounts"    value="4"   />
        <StatCard label="Redeemed This Month" value="312" progress={60} />
        <StatCard label="Avg. Discount Applied" value="8.2%" />
      </div>
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        <table className="data-table">
          <thead>
            <tr><th>Discount Name</th><th>Type</th><th>Value</th><th>Applies To</th><th>Valid Period</th><th>Used</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {discounts.map(d => (
              <tr key={d.id}>
                <td>
                  <p className="text-sm font-semibold">{d.name}</p>
                  <p className="mono text-xs" style={{ color: '#94a3b8' }}>{d.code}</p>
                </td>
                <td className="text-sm">{d.type}</td>
                <td className="text-sm font-semibold">{d.value}</td>
                <td className="text-sm" style={{ color: '#475569' }}>{d.appliesTo}</td>
                <td className="text-sm" style={{ color: '#475569' }}>{d.period}</td>
                <td className="text-sm">{d.used} uses</td>
                <td><Badge status={d.status} /></td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn-outline" onClick={() => setCurrentPage('add-discount')}>Edit</button>
                    <button className="w-7 h-7 rounded border flex items-center justify-center" style={{ borderColor: '#e2e8f0' }}>
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#dc2626" strokeWidth="1.5"><path d="M1 3h10M4 3V1.5h4V3M9.5 3l-.5 7.5H3L2.5 3"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
