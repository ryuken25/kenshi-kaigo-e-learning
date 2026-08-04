import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authenticated | guest

  const fetchSession = useCallback(async () => {
    try {
      const r = await fetch('/api/auth/session', { credentials: 'same-origin' });
      const d = await r.json();
      if (d.user) {
        setUser(d.user);
        setStatus('authenticated');
      } else {
        setUser(null);
        setStatus('guest');
      }
    } catch {
      setUser(null);
      setStatus('guest');
    }
  }, []);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  const logout = useCallback(async () => {
    try { await fetch('/api/auth/session', { method: 'DELETE', credentials: 'same-origin' }); } catch {}
    setUser(null);
    setStatus('guest');
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, isAuthenticated: status === 'authenticated', refresh: fetchSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
