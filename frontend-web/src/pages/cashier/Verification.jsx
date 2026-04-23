// src/pages/cashier/Verification.jsx
import { useState } from 'react';
import { useCashier } from '../../context/CashierContext';
import logo from '../../assets/Full logo.png';

export default function Verification() {
  const { setCurrentPage, setIsAuthenticated } = useCashier();
  const [otp, setOtp] = useState(['','','','','','']);

  function handleChange(i, val) {
    if (val.length > 1 || !/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val; setOtp(next);
    if (val && i < 5) document.getElementById(`cotp-${i+1}`)?.focus();
  }
  function handleKeyDown(i, e) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) document.getElementById(`cotp-${i-1}`)?.focus();
  }
  function handleVerify() { setIsAuthenticated(true); setCurrentPage('dashboard'); }

  return (
    <div className="min-h-screen flex" style={{ background:'#0f172a' }}>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <img src={logo} alt="Logo" className="w-48 h-auto" />
          <p className="text-sm tracking-[0.2em] uppercase mt-3 font-mono text-[#475569]">Your Trusted Billing Partner</p>
        </div>
      </div>
      <div className="flex flex-col justify-center px-16 bg-white min-h-screen w-[460px]">
        <div className="w-full max-w-sm mx-auto">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-6 bg-[#eff6ff]">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#1e3a5f" strokeWidth="1.5">
              <path d="M16 8V6a6 6 0 10-12 0v2" strokeLinecap="round"/>
              <rect x="2" y="8" width="16" height="11" rx="2"/>
              <circle cx="10" cy="14" r="1.5" fill="#1e3a5f"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold mb-2 text-[#0f172a]">Verify Your Identity</h1>
          <p className="text-sm mb-8 text-[#94a3b8]">A 6-digit code was sent to <strong className="text-[#0f172a]">cashier123@gmail.com</strong></p>
          <div className="flex gap-3 mb-6">
            {otp.map((val, i) => (
              <input key={i} id={`cotp-${i}`} type="text" inputMode="numeric" maxLength={1} value={val}
                onChange={e => handleChange(i, e.target.value)} onKeyDown={e => handleKeyDown(i, e)}
                className="w-full text-center text-xl font-semibold rounded-xl border-2 py-3 outline-none transition-all text-[#0f172a]"
                style={{ borderColor: val?'#1e3a5f':'#e2e8f0', background: val?'#eff6ff':'#ffffff', boxShadow: val?'0 0 0 3px rgba(30,58,95,0.1)':'none' }}
              />
            ))}
          </div>
          <button onClick={handleVerify}
            className="w-full py-3 rounded-lg text-sm font-semibold text-white mb-4 transition-all duration-150"
            style={{ background:'#1e3a5f' }}
            onMouseEnter={e => { e.currentTarget.style.background='#16324f'; e.currentTarget.style.boxShadow='0 4px 12px rgba(30,58,95,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.background='#1e3a5f'; e.currentTarget.style.boxShadow=''; }}
          >Verify & Continue</button>
          <div className="flex justify-between">
            <button onClick={() => setCurrentPage('login')} className="text-xs text-[#94a3b8] hover:text-[#475569]">Back to login</button>
            <button className="text-xs font-medium text-[#1e3a5f] hover:text-[#16324f]">Resend OTP</button>
          </div>
          <div className="mt-8 p-3 rounded-lg bg-[#f0f9ff] border border-[#bae6fd]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
              <p className="text-xs text-[#475569]">Session expires in <strong className="text-[#0f172a]">10:00</strong> minutes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
