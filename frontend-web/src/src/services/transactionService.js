// src/services/transactionService.js
import { fakeApi } from '../utils/fakeApi';
import { lsGet, lsSet } from '../utils/storage';
import { transactions as mockTransactions } from '../data/mockData';

const USE_MOCK = true;
const LS_KEY = 'invosix_transactions';

function getStored() { return lsGet(LS_KEY, mockTransactions); }
function saveStored(data) { lsSet(LS_KEY, data); }

export async function getTransactions() {
  if (USE_MOCK) return fakeApi(getStored());
  const res = await fetch('/api/transactions');
  return res.json();
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
  const res = await fetch('/api/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(txn) });
  return res.json();
}

export async function voidTransaction(id) {
  if (USE_MOCK) {
    const updated = getStored().map(t => t.id === id ? { ...t, status: 'Voided' } : t);
    saveStored(updated);
    return fakeApi({ voided: id });
  }
  const res = await fetch(`/api/transactions/${id}/void`, { method: 'POST' });
  return res.json();
}

export async function refundTransaction(id) {
  if (USE_MOCK) {
    const updated = getStored().map(t => t.id === id ? { ...t, status: 'Refunded' } : t);
    saveStored(updated);
    return fakeApi({ refunded: id });
  }
  const res = await fetch(`/api/transactions/${id}/refund`, { method: 'POST' });
  return res.json();
}
