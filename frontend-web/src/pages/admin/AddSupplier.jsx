// src/pages/admin/AddSupplier.jsx
import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Button, Input } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';

export default function AddSupplier() {
  const { setCurrentPage } = useAdmin();
  const [form, setForm] = useState({ name:'', contact:'', email:'', phone:'', address:'', city:'', country:'Nepal', taxId:'', paymentTerms:'30', leadTime:'', category:'', notes:'', status:'Active' });
  const set = key => e => setForm(prev => ({ ...prev, [key]: e.target.value }));
  const handleSubmit = () => { if (!form.name||!form.contact){alert('Name and contact are required.');return;} alert('Supplier added successfully!'); setCurrentPage('suppliers'); };

  return (
    <AdminLayout>
      <PageHeader
        breadcrumb={<span className="cursor-pointer hover:text-[#1e3a5f] transition-colors" onClick={() => setCurrentPage('suppliers')}>← Back to Suppliers</span>}
        title="Add New Supplier"
        actions={<><Button variant="secondary" onClick={() => setCurrentPage('suppliers')}>Cancel</Button><Button variant="primary" onClick={handleSubmit}>Save Supplier</Button></>}
      />
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <div className="bg-white rounded-xl border p-5" style={{ borderColor:'#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor:'#e2e8f0' }}>Company Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Company Name *" value={form.name} onChange={set('name')} placeholder="e.g. Agro Fresh Pvt. Ltd." className="col-span-2" />
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Category</label>
                <select className="w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f]" value={form.category} onChange={set('category')}>
                  <option value="">Select category...</option><option>Grains & Pulses</option><option>Dairy</option><option>Beverages</option><option>Household</option>
                </select>
              </div>
              <Input label="Tax ID / VAT Number" value={form.taxId}    onChange={set('taxId')}   placeholder="e.g. 303456789" />
              <Input label="Address"             value={form.address}  onChange={set('address')} placeholder="Street / Area" />
              <Input label="City"                value={form.city}     onChange={set('city')}    placeholder="e.g. Kathmandu" />
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Country</label>
                <select className="w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f]" value={form.country} onChange={set('country')}>
                  <option>Nepal</option><option>India</option><option>China</option>
                </select>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5" style={{ borderColor:'#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor:'#e2e8f0' }}>Contact Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Contact Person *" value={form.contact} onChange={set('contact')} placeholder="e.g. Ram Bahadur" />
              <Input label="Phone *"          value={form.phone}   onChange={set('phone')}   placeholder="+977-9800-000000" />
              <Input label="Email" type="email" value={form.email} onChange={set('email')}   placeholder="contact@supplier.com" />
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5" style={{ borderColor:'#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor:'#e2e8f0' }}>Commercial Terms</h3>
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
        <div className="space-y-5">
          <div className="bg-white rounded-xl border p-5" style={{ borderColor:'#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor:'#e2e8f0' }}>Status</h3>
            <div className="space-y-2">
              {['Active','Inactive','Pending'].map(s => (
                <label key={s} className="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="sup-status" value={s} checked={form.status===s} onChange={set('status')} className="accent-[#1e3a5f]" />
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
