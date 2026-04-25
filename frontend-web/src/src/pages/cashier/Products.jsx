// src/pages/cashier/Products.jsx — IMPROVED: uses live AppContext products, addToCart wired
import { useState } from 'react';
import CashierLayout from '../../layouts/CashierLayout';
import { useCashier } from '../../context/CashierContext';
import { useApp } from '../../context/AppContext';
import { Badge } from '../../components/common';

export default function Products() {
  const { addToCart, setCurrentPage } = useCashier();
  const { products } = useApp();

  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('All');
  const [view,     setView]     = useState('grid');
  const [added,    setAdded]    = useState({});

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filtered = products.filter(p => {
    const matchCat    = category === 'All' || p.category === category;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleAdd = (product) => {
    if (product.stock === 0) return;
    addToCart(product);
    setAdded(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAdded(prev => ({ ...prev, [product.id]: false })), 1000);
  };

  return (
    <CashierLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs text-[#94a3b8] font-mono mb-0.5">Browse Catalogue</p>
            <h1 className="text-xl font-bold text-[#0f172a]">Products</h1>
          </div>
          <button onClick={() => setCurrentPage('pos')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
            style={{ background: '#1e3a5f' }}>
            → Go to POS
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search product or SKU..."
            className="px-3 py-2 text-sm bg-white border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f] transition-colors" style={{ width: 260 }} />
          <div className="flex gap-1 flex-wrap">
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                style={{
                  borderColor: category === cat ? '#1e3a5f' : '#e2e8f0',
                  background:  category === cat ? '#1e3a5f' : 'white',
                  color:       category === cat ? 'white'   : '#475569',
                }}>{cat}</button>
            ))}
          </div>
          <div className="ml-auto flex border rounded-lg overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
            {['grid', 'list'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className="px-3 py-1.5 text-xs transition-colors"
                style={{ background: view === v ? '#1e3a5f' : 'white', color: view === v ? 'white' : '#475569' }}>
                {v === 'grid' ? '⊞' : '☰'}
              </button>
            ))}
          </div>
        </div>

        {/* Grid view */}
        {view === 'grid' && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map(p => (
              <div key={p.id} className="bg-white rounded-xl border p-4 flex flex-col gap-2 hover:shadow-sm transition-shadow" style={{ borderColor: '#e2e8f0' }}>
                <div className="w-full h-20 rounded-lg flex items-center justify-center mb-1" style={{ background: '#f8fafc' }}>
                  <span className="text-3xl select-none">🛒</span>
                </div>
                <p className="text-sm font-semibold text-[#0f172a] leading-snug">{p.name}</p>
                <p className="text-xs text-[#94a3b8] font-mono">{p.sku}</p>
                <div className="flex items-center justify-between mt-auto">
                  <p className="text-sm font-bold text-[#1e3a5f]">Rs {p.priceNum?.toLocaleString('en-IN')}</p>
                  <Badge status={p.status} />
                </div>
                <p className="text-xs text-[#94a3b8]">Stock: {p.stock}</p>
                <button
                  onClick={() => handleAdd(p)}
                  disabled={p.stock === 0}
                  className="w-full py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: added[p.id] ? '#16a34a' : '#1e3a5f', color: 'white' }}>
                  {added[p.id] ? '✓ Added' : p.stock === 0 ? 'Out of Stock' : '+ Add to Cart'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* List view */}
        {view === 'list' && (
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
            <table className="data-table">
              <thead>
                <tr><th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td className="font-medium text-sm">{p.name}</td>
                    <td><span className="mono text-xs text-[#94a3b8]">{p.sku}</span></td>
                    <td className="text-sm">{p.category}</td>
                    <td className="text-sm font-bold">Rs {p.priceNum?.toLocaleString('en-IN')}</td>
                    <td className="text-sm">{p.stock}</td>
                    <td><Badge status={p.status} /></td>
                    <td>
                      <button
                        onClick={() => handleAdd(p)}
                        disabled={p.stock === 0}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-40"
                        style={{ background: added[p.id] ? '#16a34a' : '#1e3a5f', color: 'white' }}>
                        {added[p.id] ? '✓ Added' : '+ Add'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-sm text-[#94a3b8]">No products match your search</div>
        )}
      </div>
    </CashierLayout>
  );
}
