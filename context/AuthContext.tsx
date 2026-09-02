import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useQueryClient } from '@tanstack/react-query';
import { login as loginService, logoutService, signUp as signUpService } from '@/services/authService';
import { timezone } from '@/services/apiClient';

export type AuthContextType = {
  isLoading: boolean;
  isAuthenticated: boolean;
  userName: string;
  login: (username: string, password: string) => Promise<void>;
  signUp: (name: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const decodeName = (token: string | null) => {
  try {
    if (!token) return '';
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.name ?? '';
  } catch {
    return '';
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);
  const qc = useQueryClient();

  useEffect(() => {
    SecureStore.getItemAsync('authToken').then((t) => { setToken(t); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const accept = useCallback(async (access: string, refresh: string) => {
    await Promise.all([SecureStore.setItemAsync('authToken', access), SecureStore.setItemAsync('refreshToken', refresh)]);
    setToken(access);
  }, []);

  const login = useCallback(async (username: string, password: string) => { const t = await loginService(username, password); await accept(t.accessToken, t.refreshToken); }, [accept]);
  const signUp = useCallback(async (name: string, username: string, password: string) => { const t = await signUpService(name, username, password, timezone); await accept(t.accessToken, t.refreshToken); }, [accept]);
  const logout = useCallback(async () => {
    await logoutService();
    await Promise.all([SecureStore.deleteItemAsync('authToken'), SecureStore.deleteItemAsync('refreshToken')]);
    qc.clear();
    setToken(null);
  }, [qc]);

  return <AuthContext.Provider value={{ isLoading, isAuthenticated: !!token, userName: decodeName(token), login, signUp, logout }}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
};
