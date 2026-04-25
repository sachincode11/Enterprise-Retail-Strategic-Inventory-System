// src/pages/cashier/Dashboard.jsx — IMPROVED: bar graph, real data, export, Nepal time
import CashierLayout from '../../layouts/CashierLayout';
import { Card, StatCard, SectionHeader } from '../../components/common';
import { topProducts } from '../../data/mockData';
import { useCashier } from '../../context/CashierContext';
import { useApp } from '../../context/AppContext';
import { exportCSV } from '../../utils/exportData';

// BAR CHART (replaces line)
function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="flex items-end gap-1.5 h-28 px-1">
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        const isPeak = d.value === max;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1" style={{ height: '100%', justifyContent: 'flex-end' }}>
            <div className="w-full rounded-t transition-all duration-300"
              style={{ height: `${pct}%`, background: isPeak ? '#1e3a5f' : '#bfdbfe', minHeight: 4 }} />
            <span className={`text-[9px] font-mono ${isPeak ? 'text-[#1e3a5f] font-bold' : 'text-[#94a3b8]'}`}>{d.hour}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const { setCurrentPage } = useCashier();
  const { transactions, products, nowNP } = useApp();

  const today = nowNP.toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kathmandu',
  });

  // Compute today's live stats from real transactions
  const paidTxns   = transactions.filter(t => t.status === 'Paid');
  const todayRev   = paidTxns.reduce((s, t) => s + (parseInt((t.amount || '').replace(/[^0-9]/g, ''), 10) || 0), 0);
  const refundCount= transactions.filter(t => t.status === 'Refunded').length;
  const avgBasket  = paidTxns.length > 0 ? Math.round(todayRev / paidTxns.length) : 0;

  const lowStockAlerts = products.filter(p => p.status === 'Low Stock' || p.status === 'Out of Stock').slice(0, 5);
  const recentTxns = transactions.slice(0, 4);

  // Build hourly bar data from transactions (mock hour distribution for now)
  const hourlyData = [
    { hour: '9',  value: 4200  },
    { hour: '10', value: 6100  },
    { hour: '11', value: 7200  },
    { hour: '12', value: 12400 },
    { hour: '13', value: 9800  },
    { hour: '14', value: 8600  },
    { hour: '15', value: 7900  },
    { hour: '16', value: 6800  },
  ];

  const handleExport = () => {
    const data = transactions.map(t => ({
      ID: t.id, Customer: t.customer, DateTime: t.datetime,
      Items: t.items, Payment: t.method, Amount: t.amount, Status: t.status,
    }));
    exportCSV(data, `shift-export-${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <CashierLayout>
      <div className="p-8 max-w-[1200px]">
        <div className="mb-6">
          <p className="text-xs text-[#94a3b8] font-mono mb-1">{today} · Shift #0842</p>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#0f172a]">Today's Overview</h1>
            {/* Export button — downloads CSV locally */}
            <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export
            </button>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <StatCard label="Today's Revenue"  value={`Rs ${todayRev.toLocaleString('en-IN')}`} progress={72} navy />
          <StatCard label="Transactions"     value={transactions.length} progress={45} />
          <StatCard label="Avg. Basket"      value={`Rs ${avgBasket.toLocaleString('en-IN')}`} progress={60} />
          <StatCard label="Refunds Today"    value={refundCount} progress={10} />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Bar chart */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#0f172a] text-sm">Hourly Sales</h2>
              <span className="text-xs text-[#94a3b8] font-mono">Today · Bar Chart</span>
            </div>
            <BarChart data={hourlyData} />
            <p className="text-xs text-[#94a3b8] mt-3 font-mono">Peak: 12:00–1:00 PM · Rs 12,400</p>
          </Card>

          <Card className="p-5">
            <SectionHeader title="Recent Transactions" actionLabel="View All" action={() => setCurrentPage('transactions')} />
            <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 180 }}>
              {recentTxns.map((txn, i) => (
                <div key={i} className="flex items-center gap-3 py-1">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0" style={{ background: '#1e3a5f' }}>
                    {txn.customer === 'Walk-in Guest' ? '—' : txn.customer[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0f172a] truncate">{txn.customer}</p>
                    <p className="text-xs text-[#94a3b8] font-mono">{txn.id} · {txn.datetime?.split(',')[1] || ''}</p>
                  </div>
                  <p className="text-sm font-semibold text-[#0f172a]">{txn.amount}</p>
                </div>
              ))}
              {recentTxns.length === 0 && <p className="text-xs text-[#94a3b8] text-center py-4">No transactions yet</p>}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#0f172a] text-sm">Low Stock Alerts</h2>
              <span className="text-xs text-[#94a3b8] font-mono">{lowStockAlerts.length} items</span>
            </div>
            <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 160 }}>
              {lowStockAlerts.length === 0 && <p className="text-xs text-[#94a3b8]">All stock levels OK</p>}
              {lowStockAlerts.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                    <div>
                      <p className="text-sm font-medium text-[#0f172a]">{item.name}</p>
                      <p className="text-[11px] text-[#94a3b8] font-mono">{item.sku}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#dc2626]">{item.stock} left</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeader title="Top Products Today" />
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-[#94a3b8] w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0f172a] truncate">{p.name}</p>
                    <p className="text-xs text-[#94a3b8]">{p.units} units</p>
                  </div>
                  <p className="text-sm font-semibold text-[#1e3a5f]">{p.revenue}</p>
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
