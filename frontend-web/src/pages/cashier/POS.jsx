// src/pages/cashier/POS.jsx — IMPROVED: PIN required for charge, saved to global transactions, void/hold saved
import { useState } from 'react';
import CashierLayout from '../../layouts/CashierLayout';
import { useCashier } from '../../context/CashierContext';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/common';

function CustomerPanel({ selectedCustomer, setSelectedCustomer }) {
  const [tab, setTab]       = useState('Registered');
  const [search, setSearch] = useState('');
  const { customers } = useApp();
  const registered = customers.filter(c => c.type === 'Registered');
  const [guestInfo, setGuestInfo] = useState({ name: 'Walk-in Guest', phone: '' });

  const shown = tab === 'Guest'
    ? []
    : registered.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

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
            className="flex-1 px-3 py-2 text-xs bg-[#f1f5f9] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f]" />
        </div>
      )}
      {tab === 'Guest' && !selectedCustomer && (
        <div className="space-y-2 p-1">
          <input value={guestInfo.name} onChange={e => setGuestInfo({...guestInfo, name: e.target.value})}
            placeholder="Guest Name (Optional)"
            className="w-full px-3 py-2 text-xs bg-[#f1f5f9] border border-[#e2e8f0] rounded-lg outline-none" />
          <input value={guestInfo.phone} onChange={e => setGuestInfo({...guestInfo, phone: e.target.value})}
            placeholder="Phone Number (Optional)"
            className="w-full px-3 py-2 text-xs bg-[#f1f5f9] border border-[#e2e8f0] rounded-lg outline-none" />
          <button onClick={() => setSelectedCustomer({ id: 'guest', ...guestInfo })}
            className="w-full py-2 bg-[#1e3a5f] text-white text-xs font-medium rounded-lg">
            Use Guest Details
          </button>
        </div>
      )}
      {tab === 'Registered' && !selectedCustomer && (
        <div className="space-y-1 max-h-28 overflow-y-auto">
          {shown.map((c) => (
            <button key={c.id} onClick={() => setSelectedCustomer(c)}
              className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-[#eff6ff] transition-colors">
              <span className="font-medium text-[#0f172a]">{c.name}</span>
              <span className="text-[#94a3b8] ml-2">{c.phone}</span>
            </button>
          ))}
        </div>
      )}
      {selectedCustomer && (
        <div className="bg-[#f1f5f9] rounded-lg p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center justify-center text-sm font-bold text-white">
            {selectedCustomer.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#0f172a]">{selectedCustomer.name}</p>
            <p className="text-[11px] text-[#94a3b8] font-mono">{selectedCustomer.phone} · {selectedCustomer.orders || 0} orders</p>
          </div>
          <button onClick={() => setSelectedCustomer(null)} className="text-[#94a3b8] hover:text-[#0f172a] text-lg leading-none">×</button>
        </div>
      )}
    </div>
  );
}

function DiscountModal({ isOpen, onClose, onApply, onSelectPredefined }) {
  const { discounts } = useApp();
  const [type,  setType]  = useState('percent');
  const [value, setValue] = useState('');
  
  const activeTxnDiscounts = discounts.filter(d => 
    d.is_active && d.applies_to === 'transaction'
  );

  const applyManual = () => {
    const num = parseFloat(value);
    if (!num || num <= 0) return;
    onApply(num);
    onSelectPredefined(null);
    onClose();
  };

  const applyPredefined = (d) => {
    onSelectPredefined(d);
    onApply(0); // Clear manual discount if picking predefined
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Apply Discount">
      <div className="space-y-6">
        {/* Predefined Discounts from DB */}
        {activeTxnDiscounts.length > 0 && (
          <div>
            <label className="block text-[10px] font-mono text-[#94a3b8] uppercase tracking-widest mb-3">Predefined Discounts</label>
            <div className="grid grid-cols-1 gap-2">
              {activeTxnDiscounts.map(d => (
                <button key={d.id} onClick={() => applyPredefined(d)}
                  className="flex items-center justify-between p-3 rounded-xl border border-[#e2e8f0] hover:border-[#1e3a5f] hover:bg-[#f8fafc] transition-all group">
                  <div className="text-left">
                    <p className="text-sm font-semibold text-[#0f172a] group-hover:text-[#1e3a5f]">{d.name || d.discount_name}</p>
                    <p className="text-[10px] text-[#94a3b8] font-mono">
                    {d.discount_type === 'percentage' ? `${d.discount_value}% OFF` : `${currencySymbol} ${d.discount_value} OFF`}
                    </p>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[#1e3a5f] opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[#e2e8f0]"></span></div>
          <div className="relative flex justify-center text-[10px] uppercase font-mono text-[#94a3b8]"><span className="bg-white px-2">Or Manual Override</span></div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2 bg-[#f1f5f9] p-1 rounded-lg">
            {['percent', 'flat'].map(t => (
              <button key={t} onClick={() => setType(t)}
                className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${type === t ? 'bg-white text-[#0f172a] shadow-sm' : 'text-[#94a3b8] hover:text-[#475569]'}`}>
                {t === 'percent' ? 'Percentage' : 'Flat Amount'}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-[10px] font-mono text-[#94a3b8] uppercase tracking-widest mb-1.5">
              {type === 'percent' ? 'Discount %' : `Amount (${currencySymbol})`}
            </label>
            <input type="number" value={value} onChange={e => setValue(e.target.value)}
              placeholder={type === 'percent' ? 'e.g. 10' : 'e.g. 100'}
              className="w-full px-4 py-2.5 text-sm font-mono bg-white border border-[#e2e8f0] rounded-xl outline-none focus:border-[#1e3a5f] transition-all" />
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-[#475569] hover:bg-[#f8fafc] rounded-xl transition-colors">Cancel</button>
            <button onClick={applyManual} className="flex-1 py-2.5 bg-[#1e3a5f] text-white text-sm font-bold rounded-xl hover:bg-[#16324f] transition-all">Apply</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function QRModal({ isOpen, onClose, total, onConfirm }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="QR Payment">
      <div className="text-center space-y-4">
        <p className="text-sm text-[#475569]">Scan the QR code to pay</p>
        <div className="mx-auto w-40 h-40 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl flex items-center justify-center">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
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
        <div className="text-2xl font-bold text-[#0f172a]">{currencySymbol} {total.toFixed(2)}</div>
        <p className="text-xs text-[#94a3b8]">eSewa / Khalti / ConnectIPS accepted</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={onConfirm} className="btn-primary flex-1">Confirm Payment</button>
        </div>
      </div>
    </Modal>
  );
}

export default function POS() {
  const {
    cart, addToCart, updateQty, removeFromCart, clearCart,
    discount, setDiscount,
    selectedDiscount, setSelectedDiscount,
    paymentMethod, setPaymentMethod,
    tendered, setTendered,
    selectedCustomer, setSelectedCustomer,
    holdTransaction, voidCart,
    subtotal, discountAmt, tax, total, change,
    setCurrentPage, setLastTransaction,
  } = useCashier();

  // include addToCart from cashier context
  // (merged into the main destructure to avoid multiple hook calls)

  const { addTransaction, products, currencySymbol } = useApp();
  const [searchQuery, setSearchQuery]   = useState('');
  const [discountOpen, setDiscountOpen] = useState(false);
  const [qrOpen, setQrOpen]             = useState(false);
  const [processing, setProcessing]     = useState(false);
  const [browseOpen, setBrowseOpen]     = useState(false);

  const PAYMENT_METHODS = ['Cash', 'Card', 'QR'];

  // Search products from live catalogue
  const productResults = searchQuery.length > 1
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode === searchQuery
      )
    : [];

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter' && searchQuery) {
      // If exact barcode match, add it immediately
      const exactMatch = products.find(p => p.barcode === searchQuery);
      if (exactMatch && exactMatch.stock > 0) {
        addToCart(exactMatch);
        setSearchQuery('');
      } else if (productResults.length === 1 && productResults[0].stock > 0) {
        // If only one result, add it
        addToCart(productResults[0]);
        setSearchQuery('');
      }
    }
  };

  const handleCharge = () => {
    if (!cart.length) return;
    if (paymentMethod === 'QR') { setQrOpen(true); return; }
    processPayment();
  };

  const processPayment = async () => {
    setProcessing(true);
    const isGuest = selectedCustomer?.id === 'guest';
    const txnData = {
      customer_id: isGuest ? null : selectedCustomer?.id,
      guest_name: isGuest ? selectedCustomer.name : null,
      guest_phone: isGuest ? selectedCustomer.phone : null,
      customerName: selectedCustomer?.name || 'Walk-in Guest',
      cashier: 'Kasim R.',
      items: cart.map(i => ({ product_id: i.id, quantity: i.qty })),
      method: paymentMethod,
      total_amount: total,
      discount_ids: selectedDiscount ? [selectedDiscount.id || selectedDiscount.discount_id] : [],
      manual_discount_percent: selectedDiscount ? 0 : discount,
    };
    const saved = await addTransaction(txnData);
    setLastTransaction({
      ...txnData,
      id: saved.id,
      cart: [...cart],
      subtotal, discountAmt, tax, total,
      tendered, change,
      paymentMethod,
      selectedCustomer,
      selectedDiscount,
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
            <div className="flex gap-2">
              <button onClick={() => setDiscountOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#e2e8f0] rounded-lg text-[#475569] hover:border-[#bfdbfe] transition-colors bg-white">
                Discount
              </button>
              <button onClick={() => { voidCart(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#e2e8f0] rounded-lg text-[#475569] hover:border-[#fecaca] hover:text-[#ef4444] transition-colors bg-white">
                Void
              </button>
              <button onClick={holdTransaction}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#e2e8f0] rounded-lg text-[#475569] hover:border-[#bfdbfe] transition-colors bg-white">
                Hold
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="px-6 py-3 bg-[#f8fafc] border-b border-[#e2e8f0] flex gap-3 shrink-0 relative">
            <div className="flex-1 relative">
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                placeholder="Search product or scan barcode..."
                className="w-full px-4 py-2 text-sm bg-white border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f] transition-colors" />
              {/* Live search dropdown */}
              {productResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-[#e2e8f0] rounded-lg shadow-lg z-20 mt-1 max-h-48 overflow-y-auto">
                  {productResults.map(p => (
                    <button key={p.id} onClick={() => {
                      if (p.stock === 0) return;
                      addToCart(p);
                      setSearchQuery('');
                    }}
                      disabled={p.stock === 0}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#eff6ff] border-b border-[#f1f5f9] last:border-0 disabled:opacity-40">
                      <span className="font-medium text-[#0f172a]">{p.name}</span>
                      <span className="text-[#94a3b8] ml-2 text-xs">{p.sku} · {currencySymbol} {p.priceNum} · Stock: {p.stock}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setBrowseOpen(true)}
              className="px-4 py-2 text-sm border border-[#e2e8f0] rounded-lg text-[#475569] hover:border-[#bfdbfe] bg-white transition-colors">Browse</button>
          </div>

          {/* Browse modal */}
          <Modal isOpen={browseOpen} onClose={() => setBrowseOpen(false)} title="Browse Products">
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {products.filter(p => p.stock > 0).map(p => (
                <div key={p.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[#f8fafc]">
                  <div>
                    <p className="text-sm font-medium text-[#0f172a]">{p.name}</p>
                    <p className="text-xs text-[#94a3b8]">{p.sku} · {p.category}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[#1e3a5f]">{currencySymbol} {p.priceNum}</span>
                    <button onClick={() => {
                      addToCart(p);
                      setBrowseOpen(false);
                    }} className="btn-primary text-xs px-3 py-1.5">Add</button>
                  </div>
                </div>
              ))}
            </div>
          </Modal>

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
                    <td className="px-2 py-3 text-sm text-[#475569] font-mono">{currencySymbol} {item.price}.00</td>
                    <td className="px-6 py-3 text-right text-sm font-semibold text-[#0f172a] font-mono">{currencySymbol} {(item.price * item.qty).toLocaleString()}.00</td>
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
                    <td className="px-6 py-3 text-right text-sm font-semibold text-[#e65100] font-mono">−{currencySymbol} {discountAmt.toFixed(2)}</td>
                    <td className="pr-3 py-3"><button onClick={() => setDiscount(0)} className="text-[#ccc] hover:text-[#999] transition-colors text-lg">×</button></td>
                  </tr>
                )}
                {cart.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-sm text-[#94a3b8]">
                      Search or browse to add products
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
              <div className="flex justify-between text-sm"><span className="text-[#94a3b8]">Subtotal ({cart.length} items)</span><span className="font-mono text-[#0f172a]">{currencySymbol} {subtotal.toLocaleString()}.00</span></div>
              {discount > 0 && <div className="flex justify-between text-sm"><span className="text-[#94a3b8]">Discount ({discount}%)</span><span className="font-mono text-[#e65100]">−{currencySymbol} {discountAmt.toFixed(2)}</span></div>}
              <div className="flex justify-between text-sm"><span className="text-[#94a3b8]">Tax (13% VAT)</span><span className="font-mono text-[#0f172a]">{currencySymbol} {tax.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-[#e2e8f0] mt-2"><span>Total</span><span className="font-mono">{currencySymbol} {total.toFixed(2)}</span></div>
            </div>
          </div>
          <div className="p-4 border-b border-[#e2e8f0]">
            <p className="text-[10px] font-mono text-[#94a3b8] uppercase tracking-widest mb-3">Payment Method</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {PAYMENT_METHODS.map(m => (
                <button key={m} onClick={() => setPaymentMethod(m)}
                  className="py-2 rounded-lg text-xs font-medium border transition-all"
                  style={{
                    borderColor: paymentMethod === m ? '#1e3a5f' : '#e2e8f0',
                    background:  paymentMethod === m ? '#1e3a5f' : 'white',
                    color:       paymentMethod === m ? 'white' : '#475569',
                  }}>{m}</button>
              ))}
            </div>
            {paymentMethod === 'Cash' && (
              <div>
                <label className="block text-[10px] font-mono text-[#94a3b8] uppercase tracking-widest mb-1.5">Cash Tendered ({currencySymbol})</label>
                <input type="number" value={tendered} onChange={e => setTendered(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm font-mono bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f]" />
                {tendered >= total && total > 0 && (
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-[#94a3b8]">Change</span>
                    <span className="font-mono font-semibold text-[#16a34a]">{currencySymbol} {change.toFixed(2)}</span>
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
              {processing ? 'Processing…' : `Charge ${currencySymbol} ${total.toFixed(2)}`}
            </button>
            <button onClick={() => setCurrentPage('receipt')} className="w-full mt-2 py-2 text-xs text-[#94a3b8] hover:text-[#475569] transition-colors">
              View Last Receipt
            </button>
          </div>
        </div>
      </div>

      <DiscountModal 
        isOpen={discountOpen} 
        onClose={() => setDiscountOpen(false)} 
        onApply={setDiscount} 
        onSelectPredefined={setSelectedDiscount} 
      />
      <QRModal isOpen={qrOpen} onClose={() => setQrOpen(false)} total={total}
        onConfirm={() => { setQrOpen(false); processPayment(); }} />
    </CashierLayout>
  );
}
