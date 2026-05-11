// src/pages/admin/AddProduct.jsx — IMPROVED: uses AppContext so product appears everywhere immediately
import { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Button, Input, Toast } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { useApp } from '../../context/AppContext';
import { getSuppliers } from '../../services/supplierService';
import { getCategories } from '../../services/productService';

const UNITS = [{ value: 'pcs', label: 'Piece (pcs)' }, { value: 'kg', label: 'Kilogram (kg)' }, { value: 'g', label: 'Gram (g)' }, { value: 'L', label: 'Litre (L)' }, { value: 'pack', label: 'Pack' }];
const EMPTY = { 
  product_name: '', 
  sku: '', 
  category_id: '', 
  unit_price: '', 
  supply_price: '', 
  quantity_in_stock: '', 
  reorder_level: '', 
  supplier_id: '', 
  description: '', 
  barcode: '', 
  unit_of_measure: 'pcs', 
  tax_rate: '' 
};

export default function AddProduct() {
  const { setCurrentPage } = useAdmin();
  const { addProduct } = useApp();

  const [form, setForm] = useState(EMPTY);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState(null);
  const fileInputRef = useRef(null);

  const set = key => e => setForm(prev => ({ ...prev, [key]: e.target.value }));
  const showToast = (message, type = 'success') => { setToast({ visible: true, message, type }); setTimeout(() => setToast(t => ({ ...t, visible: false })), 2200); };

  useEffect(() => {
    setForm(EMPTY);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadSuppliers() {
      setLoadingSuppliers(true);
      try {
        const res = await getSuppliers();
        if (!active) return;
        setSuppliers(Array.isArray(res?.data) ? res.data : []);
      } catch {
        if (!active) return;
        setSuppliers([]);
      } finally {
        if (active) setLoadingSuppliers(false);
      }
    }

    async function loadCategories() {
      setLoadingCategories(true);
      try {
        const res = await getCategories();
        if (!active) return;
        setCategories(Array.isArray(res?.data) ? res.data : []);
      } catch {
        if (!active) return;
        setCategories([]);
      } finally {
        if (active) setLoadingCategories(false);
      }
    }

    loadSuppliers();
    loadCategories();
    return () => {
      active = false;
    };
  }, []);



  const handleSubmit = async () => {
    const product_name = (form.product_name || '').trim();
    const sku = (form.sku || '').trim();
    const category_id = form.category_id;
    const unit_price = Number(form.unit_price);
    const stockNum = Number(form.quantity_in_stock || 0);

    if (!product_name || !sku || Number.isNaN(unit_price)) { showToast('Name, SKU and valid price are required.', 'error'); return; }
    if (!category_id) { showToast('Category is required.', 'error'); return; }
    if (unit_price < 0) { showToast('Price cannot be negative.', 'error'); return; }
    if (!Number.isInteger(stockNum) || stockNum < 0) { showToast('Stock must be a non-negative whole number.', 'error'); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        product_name,
        sku,
        category_id: Number(category_id),
        barcode: (form.barcode || '').trim() || null,
        description: (form.description || '').trim() || null,
        unit_price,
        quantity_in_stock: stockNum,
        stock: stockNum,
        supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
        tax_rate: Number(form.tax_rate || 0),
        supply_price: Number(form.supply_price || 0),
        reorder_level: Number(form.reorder_level || 0),
        image_url: imagePreview || null,
      };
      await addProduct(payload);
      showToast('Product added successfully.');
      
      setTimeout(() => {
        setCurrentPage('products');
      }, 1500);
    } catch (error) {
      showToast(error?.message || 'Unable to save product.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setCurrentPage('products');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageError(null);
    if (file) {
      // Check size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        setImageError('Image is too large. Max size is 2MB.');
        showToast('Image size must be less than 2MB', 'error');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Check format
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setImageError('Invalid format. Please use JPG, PNG or WEBP.');
        showToast('Unsupported image format', 'error');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Optional: check dimensions if "fit" refers to resolution
          if (img.width < 100 || img.height < 100) {
            setImageError('Image is too small. Minimum 100x100px required.');
            showToast('Image dimensions are too small', 'error');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
          }
          setImagePreview(event.target.result);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const margin = form.unit_price && form.supply_price ? (parseFloat(form.unit_price) - parseFloat(form.supply_price)).toFixed(2) : null;

  return (
    <AdminLayout>
      <Toast message={toast.message} visible={toast.visible} type={toast.type} />
      <PageHeader
        breadcrumb={<span className="cursor-pointer hover:text-[#1e3a5f] transition-colors" onClick={() => setCurrentPage('products')}>← Products</span>}
        title="Add New Product"
        actions={
          <>
            <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Saving…' : 'Save Product'}</Button>
          </>
        }
      />
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Product Name *" value={form.product_name} onChange={set('product_name')} placeholder="e.g. Basmati Rice 5kg" className="col-span-2" />
              <Input label="SKU *" value={form.sku} onChange={set('sku')} placeholder="e.g. RICE-5KG-001" />
              <Input label="Barcode" value={form.barcode} onChange={set('barcode')} placeholder="e.g. 8901030000001" />
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Category *</label>
                <select className="w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f]" value={form.category_id} onChange={set('category_id')} disabled={loadingCategories}>
                  <option value="">{loadingCategories ? 'Loading...' : 'Select category'}</option>
                  {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Unit</label>
                <select className="w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f]" value={form.unit_of_measure} onChange={set('unit_of_measure')}>
                  {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
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
              <Input label="Selling Price (Rs) *" type="number" value={form.unit_price} onChange={set('unit_price')} placeholder="0.00" />
              <Input label="Cost Price (Rs)" type="number" value={form.supply_price} onChange={set('supply_price')} placeholder="0.00" />
              <Input label="Tax (%)" type="number" value={form.tax_rate} onChange={set('tax_rate')} placeholder="e.g. 13" />
            </div>
            {margin !== null && (
              <div className="mt-3 px-3 py-2 rounded-lg text-sm" style={{ background: '#eff6ff', color: '#1e3a5f' }}>
                Margin: <strong>Rs {margin}</strong>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Inventory</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Opening Stock *" type="number" value={form.quantity_in_stock} onChange={set('quantity_in_stock')} placeholder="0" />
              <Input label="Reorder At (units)" type="number" value={form.reorder_level} onChange={set('reorder_level')} placeholder="e.g. 20" />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Supplier</h3>
            <div>
              <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Select Supplier</label>
              <select className="w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f]" value={form.supplier_id} onChange={set('supplier_id')} disabled={loadingSuppliers}>
                <option value="">{loadingSuppliers ? 'Loading suppliers...' : 'Choose supplier...'}</option>
                {suppliers.map(s => <option key={s.supplier_id || s.id} value={s.supplier_id || s.id}>{s.supplier_name || s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Product Image</h3>
            <div 
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-[#1e3a5f] hover:bg-[#eff6ff] transition-all relative overflow-hidden" 
              style={{ borderColor: '#e2e8f0', minHeight: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input type="file" accept="image/png, image/jpeg" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
              
              {imagePreview ? (
                <div className="absolute inset-0 w-full h-full p-2 group">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain rounded-md" />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                    <p className="text-white text-xs font-semibold">Change Image</p>
                  </div>
                  <button 
                    className="absolute top-3 right-3 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 text-red-500"
                    onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageError(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    title="Remove Image"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              ) : (
                <>
                  <svg className={`mx-auto mb-2 ${imageError ? 'text-red-400' : 'text-[#94a3b8]'}`} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                  <p className={`text-xs ${imageError ? 'text-red-500 font-medium' : 'text-[#94a3b8]'}`}>
                    {imageError || 'Click to upload image'}
                  </p>
                  {!imageError && <p className="text-xs text-[#94a3b8] mt-1">PNG, JPG up to 2MB</p>}
                  {imageError && <p className="text-[10px] text-red-400 mt-1 uppercase tracking-wider font-bold">Try another file</p>}
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
            <p className="text-xs font-semibold text-[#0f172a] mb-1">Preview</p>
            {imagePreview && <div className="mb-3 w-16 h-16 rounded-md border border-[#e2e8f0] bg-white overflow-hidden flex-shrink-0"><img src={imagePreview} className="w-full h-full object-contain" /></div>}
            <p className="text-sm font-bold text-[#0f172a]">{form.product_name || 'Product Name'}</p>
            <p className="text-xs text-[#94a3b8] font-mono">{form.sku || 'SKU-XXXXX'}</p>
            <p className="text-sm font-semibold text-[#1e3a5f] mt-1">Rs {form.unit_price || '0'}</p>
            <p className="text-xs text-[#94a3b8]">Stock: {form.quantity_in_stock || '0'} · {categories.find(c => String(c.category_id) === String(form.category_id))?.category_name || 'No category'}</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
