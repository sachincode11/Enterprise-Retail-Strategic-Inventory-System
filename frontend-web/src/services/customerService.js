// src/services/customerService.js
import { lsGet, lsSet } from '../utils/storage';
import { apiRequest, getStoreId, normalizeServiceError, toApiEnvelope } from './apiClient';

const LS_KEY = 'invosix_customers';

function mapCustomerFromBackend(u) {
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || u.email;
  return {
    id: u.user_id,
    name,
    phone: u.phone || '—',
    email: u.email,
    orders: 0,
    lastVisit: '—',
    value: 'Rs 0',
    type: 'Registered',
    is_active: u.is_active,
  };
}

function getStored() {
  return lsGet(LS_KEY, []);
}
function saveStored(data) {
  lsSet(LS_KEY, data);
}

export async function getCustomers() {
  try {
    const storeId = getStoreId();
    const items = await apiRequest(`/stores/${storeId}/customers`);
    const mapped = items.map(mapCustomerFromBackend);
    saveStored(mapped);
    return toApiEnvelope(mapped);
  } catch {
    return toApiEnvelope(getStored());
  }
}

export async function addCustomer(customer) {
  try {
    // Self-registration endpoint — creates a user with customer role
    const created = await apiRequest('/auth/register', {
      method: 'POST',
      withAuth: false,
      body: {
        username: customer.email.split('@')[0] + Date.now(),
        first_name: customer.name?.split(' ')[0] || customer.name,
        last_name: customer.name?.split(' ').slice(1).join(' ') || null,
        email: customer.email,
        password: customer.password || 'Temp@1234',
        phone: customer.phone || null,
      },
    });
    const mapped = mapCustomerFromBackend(created);
    saveStored([mapped, ...getStored()]);
    return toApiEnvelope(mapped, 201, 'Created');
  } catch (error) {
    throw normalizeServiceError(error, 'Failed to add customer');
  }
}

export async function updateCustomer(id, updates) {
  try {
    // Activate / deactivate support
    if (updates.status === 'Inactive' || updates.is_active === false) {
      await apiRequest(`/users/${id}/deactivate`, { method: 'PATCH' });
    }
    const stored = getStored().map((c) => (c.id === id ? { ...c, ...updates } : c));
    saveStored(stored);
    return toApiEnvelope(stored.find((c) => c.id === id));
  } catch (error) {
    throw normalizeServiceError(error, 'Failed to update customer');
  }
}
