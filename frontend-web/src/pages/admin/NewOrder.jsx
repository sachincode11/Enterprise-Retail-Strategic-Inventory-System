// src/pages/admin/NewOrder.jsx — IMPROVED: uses live products/suppliers, saves to global orders
import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Button, Badge } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { useApp } from '../../context/AppContext';

const TAX_RATE = 0.13;

export default function NewOrder() {
  const { setCurrentPage } = useAdmin();
  const { products, addOrder } = useApp();

  const [orderItems, setOrderItems] = useState([]);
  const [supplier,   setSupplier]   = useState('');
  const [notes,      setNotes]      = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [search,     setSearch]     = useState('');
  const [submitted,  setSubmitted]  = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Derive suppliers from products
  const suppliers = [...new Set(products.map(p => p.supplier).filter(Boolean))];

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const addItem = (product) => {
    setOrderItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1, unitCost: product.priceNum }];
    });
  };

  const updateQty = (id, delta) =>
    setOrderItems(prev =>
      prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)
    );

  const updateCost = (id, val) =>
    setOrderItems(prev =>
      prev.map(i => i.id === id ? { ...i, unitCost: parseFloat(val) || 0 } : i)
    );

  const removeItem = (id) => setOrderItems(prev => prev.filter(i => i.id !== id));

  const subtotal = orderItems.reduce((sum, i) => sum + i.unitCost * i.qty, 0);
  const tax      = subtotal * TAX_RATE;
  const total    = subtotal + tax;

  const [validationMsg, setValidationMsg] = useState('');

  const handleSubmit = async () => {
    if (!supplier)          { setValidationMsg('Please select a supplier.'); return; }
    if (!orderItems.length) { setValidationMsg('Please add at least one product.'); return; }
    setValidationMsg('');
    setSubmitting(true);
    await addOrder({
      supplier,
      items: orderItems.length,
      value: `Rs ${Math.round(total).toLocaleString('en-IN')}`,
      notes,
      deliveryDate,
      orderItems: orderItems.map(i => ({ productId: i.id, name: i.name, qty: i.qty, unitCost: i.unitCost })),
    });
    setSubmitted(true);
    setSubmitting(false);
    setTimeout(() => setCurrentPage('purchase-orders'), 1500);
  };

  if (submitted) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: '#dcfce7' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 className="text-xl font-bold text-[#0f172a] mb-1">Order Submitted</h2>
          <p className="text-sm text-[#94a3b8]">Redirecting to Purchase Orders…</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        breadcrumb="Purchase Orders"
        title="New Purchase Order"
        actions={
          <>
            <Button variant="secondary" onClick={() => setCurrentPage('purchase-orders')}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Order'}
            </Button>
          </>
        }
      />

      {validationMsg && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
          {validationMsg}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {/* Product selector */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4">Add Products</h3>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search products..." className="input-field mb-3" />
            <div className="max-h-56 overflow-y-auto border rounded-lg" style={{ borderColor: '#e2e8f0' }}>
              {filtered.map(p => (
                <div key={p.id} className="flex items-center justify-between px-4 py-2.5 border-b hover:bg-[#f8fafc] transition-colors" style={{ borderColor: '#f1f5f9' }}>
                  <div>
                    <p className="text-sm font-medium text-[#0f172a]">{p.name}</p>
                    <p className="text-xs text-[#94a3b8]">{p.sku} · Stock: {p.stock}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[#1e3a5f]">Rs {p.priceNum}</span>
                    <button onClick={() => addItem(p)} className="btn-primary text-xs px-3 py-1.5">Add</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order items */}
          {orderItems.length > 0 && (
            <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
              <div className="px-5 py-3 border-b" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
                <h3 className="text-sm font-semibold text-[#0f172a]">Order Items ({orderItems.length})</h3>
              </div>
              <table className="data-table">
                <thead>
                  <tr><th>Product</th><th>Qty</th><th>Unit Cost</th><th>Total</th><th></th></tr>
                </thead>
                <tbody>
                  {orderItems.map(item => (
                    <tr key={item.id}>
                      <td>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-[#94a3b8]">{item.sku}</p>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded border flex items-center justify-center text-xs" style={{ borderColor: '#e2e8f0' }}>−</button>
                          <span className="text-sm font-medium w-6 text-center">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, +1)} className="w-6 h-6 rounded border flex items-center justify-center text-xs" style={{ borderColor: '#e2e8f0' }}>+</button>
                        </div>
                      </td>
                      <td>
                        <input type="number" value={item.unitCost} onChange={e => updateCost(item.id, e.target.value)}
                          className="w-24 px-2 py-1 text-sm border rounded-lg outline-none focus:border-[#1e3a5f]" style={{ borderColor: '#e2e8f0' }} />
                      </td>
                      <td className="text-sm font-semibold">Rs {(item.unitCost * item.qty).toLocaleString('en-IN')}</td>
                      <td><button onClick={() => removeItem(item.id)} className="text-[#94a3b8] hover:text-[#dc2626] text-lg">×</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-3 border-t space-y-1 text-sm" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
                <div className="flex justify-between text-[#94a3b8]"><span>Subtotal</span><span>Rs {subtotal.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between text-[#94a3b8]"><span>Tax (13%)</span><span>Rs {Math.round(tax).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between font-bold text-[#0f172a]"><span>Total</span><span>Rs {Math.round(total).toLocaleString('en-IN')}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Order details */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4">Order Details</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#94a3b8] block mb-1.5">Supplier *</label>
                <select value={supplier} onChange={e => setSupplier(e.target.value)}
                  className="input-field text-sm w-full">
                  <option value="">Select supplier…</option>
                  {suppliers.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] block mb-1.5">Expected Delivery</label>
                <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)}
                  className="input-field text-sm w-full" />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] block mb-1.5">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  className="input-field text-sm w-full resize-none" rows={3} placeholder="Optional notes…" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[#94a3b8]">Products</span><span>{orderItems.length} items</span></div>
              <div className="flex justify-between"><span className="text-[#94a3b8]">Total Qty</span><span>{orderItems.reduce((s,i) => s + i.qty, 0)}</span></div>
              <div className="flex justify-between font-bold border-t pt-2 mt-1" style={{ borderColor: '#e2e8f0' }}>
                <span>Order Total</span><span>Rs {Math.round(total).toLocaleString('en-IN')}</span>
              </div>
            </div>
            <Button variant="primary" className="w-full mt-4" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Order'}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
