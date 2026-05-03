// src/services/orderService.js
// Purchase Orders — swap USE_MOCK=false for real backend
import { fakeApi } from '../utils/fakeApi';
import { lsGet, lsSet } from '../utils/storage';
import { purchaseOrders as mockOrders } from '../data/mockData';
import { apiRequest, getStoreId, normalizeServiceError, toApiEnvelope } from './apiClient';
import { getSuppliers } from './supplierService';
import { formatDate, formatCurrency } from '../utils/format';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_ORDERS === 'true';
const LS_KEY = 'invosix_orders';

function getStored() { return lsGet(LS_KEY, mockOrders); }
function saveStored(data) { lsSet(LS_KEY, data); }



function mapOrderFromBackend(order, supplierMap) {
  const items = order.items || [];
  const itemsCount = items.length;
  const totalValue = items.reduce((sum, item) => sum + (Number(item.unit_cost || 0) * Number(item.quantity_ordered || 0)), 0);
  
  return {
    id: `#PO-${order.order_id}`,
    supplier: supplierMap.get(order.supplier_id) || `Supplier #${order.supplier_id}`,
    items: itemsCount,
    ordered: formatDate(order.order_date),
    expected: formatDate(order.expected_date),
    value: formatCurrency(totalValue),
    status: order.status === 'received' ? 'Received' : order.status === 'pending' ? 'Pending' : order.status,
    orderItems: items.map(item => ({
      productId: item.product_id,
      qty: item.quantity_ordered,
      quantityOrdered: item.quantity_ordered,
      quantityReceived: item.quantity_received,
      unitCost: item.unit_cost,
      id: item.product_id,
    })),

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
    const ordered = formatDate(now);
    const expected = new Date(now.getTime() + 3 * 86400000);
    const expectedStr = formatDate(expected);
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
      value: order.value || formatCurrency(0),
      status: 'Pending',
      orderItems: order.orderItems || [],
    };

    saveStored([mapped, ...getStored().filter(o => o.id !== mapped.id)]);
    return toApiEnvelope(mapped, 201, 'Created');
  } catch (error) {
    throw normalizeServiceError(error, 'Failed to create order');
  }
}

export async function updateOrderStatus(id, status, orderItems = []) {
  if (USE_MOCK) {
    const stored = getStored();
    const updated = stored.map(o => o.id === id ? { ...o, status } : o);
    saveStored(updated);
    return fakeApi(updated.find(o => o.id === id));
  }

  try {
    const storeId = getStoreId();
    const orderId = id.replace('#PO-', '');
    
    // Build items payload with quantities
    const items = (orderItems || []).map(item => ({
      product_id: item.productId || item.id,
      quantity_received: item.qty || item.quantityOrdered || 0,
    }));

    const [updated, suppliersRes] = await Promise.all([
      apiRequest(
        `/stores/${storeId}/purchase-orders/${orderId}/status`,
        {
          method: 'PATCH',
          body: {
            status: status.toLowerCase(),
            items,
          },
        }
      ),
      getSuppliers(),
    ]);

    const supplierMap = new Map((suppliersRes.data || []).map(s => [s.id, s.name]));
    const mapped = mapOrderFromBackend(updated, supplierMap);

    // Update localStorage with new status
    const stored = getStored().map(o => (o.id === id ? mapped : o));
    saveStored(stored);
    
    return toApiEnvelope(mapped);
  } catch (error) {
    throw normalizeServiceError(error, 'Failed to update order status');
  }
}

