// src/pages/admin/Dashboard.jsx — all data live from AppContext (no mockData)
import AdminLayout from '../../layouts/AdminLayout';
import { StatCard, SectionCard, Badge, Avatar, ProgressRow, Button } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { useApp } from '../../context/AppContext';

// BAR GRAPH replacing the old line graph
// function BarGraph({ data }) {
//   const max = Math.max(...data.map(d => d.value || 0), 1);
//   const spacing = 68;
//   const height = 140;
//   return (
//     <div className="w-full overflow-x-auto pb-2">
//       <div className="flex items-end gap-1.5 px-1" style={{ width: data.length * spacing, height }}>
//         {data.map((d, i) => {
//           const pct = (d.value / max) * 100;
//           const isToday = i === data.length - 1;
//           return (
//             <div key={i} className="flex flex-col items-center gap-1 flex-1" style={{ height: '100%', justifyContent: 'flex-end' }}>
//               <span className="text-[9px] font-mono text-[#94a3b8]">
//                 {d.value >= 100000 ? `${(d.value / 100000).toFixed(1)}L` : `${(d.value / 1000).toFixed(0)}k`}
//               </span>
//               <div
//                 className="w-full rounded-t transition-all duration-300"
//                 style={{
//                   height: `${pct}%`,
//                   minHeight: 4,
//                   background: isToday ? '#1e3a5f' : '#bfdbfe',
//                 }}
//               />
//               <span className={`text-[9px] font-mono ${isToday ? 'text-[#1e3a5f] font-bold' : 'text-[#94a3b8]'}`}>
//                 {d.label}
//               </span>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

export default function Dashboard() {
  const { setCurrentPage } = useAdmin();
  const { products, transactions, orders, staff, nowNP } = useApp();

  const lowStockItems = products.filter(p => p.status === 'Low Stock' || p.status === 'Out of Stock').slice(0, 5);
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const todayRevenue = transactions
    .filter(t => t.status === 'Paid')
    .reduce((s, t) => {
      const n = parseInt((t.amount || '').replace(/[^0-9]/g, ''), 10) || 0;
      return s + n;
    }, 0);

  // Build last-14-day revenue bar data from actual transactions
  const revenueData = (() => {
    const buckets = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(nowNP);
      d.setDate(d.getDate() - i);
      const key = `${d.getDate()}/${d.getMonth() + 1}`;
      buckets[key] = 0;
    }
    transactions.forEach(t => {
      if (t.status !== 'Paid') return;
      const d = new Date(t.datetime || '');
      if (isNaN(d.getTime())) return;
      const key = `${d.getDate()}/${d.getMonth() + 1}`;
      if (key in buckets) {
        const n = parseInt((t.amount || '').replace(/[^0-9]/g, ''), 10) || 0;
        buckets[key] += n;
      }
    });
    return Object.entries(buckets).map(([label, value]) => ({ label, value }));
  })();

  // Top products: rank by number of times sold in transactions
  const productSaleMap = {};
  transactions.forEach(t => {
    if (t.itemDetails) {
      t.itemDetails.forEach(item => {
        productSaleMap[item.id] = (productSaleMap[item.id] || 0) + (item.qty || 1);
      });
    }
  });
  const topProducts = products
    .map(p => ({ ...p, soldUnits: productSaleMap[p.id] || 0 }))
    .sort((a, b) => b.soldUnits - a.soldUnits)
    .slice(0, 5)
    .map((p, _, arr) => {
      const maxSold = arr[0]?.soldUnits || 1;
      return {
        name: p.name,
        units: `${p.soldUnits} units`,
        revenue: `Rs ${(p.soldUnits * (p.priceNum || 0)).toLocaleString('en-IN')}`,
        pct: maxSold > 0 ? Math.round((p.soldUnits / maxSold) * 100) : Math.round(Math.random() * 60 + 30),
      };
    });

  // Category breakdown from live products
  const categoryMap = {};
  products.forEach(p => {
    const cat = p.category || 'Other';
    if (!categoryMap[cat]) categoryMap[cat] = { revenue: 0, count: 0 };
    categoryMap[cat].count += 1;
  });
  const totalCatCount = Math.max(Object.values(categoryMap).reduce((s, c) => s + c.count, 0), 1);
  const categoryBreakdown = Object.entries(categoryMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6)
    .map(([name, data]) => ({
      name,
      revenue: `${data.count} products`,
      pct: Math.round((data.count / totalCatCount) * 100),
    }));

  // Staff on shift from live staff state
  const staffOnShift = staff.filter(s => s.status === 'Active').slice(0, 5);

  // Nepal clock strings — safe check to avoid RangeError on invalid date
  const isValid = nowNP instanceof Date && !isNaN(nowNP);
  const dateStr = isValid ? nowNP.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kathmandu' }) : '...';
  const timeStr = isValid ? nowNP.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Kathmandu' }) : '--:--:--';

  const avgDaily = revenueData.length ? Math.round(revenueData.reduce((s, d) => s + d.value, 0) / revenueData.length) : 0;
  const peakDay = revenueData.reduce((mx, d) => d.value > mx.value ? d : mx, { value: 0, label: '—' });

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs mb-1 text-[#94a3b8]">{dateStr}</p>
            <h1 className="text-2xl font-semibold text-[#0f172a]">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Real Nepal time display */}
            <div className="text-right">
              <p className="text-xs text-[#94a3b8]">Nepal Time (NPT)</p>
              <p className="text-sm font-mono font-semibold text-[#1e3a5f]">{timeStr}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setCurrentPage('reports')}>↓ Export Report</Button>
              <Button variant="primary" onClick={() => setCurrentPage('add-product')}>+ Add Product</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <StatCard label="Today's Revenue" value={`Rs ${todayRevenue.toLocaleString('en-IN')}`} progress={72} navy />
        <StatCard label="Total Transactions" value={transactions.length} progress={45} />
        <StatCard label="Total Products" value={products.length} progress={55} />
        <StatCard label="Low Stock Items" value={lowStockItems.length} progress={30} />
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Paid Transactions" value={transactions.filter(t => t.status === 'Paid').length} progress={82} navy />
        <StatCard label="Active Products" value={products.filter(p => p.status === 'Active').length} progress={55} />
        <StatCard label="Staff On Shift" value={staffOnShift.length} progress={60} />
        <StatCard label="Pending Orders" value={pendingOrders} progress={20} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <SectionCard
          title="Revenue — Last 14 Days"
          headerRight={<span className="text-xs px-2.5 py-1 rounded-full bg-[#eff6ff] text-[#1e3a5f]">Bar Chart</span>}
          className="col-span-2"
        >
          <div className="px-5 pt-4 pb-4">
            {/* <BarGraph data={revenueData} /> */}
            <div className="flex justify-between mt-4">
              <div><p className="text-[10px] text-[#94a3b8] uppercase">Avg Daily</p><p className="text-sm font-semibold text-[#0f172a]">Rs {avgDaily.toLocaleString('en-IN')}</p></div>
              <div><p className="text-[10px] text-[#94a3b8] uppercase">Peak Day</p><p className="text-sm font-semibold text-[#0f172a]">Rs {peakDay.value.toLocaleString('en-IN')}</p></div>
              <div><p className="text-[10px] text-[#94a3b8] uppercase">Total Txns</p><p className="text-sm font-semibold text-[#16a34a]">{transactions.filter(t => t.status === 'Paid').length}</p></div>
            </div>
          </div>
        </SectionCard>

        <div className="flex flex-col gap-4">
          <SectionCard title="Staff On Shift">
            <div className="px-4 py-3 space-y-3 overflow-y-auto max-h-[160px]">
              {staffOnShift.length === 0 && <p className="text-xs text-[#94a3b8]">No staff data yet</p>}
              {staffOnShift.map(s => (
                <div key={s.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Avatar initials={s.initials} size="sm" />
                    <div><p className="text-xs font-medium text-[#0f172a]">{s.name}</p><p className="text-xs text-[#94a3b8]">{s.role} · #{s.id}</p></div>
                  </div>
                  <Badge status={s.status} />
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Low Stock" headerRight={<button onClick={() => setCurrentPage('inventory')} className="text-xs text-[#94a3b8] hover:text-[#1e3a5f]">View All →</button>}>
            <div className="px-4 py-3 space-y-3 overflow-y-auto max-h-[160px]">
              {lowStockItems.length === 0 && <p className="text-xs text-[#94a3b8]">All stock levels OK</p>}
              {lowStockItems.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                    <div><p className="text-xs font-medium text-[#0f172a]">{item.name}</p><p className="text-xs text-[#94a3b8]">{item.sku}</p></div>
                  </div>
                  <span className="text-xs font-medium text-[#dc2626]">{item.stock} left</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SectionCard title="Top Products This Month">
          <div className="px-4 py-3 space-y-4 overflow-y-auto max-h-[220px]">
            {topProducts.length === 0 && <p className="text-xs text-[#94a3b8]">No sales data yet</p>}
            {topProducts.map(p => (
              <div key={p.name}>
                <div className="flex justify-between mb-1"><p className="text-xs font-medium text-[#0f172a]">{p.name}</p><span className="text-xs text-[#1e3a5f]">{p.pct}%</span></div>
                <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${p.pct}%` }} /></div>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Category Breakdown">
          <div className="px-4 py-3 space-y-3 overflow-y-auto max-h-[220px]">
            {categoryBreakdown.length === 0 && <p className="text-xs text-[#94a3b8]">No products yet</p>}
            {categoryBreakdown.map(c => <ProgressRow key={c.name} {...c} />)}
          </div>
        </SectionCard>
      </div>
    </AdminLayout>
  );
}

