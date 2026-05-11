// src/pages/cashier/Profile.jsx — IMPROVED: Read-only profile, functional Recent Activity
import { useEffect, useState } from 'react';
import CashierLayout from '../../layouts/CashierLayout';
import { useAuth } from '../../context/AuthContext';
import { getTransactions } from '../../services/transactionService';
import { LoadingSpinner } from '../../components/common';

export default function Profile() {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadActivity() {
      try {
        const res = await getTransactions();
        // Filter by current cashier and sort by date desc
        const myTxns = (res.data || [])
          .filter(t => t.backendId && t.cashier.includes(String(user?.id || '')))
          .sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate))
          .slice(0, 5); // Show last 5
        
        setActivities(myTxns);
      } catch (err) {
        console.error("Failed to load activity", err);
      } finally {
        setLoading(false);
      }
    }
    loadActivity();
  }, [user]);

  const displayName  = user?.name || 'Cashier';
  const displayEmail = user?.email || '';
  const initials     = user?.initials || 'U';

  return (
    <CashierLayout>
      <div className="p-8 max-w-[900px]">
        <div className="mb-6">
          <p className="text-xs text-[#94a3b8] font-mono mb-1">Account</p>
          <h1 className="text-2xl font-bold text-[#0f172a]">My Profile</h1>
        </div>

        {/* Hero */}
        <div className="rounded-xl p-6 mb-5 flex items-center gap-5" style={{ background: '#0f172a' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ background: '#1e3a5f' }}>
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{displayName}</h2>
            <p className="text-sm mt-0.5" style={{ color: '#94a3b8' }}>Cashier · {user?.store || 'Default Store'}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)', color: '#cbd5e1' }}>Role: Cashier</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                <span className="text-xs text-[#94a3b8]">Active Account</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Personal info */}
          <div className="md:col-span-1 space-y-5">
            <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
              <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>Personal Information</h3>
              <div className="space-y-4">
                {[
                  { label: 'Full Name',  value: displayName },
                  { label: 'Email',      value: displayEmail },
                  { label: 'Phone',      value: user?.phone || 'Not provided' },
                  { label: 'Store',      value: user?.store || 'Assigned Store' },
                ].map(f => (
                  <div key={f.label}>
                    <p className="text-[10px] text-[#94a3b8] uppercase font-mono tracking-wider mb-1">{f.label}</p>
                    <p className="text-sm font-medium text-[#0f172a]">{f.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t" style={{ borderColor: '#e2e8f0' }}>
                <p className="text-[10px] text-[#94a3b8] leading-relaxed italic">
                  * Profile updates are managed by your Store Administrator. Contact them to change your details.
                </p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl border p-5 h-full" style={{ borderColor: '#e2e8f0' }}>
              <div className="flex items-center justify-between mb-6 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>
                <h3 className="text-sm font-semibold text-[#0f172a]">Recent Activity</h3>
                <span className="text-[10px] bg-[#f1f5f9] text-[#1e3a5f] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Last 5 Sales</span>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <LoadingSpinner size={20} />
                  <p className="text-xs text-[#94a3b8]">Syncing transaction history...</p>
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((txn) => (
                    <div key={txn.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-[#f8fafc] transition-colors border border-transparent hover:border-[#e2e8f0]">
                      <div className="w-8 h-8 rounded-full bg-[#eff6ff] flex items-center justify-center flex-shrink-0 text-[#1e3a5f]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-[#0f172a]">Sale {txn.id}</p>
                          <span className="text-xs font-bold text-[#1e3a5f]">{txn.amount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-[#94a3b8]">Customer: {txn.customer}</p>
                          <p className="text-[10px] font-mono text-[#94a3b8]">{txn.datetime}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 bg-[#f8fafc] rounded-full flex items-center justify-center mb-3">
                    <svg className="text-[#cbd5e1]" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                  </div>
                  <p className="text-sm font-medium text-[#475569]">No recent transactions</p>
                  <p className="text-xs text-[#94a3b8] mt-1">Start processing sales to see them here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </CashierLayout>
  );
}
