// src/context/AuthContext.jsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { onAuthError } from '../services/apiClient';
import {
  login as loginService,
  logout as logoutService,
  verifyOtp as verifyOtpService,
  resendOtp as resendOtpService,
  updateProfile as updateProfileService,
  changePassword as changePasswordService,
  getSession,
  getPendingLogin,
} from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getSession() || getPendingLogin());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showWarning, setShowWarning] = useState(false);

  const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 Hour
  const WARNING_BEFORE = 5 * 60 * 1000; // 5 Minutes

  const logout = useCallback(async () => {
    await logoutService();
    setUser(null);
  }, []);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const res = await loginService(credentials);
      setUser(res.data);
      return res.data;
    } catch (err) {
      setError(err?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async ({ otp }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await verifyOtpService({ otp });
      setUser(res.data);
      return res.data;
    } catch (err) {
      setError(err?.message || 'OTP verification failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resendOtp = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await resendOtpService();
      // Reload pending user to show updated debugOtp if needed
      setUser(getPendingLogin());
      return res;
    } catch (err) {
      setError(err?.message || 'Failed to resend OTP');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (profile) => {
    setLoading(true);
    setError(null);
    try {
      const res = await updateProfileService(profile);
      setUser(res.data);
      return res.data;
    } catch (err) {
      setError(err?.message || 'Profile update failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (current_password, new_password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await changePasswordService(current_password, new_password);
      return res;
    } catch (err) {
      setError(err?.message || 'Password change failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const stayLoggedIn = useCallback(() => {
    setShowWarning(false);
  }, []);

  // Auto-logout listener
  useEffect(() => {
    onAuthError(() => {
      const activeSession = getSession();
      if (!activeSession) return;

      logoutService(); // Clear LS
      setUser(null);
      setError('Your session has expired. Please sign in again to continue.');
    });
  }, []);

  // Inactivity Monitor
  useEffect(() => {
    if (!user || user.pending2FA) return;

    let timer;
    let warningTimer;

    const resetTimers = () => {
      setShowWarning(false);
      clearTimeout(timer);
      clearTimeout(warningTimer);

      // Warning after 55 mins
      warningTimer = setTimeout(() => {
        setShowWarning(true);
      }, SESSION_TIMEOUT - WARNING_BEFORE);

      // Logout after 60 mins
      timer = setTimeout(() => {
        logout();
        setError('You have been logged out due to inactivity.');
      }, SESSION_TIMEOUT);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(name => document.addEventListener(name, resetTimers));
    
    resetTimers(); // Start initial timer

    return () => {
      events.forEach(name => document.removeEventListener(name, resetTimers));
      clearTimeout(timer);
      clearTimeout(warningTimer);
    };
  }, [user, logout]);

  return (
    <AuthContext.Provider value={{ 
      user, login, logout, verifyOtp, resendOtp, updateProfile, changePassword,
      loading, error, setError, 
      showWarning, stayLoggedIn 
    }}>
      {children}
      
      {showWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Session Expiring</h3>
            <p className="text-gray-500 mb-8 leading-relaxed">
              You've been inactive for a while. For your security, you will be automatically logged out in <strong>5 minutes</strong>.
            </p>
            <div className="flex gap-3">
              <button onClick={() => logout()} className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                Logout Now
              </button>
              <button onClick={stayLoggedIn} className="flex-1 px-4 py-3 text-sm font-medium text-white bg-[#1e3a5f] rounded-xl hover:bg-[#16324f] shadow-lg shadow-blue-900/20 transition-all">
                Stay Logged In
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
