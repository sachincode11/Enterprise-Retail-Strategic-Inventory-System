import { lsGet } from '../utils/storage';

const API_ROOT = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const SESSION_KEY = 'invosix_session';
const PENDING_KEY = 'invosix_pending_login';
const DEFAULT_STORE_ID = Number(import.meta.env.VITE_DEFAULT_STORE_ID || 1);

function toErrorShape(message, status = 500, data = null) {
  return { data, status, message };
}

function getAuthToken() {
  const session = lsGet(SESSION_KEY, null);
  return session?.accessToken || null;
}

export function getStoreId() {
  const session = lsGet(SESSION_KEY, null);
  if (session?.storeId) return Number(session.storeId);

  const pending = lsGet(PENDING_KEY, null);
  if (pending?.storeId) return Number(pending.storeId);

  return DEFAULT_STORE_ID;
}

export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, headers = {}, withAuth = true } = options;

  const finalHeaders = { ...headers };
  if (!(body instanceof FormData)) finalHeaders['Content-Type'] = 'application/json';

  if (withAuth) {
    const token = getAuthToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_ROOT}${path}`, {
    method,
    headers: finalHeaders,
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const detail = (payload && typeof payload === 'object' && (payload.detail || payload.message)) || String(payload) || 'Request failed';
    throw toErrorShape(detail, response.status, null);
  }

  return payload;
}

export function toApiEnvelope(data, status = 200, message = 'Success') {
  return { data, status, message };
}

export function normalizeServiceError(error, fallbackMessage = 'Request failed') {
  if (error?.message && error?.status) return error;
  if (error?.message) return toErrorShape(error.message, 500, null);
  return toErrorShape(fallbackMessage, 500, null);
}
