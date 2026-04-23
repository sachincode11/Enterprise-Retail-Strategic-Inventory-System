// src/pages/admin/AddProduct.jsx
// STATUS FIELD REMOVED as per requirements.
import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Button, Input, Toast } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { useAction } from '../../hooks/useService';
import { addProduct, updateProduct } from '../../services/productService';
import { getSuppliers } from '../../services/supplierService';

const CATEGORIES = ['Grains & Pulses', 'Dairy', 'Beverages', 'Snacks', 'Personal Care', 'Household', 'Oils & Fats', 'Instant Food', 'Condiments'];
const UNITS      = [{ value: 'pcs', label: 'Piece (pcs)' }, { value: 'kg', label: 'Kilogram (kg)' }, { value: 'g', label: 'Gram (g)' }, { value: 'L', label: 'Litre (L)' }, { value: 'pack', label: 'Pack' }];

const EMPTY = { name: '', sku: '', category: '', priceNum: '', costPrice: '', stock: '', reorderAt: '', supplier: '', description: '', barcode: '', unit: 'pcs', tax: '' };

export default function AddProduct() {
  const { setCurrentPage, editTarget } = useAdmin();
  const { execute, loading } = useAction();
  const isEdit = !!editTarget?.id;

  const [form, setForm]         = useState(isEdit ? { ...editTarget, priceNum: editTarget.priceNum || '' } : EMPTY);
  const [suppliers, setSuppliers] = useState([]);
  const [toast, setToast]       = useState({ visible: false, message: '' });

  const set = key => e => setForm(prev => ({ ...prev, [key]: e.target.value }));

  useEffect(() => {
    getSuppliers().then(res => setSuppliers(res.data));
  }, []);

  const showToast = (msg) => { setToast({ visible: true, message: msg }); setTimeout(() => setToast({ visible: false, message: '' }), 2000); };

  const handleSubmit = async () => {
    if (!form.name || !form.sku || !form.priceNum) { showToast('Name, SKU, and price are required.'); return; }
    await execute(
      () => isEdit ? updateProduct(editTarget.id, { ...form, priceNum: Number(form.priceNum), stock: Number(form.stock) }) : addProduct({ ...form, priceNum: Number(form.priceNum), stock: Number(form.stock) }),
      () => { showToast(isEdit ? 'Product updated!' : 'Product added!'); setTimeout(() => setCurrentPage('products'), 800); }
    );
  };

  const margin = form.priceNum && form.costPrice ? (parseFloat(form.priceNum) - parseFloat(form.costPrice)).toFixed(2) : null;

  return (
    <AdminLayout>
      <PageHeader
        breadcrumb={<span className="cursor-pointer hover:text-[#1e3a5f]" onClick={() => setCurrentPage('products')}>← Back to Products</span>}
        title={isEdit ? 'Edit Product' : 'Add New Product'}
        actions={
          <>
            <Button variant="secondary" onClick={() => setCurrentPage('products')}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={loading}>{loading ? 'Saving…' : isEdit ? 'Update Product' : 'Save Product'}</Button>
          </>
        }
      />
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          {/* Basic Info */}
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Product Name *" value={form.name} onChange={set('name')} placeholder="e.g. Basmati Rice 5kg" className="col-span-2" />
              <Input label="SKU *"          value={form.sku}  onChange={set('sku')}  placeholder="e.g. RICE-5KG-001" />
              <Input label="Barcode"        value={form.barcode} onChange={set('barcode')} placeholder="e.g. 8901030000001" />
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Category *</label>
                <select className="w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f]" value={form.category} onChange={set('category')}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Unit</label>
                <select className="w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f]" value={form.unit} onChange={set('unit')}>
                  {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Description</label>
                <textarea className="w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f] resize-none" rows={3} value={form.description} onChange={set('description')} placeholder="Brief product description..." />
              </div>
            </div>
          </div>
          {/* Pricing */}
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Pricing</h3>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Selling Price (Rs) *" type="number" value={form.priceNum}  onChange={set('priceNum')}  placeholder="0.00" />
              <Input label="Cost Price (Rs)"       type="number" value={form.costPrice} onChange={set('costPrice')} placeholder="0.00" />
              <Input label="Tax (%)"               type="number" value={form.tax}       onChange={set('tax')}       placeholder="e.g. 13" />
            </div>
            {margin !== null && (
              <div className="mt-3 px-3 py-2 rounded-lg text-sm" style={{ background: '#eff6ff', color: '#1e3a5f' }}>
                Margin: <strong>Rs {margin}</strong>
              </div>
            )}
          </div>
          {/* Inventory */}
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Inventory</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Opening Stock *"    type="number" value={form.stock}     onChange={set('stock')}     placeholder="0" />
              <Input label="Reorder At (units)" type="number" value={form.reorderAt} onChange={set('reorderAt')} placeholder="e.g. 20" />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {/* Supplier */}
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Supplier</h3>
            <div>
              <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Select Supplier</label>
              <select className="w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f]" value={form.supplier} onChange={set('supplier')}>
                <option value="">Choose supplier...</option>
                {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          </div>
          {/* Image */}
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
      <Toast message={toast.message} visible={toast.visible} type={toast.message.includes('required') ? 'error' : 'success'} />
    </AdminLayout>
  );
}
