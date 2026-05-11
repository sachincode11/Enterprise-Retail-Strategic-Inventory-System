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
  const [heldTransactions, setHeldTransactions] = useState(() => lsGet('invosix_pos_held', []));
  const [lastTransaction, setLastTransaction]   = useState(null);
  const [settingsTab, setSettingsTab]         = useState('general');
  const [postAuthPage, setPostAuthPage]       = useState('dashboard');

  // Persistence Effects
  useEffect(() => { lsSet('invosix_pos_cart', cart); }, [cart]);
  useEffect(() => { lsSet('invosix_pos_discount', discount); }, [discount]);
  useEffect(() => { lsSet('invosix_pos_sel_discount', selectedDiscount); }, [selectedDiscount]);
  useEffect(() => { lsSet('invosix_pos_customer', selectedCustomer); }, [selectedCustomer]);
  useEffect(() => { lsSet('invosix_pos_held', heldTransactions); }, [heldTransactions]);

  const addToCart = (product, discounts = []) => {
    const priceSource = product.priceNum ?? product.price;
    const numericPrice = Number(
      typeof priceSource === 'number'
        ? priceSource
        : String(priceSource || '').replace(/[^0-9.]/g, '')
    ) || 0;

    // Check for product-level or category-level discounts
    let lineDiscount = 0;
    let appliedDiscountId = null;
    
    // Normalize discounts list
    const relevantDiscounts = (discounts || []).filter(d => {
      const active = d.is_active === true || d.is_active === 1 || String(d.status).toLowerCase() === 'active';
      return active;
    });
    
    const prodId = Number(product.id || product.product_id || product.productId);
    const catId  = Number(product.category_id || product.categoryId);
    const pName  = String(product.name || product.product_name || '').toLowerCase().trim();

    // Priority: Product-specific discount > Category-specific discount
    const productDiscount = relevantDiscounts.find(d => {
      const dApplies = String(d.applies_to || d.appliesTo || '').toLowerCase();
      if (dApplies !== 'product') return false;
      
      const dProdId  = Number(d.product_id || d.productId);
      const dName    = String(d.name || d.discount_name || '').toLowerCase();
      
      // Try ID match, then fallback to name match
      return (dProdId > 0 && dProdId === prodId) || (pName && dName.includes(pName));
    });

    const categoryDiscount = !productDiscount ? relevantDiscounts.find(d => {
      const dApplies = String(d.applies_to || d.appliesTo || '').toLowerCase();
      if (dApplies !== 'category') return false;
      
      const dCatId   = Number(d.category_id || d.categoryId);
      return dCatId > 0 && dCatId === catId;
    }) : null;

    const activeDiscount = productDiscount || categoryDiscount;

    if (activeDiscount) {
      appliedDiscountId = activeDiscount.id || activeDiscount.discount_id;
      const dType = String(activeDiscount.discount_type || activeDiscount.type || '').toLowerCase();
      const rawVal = activeDiscount.discount_value || activeDiscount.value || 0;
      const dVal  = typeof rawVal === 'string' ? parseFloat(rawVal.replace(/[^0-9.]/g, '')) : Number(rawVal);
      
      if (dType.includes('percent')) {
        lineDiscount = numericPrice * (dVal / 100);
      } else {
        lineDiscount = dVal;
      }
    }

    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        if (existing.qty + 1 > (product.stock ?? 999)) {
          alert(`Cannot add more "${product.name}". Max stock reached.`);
          return prev;
        }
        return prev.map(i => i.id === product.id ? { 
          ...i, 
          qty: i.qty + 1, 
          price: numericPrice,
          lineDiscount,
          discountId: appliedDiscountId
        } : i);
      }
      if ((product.stock ?? 0) <= 0) {
        alert(`"${product.name}" is out of stock.`);
        return prev;
      }
      return [...prev, { 
        ...product, 
        price: numericPrice, 
        qty: 1, 
        stock: product.stock,
        lineDiscount,
        discountId: appliedDiscountId
      }];
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

  const removeHeld = (heldId) => {
    setHeldTransactions(prev => prev.filter(h => h.id !== heldId));
  };

  const voidCart = () => clearCart();

  const subtotal    = cart.reduce((sum, i) => {
    const lineGross = Number(i.price || 0) * i.qty;
    const lineDisc  = Number(i.lineDiscount || 0) * i.qty;
    return sum + (lineGross - lineDisc);
  }, 0);
  
  let discountAmt = 0;
  if (selectedDiscount) {
    const dType = String(selectedDiscount.discount_type || selectedDiscount.type || '').toLowerCase();
    const rawVal = selectedDiscount.discount_value || selectedDiscount.value || 0;
    const dVal  = typeof rawVal === 'string' ? parseFloat(rawVal.replace(/[^0-9.]/g, '')) : Number(rawVal);
    
    if (dType.includes('percent')) {
      discountAmt = subtotal * (dVal / 100);
    } else {
      discountAmt = dVal;
    }
  } else if (discount) {
    if (typeof discount === 'object' && discount !== null) {
      const dVal = Number(discount.value || 0);
      const dType = String(discount.type || '').toLowerCase();
      
      if (dType.includes('percent')) {
        discountAmt = subtotal * (dVal / 100);
      } else {
        discountAmt = dVal;
      }
    } else if (typeof discount === 'number') {
      discountAmt = subtotal * (discount / 100);
    }
  }

  const tax         = cart.reduce((sum, i) => {
    const lineNet = (Number(i.price || 0) - Number(i.lineDiscount || 0)) * i.qty;
    return sum + (lineNet * (Number(i.tax_rate || 0) / 100));
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
      heldTransactions, holdTransaction, resumeHeld, removeHeld, voidCart,
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
