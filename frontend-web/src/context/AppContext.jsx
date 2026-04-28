// src/context/AppContext.jsx
// GLOBAL STATE — shared across Admin and Cashier.
// Products, transactions, orders, discounts, staff, customers all live here.
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getProducts, updateProduct, addProduct, deleteProduct } from '../services/productService';
import { getTransactions, addTransaction as addTxnService, voidTransaction, refundTransaction } from '../services/transactionService';
import { getOrders, addOrder as addOrderService, updateOrderStatus } from '../services/orderService';
import { getDiscounts, addDiscount as addDiscountService, updateDiscount, deleteDiscount } from '../services/discountService';
import { getCustomers } from '../services/customerService';
import { getStaff } from '../services/staffService';
import { getStoreInfo } from '../services/storeService';
import { lsGet, lsSet } from '../utils/storage';

const AppContext = createContext(null);
const LIVE_NOTIFICATION_READS_KEY = 'invosix_admin_live_notification_reads';

// Nepal real-time clock helper
export function getNepaliNow() {
  // Returns current system date. Components use .toLocaleString(..., { timeZone: 'Asia/Kathmandu' })
  // to display Nepal time accurately regardless of system locale.
  return new Date();
}

function buildLiveNotifications(products = []) {
  return products
    .filter(p => p.status === 'Low Stock' || p.status === 'Out of Stock')
    .map(p => ({
      id:      `live-${p.id}-${p.status}`,
      type:    p.status === 'Out of Stock' ? 'critical' : 'warning',
      title:   p.status === 'Out of Stock' ? 'Out of Stock' : 'Low Stock Alert',
      message: p.status === 'Out of Stock'
        ? `${p.name} (${p.sku}) is out of stock. Last restocked: unknown.`
        : `${p.name} (${p.sku}) has only ${p.stock} units left. Reorder threshold exceeded.`,
      time:    'Just now',
      read:    false,
      page:    'inventory',
    }));
}

export function AppProvider({ children }) {
  const [products, setProducts]         = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [orders, setOrders]             = useState([]);
  const [discounts, setDiscounts]       = useState([]);
  const [customers, setCustomers]       = useState([]);
  const [staff, setStaff]               = useState([]);
  const [storeInfo, setStoreInfo]       = useState(null);
  const [loading, setLoading]           = useState(true);
  const [liveNotificationReadIds, setLiveNotificationReadIds] = useState(
    () => new Set(lsGet(LIVE_NOTIFICATION_READS_KEY, []))
  );

  // Nepal real-time clock
  const [nowNP, setNowNP] = useState(getNepaliNow());
  useEffect(() => {
    const t = setInterval(() => setNowNP(getNepaliNow()), 1000);
    return () => clearInterval(t);
  }, []);

  // Bootstrap all data
  useEffect(() => {
    async function boot() {
      const [p, t, o, d, c, s, si] = await Promise.allSettled([
        getProducts(), getTransactions(), getOrders(), getDiscounts(),
        getCustomers(), getStaff(), getStoreInfo(),
      ]);

      setProducts(p.status === 'fulfilled' ? (p.value?.data || []) : []);
      setTransactions(t.status === 'fulfilled' ? (t.value?.data || []) : []);
      setOrders(o.status === 'fulfilled' ? (o.value?.data || []) : []);
      setDiscounts(d.status === 'fulfilled' ? (d.value?.data || []) : []);
      setCustomers(c.status === 'fulfilled' ? (c.value?.data || []) : []);
      setStaff(s.status === 'fulfilled' ? (s.value?.data || []) : []);
      setStoreInfo(si.status === 'fulfilled' ? (si.value?.data || null) : null);
      setLoading(false);
    }
    boot();
  }, []);

  useEffect(() => {
    lsSet(LIVE_NOTIFICATION_READS_KEY, [...liveNotificationReadIds]);
  }, [liveNotificationReadIds]);

  const liveNotifications = buildLiveNotifications(products);
  const unreadLiveNotificationCount = liveNotifications.filter(n => !liveNotificationReadIds.has(n.id)).length;

  const markLiveNotificationRead = useCallback((id) => {
    setLiveNotificationReadIds(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const markAllLiveNotificationsRead = useCallback((ids = []) => {
    setLiveNotificationReadIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });
  }, []);

  const isLiveNotificationRead = useCallback((id) => liveNotificationReadIds.has(id), [liveNotificationReadIds]);

  // ── Products ──────────────────────────────────────────────────────────────
  const handleAddProduct = useCallback(async (product) => {
    const res = await addProduct(product);
    console.log(`The products  are ${res}`)
    try {
      const fresh = await getProducts();
      setProducts(fresh.data);
    } catch {
      setProducts(prev => [res.data, ...prev]);
    }
    return res.data;
  }, []);

  const handleUpdateProduct = useCallback(async (id, updates) => {
    const res = await updateProduct(id, updates);
    try {
      const fresh = await getProducts();
      setProducts(fresh.data);
    } catch {
      setProducts(prev => prev.map(p => p.id === id ? res.data : p));
    }
    return res.data;
  }, []);

  const handleDeleteProduct = useCallback(async (id) => {
    await deleteProduct(id);
    try {
      const fresh = await getProducts();
      setProducts(fresh.data);
    } catch {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  }, []);

  // Update stock — used when PO is "Received" or stock is adjusted
  const handleAddStock = useCallback(async (productId, qty) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const newStock = product.stock + qty;
    const result = await handleUpdateProduct(productId, { stock: newStock });
    try {
      const fresh = await getProducts();
      setProducts(fresh.data);
    } catch {
      // Keep the update result already applied if a refresh fails.
    }
    return result;
  }, [products, handleUpdateProduct]);

  // ── Transactions ──────────────────────────────────────────────────────────
  const handleAddTransaction = useCallback(async (txn) => {
    const res = await addTxnService(txn);
    setTransactions(prev => [res.data, ...prev]);
    // Deduct stock for each item sold
    if (txn.items && Array.isArray(txn.items)) {
      for (const item of txn.items) {
        const product = products.find(p => p.id === item.id);
        if (product) {
          const newStock = Math.max(0, product.stock - item.qty);
          await handleUpdateProduct(item.id, { stock: newStock });
        }
      }
    }
    return res.data;
  }, [products, handleUpdateProduct]);

  const handleVoidTransaction = useCallback(async (id) => {
    await voidTransaction(id);
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: 'Voided' } : t));
  }, []);

  const handleRefundTransaction = useCallback(async (id) => {
    await refundTransaction(id);
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: 'Refunded' } : t));
  }, []);

  // ── Orders ────────────────────────────────────────────────────────────────
  const handleAddOrder = useCallback(async (order) => {
    const res = await addOrderService(order);
    setOrders(prev => [res.data, ...prev]);
    return res.data;
  }, []);

  const handleReceiveOrder = useCallback(async (orderId, orderItems) => {
    await updateOrderStatus(orderId, 'Received');
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Received' } : o));
    // Increase stock for received items
    if (orderItems && Array.isArray(orderItems)) {
      for (const item of orderItems) {
        await handleAddStock(item.productId, item.qty);
      }
    }
  }, [handleAddStock]);

  // ── Discounts ─────────────────────────────────────────────────────────────
  const handleAddDiscount = useCallback(async (discount) => {
    const res = await addDiscountService(discount);
    setDiscounts(prev => [res.data, ...prev]);
    return res.data;
  }, []);

  const handleUpdateDiscount = useCallback(async (id, updates) => {
    const res = await updateDiscount(id, updates);
    setDiscounts(prev => prev.map(d => d.id === id ? res.data : d));
    return res.data;
  }, []);

  const handleDeleteDiscount = useCallback(async (id) => {
    await deleteDiscount(id);
    setDiscounts(prev => prev.filter(d => d.id !== id));
  }, []);

  return (
    <AppContext.Provider value={{
      loading,
      nowNP,
      storeInfo,
      liveNotifications,
      unreadLiveNotificationCount,
      isLiveNotificationRead,
      markLiveNotificationRead,
      markAllLiveNotificationsRead,
      // Products
      products,
      addProduct: handleAddProduct,
      updateProduct: handleUpdateProduct,
      deleteProduct: handleDeleteProduct,
      addStock: handleAddStock,
      // Transactions
      transactions,
      addTransaction: handleAddTransaction,
      voidTransaction: handleVoidTransaction,
      refundTransaction: handleRefundTransaction,
      // Orders
      orders,
      addOrder: handleAddOrder,
      receiveOrder: handleReceiveOrder,
      // Discounts
      discounts,
      addDiscount: handleAddDiscount,
      updateDiscount: handleUpdateDiscount,
      deleteDiscount: handleDeleteDiscount,
      // Customers
      customers,
      // Staff
      staff,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
