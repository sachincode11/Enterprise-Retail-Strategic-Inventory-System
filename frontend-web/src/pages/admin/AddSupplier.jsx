// src/pages/admin/AddSupplier.jsx
// STATUS FIELD REMOVED as per requirements.
import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Button, Input, Toast } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { useAction } from '../../hooks/useService';
import { addSupplier, updateSupplier } from '../../services/supplierService';

const EMPTY = { name: '', contact: '', email: '', phone: '', address: '', city: '', country: 'Nepal', taxId: '', paymentTerms: '30', leadTime: '', category: '', notes: '' };

export default function AddSupplier() {
  const { setCurrentPage, editTarget } = useAdmin();
  const { execute, loading } = useAction();
  const isEdit = !!editTarget?.id;

  const [form, setForm] = useState(isEdit ? { ...EMPTY, ...editTarget } : EMPTY);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const set = key => e => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const showToast = (msg) => { setToast({ visible: true, message: msg }); setTimeout(() => setToast({ visible: false, message: '' }), 2000); };

  const handleSubmit = async () => {
    if (!form.name || !form.contact) { showToast('Name and contact are required.'); return; }
    await execute(
      () => isEdit ? updateSupplier(editTarget.id, form) : addSupplier(form),
      () => { showToast(isEdit ? 'Supplier updated!' : 'Supplier added!'); setTimeout(() => setCurrentPage('suppliers'), 800); }
    );
  };

  return (
    <AdminLayout>
      <PageHeader
        breadcrumb={<span className="cursor-pointer hover:text-[#1e3a5f]" onClick={() => setCurrentPage('suppliers')}>← Back to Suppliers</span>}
        title={isEdit ? 'Edit Supplier' : 'Add New Supplier'}
        actions={
          <>
            <Button variant="secondary" onClick={() => setCurrentPage('suppliers')}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={loading}>{loading ? 'Saving…' : isEdit ? 'Update Supplier' : 'Save Supplier'}</Button>
          </>
        }
      />
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Company Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Company Name *" value={form.name} onChange={set('name')} placeholder="e.g. Agro Fresh Pvt. Ltd." className="col-span-2" />
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Category</label>
                <select className="w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f]" value={form.category} onChange={set('category')}>
                  <option value="">Select category...</option><option>Grains & Pulses</option><option>Dairy</option><option>Beverages</option><option>Household</option>
                </select>
              </div>
              <Input label="Tax ID / VAT Number" value={form.taxId}   onChange={set('taxId')}   placeholder="e.g. 303456789" />
              <Input label="Address"             value={form.address} onChange={set('address')} placeholder="Street / Area" />
              <Input label="City"                value={form.city}    onChange={set('city')}    placeholder="e.g. Kathmandu" />
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Country</label>
                <select className="w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f]" value={form.country} onChange={set('country')}>
                  <option>Nepal</option><option>India</option><option>China</option>
                </select>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Contact Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Contact Person *" value={form.contact} onChange={set('contact')} placeholder="e.g. Ram Bahadur" />
              <Input label="Phone *"          value={form.phone}   onChange={set('phone')}   placeholder="+977-9800-000000" />
              <Input label="Email" type="email" value={form.email} onChange={set('email')}   placeholder="contact@supplier.com" />
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Commercial Terms</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Payment Terms (days)</label>
                <select className="w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f]" value={form.paymentTerms} onChange={set('paymentTerms')}>
                  <option value="0">Cash on Delivery</option><option value="7">Net 7</option><option value="15">Net 15</option><option value="30">Net 30</option>
                </select>
              </div>
              <Input label="Lead Time (days)" type="number" value={form.leadTime} onChange={set('leadTime')} placeholder="e.g. 3" />
              <div className="col-span-2">
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Notes</label>
                <textarea className="w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f] resize-none" rows={2} value={form.notes} onChange={set('notes')} placeholder="Any additional notes..." />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-5 h-fit" style={{ borderColor: '#e2e8f0' }}>
          <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Supplier Summary</h3>
          <div className="p-4 rounded-lg space-y-2" style={{ background: '#f8fafc' }}>
            <p className="text-sm font-semibold text-[#0f172a]">{form.name || 'Company Name'}</p>
            <p className="text-xs text-[#94a3b8]">{form.contact || 'Contact Person'}</p>
            {form.email && <p className="text-xs text-[#475569]">{form.email}</p>}
            {form.city && <p className="text-xs text-[#475569]">{form.city}, {form.country}</p>}
          </div>
        </div>
      </div>
      <Toast message={toast.message} visible={toast.visible} type={toast.message.includes('required') ? 'error' : 'success'} />
    </AdminLayout>
  );
}
