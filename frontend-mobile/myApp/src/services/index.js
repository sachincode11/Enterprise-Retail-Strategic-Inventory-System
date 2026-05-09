// ─── Service layer — swap mock with real API calls ─────────
// Replace BASE_URL and fetch calls when backend is ready.

import {
  mockTransactions,
  mockAnalytics,
  mockOffers,
  mockNotifications,
  mockMonthSummary,
} from '../mock/data';

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

// ─── Transaction Service ───────────────────────────────────
export const transactionService = {
  async getRecentTransactions(limit = 5) {
    await delay();
    // API: GET /api/transactions?limit=N
    return mockTransactions.slice(0, limit).map(t => ({
      id: t.id,
      store: t.store,
      dateLabel: t.dateLabel,
      total: t.total,
      status: t.status,
    }));
  },

  async getTransactions({ period = 'all', search = '' } = {}) {
    await delay();
    // API: GET /api/transactions?period=&search=
    let data = [...mockTransactions];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(t =>
        t.store.toLowerCase().includes(q) ||
        t.txnNo.toLowerCase().includes(q)
      );
    }
    if (period === 'week') {
      data = data.filter(t => t.date.includes('May 1'));
    } else if (period === 'month') {
      data = data.filter(t => t.month === 'May 2025');
    } else if (period === 'refunds') {
      data = data.filter(t => t.status === 'Refunded');
    }
    return data;
  },

  async getTransactionById(id) {
    await delay();
    // API: GET /api/transactions/:id
    return mockTransactions.find(t => t.id === id) || mockTransactions[0];
  },

  async getMonthSummary() {
    await delay();
    // API: GET /api/analytics/summary
    return mockMonthSummary;
  },
};

// ─── Analytics Service ─────────────────────────────────────
export const analyticsService = {
  async getAnalytics(period = 'monthly') {
    await delay();
    // API: GET /api/analytics?period=
    return mockAnalytics[period] || mockAnalytics.monthly;
  },
};

// ─── Offer / Deal Service ──────────────────────────────────
export const offerService = {
  async getOffers(filter = 'All') {
    await delay();
    // API: GET /api/offers?filter=
    return mockOffers;
  },

  async getFeaturedOffer() {
    await delay();
    // API: GET /api/offers/featured
    return mockOffers.find(o => o.featured) || null;
  },
};

// ─── Notification Service ──────────────────────────────────
export const notificationService = {
  async getNotifications() {
    await delay();
    // API: GET /api/notifications
    return mockNotifications;
  },

  async markRead(id) {
    await delay(100);
    // API: PATCH /api/notifications/:id/read
    return { success: true };
  },
};

// ─── User Service ──────────────────────────────────────────
export const userService = {
  async updateProfile(userId, data) {
    await delay();
    // API: PATCH /api/users/:id { fullName, email, phone }
    return { success: true, ...data };
  },

  async updatePassword(userId, { currentPassword, newPassword }) {
    await delay();
    // API: POST /api/users/:id/change-password
    return { success: true };
  },
};

// ─── Chat Service ──────────────────────────────────────────
export const chatService = {
  async sendMessage(message, history = []) {
    await delay(800);
    // API: POST /api/chat { message, history }
    // ── Mock responses for demo ──────────────────────────
    const msg = message.toLowerCase();
    if (msg.includes('point') || msg.includes('loyalt')) {
      return '**Your loyalty balance is 340 points.**\n\nYou need 160 more points to unlock a NPR 500 discount. You earn 10 points for every NPR 1,000 spent at partner stores.';
    }
    if (msg.includes('recent') || msg.includes('purchase') || msg.includes('histor')) {
      return "**Your most recent purchases:**\n\n· NPR 1,850 at Bhatbhateni Supermarket (May 1)\n· NPR 920 at Big Mart (Apr 30)\n· NPR 2,150 at Salesways (Apr 28)\n\nWould you like more details on any transaction?";
    }
    if (msg.includes('deal') || msg.includes('offer') || msg.includes('discount')) {
      return '**Active deals right now:**\n\n· 10% off groceries this weekend\n· NPR 50 cashback via Esewa (NPR 500+)\n· Buy 2 Get 1 on beverages at City Mart\n\nVisit the Deals tab to see all available offers.';
    }
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
      return 'Hello! How can I assist you today? You can ask me about your purchases, loyalty points, or available deals.';
    }
    return "I can help with your purchase history, loyalty points, and available deals. Could you rephrase your question or try one of the suggestions above?";
  },
};
