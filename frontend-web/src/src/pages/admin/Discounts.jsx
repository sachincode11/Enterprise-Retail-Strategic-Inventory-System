// src/pages/admin/Discounts.jsx — IMPROVED: inline edit, add, delete all wired to global state
import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Badge, Button, StatCard } from '../../components/common';
import { useApp } from '../../context/AppContext';

const EMPTY_FORM = { name: '', code: '', type: 'Percentage', value: '', appliesTo: 'Entire cart', period: 'Ongoing', status: 'Active' };

export default function Discounts() {
  const { discounts, addDiscount, updateDiscount, deleteDiscount } = useApp();
  const [editId, setEditId]       = useState(null);
  const [editForm, setEditForm]   = useState({});
  const [showAdd, setShowAdd]     = useState(false);
  const [addForm, setAddForm]     = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  const activeCount = discounts.filter(d => d.status === 'Active').length;
  const totalUses   = discounts.reduce((s, d) => s + (d.used || 0), 0);

  const startEdit = (d) => { setEditId(d.id); setEditForm({ ...d }); };
  const cancelEdit = () => { setEditId(null); setEditForm({}); };
  const saveEdit = async () => {
    setSaving(true);
    await updateDiscount(editId, editForm);
    setSaving(false);
    setEditId(null);
  };

  const handleAdd = async () => {
    if (!addForm.name || !addForm.code) return;
    setSaving(true);
    await addDiscount(addForm);
    setSaving(false);
    setShowAdd(false);
    setAddForm(EMPTY_FORM);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this discount?')) return;
    await deleteDiscount(id);
  };

  const Field = ({ label, value, onChange, type = 'text', options }) => (
    <div>
      <p className="text-xs text-[#94a3b8] mb-1">{label}</p>
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)}
          className="w-full px-2 py-1.5 text-xs border rounded-lg border-[#e2e8f0] outline-none focus:border-[#1e3a5f]">
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          className="w-full px-2 py-1.5 text-xs border rounded-lg border-[#e2e8f0] outline-none focus:border-[#1e3a5f]" />
      )}
    </div>
  );

  return (
    <AdminLayout>
      <PageHeader
        breadcrumb="Promotions & Offers"
        title="Discounts"
        actions={<Button variant="primary" onClick={() => setShowAdd(!showAdd)}>+ New Discount</Button>}
      />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Active Discounts"     value={activeCount} />
        <StatCard label="Total Redemptions"    value={totalUses.toLocaleString()} progress={60} />
        <StatCard label="Avg. Discount Value"  value="8.2%" />
      </div>

      {/* Inline Add Form */}
      {showAdd && (
        <div className="bg-white rounded-xl border p-5 mb-4" style={{ borderColor: '#1e3a5f' }}>
          <h3 className="text-sm font-semibold text-[#0f172a] mb-4">New Discount</h3>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <Field label="Name" value={addForm.name} onChange={v => setAddForm(f => ({...f, name: v}))} />
            <Field label="Code" value={addForm.code} onChange={v => setAddForm(f => ({...f, code: v.toUpperCase()}))} />
            <Field label="Type" value={addForm.type} onChange={v => setAddForm(f => ({...f, type: v}))} options={['Percentage','Fixed Amount']} />
            <Field label="Value (% or Rs)" value={addForm.value} onChange={v => setAddForm(f => ({...f, value: v}))} />
            <Field label="Applies To" value={addForm.appliesTo} onChange={v => setAddForm(f => ({...f, appliesTo: v}))}
              options={['Entire cart','Registered customers','Orders > Rs 1,000','Specific category']} />
            <Field label="Period" value={addForm.period} onChange={v => setAddForm(f => ({...f, period: v}))} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => { setShowAdd(false); setAddForm(EMPTY_FORM); }}>Cancel</Button>
            <Button variant="primary" onClick={handleAdd} disabled={saving}>
              {saving ? 'Saving…' : 'Add Discount'}
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        <table className="data-table">
          <thead>
            <tr><th>Discount Name</th><th>Type</th><th>Value</th><th>Applies To</th><th>Period</th><th>Used</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {discounts.map(d => {
              const isEditing = editId === d.id;
              return (
                <tr key={d.id}>
                  <td>
                    {isEditing ? (
                      <div className="space-y-1">
                        <input value={editForm.name} onChange={e => setEditForm(f => ({...f, name: e.target.value}))}
                          className="w-full px-2 py-1 text-xs border rounded border-[#1e3a5f] outline-none" placeholder="Name" />
                        <input value={editForm.code} onChange={e => setEditForm(f => ({...f, code: e.target.value.toUpperCase()}))}
                          className="w-full px-2 py-1 text-xs border rounded border-[#e2e8f0] outline-none font-mono" placeholder="Code" />
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-semibold">{d.name}</p>
                        <p className="mono text-xs" style={{ color: '#94a3b8' }}>{d.code}</p>
                      </div>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <select value={editForm.type} onChange={e => setEditForm(f => ({...f, type: e.target.value}))}
                        className="w-full px-2 py-1 text-xs border rounded border-[#e2e8f0] outline-none">
                        <option>Percentage</option><option>Fixed Amount</option>
                      </select>
                    ) : <span className="text-sm">{d.type}</span>}
                  </td>
                  <td>
                    {isEditing ? (
                      <input value={editForm.value} onChange={e => setEditForm(f => ({...f, value: e.target.value}))}
                        className="w-full px-2 py-1 text-xs border rounded border-[#e2e8f0] outline-none" />
                    ) : <span className="text-sm font-semibold">{d.value}</span>}
                  </td>
                  <td className="text-sm" style={{ color: '#475569' }}>
                    {isEditing ? (
                      <input value={editForm.appliesTo} onChange={e => setEditForm(f => ({...f, appliesTo: e.target.value}))}
                        className="w-full px-2 py-1 text-xs border rounded border-[#e2e8f0] outline-none" />
                    ) : d.appliesTo}
                  </td>
                  <td className="text-sm" style={{ color: '#475569' }}>
                    {isEditing ? (
                      <input value={editForm.period} onChange={e => setEditForm(f => ({...f, period: e.target.value}))}
                        className="w-full px-2 py-1 text-xs border rounded border-[#e2e8f0] outline-none" />
                    ) : d.period}
                  </td>
                  <td className="text-sm">{(d.used || 0).toLocaleString()} uses</td>
                  <td>
                    {isEditing ? (
                      <select value={editForm.status} onChange={e => setEditForm(f => ({...f, status: e.target.value}))}
                        className="px-2 py-1 text-xs border rounded border-[#e2e8f0] outline-none">
                        <option>Active</option><option>Expired</option>
                      </select>
                    ) : <Badge status={d.status} />}
                  </td>
                  <td>
                    {isEditing ? (
                      <div className="flex gap-1">
                        <button onClick={saveEdit} disabled={saving}
                          className="text-xs bg-[#1e3a5f] text-white px-3 py-1.5 rounded-lg disabled:opacity-50">
                          {saving ? '…' : 'Save'}
                        </button>
                        <button onClick={cancelEdit} className="text-xs text-[#94a3b8] px-2 py-1">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <button className="btn-outline" onClick={() => startEdit(d)}>Edit</button>
                        <button onClick={() => handleDelete(d.id)}
                          className="w-7 h-7 rounded border flex items-center justify-center hover:bg-[#fef2f2]" style={{ borderColor: '#e2e8f0' }}>
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#dc2626" strokeWidth="1.5">
                            <path d="M1 3h10M4 3V1.5h4V3M9.5 3l-.5 7.5H3L2.5 3"/>
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
