// src/layouts/CashierLayout.jsx
import CashierSidebar from './CashierSidebar';
import CashierTopbar from './CashierTopbar';
import ChatbotButton from '../components/ChatbotButton';

export default function CashierLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0f172a' }}>
      <CashierSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <CashierTopbar />
        <main className="flex-1 overflow-auto" style={{ background: '#f1f5f9' }}>
          {children}
        </main>
      </div>
      <ChatbotButton />
    </div>
  );
}
