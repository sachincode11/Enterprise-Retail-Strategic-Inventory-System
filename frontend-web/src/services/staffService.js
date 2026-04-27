// src/services/staffService.js
import { lsGet, lsSet } from '../utils/storage';
import { apiRequest, getStoreId, normalizeServiceError, toApiEnvelope } from './apiClient';

const LS_KEY = 'invosix_staff';

function mapStaffFromBackend(s) {
  const name = s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email;
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const roleName = (s.role || '').replace(/^[^a-zA-Z]*/, '').trim(); // strip leading enums prefix

  return {
    id: s.user_id,
    initials,
    name,
    email: s.email,
    phone: s.phone || '—',
    role: roleName || 'Staff',
    store: `STORE-${String(s.store_id || 1).padStart(3, '0')}`,
    shift: '—',
    status: s.is_active ? 'Active' : 'Inactive',
    lastLogin: '—',
  };
}

function getStored() {
  return lsGet(LS_KEY, []);
}
function saveStored(data) {
  lsSet(LS_KEY, data);
}

export async function getStaff() {
  try {
    const storeId = getStoreId();
    const items = await apiRequest(`/stores/${storeId}/staff`);
    const mapped = items.map(mapStaffFromBackend);
    saveStored(mapped);
    return toApiEnvelope(mapped);
  } catch {
    return toApiEnvelope(getStored());
  }
}

export async function addStaff(member) {
  try {
    // Register the new user account then assign a role
    const storeId = getStoreId();
    const created = await apiRequest('/auth/register', {
      method: 'POST',
      withAuth: false,
      body: {
        username: member.email.split('@')[0] + Date.now(),
        first_name: member.name.split(' ')[0],
        last_name: member.name.split(' ').slice(1).join(' ') || null,
        email: member.email,
        password: member.password || 'Temp@1234',
        phone: member.phone || null,
      },
    });

    // Assign the chosen role (cashier / admin) to the new user for this store
    await apiRequest('/users/assign-role', {
      method: 'POST',
      body: {
        user_id: created.user_id,
        role: member.role || 'Cashier',
        store_id: Number(storeId),
      },
    });

    // Refresh staff list
    const fresh = await getStaff();
    return toApiEnvelope(fresh.data.find((s) => s.email === member.email) || fresh.data[0], 201, 'Created');
  } catch (error) {
    throw normalizeServiceError(error, 'Failed to add staff member');
  }
}

export async function updateStaff(id, updates) {
  try {
    // Backend user update endpoint is /users/{id} (deactivate / activate)
    const storeId = getStoreId();
    if (updates.status === 'Inactive') {
      await apiRequest(`/users/${id}/deactivate`, { method: 'PATCH' });
    } else if (updates.status === 'Active') {
      await apiRequest(`/users/${id}/activate`, { method: 'PATCH' });
    }
    const fresh = await getStaff();
    const updated = fresh.data.find((s) => s.id === id);
    return toApiEnvelope(updated || { id, ...updates });
  } catch (error) {
    // Fall back: update local cache only
    const stored = getStored();
    const updated = stored.map((s) => (s.id === id ? { ...s, ...updates } : s));
    saveStored(updated);
    return toApiEnvelope(updated.find((s) => s.id === id));
  }
}

export async function deleteStaff(id) {
  try {
    await apiRequest(`/users/${id}/deactivate`, { method: 'PATCH' });
    const stored = getStored().filter((s) => s.id !== id);
    saveStored(stored);
    return toApiEnvelope({ deleted: id });
  } catch (error) {
    throw normalizeServiceError(error, 'Failed to deactivate staff member');
  }
}
