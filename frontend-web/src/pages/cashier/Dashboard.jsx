// src/pages/cashier/Dashboard.jsx
import CashierLayout from '../../layouts/CashierLayout';
import { Card, StatCard, SectionHeader } from '../../components/common';
import { hourlyData, lowStockAlerts, topProducts, recentTransactions } from '../../data/mockData';
import { useCashier } from '../../context/CashierContext';

const today = new Date().toLocaleDateString('en-US', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

function HourlyChart() {
  const max = Math.max(...hourlyData.map(d => d.value));
  return (
    <div className="relative h-28 flex items-end gap-1.5 px-1">
      {hourlyData.map((d, i) => {
        const pct = (d.value / max) * 100;
        const isPeak = i === 4;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-sm transition-all duration-200 chart-bar"
              style={{ height:`${pct}%`, background: isPeak?'#1e3a5f':'#bfdbfe', minHeight:4, animationDelay:`${i*0.04}s` }}
            />
            <span className={`text-[9px] font-mono ${isPeak?'text-[#1e3a5f] font-bold':'text-[#94a3b8]'}`}>{d.hour}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const { setCurrentPage } = useCashier();
  return (
    <CashierLayout>
      <div className="p-8 max-w-[1200px]">
        <div className="mb-6">
          <p className="text-xs text-[#94a3b8] font-mono mb-1">{today} · Shift #0842</p>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#0f172a]">Today's Overview</h1>
            <button className="btn-secondary flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export
            </button>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <StatCard label="Today's Revenue"  value="Rs 84,210" progress={72} navy />
          <StatCard label="Transactions"     value="128"        progress={45} />
          <StatCard label="Avg. Basket"      value="Rs 658"     progress={60} />
          <StatCard label="Refunds Today"    value="3"          progress={10} />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#0f172a] text-sm">Hourly Sales</h2>
              <span className="text-xs text-[#94a3b8] font-mono">Today</span>
            </div>
            <HourlyChart />
            <p className="text-xs text-[#94a3b8] mt-3 font-mono">Peak: 12:00–1:00 PM · Rs 12,400</p>
          </Card>

          <Card className="p-5">
            <SectionHeader title="Recent Transactions" actionLabel="View All" action={() => setCurrentPage('transactions')} />
            <div className="space-y-3 overflow-y-auto" style={{ maxHeight:180 }}>
              {recentTransactions.map((txn, i) => (
                <div key={i} className="flex items-center gap-3 py-1">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0" style={{ background:'#1e3a5f' }}>
                    {txn.customer === 'Walk-in Customer' ? '—' : txn.customer[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0f172a] truncate">{txn.customer}</p>
                    <p className="text-xs text-[#94a3b8] font-mono">{txn.id} · {txn.time}</p>
                  </div>
                  <p className="text-sm font-semibold text-[#0f172a]">Rs {txn.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#0f172a] text-sm">Low Stock Alerts</h2>
              <span className="text-xs text-[#94a3b8] font-mono">{lowStockAlerts.length} items</span>
            </div>
            <div className="space-y-3 overflow-y-auto" style={{ maxHeight:160 }}>
              {lowStockAlerts.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                    <div>
                      <p className="text-sm font-medium text-[#0f172a]">{item.name}</p>
                      <p className="text-[11px] text-[#94a3b8] font-mono">{item.sku}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#dc2626]">{item.left} left</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeader title="Top Products Today" />
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-[#94a3b8] w-5">{p.rank}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0f172a] truncate">{p.name}</p>
                    <p className="text-xs text-[#94a3b8]">{p.units} units</p>
                  </div>
                  <p className="text-sm font-semibold text-[#1e3a5f]">Rs {p.revenue.toLocaleString()}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setCurrentPage('pos')} className="mt-4 w-full btn-primary text-sm py-2">Open POS →</button>
          </Card>
        </div>
      </div>
    </CashierLayout>
  );
}
