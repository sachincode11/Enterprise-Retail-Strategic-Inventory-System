// src/context/AppContext.jsx
// GLOBAL STATE — shared across Admin and Cashier.
// Products, transactions, orders, discounts all live here so every page sees the same data.
// To connect backend: replace service imports in useEffect with real API calls.
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getProducts, updateProduct, addProduct, deleteProduct } from '../services/productService';
import { getTransactions, addTransaction as addTxnService, voidTransaction, refundTransaction } from '../services/transactionService';
import { getOrders, addOrder as addOrderService, updateOrderStatus } from '../services/orderService';
import { getDiscounts, addDiscount as addDiscountService, updateDiscount, deleteDiscount } from '../services/discountService';
import { getCustomers } from '../services/customerService';
import { lsGet, lsSet } from '../utils/storage';

const AppContext = createContext(null);

// Nepal real-time clock helper
export function getNepaliNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kathmandu' }));
}

export function AppProvider({ children }) {
  const [products, setProducts]         = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [orders, setOrders]             = useState([]);
  const [discounts, setDiscounts]       = useState([]);
  const [customers, setCustomers]       = useState([]);
  const [loading, setLoading]           = useState(true);

  // Nepal real-time clock
  const [nowNP, setNowNP] = useState(getNepaliNow());
  useEffect(() => {
    const t = setInterval(() => setNowNP(getNepaliNow()), 1000);
    return () => clearInterval(t);
  }, []);

  // Bootstrap all data
  useEffect(() => {
    async function boot() {
      const [p, t, o, d, c] = await Promise.all([
        getProducts(), getTransactions(), getOrders(), getDiscounts(), getCustomers(),
      ]);
      setProducts(p.data);
      setTransactions(t.data);
      setOrders(o.data);
      setDiscounts(d.data);
      setCustomers(c.data);
      setLoading(false);
    }
    boot();
  }, []);

  // ── Products ──────────────────────────────────────────────────────────────
  const handleAddProduct = useCallback(async (product) => {
    const res = await addProduct(product);
    setProducts(prev => [res.data, ...prev]);
    return res.data;
  }, []);

  const handleUpdateProduct = useCallback(async (id, updates) => {
    const res = await updateProduct(id, updates);
    setProducts(prev => prev.map(p => p.id === id ? res.data : p));
    return res.data;
  }, []);

  const handleDeleteProduct = useCallback(async (id) => {
    await deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  // Update stock — used when PO is "Received" or stock is adjusted
  const handleAddStock = useCallback(async (productId, qty) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const newStock = product.stock + qty;
    return handleUpdateProduct(productId, { stock: newStock });
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
