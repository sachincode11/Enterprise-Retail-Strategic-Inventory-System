// src/pages/admin/Staff.jsx
import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Badge, Button, StatCard, Avatar, ConfirmDialog, EmptyState, LoadingSpinner, Toast } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { useService, useAction } from '../../hooks/useService';
import { useSearch } from '../../hooks/useSearch';
import { getStaff, deleteStaff } from '../../services/staffService';
import { exportCSV } from '../../utils/exportData';

export default function Staff() {
  const { navigateTo } = useAdmin();
  const { data: staff, loading, refetch } = useService(getStaff);
  const { execute } = useAction();
  const { query, setQuery, filtered, clearFilters } = useSearch(staff || [], ['name', 'email', 'role']);

  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast]       = useState({ visible: false, message: '' });

  const showToast = (msg) => { setToast({ visible: true, message: msg }); setTimeout(() => setToast({ visible: false, message: '' }), 2500); };

  const handleDelete = async () => {
    await execute(() => deleteStaff(deleteId));
    refetch();
    showToast('Staff member removed.');
  };

  return (
    <AdminLayout>
      <PageHeader
        breadcrumb="User & Role Management"
        title="Staff"
        actions={
          <>
            <Button variant="secondary" onClick={() => staff && exportCSV(staff.map(({ id, name, email, role, store, status }) => ({ id, name, email, role, store, status })), 'staff')}>Export CSV</Button>
            <Button variant="primary" onClick={() => navigateTo('add-staff')}>+ Add Staff</Button>
          </>
        }
      />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Staff"       value={staff?.length ?? '—'} />
        <StatCard label="On Shift Today"    value={staff?.filter(s => s.shift === 'On Shift').length ?? '—'} progress={44} />
        <StatCard label="Active"            value={staff?.filter(s => s.status === 'Active').length ?? '—'} progress={80} />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#94a3b8" strokeWidth="1.5"><circle cx="7" cy="7" r="5"/><path d="M11 11l3 3" strokeLinecap="round"/></svg>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search staff..." className="input-field pl-8" style={{ width: 260 }} />
        </div>
        {query && <button onClick={clearFilters} className="btn-outline text-xs">Clear</button>}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        {loading ? <LoadingSpinner /> : (
          <table className="data-table">
            <thead>
              <tr><th>Staff Member</th><th>Email</th><th>Role</th><th>Store</th><th>Shift Today</th><th>Status</th><th>Last Login</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={8}><EmptyState message="No staff found." /></td></tr>
                : filtered.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Avatar initials={s.initials} size="sm" />
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
                        <button className="btn-outline" onClick={() => navigateTo('add-staff', s)}>Edit</button>
                        <button className="btn-outline" style={{ color: '#ef4444', borderColor: '#fecaca' }} onClick={() => setDeleteId(s.id)}>Remove</button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Remove Staff" message="Remove this staff member? Their access will be revoked immediately." confirmLabel="Remove" />
      <Toast message={toast.message} visible={toast.visible} />
    </AdminLayout>
  );
}
