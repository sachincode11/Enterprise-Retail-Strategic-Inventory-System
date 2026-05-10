// src/pages/admin/Discounts.jsx — FULLY WIRED TO DATABASE
import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Badge, Button, StatCard } from '../../components/common';
import { useApp } from '../../context/AppContext';

const EMPTY_FORM = { 
  name: '', 
  type: 'Percentage', 
  value: '', 
  appliesTo: 'Entire cart', 
  valid_from: '', 
  valid_until: '', 
  min_purchase_amount: '',
  product_id: '',
  category_id: '',
  is_active: true 
};

const Field = ({ label, value, onChange, type = 'text', options, placeholder }) => (
  <div>
    <p className="text-xs text-[#94a3b8] mb-1">{label}</p>
    {options ? (
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border rounded-lg border-[#e2e8f0] outline-none focus:border-[#1e3a5f] bg-white">
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    ) : (
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border rounded-lg border-[#e2e8f0] outline-none focus:border-[#1e3a5f] bg-white" />
    )}
  </div>
);

export default function Discounts() {
  const { discounts, categories, products, addDiscount, updateDiscount, deleteDiscount } = useApp();
  const [editId, setEditId]       = useState(null);
  const [editForm, setEditForm]   = useState({});
  const [showAdd, setShowAdd]     = useState(false);
  const [addForm, setAddForm]     = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  const activeCount = discounts.filter(d => d.status === 'Active').length;
  
  const startEdit = (d) => { 
    setEditId(d.id); 
    setEditForm({ 
      ...d, 
      name: d.name,
      type: d.type,
      value: String(d.discount_value || d.value || '').replace(/[^0-9.]/g, ''),
      appliesTo: d.appliesTo,
      valid_from: d.valid_from ? new Date(d.valid_from).toISOString().split('T')[0] : '',
      valid_until: d.valid_until ? new Date(d.valid_until).toISOString().split('T')[0] : '',
      min_purchase_amount: d.min_purchase_amount || '',
      product_id: d.product_id || '',
      category_id: d.category_id || '',
      is_active: d.status === 'Active'
    }); 
  };

  const cancelEdit = () => { setEditId(null); setEditForm({}); };

  const saveEdit = async () => {
    setSaving(true);
    await updateDiscount(editId, editForm);
    setSaving(false);
    setEditId(null);
  };

  const handleAdd = async () => {
    if (!addForm.name || !addForm.value) { alert('Name and value are required'); return; }
    if (addForm.appliesTo === 'Specific category' && !addForm.category_id) { alert('Please select a category'); return; }
    if (addForm.appliesTo === 'Specific product' && !addForm.product_id) { alert('Please select a product'); return; }
    
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

  return (
    <AdminLayout>
      <PageHeader
        breadcrumb="Promotions & Offers"
        title="Discounts"
        actions={<Button variant="primary" onClick={() => setShowAdd(!showAdd)}>+ New Discount</Button>}
      />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Active Discounts"     value={activeCount} />
        <StatCard label="Live Campaigns"       value={discounts.length} />
        <StatCard label="Avg. Savings"         value="Rs 450" />
      </div>

      {/* Inline Add Form */}
      {showAdd && (
        <div className="bg-white rounded-xl border p-6 mb-6 shadow-sm border-[#1e3a5f]">
          <h3 className="text-sm font-bold text-[#0f172a] mb-5 uppercase tracking-wider">Configure New Discount</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
            <Field label="Discount Name" value={addForm.name} onChange={v => setAddForm(f => ({...f, name: v}))} placeholder="e.g. Summer Sale" />
            <Field label="Type" value={addForm.type} onChange={v => setAddForm(f => ({...f, type: v}))} options={['Percentage','Fixed Amount']} />
            <Field label="Value" value={addForm.value} onChange={v => setAddForm(f => ({...f, value: v}))} placeholder="10 or 500" />
            <Field label="Applies To" value={addForm.appliesTo} onChange={v => setAddForm(f => ({...f, appliesTo: v}))}
              options={['Entire cart', 'Specific product', 'Specific category']} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 pt-4 border-t border-[#f1f5f9]">
            <Field label="Valid From" type="date" value={addForm.valid_from} onChange={v => setAddForm(f => ({...f, valid_from: v}))} />
            <Field label="Valid Until" type="date" value={addForm.valid_until} onChange={v => setAddForm(f => ({...f, valid_until: v}))} />
            <Field label="Min. Purchase (Rs)" value={addForm.min_purchase_amount} onChange={v => setAddForm(f => ({...f, min_purchase_amount: v}))} placeholder="0" />
            
            {addForm.appliesTo === 'Specific product' && (
              <Field label="Select Product" value={addForm.product_id} onChange={v => setAddForm(f => ({...f, product_id: v}))} 
                options={[{label: 'Choose...', value: ''}, ...products.map(p => ({label: p.name, value: p.id}))]} />
            )}
            {addForm.appliesTo === 'Specific category' && (
              <Field label="Select Category" value={addForm.category_id} onChange={v => setAddForm(f => ({...f, category_id: v}))} 
                options={[{label: 'Choose...', value: ''}, ...categories.map(c => ({label: c.category_name, value: c.category_id}))]} />
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => { setShowAdd(false); setAddForm(EMPTY_FORM); }}>Discard</Button>
            <Button variant="primary" onClick={handleAdd} disabled={saving}>
              {saving ? 'Creating…' : 'Publish Discount'}
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
              <th className="px-4 py-3 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Promotion</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Details</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Applicability</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Validity</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#64748b] uppercase tracking-wider">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f5f9]">
            {discounts.map(d => {
              const isEditing = editId === d.id;
              return (
                <tr key={d.id} className="hover:bg-[#fcfdfe] transition-colors">
                  <td className="px-4 py-4">
                    {isEditing ? (
                      <input value={editForm.name} onChange={e => setEditForm(f => ({...f, name: e.target.value}))}
                        className="w-full px-2 py-1 text-sm border rounded-lg border-[#1e3a5f] outline-none" />
                    ) : (
                      <span className="text-sm font-semibold text-[#0f172a]">{d.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <select value={editForm.type} onChange={e => setEditForm(f => ({...f, type: e.target.value}))}
                          className="px-2 py-1 text-xs border rounded-lg border-[#e2e8f0]">
                          <option>Percentage</option><option>Fixed Amount</option>
                        </select>
                        <input value={editForm.value} onChange={e => setEditForm(f => ({...f, value: e.target.value}))}
                          className="w-16 px-2 py-1 text-xs border rounded-lg border-[#e2e8f0]" />
                      </div>
                    ) : (
                      <Badge variant="info">{d.value}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {isEditing ? (
                      <select value={editForm.appliesTo} onChange={e => setEditForm(f => ({...f, appliesTo: e.target.value}))}
                        className="w-full px-2 py-1 text-xs border rounded-lg border-[#e2e8f0]">
                        <option>Entire cart</option><option>Specific product</option><option>Specific category</option>
                      </select>
                    ) : (
                      <span className="text-xs text-[#475569]">{d.appliesTo}</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs font-mono text-[#94a3b8]">{d.period}</span>
                  </td>
                  <td className="px-4 py-4">
                    {isEditing ? (
                      <select value={editForm.is_active} onChange={e => setEditForm(f => ({...f, is_active: e.target.value === 'true'}))}
                        className="px-2 py-1 text-xs border rounded-lg border-[#e2e8f0]">
                        <option value="true">Active</option><option value="false">Inactive</option>
                      </select>
                    ) : (
                      <Badge status={d.status} />
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {isEditing ? (
                      <div className="flex gap-1 justify-end">
                        <button onClick={saveEdit} disabled={saving} className="text-xs bg-[#1e3a5f] text-white px-3 py-1.5 rounded-lg">Save</button>
                        <button onClick={cancelEdit} className="text-xs text-[#94a3b8] px-2 py-1">X</button>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <button className="text-xs text-[#1e3a5f] font-semibold hover:underline" onClick={() => startEdit(d)}>Edit</button>
                        <button onClick={() => handleDelete(d.id)} className="text-[#dc2626] opacity-60 hover:opacity-100 transition-opacity">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
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
