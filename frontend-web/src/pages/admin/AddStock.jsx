// src/pages/admin/AddStock.jsx — IMPROVED: uses live products from AppContext, actually updates stock
import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Button, Toast } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { useApp } from '../../context/AppContext';

export default function AddStock() {
  const { setCurrentPage } = useAdmin();
  const { products, addStock } = useApp();

  const [selectedId, setSelectedId]   = useState('');
  const [form, setForm]               = useState({ quantity: '', supplier: '', invoiceNo: '', purchasePrice: '', notes: '', restockDate: new Date().toISOString().split('T')[0] });
  const [submitting, setSubmitting]   = useState(false);
  const [toast, setToast]             = useState({ visible: false, message: '' });

  const product = products.find(p => p.id === Number(selectedId) || p.id === selectedId);
  const set = key => e => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const showToast = (msg) => { setToast({ visible: true, message: msg }); setTimeout(() => setToast({ visible: false, message: '' }), 2000); };

  const handleSubmit = async () => {
    if (!selectedId || !form.quantity) { showToast('Select a product and enter quantity.'); return; }
    const qty = parseInt(form.quantity, 10);
    if (isNaN(qty) || qty <= 0) { showToast('Quantity must be a positive number.'); return; }
    setSubmitting(true);
    await addStock(product.id, qty);
    setSubmitting(false);
    showToast(`Added ${qty} units to ${product.name}`);
    setTimeout(() => setCurrentPage('inventory'), 1200);
  };

  return (
    <AdminLayout>
      <Toast visible={toast.visible} message={toast.message} />
      <PageHeader
        breadcrumb={<span className="cursor-pointer hover:text-[#1e3a5f] transition-colors" onClick={() => setCurrentPage('inventory')}>← Back to Inventory</span>}
        title="Add Stock"
        actions={
          <>
            <Button variant="secondary" onClick={() => setCurrentPage('inventory')}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Saving…' : 'Confirm Stock-In'}</Button>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          {/* Product picker */}
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Select Product</h3>
            <select className="w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f] mb-3"
              value={selectedId} onChange={e => setSelectedId(e.target.value)}>
              <option value="">Choose product to restock…</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} — {p.sku} (Current: {p.stock})</option>
              ))}
            </select>

            {product && (
              <div className="p-3 rounded-lg border flex gap-4" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#0f172a]">{product.name}</p>
                  <p className="text-xs text-[#94a3b8] font-mono">{product.sku} · {product.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#94a3b8]">Current Stock</p>
                  <p className={`text-sm font-bold ${product.status === 'Out of Stock' ? 'text-[#dc2626]' : product.status === 'Low Stock' ? 'text-[#d97706]' : 'text-[#16a34a]'}`}>
                    {product.stock} units
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Stock-in details */}
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Stock-In Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Quantity *</label>
                <input type="number" min={1} value={form.quantity} onChange={set('quantity')}
                  placeholder="e.g. 50" className="input-field w-full" />
              </div>
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Purchase Price (Rs)</label>
                <input type="number" value={form.purchasePrice} onChange={set('purchasePrice')}
                  placeholder="Unit cost" className="input-field w-full" />
              </div>
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Invoice No.</label>
                <input value={form.invoiceNo} onChange={set('invoiceNo')}
                  placeholder="e.g. INV-20260001" className="input-field w-full" />
              </div>
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Restock Date</label>
                <input type="date" value={form.restockDate} onChange={set('restockDate')} className="input-field w-full" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Notes</label>
                <textarea value={form.notes} onChange={set('notes')} rows={2}
                  placeholder="Optional notes…" className="input-field w-full resize-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl border p-5 self-start" style={{ borderColor: '#e2e8f0' }}>
          <h3 className="text-sm font-semibold text-[#0f172a] mb-4">Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-[#94a3b8]">Product</span><span className="font-medium truncate max-w-[140px] text-right">{product?.name || '—'}</span></div>
            <div className="flex justify-between"><span className="text-[#94a3b8]">Current Stock</span><span className="font-medium">{product?.stock ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-[#94a3b8]">Adding</span><span className="font-semibold text-[#16a34a]">+{form.quantity || 0}</span></div>
            <div className="flex justify-between border-t pt-3 font-bold" style={{ borderColor: '#e2e8f0' }}>
              <span>New Stock</span>
              <span>{product ? (product.stock + (parseInt(form.quantity, 10) || 0)) : '—'}</span>
            </div>
          </div>
          <Button variant="primary" className="w-full mt-5" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving…' : 'Confirm Stock-In'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
