// src/context/AdminContext.jsx
import { createContext, useContext, useState } from 'react';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editTarget, setEditTarget] = useState(null); // shared edit payload across pages

  function navigateTo(page, payload = null) {
    setEditTarget(payload);
    setCurrentPage(page);
  }

  return (
    <AdminContext.Provider value={{ currentPage, setCurrentPage, navigateTo, sidebarOpen, setSidebarOpen, editTarget, setEditTarget }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside <AdminProvider>');
  return ctx;
}
