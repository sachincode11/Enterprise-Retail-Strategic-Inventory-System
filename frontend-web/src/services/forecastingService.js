import { apiRequest, getStoreId } from './apiClient';

export async function generateForecast(productId, days = 30) {
  const storeId = getStoreId();
  return apiRequest(`/forecasting/generate/${productId}?store_id=${storeId}`, {
    method: 'POST',
    body: { forecast_days: days }
  });
}

export async function bulkGenerateForecasts(days = 30) {
  const storeId = getStoreId();
  return apiRequest(`/forecasting/bulk-generate`, {
    method: 'POST',
    body: { store_id: storeId, forecast_days: days }
  });
}

export async function getProductForecast(productId, daysAhead = 7) {
  const storeId = getStoreId();
  return apiRequest(`/forecasting/forecast/${productId}?store_id=${storeId}&days_ahead=${daysAhead}`);
}

export async function getTopPredictedSellers(daysAhead = 7, limit = 10) {
  const storeId = getStoreId();
  return apiRequest(`/forecasting/top-sellers?store_id=${storeId}&days_ahead=${daysAhead}&top_n=${limit}`);
}

export async function getModelMetrics() {
  const storeId = getStoreId();
  return apiRequest(`/forecasting/model-metrics?store_id=${storeId}`);
}
