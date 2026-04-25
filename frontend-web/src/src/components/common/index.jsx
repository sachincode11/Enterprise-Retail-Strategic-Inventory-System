// src/components/common/index.jsx
// Shared UI primitives — Navy Blue theme

// ── Button ────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = 'md', onClick, disabled = false, className = '' }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg cursor-pointer transition-all duration-150';
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-3 text-sm' };
  const variants = {
    primary:   'bg-[#1e3a5f] text-white hover:bg-[#16324f] hover:shadow-[0_4px_12px_rgba(30,58,95,0.35)] hover:scale-[1.03]',
    secondary: 'bg-white text-[#0f172a] border border-[#e2e8f0] hover:bg-[#eff6ff] hover:text-[#1e3a5f] hover:border-[#bfdbfe]',
    outline:   'border border-[#e2e8f0] text-[#475569] hover:bg-[#eff6ff] hover:text-[#1e3a5f] hover:border-[#bfdbfe]',
    ghost:     'text-[#475569] hover:text-[#0f172a] hover:bg-black/5',
    danger:    'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────────────────
export function Input({ label, type = 'text', value, onChange, placeholder, readOnly = false, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">{label}</label>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly}
        className={`w-full px-3 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#1e3a5f] focus:bg-white transition-all ${readOnly ? 'text-[#94a3b8] cursor-default' : 'text-[#0f172a]'}`}
      />
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────
const badgeStyles = {
  Active:         'bg-[#dcfce7] text-[#15803d]',
  'In Stock':     'bg-[#dcfce7] text-[#15803d]',
  Connected:      'bg-[#dcfce7] text-[#15803d]',
  Online:         'bg-[#dcfce7] text-[#15803d]',
  Healthy:        'bg-[#dcfce7] text-[#15803d]',
  Paid:           'bg-[#dcfce7] text-[#15803d]',
  Received:       'bg-[#dcfce7] text-[#15803d]',
  'On Shift':     'bg-[#dbeafe] text-[#1d4ed8]',
  Admin:          'bg-[#1e3a5f] text-white',
  Registered:     'bg-[#1e3a5f] text-white',
  Inactive:       'bg-[#f3f4f6] text-[#6b7280]',
  Guest:          'bg-[#f3f4f6] text-[#6b7280]',
  Cashier:        'bg-[#f3f4f6] text-[#374151]',
  Pending:        'bg-[#fef3c7] text-[#92400e]',
  Expired:        'bg-[#f3f4f6] text-[#6b7280]',
  'Low Stock':    'bg-[#fef3c7] text-[#92400e]',
  Break:          'bg-[#fef3c7] text-[#92400e]',
  Refunded:       'bg-[#fee2e2] text-[#991b1b]',
  Voided:         'bg-[#fee2e2] text-[#991b1b]',
  'Out of Stock': 'bg-[#fee2e2] text-[#991b1b]',
};
export function Badge({ status }) {
  const cls = badgeStyles[status] || 'bg-[#f3f4f6] text-[#6b7280]';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{status}</span>;
}

// ── Toggle — Modern smooth slider ──────────────────────────────
export function Toggle({ checked, onChange, on }) {
  const isOn = checked !== undefined ? checked : (on !== undefined ? on : false);
  return (
    <button
      onClick={() => onChange && onChange(!isOn)}
      role="switch"
      aria-checked={isOn}
      style={{
        width: 48,
        height: 26,
        borderRadius: 13,
        background: isOn ? '#1e3a5f' : '#cbd5e1',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.25s cubic-bezier(.4,0,.2,1)',
        flexShrink: 0,
        boxShadow: isOn ? '0 0 0 3px rgba(30,58,95,0.18)' : 'none',
        outline: 'none',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: isOn ? 25 : 3,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: 'white',
          boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
          transition: 'left 0.22s cubic-bezier(.4,0,.2,1)',
          display: 'block',
        }}
      />
    </button>
  );
}

// ── Modal ─────────────────────────────────────────────────────
export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className={`bg-white rounded-xl shadow-2xl w-full ${maxWidth} p-6 fade-in`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[#0f172a]">{title}</h3>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#475569] transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── ConfirmDialog ─────────────────────────────────────────────
export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', danger = true }) {
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-sm text-[#475569] mb-6">{message}</p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

// ── Card ──────────────────────────────────────────────────────
export function Card({ children, className = '' }) {
  return <div className={`bg-white rounded-xl border border-[#e2e8f0] ${className}`}>{children}</div>;
}

// ── Avatar ────────────────────────────────────────────────────
export function Avatar({ initials, size = 'md', color = '#1e3a5f' }) {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' };
  return (
    <div className={`rounded-lg flex items-center justify-center font-semibold text-white flex-shrink-0 ${sizes[size]}`} style={{ background: color }}>
      {initials}
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────
export function StatCard({ label, value, progress, navy = false }) {
  if (navy) {
    return (
      <div className="p-5 flex-1 rounded-xl border border-[#1e3a5f] transition-all duration-200 cursor-default"
        style={{ background: '#1e3a5f' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#16324f'; e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(30,58,95,0.4)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#1e3a5f'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
      >
        <p className="text-[11px] font-mono uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</p>
        <p className="text-2xl font-bold text-white mb-2">{value}</p>
        {progress !== undefined && (
          <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <div className="h-full rounded-full" style={{ width: `${progress}%`, background: 'rgba(255,255,255,0.8)' }} />
          </div>
        )}
      </div>
    );
  }
  return (
    <Card className="p-5 flex-1 transition-all duration-200 cursor-default hover:shadow-[0_8px_24px_rgba(30,58,95,0.12)] hover:-translate-y-0.5">
      <p className="text-[11px] text-[#94a3b8] font-mono uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-bold text-[#0f172a] mb-2">{value}</p>
      {progress !== undefined && (
        <div className="h-1.5 bg-[#e2e8f0] rounded-full">
          <div className="h-full bg-[#1e3a5f] rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
    </Card>
  );
}

// ── SectionCard ───────────────────────────────────────────────
export function SectionCard({ title, badge, headerRight, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border overflow-hidden transition-all duration-200 hover:shadow-[0_6px_20px_rgba(30,58,95,0.08)] ${className}`} style={{ borderColor: '#e2e8f0' }}>
      {(title || headerRight) && (
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#e2e8f0' }}>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#0f172a]">{title}</h3>
            {badge && <span className="text-xs px-2 py-0.5 bg-[#1e3a5f] text-white rounded font-mono">{badge}</span>}
          </div>
          {headerRight}
        </div>
      )}
      {children}
    </div>
  );
}

// ── PageHeader ────────────────────────────────────────────────
export function PageHeader({ breadcrumb, title, actions }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        {breadcrumb && <p className="text-xs mb-0.5 text-[#94a3b8]">{breadcrumb}</p>}
        <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────
export function Pagination({ current = 1, total = 1, label = '', onPage, onPrev, onNext }) {
  const goPrev = onPrev || (() => onPage && onPage(Math.max(1, current - 1)));
  const goNext = onNext || (() => onPage && onPage(Math.min(total, current + 1)));
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: '#e2e8f0' }}>
      <span className="text-xs text-[#94a3b8]">{label}</span>
      <div className="flex items-center gap-1">
        <button onClick={goPrev} disabled={current <= 1}
          className="w-7 h-7 rounded border flex items-center justify-center text-xs transition-all hover:bg-[#eff6ff] disabled:opacity-40"
          style={{ borderColor: '#e2e8f0', color: '#475569' }}>‹</button>
        {Array.from({ length: Math.min(total, 5) }, (_, i) => i + 1).map(p => (
          <button key={p} onClick={() => onPage && onPage(p)}
            className="w-7 h-7 rounded border flex items-center justify-center text-xs transition-all"
            style={{ borderColor: p === current ? '#1e3a5f' : '#e2e8f0', background: p === current ? '#1e3a5f' : 'white', color: p === current ? 'white' : '#475569' }}
          >{p}</button>
        ))}
        <button onClick={goNext} disabled={current >= total}
          className="w-7 h-7 rounded border flex items-center justify-center text-xs transition-all hover:bg-[#eff6ff] disabled:opacity-40"
          style={{ borderColor: '#e2e8f0', color: '#475569' }}>›</button>
      </div>
    </div>
  );
}

// ── ProgressRow ───────────────────────────────────────────────
export function ProgressRow({ name, revenue, pct }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs font-medium text-[#0f172a]">{name}</span>
        <span className="text-xs text-[#1e3a5f]">{revenue}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── BarChart ──────────────────────────────────────────────────
export function BarChart({ data = [], height = 120 }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value || 0));
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-end gap-2" style={{ height: height + 24, minWidth: data.length * 44 }}>
        {data.map((d, i) => {
          const barH = max > 0 ? Math.max(4, (d.value / max) * height) : 4;
          return (
            <div key={i} className="flex flex-col items-center flex-1 gap-1">
              <div
                className="w-full rounded-t-sm chart-bar"
                style={{ height: barH, background: '#1e3a5f', animationDelay: `${i * 0.05}s` }}
                title={`${d.label || d.month}: ${d.value?.toLocaleString()}`}
              />
              <span className="text-[9px] text-[#94a3b8] whitespace-nowrap">{d.label || d.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── LoadingSpinner ────────────────────────────────────────────
export function LoadingSpinner({ size = 20 }) {
  return (
    <div className="flex items-center justify-center p-8">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" strokeWidth="2"
        style={{ animation: 'spin 0.8s linear infinite' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────
export function EmptyState({ message = 'No items found', action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" className="mb-3">
        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
      </svg>
      <p className="text-sm text-[#94a3b8]">{message}</p>
      {actionLabel && <button onClick={action} className="mt-3 text-xs text-[#1e3a5f] hover:underline">{actionLabel}</button>}
    </div>
  );
}

// ── SectionHeader ─────────────────────────────────────────────
export function SectionHeader({ title, action, actionLabel }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-semibold text-[#0f172a] text-sm">{title}</h2>
      {actionLabel && (
        <button onClick={action} className="text-xs text-[#94a3b8] hover:text-[#1e3a5f] transition-colors">
          {actionLabel} →
        </button>
      )}
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────
export function Toast({ message, type = 'success', visible }) {
  if (!visible) return null;
  const bg = type === 'success' ? '#dcfce7' : type === 'error' ? '#fee2e2' : '#eff6ff';
  const color = type === 'success' ? '#15803d' : type === 'error' ? '#991b1b' : '#1e3a5f';
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg fade-in"
      style={{ background: bg, color }}>
      {message}
    </div>
  );
}
