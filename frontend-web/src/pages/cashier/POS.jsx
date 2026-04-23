// src/pages/cashier/POS.jsx
import { useState } from 'react';
import CashierLayout from '../../layouts/CashierLayout';
import { useCashier } from '../../context/CashierContext';

function CustomerPanel({ selectedCustomer, setSelectedCustomer }) {
  const [tab, setTab] = useState('Registered');
  const [search, setSearch] = useState('');
  return (
    <div>
      <div className="flex mb-3 bg-[#f1f5f9] rounded-lg p-0.5">
        {['Registered','Guest'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${tab===t?'bg-[#1e3a5f] text-white':'text-[#94a3b8] hover:text-[#0f172a]'}`}
          >{t==='Registered'?'👤 ':'👥 '}{t}</button>
        ))}
      </div>
      <div className="flex gap-2 mb-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer..."
          className="flex-1 px-3 py-2 text-xs bg-[#f1f5f9] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f] transition-colors" />
        <button className="px-4 py-2 bg-[#1e3a5f] text-white text-xs rounded-lg hover:bg-[#16324f] transition-colors">Find</button>
      </div>
      {selectedCustomer && (
        <div className="bg-[#f1f5f9] rounded-lg p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#ddd] flex items-center justify-center text-sm font-bold text-[#475569]">{selectedCustomer.name[0]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#0f172a]">{selectedCustomer.name}</p>
            <p className="text-[11px] text-[#94a3b8] font-mono">{selectedCustomer.phone} · {selectedCustomer.orders} prev orders</p>
          </div>
          <button onClick={() => setSelectedCustomer(null)} className="text-[#94a3b8] hover:text-[#0f172a] transition-colors text-lg leading-none">×</button>
        </div>
      )}
    </div>
  );
}

export default function POS() {
  const { cart, updateQty, removeFromCart, discount, paymentMethod, setPaymentMethod, tendered, setTendered, selectedCustomer, setSelectedCustomer, subtotal, discountAmt, tax, total, change, setCurrentPage } = useCashier();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <CashierLayout>
      <div className="flex h-full">
        {/* Left: Cart */}
        <div className="flex-1 flex flex-col border-r border-[#e2e8f0] overflow-hidden">
          <div className="px-6 py-4 bg-white border-b border-[#e2e8f0] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-[#0f172a]">New Transaction</h2>
              <span className="text-xs text-[#94a3b8] font-mono">#TXN-20260322-0091</span>
            </div>
            <div className="flex gap-2">
              {['+ Discount','⊠ Void','⊟ Hold'].map(lbl => (
                <button key={lbl} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#e2e8f0] rounded-lg text-[#475569] hover:border-[#bfdbfe] transition-colors bg-white">{lbl}</button>
              ))}
            </div>
          </div>
          <div className="px-6 py-3 bg-[#f8fafc] border-b border-[#e2e8f0] flex gap-3 shrink-0">
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search product or scan barcode..."
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
                    <td className="px-6 py-3 text-[11px] text-[#94a3b8] font-mono">{String(i+1).padStart(2,'0')}</td>
                    <td className="px-2 py-3"><p className="text-sm font-medium text-[#0f172a]">{item.name}</p><p className="text-[11px] text-[#94a3b8] font-mono">{item.sku} · {item.category}</p></td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.id,-1)} className="w-6 h-6 rounded border border-[#e2e8f0] flex items-center justify-center text-[#475569] hover:border-[#bfdbfe] transition-colors text-sm">−</button>
                        <span className="text-sm font-medium w-6 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id,+1)} className="w-6 h-6 rounded border border-[#e2e8f0] flex items-center justify-center text-[#475569] hover:border-[#bfdbfe] transition-colors text-sm">+</button>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-sm text-[#475569] font-mono">Rs {item.price}.00</td>
                    <td className="px-6 py-3 text-right text-sm font-semibold text-[#0f172a] font-mono">Rs {(item.price*item.qty).toLocaleString()}.00</td>
                    <td className="pr-3 py-3"><button onClick={() => removeFromCart(item.id)} className="text-[#ccc] hover:text-[#999] transition-colors text-lg">×</button></td>
                  </tr>
                ))}
                {discount > 0 && (
                  <tr className="border-b border-[#e2e8f0]">
                    <td className="px-6 py-3"></td>
                    <td className="px-2 py-3" colSpan={2}><div className="flex items-center gap-2"><span className="text-sm text-[#94a3b8]">Seasonal Discount</span><span className="text-[10px] font-mono bg-[#1e3a5f] text-white px-2 py-0.5 rounded">{discount}% OFF</span></div></td>
                    <td></td>
                    <td className="px-6 py-3 text-right text-sm font-semibold text-[#e65100] font-mono">−Rs {discountAmt.toFixed(2)}</td>
                    <td className="pr-3 py-3"><button className="text-[#ccc] hover:text-[#999] transition-colors text-lg">×</button></td>
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
          <div className="p-4 border-b border-[#e2e8f0] flex-1">
            <p className="text-[10px] font-mono text-[#94a3b8] uppercase tracking-widest mb-3">Order Summary</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-[#94a3b8]">Subtotal ({cart.length} items)</span><span className="font-mono text-[#0f172a]">Rs {subtotal.toLocaleString()}.00</span></div>
              {discount > 0 && <div className="flex justify-between text-sm"><span className="text-[#94a3b8]">Discount ({discount}%)</span><span className="font-mono text-[#e65100]">− Rs {discountAmt.toFixed(2)}</span></div>}
              <div className="flex justify-between text-sm"><span className="text-[#94a3b8]">Tax (13% VAT)</span><span className="font-mono text-[#0f172a]">Rs {tax.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-[#e2e8f0] mt-2"><span>Total</span><span className="font-mono">Rs {total.toFixed(2)}</span></div>
            </div>
          </div>
          <div className="p-4 border-b border-[#e2e8f0]">
            <p className="text-[10px] font-mono text-[#94a3b8] uppercase tracking-widest mb-3">Payment Method</p>
            <div className="flex gap-2">
              {[{id:'Cash',icon:'💵'},{id:'Card',icon:'💳'},{id:'Wallet',icon:'📱'}].map(m => (
                <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-1 ${paymentMethod===m.id?'bg-[#1e3a5f] text-white':'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'}`}
                ><span className="text-base">{m.icon}</span>{m.id}</button>
              ))}
            </div>
          </div>
          <div className="p-4 border-b border-[#e2e8f0]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] text-[#94a3b8] font-mono w-16 shrink-0">Tendered</span>
              <div className="flex-1 flex items-center bg-[#f1f5f9] rounded-lg border border-[#e2e8f0] px-3 py-2">
                <span className="text-xs text-[#94a3b8] mr-1">Rs</span>
                <input type="number" value={tendered} onChange={e => setTendered(Number(e.target.value))} className="flex-1 bg-transparent text-sm font-mono font-semibold text-[#0f172a] outline-none" />
              </div>
            </div>
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] text-[#94a3b8] font-mono">Change Due</span>
              <span className={`text-sm font-mono font-semibold ${change>=0?'text-[#0f172a]':'text-red-500'}`}>Rs {change.toFixed(2)}</span>
            </div>
          </div>
          <div className="p-4">
            <button onClick={() => setCurrentPage('receipt')} className="w-full bg-[#1e3a5f] text-white py-3.5 rounded-lg font-bold text-sm hover:bg-[#16324f] transition-colors mb-2">
              CHARGE  Rs {total.toFixed(2)}
            </button>
            <div className="flex gap-2">
              {['⊟ Hold','⊠ Void All','🖨 Print'].map(lbl => (
                <button key={lbl} className="flex-1 py-2 text-xs border border-[#e2e8f0] rounded-lg text-[#475569] hover:border-[#bfdbfe] transition-colors">{lbl}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </CashierLayout>
  );
}
