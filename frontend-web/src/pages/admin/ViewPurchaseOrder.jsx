// src/pages/admin/ViewPurchaseOrder.jsx — IMPROVED: reads live order from AppContext via editTarget
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Badge, Button, Toast } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { useApp } from '../../context/AppContext';
import { useState } from 'react';

// Fallback static line items when orderItems aren't embedded (pre-existing mock orders)
const FALLBACK_ITEMS = [
  { sku: 'SKU-00412', name: 'Organic Basmati Rice 5kg', qty: 100, unit: 'bags', unitCost: 'Rs 280', total: 'Rs 28,000' },
  { sku: 'SKU-00198', name: 'Nescafé Classic 100g',     qty: 50,  unit: 'pcs',  unitCost: 'Rs 390', total: 'Rs 19,500' },
  { sku: 'SKU-00102', name: 'Tata Salt 1kg',            qty: 200, unit: 'pcs',  unitCost: 'Rs 36',  total: 'Rs 7,200'  },
];

export default function ViewPurchaseOrder() {
  const { setCurrentPage, editTarget } = useAdmin();
  const { orders, receiveOrder }       = useApp();
  const [receiving, setReceiving]      = useState(false);
  const [toast, setToast]              = useState({ visible: false, message: '' });

  // Use editTarget if set (from PO list click), otherwise fallback to first order
  const po = editTarget || orders[0];

  const lineItems = po?.orderItems
    ? po.orderItems.map(i => ({
        sku:      i.productId,
        name:     i.name,
        qty:      i.qty,
        unit:     'pcs',
        unitCost: `Rs ${i.unitCost}`,
        total:    `Rs ${(i.qty * i.unitCost).toLocaleString('en-IN')}`,
      }))
    : FALLBACK_ITEMS;

  const showToast = (msg) => { setToast({ visible: true, message: msg }); setTimeout(() => setToast(t => ({ ...t, visible: false })), 2000); };

  const handleReceive = async () => {
    if (!po || po.status === 'Received') return;
    setReceiving(true);
    await receiveOrder(po.id, po.orderItems || []);
    setReceiving(false);
    showToast('Order marked as received — stock updated.');
    setTimeout(() => setCurrentPage('purchase-orders'), 1200);
  };

  const steps = [
    { label: 'Order Created',        date: po?.ordered,  done: true },
    { label: 'Supplier Confirmed',   date: 'Pending',    done: po?.status === 'Received' },
    { label: 'Shipment Dispatched',  date: 'Pending',    done: po?.status === 'Received' },
    { label: 'Received at Store',    date: po?.expected, done: po?.status === 'Received' },
  ];

  return (
    <AdminLayout>
      <Toast visible={toast.visible} message={toast.message} />
      <PageHeader
        breadcrumb={<span className="cursor-pointer hover:text-[#1e3a5f] transition-colors" onClick={() => setCurrentPage('purchase-orders')}>← Purchase Orders</span>}
        title={`Purchase Order — ${po?.id || '—'}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setCurrentPage('purchase-orders')}>← Back</Button>
            {po?.status === 'Pending' && (
              <Button variant="primary" onClick={handleReceive} disabled={receiving}>
                {receiving ? 'Updating…' : 'Mark as Received'}
              </Button>
            )}
          </>
        }
      />
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-start justify-between mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>
              <div>
                <h3 className="text-base font-bold text-[#0f172a] font-mono">{po?.id}</h3>
                <p className="text-xs text-[#94a3b8] mt-0.5">Issued: {po?.ordered}</p>
              </div>
              <Badge status={po?.status} />
            </div>
            <div className="grid grid-cols-3 gap-6">
              {[
                { label: 'Supplier',          value: po?.supplier },
                { label: 'Expected Delivery', value: po?.expected },
                { label: 'Order Value',       value: po?.value },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-xs text-[#94a3b8] uppercase tracking-wider mb-1">{f.label}</p>
                  <p className="text-sm font-semibold text-[#0f172a]">{f.value || '—'}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: '#e2e8f0' }}>
              <h3 className="text-sm font-semibold text-[#0f172a]">Line Items</h3>
            </div>
            <table className="data-table">
              <thead><tr><th>SKU</th><th>Product</th><th>Qty</th><th>Unit</th><th>Unit Cost</th><th>Total</th></tr></thead>
              <tbody>
                {lineItems.map((item, i) => (
                  <tr key={i}>
                    <td><span className="mono text-xs">{item.sku}</span></td>
                    <td className="text-sm font-medium">{item.name}</td>
                    <td className="text-sm">{item.qty}</td>
                    <td className="text-sm">{item.unit}</td>
                    <td className="text-sm">{item.unitCost}</td>
                    <td className="text-sm font-semibold">{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 flex justify-end border-t" style={{ borderColor: '#e2e8f0' }}>
              <div className="text-right">
                <p className="text-xs text-[#94a3b8]">Order Total</p>
                <p className="text-lg font-bold text-[#1e3a5f]">{po?.value}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4">Order Timeline</h3>
            <div className="space-y-3">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${s.done ? 'bg-[#22c55e]' : 'bg-[#e2e8f0]'}`}>
                    {s.done && <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2"><path d="M2 5l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#0f172a]">{s.label}</p>
                    <p className="text-[10px] text-[#94a3b8]">{s.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Actions</h3>
            <div className="space-y-2">
              {po?.status === 'Pending' ? (
                <Button variant="primary" className="w-full" onClick={handleReceive} disabled={receiving}>
                  {receiving ? 'Updating…' : 'Mark as Received'}
                </Button>
              ) : (
                <div className="px-3 py-2 rounded-lg text-xs text-center text-[#16a34a] bg-[#dcfce7]">Order has been received</div>
              )}
              <Button variant="secondary" className="w-full" onClick={() => setCurrentPage('purchase-orders')}>Back to Orders</Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
