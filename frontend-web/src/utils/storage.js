// src/utils/storage.js
// Typed localStorage helpers with fallback.

export function lsGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function lsDel(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
