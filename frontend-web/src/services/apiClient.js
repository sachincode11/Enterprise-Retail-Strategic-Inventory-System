import { lsGet } from '../utils/storage';

const API_ROOT = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
const SESSION_KEY = 'invosix_session';
const PENDING_KEY = 'invosix_pending_login';
const DEFAULT_STORE_ID = Number(import.meta.env.VITE_DEFAULT_STORE_ID || 1);

let authErrorHandler = null;
let isRefreshing = false;
let refreshQueue = [];

export function onAuthError(handler) { authErrorHandler = handler; }

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
  let payload;
  try {
    payload = isJson ? await response.json() : await response.text();
  } catch (err) {
    payload = await response.text();
  }

  if (!response.ok) {
    if (response.status === 422) console.error('[Validation Error]', payload);
    // 401 Unauthorized -> Attempt Silent Refresh (Sliding Session)
    if (response.status === 401 && !options._retry) {
      const session = lsGet(SESSION_KEY, null);
      
      if (session?.refreshToken) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            refreshQueue.push({ path, options, resolve, reject });
          });
        }

        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${API_ROOT}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: session.refreshToken }),
          });

          if (refreshRes.ok) {
            const tokens = await refreshRes.json();
            const newSession = { 
              ...session, 
              accessToken: tokens.access_token, 
              refreshToken: tokens.refresh_token,
              token: tokens.access_token 
            };
            lsSet(SESSION_KEY, newSession);
            
            isRefreshing = false;
            // Process queued requests
            refreshQueue.forEach(q => apiRequest(q.path, q.options).then(q.resolve).catch(q.reject));
            refreshQueue = [];

            // Retry original request
            return await apiRequest(path, { ...options, _retry: true });
          }
        } catch (err) {
          console.error("Token refresh failed:", err);
        } finally {
          isRefreshing = false;
        }
      }

      // If no refresh token or refresh failed -> Logout
      // Only trigger this if the request was actually intended to be authenticated
      if (authErrorHandler && withAuth) authErrorHandler();
    }

    let detail = (payload && typeof payload === 'object' && (payload.detail || payload.message)) || String(payload) || 'Request failed';
    
    let finalMessage = 'Request failed';
    if (typeof detail === 'string') {
      finalMessage = detail;
    } else if (Array.isArray(detail)) {
      finalMessage = detail.map(d => d.msg || String(d)).join(', ');
    } else if (typeof detail === 'object' && detail !== null) {
      finalMessage = detail.msg || detail.message || JSON.stringify(detail);
    }
    
    throw toErrorShape(finalMessage, response.status, null);
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
