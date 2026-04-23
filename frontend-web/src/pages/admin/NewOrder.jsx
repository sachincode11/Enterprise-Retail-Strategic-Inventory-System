// src/pages/admin/NewOrder.jsx
import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Button, Input, Badge } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { products, suppliers } from '../../data/mockData';

const TAX_RATE = 0.13;

export default function NewOrder() {
  const { setCurrentPage } = useAdmin();

  const [orderItems, setOrderItems]     = useState([]);
  const [supplier,   setSupplier]       = useState('');
  const [notes,      setNotes]          = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [search,     setSearch]         = useState('');
  const [submitted,  setSubmitted]      = useState(false);

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

  const updateQty = (id, delta) => {
    setOrderItems(prev =>
      prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)
    );
  };

  const updateCost = (id, val) => {
    setOrderItems(prev =>
      prev.map(i => i.id === id ? { ...i, unitCost: parseFloat(val) || 0 } : i)
    );
  };

  const removeItem = (id) => setOrderItems(prev => prev.filter(i => i.id !== id));

  const subtotal = orderItems.reduce((sum, i) => sum + i.unitCost * i.qty, 0);
  const tax      = subtotal * TAX_RATE;
  const total    = subtotal + tax;

  const handleSubmit = () => {
    if (!supplier)         { alert('Please select a supplier.'); return; }
    if (!orderItems.length){ alert('Please add at least one product.'); return; }
    setSubmitted(true);
    setTimeout(() => { setCurrentPage('purchase-orders'); }, 2000);
  };

  if (submitted) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#dcfce7' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#15803d" strokeWidth="2.5">
              <path d="M6 16l7 7 13-13" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#0f172a] mb-1">Order Submitted!</h2>
          <p className="text-sm text-[#94a3b8]">Redirecting to Purchase Orders…</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        breadcrumb={<span className="cursor-pointer hover:text-[#1e3a5f] transition-colors" onClick={() => setCurrentPage('purchase-orders')}>← Back to Purchase Orders</span>}
        title="New Order"
        actions={
          <>
            <Button variant="secondary" onClick={() => setCurrentPage('purchase-orders')}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit}>Submit Order</Button>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-5">
        {/* Left — Product Selection */}
        <div className="col-span-2 space-y-5">

          {/* Order Details */}
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Order Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Supplier *</label>
                <select
                  className="w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f]"
                  value={supplier} onChange={e => setSupplier(e.target.value)}
                >
                  <option value="">Select supplier…</option>
                  {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <Input label="Expected Delivery" type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
              <div className="col-span-2">
                <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">Notes</label>
                <textarea
                  className="w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f] resize-none"
                  rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Delivery instructions, special requests…"
                />
              </div>
            </div>
          </div>

          {/* Product Selection */}
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Select Products</h3>

            {/* Search */}
            <div className="relative mb-4">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search products by name or SKU…"
                className="w-full pl-9 pr-4 py-2 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f] focus:bg-white transition-all"
              />
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
              {filtered.map(product => {
                const inOrder = orderItems.find(i => i.id === product.id);
                return (
                  <div key={product.id}
                    className="flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer"
                    style={{ borderColor: inOrder ? '#1e3a5f' : '#e2e8f0', background: inOrder ? '#eff6ff' : '#f8fafc' }}
                    onClick={() => addItem(product)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#0f172a] truncate">{product.name}</p>
                      <p className="text-[10px] font-mono text-[#94a3b8]">{product.sku}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium text-[#1e3a5f]">{product.price}</span>
                        <Badge status={product.status} />
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      {inOrder ? (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#1e3a5f' }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2"><path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center" style={{ borderColor: '#e2e8f0', color: '#94a3b8' }}>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 2v6M2 5h6" strokeLinecap="round"/></svg>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-[#94a3b8] mt-3">Click a product to add it to the order</p>
          </div>

          {/* Order Items Table */}
          {orderItems.length > 0 && (
            <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
              <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#e2e8f0' }}>
                <h3 className="text-sm font-semibold text-[#0f172a]">Order Items</h3>
                <span className="text-xs text-[#94a3b8]">{orderItems.length} item{orderItems.length !== 1 ? 's' : ''}</span>
              </div>
              <table className="data-table">
                <thead>
                  <tr><th>Product</th><th>SKU</th><th>Qty</th><th>Unit Cost (Rs)</th><th>Line Total</th><th></th></tr>
                </thead>
                <tbody>
                  {orderItems.map(item => (
                    <tr key={item.id}>
                      <td className="text-sm font-medium text-[#0f172a]">{item.name}</td>
                      <td><span className="mono text-xs text-[#94a3b8]">{item.sku}</span></td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded border flex items-center justify-center text-sm hover:bg-[#eff6ff] transition-all" style={{ borderColor: '#e2e8f0' }}>−</button>
                          <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, +1)} className="w-6 h-6 rounded border flex items-center justify-center text-sm hover:bg-[#eff6ff] transition-all" style={{ borderColor: '#e2e8f0' }}>+</button>
                        </div>
                      </td>
                      <td>
                        <input
                          type="number" value={item.unitCost}
                          onChange={e => updateCost(item.id, e.target.value)}
                          className="w-24 px-2 py-1.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f]"
                        />
                      </td>
                      <td className="text-sm font-semibold text-[#1e3a5f]">Rs {(item.unitCost * item.qty).toLocaleString()}</td>
                      <td>
                        <button onClick={() => removeItem(item.id)} className="w-7 h-7 rounded border flex items-center justify-center hover:bg-red-50 transition-all" style={{ borderColor: '#e2e8f0' }}>
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#dc2626" strokeWidth="1.5"><path d="M1 3h10M4 3V1.5h4V3M9.5 3l-.5 7.5H3L2.5 3"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right — Order Summary */}
        <div className="space-y-5">
          {/* Summary Card */}
          <div className="bg-white rounded-xl border p-5 sticky top-[72px]" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Order Summary</h3>

            {orderItems.length === 0 ? (
              <div className="py-8 text-center">
                <svg className="mx-auto mb-3 text-[#e2e8f0]" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-4 0v2M8 7V5a2 2 0 00-4 0v2"/><path d="M12 12v4M10 14h4"/></svg>
                <p className="text-xs text-[#94a3b8]">No products selected yet</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  {orderItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-[#475569] truncate flex-1 mr-2">{item.name} × {item.qty}</span>
                      <span className="font-medium text-[#0f172a] flex-shrink-0">Rs {(item.unitCost * item.qty).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-3 space-y-2" style={{ borderColor: '#e2e8f0' }}>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#475569]">Subtotal</span>
                    <span className="font-medium text-[#0f172a]">Rs {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#475569]">VAT (13%)</span>
                    <span className="font-medium text-[#0f172a]">Rs {tax.toFixed(0)}</span>
                  </div>
                  <div className="h-px my-1" style={{ background: '#e2e8f0' }} />
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold text-[#0f172a]">Total</span>
                    <span className="text-lg font-bold text-[#1e3a5f]">Rs {total.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>
                  </div>
                </div>
              </>
            )}

            {/* Supplier Summary */}
            {supplier && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: '#e2e8f0' }}>
                <p className="text-xs text-[#94a3b8] mb-1">Supplier</p>
                <p className="text-sm font-medium text-[#0f172a]">{supplier}</p>
                {deliveryDate && <p className="text-xs text-[#94a3b8] mt-1">Delivery: {deliveryDate}</p>}
              </div>
            )}

            <div className="mt-5 space-y-2">
              <Button variant="primary" className="w-full" onClick={handleSubmit}>
                Submit Order
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => setCurrentPage('purchase-orders')}>
                Cancel
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Quick Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-[#94a3b8]">Items Selected</span><span className="font-medium text-[#0f172a]">{orderItems.length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#94a3b8]">Total Units</span><span className="font-medium text-[#0f172a]">{orderItems.reduce((s,i)=>s+i.qty,0)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#94a3b8]">Order Value</span><span className="font-semibold text-[#1e3a5f]">Rs {total.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span></div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
