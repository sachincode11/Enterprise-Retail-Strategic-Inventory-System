// src/pages/admin/Chatbot.jsx
import { useState, useRef, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { useAdmin } from '../../context/AdminContext';

const initialMessages = [{ role: 'ai', text: "Hi! I'm your Store Intelligence Assistant. Ask me anything about sales, inventory, staff performance, or forecasts.", time: '09:00 AM' }];
const quickPrompts = ['What were our top 3 products last month?','Which products need restocking now?',"Show this week's revenue summary",'Who is the top cashier this month?','Forecast for next 7 days','Current low stock items?'];
const aiReplies = {
  default:  "Based on your store data, I've analyzed the relevant records. Your store (KTM-001) is performing well with Rs 84,210 in revenue today. Would you like a breakdown by category or cashier?",
  restock:  "Current low stock items:\n\n1. Tata Salt 1kg — 2 units left (reorder at 15)\n2. Surf Excel 500g — Out of stock\n3. Nescafé Classic 100g — 4 units (reorder at 20)\n\nRecommendation: Place a purchase order with Himalaya Dist. today.",
  revenue:  "This week's revenue summary:\n\n• Mon: Rs 71,000\n• Tue: Rs 58,000\n• Wed: Rs 101,200\n• Thu: Rs 68,000\n• Fri: Rs 75,000\n• Sat: Rs 82,000\n• Today: Rs 84,210 ↑\n\nTotal: Rs 5.39L — up 12% vs last week.",
  top:      "Top 3 products last month:\n\n1. Organic Basmati Rice 5kg — Rs 4.2L (1,240 units)\n2. Amul Full Cream Milk 1L — Rs 2.9L (3,410 units)\n3. Coca-Cola 500ml — Rs 1.4L (2,100 units)\n\nThese three account for 36% of total revenue.",
  cashier:  "Top cashier this month:\n\n🥇 Priya Shrestha — 842 transactions, Rs 6.1L revenue\n🥈 Kasim Rijal — 714 transactions, Rs 5.2L revenue\n🥉 Roshan KC — 684 transactions, Rs 4.9L revenue",
  forecast: "7-Day Sales Forecast (AI Model — 87% confidence):\n\n• Mon: Rs 78,000\n• Tue: Rs 81,000\n• Wed: Rs 92,000 ↑ (peak)\n• Thu: Rs 74,000\n• Fri: Rs 69,000\n• Sat: Rs 88,000\n• Sun: Rs 95,000 ↑\n\nForecast total: Rs 5.77L",
};
function getReply(msg) {
  const m = msg.toLowerCase();
  if (m.includes('restock') || m.includes('stock') || m.includes('low')) return aiReplies.restock;
  if (m.includes('revenue') || m.includes('week') || m.includes('sales')) return aiReplies.revenue;
  if (m.includes('top') || m.includes('product') || m.includes('best'))   return aiReplies.top;
  if (m.includes('cashier') || m.includes('staff'))                        return aiReplies.cashier;
  if (m.includes('forecast') || m.includes('next') || m.includes('predict')) return aiReplies.forecast;
  return aiReplies.default;
}

export default function Chatbot() {
  const { setCurrentPage } = useAdmin();
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput]       = useState('');
  const [typing, setTyping]     = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  const sendMessage = (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { role: 'user', text: msg, time: now }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, { role: 'ai', text: getReply(msg), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }, 1200);
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <button onClick={() => setCurrentPage('ai')} className="text-xs text-[#94a3b8] hover:text-[#1e3a5f] transition-colors mb-1 flex items-center gap-1">← Back to AI Forecasting</button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: '#1e3a5f', color: '#93c5fd' }}>AI</div>
            <div>
              <h1 className="text-xl font-semibold text-[#0f172a]">Store Intelligence Chatbot</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                <span className="text-xs text-[#94a3b8]">RAG · Online · KTM-001</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: '#dbeafe', color: '#1d4ed8' }}>RAG Powered</span>
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: '#dcfce7', color: '#15803d' }}>88% Accuracy</span>
          <button onClick={() => setMessages(initialMessages)} className="text-xs px-3 py-1.5 rounded-lg border hover:bg-[#eff6ff] hover:text-[#1e3a5f] transition-all" style={{ borderColor: '#e2e8f0', color: '#475569' }}>Clear Chat</button>
        </div>
      </div>

      <div className="flex gap-5" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="flex-1 flex flex-col bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                {msg.role === 'ai' && <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mb-1" style={{ background: '#1e3a5f', color: '#93c5fd' }}>AI</div>}
                <div style={{ maxWidth: '68%' }}>
                  <div className="px-4 py-3 rounded-2xl text-sm whitespace-pre-line"
                    style={msg.role === 'user'
                      ? { background: '#1e3a5f', color: '#fff', borderBottomRightRadius: 4 }
                      : { background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', borderBottomLeftRadius: 4 }}
                  >{msg.text}</div>
                  <p className="text-[10px] mt-1 px-1" style={{ color: '#94a3b8', textAlign: msg.role === 'user' ? 'right' : 'left' }}>{msg.time}</p>
                </div>
                {msg.role === 'user' && <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0 mb-1" style={{ background: '#475569' }}>AS</div>}
              </div>
            ))}
            {typing && (
              <div className="flex items-end gap-2 justify-start">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: '#1e3a5f', color: '#93c5fd' }}>AI</div>
                <div className="px-4 py-3 rounded-2xl flex items-center gap-1.5" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderBottomLeftRadius: 4 }}>
                  {[0, 1, 2].map(d => <span key={d} className="w-2 h-2 rounded-full" style={{ background: '#94a3b8', animation: `bounce 1s ease-in-out ${d * 0.15}s infinite` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="border-t p-4" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about sales, inventory, forecasts, staff performance..." className="input-field flex-1" />
              <button onClick={() => sendMessage()} disabled={!input.trim() || typing}
                className="px-5 py-2 rounded-lg text-sm font-medium text-white transition-all"
                style={{ background: input.trim() && !typing ? '#1e3a5f' : '#94a3b8', cursor: input.trim() && !typing ? 'pointer' : 'not-allowed' }}
              >Send</button>
            </div>
          </div>
        </div>
        <div className="w-56 flex-shrink-0 space-y-4">
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#e2e8f0' }}>
            <p className="text-xs font-mono uppercase tracking-widest text-[#94a3b8] mb-3">Quick Prompts</p>
            <div className="space-y-2">
              {quickPrompts.map(p => (
                <button key={p} onClick={() => sendMessage(p)}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg border transition-all hover:bg-[#eff6ff] hover:text-[#1e3a5f] hover:border-[#bfdbfe]"
                  style={{ borderColor: '#e2e8f0', color: '#475569' }}
                >{p}</button>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#e2e8f0' }}>
            <p className="text-xs font-mono uppercase tracking-widest text-[#94a3b8] mb-3">Data Sources</p>
            <div className="space-y-2">
              {['Sales Transactions','Inventory Records','Staff Logs','Customer Data','Store FAQs'].map(src => (
                <div key={src} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] flex-shrink-0" />
                  <span className="text-xs text-[#475569]">{src}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
