// src/pages/admin/Notifications.jsx — IMPROVED: live low-stock alerts injected from AppContext
import { useState, useMemo } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Button } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { useApp } from '../../context/AppContext';

const typeStyles = {
  warning:  { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b', label: 'Warning'  },
  info:     { bg: '#dbeafe', text: '#1e40af', dot: '#3b82f6', label: 'Info'     },
  success:  { bg: '#dcfce7', text: '#15803d', dot: '#22c55e', label: 'Success'  },
  critical: { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444', label: 'Critical' },
};

const STATIC_NOTIFS = [
  { id: 3,  type: 'info',    title: 'New Purchase Order',     message: 'PO-2026-041 placed with Agro Fresh Pvt. Ltd. Expected: 12 Apr 2026.',  time: '1 hr ago',   read: false, page: 'purchase-orders' },
  { id: 4,  type: 'success', title: 'Daily Backup Completed', message: 'Automatic database backup for 12 Apr 2026 completed successfully.',     time: '2 hr ago',   read: true,  page: null              },
  { id: 5,  type: 'info',    title: 'New Staff Added',        message: 'Roshan KC has been added as Cashier at KTM-001.',                        time: '3 hr ago',   read: true,  page: 'staff'           },
  { id: 6,  type: 'critical',title: 'Failed Login Attempt',   message: '3 failed PIN attempts by Kasim Rijal — account temporarily locked.',    time: '4 hr ago',   read: true,  page: 'staff'           },
  { id: 7,  type: 'info',    title: 'AI Forecast Ready',      message: 'New 7-day sales forecast is available. Projected: Rs 5.77L.',            time: 'Yesterday',  read: true,  page: 'ai'              },
  { id: 8,  type: 'success', title: 'Discount Redeemed',      message: 'SUMMER20 was used 12 times today. Total savings applied: Rs 2,400.',     time: 'Yesterday',  read: true,  page: 'discounts'       },
  { id: 9,  type: 'warning', title: 'Refund Processed',       message: 'TXN-0039 was refunded Rs 450 by Priya K. Reason: Damaged item.',         time: 'Yesterday',  read: true,  page: 'transactions'    },
  { id: 10, type: 'info',    title: 'Monthly Report Ready',   message: 'March 2026 analytics report is ready to download.',                      time: '2 days ago', read: true,  page: 'reports'         },
];

export default function Notifications() {
  const { setCurrentPage } = useAdmin();
  const { products }       = useApp();

  // Generate live low-stock notifications from AppContext products
  const liveAlerts = useMemo(() =>
    products
      .filter(p => p.status === 'Low Stock' || p.status === 'Out of Stock')
      .map((p, i) => ({
        id:      `live-${p.id}`,
        type:    p.status === 'Out of Stock' ? 'critical' : 'warning',
        title:   p.status === 'Out of Stock' ? 'Out of Stock' : 'Low Stock Alert',
        message: p.status === 'Out of Stock'
          ? `${p.name} (${p.sku}) is out of stock. Last restocked: unknown.`
          : `${p.name} (${p.sku}) has only ${p.stock} units left. Reorder threshold exceeded.`,
        time:    'Just now',
        read:    false,
        page:    'inventory',
      })),
    [products]
  );

  const allNotifs = [...liveAlerts, ...STATIC_NOTIFS];
  const [readSet, setReadSet] = useState(new Set(allNotifs.filter(n => n.read).map(n => n.id)));

  const isRead    = (id) => readSet.has(id);
  const markRead  = (id) => setReadSet(prev => new Set([...prev, id]));
  const markAllRead = () => setReadSet(new Set(allNotifs.map(n => n.id)));
  const unreadCount = allNotifs.filter(n => !isRead(n.id)).length;

  return (
    <AdminLayout>
      <PageHeader
        breadcrumb="System Alerts"
        title="Notifications"
        actions={
          <>
            {unreadCount > 0 && (
              <Button variant="secondary" onClick={markAllRead}>Mark All Read</Button>
            )}
            <Button variant="secondary" onClick={() => setCurrentPage('S5')}>Alert Settings</Button>
          </>
        }
      />

      <div className="flex items-center gap-3 mb-5">
        <span className="text-sm font-semibold text-[#0f172a]">{unreadCount} unread</span>
        <span className="text-sm text-[#94a3b8]">·</span>
        <span className="text-sm text-[#94a3b8]">{allNotifs.length} total</span>
      </div>

      <div className="space-y-2">
        {allNotifs.map(n => {
          const style   = typeStyles[n.type] || typeStyles.info;
          const read    = isRead(n.id);
          return (
            <div
              key={n.id}
              onClick={() => markRead(n.id)}
              className="bg-white rounded-xl border p-4 flex items-start gap-4 cursor-pointer transition-all hover:shadow-sm"
              style={{ borderColor: read ? '#e2e8f0' : style.dot, opacity: read ? 0.75 : 1 }}
            >
              {/* Type dot */}
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: style.bg }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: style.dot }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#0f172a]">{n.title}</p>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: style.bg, color: style.text }}>
                      {style.label}
                    </span>
                    {!read && <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />}
                  </div>
                  <span className="text-xs text-[#94a3b8] whitespace-nowrap">{n.time}</span>
                </div>
                <p className="text-xs text-[#475569] mt-1 leading-relaxed">{n.message}</p>
                {n.page && (
                  <button
                    onClick={e => { e.stopPropagation(); markRead(n.id); setCurrentPage(n.page); }}
                    className="text-xs font-medium mt-2 hover:underline"
                    style={{ color: '#1e3a5f' }}
                  >
                    View →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
