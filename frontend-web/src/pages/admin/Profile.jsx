// src/pages/admin/Profile.jsx
import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Button, Toggle } from '../../components/common';
import { currentUser, activityLog } from '../../data/mockData';

export default function Profile() {
  const [twoFA,   setTwoFA]   = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: 'Anita', lastName: 'Shrestha', email: currentUser.email, phone: currentUser.phone });
  const fieldCls = (editable = true) => `input-field ${!editing || !editable ? 'bg-[#f8fafc] text-[#94a3b8] cursor-default' : ''}`;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs mb-0.5 text-[#94a3b8]">Account</p>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]">My Profile</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setEditing(!editing)}>{editing ? '✕ Cancel' : '✎ Edit Profile'}</Button>
          {editing && <Button variant="primary" onClick={() => setEditing(false)}>✓ Update</Button>}
        </div>
      </div>

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
        <button className="px-4 py-2 rounded-lg text-sm font-medium transition-all" style={{ background: 'rgba(255,255,255,0.08)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.12)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        >Log Out</button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#0f172a]">Personal Information</h3>
            {editing && <span className="text-xs text-[#1e3a5f] font-medium">● Editing</span>}
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className="text-xs mb-1.5 block text-[#94a3b8]">First Name</label><input className={fieldCls()} value={form.firstName} readOnly={!editing} onChange={e => setForm({ ...form, firstName: e.target.value })} /></div>
            <div><label className="text-xs mb-1.5 block text-[#94a3b8]">Last Name</label><input className={fieldCls()} value={form.lastName} readOnly={!editing} onChange={e => setForm({ ...form, lastName: e.target.value })} /></div>
          </div>
          <div className="mb-3"><label className="text-xs mb-1.5 block text-[#94a3b8]">Email Address</label><input className={fieldCls()} value={form.email} readOnly={!editing} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div className="mb-3"><label className="text-xs mb-1.5 block text-[#94a3b8]">Phone Number</label><input className={fieldCls()} value={form.phone} readOnly={!editing} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs mb-1.5 block text-[#94a3b8]">Role</label><input className="input-field bg-[#f8fafc] text-[#94a3b8] cursor-default" defaultValue="Admin" readOnly /></div>
            <div><label className="text-xs mb-1.5 block text-[#94a3b8]">Store</label><input className="input-field bg-[#f8fafc] text-[#94a3b8] cursor-default" defaultValue="KTM-001" readOnly /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
          <h3 className="text-sm font-semibold text-[#0f172a] mb-4">Security</h3>
          <div className="flex items-center justify-between mb-4 pb-4 border-b" style={{ borderColor: '#e2e8f0' }}>
            <div><p className="text-xs font-medium mb-0.5 text-[#94a3b8]">Two-Factor Authentication</p><p className="text-sm text-[#0f172a]">Email OTP enabled</p></div>
            <Toggle checked={twoFA} onChange={setTwoFA} />
          </div>
          <div className="mb-3"><label className="text-xs mb-1.5 block text-[#94a3b8]">Current Password</label><input type="password" className="input-field" placeholder="Enter current password" /></div>
          <div className="mb-3"><label className="text-xs mb-1.5 block text-[#94a3b8]">New Password</label><input type="password" className="input-field" placeholder="Min. 8 characters" /></div>
          <div className="mb-4"><label className="text-xs mb-1.5 block text-[#94a3b8]">Confirm New Password</label><input type="password" className="input-field" placeholder="Repeat new password" /></div>
          <Button variant="primary">Update Password</Button>
          <div className="mt-4 pt-4 border-t" style={{ borderColor: '#e2e8f0' }}>
            <p className="text-xs text-[#94a3b8]">Last login: 22 Mar 2026, 08:00 AM</p>
            <p className="text-xs mt-0.5 text-[#94a3b8]">Device: Chrome · Windows 11 · 103.22.18.x</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
          <h3 className="text-sm font-semibold text-[#0f172a] mb-4">Admin Activity Log</h3>
          <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 220 }}>
            {activityLog.map((log, i) => (
              <div key={i} className="border-b pb-3 last:border-0 last:pb-0" style={{ borderColor: '#e2e8f0' }}>
                <p className="text-sm font-medium text-[#0f172a]">{log.action}</p>
                <p className="text-xs mt-0.5 text-[#94a3b8]">{log.time}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e2e8f0' }}>
          <h3 className="text-sm font-semibold text-[#0f172a] mb-4">Active Sessions</h3>
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#f8fafc' }}>
            <div>
              <p className="text-sm font-medium text-[#0f172a]">Chrome · Windows 11 — Current</p>
              <p className="text-xs mt-0.5 text-[#94a3b8]">103.22.18.x · Kathmandu · Today 08:00</p>
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded text-white" style={{ background: '#1e3a5f' }}>Current</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
