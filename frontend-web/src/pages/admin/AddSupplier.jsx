// src/pages/admin/AddSupplier.jsx
// STATUS FIELD REMOVED as per requirements.
import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Button, Input, Toast } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { useAction } from '../../hooks/useService';
import { addSupplier, updateSupplier } from '../../services/supplierService';

const EMPTY = { name: '', contact: '', email: '', phone: '', address: '' };

export default function AddSupplier() {
  const { setCurrentPage } = useAdmin();
  const { execute, loading } = useAction();

  const [form, setForm] = useState(EMPTY);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const set = key => e => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const showToast = (msg) => { setToast({ visible: true, message: msg }); setTimeout(() => setToast({ visible: false, message: '' }), 2000); };

  const handleSubmit = async () => {
    if (!form.name || !form.contact) { showToast('Name and contact are required.'); return; }
    await execute(
      () => addSupplier(form),
      () => { showToast('Supplier added!'); setTimeout(() => setCurrentPage('suppliers'), 800); }
    );
  };

  return (
    <AdminLayout>
      <PageHeader
        breadcrumb={<span className="cursor-pointer hover:text-[#1e3a5f]" onClick={() => setCurrentPage('suppliers')}>← Back to Suppliers</span>}
        title="Add New Supplier"
        actions={
          <>
            <Button variant="secondary" onClick={() => setCurrentPage('suppliers')}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={loading}>{loading ? 'Saving…' : 'Save Supplier'}</Button>
          </>
        }
      />
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Company Information</h3>
            <div className="grid grid-cols-1 gap-4">
              <Input label="Company Name *" value={form.name} onChange={set('name')} placeholder="e.g. Agro Fresh Pvt. Ltd." />
              <Input label="Address" value={form.address} onChange={set('address')} placeholder="Street / Area" />
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Contact Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Contact Person *" value={form.contact} onChange={set('contact')} placeholder="e.g. Ram Bahadur" />
              <Input label="Phone *" value={form.phone} onChange={set('phone')} placeholder="+977-9800-000000" />
              <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="contact@supplier.com" className="col-span-2" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-5 h-fit" style={{ borderColor: '#e2e8f0' }}>
          <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Supplier Summary</h3>
          <div className="p-4 rounded-lg space-y-2" style={{ background: '#f8fafc' }}>
            <p className="text-sm font-semibold text-[#0f172a]">{form.name || 'Company Name'}</p>
            <p className="text-xs text-[#94a3b8]">{form.contact || 'Contact Person'}</p>
            {form.email && <p className="text-xs text-[#475569]">{form.email}</p>}
            {form.phone && <p className="text-xs text-[#475569]">{form.phone}</p>}
            {form.address && <p className="text-xs text-[#475569] mt-1 italic">{form.address}</p>}
          </div>
        </div>
      </div>
      <Toast message={toast.message} visible={toast.visible} type={toast.message.includes('required') ? 'error' : 'success'} />
    </AdminLayout>
  );
}

