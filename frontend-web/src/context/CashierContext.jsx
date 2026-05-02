// src/context/CashierContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { lsGet, lsSet } from '../utils/storage';

const CashierContext = createContext(null);

function getCashierPageFromHash() {
  const hash = window.location.hash || '';
  const [scope, page] = hash.replace(/^#\//, '').split('/');
  if (scope !== 'cashier') return 'dashboard';
  return page || 'dashboard';
}

function setCashierHash(page) {
  const nextPage = page || 'dashboard';
  const nextHash = `#/cashier/${nextPage}`;
  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash;
  }
}

export function CashierProvider({ children }) {
  const [currentPageState, setCurrentPageState] = useState(getCashierPageFromHash);
  const [cart, setCart] = useState(() => lsGet('invosix_pos_cart', []));
  const [discount, setDiscount]               = useState(() => lsGet('invosix_pos_discount', 0));
  const [selectedDiscount, setSelectedDiscount] = useState(() => lsGet('invosix_pos_sel_discount', null));
  const [paymentMethod, setPaymentMethod]     = useState('Cash');
  const [tendered, setTendered]               = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState(() => lsGet('invosix_pos_customer', null));
  const [heldTransactions, setHeldTransactions] = useState([]);
  const [lastTransaction, setLastTransaction]   = useState(null);
  const [settingsTab, setSettingsTab]         = useState('general');
  const [postAuthPage, setPostAuthPage]       = useState('dashboard');

  // Persistence Effects
  useEffect(() => { lsSet('invosix_pos_cart', cart); }, [cart]);
  useEffect(() => { lsSet('invosix_pos_discount', discount); }, [discount]);
  useEffect(() => { lsSet('invosix_pos_sel_discount', selectedDiscount); }, [selectedDiscount]);
  useEffect(() => { lsSet('invosix_pos_customer', selectedCustomer); }, [selectedCustomer]);

  const addToCart = (product) => {
    const priceSource = product.priceNum ?? product.price;
    const numericPrice = Number(
      typeof priceSource === 'number'
        ? priceSource
        : String(priceSource || '').replace(/[^0-9.]/g, '')
    ) || 0;

    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        if (existing.qty + 1 > (product.stock ?? 999)) {
          alert(`Cannot add more "${product.name}". Max stock reached.`);
          return prev;
        }
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1, price: numericPrice } : i);
      }
      if ((product.stock ?? 0) <= 0) {
        alert(`"${product.name}" is out of stock.`);
        return prev;
      }
      return [...prev, { ...product, price: numericPrice, qty: 1, stock: product.stock }];
    });
  };

  const updateQty = (id, delta) =>
    setCart(prev =>
      prev.map(i => {
        if (i.id === id) {
          const nextQty = i.qty + delta;
          if (nextQty > (i.stock ?? 999) && delta > 0) {
            alert(`Cannot increase quantity. Only ${i.stock} units available.`);
            return i;
          }
          return { ...i, qty: Math.max(0, nextQty) };
        }
        return i;
      }).filter(i => i.qty > 0)
    );

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setSelectedDiscount(null);
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

  const subtotal    = cart.reduce((sum, i) => sum + Number(i.price || 0) * i.qty, 0);
  
  let discountAmt = 0;
  if (selectedDiscount) {
    if (selectedDiscount.discount_type === 'percentage') {
      discountAmt = subtotal * (Number(selectedDiscount.discount_value) / 100);
    } else {
      discountAmt = Number(selectedDiscount.discount_value);
    }
  } else if (discount) {
    discountAmt = subtotal * (discount / 100);
  }

  const tax         = cart.reduce((sum, i) => {
    const linePrice = Number(i.price || 0) * i.qty;
    // If we have a global discount, we should apply it proportionally or handle it as backend does
    // Backend: tax = line_total * tax_rate, where line_total is before session discount.
    return sum + (linePrice * (Number(i.tax_rate || 0) / 100));
  }, 0);
  const total       = subtotal + tax - discountAmt;
  const change      = tendered - total;

  function setCurrentPage(page) {
    setCurrentPageState(page);
    setCashierHash(page);
  }

  useEffect(() => {
    const onHashChange = () => setCurrentPageState(getCashierPageFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return (
    <CashierContext.Provider value={{
      currentPage: currentPageState, setCurrentPage,
      cart, addToCart, updateQty, removeFromCart, clearCart,
      discount, setDiscount,
      selectedDiscount, setSelectedDiscount,
      paymentMethod, setPaymentMethod,
      tendered, setTendered,
      selectedCustomer, setSelectedCustomer,
      heldTransactions, holdTransaction, resumeHeld, voidCart,
      settingsTab, setSettingsTab,
      postAuthPage, setPostAuthPage,
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
