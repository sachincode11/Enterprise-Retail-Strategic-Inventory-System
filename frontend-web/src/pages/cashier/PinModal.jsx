// src/components/PinModal.jsx — PIN verification (default PIN: 1111)
// Cashier must enter PIN for transactions and refunds
import { useState } from 'react';
import { Modal } from '../../components/common';
import { lsGet } from '../../utils/storage';

const DEFAULT_PIN = '1111';

function getPIN() {
  return lsGet('invosix_cashier_pin', DEFAULT_PIN);
}

export default function PinModal({ isOpen, onClose, onSuccess, title = 'Enter PIN', subtitle = 'Enter your 4-digit PIN to continue' }) {
  const [pin, setPin]     = useState('');
  const [error, setError] = useState('');

  const handleDigit = (d) => {
    if (pin.length >= 4) return;
    const newPin = pin + d;
    setPin(newPin);
    setError('');
    if (newPin.length === 4) {
      setTimeout(() => {
        if (newPin === getPIN()) {
          setPin('');
          onSuccess();
        } else {
          setError('Incorrect PIN. Try again.');
          setPin('');
        }
      }, 100);
    }
  };

  const handleBackspace = () => { setPin(p => p.slice(0, -1)); setError(''); };
  const handleClose = () => { setPin(''); setError(''); onClose(); };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <div className="text-center space-y-5">
        <p className="text-sm text-[#475569]">{subtitle}</p>

        {/* PIN dots */}
        <div className="flex justify-center gap-3">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="w-4 h-4 rounded-full border-2 transition-all duration-150"
              style={{ borderColor: pin.length > i ? '#1e3a5f' : '#e2e8f0', background: pin.length > i ? '#1e3a5f' : 'transparent' }} />
          ))}
        </div>

        {error && <p className="text-xs text-[#dc2626] font-medium">{error}</p>}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2 mx-auto" style={{ maxWidth: 240 }}>
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
            <button key={i}
              onClick={() => d === '⌫' ? handleBackspace() : d ? handleDigit(d) : null}
              disabled={!d}
              className="h-12 rounded-xl text-lg font-semibold transition-all duration-150 disabled:opacity-0"
              style={{ background: d === '⌫' ? '#fef2f2' : '#f8fafc', border: '1px solid #e2e8f0', color: d === '⌫' ? '#dc2626' : '#0f172a' }}
              onMouseEnter={e => { if (d) e.currentTarget.style.background = d === '⌫' ? '#fee2e2' : '#eff6ff'; }}
              onMouseLeave={e => { if (d) e.currentTarget.style.background = d === '⌫' ? '#fef2f2' : '#f8fafc'; }}
            >{d}</button>
          ))}
        </div>
        <button onClick={handleClose} className="text-xs text-[#94a3b8] hover:text-[#475569]">Cancel</button>
      </div>
    </Modal>
  );
}
