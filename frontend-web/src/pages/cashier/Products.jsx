// src/pages/cashier/Products.jsx
import { useState } from 'react';
import CashierLayout from '../../layouts/CashierLayout';
import { useCashier } from '../../context/CashierContext';

const PRODUCTS = [
  { id:1, name:'Organic Basmati Rice 5kg', sku:'SKU-00412', category:'Grains',      price:340, stock:148 },
  { id:2, name:'Amul Full Cream Milk 1L',  sku:'SKU-00218', category:'Dairy',       price:85,  stock:240 },
  { id:3, name:'Wai Wai Chicken Noodles',  sku:'SKU-00085', category:'Instant Food',price:25,  stock:320 },
  { id:4, name:'Sunflower Cooking Oil 1L', sku:'SKU-00531', category:'Oils & Fats', price:290, stock:5   },
  { id:5, name:'Tata Salt 1kg',            sku:'SKU-00102', category:'Condiments',  price:42,  stock:2   },
  { id:6, name:'Nescafé Classic 100g',     sku:'SKU-00198', category:'Beverages',   price:450, stock:4   },
  { id:7, name:'Coca-Cola 500ml',          sku:'SKU-00334', category:'Beverages',   price:65,  stock:56  },
  { id:8, name:'Surf Excel Detergent 500g',sku:'SKU-00287', category:'Household',   price:180, stock:0   },
];

const categories = ['All', ...new Set(PRODUCTS.map(p => p.category))];

export default function Products() {
  const { addToCart, setCurrentPage } = useCashier();
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('All');
  const [view,     setView]     = useState('grid');

  const filtered = PRODUCTS.filter(p => {
    const matchCat    = category === 'All' || p.category === category;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <CashierLayout>
      <div className="p-8">
        <div className="mb-6">
          <p className="text-xs text-[#94a3b8] font-mono mb-1">Product Catalogue</p>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#0f172a]">Products</h1>
            <div className="flex gap-2">
              <button onClick={() => setView('grid')} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border" style={view==='grid'?{background:'#1e3a5f',color:'#fff',borderColor:'#1e3a5f'}:{background:'#fff',borderColor:'#e2e8f0',color:'#475569'}}>Grid</button>
              <button onClick={() => setView('list')} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border" style={view==='list'?{background:'#1e3a5f',color:'#fff',borderColor:'#1e3a5f'}:{background:'#fff',borderColor:'#e2e8f0',color:'#475569'}}>List</button>
              <button onClick={() => setCurrentPage('pos')} className="btn-primary text-xs px-4 py-1.5">Go to POS</button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product or SKU..."
            className="flex-1 px-4 py-2 text-sm bg-white border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f] transition-colors" style={{minWidth:200}} />
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={category===cat?{background:'#1e3a5f',color:'#fff'}:{background:'#fff',border:'1px solid #e2e8f0',color:'#475569'}}>
              {cat}
            </button>
          ))}
        </div>

        {/* Grid view */}
        {view === 'grid' ? (
          <div className="grid grid-cols-4 gap-4">
            {filtered.map(p => {
              const isLow = p.stock > 0 && p.stock <= 5;
              const isOut = p.stock === 0;
              return (
                <div key={p.id} onClick={() => { if(!isOut) addToCart(p); }}
                  className={`bg-white rounded-xl border overflow-hidden transition-all cursor-pointer ${isOut ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#bfdbfe] hover:shadow-sm'}`}
                  style={{borderColor:'#e2e8f0'}}>
                  <div className="aspect-[4/3] bg-[#f1f5f9] flex items-center justify-center">
                    <div className="w-12 h-12 rounded-lg bg-[#e2e8f0] flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-[#0f172a] truncate">{p.name}</h3>
                    <p className="text-[11px] text-[#94a3b8] font-mono mb-2">{p.sku} · {p.category}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#0f172a]">Rs {p.price}</span>
                      {isOut ? <span className="text-[10px] font-mono bg-red-50 text-red-500 px-1.5 py-0.5 rounded">Out</span>
                        : isLow ? <span className="text-[10px] font-mono bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">{p.stock} left</span>
                        : <span className="text-[10px] font-mono text-[#94a3b8]">{p.stock} in stock</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List view */
          <div className="bg-white rounded-xl border overflow-hidden" style={{borderColor:'#e2e8f0'}}>
            <table className="data-table">
              <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr></thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td className="font-semibold text-sm">{p.name}</td>
                    <td><span className="mono text-xs text-[#94a3b8]">{p.sku}</span></td>
                    <td className="text-sm">{p.category}</td>
                    <td className="text-sm font-bold">Rs {p.price}</td>
                    <td className="text-sm">{p.stock === 0 ? <span className="text-red-500">Out of stock</span> : p.stock <= 5 ? <span className="text-amber-600">{p.stock} left</span> : p.stock}</td>
                    <td>
                      <button onClick={() => { if(p.stock>0){addToCart(p); setCurrentPage('pos');}}} disabled={p.stock===0}
                        className="btn-primary text-xs px-3 py-1.5 disabled:opacity-40">Add to Cart</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </CashierLayout>
  );
}
