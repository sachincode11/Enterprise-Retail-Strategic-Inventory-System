import { useState, useRef, useEffect } from 'react';
import chatbotService from '../services/chatbotService';

const INITIAL_MESSAGES = [
  { role: 'assistant', text: 'Hi! I am your InvoSix AI assistant. Ask me about sales, inventory, staff, or anything about the store.' },
];

export default function ChatbotButton() {
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState(INITIAL_MESSAGES);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const bottomRef                 = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);

    try {
      const data = await chatbotService.sendMessage(text);
      setMessages(prev => [...prev, { role: 'assistant', text: data.response }]);
    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later." 
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Chat window */}
      {open && (
        <div
          className="fixed bottom-20 right-6 z-50 flex flex-col"
          style={{ width: 340, height: 460, background: 'white', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', border: '1px solid #e2e8f0' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#e2e8f0] rounded-t-2xl" style={{ background: '#1e3a5f' }}>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                <circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-semibold">InvoSix AI</p>
              <p className="text-white/60 text-xs">Store assistant</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white transition-colors">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed"
                  style={m.role === 'user'
                    ? { background: '#1e3a5f', color: 'white', borderRadius: '12px 12px 2px 12px' }
                    : { background: '#f1f5f9', color: '#0f172a', borderRadius: '12px 12px 12px 2px' }
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-xl text-sm" style={{ background: '#f1f5f9', borderRadius: '12px 12px 12px 2px' }}>
                  <span style={{ display: 'inline-flex', gap: 3 }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8', display: 'block', animation: 'bounce 1s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-[#e2e8f0] flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask about sales, stock, staff..."
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-[#e2e8f0] outline-none focus:border-[#1e3a5f] bg-[#f8fafc]"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-40"
              style={{ background: '#1e3a5f' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-13 h-13 rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(30,58,95,0.38)] transition-all hover:scale-110 active:scale-95"
        style={{ width: 52, height: 52, background: '#1e3a5f' }}
        title="AI Assistant"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
            <circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round"/>
          </svg>
        )}
      </button>
    </>
  );
}
