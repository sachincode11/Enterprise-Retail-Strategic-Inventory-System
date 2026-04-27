// src/pages/admin/Profile.jsx — IMPROVED: working password & PIN change, saved to localStorage
import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Button, Toggle, Toast } from '../../components/common';
import { currentUser, activityLog } from '../../data/mockData';
import { lsGet, lsSet } from '../../utils/storage';

const DEFAULT_PIN = '1111';

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
      <h3 className="text-sm font-semibold text-[#0f172a] mb-4 pb-3 border-b" style={{ borderColor: '#e2e8f0' }}>{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', readOnly }) {
  return (
    <div>
      <label className="block text-xs text-[#94a3b8] mb-1.5 font-mono uppercase tracking-widest">{label}</label>
      <input
        type={type} value={value} onChange={onChange} readOnly={readOnly}
        className={`input-field w-full ${readOnly ? 'bg-[#f8fafc] text-[#94a3b8] cursor-default' : ''}`}
      />
    </div>
  );
}

export default function Profile() {
  const [twoFA,   setTwoFA]   = useState(true);
  const [editing, setEditing] = useState(false);
  const [toast,   setToast]   = useState({ visible: false, message: '' });

  const [form, setForm] = useState({
    firstName: 'Anita', lastName: 'Shrestha',
    email: currentUser.email, phone: currentUser.phone,
  });

  // Password change state
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  // PIN change state
  const [pinForm, setPinForm] = useState({ current: '', next: '', confirm: '' });

  const showToast = (msg) => { setToast({ visible: true, message: msg }); setTimeout(() => setToast({ visible: false, message: '' }), 2500); };
  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));
  const setPw = key => e => setPwForm(f => ({ ...f, [key]: e.target.value }));
  const setPin = key => e => setPinForm(f => ({ ...f, [key]: e.target.value.replace(/\D/g, '').slice(0, 4) }));

  const handleSaveProfile = () => {
    if (!form.firstName || !form.email) { showToast('Name and email are required.'); return; }
    setEditing(false);
    showToast('Profile updated successfully.');
  };

  const handleChangePassword = () => {
    const stored = lsGet('invosix_admin_password', 'admin123');
    if (pwForm.current !== stored) { showToast('Current password is incorrect.'); return; }
    if (pwForm.next.length < 6)    { showToast('New password must be at least 6 characters.'); return; }
    if (pwForm.next !== pwForm.confirm) { showToast('Passwords do not match.'); return; }
    lsSet('invosix_admin_password', pwForm.next);
    setPwForm({ current: '', next: '', confirm: '' });
    showToast('Password changed successfully.');
  };

  const handleChangePIN = () => {
    const stored = lsGet('invosix_cashier_pin', DEFAULT_PIN);
    if (pinForm.current !== stored) { showToast('Current PIN is incorrect.'); return; }
    if (pinForm.next.length !== 4)  { showToast('New PIN must be exactly 4 digits.'); return; }
    if (pinForm.next !== pinForm.confirm) { showToast('PINs do not match.'); return; }
    lsSet('invosix_cashier_pin', pinForm.next);
    setPinForm({ current: '', next: '', confirm: '' });
    showToast('Cashier PIN updated successfully.');
  };

  return (
    <AdminLayout>
      <Toast visible={toast.visible} message={toast.message} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs mb-0.5 text-[#94a3b8]">Account</p>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]">My Profile</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setEditing(!editing)}>{editing ? '✕ Cancel' : '✎ Edit Profile'}</Button>
          {editing && <Button variant="primary" onClick={handleSaveProfile}>✓ Update</Button>}
        </div>
      </div>

      {/* Hero card */}
      <div className="rounded-xl p-6 mb-4 flex items-center justify-between" style={{ background: '#0f172a' }}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white" style={{ background: '#1e3a5f' }}>AS</div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#22c55e' }}>
              <svg width="8" height="8" viewBox="0 0 8 8" fill="white"><circle cx="4" cy="4" r="3"/></svg>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{currentUser.name}</h2>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: 'rgba(255,255,255,0.1)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.15)' }}>
              {currentUser.role.toUpperCase()}
            </span>
            <p className="text-xs mt-1.5" style={{ color: '#475569' }}>{currentUser.email} · {currentUser.phone} · {currentUser.store}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
          <span className="text-xs" style={{ color: '#94a3b8' }}>Active session</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Personal info */}
        <Section title="Personal Information">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name" value={form.firstName} onChange={set('firstName')} readOnly={!editing} />
              <Field label="Last Name"  value={form.lastName}  onChange={set('lastName')}  readOnly={!editing} />
            </div>
            <Field label="Email" value={form.email} onChange={set('email')} type="email" readOnly={!editing} />
            <Field label="Phone" value={form.phone} onChange={set('phone')} readOnly={!editing} />
            <Field label="Store" value={currentUser.store} readOnly />
            <Field label="Role"  value={currentUser.role}  readOnly />
          </div>
        </Section>

        {/* Security — admin can change own password AND cashier PIN */}
        <div className="space-y-4">
          <Section title="Change Password">
            <div className="space-y-3">
              <Field label="Current Password" value={pwForm.current} onChange={setPw('current')} type="password" />
              <Field label="New Password"     value={pwForm.next}    onChange={setPw('next')}    type="password" />
              <Field label="Confirm Password" value={pwForm.confirm} onChange={setPw('confirm')} type="password" />
              <Button variant="primary" onClick={handleChangePassword} className="w-full">Update Password</Button>
            </div>
          </Section>

          <Section title="Cashier PIN Management">
            <p className="text-xs text-[#94a3b8] mb-3">Admin can set and reset the cashier PIN (default: 1111)</p>
            <div className="space-y-3">
              <Field label="Current PIN" value={pinForm.current} onChange={setPin('current')} type="password" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="New PIN (4 digits)"     value={pinForm.next}    onChange={setPin('next')} />
                <Field label="Confirm PIN" value={pinForm.confirm} onChange={setPin('confirm')} />
              </div>
              <Button variant="primary" onClick={handleChangePIN} className="w-full">Update Cashier PIN</Button>
            </div>
          </Section>
        </div>
      </div>

      {/* Preferences */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Section title="Preferences">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#0f172a]">Two-Factor Authentication</p>
              <p className="text-xs text-[#94a3b8]">Require OTP on every login</p>
            </div>
            <Toggle checked={twoFA} onChange={setTwoFA} />
          </div>
        </Section>
        <Section title="Recent Activity">
          <div className="space-y-3 max-h-[160px] overflow-y-auto">
            {activityLog.slice(0, 5).map((log, i) => (
              <div key={i} className="flex items-start gap-2 pb-2 border-b last:border-0 last:pb-0" style={{ borderColor: '#e2e8f0' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#1e3a5f] mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#0f172a] truncate">{log.action}</p>
                  <p className="text-xs text-[#94a3b8]">{log.by} · {log.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </AdminLayout>
  );
}
