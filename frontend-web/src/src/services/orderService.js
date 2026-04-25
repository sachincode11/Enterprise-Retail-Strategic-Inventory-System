// src/services/orderService.js
// Purchase Orders — swap USE_MOCK=false for real backend
import { fakeApi } from '../utils/fakeApi';
import { lsGet, lsSet } from '../utils/storage';
import { purchaseOrders as mockOrders } from '../data/mockData';

const USE_MOCK = true;
const LS_KEY = 'invosix_orders';

function getStored() { return lsGet(LS_KEY, mockOrders); }
function saveStored(data) { lsSet(LS_KEY, data); }

export async function getOrders() {
  if (USE_MOCK) return fakeApi(getStored());
  const res = await fetch('/api/orders');
  return res.json();
}

export async function addOrder(order) {
  if (USE_MOCK) {
    const stored = getStored();
    const id = `#PO-${new Date().getFullYear()}-${String(stored.length + 50).padStart(3, '0')}`;
    const now = new Date();
    const ordered = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;
    const expected = new Date(now.getTime() + 3 * 86400000);
    const expectedStr = `${expected.getDate()} ${expected.toLocaleString('default', { month: 'short' })} ${expected.getFullYear()}`;
    const newOrder = { ...order, id, ordered, expected: expectedStr, status: 'Pending' };
    saveStored([newOrder, ...stored]);
    return fakeApi(newOrder);
  }
  const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) });
  return res.json();
}

export async function updateOrderStatus(id, status) {
  if (USE_MOCK) {
    const stored = getStored();
    const updated = stored.map(o => o.id === id ? { ...o, status } : o);
    saveStored(updated);
    return fakeApi(updated.find(o => o.id === id));
  }
  const res = await fetch(`/api/orders/${encodeURIComponent(id)}/status`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
  });
  return res.json();
}
