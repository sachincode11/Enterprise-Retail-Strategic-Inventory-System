// src/context/AdminContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';

const AdminContext = createContext(null);

function getAdminPageFromHash() {
  const hash = window.location.hash || '';
  const [scope, page] = hash.replace(/^#\//, '').split('/');
  if (scope !== 'admin') return 'dashboard';
  return page || 'dashboard';
}

function setAdminHash(page) {
  const nextPage = page || 'dashboard';
  const nextHash = `#/admin/${nextPage}`;
  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash;
  }
}

export function AdminProvider({ children }) {
  const [currentPageState, setCurrentPageState] = useState(getAdminPageFromHash);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editTarget, setEditTarget] = useState(null); // shared edit payload across pages

  function setCurrentPage(page) {
    setCurrentPageState(page);
    setAdminHash(page);
  }

  useEffect(() => {
    const onHashChange = () => setCurrentPageState(getAdminPageFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  function navigateTo(page, payload = null) {
    setEditTarget(payload);
    setCurrentPage(page);
  }

  return (
    <AdminContext.Provider value={{ currentPage: currentPageState, setCurrentPage, navigateTo, sidebarOpen, setSidebarOpen, editTarget, setEditTarget }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside <AdminProvider>');
  return ctx;
}
