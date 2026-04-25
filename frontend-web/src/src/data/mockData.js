// src/data/mockData.js

export const store = {
  id: 'KTM-001',
  name: 'Kathmandu Main Store',
  address: 'New Baneshwor, Kathmandu, Nepal',
  phone: '+977-1-441-0000',
  hours: '08:00 – 20:00',
};

export const currentUser = {
  name: 'Anita Shrestha',
  initials: 'AS',
  role: 'Admin / Shopkeeper',
  email: 'admin@store.np',
  phone: '+977-9801-112233',
  store: 'KTM-001',
};

export const navbarUser = { name: 'Anita S.', role: 'Admin', initials: 'AS' };

export const dashboardStats = {
  todayRevenue: 'Rs 84,210',
  totalTransactions: 128,
  activeCustomers: 1847,
  lowStockItems: 7,
  monthlyRevenue: 'Rs 2.4M',
  totalProducts: 342,
  staffOnShift: 4,
  pendingOrders: 3,
};

// Fixed: added 'label' field used by LineGraph
export const revenueData = [
  { label: '9M', value: 62000 },
  { label: '10M', value: 71000 },
  { label: '11M', value: 58000 },
  { label: '12M', value: 101200 },
  { label: '13M', value: 68000 },
  { label: '14M', value: 75000 },
  { label: '15M', value: 82000 },
  { label: '16M', value: 69000 },
  { label: '17M', value: 77000 },
  { label: '18M', value: 91000 },
  { label: '19M', value: 85000 },
  { label: '20M', value: 72000 },
  { label: '21M', value: 78000 },
  { label: '22M', value: 84210 },
];

export const staffOnShift = [
  { initials: 'KR', name: 'Kasim Rijal',    role: 'Cashier',   id: '#0842', status: 'Active' },
  { initials: 'PS', name: 'Priya Shrestha', role: 'Cashier',   id: '#0843', status: 'Active' },
  { initials: 'RK', name: 'Roshan KC',      role: 'Cashier', id: '#0840', status: 'Break' },
];

export const lowStockItems = [
  { name: 'Tata Salt 1kg',   sku: 'SKU-00102', count: 2 },
  { name: 'Surf Excel 500g', sku: 'SKU-00287', count: 1 },
  { name: 'Nescafé 100g',    sku: 'SKU-00198', count: 4 },
];

export const topProducts = [
  { name: 'Organic Basmati Rice 5kg', units: '1,240 units', revenue: 'Rs 4.2L', pct: 92 },
  { name: 'Amul Full Cream Milk',     units: '3,410 units', revenue: 'Rs 2.9L', pct: 78 },
  { name: 'Wai Wai Noodles',          units: '4,820 units', revenue: 'Rs 1.2L', pct: 65 },
  { name: 'Coca-Cola 500ml',          units: '2,100 units', revenue: 'Rs 1.4L', pct: 54 },
];

export const categoryBreakdown = [
  { name: 'Grains & Pulses', revenue: 'Rs 8.4L', pct: 90 },
  { name: 'Dairy',           revenue: 'Rs 5.1L', pct: 68 },
  { name: 'Beverages',       revenue: 'Rs 4.2L', pct: 55 },
  { name: 'Instant Food',    revenue: 'Rs 2.8L', pct: 38 },
  { name: 'Household',       revenue: 'Rs 2.1L', pct: 28 },
  { name: 'Oils & Fats',     revenue: 'Rs 1.9L', pct: 24 },
];

export const products = [
  { id: 1, name: 'Organic Basmati Rice 5kg',  sku: 'SKU-00412', category: 'Grains',      price: 'Rs 340', priceNum: 340, stock: 148, supplier: 'Nepal Trading Co.',  status: 'Active'       },
  { id: 2, name: 'Amul Full Cream Milk 1L',   sku: 'SKU-00218', category: 'Dairy',       price: 'Rs 85',  priceNum: 85,  stock: 240, supplier: 'Himalaya Dist.',     status: 'Active'       },
  { id: 3, name: 'Wai Wai Chicken Noodles',   sku: 'SKU-00085', category: 'Instant Food',price: 'Rs 25',  priceNum: 25,  stock: 320, supplier: 'Nepal Trading Co.',  status: 'Active'       },
  { id: 4, name: 'Tata Salt 1kg',             sku: 'SKU-00102', category: 'Condiments',  price: 'Rs 42',  priceNum: 42,  stock: 2,   supplier: 'Himalaya Dist.',     status: 'Low Stock'    },
  { id: 5, name: 'Surf Excel Detergent 500g', sku: 'SKU-00287', category: 'Household',   price: 'Rs 180', priceNum: 180, stock: 0,   supplier: 'CleanSupply Pvt.',   status: 'Out of Stock' },
  { id: 6, name: 'Nescafé Classic 100g',      sku: 'SKU-00198', category: 'Beverages',   price: 'Rs 450', priceNum: 450, stock: 4,   supplier: 'Himalaya Dist.',     status: 'Low Stock'    },
  { id: 7, name: 'Sunflower Cooking Oil 1L',  sku: 'SKU-00531', category: 'Oils & Fats', price: 'Rs 290', priceNum: 290, stock: 15,  supplier: 'Agro Fresh Pvt.',    status: 'Active'       },
  { id: 8, name: 'Parle-G Biscuits 800g',     sku: 'SKU-00610', category: 'Snacks',      price: 'Rs 120', priceNum: 120, stock: 88,  supplier: 'Nepal Trading Co.',  status: 'Active'       },
];

export const inventory = [
  { id: 1, name: 'Organic Basmati Rice 5kg',  sku: 'SKU-00412', category: 'Grains',      stock: 148, reorderAt: 20, lastRestock: '15 Mar', supplier: 'Nepal Trading',  status: 'In Stock'     },
  { id: 2, name: 'Amul Full Cream Milk 1L',   sku: 'SKU-00218', category: 'Dairy',       stock: 240, reorderAt: 50, lastRestock: '20 Mar', supplier: 'Himalaya Dist.', status: 'In Stock'     },
  { id: 3, name: 'Tata Salt 1kg',             sku: 'SKU-00102', category: 'Condiments',  stock: 2,   reorderAt: 15, lastRestock: '1 Mar',  supplier: 'Himalaya Dist.', status: 'Low Stock'    },
  { id: 4, name: 'Surf Excel Detergent 500g', sku: 'SKU-00287', category: 'Household',   stock: 0,   reorderAt: 10, lastRestock: '8 Feb',  supplier: 'CleanSupply',    status: 'Out of Stock' },
  { id: 5, name: 'Nescafé Classic 100g',      sku: 'SKU-00198', category: 'Beverages',   stock: 4,   reorderAt: 20, lastRestock: '5 Mar',  supplier: 'Himalaya Dist.', status: 'Low Stock'    },
];

export const customers = [
  { id: 1, name: 'Rohan Sharma',   phone: '+977-9841-234567', email: 'rohan@email.com',  orders: 14, lastVisit: 'Today',     value: 'Rs 12,440', type: 'Registered' },
  { id: 2, name: 'Sunita KC',      phone: '+977-9812-009934', email: 'sunita@email.com', orders: 28, lastVisit: 'Yesterday', value: 'Rs 31,200', type: 'Registered' },
  { id: 3, name: 'Anish Gurung',   phone: '+977-9861-447712', email: 'anish@email.com',  orders: 6,  lastVisit: '22 Mar',    value: 'Rs 8,100',  type: 'Registered' },
  { id: 4, name: 'Walk-in Guest',  phone: '—',                email: '—',                orders: 1,  lastVisit: '22 Mar',    value: 'Rs 1,240',  type: 'Guest'      },
  { id: 5, name: 'Priya Shrestha', phone: '+977-9823-112233', email: 'priya.s@email.com',orders: 19, lastVisit: '21 Mar',    value: 'Rs 22,800', type: 'Registered' },
];

export const suppliers = [
  { id: 1, name: 'Nepal Trading Co.',      email: 'navin@nepaltrading.np',  contact: '+977-1-441-2020', products: 128, lastOrder: '20 Mar', leadTime: '3 days', total: 'Rs 8.4L', status: 'Active'   },
  { id: 2, name: 'Himalaya Distributors',  email: 'orders@himalaya.np',     contact: '+977-1-552-8800', products: 84,  lastOrder: '19 Mar', leadTime: '4 days', total: 'Rs 5.1L', status: 'Active'   },
  { id: 3, name: 'CleanSupply Pvt. Ltd.',  email: 'supply@clean.np',        contact: '+977-1-210-4400', products: 22,  lastOrder: '18 Mar', leadTime: '5 days', total: 'Rs 1.2L', status: 'Active'   },
  { id: 4, name: 'FreshFarm Imports',      email: 'info@freshfarm.np',      contact: '+977-1-341-0099', products: 14,  lastOrder: '1 Feb',  leadTime: '7 days', total: 'Rs 40K',  status: 'Inactive' },
];

export const staff = [
  { id: 1, initials: 'AS', name: 'Anita Shrestha',        email: 'admin@store.np',         role: 'Admin',   store: 'KTM-001', shift: '—',         status: 'Active',   lastLogin: 'Today 08:00' },
  { id: 2, initials: 'KR', name: 'Kasim Rijal',           email: 'kasim@store.np',         role: 'Cashier', store: 'KTM-001', shift: 'On Shift',  status: 'Active',   lastLogin: 'Today 08:14' },
  { id: 3, initials: 'PS', name: 'Priya Shrestha',        email: 'priya.staff@store.np',   role: 'Cashier', store: 'KTM-001', shift: 'On Shift',  status: 'Active',   lastLogin: 'Today 09:00' },
  { id: 4, initials: 'RK', name: 'Roshan KC',             email: 'roshan@store.np',        role: 'Cashier', store: 'KTM-001', shift: 'Break',     status: 'Active',   lastLogin: 'Today 08:30' },
  { id: 5, initials: 'BT', name: 'Bijay Thapa',           email: 'bijay@store.np',         role: 'Cashier', store: 'KTM-001', shift: 'Off today', status: 'Inactive', lastLogin: '18 Mar'      },
];

export const transactions = [
  { id: '#TXN-0091', customer: 'Rohan Sharma',   cashier: 'Kasim R.',  datetime: '22 Mar, 14:48', items: 4, method: 'Cash',   amount: 'Rs 1,416', status: 'Paid'     },
  { id: '#TXN-0090', customer: 'Walk-in Guest',  cashier: 'Kasim R.',  datetime: '22 Mar, 14:32', items: 6, method: 'Cash',   amount: 'Rs 1,240', status: 'Paid'     },
  { id: '#TXN-0089', customer: 'Priya Shrestha', cashier: 'Priya S.',  datetime: '22 Mar, 14:18', items: 3, method: 'Wallet', amount: 'Rs 870',   status: 'Paid'     },
  { id: '#TXN-0088', customer: 'Anish Gurung',   cashier: 'Priya S.',  datetime: '22 Mar, 13:55', items: 8, method: 'Card',   amount: 'Rs 3,400', status: 'Refunded' },
  { id: '#TXN-0087', customer: 'Sunita KC',      cashier: 'Kasim R.',  datetime: '22 Mar, 13:41', items: 2, method: 'Cash',   amount: 'Rs 560',   status: 'Paid'     },
  { id: '#TXN-0086', customer: 'Walk-in Guest',  cashier: 'Priya S.',  datetime: '22 Mar, 13:20', items: 5, method: 'Wallet', amount: 'Rs 2,180', status: 'Pending'  },
];

export const purchaseOrders = [
  { id: '#PO-2026-041', supplier: 'Nepal Trading Co.',     items: 12, ordered: '20 Mar 2026', expected: '24 Mar 2026', value: 'Rs 24,000', status: 'Pending'  },
  { id: '#PO-2026-040', supplier: 'Himalaya Distributors', items: 8,  ordered: '19 Mar 2026', expected: '23 Mar 2026', value: 'Rs 16,800', status: 'Pending'  },
  { id: '#PO-2026-039', supplier: 'CleanSupply Pvt. Ltd.', items: 5,  ordered: '18 Mar 2026', expected: '22 Mar 2026', value: 'Rs 7,200',  status: 'Pending'  },
  { id: '#PO-2026-038', supplier: 'Nepal Trading Co.',     items: 20, ordered: '15 Mar 2026', expected: '18 Mar 2026', value: 'Rs 38,400', status: 'Received' },
  { id: '#PO-2026-037', supplier: 'Himalaya Distributors', items: 14, ordered: '10 Mar 2026', expected: '13 Mar 2026', value: 'Rs 29,100', status: 'Received' },
];

export const discounts = [
  { id: 1, name: 'Seasonal Sale',    code: 'SEASONAL2026', type: 'Percentage',   value: '10%',      appliesTo: 'Entire cart',            period: '1–31 Mar 2026', used: 148, status: 'Active'  },
  { id: 2, name: 'Member Discount',  code: 'MEMBER5',      type: 'Percentage',   value: '5%',       appliesTo: 'Registered customers',   period: 'Ongoing',       used: 94,  status: 'Active'  },
  { id: 3, name: 'Flat Discount',    code: 'FLAT100',      type: 'Fixed Amount', value: 'Rs 100',   appliesTo: 'Orders > Rs 1,000',      period: 'Ongoing',       used: 70,  status: 'Active'  },
  { id: 4, name: 'New Year Promo',   code: 'NY2026',       type: 'Percentage',   value: '15%',      appliesTo: 'Entire cart',            period: '1–7 Jan 2026',  used: 402, status: 'Expired' },
];

export const monthlyRevenueTrend = [
  { month: 'Oct', value: 180000 },
  { month: 'Nov', value: 210000 },
  { month: 'Dec', value: 290000 },
  { month: 'Jan', value: 195000 },
  { month: 'Feb', value: 220000 },
  { month: 'Mar', value: 241000 },
];

export const cashierPerformance = [
  { name: 'Kasim Rijal',    txns: 1240, revenue: 'Rs 9.8L', avg: 'Rs 790' },
  { name: 'Priya Shrestha', txns: 1080, revenue: 'Rs 7.9L', avg: 'Rs 731' },
  { name: 'Bijay Thapa',    txns: 920,  revenue: 'Rs 6.4L', avg: 'Rs 696' },
];

export const auditLog = [
  { action: 'Discount applied — SEASONAL2026', by: 'Kasim R.',         ref: '#TXN-0091', time: '14:48' },
  { action: 'Refund processed — #TXN-0088',    by: 'Priya S.',         ref: 'Rs 3,400',  time: '13:55' },
  { action: 'Stock adjusted — SKU-00412',      by: 'Admin (Anita S.)', ref: '+50 units', time: '09:12' },
  { action: 'New PO created — #PO-2026-041',   by: 'Admin (Anita S.)', ref: '',          time: '08:48' },
];

export const forecastData = [
  { label: 'Mon', value: 72000 },
  { label: 'Tue', value: 85000 },
  { label: 'Wed', value: 91000 },
  { label: 'Thu', value: 78000 },
  { label: 'Fri', value: 88000 },
  { label: 'Sat', value: 112000 },
  { label: 'Sun', value: 95000 },
];

export const restockRecommendations = [
  { name: 'Tata Salt 1kg',        note: 'Will stockout in ~2 days at current sell rate',     action: 'Reorder'  },
  { name: 'Surf Excel 500g',      note: 'Out of stock – high demand predicted (↑ 34%)',      action: 'Reorder'  },
  { name: 'Nescafé Classic 100g', note: 'Weekend demand spike expected – order now',         action: 'Schedule' },
  { name: 'Coca-Cola 500ml',      note: 'Trending up 28% – increase standing order',         action: 'Adjust'   },
];

export const ragKnowledgeBase = [
  { name: 'Store Policies',            key: 'store_policies',        count: '12 docs'               },
  { name: 'Store FAQs',                key: 'store_faqs',            count: '48 entries'            },
  { name: 'Product Descriptions',      key: 'rag_document_chunks',   count: '342 chunks'            },
  { name: 'Sales History Embeddings',  key: 'sales_history',         count: 'Indexed to Mar 2026'   },
];

export const activityLog = [
  { action: 'Created PO #PO-2026-041',            by: 'You', time: '22 Mar · 08:48' },
  { action: 'Adjusted stock — SKU-00412 (+50)',    by: 'You', time: '22 Mar · 09:12' },
  { action: 'Added staff — Bijay Thapa',           by: 'You', time: '21 Mar · 15:30' },
  { action: 'Created discount — SEASONAL2026',     by: 'You', time: '1 Mar · 10:00'  },
  { action: 'Updated product price — Basmati Rice',by: 'You', time: '28 Feb · 11:20' },
];

export const integrations = [
  { name: 'WebSocket Server',   desc: 'Real-time transaction sync',           status: 'Connected', action: 'Configure' },
  { name: 'FastAPI Backend',    desc: 'api.store.np:8000',                    status: 'Healthy',   action: null        },
  { name: 'MySQL Database',     desc: 'db.store.np:3306',                     status: 'Connected', action: null        },
  { name: 'Email OTP Service',  desc: 'SMTP · smtp.store.np',                 status: 'Active',    action: 'Test'      },
  { name: 'AI Model Service',   desc: 'scikit-learn · localhost:5050',        status: 'Online',    action: null        },
];
// ✅ REQUIRED FOR CASHIER DASHBOARD

export const hourlyData = [
  { hour: '9', value: 4200 },
  { hour: '10', value: 6100 },
  { hour: '11', value: 7200 },
  { hour: '12', value: 12400 }, // peak
  { hour: '13', value: 9800 },
  { hour: '14', value: 8600 },
  { hour: '15', value: 7900 },
  { hour: '16', value: 6800 },
];

export const lowStockAlerts = [
  { name: 'Tata Salt 1kg', sku: 'SKU-00102', left: 2 },
  { name: 'Surf Excel 500g', sku: 'SKU-00287', left: 1 },
  { name: 'Nescafé Classic 100g', sku: 'SKU-00198', left: 4 },
];

export const recentTransactions = [
  { id: '#TXN-0091', customer: 'Rohan Sharma', time: '14:48', amount: 1416 },
  { id: '#TXN-0090', customer: 'Walk-in Customer', time: '14:32', amount: 1240 },
  { id: '#TXN-0089', customer: 'Priya Shrestha', time: '14:18', amount: 870 },
  { id: '#TXN-0088', customer: 'Anish Gurung', time: '13:55', amount: 3400 },
];

