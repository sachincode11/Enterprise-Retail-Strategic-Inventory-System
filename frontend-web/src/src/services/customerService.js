// src/services/customerService.js
import { fakeApi } from '../utils/fakeApi';
import { lsGet, lsSet } from '../utils/storage';
import { customers as mockCustomers } from '../data/mockData';

const USE_MOCK = true;
const LS_KEY = 'invosix_customers';

function getStored() { return lsGet(LS_KEY, mockCustomers); }
function saveStored(data) { lsSet(LS_KEY, data); }

export async function getCustomers() {
  if (USE_MOCK) return fakeApi(getStored());
  const res = await fetch('/api/customers');
  return res.json();
}

export async function addCustomer(customer) {
  if (USE_MOCK) {
    const stored = getStored();
    const newItem = { ...customer, id: Date.now(), orders: 0, lastVisit: 'Never', value: 'Rs 0', type: 'Registered' };
    saveStored([newItem, ...stored]);
    return fakeApi(newItem);
  }
  const res = await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(customer) });
  return res.json();
}

export async function updateCustomer(id, updates) {
  if (USE_MOCK) {
    const stored = getStored();
    const updated = stored.map(c => c.id === id ? { ...c, ...updates } : c);
    saveStored(updated);
    return fakeApi(updated.find(c => c.id === id));
  }
  const res = await fetch(`/api/customers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
  return res.json();
}
