// src/services/orderService.js
// Purchase Orders — swap USE_MOCK=false for real backend
import { fakeApi } from '../utils/fakeApi';
import { lsGet, lsSet } from '../utils/storage';
import { purchaseOrders as mockOrders } from '../data/mockData';
import { apiRequest, getStoreId, normalizeServiceError, toApiEnvelope } from './apiClient';
import { getSuppliers } from './supplierService';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_ORDERS === 'true';
const LS_KEY = 'invosix_orders';

function getStored() { return lsGet(LS_KEY, mockOrders); }
function saveStored(data) { lsSet(LS_KEY, data); }

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
}

function mapOrderFromBackend(order, supplierMap) {
  return {
    id: `#PO-${order.order_id}`,
    supplier: supplierMap.get(order.supplier_id) || `Supplier #${order.supplier_id}`,
    items: 0,
    ordered: formatDate(order.order_date),
    expected: formatDate(order.expected_date),
    value: 'Rs 0',
    status: order.status === 'received' ? 'Received' : 'Pending',
    orderItems: [],
  };
}

export async function getOrders() {
  if (USE_MOCK) return fakeApi(getStored());

  try {
    const storeId = getStoreId();
    const [orders, suppliersRes] = await Promise.all([
      apiRequest(`/stores/${storeId}/purchase-orders`),
      getSuppliers(),
    ]);
    const supplierMap = new Map((suppliersRes.data || []).map(s => [s.id, s.name]));
    const mapped = orders.map(order => mapOrderFromBackend(order, supplierMap));
    saveStored(mapped);
    return toApiEnvelope(mapped);
  } catch {
    return fakeApi(getStored());
  }
}

export async function addOrder(order) {
  if (USE_MOCK) {
    const stored = getStored();
    const id = `#PO-${new Date().getFullYear()}-${String(stored.length + 50).padStart(3, '0')}`;
    const now = new Date();
    const ordered = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;
    const expected = new Date(now.getTime() + 3 * 86400000);
    const expectedStr = `${expected.getDate()} ${expected.toLocaleString('default', { month: 'short' })} ${expected.getFullYear()}`;
    const newOrder = { ...order, id, ordered, expected: expectedStr, status: 'Pending' };
    saveStored([newOrder, ...stored]);
    return fakeApi(newOrder);
  }

  try {
    const storeId = getStoreId();
    const suppliersRes = await getSuppliers();
    const supplier = (suppliersRes.data || []).find(s => s.name === order.supplier);
    if (!supplier) throw { status: 400, message: 'Selected supplier was not found.', data: null };

    const created = await apiRequest(`/stores/${storeId}/purchase-orders`, {
      method: 'POST',
      body: {
        supplier_id: supplier.id,
        expected_date: order.deliveryDate || null,
        notes: order.notes || null,
        items: (order.orderItems || []).map(i => ({
          product_id: i.productId,
          quantity_ordered: Number(i.qty || 0),
          unit_cost: Number(i.unitCost || 0),
        })),
      },
    });

    const mapped = {
      id: `#PO-${created.order_id}`,
      supplier: order.supplier,
      items: order.items || (order.orderItems || []).length,
      ordered: formatDate(created.order_date),
      expected: formatDate(created.expected_date),
      value: order.value || 'Rs 0',
      status: 'Pending',
      orderItems: order.orderItems || [],
    };

    saveStored([mapped, ...getStored().filter(o => o.id !== mapped.id)]);
    return toApiEnvelope(mapped, 201, 'Created');
  } catch (error) {
    throw normalizeServiceError(error, 'Failed to create order');
  }
}

export async function updateOrderStatus(id, status) {
  if (USE_MOCK) {
    const stored = getStored();
    const updated = stored.map(o => o.id === id ? { ...o, status } : o);
    saveStored(updated);
    return fakeApi(updated.find(o => o.id === id));
  }

  // Backend currently does not expose a purchase-order status update endpoint.
  // Keep local status in sync for UI workflows.
  const updated = getStored().map(o => (o.id === id ? { ...o, status } : o));
  saveStored(updated);
  return toApiEnvelope(updated.find(o => o.id === id));
}
