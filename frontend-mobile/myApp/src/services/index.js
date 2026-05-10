// ─── Service layer — integrated with real backend API ─────────
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from './apiClient';

// Helper to get storeId (fallback to 1)
const getStoreId = async () => {
  try {
    const sessionStr = await AsyncStorage.getItem('@invo6_session');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      return session.user?.storeId || 1;
    }
  } catch (e) {}
  return 1;
};

// ─── Transaction Service ───────────────────────────────────
export const transactionService = {
  async getRecentTransactions(limit = 5) {
    const data = await apiRequest(`/customer/transactions?size=${limit}`);
    return data.map(t => {
      const d = new Date(t.transaction_date);
      return {
        id: t.transaction_id,
        store: t.store?.store_name || `Store ${t.store_id}`,
        dateLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        total: t.total_amount,
        status: t.status,
      };
    });
  },

  async getTransactions({ period = 'all', search = '' } = {}) {
    const data = await apiRequest(`/customer/transactions?size=50`);
    
    let filtered = data;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(t => 
        (t.invoice_number && t.invoice_number.toLowerCase().includes(q)) ||
        (t.store?.store_name && t.store.store_name.toLowerCase().includes(q))
      );
    }
    // Simple period filtering on frontend
    const now = new Date();
    if (period === 'refunds') {
      filtered = filtered.filter(t => t.status === 'refunded');
    } else if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(t => new Date(t.transaction_date) >= weekAgo);
    } else if (period === 'month') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      filtered = filtered.filter(t => new Date(t.transaction_date) >= monthAgo);
    }

    return filtered.map(t => {
      const d = new Date(t.transaction_date);
      return {
        id: t.transaction_id,
        store: t.store?.store_name || `Store ${t.store_id}`,
        txnNo: t.invoice_number,
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        month: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        total: t.total_amount,
        status: t.status,
        items: t.items?.length || 0,
        paymentMethod: t.payments?.[0]?.payment_method || 'Cash',
      };
    });
  },

  async getTransactionById(id) {
    const t = await apiRequest(`/customer/transactions/${id}`);
    const d = new Date(t.transaction_date);
    
    return {
      id: t.transaction_id,
      store: t.store?.store_name || `Store ${t.store_id}`,
      txnNo: t.invoice_number,
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      total: t.total_amount,
      subtotal: t.subtotal,
      discount: t.discount_amount,
      tax: t.tax_amount,
      taxRate: 13, // Standard VAT
      status: t.status,
      paymentMethod: t.payments?.[0]?.payment_method || 'Cash',
      lineItems: (t.items || []).map(item => ({
        name: item.product?.product_name || `Product ${item.product_id}`,
        qty: item.quantity,
        unitPrice: item.unit_price_at_sale,
        price: item.line_total
      }))
    };
  },

  async getMonthSummary() {
    try {
      return await apiRequest(`/customer/summary`);
    } catch (e) {
      console.error("Error fetching summary:", e);
      return { total: 0, txnCount: 0, avgSpend: 0, saved: 0, change: 0, loyaltyPoints: 0 };
    }
  },
};

// ─── Analytics Service ─────────────────────────────────────
export const analyticsService = {
  async getAnalytics(period = 'monthly') {
    try {
      return await apiRequest(`/customer/analytics?period=${period}`);
    } catch (e) {
      console.error("Analytics Error:", e);
      return null;
    }
  },
};

// ─── Offer / Deal Service ──────────────────────────────────
export const offerService = {
  async getOffers(filter = 'All') {
    const storeId = await getStoreId();
    const data = await apiRequest(`/stores/${storeId}/discounts`);
    return data.map(d => ({
      id: d.discount_id,
      title: d.discount_name,
      description: `${d.discount_type === 'percentage' ? d.discount_value + '%' : 'NPR ' + d.discount_value} off on ${d.applies_to}`,
      type: d.applies_to === 'loyalty' ? 'loyalty' : 'cashback', // Simplified mapping
      featured: d.discount_value > 20 || d.discount_type === 'fixed_amount',
      status: d.is_active ? 'Active' : 'Expired',
      autoApplied: true
    }));
  },

  async getFeaturedOffer() {
    const offers = await this.getOffers();
    return offers.find(o => o.featured) || offers[0] || null;
  },
};

// ─── Notification Service ──────────────────────────────────
export const notificationService = {
  async getNotifications() {
    const data = await apiRequest('/notifications');
    const MAP_TYPE = {
      transaction_receipt: 'transaction',
      refund_processed: 'transaction',
      low_stock_alert: 'system',
      system_alert: 'system',
      otp: 'system'
    };

    return data.map(n => {
      const d = new Date(n.created_at);
      const isToday = d.toLocaleDateString() === new Date().toLocaleDateString();
      
      return {
        id: n.notification_id,
        title: n.subject || 'Alert',
        body: n.body,
        type: MAP_TYPE[n.notification_type] || 'system',
        read: n.status === 'read' || !!n.read_at,
        timeLabel: isToday
          ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
    });
  },

  async markRead(id) {
    return await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
  },
};

// ─── User Service ──────────────────────────────────────────
export const userService = {
  async updateProfile(userId, data) {
    return await apiRequest('/auth/me', {
      method: 'PATCH',
      body: {
        first_name: data.fullName?.split(' ')[0],
        last_name: data.fullName?.split(' ').slice(1).join(' '),
        email: data.email,
        phone: data.phone,
      }
    });
  },

  async updatePassword(userId, { currentPassword, newPassword }) {
    return await apiRequest('/auth/change-password', {
      method: 'POST',
      body: { 
        current_password: currentPassword, 
        new_password: newPassword 
      }
    });
  },

  async forgotPassword(email) {
    return await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: { email }
    });
  },
};

// ─── Chat Service ──────────────────────────────────────────
export const chatService = {
  async sendMessage(message, history = []) {
    const storeId = await getStoreId();
    const response = await apiRequest('/chatbot/chat', {
      method: 'POST',
      body: { 
        message, 
        store_id: storeId,
        history // Note: Backend might not support history yet, but passing for compatibility
      }
    });
    return response.response;
  },
};

