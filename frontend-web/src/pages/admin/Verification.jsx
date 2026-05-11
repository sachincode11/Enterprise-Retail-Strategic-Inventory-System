// src/pages/admin/Verification.jsx
import { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/Full logo.png';

export default function Verification() {
  const { setCurrentPage } = useAdmin();
  const { user, verifyOtp, resendOtp, logout, loading } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [logout]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  function handleChange(i, val) {
    if (val.length > 1 || !/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val; setOtp(next);
    if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  }
  function handleKeyDown(i, e) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) document.getElementById(`otp-${i - 1}`)?.focus();
  }

  async function handleVerify() {
    setError('');
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }
    try {
      const verifiedUser = await verifyOtp({ otp: code });
      if (verifiedUser.role !== 'admin') {
        setError('This terminal is for admin accounts only.');
        return;
      }
      setCurrentPage('dashboard');
    } catch (err) {
      setError(err?.message || 'OTP verification failed.');
    }
  }

  async function handleResend() {
    setError('');
    setSuccessMsg('');
    try {
      await resendOtp();
      setSuccessMsg('A new OTP has been sent to your email.');
      setTimeLeft(300); // Reset the timer
      setOtp(['', '', '', '', '', '']); // Clear the inputs
    } catch (err) {
      setError(err?.message || 'Failed to resend OTP.');
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0f172a' }}>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <img src={logo} alt="Logo" className="w-48 h-auto" />
          <p className="text-sm tracking-[0.2em] uppercase mt-3 font-mono" style={{ color: '#475569' }}>Your Trusted Billing Partner</p>
        </div>
      </div>
      <div className="flex flex-col justify-center px-16" style={{ width: '460px', background: '#ffffff', minHeight: '100vh' }}>
        <div className="w-full max-w-sm mx-auto">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-6" style={{ background: '#eff6ff' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#1e3a5f" strokeWidth="1.5">
              <path d="M16 8V6a6 6 0 10-12 0v2" strokeLinecap="round"/>
              <rect x="2" y="8" width="16" height="11" rx="2"/>
              <circle cx="10" cy="14" r="1.5" fill="#1e3a5f"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold mb-2 text-[#0f172a]">Verify Your Identity</h1>
          <p className="text-sm mb-8 text-[#94a3b8]">A 6-digit code was sent to <strong className="text-[#0f172a]">{user?.email || 'your email'}</strong></p>
          <div className="flex gap-3 mb-6">
            {otp.map((val, i) => (
              <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={val}
                onChange={e => handleChange(i, e.target.value)} onKeyDown={e => handleKeyDown(i, e)}
                className="w-full text-center text-xl font-semibold rounded-xl border-2 py-3 outline-none transition-all text-[#0f172a]"
                style={{ borderColor: val ? '#1e3a5f' : '#e2e8f0', background: val ? '#eff6ff' : '#ffffff', boxShadow: val ? '0 0 0 3px rgba(30,58,95,0.1)' : 'none' }}
              />
            ))}
          </div>
          {error && <p className="text-xs text-[#dc2626] mb-3 text-center">{error}</p>}
          {successMsg && <p className="text-xs text-[#22c55e] mb-3 text-center">{successMsg}</p>}
          <p className="text-xs text-[#94a3b8] mb-4 text-center">
            {user?.debugOtp ? `Dev OTP code: ${user.debugOtp}` : 'Enter the 6-digit OTP from your email'}
          </p>
          <button onClick={handleVerify} disabled={loading}
            className="w-full py-3 rounded-lg text-sm font-semibold text-white mb-4 transition-all duration-150 hover:bg-[#16324f] hover:shadow-[0_4px_12px_rgba(30,58,95,0.35)]"
            style={{ background: '#1e3a5f' }}
          >{loading ? 'Verifying…' : 'Verify & Continue'}</button>
          <div className="flex justify-between mb-8">
            <button className="text-xs text-[#94a3b8] hover:text-[#475569] transition-colors">Didn't receive code?</button>
            <button onClick={handleResend} disabled={loading} className="text-xs font-medium text-[#1e3a5f] hover:text-[#16324f] transition-colors disabled:opacity-50">Resend OTP</button>
          </div>

          <button onClick={() => logout()} className="w-full py-2 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors border-t border-gray-100 mt-4 pt-4">
            ← Back to Login
          </button>
          <div className="mt-8 p-3 rounded-lg" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
              <p className="text-xs text-[#475569]">Session expires in <strong className="text-[#0f172a]">{formatTime(timeLeft)}</strong> minutes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
