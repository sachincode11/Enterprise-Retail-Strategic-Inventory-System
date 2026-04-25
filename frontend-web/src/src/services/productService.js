// src/services/productService.js
// Service layer for Products — swap USE_MOCK=false + real fetch for backend.

import { fakeApi } from '../utils/fakeApi';
import { lsGet, lsSet } from '../utils/storage';
import { products as mockProducts } from '../data/mockData';

const USE_MOCK = true;
const LS_KEY = 'invosix_products';

function getStored() {
  return lsGet(LS_KEY, mockProducts);
}

function saveStored(data) {
  lsSet(LS_KEY, data);
}

export async function getProducts() {
  if (USE_MOCK) return fakeApi(getStored());
  const res = await fetch('/api/products');
  return res.json();
}

export async function getProductById(id) {
  if (USE_MOCK) {
    const item = getStored().find(p => p.id === id) || null;
    return fakeApi(item);
  }
  const res = await fetch(`/api/products/${id}`);
  return res.json();
}

export async function addProduct(product) {
  if (USE_MOCK) {
    const stored = getStored();
    const newItem = {
      ...product,
      id: Date.now(),
      price: `Rs ${product.priceNum}`,
      status: product.stock <= 0 ? 'Out of Stock' : product.stock <= 10 ? 'Low Stock' : 'Active',
    };
    const updated = [newItem, ...stored];
    saveStored(updated);
    return fakeApi(newItem);
  }
  const res = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(product) });
  return res.json();
}

export async function updateProduct(id, updates) {
  if (USE_MOCK) {
    const stored = getStored();
    const updated = stored.map(p =>
      p.id === id
        ? { ...p, ...updates, price: `Rs ${updates.priceNum ?? p.priceNum}`, status: (updates.stock ?? p.stock) <= 0 ? 'Out of Stock' : (updates.stock ?? p.stock) <= 5 ? 'Low Stock' : 'Active' }
        : p
    );
    saveStored(updated);
    return fakeApi(updated.find(p => p.id === id));
  }
  const res = await fetch(`/api/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
  return res.json();
}

export async function deleteProduct(id) {
  if (USE_MOCK) {
    const updated = getStored().filter(p => p.id !== id);
    saveStored(updated);
    return fakeApi({ deleted: id });
  }
  const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
  return res.json();
}
