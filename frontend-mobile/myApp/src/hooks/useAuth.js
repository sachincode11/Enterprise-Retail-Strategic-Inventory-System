import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest, saveSession, clearSession } from '../services/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('@invo6_user');
        if (stored) setUser(JSON.parse(stored));
        
        // Test backend connectivity
        apiRequest('/health', { withAuth: false })
          .then(res => console.log("[Auth] Backend connection verified:", res.status))
          .catch(err => console.error("[Auth] Backend connection failed! Check your LAN IP and Firewall.", err.message));
          
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  // ── Login ────────────────────────────────────────────────
  const login = async ({ email, password }) => {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
      withAuth: false
    });

    if (data.requires_otp) {
      // Handle OTP flow if needed, but for customers it's usually skipped
      return data;
    }

    const sessionUser = {
      id: data.user.id,
      fullName: data.user.name,
      email: data.user.email,
      phone: data.user.phone,
      avatar: data.user.initials,
      storeId: data.user.storeId,
      roles: data.user.roles,
      verified: data.user.verified,
    };

    setUser(sessionUser);
    await saveSession({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: sessionUser
    });
    await AsyncStorage.setItem('@invo6_user', JSON.stringify(sessionUser));
  };

  // ── Register ─────────────────────────────────────────────
  const register = async ({ fullName, email, phone, password, username }) => {
    const [first_name, ...last_parts] = fullName.split(' ');
    const last_name = last_parts.join(' ');

    return await apiRequest('/auth/register', {
      method: 'POST',
      body: { 
        first_name,
        last_name: last_name || '',
        email, 
        phone, 
        password,
        username: username || email.split('@')[0]
      },
      withAuth: false
    });
  };

  // ── Verify OTP ───────────────────────────────────────────
  const verifyOTP = async ({ email, otp_code, purpose }) => {
    const data = await apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: { email, otp_code, purpose },
      withAuth: false
    });

    const sessionUser = {
      id: data.user.id,
      fullName: data.user.name,
      email: data.user.email,
      phone: data.user.phone,
      avatar: data.user.initials,
      storeId: data.user.storeId,
      roles: data.user.roles,
      verified: data.user.verified,
    };

    setUser(sessionUser);
    await saveSession({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: sessionUser
    });
    await AsyncStorage.setItem('@invo6_user', JSON.stringify(sessionUser));
    return data;
  };

  // ── Resend OTP ───────────────────────────────────────────
  const resendOTP = async ({ email, purpose }) => {
    return await apiRequest('/auth/resend-otp', {
      method: 'POST',
      body: { email, purpose },
      withAuth: false
    });
  };

  const logout = async () => {
    console.log("Auth: Logout initiated");
    // 1. Instantly clear local state for responsive UI
    setUser(null);
    
    try {
      const sessionStr = await AsyncStorage.getItem('@invo6_session');
      await clearSession();
      console.log("Auth: Local session cleared");

      // 2. Background notify backend
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (session.refreshToken) {
          apiRequest('/auth/logout', {
            method: 'POST',
            body: { refresh_token: session.refreshToken }
          }).catch(err => console.log("Auth: Backend logout notification failed (ignoring)"));
        }
      }
    } catch (e) {
      console.log("Auth: Logout cleanup completed with background error:", e.message);
    }
  };

  // ── Refresh user (e.g. after profile update) ─────────────
  const refreshUser = async () => {
    try {
      const data = await apiRequest('/auth/me');
      const sessionUser = {
        id: data.user.id,
        fullName: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        avatar: data.user.initials,
        storeId: data.user.storeId,
        verified: data.user.verified,
      };
      setUser(sessionUser);
      await AsyncStorage.setItem('@invo6_user', JSON.stringify(sessionUser));
    } catch (e) {
      console.error("Refresh user failed", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyOTP, resendOTP, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

