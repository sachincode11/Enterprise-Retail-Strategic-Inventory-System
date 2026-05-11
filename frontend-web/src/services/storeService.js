// src/services/storeService.js
import { lsGet, lsSet } from '../utils/storage';
import { apiRequest, getStoreId, toApiEnvelope } from './apiClient';

const LS_KEY = 'invosix_store_info';

function mapStoreFromBackend(s) {
  return {
    id: `STORE-${String(s.store_id).padStart(3, '0')}`,
    storeId: s.store_id,
    name: s.store_name || 'Main Store',
    address: s.address || '—',
    phone: s.contact_phone || '—',
    email: s.contact_email || '—',
  };
}

export async function getStoreInfo() {
  try {
    const storeId = getStoreId();
    const data = await apiRequest(`/stores/${storeId}`);
    const mapped = mapStoreFromBackend(data);
    lsSet(LS_KEY, mapped);
    return toApiEnvelope(mapped);
  } catch {
    const cached = lsGet(LS_KEY, {
      id: `STORE-${String(getStoreId()).padStart(3, '0')}`,
      storeId: getStoreId(),
      name: 'Main Store',
      address: '—',
      phone: '—',
      email: '—',
    });
    return toApiEnvelope(cached);
  }
}
