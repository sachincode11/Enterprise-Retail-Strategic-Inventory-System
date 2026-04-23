// src/pages/admin/AddProduct.jsx
import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Button, Input } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';

export default function AddProduct() {
  const { setCurrentPage } = useAdmin();
  const [form, setForm] = useState({ name:'', sku:'', category:'', price:'', costPrice:'', stock:'', reorderAt:'', supplier:'', status:'Active', description:'', barcode:'', unit:'pcs', tax:'' });
  const set = key => e => setForm(prev => ({ ...prev, [key]: e.target.value }));
  const handleSubmit = () => { alert('Product added successfully!'); setCurrentPage('products'); };

  return (
    <AdminLayout>
      <PageHeader
        breadcrumb={<span className="cursor-pointer hover:text-[#1e3a5f] transition-colors" onClick={() => setCurrentPage('products')}>← Back to Products</span>}
        title="Add New Product"
        actions={<><Button variant="secondary" onClick={() => setCurrentPage('products')}>Cancel</Button><Button variant="primary" onClick={handleSubmit}>Save Product</Button></>}
      />
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Product Name *" value={form.name} onChange={set('name')} placeholder="e.g. Basmati Rice 5kg" className="col-span-2" />
              <Input label="SKU *"          value={form.sku}  onChange={set('sku')}  placeholder="e.g. RICE-5KG-001" />
              <Input label="Barcode"        value={form.barcode} onChange={set('barcode')} placeholder="e.g. 8901030000001" />
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Category *</label>
                <select className="w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f]" value={form.category} onChange={set('category')}>
                  <option value="">Select category</option><option>Grains & Pulses</option><option>Dairy</option><option>Beverages</option><option>Snacks</option><option>Personal Care</option><option>Household</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Unit</label>
                <select className="w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f]" value={form.unit} onChange={set('unit')}>
                  <option value="pcs">Piece (pcs)</option><option value="kg">Kilogram (kg)</option><option value="g">Gram (g)</option><option value="L">Litre (L)</option><option value="pack">Pack</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Description</label>
                <textarea className="w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f] resize-none" rows={3} value={form.description} onChange={set('description')} placeholder="Brief product description..." />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Pricing</h3>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Selling Price (Rs) *" type="number" value={form.price}     onChange={set('price')}     placeholder="0.00" />
              <Input label="Cost Price (Rs)"       type="number" value={form.costPrice} onChange={set('costPrice')} placeholder="0.00" />
              <Input label="Tax (%)"               type="number" value={form.tax}       onChange={set('tax')}       placeholder="e.g. 13" />
            </div>
            {form.price && form.costPrice && (
              <div className="mt-3 px-3 py-2 rounded-lg text-sm" style={{ background: '#eff6ff', color: '#1e3a5f' }}>
                Margin: <strong>Rs {(parseFloat(form.price||0)-parseFloat(form.costPrice||0)).toFixed(2)}</strong>
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Inventory</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Opening Stock *"       type="number" value={form.stock}     onChange={set('stock')}     placeholder="0" />
              <Input label="Reorder At (units)"    type="number" value={form.reorderAt} onChange={set('reorderAt')} placeholder="e.g. 20" />
            </div>
          </div>
        </div>
        <div className="space-y-5">
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Status</h3>
            <div className="space-y-2">
              {['Active','Inactive','Low Stock'].map(s => (
                <label key={s} className="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="status" value={s} checked={form.status===s} onChange={set('status')} className="accent-[#1e3a5f]" />
                  <span className="text-sm text-[#0f172a]">{s}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Supplier</h3>
            <div>
              <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Select Supplier</label>
              <select className="w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f]" value={form.supplier} onChange={set('supplier')}>
                <option value="">Choose supplier...</option><option>Agro Fresh Pvt. Ltd.</option><option>Amul Dairy Co-op</option><option>Hindustan Unilever</option><option>Parle Products</option>
              </select>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Product Image</h3>
            <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-[#1e3a5f] hover:bg-[#eff6ff] transition-all" style={{ borderColor: '#e2e8f0' }}>
              <svg className="mx-auto mb-2 text-[#94a3b8]" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              <p className="text-xs text-[#94a3b8]">Click to upload or drag & drop</p>
              <p className="text-xs text-[#94a3b8] mt-1">PNG, JPG up to 2MB</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
