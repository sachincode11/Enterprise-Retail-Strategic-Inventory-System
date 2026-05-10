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
    username: s.username,
    email: s.email,
    phone: s.phone || '—',
    role: roleName || 'Staff',
    store: `STORE-${String(s.store_id || 1).padStart(3, '0')}`,
    status: s.is_active ? 'Active' : 'Inactive',
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
    const storeId = getStoreId();
    const payload = {
      username: (member.username || '').trim(),
      first_name: (member.first_name || '').trim(),
      last_name: member.last_name ? member.last_name.trim() : null,
      email: (member.email || '').trim().toLowerCase(),
      password: member.password,
      phone: member.phone ? member.phone.trim() : null,
      role: member.role || 'Cashier',
    };

    const response = await apiRequest(`/stores/${storeId}/staff`, {
      method: 'POST',
      body: payload,
    });

    // The backend now handles role assignment atomically without adding a 'Customer' role.
    return toApiEnvelope(mapStaffFromBackend(response), 201, 'Created');
  } catch (error) {
    throw normalizeServiceError(error, 'Failed to add staff member');
  }
}

export async function updateStaff(id, updates) {
  try {
    // 1. Update basic details (username, name, email, role, etc.)
    const profilePayload = {
      username: updates.username?.trim(),
      first_name: updates.first_name?.trim(),
      last_name: updates.last_name?.trim(),
      email: updates.email?.trim().toLowerCase(),
      password: updates.password ? updates.password : undefined,
      phone: updates.phone?.trim(),
      role: updates.role,
    };

    // Remove undefined fields to avoid overwriting with nulls if not intentional
    Object.keys(profilePayload).forEach(key => profilePayload[key] === undefined && delete profilePayload[key]);

    const storeId = getStoreId();
    await apiRequest(`/stores/${storeId}/staff/${id}`, {
      method: 'PATCH',
      body: profilePayload,
    });

    // 2. Update status if changed
    if (updates.status === 'Inactive') {
      await apiRequest(`/users/${id}/deactivate`, { method: 'PATCH' });
    } else if (updates.status === 'Active') {
      await apiRequest(`/users/${id}/activate`, { method: 'PATCH' });
    }

    const fresh = await getStaff();
    const updated = fresh.data.find((s) => s.id === id);
    return toApiEnvelope(updated || { id, ...updates });
  } catch (error) {
    // Fall back: update local cache only if API fails (e.g. offline dev)
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
