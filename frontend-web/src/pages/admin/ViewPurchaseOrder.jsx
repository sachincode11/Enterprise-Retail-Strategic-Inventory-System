// src/pages/admin/ViewPurchaseOrder.jsx
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Badge, Button } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { purchaseOrders } from '../../data/mockData';

const poLineItems = [
  { sku:'SKU-00412', name:'Organic Basmati Rice 5kg', qty:100, unit:'bags', unitCost:'Rs 280', total:'Rs 28,000' },
  { sku:'SKU-00198', name:'Nescafé Classic 100g',     qty:50,  unit:'pcs',  unitCost:'Rs 390', total:'Rs 19,500' },
  { sku:'SKU-00102', name:'Tata Salt 1kg',            qty:200, unit:'pcs',  unitCost:'Rs 36',  total:'Rs 7,200'  },
];

export default function ViewPurchaseOrder() {
  const { setCurrentPage } = useAdmin();
  const po = purchaseOrders[0];

  return (
    <AdminLayout>
      <PageHeader
        breadcrumb={<span className="cursor-pointer hover:text-[#1e3a5f] transition-colors" onClick={() => setCurrentPage('purchase-orders')}>← Back to Purchase Orders</span>}
        title={`Purchase Order — ${po?.id || '#PO-2026-041'}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setCurrentPage('purchase-orders')}>← Back</Button>
            <Button variant="secondary">↓ Export PDF</Button>
            <Button variant="primary">Mark as Received</Button>
          </>
        }
      />
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <div className="bg-white rounded-xl border p-5" style={{ borderColor:'#e2e8f0' }}>
            <div className="flex items-start justify-between mb-4 pb-3 border-b" style={{ borderColor:'#e2e8f0' }}>
              <div>
                <h3 className="text-base font-bold text-[#0f172a] font-mono">{po?.id}</h3>
                <p className="text-xs text-[#94a3b8] mt-0.5">Issued: {po?.ordered}</p>
              </div>
              <Badge status={po?.status} />
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div><p className="text-xs text-[#94a3b8] uppercase tracking-wider mb-1">Supplier</p><p className="text-sm font-semibold text-[#0f172a]">{po?.supplier}</p></div>
              <div><p className="text-xs text-[#94a3b8] uppercase tracking-wider mb-1">Expected Delivery</p><p className="text-sm font-semibold text-[#0f172a]">{po?.expected}</p></div>
              <div><p className="text-xs text-[#94a3b8] uppercase tracking-wider mb-1">Order Value</p><p className="text-sm font-semibold text-[#0f172a]">{po?.value}</p></div>
            </div>
          </div>
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor:'#e2e8f0' }}>
            <div className="px-5 py-4 border-b" style={{ borderColor:'#e2e8f0' }}><h3 className="text-sm font-semibold text-[#0f172a]">Line Items</h3></div>
            <table className="data-table">
              <thead><tr><th>SKU</th><th>Product</th><th>Qty</th><th>Unit</th><th>Unit Cost</th><th>Total</th></tr></thead>
              <tbody>
                {poLineItems.map(item => (
                  <tr key={item.sku}>
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
            <div className="px-5 py-3 flex justify-end border-t" style={{ borderColor:'#e2e8f0' }}>
              <div className="text-right">
                <p className="text-xs text-[#94a3b8]">Order Total</p>
                <p className="text-lg font-bold text-[#1e3a5f]">{po?.value}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-5">
          <div className="bg-white rounded-xl border p-5" style={{ borderColor:'#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4">Order Status</h3>
            <div className="space-y-3">
              {[{label:'Order Created',date:po?.ordered,done:true},{label:'Supplier Confirmed',date:'Pending',done:false},{label:'Shipment Dispatched',date:'Pending',done:false},{label:'Received at Store',date:po?.expected,done:false}].map((s,i)=>(
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${s.done?'bg-[#22c55e]':'bg-[#e2e8f0]'}`}>
                    {s.done && <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2"><path d="M2 5l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <div><p className="text-xs font-medium text-[#0f172a]">{s.label}</p><p className="text-[10px] text-[#94a3b8]">{s.date}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5" style={{ borderColor:'#e2e8f0' }}>
            <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Actions</h3>
            <div className="space-y-2">
              <Button variant="primary" className="w-full">Mark as Received</Button>
              <Button variant="secondary" className="w-full">Send Reminder</Button>
              <Button variant="danger" className="w-full">Cancel Order</Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
