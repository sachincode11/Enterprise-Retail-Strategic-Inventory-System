import { apiRequest, getStoreId } from './apiClient';

export async function getFAQs() {
  const storeId = getStoreId();
  return apiRequest(`/stores/${storeId}/faqs`);
}

export async function createFAQ(data) {
  const storeId = getStoreId();
  return apiRequest(`/stores/${storeId}/faqs`, {
    method: 'POST',
    body: data,
  });
}

export async function updateFAQ(id, data) {
  const storeId = getStoreId();
  return apiRequest(`/stores/${storeId}/faqs/${id}`, {
    method: 'PATCH',
    body: data,
  });
}

export async function deleteFAQ(id) {
  const storeId = getStoreId();
  return apiRequest(`/stores/${storeId}/faqs/${id}`, {
    method: 'DELETE',
  });
}

export async function getPolicies() {
  const storeId = getStoreId();
  return apiRequest(`/stores/${storeId}/policies`);
}

export async function createPolicy(data) {
  const storeId = getStoreId();
  return apiRequest(`/stores/${storeId}/policies`, {
    method: 'POST',
    body: data,
  });
}

export async function updatePolicy(id, data) {
  const storeId = getStoreId();
  return apiRequest(`/stores/${storeId}/policies/${id}`, {
    method: 'PATCH',
    body: data,
  });
}

export async function deletePolicy(id) {
  const storeId = getStoreId();
  return apiRequest(`/stores/${storeId}/policies/${id}`, {
    method: 'DELETE',
  });
}
