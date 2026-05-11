// src/pages/cashier/Transactions.jsx — live data, receipt modal, refund confirm, export
import { useState } from 'react';
import CashierLayout from '../../layouts/CashierLayout';
import { Badge, Modal } from '../../components/common';
import { useApp } from '../../context/AppContext';
import { exportCSV } from '../../utils/exportData';

function ReceiptModal({ isOpen, onClose, txn }) {
  if (!txn) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Receipt — ${txn.id}`}>
      <div className="font-mono text-xs space-y-1 bg-[#f8fafc] rounded-lg p-4 border border-[#e2e8f0]">
        <div className="text-center mb-3">
          <p className="font-black text-base text-[#0f172a]">INVO STORE</p>
          <p className="text-[#94a3b8]">New Baneshwor, Kathmandu</p>
        </div>
        <div className="border-t border-dashed border-[#e2e8f0] pt-2 space-y-1">
          <div className="flex justify-between"><span className="text-[#94a3b8]">TXN ID</span><span>{txn.id}</span></div>
          <div className="flex justify-between"><span className="text-[#94a3b8]">Date/Time</span><span>{txn.datetime}</span></div>
          <div className="flex justify-between"><span className="text-[#94a3b8]">Customer</span><span>{txn.customer}</span></div>
          <div className="flex justify-between"><span className="text-[#94a3b8]">Cashier</span><span>{txn.cashier}</span></div>
          <div className="flex justify-between"><span className="text-[#94a3b8]">Items</span><span>{txn.items}</span></div>
          <div className="flex justify-between"><span className="text-[#94a3b8]">Payment</span><span>{txn.method}</span></div>
        </div>
        <div className="border-t border-dashed border-[#e2e8f0] pt-2">
          <div className="flex justify-between font-black text-sm text-[#0f172a]"><span>TOTAL</span><span>{txn.amount}</span></div>
        </div>
        <div className="border-t border-dashed border-[#e2e8f0] pt-2 text-center">
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${txn.status === 'Refunded' ? 'bg-[#fee2e2] text-[#dc2626]' : txn.status === 'Voided' ? 'bg-[#f1f5f9] text-[#475569]' : 'bg-[#dcfce7] text-[#15803d]'}`}>
            {txn.status}
          </span>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={() => window.print()} className="btn-secondary text-xs">Print</button>
        <button onClick={onClose} className="btn-primary text-xs">Close</button>
      </div>
    </Modal>
  );
}

export default function Transactions() {
  const { transactions, refundTransaction, refreshTransactions } = useApp();

  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [receiptTxn, setReceiptTxn]     = useState(null);
  const [refundTarget, setRefundTarget] = useState(null);
  const [confirmOpen, setConfirmOpen]   = useState(false);
  const [refunding, setRefunding]       = useState(null);
  const [refundError, setRefundError]   = useState('');

  const filtered = transactions.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.customer.toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
    const matchStatus = !statusFilter || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = filtered
    .filter(t => t.status === 'Paid')
    .reduce((s, t) => s + (parseInt((t.amount || '').replace(/[^0-9]/g, ''), 10) || 0), 0);

  const handleRefundClick = (txn) => {
    setRefundTarget(txn);
    setConfirmOpen(true);
  };

  const handleRefundConfirm = async () => {
    if (!refundTarget) return;
    setRefunding(refundTarget.id);
    setRefundError('');
    try {
      // Use the first item from the transaction as the refund item.
      // items_raw contains the full item objects from the backend.
      const items = refundTarget.items_raw || [];
      if (items.length > 0) {
        // Refund each item in the transaction
        for (const item of items) {
          await refundTransaction(refundTarget.id, {
            product_id: item.product_id,
            quantity: item.quantity,
            reason: 'customer_change_mind',
            notes: 'Cashier full-transaction refund',
          });
        }
      } else {
        // Fallback: no item data available — just call with a minimal payload
        // This triggers the mock path which simply sets status to Refunded
        await refundTransaction(refundTarget.id, {
          product_id: null,
          quantity: 1,
          reason: 'other',
          notes: 'Cashier refund',
        });
      }
      setConfirmOpen(false);
      setRefundTarget(null);
    } catch (err) {
      setRefundError(err.message || 'Refund failed. Please try again.');
    } finally {
      setRefunding(null);
    }
  };

  const handleExport = () => {
    const data = filtered.map(t => ({
      ID: t.id, Customer: t.customer, DateTime: t.datetime,
      Items: t.items, Payment: t.method, Amount: t.amount, Status: t.status,
    }));
    exportCSV(data, `transactions-${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <CashierLayout>
      <div className="p-8">
        <div className="mb-6">
          <p className="text-xs text-[#94a3b8] font-mono mb-1">All Transactions</p>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#0f172a]">Transaction History</h1>
            <button onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 border border-[#e2e8f0] rounded-lg text-sm text-[#475569] hover:border-[#bfdbfe] transition-colors bg-white">
              ↓ Export CSV
            </button>
          </div>
        </div>

        {/* Summary pills */}
        <div className="flex gap-3 mb-5">
          {[
            { label: 'Total Transactions', value: transactions.length },
            { label: 'Paid',               value: transactions.filter(t => t.status === 'Paid').length },
            { label: 'Revenue',            value: `Rs ${totalRevenue.toLocaleString('en-IN')}` },
            { label: 'Refunded',           value: transactions.filter(t => t.status === 'Refunded').length },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border px-5 py-3 flex-1" style={{ borderColor: '#e2e8f0' }}>
              <p className="text-[10px] text-[#94a3b8] font-mono uppercase">{s.label}</p>
              <p className="text-xl font-bold text-[#0f172a]">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer or ID..."
            className="flex-1 px-4 py-2 text-sm bg-white border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f] transition-colors" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-[#e2e8f0] rounded-lg outline-none text-[#94a3b8]">
            <option value="">All Status</option>
            <option>Paid</option><option>Refunded</option><option>Voided</option><option>Pending</option>
          </select>
          <button onClick={() => { setSearch(''); setStatusFilter(''); }}
            className="px-4 py-2 text-sm border border-[#e2e8f0] bg-white rounded-lg text-[#475569] hover:border-[#bfdbfe] transition-colors">Reset</button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                {['TXN ID', 'Customer', 'Date & Time', 'Items', 'Payment', 'Amount', 'Status', 'Actions'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((txn, i) => (
                <tr key={i}>
                  <td><span className="mono text-xs font-medium">{txn.id}</span></td>
                  <td>
                    <p className="text-sm font-medium text-[#0f172a]">{txn.customer}</p>
                  </td>
                  <td className="text-sm text-[#475569]">{txn.datetime}</td>
                  <td className="text-sm">{txn.items}</td>
                  <td className="text-sm">{txn.method}</td>
                  <td className="text-sm font-bold text-[#0f172a]">{txn.amount}</td>
                  <td><Badge status={txn.status} /></td>
                  <td>
                    <div className="flex gap-1">
                      {/* Receipt button — opens proper receipt modal */}
                      <button className="btn-outline text-xs" onClick={() => setReceiptTxn(txn)}>Receipt</button>
                      {/* Refund button — only for Paid transactions */}
                      {txn.status === 'Paid' && (
                        <button
                          onClick={() => handleRefundClick(txn)}
                          disabled={refunding === txn.id}
                          className="text-xs px-3 py-1.5 rounded-lg border border-[#fecaca] text-[#dc2626] hover:bg-[#fef2f2] transition-colors disabled:opacity-50">
                          {refunding === txn.id ? '…' : 'Refund'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-sm text-[#94a3b8]">No transactions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt modal */}
      <ReceiptModal isOpen={!!receiptTxn} onClose={() => setReceiptTxn(null)} txn={receiptTxn} />

      {/* Refund confirmation modal */}
      <Modal isOpen={confirmOpen} onClose={() => { if (!refunding) { setConfirmOpen(false); setRefundTarget(null); setRefundError(''); } }} title="Confirm Refund">
        <div className="space-y-4">
          <p className="text-sm text-[#475569]">
            Are you sure you want to refund <span className="font-semibold text-[#dc2626]">{refundTarget?.amount || ''}</span> for <span className="font-semibold text-[#0f172a]">{refundTarget?.customer || ''}</span>?
          </p>
          <p className="text-xs text-[#94a3b8]">This action cannot be undone.</p>
          
          {refundError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium">
              {refundError}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button 
              onClick={() => { setConfirmOpen(false); setRefundTarget(null); setRefundError(''); }}
              disabled={!!refunding}
              className="px-4 py-2 text-sm border border-[#e2e8f0] rounded-lg text-[#475569] hover:bg-[#f8fafc] transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button
              onClick={handleRefundConfirm}
              disabled={!!refunding}
              className="px-4 py-2 text-sm bg-[#dc2626] text-white rounded-lg font-semibold hover:bg-[#b91c1c] transition-colors flex items-center gap-2 disabled:opacity-50">
              {refunding ? 'Processing...' : 'Confirm Refund'}
            </button>
          </div>
        </div>
      </Modal>
    </CashierLayout>
  );
}
