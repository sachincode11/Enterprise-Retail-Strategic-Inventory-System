// src/context/CashierContext.jsx
import { createContext, useContext, useState } from 'react';

const CashierContext = createContext(null);

export function CashierProvider({ children }) {
  const [currentPage, setCurrentPage] = useState('login');
  const [cart, setCart] = useState([
    { id: 1, name: 'Organic Basmati Rice 5kg',  sku: 'SKU-00412', category: 'Grains',       price: 340, qty: 2 },
    { id: 2, name: 'Amul Full Cream Milk 1L',    sku: 'SKU-00218', category: 'Dairy',        price: 85,  qty: 3 },
    { id: 3, name: 'Wai Wai Chicken Noodles',    sku: 'SKU-00085', category: 'Instant Food', price: 25,  qty: 6 },
    { id: 4, name: 'Sunflower Cooking Oil 1L',   sku: 'SKU-00531', category: 'Oils & Fats',  price: 290, qty: 1 },
  ]);
  const [discount, setDiscount] = useState(10);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [tendered, setTendered] = useState(1500);
  const [selectedCustomer, setSelectedCustomer] = useState({ name: 'Rohan Sharma', phone: '+977-9841-234567', orders: 14 });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [settingsTab, setSettingsTab] = useState('General');

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };
  const updateQty = (id, delta) =>
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0));
  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const clearCart = () => setCart([]);

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
      isAuthenticated, setIsAuthenticated,
      settingsTab, setSettingsTab,
      subtotal, discountAmt, tax, total, change,
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
