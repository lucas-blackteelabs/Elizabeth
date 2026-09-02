'use client';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { appRoutes } from '@/config/appRoutes';
import { tokenStorage } from '@/lib/utils/auth/authStorage';
import { getUserInfoFromToken, UserInfo } from '@/lib/utils/auth/jwtUtils';
import { login as loginService, signUp as signUpService, signOut as signOutService, LoginRequest, SignUpRequest } from '@/services/auth.service';

type AuthContextType = {
  isReady: boolean;
  isAuthenticated: boolean;
  user: UserInfo | null;
  login: (req: LoginRequest) => Promise<void>;
  signUp: (req: SignUpRequest) => Promise<void>;
  logout: () => Promise<void>;
  isPending: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isReady, setReady] = useState(false);
  const [isPending, setPending] = useState(false);

  useEffect(() => {
    const token = tokenStorage.getAccessToken();
    const info = token ? getUserInfoFromToken(token) : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(info);
    setReady(true);
  }, []);

  const accept = useCallback((access: string, refresh: string) => {
    tokenStorage.setTokens(access, refresh);
    setUser(getUserInfoFromToken(access));
  }, []);

  const login = useCallback(async (req: LoginRequest) => {
    setPending(true);
    try {
      const { data } = await loginService(req);
      accept(data.accessToken, data.refreshToken);
      router.replace(appRoutes.tonight);
    } catch {
      toast.error('That email and password did not match.');
    } finally {
      setPending(false);
    }
  }, [accept, router]);

  const signUp = useCallback(async (req: SignUpRequest) => {
    setPending(true);
    try {
      const { data } = await signUpService({ ...req, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
      accept(data.accessToken, data.refreshToken);
      router.replace(appRoutes.welcome);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Could not create the account.');
    } finally {
      setPending(false);
    }
  }, [accept, router]);

  const logout = useCallback(async () => {
    try { await signOutService(); } catch {}
    tokenStorage.clear();
    setUser(null);
    queryClient.clear();
    router.replace(appRoutes.auth.login);
  }, [queryClient, router]);

  return <AuthContext.Provider value={{ isReady, isAuthenticated: !!user, user, login, signUp, logout, isPending }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
