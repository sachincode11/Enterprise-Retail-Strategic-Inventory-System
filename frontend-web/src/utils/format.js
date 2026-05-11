// src/utils/format.js
// Formatting helpers.
import { lsGet } from './storage';

export function formatCurrency(amount) {
  const currency = lsGet('invosix_currency', 'Rs (NPR)');
  const symbol = currency.split(' ')[0] || 'Rs';
  if (amount === null || amount === undefined) return `${symbol} 0`;
  return `${symbol} ${Number(amount).toLocaleString('en-IN')}`;
}

export function formatDate(dateStr, format) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';

  const activeFormat = format || lsGet('invosix_date_format', 'DD/MM/YYYY');

  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();

  if (activeFormat === 'MM/DD/YYYY') return `${month}/${day}/${year}`;
  if (activeFormat === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
  if (activeFormat === 'DD MMM, YYYY') {
    const monthName = d.toLocaleString('default', { month: 'short' });
    return `${day} ${monthName}, ${year}`;
  }
  return `${day}/${month}/${year}`; // Default DD/MM/YYYY
}

export function formatDateTime(dateStr, format) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';

  const datePart = formatDate(dateStr, format);
  const timePart = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return `${datePart}, ${timePart}`;
}

export function generateId(prefix = 'ID') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function generateSKU(name = '') {
  const prefix = name.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X') || 'SKU';
  return `${prefix}-${String(Math.floor(Math.random() * 90000) + 10000)}`;
}
