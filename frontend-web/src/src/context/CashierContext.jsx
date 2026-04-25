// src/context/CashierContext.jsx
import { createContext, useContext, useState } from 'react';

const CashierContext = createContext(null);

export function CashierProvider({ children }) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [cart, setCart] = useState([]);
  const [discount, setDiscount]               = useState(0);
  const [paymentMethod, setPaymentMethod]     = useState('Cash');
  const [tendered, setTendered]               = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [heldTransactions, setHeldTransactions] = useState([]);
  const [lastTransaction, setLastTransaction]   = useState(null);
  const [settingsTab, setSettingsTab]         = useState('general');

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) =>
    setCart(prev =>
      prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0)
    );

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setPaymentMethod('Cash');
    setTendered(0);
    setSelectedCustomer(null);
  };

  const holdTransaction = () => {
    if (!cart.length) return;
    const held = {
      id: `HOLD-${Date.now()}`,
      cart: [...cart],
      customer: selectedCustomer,
      discount,
      heldAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
    setHeldTransactions(prev => [held, ...prev]);
    clearCart();
  };

  const resumeHeld = (heldId) => {
    const held = heldTransactions.find(h => h.id === heldId);
    if (!held) return;
    setCart(held.cart);
    setSelectedCustomer(held.customer);
    setDiscount(held.discount);
    setHeldTransactions(prev => prev.filter(h => h.id !== heldId));
  };

  const voidCart = () => clearCart();

  const subtotal    = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discountAmt = discount ? subtotal * (discount / 100) : 0;
  const tax         = (subtotal - discountAmt) * 0.13;
  const total       = subtotal - discountAmt + tax;
  const change      = tendered - total;

  return (
    <CashierContext.Provider value={{
      currentPage, setCurrentPage,
      cart, addToCart, updateQty, removeFromCart, clearCart,
      discount, setDiscount,
      paymentMethod, setPaymentMethod,
      tendered, setTendered,
      selectedCustomer, setSelectedCustomer,
      heldTransactions, holdTransaction, resumeHeld, voidCart,
      settingsTab, setSettingsTab,
      subtotal, discountAmt, tax, total, change,
      lastTransaction, setLastTransaction,
    }}>
      {children}
    </CashierContext.Provider>
  );
}

export function useCashier() {
  const ctx = useContext(CashierContext);
  if (!ctx) throw new Error('useCashier must be used inside <CashierProvider>');
  return ctx;
}
