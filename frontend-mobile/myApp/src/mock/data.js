// ─── Mock data — replace all with API responses ────────────

// Transactions
export const mockTransactions = [
  {
    id: '1', txnNo: 'INV-20240501', store: 'Bhatbhateni Supermarket',
    date: 'May 1, 2025', time: '10:32 AM', dateLabel: 'May 1, 2025 · 10:32 AM',
    month: 'May 2025', items: 5, total: 1850, subtotal: 2000,
    discount: 200, tax: 50, taxRate: 13, paymentMethod: 'Esewa',
    status: 'Paid', loyaltyPoints: 18,
    lineItems: [
      { name: 'Rice (5kg)', qty: 1, unitPrice: 700, price: 700 },
      { name: 'Cooking Oil (1L)', qty: 2, unitPrice: 250, price: 500 },
      { name: 'Sugar (1kg)', qty: 1, unitPrice: 130, price: 130 },
      { name: 'Milk (1L)', qty: 3, unitPrice: 90, price: 270 },
      { name: 'Bread', qty: 1, unitPrice: 60, price: 60 },
    ],
  },
  {
    id: '2', txnNo: 'INV-20240430', store: 'Big Mart',
    date: 'Apr 30, 2025', time: '3:15 PM', dateLabel: 'Apr 30, 2025 · 3:15 PM',
    month: 'April 2025', items: 3, total: 920, subtotal: 920,
    discount: 0, tax: 0, taxRate: 0, paymentMethod: 'Cash',
    status: 'Paid', loyaltyPoints: 9,
    lineItems: [
      { name: 'Shampoo', qty: 1, unitPrice: 320, price: 320 },
      { name: 'Toothpaste', qty: 2, unitPrice: 180, price: 360 },
      { name: 'Hand Wash', qty: 1, unitPrice: 240, price: 240 },
    ],
  },
  {
    id: '3', txnNo: 'INV-20240428', store: 'Salesways',
    date: 'Apr 28, 2025', time: '7:45 PM', dateLabel: 'Apr 28, 2025 · 7:45 PM',
    month: 'April 2025', items: 4, total: 2150, subtotal: 2300,
    discount: 150, tax: 0, taxRate: 0, paymentMethod: 'Khalti',
    status: 'Refunded', loyaltyPoints: 0,
    lineItems: [
      { name: 'Instant Noodles ×12', qty: 1, unitPrice: 480, price: 480 },
      { name: 'Biscuits', qty: 3, unitPrice: 80, price: 240 },
      { name: 'Juice (1L) ×3', qty: 1, unitPrice: 540, price: 540 },
      { name: 'Chips', qty: 2, unitPrice: 120, price: 240 },
    ],
  },
  {
    id: '4', txnNo: 'INV-20240425', store: 'City Mart',
    date: 'Apr 25, 2025', time: '12:00 PM', dateLabel: 'Apr 25, 2025 · 12:00 PM',
    month: 'April 2025', items: 2, total: 680, subtotal: 680,
    discount: 0, tax: 0, taxRate: 0, paymentMethod: 'Esewa',
    status: 'Paid', loyaltyPoints: 6,
    lineItems: [
      { name: 'Coffee (250g)', qty: 1, unitPrice: 450, price: 450 },
      { name: 'Tea Bags ×25', qty: 1, unitPrice: 230, price: 230 },
    ],
  },
];

// Analytics
export const mockAnalytics = {
  weekly: {
    totalSpent: 4600, spentChange: 8, totalSaved: 350, savedChange: 12,
    trend: [
      { week: 'Mon', amount: 800 },
      { week: 'Tue', amount: 1200 },
      { week: 'Wed', amount: 600 },
      { week: 'Thu', amount: 900 },
      { week: 'Fri', amount: 1100 },
    ],
    categories: [
      { name: 'Groceries', amount: 2200, color: '#3b82f6' },
      { name: 'Personal Care', amount: 920, color: '#8b5cf6' },
      { name: 'Beverages', amount: 680, color: '#10b981' },
      { name: 'Snacks', amount: 480, color: '#f59e0b' },
    ],
    topStore: { name: 'Bhatbhateni Supermarket', visits: 4, spent: 3400 },
  },
  monthly: {
    totalSpent: 18400, spentChange: 5, totalSaved: 1200, savedChange: 18,
    trend: [
      { week: 'W1', amount: 4200 },
      { week: 'W2', amount: 5100 },
      { week: 'W3', amount: 4600 },
      { week: 'W4', amount: 4500 },
    ],
    categories: [
      { name: 'Groceries', amount: 9800, color: '#3b82f6' },
      { name: 'Personal Care', amount: 3600, color: '#8b5cf6' },
      { name: 'Beverages', amount: 2800, color: '#10b981' },
      { name: 'Snacks', amount: 2200, color: '#f59e0b' },
    ],
    topStore: { name: 'Bhatbhateni Supermarket', visits: 14, spent: 12400 },
  },
  yearly: {
    totalSpent: 198000, spentChange: 11, totalSaved: 14500, savedChange: 22,
    trend: [
      { week: 'Q1', amount: 48000 },
      { week: 'Q2', amount: 52000 },
      { week: 'Q3', amount: 46000 },
      { week: 'Q4', amount: 52000 },
    ],
    categories: [
      { name: 'Groceries', amount: 110000, color: '#3b82f6' },
      { name: 'Personal Care', amount: 42000, color: '#8b5cf6' },
      { name: 'Beverages', amount: 28000, color: '#10b981' },
      { name: 'Snacks', amount: 18000, color: '#f59e0b' },
    ],
    topStore: { name: 'Bhatbhateni Supermarket', visits: 148, spent: 128000 },
  },
};

// Offers / Deals
export const mockOffers = [
  {
    id: '1', type: 'discount', featured: true,
    title: '10% off on all grocery items',
    description: 'Spend NPR 2,000 or more and get 10% off on your entire grocery bill. Valid at all partner stores this weekend.',
    status: 'Active',
  },
  {
    id: '2', type: 'cashback',
    title: 'NPR 50 cashback via Esewa',
    description: 'Pay with Esewa for any transaction above NPR 500.',
    status: 'Active', autoApplied: true,
  },
  {
    id: '3', type: 'discount',
    title: 'Buy 2 Get 1 Free — Beverages',
    description: 'On selected juice and drink brands at City Mart and Salesways.',
    status: 'New',
  },
  {
    id: '4', type: 'discount',
    title: 'Weekend Flash — 15% off Personal Care',
    description: 'Shampoo, soap, and skincare products at Big Mart.',
    status: 'Soon',
  },
];

// Notifications
export const mockNotifications = [
  {
    id: '1', type: 'transaction', read: false,
    title: 'Purchase confirmed',
    body: 'Your purchase of NPR 1,850 at Bhatbhateni has been recorded.',
    timeLabel: '2 hours ago',
  },
  {
    id: '2', type: 'loyalty', read: false,
    title: 'Loyalty points earned',
    body: 'You earned 18 points from your last purchase. Total: 340 points.',
    timeLabel: '2 hours ago',
  },
  {
    id: '3', type: 'offer', read: true,
    title: 'New deal available',
    body: '10% off on groceries this weekend at partner stores.',
    timeLabel: 'Yesterday',
  },
  {
    id: '4', type: 'system', read: true,
    title: 'Account verified',
    body: 'Your email and phone number have been successfully verified.',
    timeLabel: '3 days ago',
  },
];

// Chat
export const mockChatMessages = [
  {
    id: 'welcome',
    role: 'assistant',
    text: "Hi there! I'm your Invo6 assistant. I can help you with your purchase history, loyalty points, available deals, or any store-related queries. What would you like to know?",
  },
];

export const mockChatSuggestions = [
  'My points balance',
  'Recent purchases',
  'Available deals',
];

// Month summary for Home
export const mockMonthSummary = {
  total: 18400,
  change: 5,
  txnCount: 24,
  avgSpend: 767,
  saved: 1200,
};
