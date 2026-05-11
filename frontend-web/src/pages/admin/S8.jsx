import { useState, useEffect } from 'react';
import { SettingsLayout } from './SettingsLayout';
import { Badge, Button, ConfirmDialog, Toast } from '../../components/common';
import { 
  getFAQs, createFAQ, updateFAQ, deleteFAQ, 
  getPolicies, createPolicy, updatePolicy, deletePolicy 
} from '../../services/knowledgeService';

export default function S8() {
  const [faqs, setFaqs] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '' });
  
  const [editFaqId, setEditFaqId] = useState(null);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '' });
  const [showAddFaq, setShowAddFaq] = useState(false);

  const [editPolicyId, setEditPolicyId] = useState(null);
  const [policyForm, setPolicyForm] = useState({ policy_name: '', content: '' });
  const [showAddPolicy, setShowAddPolicy] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState({ id: null, type: null });

  const showToast = (msg, type = 'success') => {
    setToast({ visible: true, message: msg, type });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [f, p] = await Promise.all([getFAQs(), getPolicies()]);
      setFaqs(f);
      setPolicies(p);
    } catch (err) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFaq = async () => {
    if (!faqForm.question || !faqForm.answer) return;
    try {
      if (editFaqId) {
        await updateFAQ(editFaqId, faqForm);
        showToast('FAQ updated');
      } else {
        await createFAQ(faqForm);
        showToast('FAQ created');
      }
      setEditFaqId(null);
      setFaqForm({ question: '', answer: '' });
      setShowAddFaq(false);
      loadData();
    } catch (err) {
      showToast('Error saving FAQ', 'error');
    }
  };

  const handleSavePolicy = async () => {
    if (!policyForm.policy_name || !policyForm.content) return;
    try {
      if (editPolicyId) {
        await updatePolicy(editPolicyId, policyForm);
        showToast('Policy updated');
      } else {
        await createPolicy(policyForm);
        showToast('Policy created');
      }
      setEditPolicyId(null);
      setPolicyForm({ policy_name: '', content: '' });
      setShowAddPolicy(false);
      loadData();
    } catch (err) {
      showToast('Error saving policy', 'error');
    }
  };

  const handleDelete = async () => {
    const { id, type } = confirmDelete;
    try {
      if (type === 'faq') await deleteFAQ(id);
      else await deletePolicy(id);
      showToast(`${type.toUpperCase()} deleted`);
      loadData();
    } catch (err) {
      showToast('Delete failed', 'error');
    }
    setConfirmDelete({ id: null, type: null });
  };

  return (
    <SettingsLayout activeId="S8">
      <Toast {...toast} />
      
      <div className="p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0f172a]">Frequently Asked Questions</h2>
            <Button variant="secondary" onClick={() => setShowAddFaq(true)}>+ Add FAQ</Button>
          </div>
          
          <div className="space-y-4">
            {faqs.map(f => (
              <div key={f.faq_id} className="p-4 rounded-lg border border-[#e2e8f0] hover:border-[#cbd5e1] transition-colors">
                {editFaqId === f.faq_id ? (
                  <div className="space-y-3">
                    <input className="input-field" value={faqForm.question} onChange={e => setFaqForm({...faqForm, question: e.target.value})} placeholder="Question" />
                    <textarea className="input-field min-h-[80px]" value={faqForm.answer} onChange={e => setFaqForm({...faqForm, answer: e.target.value})} placeholder="Answer" />
                    <div className="flex gap-2 justify-end">
                      <Button variant="secondary" onClick={() => setEditFaqId(null)}>Cancel</Button>
                      <Button variant="primary" onClick={handleSaveFaq}>Save</Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-sm text-[#1e3a5f]">{f.question}</h3>
                      <div className="flex gap-2">
                        <button className="text-xs text-[#64748b] hover:text-[#1e3a5f]" onClick={() => { setEditFaqId(f.faq_id); setFaqForm({question: f.question, answer: f.answer}); }}>Edit</button>
                        <button className="text-xs text-[#ef4444]" onClick={() => setConfirmDelete({id: f.faq_id, type: 'faq'})}>Delete</button>
                      </div>
                    </div>
                    <p className="text-sm text-[#64748b] leading-relaxed">{f.answer}</p>
                  </div>
                )}
              </div>
            ))}
            {showAddFaq && !editFaqId && (
              <div className="p-4 rounded-lg border-2 border-dashed border-[#cbd5e1] space-y-3">
                <input className="input-field" value={faqForm.question} onChange={e => setFaqForm({...faqForm, question: e.target.value})} placeholder="New Question" />
                <textarea className="input-field min-h-[80px]" value={faqForm.answer} onChange={e => setFaqForm({...faqForm, answer: e.target.value})} placeholder="Answer" />
                <div className="flex gap-2 justify-end">
                  <Button variant="secondary" onClick={() => setShowAddFaq(false)}>Cancel</Button>
                  <Button variant="primary" onClick={handleSaveFaq}>Add FAQ</Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <hr className="my-8 border-[#f1f5f9]" />

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0f172a]">Store Policies</h2>
            <Button variant="secondary" onClick={() => setShowAddPolicy(true)}>+ Add Policy</Button>
          </div>
          
          <div className="space-y-4">
            {policies.map(p => (
              <div key={p.policy_id} className="p-4 rounded-lg border border-[#e2e8f0]">
                {editPolicyId === p.policy_id ? (
                  <div className="space-y-3">
                    <input className="input-field" value={policyForm.policy_name} onChange={e => setPolicyForm({...policyForm, policy_name: e.target.value})} placeholder="Policy Title" />
                    <textarea className="input-field min-h-[120px]" value={policyForm.content} onChange={e => setPolicyForm({...policyForm, content: e.target.value})} placeholder="Policy Content" />
                    <div className="flex gap-2 justify-end">
                      <Button variant="secondary" onClick={() => setEditPolicyId(null)}>Cancel</Button>
                      <Button variant="primary" onClick={handleSavePolicy}>Save</Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-[#0f172a]">{p.policy_name}</h3>
                      <div className="flex gap-2">
                        <button className="text-xs text-[#64748b] hover:text-[#1e3a5f]" onClick={() => { setEditPolicyId(p.policy_id); setPolicyForm({policy_name: p.policy_name, content: p.content}); }}>Edit</button>
                        <button className="text-xs text-[#ef4444]" onClick={() => setConfirmDelete({id: p.policy_id, type: 'policy'})}>Delete</button>
                      </div>
                    </div>
                    <div className="text-sm text-[#64748b] whitespace-pre-wrap leading-relaxed">{p.content}</div>
                  </div>
                )}
              </div>
            ))}
            {showAddPolicy && !editPolicyId && (
              <div className="p-4 rounded-lg border-2 border-dashed border-[#cbd5e1] space-y-3">
                <input className="input-field" value={policyForm.policy_name} onChange={e => setPolicyForm({...policyForm, policy_name: e.target.value})} placeholder="New Policy Title" />
                <textarea className="input-field min-h-[120px]" value={policyForm.content} onChange={e => setPolicyForm({...policyForm, content: e.target.value})} placeholder="Policy Content" />
                <div className="flex gap-2 justify-end">
                  <Button variant="secondary" onClick={() => setShowAddPolicy(false)}>Cancel</Button>
                  <Button variant="primary" onClick={handleSavePolicy}>Add Policy</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog 
        isOpen={!!confirmDelete.id}
        title={`Delete ${confirmDelete.type?.toUpperCase()}`}
        message={`Are you sure you want to delete this ${confirmDelete.type}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete({id: null, type: null})}
      />
    </SettingsLayout>
  );
}
