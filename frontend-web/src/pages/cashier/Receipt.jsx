// src/pages/cashier/Receipt.jsx
import { useCashier } from '../../context/CashierContext';

export default function Receipt() {
  const { cart, subtotal, discountAmt, tax, total, tendered, change, paymentMethod, selectedCustomer, setCurrentPage, clearCart } = useCashier();
  const txnDate = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
  const txnTime = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });

  const handleNewTxn = () => { clearCart(); setCurrentPage('pos'); };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-8" style={{background:'#e2e8f0'}}>
      {/* Toolbar */}
      <div className="w-[520px] flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-[#475569]">Thermal Receipt Preview</span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[#94a3b8]">#TXN-20260322-0092</span>
          <button onClick={() => setCurrentPage('pos')} className="px-4 py-1.5 border border-[#e2e8f0] text-xs rounded-lg text-[#475569] hover:border-[#bfdbfe] bg-white transition-colors">← Back</button>
          <button onClick={handleNewTxn} className="px-4 py-1.5 bg-[#1e3a5f] text-white text-xs rounded-lg hover:bg-[#16324f] transition-colors">New Transaction</button>
        </div>
      </div>

      {/* Receipt paper */}
      <div className="w-[380px] bg-white rounded-lg shadow-xl overflow-hidden border border-[#e2e8f0]">
        {/* Header */}
        <div className="border-b-2 border-dashed border-[#e2e8f0] p-8 pb-6 text-center">
          <h1 className="text-2xl font-black tracking-wider text-[#0f172a] mb-1">INVO STORE</h1>
          <p className="text-xs text-[#94a3b8] font-mono leading-relaxed">
            New Baneshwor, Kathmandu<br />Tel: +977-1-441-0000<br />PAN: PAN-00112233
          </p>
        </div>

        {/* TXN Info */}
        <div className="px-8 py-4 border-b border-dashed border-[#e2e8f0] text-center">
          <p className="text-xs font-mono text-[#94a3b8]">TXN: #TXN-20260322-0092</p>
          <p className="text-xs font-mono text-[#94a3b8]">Date: {txnDate} &nbsp; Time: {txnTime}</p>
          <p className="text-xs font-mono text-[#94a3b8]">Cashier: Kasim R. &nbsp; Shift: #0842</p>
        </div>

        {/* Customer */}
        {selectedCustomer && (
          <div className="px-8 py-3 border-b border-dashed border-[#e2e8f0]">
            <p className="text-xs font-mono text-[#475569]">Customer: {selectedCustomer.name}</p>
            <p className="text-xs font-mono text-[#475569]">Phone: {selectedCustomer.phone}</p>
          </div>
        )}

        {/* Items */}
        <div className="px-8 py-4">
          <div className="flex justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Item</span>
            <span className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Amt</span>
          </div>
          <div className="border-t border-[#e2e8f0] pt-3 space-y-3">
            {cart.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-[#0f172a] leading-tight" style={{maxWidth:200}}>{item.name}</span>
                  <span className="text-sm font-semibold text-[#0f172a]">Rs {(item.price*item.qty).toLocaleString()}</span>
                </div>
                <p className="text-xs text-[#94a3b8] font-mono">{item.qty} × Rs {item.price}</p>
              </div>
            ))}
            {cart.length === 0 && <p className="text-xs text-[#94a3b8] text-center py-2">No items</p>}
          </div>
        </div>

        {/* Totals */}
        <div className="px-8 pb-4 border-t border-dashed border-[#e2e8f0] pt-3 space-y-1.5">
          <div className="flex justify-between text-xs text-[#94a3b8]"><span>Subtotal</span><span>Rs {subtotal.toLocaleString()}</span></div>
          {discountAmt > 0 && <div className="flex justify-between text-xs text-green-600"><span>Discount</span><span>-Rs {discountAmt.toFixed(0)}</span></div>}
          <div className="flex justify-between text-xs text-[#94a3b8]"><span>Tax (13%)</span><span>Rs {tax.toFixed(0)}</span></div>
          <div className="flex justify-between font-black text-base border-t border-[#e2e8f0] pt-2 mt-2"><span>TOTAL</span><span>Rs {total.toLocaleString(undefined,{maximumFractionDigits:0})}</span></div>
          <div className="flex justify-between text-xs text-[#94a3b8]"><span>Payment</span><span>{paymentMethod}</span></div>
          {paymentMethod === 'Cash' && tendered > 0 && <>
            <div className="flex justify-between text-xs text-[#94a3b8]"><span>Tendered</span><span>Rs {tendered.toLocaleString()}</span></div>
            <div className="flex justify-between text-xs font-bold text-green-600"><span>Change</span><span>Rs {Math.max(0,change).toFixed(0)}</span></div>
          </>}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 text-center border-t-2 border-dashed border-[#e2e8f0]">
          <p className="text-xs font-mono text-[#94a3b8]">Thank you for shopping!</p>
          <p className="text-xs font-mono text-[#94a3b8] mt-1">Please come again · invosix.np</p>
          <div className="mt-4 flex justify-center gap-4">
            <button onClick={() => window.print()} className="text-xs px-4 py-1.5 border border-[#e2e8f0] rounded-lg text-[#475569] hover:border-[#1e3a5f] transition-all">🖨 Print</button>
            <button className="text-xs px-4 py-1.5 border border-[#e2e8f0] rounded-lg text-[#475569] hover:border-[#1e3a5f] transition-all">✉ Email</button>
          </div>
        </div>
      </div>
    </div>
  );
}
