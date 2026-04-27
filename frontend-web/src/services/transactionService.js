// src/services/transactionService.js
import { fakeApi } from '../utils/fakeApi';
import { lsGet, lsSet } from '../utils/storage';
import { transactions as mockTransactions } from '../data/mockData';
import { apiRequest, getStoreId, normalizeServiceError, toApiEnvelope } from './apiClient';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_TRANSACTIONS === 'true';
const LS_KEY = 'invosix_transactions';
const DEFAULT_PAGE_SIZE = 10

function getStored() { return lsGet(LS_KEY, mockTransactions); }
function saveStored(data) { lsSet(LS_KEY, data); }

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}, ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function mapTxnFromBackend(txn) {
  const amount = Number(txn.total_amount || 0);
  return {
    id: txn.invoice_number || `#TXN-${txn.transaction_id}`,
    backendId: txn.transaction_id,
    customer: txn.customer_id ? `Customer #${txn.customer_id}` : 'Walk-in Guest',
    cashier: txn.cashier_id ? `Cashier #${txn.cashier_id}` : '—',
    datetime: formatDateTime(txn.transaction_date),
    items: txn.items?.length || 0,
    method: 'Cash',
    amount: `Rs ${Math.round(amount).toLocaleString('en-IN')}`,
    status: txn.status === 'refunded' ? 'Refunded' : txn.status === 'cancelled' ? 'Voided' : 'Paid',
  };
}

function mapPaymentMethod(method) {
  return method === 'Cash' ? 'cash' : 'digital_wallet';
}

export async function getTransactions() {
  if (USE_MOCK) return fakeApi(getStored());

  try {
    const storeId = getStoreId();
    const txns = await apiRequest(`/stores/${storeId}/transactions?page=1&size=${DEFAULT_PAGE_SIZE}`);
    const mapped = txns.map(mapTxnFromBackend);
    saveStored(mapped);
    return toApiEnvelope(mapped);
  } catch {
    return fakeApi(getStored());
  }
}

export async function addTransaction(txn) {
  if (USE_MOCK) {
    const stored = getStored();
    const id = `#TXN-${String(Date.now()).slice(-4)}`;
    const now = new Date();
    const datetime = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })}, ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    const newTxn = { ...txn, id, datetime, status: 'Paid' };
    saveStored([newTxn, ...stored]);
    return fakeApi(newTxn);
  }

  try {
    const storeId = getStoreId();
    const created = await apiRequest(`/stores/${storeId}/transactions`, {
      method: 'POST',
      body: {
        customer_id: null,
        payment_method: mapPaymentMethod(txn.method),
        discount_ids: [],
        items: (txn.itemDetails || []).map(i => ({
          product_id: Number(i.id),
          quantity: Number(i.qty || 1),
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

  // No dedicated void endpoint in backend yet; keep local status for UI.
  const updated = getStored().map(t => t.id === id ? { ...t, status: 'Voided' } : t);
  saveStored(updated);
  return toApiEnvelope({ voided: id });
}

export async function refundTransaction(id) {
  if (USE_MOCK) {
    const updated = getStored().map(t => t.id === id ? { ...t, status: 'Refunded' } : t);
    saveStored(updated);
    return fakeApi({ refunded: id });
  }

  try {
    const storeId = getStoreId();
    const source = getStored().find(t => t.id === id);
    if (!source?.backendId) {
      const updated = getStored().map(t => t.id === id ? { ...t, status: 'Refunded' } : t);
      saveStored(updated);
      return toApiEnvelope({ refunded: id });
    }

    // Backend refund endpoint requires product/quantity details.
    // For now mark local status unless granular refund UI is implemented.
    const updated = getStored().map(t => t.id === id ? { ...t, status: 'Refunded' } : t);
    saveStored(updated);
    return toApiEnvelope({ refunded: id, pendingServerSync: true });
  } catch (error) {
    throw normalizeServiceError(error, 'Failed to refund transaction');
  }
}
