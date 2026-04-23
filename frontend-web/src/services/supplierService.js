// src/services/supplierService.js
import { fakeApi } from '../utils/fakeApi';
import { lsGet, lsSet } from '../utils/storage';
import { suppliers as mockSuppliers } from '../data/mockData';

const USE_MOCK = true;
const LS_KEY = 'invosix_suppliers';

function getStored() { return lsGet(LS_KEY, mockSuppliers); }
function saveStored(data) { lsSet(LS_KEY, data); }

export async function getSuppliers() {
  if (USE_MOCK) return fakeApi(getStored());
  const res = await fetch('/api/suppliers');
  return res.json();
}

export async function addSupplier(supplier) {
  if (USE_MOCK) {
    const stored = getStored();
    const newItem = { ...supplier, id: Date.now(), products: 0, lastOrder: '—', total: 'Rs 0' };
    saveStored([newItem, ...stored]);
    return fakeApi(newItem);
  }
  const res = await fetch('/api/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(supplier) });
  return res.json();
}

export async function updateSupplier(id, updates) {
  if (USE_MOCK) {
    const stored = getStored();
    const updated = stored.map(s => s.id === id ? { ...s, ...updates } : s);
    saveStored(updated);
    return fakeApi(updated.find(s => s.id === id));
  }
  const res = await fetch(`/api/suppliers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
  return res.json();
}

export async function deleteSupplier(id) {
  if (USE_MOCK) {
    saveStored(getStored().filter(s => s.id !== id));
    return fakeApi({ deleted: id });
  }
  const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
  return res.json();
}
