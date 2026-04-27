// src/context/AuthContext.jsx
import { createContext, useContext, useState, useCallback } from 'react';
import {
  login as loginService,
  logout as logoutService,
  verifyOtp as verifyOtpService,
  getSession,
  getPendingLogin,
} from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getSession() || getPendingLogin());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const res = await loginService(credentials);
      setUser(res.data);
      return res.data;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutService();
    setUser(null);
  }, []);

  const verifyOtp = useCallback(async ({ otp }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await verifyOtpService({ otp });
      setUser(res.data);
      return res.data;
    } catch (err) {
      setError(err.message || 'OTP verification failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, verifyOtp, loading, error, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
