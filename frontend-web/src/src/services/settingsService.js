// src/services/settingsService.js
import { fakeApi } from '../utils/fakeApi';
import { lsGet, lsSet } from '../utils/storage';

const USE_MOCK = true;
const LS_KEY = 'invosix_settings';

const DEFAULT_SETTINGS = {
  // Display & Appearance
  language: 'English (EN)',
  dateFormat: 'DD/MM/YYYY',
  theme: 'Light',
  currency: 'Rs (NPR)',
  timezone: 'Asia/Kathmandu (UTC+5:45)',
  // Store Details
  storeName: 'Kathmandu Main Store',
  storeId: 'KTM-001',
  address: 'New Baneshwor, Kathmandu, Nepal',
  phone: '+977-1-441-0000',
  businessHours: '08:00 – 20:00',
  email: 'admin@store.np',
  // Billing & POS
  defaultPayment: 'Cash',
  taxRate: '13',
  maxDiscount: '10',
  quickKeys: true,
  barcodeSound: true,
  holdTransactions: true,
  // Notifications
  lowStockAlerts: true,
  dailySummary: true,
  emailNotifications: false,
  // Security
  requirePin: false,
  autoLogout: true,
  twoFactor: false,
  // IoT
  printerEnabled: true,
  scannerEnabled: true,
  displayEnabled: false,
};

export async function getSettings() {
  if (USE_MOCK) return fakeApi(lsGet(LS_KEY, DEFAULT_SETTINGS));
  const res = await fetch('/api/settings');
  return res.json();
}

export async function saveSettings(updates) {
  if (USE_MOCK) {
    const current = lsGet(LS_KEY, DEFAULT_SETTINGS);
    const merged = { ...current, ...updates };
    lsSet(LS_KEY, merged);
    return fakeApi(merged);
  }
  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function resetSettings() {
  if (USE_MOCK) {
    lsSet(LS_KEY, DEFAULT_SETTINGS);
    return fakeApi(DEFAULT_SETTINGS);
  }
  const res = await fetch('/api/settings/reset', { method: 'POST' });
  return res.json();
}
