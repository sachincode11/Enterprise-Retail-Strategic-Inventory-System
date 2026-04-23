// src/pages/admin/AI.jsx
import { useAdmin } from '../../context/AdminContext';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Button, SectionCard, BarChart } from '../../components/common';
import { forecastData, restockRecommendations, ragKnowledgeBase } from '../../data/mockData';

const modelMetrics = [
  { label: 'Forecast Accuracy (MAE)', value: '±4.2%', pct: 96 },
  { label: 'Restock Precision',       value: '91%',   pct: 91 },
  { label: 'RAG Chatbot Accuracy',    value: '88%',   pct: 88 },
];

export default function AI() {
  const { setCurrentPage } = useAdmin();
  return (
    <AdminLayout>
      <div className="flex items-center gap-2 text-xs mb-1 text-[#94a3b8]">
        <span>scikit-learn</span><span>·</span><span>RAG Chatbot</span>
      </div>
      <PageHeader
        title="AI Intelligence"
        actions={
          <>
            <span className="ai-badge">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="6" r="2"/><path d="M6 1v1M6 10v1M1 6h1M10 6h1" strokeLinecap="round"/></svg>
              AI Powered
            </span>
            <Button variant="primary">Run Forecast</Button>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-4 mb-4">
        <SectionCard title="Sales Forecast — Next 7 Days">
          <div className="px-5 pb-4 pt-3">
            <BarChart data={forecastData} height={120} />
            <div className="flex gap-6 mt-3">
              <div><p className="text-[10px] uppercase text-[#94a3b8]">Forecast Total</p><p className="text-sm font-semibold text-[#0f172a]">Rs 6.1L</p></div>
              <div><p className="text-[10px] uppercase text-[#94a3b8]">Peak Day</p><p className="text-sm font-semibold text-[#0f172a]">Saturday</p></div>
              <div><p className="text-[10px] uppercase text-[#94a3b8]">Confidence</p><p className="text-sm font-semibold text-[#0f172a]">87%</p></div>
            </div>
          </div>
        </SectionCard>
        <SectionCard title="Restock Recommendations" headerRight={<span className="ai-badge"><svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="6" r="2"/><path d="M6 1v1M6 10v1M1 6h1M10 6h1" strokeLinecap="round"/></svg>AI Powered</span>}>
          <div className="px-4 py-3 space-y-3">
            {restockRecommendations.map((r, i) => (
              <div key={i} className="flex items-start justify-between gap-3 py-1">
                <div>
                  <p className="text-sm font-semibold text-[#0f172a]">{r.name}</p>
                  <p className="text-xs mt-0.5 text-[#94a3b8]">{r.note}</p>
                </div>
                <button
                  onClick={() => r.action === 'Reorder' && setCurrentPage('new-order')}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap flex-shrink-0 transition-all duration-150"
                  style={r.action === 'Reorder' ? { background: '#1e3a5f', color: '#ffffff' } : { border: '1px solid #e2e8f0', color: '#0f172a' }}
                  onMouseEnter={e => {
                    if (r.action === 'Reorder') { e.currentTarget.style.background = '#16324f'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(30,58,95,0.3)'; }
                    else { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#1e3a5f'; }
                  }}
                  onMouseLeave={e => {
                    if (r.action === 'Reorder') { e.currentTarget.style.background = '#1e3a5f'; e.currentTarget.style.boxShadow = ''; }
                    else { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#0f172a'; }
                  }}
                >{r.action}</button>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SectionCard title="Model Performance">
          <div className="px-5 py-4 space-y-4">
            {modelMetrics.map(m => (
              <div key={m.label}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm text-[#0f172a]">{m.label}</span>
                  <span className="text-sm font-semibold text-[#1e3a5f]">{m.value}</span>
                </div>
                <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${m.pct}%` }} /></div>
              </div>
            ))}
            <p className="text-xs pt-1 text-[#94a3b8]">Last retrained: 20 Mar 2026 · 3,240 data points</p>
          </div>
        </SectionCard>
        <SectionCard title="RAG Knowledge Base">
          <div className="px-5 py-4 space-y-3">
            {ragKnowledgeBase.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: '#e2e8f0' }}>
                <div>
                  <p className="text-sm font-medium text-[#0f172a]">{item.name}</p>
                  <p className="text-xs mt-0.5 text-[#94a3b8]">{item.key} · {item.count}</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#22c55e]" title="Indexed" />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
      {/* Floating Chatbot Button */}
      <button onClick={() => setCurrentPage('chatbot')} title="Open AI Chatbot"
        className="fixed bottom-8 z-50 flex items-center justify-center rounded-full shadow-2xl transition-all duration-200 group"
        style={{ width: 56, height: 56, left: 216, background: '#1e3a5f' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#16324f'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(30,58,95,0.5)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#1e3a5f'; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          <circle cx="9" cy="10" r="1" fill="#93c5fd" stroke="none"/>
          <circle cx="12" cy="10" r="1" fill="#93c5fd" stroke="none"/>
          <circle cx="15" cy="10" r="1" fill="#93c5fd" stroke="none"/>
        </svg>
        <span className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: '#1e3a5f' }} />
      </button>
    </AdminLayout>
  );
}
