import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants/config';

const SESSION_KEY = '@invo6_session';

export async function getAuthToken() {
  try {
    const sessionStr = await AsyncStorage.getItem(SESSION_KEY);
    if (!sessionStr) return null;
    const session = JSON.parse(sessionStr);
    return session.accessToken || null;
  } catch (error) {
    return null;
  }
}

export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, headers = {}, withAuth = true } = options;

  const finalHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (withAuth) {
    const token = await getAuthToken();
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const url = `${API_CONFIG.BASE_URL}${path}`;
  
  try {
    const response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const error = new Error(payload?.detail || payload?.message || 'Request failed');
      error.status = response.status;
      error.data = payload;
      throw error;
    }

    return payload;
  } catch (error) {
    if (error.status) throw error;
    throw new Error('Network error. Please check your connection.');
  }
}

export async function saveSession(session) {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function clearSession() {
  await AsyncStorage.removeItem(SESSION_KEY);
  await AsyncStorage.removeItem('@invo6_user');
}
