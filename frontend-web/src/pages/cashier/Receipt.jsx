// src/pages/cashier/Receipt.jsx — IMPROVED: email removed, print + download only, uses lastTransaction
import { useCashier } from '../../context/CashierContext';
import { useApp } from '../../context/AppContext';

export default function Receipt() {
  const {
    subtotal, discountAmt, tax, total, tendered, change,
    paymentMethod, selectedCustomer, setCurrentPage, clearCart,
    lastTransaction,
  } = useCashier();
  const { nowNP } = useApp();

  // Use lastTransaction snapshot if available (survives cart clear)
  const snap = lastTransaction || {};
  const cartItems     = snap.cart || [];
  const snapSubtotal  = snap.subtotal  ?? subtotal;
  const snapDiscount  = snap.discountAmt ?? discountAmt;
  const snapTax       = snap.tax       ?? tax;
  const snapTotal     = snap.total     ?? total;
  const snapTendered  = snap.tendered  ?? tendered;
  const snapChange    = snap.change    ?? change;
  const snapMethod    = snap.paymentMethod ?? paymentMethod;
  const snapCustomer  = snap.selectedCustomer ?? selectedCustomer;
  const txnId         = snap.id || `#TXN-${Date.now().toString().slice(-6)}`;

  const txnDate = nowNP.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kathmandu' });
  const txnTime = nowNP.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kathmandu' });

  const handleNewTxn = () => { clearCart(); setCurrentPage('pos'); };

  const handleDownload = () => {
    const lines = [
      '================================',
      '         INVO STORE',
      '  New Baneshwor, Kathmandu',
      '  Tel: +977-1-441-0000',
      '================================',
      `TXN: ${txnId}`,
      `Date: ${txnDate}   Time: ${txnTime}`,
      snapCustomer ? `Customer: ${snapCustomer.name}` : '',
      '--------------------------------',
      'Items:',
      ...cartItems.map(i => `  ${i.name}\n  ${i.qty} x Rs ${i.price} = Rs ${(i.price * i.qty).toLocaleString()}`),
      '--------------------------------',
      `Subtotal:  Rs ${snapSubtotal.toLocaleString()}`,
      snapDiscount > 0 ? `Discount:  -Rs ${Math.round(snapDiscount)}` : '',
      `VAT (13%): Rs ${Math.round(snapTax)}`,
      `TOTAL:     Rs ${Math.round(snapTotal).toLocaleString()}`,
      `Payment:   ${snapMethod}`,
      snapMethod === 'Cash' && snapTendered > 0 ? `Tendered:  Rs ${snapTendered.toLocaleString()}` : '',
      snapMethod === 'Cash' && snapTendered > 0 ? `Change:    Rs ${Math.max(0, snapChange).toFixed(0)}` : '',
      '================================',
      '   Thank you for shopping!',
      '   Please come again',
      '================================',
    ].filter(Boolean).join('\n');

    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `receipt-${txnId.replace('#', '')}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-8" style={{ background: '#e2e8f0' }}>
      {/* Toolbar */}
      <div className="w-[520px] flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-[#475569]">Thermal Receipt Preview</span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[#94a3b8]">{txnId}</span>
          <button onClick={() => setCurrentPage('pos')}
            className="px-4 py-1.5 border border-[#e2e8f0] text-xs rounded-lg text-[#475569] hover:border-[#bfdbfe] bg-white transition-colors">← Back</button>
          <button onClick={handleNewTxn}
            className="px-4 py-1.5 bg-[#1e3a5f] text-white text-xs rounded-lg hover:bg-[#16324f] transition-colors">New Transaction</button>
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
          <p className="text-xs font-mono text-[#94a3b8]">TXN: {txnId}</p>
          <p className="text-xs font-mono text-[#94a3b8]">Date: {txnDate} &nbsp; Time: {txnTime}</p>
          <p className="text-xs font-mono text-[#94a3b8]">Cashier: Kasim R. &nbsp; Shift: #0842</p>
        </div>

        {/* Customer */}
        {snapCustomer && (
          <div className="px-8 py-3 border-b border-dashed border-[#e2e8f0]">
            <p className="text-xs font-mono text-[#475569]">Customer: {snapCustomer.name}</p>
            <p className="text-xs font-mono text-[#475569]">Phone: {snapCustomer.phone}</p>
          </div>
        )}

        {/* Items */}
        <div className="px-8 py-4">
          <div className="flex justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Item</span>
            <span className="text-[10px] font-mono font-bold text-[#999] uppercase tracking-widest">Amt</span>
          </div>
          <div className="border-t border-[#e2e8f0] pt-3 space-y-3">
            {cartItems.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-[#0f172a] leading-tight" style={{ maxWidth: 200 }}>{item.name}</span>
                  <span className="text-sm font-semibold text-[#0f172a]">Rs {(item.price * item.qty).toLocaleString()}</span>
                </div>
                <p className="text-xs text-[#94a3b8] font-mono">{item.qty} × Rs {item.price}</p>
              </div>
            ))}
            {cartItems.length === 0 && <p className="text-xs text-[#94a3b8] text-center py-2">No items on receipt</p>}
          </div>
        </div>

        {/* Totals */}
        <div className="px-8 pb-4 border-t border-dashed border-[#e2e8f0] pt-3 space-y-1.5">
          <div className="flex justify-between text-xs text-[#94a3b8]"><span>Subtotal</span><span>Rs {Math.round(snapSubtotal).toLocaleString()}</span></div>
          {snapDiscount > 0 && <div className="flex justify-between text-xs text-green-600"><span>Discount</span><span>-Rs {Math.round(snapDiscount).toLocaleString()}</span></div>}
          <div className="flex justify-between text-xs text-[#94a3b8]"><span>Tax (13%)</span><span>Rs {Math.round(snapTax).toLocaleString()}</span></div>
          <div className="flex justify-between font-black text-base border-t border-[#e2e8f0] pt-2 mt-2"><span>TOTAL</span><span>Rs {Math.round(snapTotal).toLocaleString()}</span></div>
          <div className="flex justify-between text-xs text-[#94a3b8]"><span>Payment</span><span>{snapMethod}</span></div>
          {snapMethod === 'Cash' && snapTendered > 0 && <>
            <div className="flex justify-between text-xs text-[#94a3b8]"><span>Tendered</span><span>Rs {snapTendered.toLocaleString()}</span></div>
            <div className="flex justify-between text-xs font-bold text-green-600"><span>Change</span><span>Rs {Math.max(0, snapChange).toFixed(0)}</span></div>
          </>}
        </div>

        {/* Footer — PRINT + DOWNLOAD only, email removed */}
        <div className="px-8 py-6 text-center border-t-2 border-dashed border-[#e2e8f0]">
          <p className="text-xs font-mono text-[#94a3b8]">Thank you for shopping!</p>
          <p className="text-xs font-mono text-[#94a3b8] mt-1">Please come again · invosix.np</p>
          <div className="mt-4 flex justify-center gap-3">
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs px-4 py-1.5 border border-[#e2e8f0] rounded-lg text-[#475569] hover:border-[#1e3a5f] hover:text-[#1e3a5f] transition-all">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              Print
            </button>
            <button onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs px-4 py-1.5 border border-[#e2e8f0] rounded-lg text-[#475569] hover:border-[#1e3a5f] hover:text-[#1e3a5f] transition-all">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
