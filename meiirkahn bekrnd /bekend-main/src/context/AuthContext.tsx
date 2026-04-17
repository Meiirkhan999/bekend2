import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { User, AuthState } from '../types/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const apiBaseUrl = useMemo(() => import.meta.env.VITE_BACKEND_URL || '', []);
  const apiEndpoint = useCallback((path: string) => `${apiBaseUrl}${path}`, [apiBaseUrl]);

  useEffect(() => {
    const token = localStorage.getItem('labSupplyToken');
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(apiEndpoint('/api/auth/me'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Session expired');
        }
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
        setIsAuthenticated(true);
        localStorage.setItem('labSupplyUser', JSON.stringify(data.user));
      })
      .catch(() => {
        localStorage.removeItem('labSupplyToken');
        localStorage.removeItem('labSupplyUser');
        setUser(null);
        setIsAuthenticated(false);
      })
      .finally(() => setLoading(false));
  }, []);

  const saveSession = (userData: User, token: string) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('labSupplyToken', token);
    localStorage.setItem('labSupplyUser', JSON.stringify(userData));
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await fetch(apiEndpoint('/api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    saveSession(data.user, data.token);
  };

  const login = async (email: string, password: string) => {
    const response = await fetch(apiEndpoint('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    saveSession(data.user, data.token);
  };

  const adminLogin = async (email: string, password: string) => {
    const response = await fetch(apiEndpoint('/api/admin/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Admin login failed');
    }

    saveSession(data.user, data.token);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('labSupplyToken');
    localStorage.removeItem('labSupplyUser');
  };

  const resetPassword = async (email: string) => {
    const response = await fetch(apiEndpoint('/api/auth/reset'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Password reset failed');
    }

    alert(data.message);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, adminLogin, register, logout, resetPassword }}>
      {loading ? <div className="auth-loading">Жүктелуде...</div> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
