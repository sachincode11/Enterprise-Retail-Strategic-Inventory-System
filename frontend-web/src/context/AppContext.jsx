// src/context/AppContext.jsx
// GLOBAL STATE — shared across Admin and Cashier.
// Products, transactions, orders, discounts, staff, customers all live here.
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getProducts, updateProduct, addProduct, deleteProduct, adjustInventory, stockStatus, getCategories } from '../services/productService';
import { getTransactions, addTransaction as addTxnService, voidTransaction, refundTransaction } from '../services/transactionService';
import { getOrders, addOrder as addOrderService, updateOrderStatus } from '../services/orderService';
import { getDiscounts, addDiscount as addDiscountService, updateDiscount, deleteDiscount } from '../services/discountService';
import { getCustomers, addCustomer as addCustomerService } from '../services/customerService';
import { getStaff } from '../services/staffService';
import { getStoreInfo } from '../services/storeService';
import { getSettings } from '../services/settingsService';
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
  const [categories, setCategories]     = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [orders, setOrders]             = useState([]);
  const [discounts, setDiscounts]       = useState([]);
  const [customers, setCustomers]       = useState([]);
  const [staff, setStaff]               = useState([]);
  const [storeInfo, setStoreInfo]       = useState(null);
  const [settings, setSettings]         = useState(null);
  const [loading, setLoading]           = useState(true);
  const { user } = useAuth();
  const [liveNotificationReadIds, setLiveNotificationReadIds] = useState(
    () => new Set(lsGet(LIVE_NOTIFICATION_READS_KEY, []))
  );

  // Nepal real-time clock
  const [nowNP, setNowNP] = useState(getNepaliNow());
  useEffect(() => {
    const t = setInterval(() => {
      if (!window.pauseGlobalClock) {
        setNowNP(getNepaliNow());
      }
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Bootstrap all data
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function boot() {
      setLoading(true);
      const [p, t, o, d, c, s, si, st] = await Promise.allSettled([
        getProducts(), getTransactions(), getOrders(), getDiscounts(),
        getCustomers(), getStaff(), getStoreInfo(), getSettings(),
      ]);

      // Log any service failures
      [p, t, o, d, c, s, si, st].forEach((res, i) => {
        if (res.status === 'rejected') {
          console.error(`Backend Service ${i} failed:`, res.reason);
        }
      });

      setProducts(p.status === 'fulfilled' ? (p.value?.data || []) : []);
      setTransactions(t.status === 'fulfilled' ? (t.value?.data || []) : []);
      setOrders(o.status === 'fulfilled' ? (o.value?.data || []) : []);
      setDiscounts(d.status === 'fulfilled' ? (d.value?.data || []) : []);
      setCustomers(c.status === 'fulfilled' ? (c.value?.data || []) : []);
      setStaff(s.status === 'fulfilled' ? (s.value?.data || []) : []);
      setStoreInfo(si.status === 'fulfilled' ? (si.value?.data || null) : null);
      setSettings(st.status === 'fulfilled' ? (st.value?.data || null) : null);
      
      // Fetch categories too
      try {
        const catRes = await getCategories();
        setCategories(catRes?.data || []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }

      setLoading(false);
    }
    boot();
  }, [user]);

  const refreshSettings = useCallback(async () => {
    const res = await getSettings();
    if (res.data) setSettings(res.data);
  }, []);

  const refreshCategories = useCallback(async () => {
    const res = await getCategories();
    if (res.data) setCategories(res.data);
  }, []);

  const refreshDiscounts = useCallback(async () => {
    const res = await getDiscounts();
    if (res.data) setDiscounts(res.data);
  }, []);

  const refreshCustomers = useCallback(async () => {
    const res = await getCustomers();
    if (res.data) setCustomers(res.data);
  }, []);

  // Sync critical display settings to localStorage for utilities (format.js) and handle Theme
  useEffect(() => {
    if (settings) {
      lsSet('invosix_date_format', settings.dateFormat);
      lsSet('invosix_currency', settings.currency);
      
      const isDark = settings.theme === 'Dark' || 
                    (settings.theme === 'System' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
                    
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [settings]);

  useEffect(() => {
    lsSet(LIVE_NOTIFICATION_READS_KEY, [...liveNotificationReadIds]);
  }, [liveNotificationReadIds]);

  const liveNotifications = buildLiveNotifications(products);
  const unreadLiveNotificationCount = liveNotifications.filter(n => !liveNotificationReadIds.has(n.id)).length;
  const currencySymbol = settings?.currency?.split(' ')[0] || 'Rs';
  const dateFormat = settings?.dateFormat || 'DD/MM/YYYY';

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
  const handleAddStock = useCallback(async (productId, adjustmentData) => {
    const { quantity, notes, supplier, invoiceNo } = adjustmentData;
    const qty = parseInt(quantity, 10);
    
    // Construct notes with extra info if provided
    let combinedNotes = notes || '';
    if (supplier || invoiceNo) {
      combinedNotes = `[Supplier: ${supplier || 'N/A'}, Invoice: ${invoiceNo || 'N/A'}] ${combinedNotes}`.trim();
    }

    const res = await adjustInventory(productId, {
      quantity_change: qty,
      movement_type: 'restock', // MovementType.restock
      reference_type: 'manual',  // InventoryReferenceType.manual
      notes: combinedNotes
    });

    try {
      const fresh = await getProducts();
      setProducts(fresh.data);
    } catch {
      setProducts(prev => prev.map(p => {
        if (p.id === productId) {
          const newStock = p.stock + qty;
          return { ...p, stock: newStock, quantity_in_stock: newStock, status: stockStatus(newStock) };
        }
        return p;
      }));
    }
    return res.data;
  }, [getProducts]);

  // ── Transactions ──────────────────────────────────────────────────────────
  const handleAddTransaction = useCallback(async (txn) => {
    const res = await addTxnService(txn);
    setTransactions(prev => [res.data, ...prev]);
    
    // Refresh products to get updated stock levels from backend
    try {
      const fresh = await getProducts();
      setProducts(fresh.data || []);
    } catch (err) {
      console.error("Failed to refresh products after transaction:", err);
    }
    
    return res.data;
  }, []);

  const handleVoidTransaction = useCallback(async (id) => {
    const res = await voidTransaction(id);
    setTransactions(prev => prev.map(t => t.id === id ? (res.data || { ...t, status: 'Voided' }) : t));
    
    // Refresh products to get updated stock levels
    try {
      const fresh = await getProducts();
      setProducts(fresh.data || []);
    } catch (err) {
      console.error("Failed to refresh products after void:", err);
    }
  }, []);

  const handleRefundTransaction = useCallback(async (id, refundData) => {
    const res = await refundTransaction(id, refundData);
    setTransactions(prev => prev.map(t => t.id === id ? (res.data || { ...t, status: 'Refunded' }) : t));

    // Refresh products to get updated stock levels
    try {
      const fresh = await getProducts();
      setProducts(fresh.data || []);
    } catch (err) {
      console.error("Failed to refresh products after refund:", err);
    }
  }, []);

  const handleAddCustomer = useCallback(async (cust) => {
    const res = await addCustomerService(cust);
    setCustomers(prev => [res.data, ...prev]);
    return res.data;
  }, []);

  // ── Orders ────────────────────────────────────────────────────────────────
  const handleAddOrder = useCallback(async (order) => {
    const res = await addOrderService(order);
    setOrders(prev => [res.data, ...prev]);
    return res.data;
  }, []);

  const handleReceiveOrder = useCallback(async (orderId, orderItems) => {
    // Update status in service (saves to localStorage and calls backend)
    const res = await updateOrderStatus(orderId, 'Received', orderItems);
    
    // Update local orders state
    setOrders(prev => prev.map(o => o.id === orderId ? res.data : o));
    
    // Refresh products to get updated stock levels from the backend
    try {
      const fresh = await getProducts();
      setProducts(fresh.data || []);
    } catch (err) {
      console.error("Failed to refresh products after order receipt:", err);
    }
  }, []);


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
      settings,
      refreshSettings,
      currencySymbol,
      dateFormat,

      // Products
      products,
      addProduct: handleAddProduct,
      updateProduct: handleUpdateProduct,
      deleteProduct: handleDeleteProduct,
      addStock: handleAddStock,
      // Categories
      categories,
      refreshCategories,
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
      refreshDiscounts,
      addDiscount: handleAddDiscount,
      updateDiscount: handleUpdateDiscount,
      deleteDiscount: handleDeleteDiscount,
      // Customers
      customers,
      refreshCustomers,
      addCustomer: handleAddCustomer,
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
