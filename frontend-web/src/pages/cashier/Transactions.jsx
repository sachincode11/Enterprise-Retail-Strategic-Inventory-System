// src/pages/cashier/Transactions.jsx
import { useState } from 'react';
import CashierLayout from '../../layouts/CashierLayout';
import { Badge } from '../../components/common';

const TRANSACTIONS = [
  { id:'#TXN-0091', customer:'Rohan Sharma',   phone:'+977-9841-234567', date:'22 Mar', time:'14:48', items:4, payment:'Cash',   amount:1416, status:'Paid'     },
  { id:'#TXN-0090', customer:'Walk-in',         phone:'Guest',           date:'22 Mar', time:'14:32', items:6, payment:'Cash',   amount:1240, status:'Paid'     },
  { id:'#TXN-0089', customer:'Priya Shrestha',  phone:null,              date:'22 Mar', time:'14:18', items:3, payment:'Wallet', amount:870,  status:'Paid'     },
  { id:'#TXN-0088', customer:'Anish Gurung',    phone:null,              date:'22 Mar', time:'13:55', items:8, payment:'Card',   amount:3400, status:'Refunded' },
  { id:'#TXN-0087', customer:'Walk-in',         phone:'Guest',           date:'22 Mar', time:'13:41', items:2, payment:'Cash',   amount:560,  status:'Paid'     },
  { id:'#TXN-0086', customer:'Sunita KC',       phone:null,              date:'22 Mar', time:'13:20', items:5, payment:'Wallet', amount:2180, status:'Pending'  },
];

export default function Transactions() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = TRANSACTIONS.filter(t => {
    const matchSearch = t.customer.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const total = filtered.reduce((s, t) => s + (t.status !== 'Refunded' ? t.amount : 0), 0);

  return (
    <CashierLayout>
      <div className="p-8">
        <div className="mb-6">
          <p className="text-xs text-[#94a3b8] font-mono mb-1">All Transactions</p>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#0f172a]">Transaction History</h1>
            <button className="flex items-center gap-2 px-4 py-2 border border-[#e2e8f0] rounded-lg text-sm text-[#475569] hover:border-[#bfdbfe] transition-colors bg-white">↓ Export CSV</button>
          </div>
        </div>

        {/* Summary pills */}
        <div className="flex gap-3 mb-5">
          {[
            { label:'Total Transactions', value: TRANSACTIONS.length },
            { label:'Paid',               value: TRANSACTIONS.filter(t=>t.status==='Paid').length },
            { label:'Revenue',            value: `Rs ${total.toLocaleString()}` },
            { label:'Refunded',           value: TRANSACTIONS.filter(t=>t.status==='Refunded').length },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border px-5 py-3 flex-1" style={{borderColor:'#e2e8f0'}}>
              <p className="text-[10px] text-[#94a3b8] font-mono uppercase">{s.label}</p>
              <p className="text-xl font-bold text-[#0f172a]">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer or ID..."
            className="flex-1 px-4 py-2 text-sm bg-white border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f] transition-colors" />
          <input type="date" className="px-3 py-2 text-sm bg-white border border-[#e2e8f0] rounded-lg outline-none text-[#94a3b8]" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-[#e2e8f0] rounded-lg outline-none text-[#94a3b8]">
            <option value="">All Status</option>
            <option>Paid</option><option>Refunded</option><option>Pending</option>
          </select>
          <button onClick={() => { setSearch(''); setStatusFilter(''); }} className="px-4 py-2 text-sm border border-[#e2e8f0] bg-white rounded-lg text-[#475569] hover:border-[#bfdbfe] transition-colors">Reset</button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                {['TXN ID','Customer','Date & Time','Items','Payment','Amount','Status',''].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((txn, i) => (
                <tr key={i}>
                  <td><span className="mono text-xs font-medium">{txn.id}</span></td>
                  <td>
                    <p className="text-sm font-medium text-[#0f172a]">{txn.customer}</p>
                    {txn.phone && txn.phone !== 'Guest' && <p className="text-xs text-[#94a3b8]">{txn.phone}</p>}
                  </td>
                  <td className="text-sm text-[#475569]">{txn.date} · {txn.time}</td>
                  <td className="text-sm">{txn.items}</td>
                  <td className="text-sm">{txn.payment}</td>
                  <td className="text-sm font-bold text-[#0f172a]">Rs {txn.amount.toLocaleString()}</td>
                  <td><Badge status={txn.status} /></td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn-outline text-xs">Receipt</button>
                      {txn.status === 'Paid' && <button className="btn-outline text-xs">Refund</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </CashierLayout>
  );
}
