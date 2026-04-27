// src/services/discountService.js
import { lsGet, lsSet } from '../utils/storage';
import { apiRequest, getStoreId, normalizeServiceError, toApiEnvelope } from './apiClient';

const LS_KEY = 'invosix_discounts';

function formatDate(d) {
  if (!d) return null;
  if (typeof d === 'string' && d.includes('-')) return d; // already YYYY-MM-DD
  return new Date(d).toISOString().slice(0, 10);
}

function mapDiscountFromBackend(d) {
  const isExpired =
    d.valid_until && new Date(d.valid_until) < new Date() && d.is_active;
  const period = (() => {
    if (d.valid_from && d.valid_until)
      return `${formatDate(d.valid_from)} – ${formatDate(d.valid_until)}`;
    if (d.valid_from) return `From ${formatDate(d.valid_from)}`;
    return 'Ongoing';
  })();

  return {
    id: d.discount_id,
    backendId: d.discount_id,
    name: d.discount_name,
    code: `DISC-${d.discount_id}`, // generated code (no code column in DB)
    type: d.discount_type === 'percentage' ? 'Percentage' : 'Fixed Amount',
    value:
      d.discount_type === 'percentage'
        ? `${Number(d.discount_value)}%`
        : `Rs ${Number(d.discount_value)}`,
    appliesTo:
      d.applies_to === 'transaction'
        ? 'Entire cart'
        : d.applies_to === 'product'
        ? 'Specific product'
        : 'Specific category',
    period,
    used: 0, // usage count not tracked in DB currently
    status: !d.is_active ? 'Inactive' : isExpired ? 'Expired' : 'Active',
    // raw backend fields for editing
    discount_type: d.discount_type,
    discount_value: d.discount_value,
    applies_to: d.applies_to,
    valid_from: d.valid_from,
    valid_until: d.valid_until,
    min_purchase_amount: d.min_purchase_amount,
    is_active: d.is_active,
  };
}

function getStored() {
  return lsGet(LS_KEY, []);
}
function saveStored(data) {
  lsSet(LS_KEY, data);
}

export async function getDiscounts() {
  try {
    const storeId = getStoreId();
    const items = await apiRequest(`/stores/${storeId}/discounts`);
    const mapped = items.map(mapDiscountFromBackend);
    saveStored(mapped);
    return toApiEnvelope(mapped);
  } catch {
    return toApiEnvelope(getStored());
  }
}

export async function addDiscount(discount) {
  try {
    const storeId = getStoreId();
    // Map frontend shape → backend DiscountCreate
    const applies_to = discount.appliesTo?.toLowerCase().includes('cart')
      ? 'transaction'
      : discount.appliesTo?.toLowerCase().includes('product')
      ? 'product'
      : 'category';

    const discount_type =
      discount.type === 'Percentage' ? 'percentage' : 'fixed_amount';

    const discount_value =
      typeof discount.value === 'string'
        ? parseFloat(discount.value.replace(/[^0-9.]/g, ''))
        : Number(discount.value || 0);

    const created = await apiRequest(`/stores/${storeId}/discounts`, {
      method: 'POST',
      body: {
        discount_name: discount.name,
        discount_type,
        discount_value,
        applies_to,
        valid_from: formatDate(discount.validFrom || discount.valid_from) || null,
        valid_until: formatDate(discount.validUntil || discount.valid_until) || null,
        min_purchase_amount: discount.minPurchase ? Number(discount.minPurchase) : null,
        product_id: discount.productId ? Number(discount.productId) : null,
        category_id: discount.categoryId ? Number(discount.categoryId) : null,
      },
    });

    const mapped = mapDiscountFromBackend(created);
    saveStored([mapped, ...getStored().filter((d) => d.id !== mapped.id)]);
    return toApiEnvelope(mapped, 201, 'Created');
  } catch (error) {
    throw normalizeServiceError(error, 'Failed to add discount');
  }
}

export async function updateDiscount(id, updates) {
  try {
    const storeId = getStoreId();
    const source = getStored().find((d) => d.id === id);
    const backendId = source?.backendId || id;

    const patchBody = {};
    if (updates.name) patchBody.discount_name = updates.name;
    if (updates.is_active !== undefined) patchBody.is_active = updates.is_active;
    if (updates.discount_type) patchBody.discount_type = updates.discount_type;
    if (updates.discount_value !== undefined)
      patchBody.discount_value = Number(updates.discount_value);
    if (updates.applies_to) patchBody.applies_to = updates.applies_to;
    if (updates.valid_from !== undefined)
      patchBody.valid_from = formatDate(updates.valid_from);
    if (updates.valid_until !== undefined)
      patchBody.valid_until = formatDate(updates.valid_until);

    const updated = await apiRequest(`/stores/${storeId}/discounts/${backendId}`, {
      method: 'PATCH',
      body: patchBody,
    });

    const mapped = mapDiscountFromBackend(updated);
    saveStored(getStored().map((d) => (d.id === id ? mapped : d)));
    return toApiEnvelope(mapped);
  } catch (error) {
    throw normalizeServiceError(error, 'Failed to update discount');
  }
}

export async function deleteDiscount(id) {
  try {
    const storeId = getStoreId();
    const source = getStored().find((d) => d.id === id);
    const backendId = source?.backendId || id;
    await apiRequest(`/stores/${storeId}/discounts/${backendId}`, { method: 'DELETE' });
    saveStored(getStored().filter((d) => d.id !== id));
    return toApiEnvelope({ deleted: id });
  } catch (error) {
    throw normalizeServiceError(error, 'Failed to delete discount');
  }
}
