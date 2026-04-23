// src/pages/cashier/Login.jsx
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCashier } from '../../context/CashierContext';
import logo from '../../assets/Full logo.png';

const FEATURES = [
  { label: 'Fast Billing' },
  { label: 'Multi-Payment Support' },
  { label: 'Live Inventory View' },
];

export default function Login() {
  const { login, loading } = useAuth();
  const { setCurrentPage } = useCashier();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    try {
      const user = await login({ email, password });
      if (user.role !== 'cashier') { setError('This terminal is for cashier accounts only.'); return; }
      setCurrentPage('verification');
    } catch (err) {
      setError(err?.message || 'Invalid email or password.');
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex flex-col items-center justify-center" style={{ background: '#0f172a' }}>
        <div className="text-center">
          <img src={logo} alt="Logo" className="w-48 h-auto mx-auto mb-6" />
          <p className="text-xs tracking-[0.25em] uppercase mt-3 font-mono" style={{ color: '#475569' }}>POS Cashier Terminal</p>
          <div className="mt-10 space-y-3 text-left max-w-xs mx-auto">
            {FEATURES.map(f => (
              <div key={f.label} className="flex items-center gap-3 px-4 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#1e3a5f]" />
                <span className="text-sm" style={{ color: '#94a3b8' }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="w-[420px] bg-white flex flex-col justify-center px-12">
        <p className="text-[#94a3b8] text-sm mb-1">Welcome back</p>
        <h1 className="text-2xl font-bold text-[#0f172a] mb-7">Sign In</h1>
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium" style={{ background: '#eff6ff', color: '#1e3a5f', border: '1px solid #bfdbfe' }}>
            <span className="w-2 h-2 rounded-full bg-[#1e3a5f]" />Cashier
          </div>
        </div>
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>{error}</div>
        )}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Email Address</label>
          <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
            placeholder="kasim@store.np"
            className="w-full px-4 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none text-[#0f172a] transition-all focus:border-[#1e3a5f] focus:shadow-[0_0_0_3px_rgba(30,58,95,0.1)]"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Password</label>
          <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
            placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full px-4 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none text-[#0f172a] transition-all focus:border-[#1e3a5f] focus:shadow-[0_0_0_3px_rgba(30,58,95,0.1)]"
          />
        </div>
        <div className="flex items-center justify-between mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="w-4 h-4 rounded" style={{ accentColor: '#1e3a5f' }} />
            <span className="text-sm text-[#475569]">Remember this device</span>
          </label>
        </div>
        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-3 rounded-lg font-semibold text-sm text-white mb-6 transition-all hover:bg-[#16324f] hover:shadow-[0_4px_12px_rgba(30,58,95,0.35)] disabled:opacity-60"
          style={{ background: '#1e3a5f' }}
        >{loading ? 'Signing in…' : 'Sign In to Terminal'}</button>
        <p className="text-center text-xs text-[#94a3b8] mb-3">
          Use: <span className="font-mono text-[#1e3a5f]">kasim@store.np</span> / <span className="font-mono text-[#1e3a5f]">cashier123</span>
        </p>
        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-4 flex items-start gap-3">
          <div className="w-6 h-6 border border-[#bfdbfe] rounded flex items-center justify-center shrink-0 mt-0.5" style={{ background: '#eff6ff' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
          </div>
          <div>
            <p className="text-xs font-medium text-[#0f172a] mb-0.5">Email OTP Required</p>
            <p className="text-xs text-[#94a3b8] leading-relaxed">A 6-digit code will be sent to your registered email address.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
