// src/services/staffService.js
import { fakeApi } from '../utils/fakeApi';
import { lsGet, lsSet } from '../utils/storage';
import { staff as mockStaff } from '../data/mockData';

const USE_MOCK = true;
const LS_KEY = 'invosix_staff';

function getStored() { return lsGet(LS_KEY, mockStaff); }
function saveStored(data) { lsSet(LS_KEY, data); }

export async function getStaff() {
  if (USE_MOCK) return fakeApi(getStored());
  const res = await fetch('/api/staff');
  return res.json();
}

export async function addStaff(member) {
  if (USE_MOCK) {
    const stored = getStored();
    const newMember = {
      ...member,
      id: Date.now(),
      initials: member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
      shift: '—',
      lastLogin: 'Never',
    };
    saveStored([newMember, ...stored]);
    return fakeApi(newMember);
  }
  const res = await fetch('/api/staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(member) });
  return res.json();
}

export async function updateStaff(id, updates) {
  if (USE_MOCK) {
    const stored = getStored();
    const updated = stored.map(s => s.id === id ? { ...s, ...updates } : s);
    saveStored(updated);
    return fakeApi(updated.find(s => s.id === id));
  }
  const res = await fetch(`/api/staff/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
  return res.json();
}

export async function deleteStaff(id) {
  if (USE_MOCK) {
    saveStored(getStored().filter(s => s.id !== id));
    return fakeApi({ deleted: id });
  }
  const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
  return res.json();
}
