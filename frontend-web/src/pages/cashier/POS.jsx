// src/pages/cashier/POS.jsx
// CHANGES: emojis removed, wallet option removed, QR payment added, discount modal added.
import { useState } from 'react';
import CashierLayout from '../../layouts/CashierLayout';
import { useCashier } from '../../context/CashierContext';
import { Modal } from '../../components/common';
import { addTransaction } from '../../services/transactionService';

function CustomerPanel({ selectedCustomer, setSelectedCustomer }) {
  const [tab, setTab]       = useState('Registered');
  const [search, setSearch] = useState('');
  const mockCustomers = [
    { name: 'Rohan Sharma',   phone: '+977-9841-234567', orders: 14 },
    { name: 'Sunita KC',      phone: '+977-9812-009934', orders: 28 },
    { name: 'Priya Shrestha', phone: '+977-9823-112233', orders: 19 },
  ];
  const shown = tab === 'Guest'
    ? [{ name: 'Walk-in Guest', phone: '—', orders: 0 }]
    : mockCustomers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex mb-3 bg-[#f1f5f9] rounded-lg p-0.5">
        {['Registered', 'Guest'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${tab === t ? 'bg-[#1e3a5f] text-white' : 'text-[#94a3b8] hover:text-[#0f172a]'}`}
          >{t}</button>
        ))}
      </div>
      {tab === 'Registered' && (
        <div className="flex gap-2 mb-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer..."
            className="flex-1 px-3 py-2 text-xs bg-[#f1f5f9] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f] transition-colors" />
        </div>
      )}
      {!selectedCustomer && (
        <div className="space-y-1 max-h-28 overflow-y-auto">
          {shown.map((c, i) => (
            <button key={i} onClick={() => setSelectedCustomer(c)} className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-[#eff6ff] transition-colors">
              <span className="font-medium text-[#0f172a]">{c.name}</span>
              <span className="text-[#94a3b8] ml-2">{c.phone}</span>
            </button>
          ))}
        </div>
      )}
      {selectedCustomer && (
        <div className="bg-[#f1f5f9] rounded-lg p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center justify-center text-sm font-bold text-white">{selectedCustomer.name[0]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#0f172a]">{selectedCustomer.name}</p>
            <p className="text-[11px] text-[#94a3b8] font-mono">{selectedCustomer.phone} · {selectedCustomer.orders} orders</p>
          </div>
          <button onClick={() => setSelectedCustomer(null)} className="text-[#94a3b8] hover:text-[#0f172a] text-lg leading-none">×</button>
        </div>
      )}
    </div>
  );
}

function DiscountModal({ isOpen, onClose, onApply }) {
  const [type,  setType]  = useState('percent');
  const [value, setValue] = useState('');
  const apply = () => {
    const num = parseFloat(value);
    if (!num || num <= 0) return;
    onApply(type === 'percent' ? num : num);
    onClose();
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Apply Discount">
      <div className="space-y-4">
        <div className="flex gap-2">
          {['percent', 'flat'].map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`flex-1 py-2 text-sm rounded-lg border transition-all ${type === t ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'border-[#e2e8f0] text-[#475569]'}`}>
              {t === 'percent' ? 'Percentage (%)' : 'Flat Amount (Rs)'}
            </button>
          ))}
        </div>
        <div>
          <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">
            {type === 'percent' ? 'Discount %' : 'Amount (Rs)'}
          </label>
          <input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder={type === 'percent' ? 'e.g. 10' : 'e.g. 100'}
            className="w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f]" />
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={apply} className="btn-primary">Apply Discount</button>
        </div>
      </div>
    </Modal>
  );
}

// QR Payment Modal — replaces wallet
function QRModal({ isOpen, onClose, total, onConfirm }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="QR Payment">
      <div className="text-center space-y-4">
        <p className="text-sm text-[#475569]">Scan the QR code to pay</p>
        {/* QR placeholder */}
        <div className="mx-auto w-40 h-40 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl flex items-center justify-center">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            {/* Simple QR illustration */}
            <rect x="5" y="5" width="30" height="30" rx="3" fill="#1e3a5f" opacity="0.15"/>
            <rect x="10" y="10" width="20" height="20" rx="2" fill="#1e3a5f"/>
            <rect x="45" y="5" width="30" height="30" rx="3" fill="#1e3a5f" opacity="0.15"/>
            <rect x="50" y="10" width="20" height="20" rx="2" fill="#1e3a5f"/>
            <rect x="5" y="45" width="30" height="30" rx="3" fill="#1e3a5f" opacity="0.15"/>
            <rect x="10" y="50" width="20" height="20" rx="2" fill="#1e3a5f"/>
            <rect x="45" y="45" width="8" height="8" rx="1" fill="#1e3a5f"/>
            <rect x="57" y="45" width="8" height="8" rx="1" fill="#1e3a5f"/>
            <rect x="45" y="57" width="8" height="8" rx="1" fill="#1e3a5f"/>
            <rect x="57" y="57" width="18" height="18" rx="2" fill="#1e3a5f" opacity="0.4"/>
          </svg>
        </div>
        <div className="text-2xl font-bold text-[#0f172a]">Rs {total.toFixed(2)}</div>
        <p className="text-xs text-[#94a3b8]">eSewa / Khalti / ConnectIPS accepted</p>
        <div className="flex gap-2">
          <button onClick={onClose}    className="btn-secondary flex-1">Cancel</button>
          <button onClick={onConfirm}  className="btn-primary flex-1">Confirm Payment</button>
        </div>
      </div>
    </Modal>
  );
}

export default function POS() {
  const {
    cart, updateQty, removeFromCart, clearCart,
    discount, setDiscount,
    paymentMethod, setPaymentMethod,
    tendered, setTendered,
    selectedCustomer, setSelectedCustomer,
    holdTransaction, voidCart,
    subtotal, discountAmt, tax, total, change,
    setCurrentPage,
  } = useCashier();

  const [searchQuery, setSearchQuery]       = useState('');
  const [discountOpen, setDiscountOpen]     = useState(false);
  const [qrOpen, setQrOpen]                 = useState(false);
  const [processing, setProcessing]         = useState(false);

  // Payment methods — wallet REMOVED, QR ADDED
  const PAYMENT_METHODS = ['Cash', 'Card', 'QR'];

  const handleCharge = async () => {
    if (paymentMethod === 'QR') { setQrOpen(true); return; }
    await processPayment();
  };

  const processPayment = async () => {
    if (!cart.length) return;
    setProcessing(true);
    await addTransaction({
      customer: selectedCustomer?.name || 'Walk-in Guest',
      cashier: 'Kasim R.',
      items: cart.length,
      method: paymentMethod,
      amount: `Rs ${total.toFixed(0)}`,
    });
    setProcessing(false);
    clearCart();
    setCurrentPage('receipt');
  };

  return (
    <CashierLayout>
      <div className="flex h-full">
        {/* Left: Cart */}
        <div className="flex-1 flex flex-col border-r border-[#e2e8f0] overflow-hidden">
          <div className="px-6 py-4 bg-white border-b border-[#e2e8f0] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-[#0f172a]">New Transaction</h2>
              <span className="text-xs text-[#94a3b8] font-mono">#TXN-{Date.now().toString().slice(-6)}</span>
            </div>
            {/* Action buttons — emojis removed */}
            <div className="flex gap-2">
              <button onClick={() => setDiscountOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#e2e8f0] rounded-lg text-[#475569] hover:border-[#bfdbfe] transition-colors bg-white">
                Discount
              </button>
              <button onClick={voidCart}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#e2e8f0] rounded-lg text-[#475569] hover:border-[#fecaca] hover:text-[#ef4444] transition-colors bg-white">
                Void
              </button>
              <button onClick={holdTransaction}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#e2e8f0] rounded-lg text-[#475569] hover:border-[#bfdbfe] transition-colors bg-white">
                Hold
              </button>
            </div>
          </div>

          <div className="px-6 py-3 bg-[#f8fafc] border-b border-[#e2e8f0] flex gap-3 shrink-0">
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search product or scan barcode..."
              className="flex-1 px-4 py-2 text-sm bg-white border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f] transition-colors" />
            <button className="px-4 py-2 text-sm border border-[#e2e8f0] rounded-lg text-[#475569] hover:border-[#bfdbfe] bg-white transition-colors">Browse</button>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-[#f8fafc] z-10">
                <tr className="border-b border-[#e2e8f0]">
                  <th className="text-left px-6 py-3 text-[10px] font-mono text-[#94a3b8] uppercase tracking-widest w-8">#</th>
                  <th className="text-left px-2 py-3 text-[10px] font-mono text-[#94a3b8] uppercase tracking-widest">Product</th>
                  <th className="text-left px-2 py-3 text-[10px] font-mono text-[#94a3b8] uppercase tracking-widest w-28">Qty</th>
                  <th className="text-left px-2 py-3 text-[10px] font-mono text-[#94a3b8] uppercase tracking-widest">Unit Price</th>
                  <th className="text-right px-6 py-3 text-[10px] font-mono text-[#94a3b8] uppercase tracking-widest">Total</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, i) => (
                  <tr key={item.id} className="border-b border-[#e2e8f0] hover:bg-white/50 transition-colors">
                    <td className="px-6 py-3 text-[11px] text-[#94a3b8] font-mono">{String(i + 1).padStart(2, '0')}</td>
                    <td className="px-2 py-3">
                      <p className="text-sm font-medium text-[#0f172a]">{item.name}</p>
                      <p className="text-[11px] text-[#94a3b8] font-mono">{item.sku} · {item.category}</p>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded border border-[#e2e8f0] flex items-center justify-center text-[#475569] hover:border-[#bfdbfe] transition-colors text-sm">−</button>
                        <span className="text-sm font-medium w-6 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, +1)} className="w-6 h-6 rounded border border-[#e2e8f0] flex items-center justify-center text-[#475569] hover:border-[#bfdbfe] transition-colors text-sm">+</button>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-sm text-[#475569] font-mono">Rs {item.price}.00</td>
                    <td className="px-6 py-3 text-right text-sm font-semibold text-[#0f172a] font-mono">Rs {(item.price * item.qty).toLocaleString()}.00</td>
                    <td className="pr-3 py-3"><button onClick={() => removeFromCart(item.id)} className="text-[#ccc] hover:text-[#999] transition-colors text-lg">×</button></td>
                  </tr>
                ))}
                {discount > 0 && (
                  <tr className="border-b border-[#e2e8f0]">
                    <td className="px-6 py-3"></td>
                    <td className="px-2 py-3" colSpan={2}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#94a3b8]">Discount Applied</span>
                        <span className="text-[10px] font-mono bg-[#1e3a5f] text-white px-2 py-0.5 rounded">{discount}% OFF</span>
                      </div>
                    </td>
                    <td></td>
                    <td className="px-6 py-3 text-right text-sm font-semibold text-[#e65100] font-mono">−Rs {discountAmt.toFixed(2)}</td>
                    <td className="pr-3 py-3">
                      <button onClick={() => setDiscount(0)} className="text-[#ccc] hover:text-[#999] transition-colors text-lg">×</button>
                    </td>
                  </tr>
                )}
                {cart.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-sm text-[#94a3b8]">
                      Scan or search to add products
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Summary */}
        <div className="w-[340px] bg-white flex flex-col shrink-0 overflow-auto">
          <div className="p-4 border-b border-[#e2e8f0]">
            <CustomerPanel selectedCustomer={selectedCustomer} setSelectedCustomer={setSelectedCustomer} />
          </div>

          <div className="p-4 border-b border-[#e2e8f0]">
            <p className="text-[10px] font-mono text-[#94a3b8] uppercase tracking-widest mb-3">Order Summary</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-[#94a3b8]">Subtotal ({cart.length} items)</span><span className="font-mono text-[#0f172a]">Rs {subtotal.toLocaleString()}.00</span></div>
              {discount > 0 && <div className="flex justify-between text-sm"><span className="text-[#94a3b8]">Discount ({discount}%)</span><span className="font-mono text-[#e65100]">−Rs {discountAmt.toFixed(2)}</span></div>}
              <div className="flex justify-between text-sm"><span className="text-[#94a3b8]">Tax (13% VAT)</span><span className="font-mono text-[#0f172a]">Rs {tax.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-[#e2e8f0] mt-2"><span>Total</span><span className="font-mono">Rs {total.toFixed(2)}</span></div>
            </div>
          </div>

          <div className="p-4 border-b border-[#e2e8f0]">
            <p className="text-[10px] font-mono text-[#94a3b8] uppercase tracking-widest mb-3">Payment Method</p>
            {/* Wallet REMOVED — QR added */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {PAYMENT_METHODS.map(m => (
                <button key={m} onClick={() => setPaymentMethod(m)}
                  className="py-2 rounded-lg text-xs font-medium border transition-all"
                  style={{
                    borderColor: paymentMethod === m ? '#1e3a5f' : '#e2e8f0',
                    background:  paymentMethod === m ? '#1e3a5f' : 'white',
                    color:       paymentMethod === m ? 'white' : '#475569',
                  }}>
                  {m}
                </button>
              ))}
            </div>
            {paymentMethod === 'Cash' && (
              <div>
                <label className="block text-[10px] font-mono text-[#94a3b8] uppercase tracking-widest mb-1.5">Cash Tendered (Rs)</label>
                <input type="number" value={tendered} onChange={e => setTendered(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm font-mono bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f]" />
                {tendered >= total && total > 0 && (
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-[#94a3b8]">Change</span>
                    <span className="font-mono font-semibold text-[#16a34a]">Rs {change.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4">
            <button
              onClick={handleCharge}
              disabled={!cart.length || processing}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all hover:bg-[#16324f] hover:shadow-[0_4px_16px_rgba(30,58,95,0.4)] disabled:opacity-40"
              style={{ background: '#1e3a5f' }}
            >
              {processing ? 'Processing…' : `Charge Rs ${total.toFixed(2)}`}
            </button>
            <button onClick={() => setCurrentPage('receipt')} className="w-full mt-2 py-2 text-xs text-[#94a3b8] hover:text-[#475569] transition-colors">
              View Last Receipt
            </button>
          </div>
        </div>
      </div>

      <DiscountModal isOpen={discountOpen} onClose={() => setDiscountOpen(false)} onApply={setDiscount} />
      <QRModal isOpen={qrOpen} onClose={() => setQrOpen(false)} total={total} onConfirm={async () => { setQrOpen(false); await processPayment(); }} />
    </CashierLayout>
  );
}
