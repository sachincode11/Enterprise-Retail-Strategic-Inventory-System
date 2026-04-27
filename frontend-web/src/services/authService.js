import { fakeApi } from '../utils/fakeApi';
import { lsGet, lsSet, lsDel } from '../utils/storage';
import { apiRequest, normalizeServiceError, toApiEnvelope } from './apiClient';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_AUTH === 'true';
const SESSION_KEY = 'invosix_session';
const PENDING_KEY = 'invosix_pending_login';

const MOCK_USERS = [
  { id: 1, name: 'Anita Shrestha', email: 'admin@store.np', password: 'admin123', role: 'admin', initials: 'AS', store: 'KTM-001', storeId: 1 },
  { id: 2, name: 'Kasim Rijal', email: 'kasim@store.np', password: 'cashier123', role: 'cashier', initials: 'KR', store: 'KTM-001', storeId: 1 },
  { id: 3, name: 'Priya Shrestha', email: 'priya.staff@store.np', password: 'cashier123', role: 'cashier', initials: 'PS', store: 'KTM-001', storeId: 1 },
];

function normalizeRole(roleValue) {
  return String(roleValue || '').trim().toLowerCase();
}

function mapBackendUser(user) {
  if (!user) return null;

  const role = normalizeRole(user.role || user.user_role || user.role_name || 'customer');
  const safeName = user.name || [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email || 'User';
  const initials = user.initials || safeName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

  return {
    id: user.id || user.user_id,
    name: safeName,
    email: user.email,
    role,
    roles: user.roles || [role],
    initials,
    username: user.username || safeName,
    store: user.store || `STORE-${String(user.storeId || user.store_id || 1).padStart(3, '0')}`,
    storeId: Number(user.storeId || user.store_id || 1),
    phone: user.phone || '',
  };
}

async function resolveStaffRoleByEmail(email, storeId, accessToken) {
  if (!email || !storeId || !accessToken) return null;
  try {
    const staff = await apiRequest(`/stores/${storeId}/staff`, {
      method: 'GET',
      withAuth: false,
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const match = Array.isArray(staff)
      ? staff.find(member => String(member.email || '').toLowerCase() === String(email).toLowerCase())
      : null;
    return mapBackendUser(match);
  } catch {
    return null;
  }
}

function persistSession(user, accessToken, refreshToken) {
  const session = {
    ...user,
    accessToken,
    refreshToken,
    token: accessToken,
    loginAt: new Date().toISOString(),
    pending2FA: false,
  };
  lsSet(SESSION_KEY, session);
  lsDel(PENDING_KEY);
  return session;
}

export async function login({ email, password, expectedRole }) {
  if (USE_MOCK) {
    const user = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (!user) {
      return new Promise((_, reject) =>
        setTimeout(() => reject({ status: 401, message: 'Invalid email or password', data: null }), 400)
      );
    }

    const { password: _pw, ...safeUser } = user;
    const pending = {
      ...safeUser,
      pending2FA: true,
      otpPurpose: 'login_2fa',
      loginAt: new Date().toISOString(),
    };
    lsSet(PENDING_KEY, pending);
    return fakeApi(pending);
  }

  try {
    const payload = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
      withAuth: false,
    });

    const user = mapBackendUser(payload.user) || { email, role: 'customer', storeId: 1, pending2FA: true };

    if (payload.requires_otp) {
      const pending = {
        ...user,
        pending2FA: true,
        expectedRole: normalizeRole(expectedRole || user.role),
        otpPurpose: payload.otp_purpose || 'login_2fa',
        debugOtp: payload.debug_otp || null,
      };
      lsSet(PENDING_KEY, pending);
      return toApiEnvelope(pending, 200, payload.message || 'OTP sent');
    }

    if (!payload.access_token || !payload.refresh_token) {
      throw { status: 500, message: 'Login response missing tokens.', data: null };
    }

    const enriched = (await resolveStaffRoleByEmail(user.email, user.storeId, payload.access_token)) || user;
    const session = persistSession(enriched, payload.access_token, payload.refresh_token);
    return toApiEnvelope(session, 200, 'Success');
  } catch (error) {
    throw normalizeServiceError(error, 'Login failed');
  }
}

export async function verifyOtp({ otp }) {
  const pending = getPendingLogin();
  if (!pending?.email) {
    throw { status: 400, message: 'No pending login found. Please sign in again.', data: null };
  }

  if (USE_MOCK) {
    if (otp === '123456' || otp.length === 6) {
      const session = persistSession(pending, `mock-token-${Date.now()}`, `mock-refresh-${Date.now()}`);
      return fakeApi(session);
    }
    return new Promise((_, reject) =>
      setTimeout(() => reject({ status: 400, message: 'Invalid OTP', data: null }), 400)
    );
  }

  try {
    const payload = await apiRequest('/auth/verify-otp', {
      method: 'POST',
      withAuth: false,
      body: {
        email: pending.email,
        otp_code: otp,
        purpose: pending.otpPurpose || 'login_2fa',
      },
    });

    const user = mapBackendUser(payload.user) || pending;
    const resolvedUser = (await resolveStaffRoleByEmail(user.email, user.storeId || pending.storeId, payload.access_token)) || user;
    const finalUser = {
      ...resolvedUser,
      role: normalizeRole(resolvedUser.role || pending.expectedRole || user.role),
      roles: resolvedUser.roles || [normalizeRole(resolvedUser.role || pending.expectedRole || user.role || 'customer')],
    };
    const session = persistSession(finalUser, payload.access_token, payload.refresh_token);
    return toApiEnvelope(session, 200, 'Verified');
  } catch (error) {
    throw normalizeServiceError(error, 'OTP verification failed');
  }
}

export async function logout() {
  const session = lsGet(SESSION_KEY, null);

  if (!USE_MOCK && session?.refreshToken) {
    try {
      await apiRequest('/auth/logout', {
        method: 'POST',
        body: { refresh_token: session.refreshToken },
      });
    } catch {
      // Logout should clear local session even if backend revoke fails.
    }
  }

  lsDel(SESSION_KEY);
  lsDel(PENDING_KEY);
  return toApiEnvelope({ loggedOut: true }, 200, 'Success');
}

export function getSession() {
  return lsGet(SESSION_KEY, null);
}

export function getPendingLogin() {
  return lsGet(PENDING_KEY, null);
}
