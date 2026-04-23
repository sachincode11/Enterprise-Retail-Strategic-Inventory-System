// src/pages/admin/AddStock.jsx
import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Button, Input } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';

const productOptions = [
  { id:'p1', sku:'RICE-5KG-001', name:'Basmati Rice 5kg',         current:24, unit:'bags'    },
  { id:'p2', sku:'MILK-500ML-A', name:'Amul Full Cream Milk 500ml',current:8,  unit:'pcs'     },
  { id:'p3', sku:'COKE-500ML-X', name:'Coca-Cola 500ml',           current:3,  unit:'cases'   },
  { id:'p4', sku:'BISCUIT-PRL',  name:'Parle-G 800g',              current:0,  unit:'packs'   },
  { id:'p5', sku:'OIL-SUN-1L',   name:'Sunflower Oil 1L',          current:15, unit:'bottles' },
];

export default function AddStock() {
  const { setCurrentPage } = useAdmin();
  const [selectedProduct, setSelectedProduct] = useState('');
  const [form, setForm] = useState({ quantity:'', supplier:'', invoiceNo:'', purchasePrice:'', expiryDate:'', notes:'', restockDate: new Date().toISOString().split('T')[0] });
  const product = productOptions.find(p => p.id === selectedProduct);
  const set = key => e => setForm(prev => ({ ...prev, [key]: e.target.value }));
  const handleSubmit = () => {
    if (!selectedProduct || !form.quantity) { alert('Please select a product and enter quantity.'); return; }
    alert(`Stock updated! Added ${form.quantity} ${product?.unit} of ${product?.name}`);
    setCurrentPage('inventory');
  };

  return (
    <AdminLayout>
      <PageHeader
        breadcrumb={<span className="cursor-pointer hover:text-[#1e3a5f] transition-colors" onClick={() => setCurrentPage('inventory')}>← Back to Inventory</span>}
        title="Add Stock"
        actions={<><Button variant="secondary" onClick={() => setCurrentPage('inventory')}>Cancel</Button><Button variant="primary" onClick={handleSubmit}>Confirm Stock-In</Button></>}
      />
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Select Product</h3>
            <select className="w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f] mb-3" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
              <option value="">Choose product to restock...</option>
              {productOptions.map(p => <option key={p.id} value={p.id}>{p.name} — {p.sku}</option>)}
            </select>
            {product && (
              <div className="flex gap-4 px-4 py-3 rounded-lg" style={{ background: '#eff6ff' }}>
                <div><p className="text-xs text-[#94a3b8] uppercase tracking-wider">SKU</p><p className="text-sm font-mono font-medium text-[#0f172a]">{product.sku}</p></div>
                <div><p className="text-xs text-[#94a3b8] uppercase tracking-wider">Current Stock</p><p className="text-sm font-semibold" style={{ color: product.current<=5?'#dc2626':'#15803d' }}>{product.current} {product.unit}</p></div>
                <div><p className="text-xs text-[#94a3b8] uppercase tracking-wider">Unit</p><p className="text-sm font-medium text-[#0f172a]">{product.unit}</p></div>
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Stock Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Quantity to Add *"       type="number" value={form.quantity}      onChange={set('quantity')}      placeholder="0" />
              <Input label="Purchase Price (Rs)"     type="number" value={form.purchasePrice} onChange={set('purchasePrice')} placeholder="0.00" />
              <Input label="Invoice / PO Number"                   value={form.invoiceNo}     onChange={set('invoiceNo')}     placeholder="e.g. INV-2026-0412" />
              <Input label="Restock Date"            type="date"   value={form.restockDate}   onChange={set('restockDate')} />
              <Input label="Expiry Date (if applicable)" type="date" value={form.expiryDate}  onChange={set('expiryDate')} />
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Supplier</label>
                <select className="w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f]" value={form.supplier} onChange={set('supplier')}>
                  <option value="">Select supplier...</option><option>Agro Fresh Pvt. Ltd.</option><option>Amul Dairy Co-op</option><option>Himalaya Dist.</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Notes</label>
                <textarea className="w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f] resize-none" rows={2} value={form.notes} onChange={set('notes')} placeholder="Any additional notes..." />
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-5">
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Stock-In Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-[#94a3b8]">Product</span><span className="font-medium text-right text-[#0f172a]" style={{ maxWidth:140, wordBreak:'break-word' }}>{product?.name||'—'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#94a3b8]">Current</span><span className="font-semibold text-[#0f172a]">{product?`${product.current} ${product.unit}`:'—'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#94a3b8]">Adding</span><span className="font-semibold text-[#22c55e]">+{form.quantity||0} {product?.unit||''}</span></div>
              <div className="h-px" style={{ background:'#e2e8f0' }} />
              <div className="flex justify-between text-sm"><span className="text-[#94a3b8]">New Total</span><span className="font-bold text-[#1e3a5f]">{product?`${product.current+parseInt(form.quantity||0)} ${product.unit}`:'—'}</span></div>
              {form.purchasePrice && form.quantity && <div className="flex justify-between text-sm"><span className="text-[#94a3b8]">Total Cost</span><span className="font-semibold text-[#0f172a]">Rs {(parseFloat(form.purchasePrice)*parseInt(form.quantity)).toLocaleString()}</span></div>}
            </div>
          </div>
          {product && product.current<=5 && (
            <div className="rounded-xl border p-4" style={{ background:'#fef3c7', borderColor:'#fcd34d' }}>
              <p className="text-xs font-semibold" style={{ color:'#92400e' }}>⚠ Low Stock Alert</p>
              <p className="text-xs mt-1" style={{ color:'#92400e' }}>This product is critically low. Restocking is recommended immediately.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
