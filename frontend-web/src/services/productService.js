// src/services/productService.js
// Service layer for Products — swap USE_MOCK=false + real fetch for backend.

import { fakeApi } from '../utils/fakeApi';
import { lsGet, lsSet } from '../utils/storage';
import { products as mockProducts, store } from '../data/mockData';
import { apiRequest, getStoreId, normalizeServiceError, toApiEnvelope } from './apiClient';

const USE_MOCK = false;
const LS_KEY = 'invosix_products';
const DEFAULT_PAGE_SIZE = 10

function getStored() {
  return lsGet(LS_KEY, mockProducts);
}

function saveStored(data) {
  lsSet(LS_KEY, data);
}

function stockStatus(stock) {
  if (stock <= 0) return 'Out of Stock';
  if (stock <= 10) return 'Low Stock';
  return 'Active';
}

function mapProductFromBackend(product, stockMap, categoryMap, supplierMap) {
  const stock = stockMap.get(product.product_id) ?? 0;
  const priceNum = Number(product.unit_price || 0);
  return {
    id: product.product_id,
    name: product.product_name,
    sku: product.barcode,
    barcode: product.barcode,
    category: categoryMap.get(product.category_id) || 'Uncategorized',
    priceNum,
    price: `Rs ${priceNum}`,
    stock,
    supplierId: product.supplier_id || '',
    supplier: supplierMap.get(product.supplier_id) || '—',
    status: stockStatus(stock),
    unit: product.unit_of_measure || 'pcs',
    tax: Number(product.tax_rate || 0),
    description: product.description || '',
  };
}

async function loadCategoryMap(storeId) {
  try {
    const categories = await apiRequest(`/stores/${storeId}/categories`);
    return new Map(categories.map(cat => [cat.category_id, cat.category_name]));
  } catch {
    return new Map();
  }
}

async function loadStockMap(storeId) {
  try {
    const inventory = await apiRequest(`/stores/${storeId}/inventory`);
    return new Map(inventory.map(item => [item.product_id, item.quantity_in_stock]));
  } catch {
    return new Map();
  }
}

async function loadSupplierMap(storeId) {
  try {
    const suppliers = await apiRequest(`/stores/${storeId}/suppliers`);
    return new Map(suppliers.map(supplier => [supplier.supplier_id, supplier.supplier_name]));
  } catch {
    return new Map();
  }
}

async function resolveCategoryId(storeId, categoryName) {
  if (!categoryName) return null;

  const categories = await apiRequest(`/stores/${storeId}/categories`);
  const existing = categories.find(c => c.category_name.toLowerCase() === categoryName.toLowerCase());
  if (existing) return existing.category_id;

  const created = await apiRequest(`/stores/${storeId}/categories`, {
    method: 'POST',
    body: { category_name: categoryName },
  });
  return created.category_id;
}

export async function getProducts() {
  try {
    const storeId = getStoreId();
    console.log(`The store id is ${storeId}`)
    const [pageData, stockMap, categoryMap, supplierMap] = await Promise.all([
      apiRequest(`/stores/${storeId}/products?page=1&size=${DEFAULT_PAGE_SIZE}`),
      loadStockMap(storeId),
      loadCategoryMap(storeId),
      loadSupplierMap(storeId),
    ]);
    const mapped = (pageData.items || []).map(p => mapProductFromBackend(p, stockMap, categoryMap, supplierMap));
    saveStored(mapped);
    return toApiEnvelope(mapped);
  } catch {
    return fakeApi(getStored());
  }
}

export async function getProductById(id) {
  if (USE_MOCK) {
    const item = getStored().find(p => p.id === id) || null;
    return fakeApi(item);
  }

  try {
    const storeId = getStoreId();
    const [product, stockMap, categoryMap, supplierMap] = await Promise.all([
      apiRequest(`/stores/${storeId}/products/${id}`),
      loadStockMap(storeId),
      loadCategoryMap(storeId),
      loadSupplierMap(storeId),
    ]);
    return toApiEnvelope(mapProductFromBackend(product, stockMap, categoryMap, supplierMap));
  } catch {
    const item = getStored().find(p => p.id === id) || null;
    return fakeApi(item);
  }
}

export async function addProduct(product) {
  console.log("the product to be added is")
  console.log(product)
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

  try {
    const storeId = getStoreId();
    console.log(`The store id is ${storeId}`)
    const categoryId = await resolveCategoryId(storeId, product.category);

    // barcode is required by backend — fall back to SKU, then a timestamp-based code
    const barcode = (product.barcode || '').trim() || (product.sku || '').trim() || `SKU-${Date.now()}`;

    console.log('product', product);
    console.log("i am here");
    const created = await apiRequest(`/stores/${storeId}/products`, {
      method: 'POST',
      body: {
        category_id: categoryId,
        supplier_id: product.supplierId ? Number(product.supplierId) : undefined,
        product_name: product.name,
        barcode,
        description: product.description || null,
        unit_price: Number(product.priceNum || 0),
        tax_rate: Number(product.tax || 0),
        unit_of_measure: product.unit || 'pcs',
      },
    });

    const openingStock = Number(product.stock || 0);
    if (openingStock > 0) {
      await apiRequest(`/stores/${storeId}/inventory/${created.product_id}/adjust`, {
        method: 'POST',
        body: {
          quantity_change: openingStock,
          movement_type: 'adjustment',   // MovementType.adjustment
          reference_type: 'manual',      // InventoryReferenceType.manual
          notes: 'Opening stock on product creation',
        },
      });
    }

    const stockMap = new Map([[created.product_id, openingStock]]);
    const categoryMap = await loadCategoryMap(storeId);
    const supplierMap = await loadSupplierMap(storeId);
    const mapped = mapProductFromBackend(created, stockMap, categoryMap, supplierMap);
    saveStored([mapped, ...getStored().filter(p => p.id !== mapped.id)]);
    return toApiEnvelope(mapped, 201, 'Created');
  } catch (error) {
    throw normalizeServiceError(error, 'Failed to add product');
  }
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

  try {
    const storeId = getStoreId();
    const patchBody = {
      product_name: updates.name,
      description: updates.description,
      unit_price: updates.priceNum !== undefined ? Number(updates.priceNum) : undefined,
      tax_rate: updates.tax !== undefined ? Number(updates.tax) : undefined,
      unit_of_measure: updates.unit,
    };

    if (updates.category) {
      patchBody.category_id = await resolveCategoryId(storeId, updates.category);
    }

    if (updates.supplierId !== undefined) {
      patchBody.supplier_id = updates.supplierId ? Number(updates.supplierId) : null;
    }

    const updatedProduct = await apiRequest(`/stores/${storeId}/products/${id}`, {
      method: 'PATCH',
      body: patchBody,
    });

    if (updates.stock !== undefined) {
      const currentInventory = await apiRequest(`/stores/${storeId}/inventory`);
      const invRow = currentInventory.find(row => row.product_id === Number(id));
      const current = invRow?.quantity_in_stock || 0;
      const target = Number(updates.stock);
      const delta = target - current;

      if (delta !== 0) {
        await apiRequest(`/stores/${storeId}/inventory/${id}/adjust`, {
          method: 'POST',
          body: {
            quantity_change: delta,
            movement_type: 'adjustment',
            reference_type: 'manual',
            notes: 'Stock updated from frontend',
          },
        });
      }
    }

    const stockMap = await loadStockMap(storeId);
    const categoryMap = await loadCategoryMap(storeId);
    const supplierMap = await loadSupplierMap(storeId);
    const mapped = mapProductFromBackend(updatedProduct, stockMap, categoryMap, supplierMap);
    saveStored(getStored().map(p => (p.id === Number(id) ? mapped : p)));
    return toApiEnvelope(mapped);
  } catch (error) {
    throw normalizeServiceError(error, 'Failed to update product');
  }
}

export async function deleteProduct(id) {
  if (USE_MOCK) {
    const updated = getStored().filter(p => p.id !== id);
    saveStored(updated);
    return fakeApi({ deleted: id });
  }

  try {
    const storeId = getStoreId();
    await apiRequest(`/stores/${storeId}/products/${id}`, { method: 'DELETE' });
    saveStored(getStored().filter(p => p.id !== Number(id)));
    return toApiEnvelope({ deleted: id });
  } catch (error) {
    throw normalizeServiceError(error, 'Failed to delete product');
  }
}
