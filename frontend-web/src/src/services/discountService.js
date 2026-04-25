// src/services/discountService.js
import { fakeApi } from '../utils/fakeApi';
import { lsGet, lsSet } from '../utils/storage';
import { discounts as mockDiscounts } from '../data/mockData';

const USE_MOCK = true;
const LS_KEY = 'invosix_discounts';

function getStored() { return lsGet(LS_KEY, mockDiscounts); }
function saveStored(data) { lsSet(LS_KEY, data); }

export async function getDiscounts() {
  if (USE_MOCK) return fakeApi(getStored());
  const res = await fetch('/api/discounts');
  return res.json();
}

export async function addDiscount(discount) {
  if (USE_MOCK) {
    const stored = getStored();
    const newItem = { ...discount, id: Date.now(), used: 0 };
    saveStored([newItem, ...stored]);
    return fakeApi(newItem);
  }
  const res = await fetch('/api/discounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(discount) });
  return res.json();
}

export async function updateDiscount(id, updates) {
  if (USE_MOCK) {
    const stored = getStored();
    const updated = stored.map(d => d.id === id ? { ...d, ...updates } : d);
    saveStored(updated);
    return fakeApi(updated.find(d => d.id === id));
  }
  const res = await fetch(`/api/discounts/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
  return res.json();
}

export async function deleteDiscount(id) {
  if (USE_MOCK) {
    saveStored(getStored().filter(d => d.id !== id));
    return fakeApi({ deleted: id });
  }
  const res = await fetch(`/api/discounts/${id}`, { method: 'DELETE' });
  return res.json();
}
