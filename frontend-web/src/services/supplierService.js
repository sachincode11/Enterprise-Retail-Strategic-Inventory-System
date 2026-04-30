// src/services/supplierService.js
import { fakeApi } from '../utils/fakeApi';
import { lsGet, lsSet } from '../utils/storage';
import { suppliers as mockSuppliers } from '../data/mockData';
import { apiRequest, getStoreId, normalizeServiceError, toApiEnvelope } from './apiClient';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_SUPPLIERS === 'true';
const LS_KEY = 'invosix_suppliers';

function getStored() { return lsGet(LS_KEY, mockSuppliers); }
function saveStored(data) { lsSet(LS_KEY, data); }

function mapSupplierFromBackend(s) {
  return {
    id: s.supplier_id,
    name: s.supplier_name,
    contact: s.contact_person || '',
    email: s.email || '',
    phone: s.phone || '',
    address: s.address || '',
    products: 0,
    lastOrder: '—',
    leadTime: '3 days',
    total: 'Rs 0',
    status: s.is_active ? 'Active' : 'Inactive',
  };
}

export async function getSuppliers() {
  if (USE_MOCK) return fakeApi(getStored());

  try {
    const storeId = getStoreId();
    const items = await apiRequest(`/stores/${storeId}/suppliers`);
    const mapped = items.map(mapSupplierFromBackend);
    saveStored(mapped);
    return toApiEnvelope(mapped);
  } catch {
    return fakeApi(getStored());
  }
}

export async function addSupplier(supplier) {
  if (USE_MOCK) {
    const stored = getStored();
    const newItem = { ...supplier, id: Date.now(), products: 0, lastOrder: '—', total: 'Rs 0' };
    saveStored([newItem, ...stored]);
    return fakeApi(newItem);
  }

  const clean = val => (val === '' || val === '—') ? null : val;

  try {
    const storeId = getStoreId();
    const created = await apiRequest(`/stores/${storeId}/suppliers`, {
      method: 'POST',
      body: {
        supplier_name: supplier.name,
        contact_person: clean(supplier.contact),
        phone: clean(supplier.phone),
        email: clean(supplier.email),
        address: clean(supplier.address),
      },
    });

    const mapped = mapSupplierFromBackend(created);
    saveStored([mapped, ...getStored().filter(s => s.id !== mapped.id)]);
    return toApiEnvelope(mapped, 201, 'Created');
  } catch (error) {
    throw normalizeServiceError(error, 'Failed to add supplier');
  }
}

export async function updateSupplier(id, updates) {
  if (USE_MOCK) {
    const stored = getStored();
    const updated = stored.map(s => s.id === id ? { ...s, ...updates } : s);
    saveStored(updated);
    return fakeApi(updated.find(s => s.id === id));
  }

  const clean = val => (val === '' || val === '—') ? null : val;

  try {
    const storeId = getStoreId();
    const updated = await apiRequest(`/stores/${storeId}/suppliers/${id}`, {
      method: 'PATCH',
      body: {
        supplier_name: updates.name,
        contact_person: clean(updates.contact),
        phone: clean(updates.phone),
        email: clean(updates.email),
        address: clean(updates.address),
      },
    });

    const mapped = mapSupplierFromBackend(updated);

    // Ensure numeric comparison for robustness
    saveStored(getStored().map(s => (Number(s.id) === Number(id) ? mapped : s)));
    return toApiEnvelope(mapped);
  } catch (error) {
    throw normalizeServiceError(error, 'Failed to update supplier');
  }
}


export async function deleteSupplier(id) {
  if (USE_MOCK) {
    saveStored(getStored().filter(s => s.id !== id));
    return fakeApi({ deleted: id });
  }

  try {
    const storeId = getStoreId();
    await apiRequest(`/stores/${storeId}/suppliers/${id}`, { method: 'DELETE' });
    saveStored(getStored().filter(s => s.id !== Number(id)));
    return toApiEnvelope({ deleted: id });
  } catch (error) {
    throw normalizeServiceError(error, 'Failed to delete supplier');
  }
}
