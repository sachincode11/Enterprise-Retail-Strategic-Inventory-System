import { apiRequest, getStoreId } from './apiClient';

const USE_MOCK = false;

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
  const storeId = getStoreId();
  try {
    const store = await apiRequest(`/stores/${storeId}`);
    if (!store) return { data: DEFAULT_SETTINGS };

    // Map backend store to frontend settings
    const flat = {
      ...DEFAULT_SETTINGS,
      storeName: store.store_name,
      address: store.address || '',
      phone: store.contact_phone || '',
      email: store.contact_email || '',
      storeId: `STORE-${String(store.store_id).padStart(3, '0')}`,
      ...(store.config || {}),
    };
    return { data: flat };
  } catch (err) {
    console.error("Failed to fetch settings:", err);
    return { data: DEFAULT_SETTINGS };
  }
}

export async function saveSettings(updates) {
  const storeId = getStoreId();

  // Split updates into Store fields and Config fields
  const storeFields = {};
  const configFields = {};

  const STORE_MAP = {
    storeName: 'store_name',
    address: 'address',
    phone: 'contact_phone',
    email: 'contact_email'
  };

  Object.entries(updates).forEach(([key, val]) => {
    if (STORE_MAP[key]) {
      storeFields[STORE_MAP[key]] = val;
    } else {
      configFields[key] = val;
    }
  });

  const payload = {
    ...storeFields,
    config: configFields
  };

  try {
    const store = await apiRequest(`/stores/${storeId}`, {
      method: 'PATCH',
      body: payload
    });

    if (store) {
      const flat = {
        ...DEFAULT_SETTINGS,
        storeName: store.store_name,
        address: store.address || '',
        phone: store.contact_phone || '',
        email: store.contact_email || '',
        storeId: `STORE-${String(store.store_id).padStart(3, '0')}`,
        ...(store.config || {}),
      };
      return { data: flat };
    }
    return { data: DEFAULT_SETTINGS };
  } catch (err) {
    console.error("Failed to save settings:", err);
    throw err;
  }
}

export async function resetSettings() {
  // For now, reset just clears to defaults in the save call
  return saveSettings(DEFAULT_SETTINGS);
}
