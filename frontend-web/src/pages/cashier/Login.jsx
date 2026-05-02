// src/pages/cashier/Login.jsx
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCashier } from '../../context/CashierContext';
import { lsGet, lsSet } from '../../utils/storage';
import logo from '../../assets/Full logo.png';

const FEATURES = [
  { label: 'Fast Billing' },
  { label: 'Multi-Payment Support' },
  { label: 'Live Inventory View' },
];

export default function Login() {
  const { login, loading } = useAuth();
  const { currentPage, setCurrentPage, setPostAuthPage } = useCashier();
  const [email, setEmail] = useState(() => lsGet('invosix_remember_cashier_email', ''));
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(!!lsGet('invosix_remember_cashier_email', ''));
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    try {
      const user = await login({ email, password, expectedRole: 'cashier' });
      if (user.role !== 'cashier') { setError('This terminal is for cashier accounts only.'); return; }
      
      // Handle Remember Me
      if (remember) {
        lsSet('invosix_remember_cashier_email', email);
      } else {
        localStorage.removeItem('invosix_remember_cashier_email');
      }

      setPostAuthPage(currentPage === 'verification' ? 'dashboard' : currentPage || 'dashboard');
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
      <div className="w-[420px] bg-white flex flex-col justify-center px-12 relative">
        <button onClick={() => window.location.hash = ''} 
          className="absolute top-8 left-8 flex items-center gap-2 text-xs font-medium text-[#94a3b8] hover:text-[#1e3a5f] transition-colors group">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-hover:-translate-x-0.5">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>

        <p className="text-[#94a3b8] text-sm mb-1 mt-8">Welcome back</p>
        <h1 className="text-2xl font-bold text-[#0f172a] mb-7">Sign In</h1>
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium" style={{ background: '#eff6ff', color: '#1e3a5f', border: '1px solid #bfdbfe' }}>
            <span className="w-2 h-2 rounded-full bg-[#1e3a5f]" />Cashier
          </div>
        </div>
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>{String(error)}</div>
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
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full px-4 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none text-[#0f172a] transition-all focus:border-[#1e3a5f] focus:shadow-[0_0_0_3px_rgba(30,58,95,0.1)] pr-10"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#1e3a5f] transition-colors"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="w-4 h-4 rounded" style={{ accentColor: '#1e3a5f' }} />
            <span className="text-sm text-[#475569]">Remember this device</span>
          </label>
        </div>
        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-4 rounded-xl font-bold text-sm text-white mb-8 transition-all duration-200 hover:bg-[#16324f] hover:shadow-xl disabled:opacity-60 shadow-lg shadow-blue-900/20"
          style={{ background: '#1e3a5f' }}
        >{loading ? 'Signing in…' : 'Sign In to Terminal'}</button>
      </div>
    </div>
  );
}

function EyeIcon()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
function EyeOffIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 011.82-3.35M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>; }
