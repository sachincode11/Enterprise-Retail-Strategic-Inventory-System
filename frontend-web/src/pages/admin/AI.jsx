// src/pages/admin/AI.jsx — restock from live data; forecast & RAG sections are AI service displays
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, SectionCard, BarChart } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { useApp } from '../../context/AppContext';

// Static forecast data — would come from the scikit-learn AI service in production
const forecastData = [
  { label: 'Mon', value: 72000 },
  { label: 'Tue', value: 85000 },
  { label: 'Wed', value: 91000 },
  { label: 'Thu', value: 78000 },
  { label: 'Fri', value: 88000 },
  { label: 'Sat', value: 112000 },
  { label: 'Sun', value: 95000 },
];

// RAG knowledge base info — reflects the actual DB table contents
const ragKnowledgeBase = [
  { name: 'Store Policies',       key: 'store_policies',      count: 'Live from DB' },
  { name: 'Store FAQs',           key: 'store_faqs',          count: 'Live from DB' },
  { name: 'Product Descriptions', key: 'rag_document_chunks', count: 'Live from DB' },
  { name: 'Sales History',        key: 'sales_forecasts',     count: 'Indexed'      },
];

const modelMetrics = [
  { label: 'Forecast Accuracy (MAE)', value: '±4.2%', pct: 96 },
  { label: 'Restock Precision',       value: '91%',   pct: 91 },
  { label: 'RAG Chatbot Accuracy',    value: '88%',   pct: 88 },
];

export default function AI() {
  const { setCurrentPage } = useAdmin();
  const { products } = useApp();

  // Build restock recommendations dynamically from live product data
  const restockItems = products
    .filter(p => p.status === 'Low Stock' || p.status === 'Out of Stock')
    .slice(0, 6)
    .map(p => ({
      id: p.id,
      name: p.name,
      note: p.status === 'Out of Stock'
        ? 'Out of stock — reorder immediately'
        : `Only ${p.stock} units left — below reorder threshold`,
    }));

  return (
    <AdminLayout>
      <div className="flex items-center gap-2 text-xs mb-1 text-[#94a3b8]">
        <span>scikit-learn</span><span>·</span><span>RAG Chatbot</span>
      </div>
      <PageHeader
        title="AI Intelligence"
        actions={
          <span className="ai-badge">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="6" cy="6" r="2"/><path d="M6 1v1M6 10v1M1 6h1M10 6h1" strokeLinecap="round"/>
            </svg>
            AI Powered
          </span>
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

        <SectionCard title="Restock Recommendations" headerRight={
          <span className="ai-badge">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="6" cy="6" r="2"/><path d="M6 1v1M6 10v1M1 6h1M10 6h1" strokeLinecap="round"/>
            </svg>
            Live Data
          </span>
        }>
          <div className="px-4 py-3 space-y-3">
            {restockItems.length === 0 && (
              <p className="text-sm text-[#94a3b8] text-center py-4">All stock levels are healthy.</p>
            )}
            {restockItems.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-3 py-1">
                <div>
                  <p className="text-sm font-semibold text-[#0f172a]">{r.name}</p>
                  <p className="text-xs mt-0.5 text-[#94a3b8]">{r.note}</p>
                </div>
                {/* ONLY Reorder button — Schedule & Adjust removed */}
                <button
                  onClick={() => setCurrentPage('new-order')}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap flex-shrink-0 text-white transition-all duration-150"
                  style={{ background: '#1e3a5f' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#16324f'}
                  onMouseLeave={e => e.currentTarget.style.background = '#1e3a5f'}
                >Reorder</button>
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
            <p className="text-xs pt-1 text-[#94a3b8]">Last retrained: 20 Mar 2026 · {products.length} products tracked</p>
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
    </AdminLayout>
  );
}
