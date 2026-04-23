// src/pages/admin/Notifications.jsx
import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Button } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';

const initialNotifs = [
  { id: 1, type: 'warning',  title: 'Low Stock Alert',          message: 'Tata Salt 1kg has only 2 units remaining. Reorder threshold is 15.',      time: '5 min ago',  read: false, page: 'inventory'        },
  { id: 2, type: 'warning',  title: 'Low Stock Alert',          message: 'Surf Excel 500g is out of stock. Last restocked on 8 Feb.',                 time: '12 min ago', read: false, page: 'inventory'        },
  { id: 3, type: 'info',     title: 'New Purchase Order',       message: 'PO-2026-041 placed with Agro Fresh Pvt. Ltd. Expected: 12 Apr 2026.',       time: '1 hr ago',   read: false, page: 'purchase-orders'  },
  { id: 4, type: 'success',  title: 'Daily Backup Completed',   message: 'Automatic database backup for 12 Apr 2026 completed successfully.',         time: '2 hr ago',   read: true,  page: null               },
  { id: 5, type: 'info',     title: 'New Staff Added',          message: 'Roshan KC has been added as Cashier at KTM-001.',                           time: '3 hr ago',   read: true,  page: 'staff'            },
  { id: 6, type: 'critical', title: 'Failed Login Attempt',     message: '3 failed PIN attempts by Kasim Rijal — account temporarily locked.',       time: '4 hr ago',   read: true,  page: 'staff'            },
  { id: 7, type: 'info',     title: 'AI Forecast Ready',        message: 'New 7-day sales forecast is available. Projected: Rs 5.77L.',               time: 'Yesterday',  read: true,  page: 'ai'               },
  { id: 8, type: 'success',  title: 'Discount Redeemed',        message: 'SUMMER20 was used 12 times today. Total savings applied: Rs 2,400.',        time: 'Yesterday',  read: true,  page: 'discounts'        },
  { id: 9, type: 'warning',  title: 'Refund Processed',         message: 'TXN-0039 was refunded Rs 450 by Priya K. Reason: Damaged item.',            time: 'Yesterday',  read: true,  page: 'transactions'     },
  { id: 10,type: 'info',     title: 'Monthly Report Ready',     message: 'March 2026 analytics report is ready to download.',                         time: '2 days ago', read: true,  page: 'reports'          },
];

const typeStyles = {
  warning:  { bg: '#fef3c7', border: '#fcd34d', icon: '⚠', dot: '#f59e0b' },
  critical: { bg: '#fee2e2', border: '#fca5a5', icon: '🔴', dot: '#ef4444' },
  info:     { bg: '#eff6ff', border: '#bfdbfe', icon: 'ℹ',  dot: '#3b82f6' },
  success:  { bg: '#dcfce7', border: '#86efac', icon: '✓',  dot: '#22c55e' },
};

export default function Notifications() {
  const { setCurrentPage } = useAdmin();
  const [items,  setItems]  = useState(initialNotifs);
  const [filter, setFilter] = useState('All');

  const unreadCount = items.filter(n => !n.read).length;
  const markAllRead = () => setItems(prev => prev.map(n => ({ ...n, read: true })));
  const markRead    = (id) => setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const dismiss     = (id) => setItems(prev => prev.filter(n => n.id !== id));

  const filtered = filter === 'All'    ? items
    : filter === 'Unread'              ? items.filter(n => !n.read)
    : items.filter(n => n.type === filter.toLowerCase());

  return (
    <AdminLayout>
      <PageHeader
        breadcrumb="System Alerts & Updates"
        title={
          <span className="flex items-center gap-3">
            Notifications
            {unreadCount > 0 && <span className="text-sm px-2.5 py-0.5 rounded-full font-semibold" style={{ background: '#1e3a5f', color: '#fff' }}>{unreadCount} new</span>}
          </span>
        }
        actions={
          <>
            <Button variant="secondary" onClick={markAllRead}>Mark All Read</Button>
            <Button variant="outline" onClick={() => setCurrentPage('S5')}>Settings</Button>
          </>
        }
      />
      <div className="flex items-center gap-2 mb-5">
        {['All','Unread','Warning','Critical','Info','Success'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={filter === f ? { background: '#1e3a5f', color: '#fff' } : { background: '#fff', border: '1px solid #e2e8f0', color: '#475569' }}
          >
            {f}
            {f === 'Unread' && unreadCount > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]" style={{ background: '#f59e0b', color: '#fff' }}>{unreadCount}</span>}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border p-10 text-center" style={{ borderColor: '#e2e8f0' }}>
            <p className="text-[#94a3b8] text-sm">No notifications in this category.</p>
          </div>
        )}
        {filtered.map(n => {
          const style = typeStyles[n.type] || typeStyles.info;
          return (
            <div key={n.id} className="bg-white rounded-xl border flex items-start gap-4 px-5 py-4 transition-all hover:shadow-md"
              style={{ borderColor: n.read ? '#e2e8f0' : style.border, borderLeftWidth: 3, borderLeftColor: style.dot }}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 mt-0.5" style={{ background: style.bg }}>
                <span>{style.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-sm font-semibold text-[#0f172a]">{n.title}</span>
                    {!n.read && <span className="ml-2 w-1.5 h-1.5 rounded-full inline-block align-middle" style={{ background: style.dot }} />}
                  </div>
                  <span className="text-xs text-[#94a3b8] flex-shrink-0">{n.time}</span>
                </div>
                <p className="text-sm text-[#475569] mt-0.5">{n.message}</p>
                <div className="flex items-center gap-3 mt-2">
                  {n.page && <button onClick={() => { markRead(n.id); setCurrentPage(n.page); }} className="text-xs font-medium hover:underline" style={{ color: '#1e3a5f' }}>View →</button>}
                  {!n.read && <button onClick={() => markRead(n.id)} className="text-xs text-[#94a3b8] hover:text-[#475569] transition-colors">Mark as read</button>}
                  <button onClick={() => dismiss(n.id)} className="text-xs text-[#94a3b8] hover:text-red-500 transition-colors">Dismiss</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
