// src/pages/admin/Staff.jsx
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Badge, Button, StatCard, Avatar } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { staff } from '../../data/mockData';

export default function Staff() {
  const { setCurrentPage } = useAdmin();
  return (
    <AdminLayout>
      <PageHeader
        breadcrumb="User & Role Management"
        title="Staff"
        actions={<Button variant="primary" onClick={() => setCurrentPage('add-staff')}>+ Add Staff</Button>}
      />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Staff"       value="9" />
        <StatCard label="On Shift Today"    value="4" progress={44} />
        <StatCard label="Avg. Txns / Shift" value="104" />
      </div>
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        <table className="data-table">
          <thead>
            <tr><th>Staff Member</th><th>Email</th><th>Role</th><th>Store</th><th>Shift Today</th><th>Status</th><th>Last Login</th><th></th></tr>
          </thead>
          <tbody>
            {staff.map(s => (
              <tr key={s.id}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <Avatar initials={s.initials} size="sm" color="#1e3a5f" />
                    <span className="text-sm font-semibold">{s.name}</span>
                  </div>
                </td>
                <td className="text-sm" style={{ color: '#475569' }}>{s.email}</td>
                <td><Badge status={s.role} /></td>
                <td className="text-sm mono" style={{ color: '#475569' }}>{s.store}</td>
                <td>{s.shift === '—' ? <span className="text-sm" style={{ color: '#94a3b8' }}>—</span> : <Badge status={s.shift} />}</td>
                <td><Badge status={s.status} /></td>
                <td className="text-sm" style={{ color: '#475569' }}>{s.lastLogin}</td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn-outline" onClick={() => setCurrentPage('add-staff')}>Edit</button>
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
