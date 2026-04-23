// src/pages/admin/Dashboard.jsx
import AdminLayout from '../../layouts/AdminLayout';
import { StatCard, SectionCard, Badge, Avatar, ProgressRow, Button } from '../../components/common';
import { dashboardStats, revenueData, staffOnShift, lowStockItems, topProducts, categoryBreakdown } from '../../data/mockData';
import { useAdmin } from '../../context/AdminContext';

const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

function LineGraph({ data }) {
  const max = Math.max(...data.map(d => d.value || 0));
  const chartHeight = 160;
  const spacing = 70;
  const width = data.length * spacing;
  return (
    <div className="w-full overflow-x-auto pb-4">
      <svg width={width} height={chartHeight} className="block">
        <polyline fill="none" stroke="#1e3a5f" strokeWidth="3"
          points={data.map((d, i) => { const x = i * spacing + spacing / 2; const y = chartHeight - (d.value / max) * chartHeight; return `${x},${y}`; }).join(' ')}
        />
        {data.map((d, i) => { const x = i * spacing + spacing / 2; const y = chartHeight - (d.value / max) * chartHeight; return <circle key={i} cx={x} cy={y} r="4" fill="#1e3a5f" />; })}
      </svg>
      <div className="flex mt-2" style={{ width }}>
        {data.map((d, i) => <div key={i} className="text-center text-[10px] text-[#94a3b8]" style={{ width: spacing }}>{d.label}</div>)}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { setCurrentPage } = useAdmin();
  return (
    <AdminLayout>
      <div className="mb-6">
        <p className="text-xs mb-1 text-[#94a3b8]">{today}</p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#0f172a]">Admin Dashboard</h1>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setCurrentPage('reports')}>↓ Export Report</Button>
            <Button variant="primary" onClick={() => setCurrentPage('add-product')}>+ Add Product</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <StatCard label="Today's Revenue"    value={dashboardStats.todayRevenue}                          progress={72} navy />
        <StatCard label="Total Transactions" value={dashboardStats.totalTransactions}                     progress={45} />
        <StatCard label="Active Customers"   value={dashboardStats.activeCustomers.toLocaleString()}      progress={68} />
        <StatCard label="Low Stock Items"    value={dashboardStats.lowStockItems}                         progress={30} />
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Monthly Revenue"   value={dashboardStats.monthlyRevenue} progress={82} navy />
        <StatCard label="Total Products"    value={dashboardStats.totalProducts}  progress={55} />
        <StatCard label="Staff On Shift"    value={dashboardStats.staffOnShift}   progress={60} />
        <StatCard label="Pending Orders"    value={dashboardStats.pendingOrders}  progress={20} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <SectionCard title="Revenue — Last 14 Days"
          headerRight={<span className="text-xs px-2.5 py-1 rounded-full bg-[#eff6ff] text-[#1e3a5f]">Today</span>}
          className="col-span-2"
        >
          <div className="px-5 pt-4 pb-4">
            <LineGraph data={revenueData} />
            <div className="flex justify-between mt-6">
              <div><p className="text-[10px] text-[#94a3b8] uppercase">Avg Daily</p><p className="text-sm font-semibold text-[#0f172a]">Rs 72,840</p></div>
              <div><p className="text-[10px] text-[#94a3b8] uppercase">Peak Day</p><p className="text-sm font-semibold text-[#0f172a]">Rs 1,01,200</p></div>
              <div><p className="text-[10px] text-[#94a3b8] uppercase">Trend</p><p className="text-sm font-semibold text-[#16a34a]">▲ 14.2%</p></div>
            </div>
          </div>
        </SectionCard>

        <div className="flex flex-col gap-4">
          <SectionCard title="Staff On Shift">
            <div className="px-4 py-3 space-y-3 overflow-y-auto max-h-[160px]">
              {staffOnShift.map(s => (
                <div key={s.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Avatar initials={s.initials} size="sm" />
                    <div><p className="text-xs font-medium text-[#0f172a]">{s.name}</p><p className="text-xs text-[#94a3b8]">{s.role} · {s.id}</p></div>
                  </div>
                  <Badge status={s.status} />
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Low Stock" headerRight={<button onClick={() => setCurrentPage('inventory')} className="text-xs text-[#94a3b8] hover:text-[#1e3a5f]">View All →</button>}>
            <div className="px-4 py-3 space-y-3 overflow-y-auto max-h-[160px]">
              {lowStockItems.map(item => (
                <div key={item.sku} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                    <div><p className="text-xs font-medium text-[#0f172a]">{item.name}</p><p className="text-xs text-[#94a3b8]">{item.sku}</p></div>
                  </div>
                  <span className="text-xs font-medium text-[#dc2626]">{item.count} left</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SectionCard title="Top Products This Month">
          <div className="px-4 py-3 space-y-4 overflow-y-auto max-h-[220px]">
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
            {categoryBreakdown.map(c => <ProgressRow key={c.name} {...c} />)}
          </div>
        </SectionCard>
      </div>
    </AdminLayout>
  );
}
