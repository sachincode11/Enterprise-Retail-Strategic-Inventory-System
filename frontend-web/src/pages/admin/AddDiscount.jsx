// src/pages/admin/AddDiscount.jsx — IMPROVED: wired to AppContext addDiscount, no alert()
import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Button, Input, Toggle, Toast } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { useApp } from '../../context/AppContext';

const EMPTY = { name: '', code: '', type: 'Percentage', value: '', appliesTo: 'Entire cart', minOrder: '', maxUses: '', startDate: '', endDate: '', status: 'Active', stackable: false, onePerCustomer: true, notes: '' };

export default function AddDiscount() {
  const { setCurrentPage } = useAdmin();
  const { addDiscount }    = useApp();

  const [form,    setForm]    = useState(EMPTY);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState({ visible: false, message: '', type: 'success' });

  const set    = key => e => setForm(prev => ({ ...prev, [key]: e.target.value }));
  const toggle = key => setForm(prev => ({ ...prev, [key]: !prev[key] }));

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2200);
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const code  = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setForm(prev => ({ ...prev, code }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.value) { showToast('Name and value are required.', 'error'); return; }
    if (!form.code) { showToast('Discount code is required.', 'error'); return; }
    setSaving(true);
    const valueStr = form.type === 'Percentage' ? `${form.value}%` : `Rs ${form.value}`;
    const period   = form.startDate && form.endDate ? `${form.startDate} – ${form.endDate}` : 'Ongoing';
    await addDiscount({ ...form, value: valueStr, period });
    setSaving(false);
    showToast('Discount created successfully.');
    setTimeout(() => setCurrentPage('discounts'), 900);
  };

  return (
    <AdminLayout>
      <Toast message={toast.message} visible={toast.visible} type={toast.type} />
      <PageHeader
        breadcrumb={<span className="cursor-pointer hover:text-[#1e3a5f] transition-colors" onClick={() => setCurrentPage('discounts')}>← Back to Discounts</span>}
        title="Add New Discount"
        actions={
          <>
            <Button variant="secondary" onClick={() => setCurrentPage('discounts')}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Saving…' : 'Create Discount'}</Button>
          </>
        }
      />
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Discount Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Discount Name *" value={form.name} onChange={set('name')} placeholder="e.g. Summer Sale 20%" className="col-span-2" />
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Discount Code *</label>
                <div className="flex gap-2">
                  <input className="input-field flex-1" value={form.code} onChange={set('code')} placeholder="e.g. SUMMER20" />
                  <button onClick={generateCode} className="btn-secondary px-3 py-2 text-xs whitespace-nowrap">Auto Generate</button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Type *</label>
                <select className="w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f]" value={form.type} onChange={set('type')}>
                  <option>Percentage</option><option>Fixed Amount</option>
                </select>
              </div>
              <Input label={`Value * ${form.type === 'Percentage' ? '(%)' : '(Rs)'}`} type="number" value={form.value} onChange={set('value')} placeholder={form.type === 'Percentage' ? '0–100' : '0.00'} />
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Applies To</label>
                <select className="w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f]" value={form.appliesTo} onChange={set('appliesTo')}>
                  <option>Entire cart</option><option>Registered customers</option><option>Orders &gt; Rs 1,000</option><option>Specific category</option>
                </select>
              </div>
              <Input label="Min. Order Value (Rs)" type="number" value={form.minOrder}  onChange={set('minOrder')}  placeholder="0" />
              <Input label="Max Uses"              type="number" value={form.maxUses}   onChange={set('maxUses')}   placeholder="Unlimited" />
              <Input label="Start Date"            type="date"   value={form.startDate} onChange={set('startDate')} />
              <Input label="End Date"              type="date"   value={form.endDate}   onChange={set('endDate')} />
              <div className="col-span-2 space-y-4 pt-2">
                {[
                  { key: 'stackable',       label: 'Stackable',          sub: 'Allow combined with other discounts' },
                  { key: 'onePerCustomer',  label: 'One Per Customer',   sub: 'Limit to one use per registered customer' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div><p className="text-sm font-medium text-[#0f172a]">{item.label}</p><p className="text-xs text-[#94a3b8]">{item.sub}</p></div>
                    <Toggle checked={form[item.key]} onChange={() => toggle(item.key)} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Internal Notes</label>
                  <textarea className="w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f] resize-none" rows={2} value={form.notes} onChange={set('notes')} placeholder="Internal notes..." />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {/* Live preview */}
          <div className="rounded-xl border p-5" style={{ background: '#1e3a5f', borderColor: '#16324f' }}>
            <p className="text-xs font-mono text-white/60 uppercase tracking-widest mb-2">Preview</p>
            <p className="text-2xl font-bold text-white mb-1">
              {form.value ? `${form.value}${form.type === 'Percentage' ? '%' : ' Rs'}` : '—'}
              <span className="text-sm font-normal text-white/70"> OFF</span>
            </p>
            {form.code && <p className="text-sm font-mono font-semibold text-[#93c5fd]">{form.code}</p>}
            {form.name && <p className="text-xs text-white/60 mt-2">{form.name}</p>}
            {form.endDate && <p className="text-xs text-white/50 mt-1">Expires {form.endDate}</p>}
          </div>

          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Status</h3>
            <div className="space-y-2">
              {['Active', 'Inactive', 'Scheduled'].map(s => (
                <label key={s} className="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="disc-status" value={s} checked={form.status === s} onChange={set('status')} className="accent-[#1e3a5f]" />
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
