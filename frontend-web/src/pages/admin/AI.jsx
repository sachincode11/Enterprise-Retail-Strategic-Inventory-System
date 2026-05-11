import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, SectionCard, BarChart } from '../../components/common';
import { useAdmin } from '../../context/AdminContext';
import { useApp } from '../../context/AppContext';
import chatbotService from '../../services/chatbotService';
import * as forecastingService from '../../services/forecastingService';

export default function AI() {
  const { setCurrentPage } = useAdmin();
  const { products } = useApp();
  const [metrics, setMetrics] = useState([]);
  const [topSellers, setTopSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [forecastSummary, setForecastSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    async function loadAIMetrics() {
      try {
        const [m, t] = await Promise.all([
          forecastingService.getModelMetrics(),
          forecastingService.getTopPredictedSellers(7, 5)
        ]);
        setMetrics(m);
        setTopSellers(t);
      } catch (err) {
        console.error("AI metrics load failed:", err);
      }
    }
    loadAIMetrics();
  }, []);

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

  const ragKnowledgeBase = [
    { name: 'Store Policies',       key: 'store_policies',      count: 'Live from DB' },
    { name: 'Store FAQs',           key: 'store_faqs',          count: 'Live from DB' },
    { name: 'Product Descriptions', key: 'rag_document_chunks', count: 'Live from DB' },
    { name: 'Sales History',        key: 'sales_forecasts',     count: 'Indexed'      },
  ];
  // Map top sellers to chart format
  const chartData = topSellers.map(ts => ({
    label: ts.product_name.substring(0, 5),
    value: ts.total_predicted
  }));

  const forecastTotal = topSellers.reduce((acc, s) => acc + s.total_predicted, 0);

  return (
    <AdminLayout>
      <div className="flex items-center gap-2 text-xs mb-1 text-[#94a3b8]">
        <span>scikit-learn</span><span>·</span><span>RAG Chatbot</span>
      </div>
      <PageHeader
        title="AI Intelligence"
        actions={
          <div className="flex gap-2">
            <button 
              onClick={async () => {
                setLoading(true);
                try {
                  await forecastingService.bulkGenerateForecasts(30);
                  alert('Forecasts updated for all products');
                  window.location.reload();
                } catch (err) {
                  alert('Bulk generation failed');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="btn-secondary text-xs"
            >{loading ? 'Retraining...' : 'Retrain All Models'}</button>
            <span className="ai-badge">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="6" cy="6" r="2"/><path d="M6 1v1M6 10v1M1 6h1M10 6h1" strokeLinecap="round"/>
              </svg>
              AI Powered
            </span>
          </div>
        }
      />
      <div className="grid grid-cols-2 gap-4 mb-4">
        <SectionCard title="Top Predicted Sellers — Next 7 Days">
          <div className="px-5 pb-4 pt-3">
            {chartData.length > 0 ? (
              <BarChart data={chartData} height={120} />
            ) : (
              <div className="h-[120px] flex items-center justify-center text-sm text-[#94a3b8]">Run forecast to see data</div>
            )}
            <div className="flex gap-6 mt-3">
              <div><p className="text-[10px] uppercase text-[#94a3b8]">Total Predicted Qty</p><p className="text-sm font-semibold text-[#0f172a]">{forecastTotal.toFixed(0)} units</p></div>
              <div><p className="text-[10px] uppercase text-[#94a3b8]">Peak Product</p><p className="text-sm font-semibold text-[#0f172a]">{topSellers[0]?.product_name || 'N/A'}</p></div>
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
        <SectionCard title="AI Assistant Summary">
          <div className="px-5 py-4 min-h-[140px] flex flex-col justify-center">
            {!forecastSummary && !summaryLoading && (
              <div className="text-center">
                <p className="text-sm text-[#475569] mb-4">
                  Have the AI analyze your forecast data and provide a quick executive summary.
                </p>
                <button 
                  onClick={async () => {
                    setSummaryLoading(true);
                    try {
                      const prompt = `As a friendly AI retail assistant, please write a brief, 2-sentence summary of our top forecasted sellers for the next 7 days based on this data: ${JSON.stringify(topSellers.map(x => ({name: x.product_name, qty: x.total_predicted})))} Make it sound encouraging for the shop owner.`;
                      const res = await chatbotService.sendMessage(prompt);
                      setForecastSummary(res.response);
                    } catch (e) {
                      setForecastSummary('Failed to generate summary.');
                    } finally {
                      setSummaryLoading(false);
                    }
                  }}
                  className="text-sm font-medium px-4 py-2 rounded-lg bg-[#1e3a5f] text-white hover:bg-[#16324f] transition-all duration-150 inline-flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  Generate Forecast Summary
                </button>
              </div>
            )}
            {summaryLoading && <p className="text-sm text-[#94a3b8] italic text-center animate-pulse py-6">AI is analyzing the forecast...</p>}
            {forecastSummary && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#1e3a5f] flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="6" r="2"/><path d="M6 1v1M6 10v1M1 6h1M10 6h1" strokeLinecap="round"/></svg>
                  AI Insight
                </p>
                <p className="text-[15px] text-[#475569] leading-relaxed">
                  {forecastSummary}
                </p>
                <button onClick={() => setForecastSummary('')} className="text-xs text-[#3b82f6] hover:underline mt-2 inline-block">Reset Summary</button>
              </div>
            )}
          </div>
        </SectionCard>
        <SectionCard title="RAG Knowledge Base" headerRight={
          <button 
            onClick={async () => {
              try {
                const res = await chatbotService.ingestData();
                alert('Successfully synced knowledge base: ' + res.message);
              } catch (err) {
                alert('Failed to sync: ' + err.message);
              }
            }}
            className="text-[10px] font-semibold px-2 py-1 rounded bg-[#eff6ff] text-[#1e3a5f] hover:bg-[#dbeafe] transition-colors"
          >Sync Now</button>
        }>
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
