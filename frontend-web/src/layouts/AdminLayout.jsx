// src/layouts/AdminLayout.jsx
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen" style={{ background: '#f0f4f8' }}>
      <AdminSidebar />
      <AdminNavbar />
      <main
        className="fade-in"
        style={{ marginLeft: '192px', marginTop: '52px', minHeight: 'calc(100vh - 52px)', padding: '32px' }}
      >
        {children}
      </main>
    </div>
  );
}
