// src/pages/admin/AddStaff.jsx
import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Button, Input, Toast } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { useAction } from '../../hooks/useService';
import { addStaff, updateStaff } from '../../services/staffService';

const EMPTY = { 
  username: '', 
  first_name: '', 
  last_name: '', 
  email: '', 
  password: '', 
  phone: '', 
  role: 'Cashier', 
  status: 'Active' 
};

export default function AddStaff() {
  const { setCurrentPage, editTarget } = useAdmin();
  const { execute, loading } = useAction();
  const isEdit = !!editTarget?.id;

  const [form, setForm] = useState(isEdit ? {
    username: editTarget.username || '',
    first_name: editTarget.name?.split(' ')[0] || '',
    last_name: editTarget.name?.split(' ').slice(1).join(' ') || '',
    email: editTarget.email || '',
    password: '', // Don't populate password for security
    phone: editTarget.phone === '—' ? '' : editTarget.phone || '',
    role: editTarget.role || 'Cashier',
    status: editTarget.status || 'Active'
  } : EMPTY);

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const set = key => e => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const showToast = (msg, type = 'success') => { 
    setToast({ visible: true, message: msg, type }); 
    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3000); 
  };

  const handleSubmit = async () => {
    if (!form.username || !form.first_name || !form.email || (!isEdit && !form.password)) { 
      showToast('Username, First Name, Email, and Password are required.', 'error'); 
      return; 
    }

    if (!isEdit && (form.password.length < 8 || !/\d/.test(form.password))) {
      showToast('Password must be at least 8 characters and contain at least one number.', 'error');
      return;
    }
    
    try {
      await execute(
        () => isEdit ? updateStaff(editTarget.id, form) : addStaff(form),
        () => { 
          showToast(isEdit ? 'Staff updated!' : 'Staff added!', 'success'); 
          setTimeout(() => setCurrentPage('staff'), 800); 
        }
      );
    } catch (err) {
      showToast(err?.message || 'Failed to save staff.', 'error');
    }
  };

  const preview = form.first_name ? (form.first_name[0] + (form.last_name ? form.last_name[0] : '')).toUpperCase() : 'ST';

  return (
    <AdminLayout>
      <PageHeader
        breadcrumb={<span className="cursor-pointer hover:text-[#1e3a5f]" onClick={() => setCurrentPage('staff')}>← Back to Staff</span>}
        title={isEdit ? 'Edit Staff Member' : 'Add New Staff Member'}
        actions={
          <>
            <Button variant="secondary" onClick={() => setCurrentPage('staff')}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={loading}>{loading ? 'Saving…' : isEdit ? 'Update Staff' : 'Add Staff'}</Button>
          </>
        }
      />
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Login Credentials</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Username *" value={form.username} onChange={set('username')} placeholder="e.g. roshan_kc" />
              <div className="space-y-1">
                <Input label={isEdit ? "New Password (optional)" : "Password *"} type="password" value={form.password} onChange={set('password')} placeholder="••••••••" />
                <p className="text-[10px] text-gray-400 px-1">Min. 8 characters and 1 number required.</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Personal Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name *" value={form.first_name} onChange={set('first_name')} placeholder="e.g. Roshan" />
              <Input label="Last Name" value={form.last_name} onChange={set('last_name')} placeholder="e.g. KC" />
              <Input label="Email *" type="email" value={form.email} onChange={set('email')} placeholder="staff@store.np" />
              <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="+977-9800-000000" />
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>System Access</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Role *</label>
                <select className="w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f]" value={form.role} onChange={set('role')}>
                  <option value="Cashier">Cashier</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-5">
          <div className="bg-white rounded-xl border p-5 text-center" style={{ borderColor: '#e2e8f0' }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3" style={{ background: '#1e3a5f' }}>{preview}</div>
            <p className="text-sm font-semibold text-[#0f172a]">{form.first_name ? `${form.first_name} ${form.last_name}` : 'New Staff'}</p>
            <p className="text-xs text-[#94a3b8] mt-0.5">{form.role} · @{form.username || 'username'}</p>
          </div>
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Account Status</h3>
            <div className="space-y-2">
              {['Active', 'Inactive'].map(s => (
                <label key={s} className="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="st-status" value={s} checked={form.status === s} onChange={set('status')} className="accent-[#1e3a5f]" />
                  <span className="text-sm text-[#0f172a]">{s}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Toast message={toast.message} visible={toast.visible} type={toast.type} />
    </AdminLayout>
  );
}
