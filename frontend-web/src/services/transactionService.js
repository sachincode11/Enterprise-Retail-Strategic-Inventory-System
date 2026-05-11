// src/services/transactionService.js
import { fakeApi } from '../utils/fakeApi';
import { lsGet, lsSet } from '../utils/storage';
import { transactions as mockTransactions } from '../data/mockData';
import { apiRequest, getStoreId, normalizeServiceError, toApiEnvelope } from './apiClient';
import { formatDateTime, formatCurrency } from '../utils/format';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_TRANSACTIONS === 'true';
const LS_KEY = 'invosix_transactions';
const DEFAULT_PAGE_SIZE = 10

function getStored() { return lsGet(LS_KEY, mockTransactions); }
function saveStored(data) { lsSet(LS_KEY, data); }



function mapTxnFromBackend(txn) {
  const amount = Number(txn.total_amount || 0);
  const method = txn.payments?.[0]?.payment_method || 'Cash';

  return {
    id: txn.invoice_number || `#TXN-${txn.transaction_id}`,
    backendId: txn.transaction_id,
    customerId: txn.customer_id,
    customer: txn.customer_name || (txn.guest_customer?.name || 'Walk-in Guest'),
    phone: txn.customer_phone || (txn.guest_customer?.phone || ''),
    cashier: txn.cashier_id ? `Cashier #${txn.cashier_id}` : '—',
    datetime: formatDateTime(txn.transaction_date),
    rawDate: txn.transaction_date, // Keep raw ISO string for comparisons
    items: txn.items?.length || 0,
    items_raw: txn.items || [], // Full item objects for detail view
    method: method.charAt(0).toUpperCase() + method.slice(1),
    amount: formatCurrency(amount),
    subtotal: txn.subtotal || 0,
    tax: txn.tax_amount || 0,
    status: txn.status === 'refunded' ? 'Refunded' : txn.status === 'cancelled' ? 'Voided' : 'Paid',
  };
}

function mapPaymentMethod(method) {
  const m = String(method).toLowerCase();
  if (m === 'cash') return 'cash';
  if (m === 'card') return 'card';
  if (m === 'qr') return 'qr';
  return 'cash';
}

export async function getTransactions() {
  if (USE_MOCK) return fakeApi(getStored());

  try {
    const storeId = getStoreId();
    // Fetch a larger batch (up to 100 as per backend limit) to show more records
    const res = await apiRequest(`/stores/${storeId}/transactions?page=1&size=100`);

    // Support both old flat array and new PaginatedResponse shape
    const txns = Array.isArray(res) ? res : (res.items || []);

    const mapped = txns.map(mapTxnFromBackend);
    saveStored(mapped);
    return toApiEnvelope(mapped);
  } catch (error) {
    console.error("[TransactionService] getTransactions failed:", error);
    if (USE_MOCK) return fakeApi(getStored());
    throw normalizeServiceError(error, 'Failed to fetch transactions from database');
  }
}

export async function getTransactionDetails(id) {
  // If id is numeric, use it directly, otherwise it might be an invoice number
  // For backend call we need the numeric transaction_id (backendId)
  if (USE_MOCK) {
    const found = getStored().find(t => t.id === id);
    return fakeApi(found);
  }

  try {
    const storeId = getStoreId();
    const source = getStored().find(t => t.id === id);
    const backendId = source?.backendId || id;

    const txn = await apiRequest(`/stores/${storeId}/transactions/${backendId}`);
    return toApiEnvelope(mapTxnFromBackend(txn));
  } catch (error) {
    throw normalizeServiceError(error, 'Failed to fetch transaction details');
  }
}

export async function addTransaction(txn) {
  if (USE_MOCK) {
    const stored = getStored();
    const id = `#TXN-${String(Date.now()).slice(-4)}`;
    const now = new Date();
    const newTxn = { ...txn, id, datetime: formatDateTime(now), status: 'Paid' };
    saveStored([newTxn, ...stored]);
    return fakeApi(newTxn);
  }

  try {
    const storeId = getStoreId();
    const created = await apiRequest(`/stores/${storeId}/transactions`, {
      method: 'POST',
      body: {
        customer_id: txn.customer_id || null,
        guest_name: txn.guest_name || null,
        guest_phone: txn.guest_phone || null,
        payment_method: mapPaymentMethod(txn.method),
        discount_ids: txn.discount_ids || [],
        manual_discount_percent: txn.manual_discount_percent || 0,
        manual_discount_amount: txn.manual_discount_amount || 0,
        items: (txn.items || []).map(i => ({
          product_id: Number(i.product_id),
          quantity: Number(i.quantity || 1),
          discount_id: i.discount_id || null,
          line_discount: Number(i.line_discount || 0),
        })),
      },
    });

    const mapped = mapTxnFromBackend(created);
    saveStored([mapped, ...getStored()]);
    return toApiEnvelope(mapped, 201, 'Created');
  } catch (error) {
    throw normalizeServiceError(error, 'Failed to create transaction');
  }
}

export async function voidTransaction(id) {
  if (USE_MOCK) {
    const updated = getStored().map(t => t.id === id ? { ...t, status: 'Voided' } : t);
    saveStored(updated);
    return fakeApi({ voided: id });
  }

  try {
    const storeId = getStoreId();
    const source = getStored().find(t => t.id === id);
    const backendId = source?.backendId;

    if (!backendId) {
      const updated = getStored().map(t => t.id === id ? { ...t, status: 'Voided' } : t);
      saveStored(updated);
      return toApiEnvelope({ voided: id });
    }

    const updatedTxn = await apiRequest(`/stores/${storeId}/transactions/${backendId}/status?status=cancelled`, {
      method: 'PATCH',
    });

    const mapped = mapTxnFromBackend(updatedTxn);
    const updatedList = getStored().map(t => t.id === id ? mapped : t);
    saveStored(updatedList);
    return toApiEnvelope(mapped);
  } catch (error) {
    throw normalizeServiceError(error, 'Failed to void transaction');
  }
}

export async function refundTransaction(id, refundData) {
  // refundData: { product_id, quantity, reason, notes }
  if (USE_MOCK) {
    const updated = getStored().map(t => t.id === id ? { ...t, status: 'Refunded' } : t);
    saveStored(updated);
    return fakeApi({ refunded: id });
  }

  try {
    const storeId = getStoreId();
    const source = getStored().find(t => t.id === id);
    const backendId = source?.backendId || id;

    const res = await apiRequest(`/stores/${storeId}/refunds`, {
      method: 'POST',
      body: {
        original_transaction_id: Number(backendId),
        product_id: Number(refundData.product_id),
        quantity_returned: Number(refundData.quantity),
        reason: refundData.reason || 'other',
        notes: refundData.notes || '',
      },
    });

    // Refresh the transaction in local state
    const refreshed = await apiRequest(`/stores/${storeId}/transactions/${backendId}`);
    const mapped = mapTxnFromBackend(refreshed);
    const updatedList = getStored().map(t => t.id === id ? mapped : t);
    saveStored(updatedList);

    return toApiEnvelope(mapped);
  } catch (error) {
    throw normalizeServiceError(error, 'Failed to refund transaction');
  }
}
