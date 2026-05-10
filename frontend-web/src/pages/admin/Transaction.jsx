import { useState, useMemo } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Badge, Button, StatCard, Pagination, Modal, ConfirmDialog, LoadingSpinner, Toast } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { useApp } from '../../context/AppContext';
import { exportCSV } from '../../utils/exportData';
import { getTransactionDetails } from '../../services/transactionService';

export default function Transaction() {
  const { setCurrentPage } = useAdmin();
  const { transactions, voidTransaction, refundTransaction, loading: appLoading } = useApp();

  const [query, setQuery]         = useState('');
  const [methodFilter, setMethod] = useState('All');
  const [statusFilter, setStatus] = useState('All');
  const [page, setPage]           = useState(1);
  const PER_PAGE = 10;

  // Modals & UI State
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isVoidConfirmOpen, setIsVoidConfirmOpen] = useState(false);
  const [txnToVoid, setTxnToVoid] = useState(null);
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [txnToRefund, setTxnToRefund] = useState(null);
  const [refundItem, setRefundItem] = useState({ product_id: '', quantity: 1, reason: 'other', notes: '' });
  
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const filtered = useMemo(() => (transactions || []).filter(t => {
    const q = query.toLowerCase();
    const matchSearch = !q || t.id.toLowerCase().includes(q) || (t.customer || '').toLowerCase().includes(q);
    const matchMethod = methodFilter === 'All' || t.method === methodFilter;
    const matchStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchSearch && matchMethod && matchStatus;
  }), [transactions, query, methodFilter, statusFilter]);

  const totalPages  = Math.ceil(filtered.length / PER_PAGE);
  const paginated   = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  
  const totalRevenue = useMemo(() => (transactions || [])
    .filter(t => t.status === 'Paid')
    .reduce((s, t) => s + (parseInt((t.amount || '').replace(/[^0-9]/g, ''), 10) || 0), 0), [transactions]);

  const handleExport = () => {
    exportCSV(filtered.map(t => ({ ID: t.id, Customer: t.customer, Cashier: t.cashier, DateTime: t.datetime, Items: t.items, Method: t.method, Amount: t.amount, Status: t.status })),
      `transactions-${new Date().toISOString().slice(0, 10)}`);
  };

  const handleViewDetails = async (txn) => {
    setLoading(true);
    try {
      const res = await getTransactionDetails(txn.id);
      setSelectedTxn(res.data);
      setIsDetailsOpen(true);
    } catch (err) {
      showToast(err.message || 'Failed to load details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVoid = async () => {
    if (!txnToVoid) return;
    setLoading(true);
    try {
      await voidTransaction(txnToVoid.id);
      showToast('Transaction voided successfully');
      setIsVoidConfirmOpen(false);
    } catch (err) {
      showToast(err.message || 'Failed to void transaction', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!txnToRefund || !refundItem.product_id) return;
    setLoading(true);
    try {
      await refundTransaction(txnToRefund.id, refundItem);
      showToast('Refund processed successfully');
      setIsRefundOpen(false);
    } catch (err) {
      showToast(err.message || 'Failed to process refund', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (appLoading && !transactions.length) return <AdminLayout><LoadingSpinner /></AdminLayout>;

  return (
    <AdminLayout>
      <Toast {...toast} />
      
      <PageHeader
        breadcrumb="All Stores"
        title="Transaction History"
        actions={
          <>
            <Button variant="secondary" onClick={handleExport}>↓ Export CSV</Button>
            <Button variant="secondary" onClick={() => setCurrentPage('transaction-history')}>Full Log →</Button>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Transactions" value={(transactions || []).length} />
        <StatCard label="Paid"               value={(transactions || []).filter(t => t.status === 'Paid').length} navy />
        <StatCard label="Refunds"            value={(transactions || []).filter(t => t.status === 'Refunded').length} />
        <StatCard label="Total Revenue"      value={`Rs ${totalRevenue.toLocaleString('en-IN')}`} />
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input value={query} onChange={e => { setQuery(e.target.value); setPage(1); }}
          placeholder="Search TXN ID, customer…" className="input-field" style={{ maxWidth: 220 }} />
        <select value={methodFilter} onChange={e => { setMethod(e.target.value); setPage(1); }} className="input-field" style={{ maxWidth: 130 }}>
          {['All', 'Cash', 'Card', 'QR'].map(m => <option key={m}>{m}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1); }} className="input-field" style={{ maxWidth: 130 }}>
          {['All', 'Paid', 'Refunded', 'Voided'].map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={() => { setQuery(''); setMethod('All'); setStatus('All'); setPage(1); }}
          className="px-4 py-2 text-sm border border-[#e2e8f0] rounded-lg text-[#475569] hover:border-[#bfdbfe] bg-white">Reset</button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>TXN ID</th>
              <th>Customer</th>
              <th>Cashier</th>
              <th>Date & Time</th>
              <th>Items</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((t, i) => (
              <tr key={t.id || i}>
                <td><span className="mono text-xs font-medium">{t.id}</span></td>
                <td className="text-sm font-medium">{t.customer}</td>
                <td className="text-sm text-[#475569]">{t.cashier || '—'}</td>
                <td className="text-sm text-[#475569]">{t.datetime}</td>
                <td className="text-sm">{t.items}</td>
                <td className="text-sm">{t.method}</td>
                <td className="text-sm font-bold">{t.amount}</td>
                <td><Badge status={t.status} /></td>
                <td className="text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleViewDetails(t)} className="p-1.5 hover:bg-slate-50 rounded-md text-slate-400 hover:text-[#1e3a5f] transition-colors" title="View Details">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    {t.status === 'Paid' && (
                      <>
                        <button onClick={() => { setTxnToRefund(t); setIsRefundOpen(true); }} className="p-1.5 hover:bg-red-50 rounded-md text-slate-400 hover:text-red-600 transition-colors" title="Refund">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h10a8 8 0 0 1 8 8v2M3 10l6 6m-6-6l6-6"/></svg>
                        </button>
                        <button onClick={() => { setTxnToVoid(t); setIsVoidConfirmOpen(true); }} className="p-1.5 hover:bg-red-50 rounded-md text-slate-400 hover:text-red-600 transition-colors" title="Void">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr><td colSpan={9} className="text-center py-10 text-sm text-[#94a3b8]">No transactions found</td></tr>
            )}
          </tbody>
        </table>
        <Pagination current={page} total={totalPages}
          label={`Showing ${Math.min((page-1)*PER_PAGE+1, filtered.length)}–${Math.min(page*PER_PAGE, filtered.length)} of ${filtered.length}`}
          onPrev={() => setPage(p => Math.max(1, p-1))} onNext={() => setPage(p => Math.min(totalPages, p+1))} onPage={setPage} />
      </div>

      {/* Transaction Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title={`Transaction ${selectedTxn?.id}`} maxWidth="max-w-2xl">
        {selectedTxn && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-[#94a3b8] font-mono text-[10px] uppercase tracking-wider mb-1">Customer Info</p>
                <p className="font-semibold text-[#0f172a]">{selectedTxn.customer}</p>
                <p className="text-[#64748b]">{selectedTxn.datetime}</p>
              </div>
              <div className="text-right">
                <p className="text-[#94a3b8] font-mono text-[10px] uppercase tracking-wider mb-1">Payment Method</p>
                <p className="font-semibold text-[#0f172a]">{selectedTxn.method}</p>
                <Badge status={selectedTxn.status} />
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#f8fafc] border-b text-[#64748b]">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Item</th>
                    <th className="px-4 py-2 text-center font-medium">Qty</th>
                    <th className="px-4 py-2 text-right font-medium">Price</th>
                    <th className="px-4 py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {/* Note: items should be mapped from backend data */}
                  {/* If we have items in selectedTxn.items */}
                  {(selectedTxn.items_raw || []).map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 text-[#0f172a]">{item.product_name || `Product #${item.product_id}`}</td>
                      <td className="px-4 py-2 text-center text-[#64748b]">{item.quantity}</td>
                      <td className="px-4 py-2 text-right text-[#64748b]">Rs {item.unit_price_at_sale}</td>
                      <td className="px-4 py-2 text-right font-medium text-[#0f172a]">Rs {item.line_total}</td>
                    </tr>
                  ))}
                  {(!selectedTxn.items_raw || selectedTxn.items_raw.length === 0) && (
                    <tr><td colSpan={4} className="px-4 py-4 text-center text-[#94a3b8] italic">No item data available for this transaction.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="w-48 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748b]">Subtotal</span>
                  <span className="font-medium">Rs {selectedTxn.subtotal || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748b]">Tax</span>
                  <span className="font-medium">Rs {selectedTxn.tax || 0}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2 mt-2">
                  <span className="font-bold text-[#0f172a]">Total</span>
                  <span className="font-bold text-[#1e3a5f]">{selectedTxn.amount}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
              <Button variant="secondary" onClick={() => setIsDetailsOpen(false)}>Close</Button>
              <Button onClick={() => window.print()} variant="primary">Print Receipt</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Void Confirmation */}
      <ConfirmDialog
        isOpen={isVoidConfirmOpen}
        onClose={() => setIsVoidConfirmOpen(false)}
        onConfirm={handleVoid}
        title="Void Transaction"
        message={`Are you sure you want to void transaction ${txnToVoid?.id}? This will cancel the transaction and return items to stock.`}
        confirmLabel="Void Transaction"
      />

      {/* Refund Modal */}
      <Modal isOpen={isRefundOpen} onClose={() => setIsRefundOpen(false)} title="Process Refund" maxWidth="max-w-md">
        <div className="space-y-4">
          <p className="text-sm text-[#64748b]">Processing refund for <strong>{txnToRefund?.id}</strong>.</p>
          
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-mono text-[#94a3b8] uppercase tracking-wider">Select Item</span>
              <select 
                className="input-field mt-1"
                value={refundItem.product_id}
                onChange={e => {
                  const pid = e.target.value;
                  const item = txnToRefund.items_raw?.find(i => String(i.product_id) === pid);
                  setRefundItem(prev => ({ ...prev, product_id: pid, quantity: item?.quantity || 1 }));
                }}
              >
                <option value="">Choose an item...</option>
                {(txnToRefund?.items_raw || []).map(item => (
                  <option key={item.product_id} value={item.product_id}>
                    {item.product_name || `Product #${item.product_id}`} (Max: {item.quantity})
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-mono text-[#94a3b8] uppercase tracking-wider">Quantity to Return</span>
              <input 
                type="number"
                className="input-field mt-1" 
                value={refundItem.quantity}
                min="1"
                max={txnToRefund?.items_raw?.find(i => String(i.product_id) === String(refundItem.product_id))?.quantity || 1}
                onChange={e => setRefundItem(prev => ({ ...prev, quantity: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-xs font-mono text-[#94a3b8] uppercase tracking-wider">Reason</span>
              <select 
                className="input-field mt-1"
                value={refundItem.reason}
                onChange={e => setRefundItem(prev => ({ ...prev, reason: e.target.value }))}
              >
                <option value="defective">Defective</option>
                <option value="wrong_item">Wrong Item</option>
                <option value="customer_change_mind">Customer Change Mind</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-mono text-[#94a3b8] uppercase tracking-wider">Notes</span>
              <textarea 
                className="input-field mt-1 h-20 resize-none" 
                placeholder="Internal notes..."
                value={refundItem.notes}
                onChange={e => setRefundItem(prev => ({ ...prev, notes: e.target.value }))}
              ></textarea>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setIsRefundOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleRefund} disabled={loading || !refundItem.product_id}>
              {loading ? 'Processing...' : 'Confirm Refund'}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
