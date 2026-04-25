// src/services/authService.js
import { fakeApi } from '../utils/fakeApi';
import { lsGet, lsSet, lsDel } from '../utils/storage';

const USE_MOCK = true;

const MOCK_USERS = [
  { id: 1, name: 'Anita Shrestha', email: 'admin@store.np',       password: 'admin123',    role: 'admin',   initials: 'AS', store: 'KTM-001' },
  { id: 2, name: 'Kasim Rijal',    email: 'kasim@store.np',        password: 'cashier123',  role: 'cashier', initials: 'KR', store: 'KTM-001' },
  { id: 3, name: 'Priya Shrestha', email: 'priya.staff@store.np',  password: 'cashier123',  role: 'cashier', initials: 'PS', store: 'KTM-001' },
];

export async function login({ email, password }) {
  if (USE_MOCK) {
    const user = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (!user) {
      return new Promise((_, reject) =>
        setTimeout(() => reject({ status: 401, message: 'Invalid email or password', data: null }), 400)
      );
    }
    const { password: _pw, ...safeUser } = user;
    const session = { ...safeUser, token: `mock-token-${Date.now()}`, loginAt: new Date().toISOString() };
    lsSet('invosix_session', session);
    return fakeApi(session);
  }
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function logout() {
  if (USE_MOCK) {
    lsDel('invosix_session');
    return fakeApi({ loggedOut: true });
  }
  await fetch('/api/auth/logout', { method: 'POST' });
  lsDel('invosix_session');
  return { data: { loggedOut: true }, status: 200, message: 'Success' };
}

export function getSession() {
  return lsGet('invosix_session', null);
}

export async function verifyOtp({ otp }) {
  if (USE_MOCK) {
    if (otp === '123456' || otp.length === 6) return fakeApi({ verified: true });
    return new Promise((_, reject) =>
      setTimeout(() => reject({ status: 400, message: 'Invalid OTP', data: null }), 400)
    );
  }
  const res = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ otp }),
  });
  return res.json();
}
