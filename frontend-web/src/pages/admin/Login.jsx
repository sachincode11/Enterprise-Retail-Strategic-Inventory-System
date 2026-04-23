// src/pages/admin/Login.jsx
import { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import logo from '../../assets/Full logo.png';

const VALID_EMAIL    = 'admin123@gmail.com';
const VALID_PASSWORD = 'admin@123';

export default function Login() {
  const { setCurrentPage } = useAdmin();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = () => {
    setError('');
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    if (email !== VALID_EMAIL || password !== VALID_PASSWORD) { setError('Wrong password, try again.'); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setCurrentPage('verification'); }, 600);
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex flex-col items-center justify-center" style={{ background: '#0f172a' }}>
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <img src={logo} alt="Logo" className="w-48 h-auto" />
          </div>
          <p className="text-xs tracking-[0.25em] uppercase mt-3 font-mono" style={{ color: '#475569' }}>Your Trusted Billing Partner</p>
          <div className="mt-10 space-y-3 text-left max-w-xs mx-auto">
            {[{ icon: '📊', label: 'Real-time Analytics' }, { icon: '🔒', label: 'Secure & Encrypted' }, { icon: '⚡', label: 'Lightning Fast POS' }].map(f => (
              <div key={f.label} className="flex items-center gap-3 px-4 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <span>{f.icon}</span>
                <span className="text-sm" style={{ color: '#94a3b8' }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-[420px] bg-white flex flex-col justify-center px-12">
        <div>
          <p className="text-[#94a3b8] text-sm mb-1">Welcome back</p>
          <h1 className="text-2xl font-bold text-[#0f172a] mb-7">Sign In</h1>
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium" style={{ background: '#eff6ff', color: '#1e3a5f', border: '1px solid #bfdbfe' }}>
              <span className="w-2 h-2 rounded-full bg-[#1e3a5f]" />Admin
            </div>
          </div>
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>⚠ {error}</div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Email Address</label>
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} placeholder="admin123@gmail.com"
              className="w-full px-4 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none text-[#0f172a] transition-all"
              onFocus={e => { e.target.style.borderColor = '#1e3a5f'; e.target.style.boxShadow = '0 0 0 3px rgba(30,58,95,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} placeholder="••••••••"
              className="w-full px-4 py-2.5 text-sm bg-[#f8fafc] border border-[#e2e8f0] rounded-lg outline-none text-[#0f172a] transition-all"
              onFocus={e => { e.target.style.borderColor = '#1e3a5f'; e.target.style.boxShadow = '0 0 0 3px rgba(30,58,95,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="w-4 h-4 rounded" style={{ accentColor: '#1e3a5f' }} />
              <span className="text-sm text-[#475569]">Remember this device</span>
            </label>
            <button className="text-sm text-[#94a3b8] hover:text-[#1e3a5f] transition-colors">Forgot password?</button>
          </div>
          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-sm text-white mb-6 transition-all duration-150"
            style={{ background: '#1e3a5f' }}
            onMouseEnter={e => { if (!loading) { e.target.style.background = '#16324f'; e.target.style.boxShadow = '0 4px 12px rgba(30,58,95,0.35)'; }}}
            onMouseLeave={e => { e.target.style.background = '#1e3a5f'; e.target.style.boxShadow = ''; }}
          >
            {loading ? 'Signing in…' : 'Sign In to Terminal'}
          </button>
          <div className="text-center mb-3">
            <span className="text-[10px] text-[#94a3b8] font-mono tracking-widest uppercase">2FA Verification</span>
          </div>
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-4 flex items-start gap-3">
            <div className="w-6 h-6 border border-[#bfdbfe] rounded flex items-center justify-center shrink-0 mt-0.5" style={{ background: '#eff6ff' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
            </div>
            <div>
              <p className="text-xs font-medium text-[#0f172a] mb-0.5">Email OTP Required</p>
              <p className="text-xs text-[#94a3b8] leading-relaxed">A 6-digit code will be sent to your registered email address before terminal access is granted.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
