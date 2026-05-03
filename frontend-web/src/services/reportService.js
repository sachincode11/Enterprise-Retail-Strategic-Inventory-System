import { apiRequest, getStoreId } from './apiClient';

export async function getDashboardReports(fromDate, toDate) {
  try {
    const storeId = getStoreId();
    let url = `/stores/${storeId}/reports/dashboard`;
    const params = new URLSearchParams();
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);
    if (params.toString()) url += `?${params.toString()}`;

    const data = await apiRequest(url);
    return data;
  } catch (error) {
    console.error("Failed to load dashboard reports:", error);
    return {
      summary: { totalRevenue: 0, transactionsCount: 0, avgBasket: 0, refundRate: 0 },
      monthlyRevenueTrend: [],
      paymentSplit: [],
      cashierPerformance: [],
      auditLog: []
    };
  }
}

