import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

// Mock user — replace with real auth API responses
const MOCK_USER = {
  id: 'usr_001',
  fullName: 'simona kattel',
  email: 'simona@gmail.com',
  phone: '+977-9801234567',
  avatar: 'SK',
  verified: true,
  orders: 24,
  totalSpent: 18400,
  totalSaved: 1200,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('@invo6_user');
        if (stored) setUser(JSON.parse(stored));
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  // ── Login ────────────────────────────────────────────────
  // Replace with: POST /api/auth/login { email, password }
  
  const login = async ({ email, password }) => {
    await new Promise(r => setTimeout(r, 800));

    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    const cleanEmail = email.trim().toLowerCase();

    // FIX C (strict login)
    if (cleanEmail !== 'simona@gmail.com' || password !== 'simona123') {
      throw new Error('Invalid email or password.');
    }

    const sessionUser = {
      ...MOCK_USER,
      email: cleanEmail,
      fullName: 'Simona Kattel',
      avatar: 'SK',
    };

    setUser(sessionUser);
    await AsyncStorage.setItem('@invo6_user', JSON.stringify(sessionUser));
  };

 
  // ── Register ─────────────────────────────────────────────
  // Replace with: POST /api/auth/register { fullName, email, phone, password }
  const register = async ({ fullName, email, phone, password }) => {
    await new Promise(r => setTimeout(r, 800));
    const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const newUser = { ...MOCK_USER, fullName, email, phone, avatar: initials };
    setUser(newUser);
    await AsyncStorage.setItem('@invo6_user', JSON.stringify(newUser));
  };

  // ── Logout ───────────────────────────────────────────────
  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('@invo6_user');
  };

  // ── Refresh user (e.g. after profile update) ─────────────
  // Replace with: GET /api/auth/me
  const refreshUser = async () => {
    const stored = await AsyncStorage.getItem('@invo6_user');
    if (stored) setUser(JSON.parse(stored));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
