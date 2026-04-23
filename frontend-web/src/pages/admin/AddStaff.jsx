// src/pages/admin/AddStaff.jsx
import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Button, Input } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';

export default function AddStaff() {
  const { setCurrentPage } = useAdmin();
  const [form, setForm] = useState({ name:'', email:'', phone:'', role:'Cashier', store:'KTM-001', shift:'Morning', employeeId:'', joiningDate:new Date().toISOString().split('T')[0], salary:'', emergencyContact:'', address:'', notes:'', status:'Active', pin:'' });
  const set = key => e => setForm(prev => ({ ...prev, [key]: e.target.value }));
  const handleSubmit = () => { if (!form.name||!form.email){alert('Name and email are required.');return;} alert('Staff member added successfully!'); setCurrentPage('staff'); };

  return (
    <AdminLayout>
      <PageHeader
        breadcrumb={<span className="cursor-pointer hover:text-[#1e3a5f] transition-colors" onClick={() => setCurrentPage('staff')}>← Back to Staff</span>}
        title="Add New Staff Member"
        actions={<><Button variant="secondary" onClick={() => setCurrentPage('staff')}>Cancel</Button><Button variant="primary" onClick={handleSubmit}>Add Staff</Button></>}
      />
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <div className="bg-white rounded-xl border p-5" style={{ borderColor:'#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor:'#e2e8f0' }}>Personal Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Full Name *" value={form.name} onChange={set('name')} placeholder="e.g. Roshan KC" className="col-span-2" />
              <Input label="Email *" type="email" value={form.email} onChange={set('email')} placeholder="staff@store.np" />
              <Input label="Phone"              value={form.phone}            onChange={set('phone')}            placeholder="+977-9800-000000" />
              <Input label="Address"            value={form.address}          onChange={set('address')}          placeholder="City / Area" />
              <Input label="Emergency Contact"  value={form.emergencyContact} onChange={set('emergencyContact')} placeholder="+977-9800-000000" />
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5" style={{ borderColor:'#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor:'#e2e8f0' }}>Work Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Employee ID" value={form.employeeId} onChange={set('employeeId')} placeholder="e.g. EMP-0042" />
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Role *</label>
                <select className="w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f]" value={form.role} onChange={set('role')}>
                  <option>Cashier</option><option>Admin</option><option>Floor Manager</option><option>Supervisor</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Default Shift</label>
                <select className="w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f]" value={form.shift} onChange={set('shift')}>
                  <option>Morning (8am–2pm)</option><option>Afternoon (2pm–8pm)</option><option>Full Day (8am–8pm)</option>
                </select>
              </div>
              <Input label="Joining Date"          type="date"     value={form.joiningDate} onChange={set('joiningDate')} />
              <Input label="Monthly Salary (Rs)"   type="number"   value={form.salary}      onChange={set('salary')}      placeholder="0" />
              <Input label="POS PIN (4 digits)"    type="password" value={form.pin}         onChange={set('pin')}         placeholder="••••" />
              <div className="col-span-2">
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Notes</label>
                <textarea className="w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f] resize-none" rows={2} value={form.notes} onChange={set('notes')} placeholder="Any additional notes..." />
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-5">
          <div className="bg-white rounded-xl border p-5 text-center" style={{ borderColor:'#e2e8f0' }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3" style={{ background:'#1e3a5f' }}>
              {form.name ? form.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() : 'ST'}
            </div>
            <p className="text-sm font-semibold text-[#0f172a]">{form.name||'New Staff'}</p>
            <p className="text-xs text-[#94a3b8] mt-0.5">{form.role} · KTM-001</p>
          </div>
          <div className="bg-white rounded-xl border p-5" style={{ borderColor:'#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor:'#e2e8f0' }}>Account Status</h3>
            <div className="space-y-2">
              {['Active','Inactive','On Leave'].map(s => (
                <label key={s} className="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="st-status" value={s} checked={form.status===s} onChange={set('status')} className="accent-[#1e3a5f]" />
                  <span className="text-sm text-[#0f172a]">{s}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
