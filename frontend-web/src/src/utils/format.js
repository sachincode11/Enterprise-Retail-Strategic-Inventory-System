// src/utils/format.js
// Formatting helpers.

export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return 'Rs 0';
  return `Rs ${Number(amount).toLocaleString('en-IN')}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function generateId(prefix = 'ID') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function generateSKU(name = '') {
  const prefix = name.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X') || 'SKU';
  return `${prefix}-${String(Math.floor(Math.random() * 90000) + 10000)}`;
}
