'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getProfile,
  login as loginApi,
  logout as logoutApi,
  registerCompany as registerCompanyApi,
} from '@/lib/api/services/auth';
import { clearAuthSession, getAccessToken, getAuthUser, setAuthSession, setTenantId } from '@/lib/auth/session';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading'); // loading | authenticated | guest
  const [user, setUser] = useState(() => getAuthUser());

  const hydrate = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setStatus('guest');
      setUser(null);
      return;
    }

    try {
      const profile = await getProfile();
      // profile vem do JWT (sub/email/tenantId)
      if (profile) {
        const storedUser = getAuthUser();
        const mergedUser = storedUser ? { ...storedUser, ...profile } : profile;
        setAuthSession({ user: mergedUser });
        setUser(mergedUser);
        // Garante que tenantId está sempre salvo no localStorage para o tema público
        const tid = mergedUser?.tenantId ?? mergedUser?.tenant_id;
        if (tid) setTenantId(tid);
      }
      setStatus('authenticated');
    } catch (error) {
      const cachedUser = getAuthUser();
      
      if (cachedUser) {
        setUser(cachedUser);
        setStatus('authenticated');
        // Tenta persistir tenantId mesmo usando cache
        const tid = cachedUser?.tenantId ?? cachedUser?.tenant_id;
        if (tid) setTenantId(tid);
        console.warn('⚠️ getProfile() falhou, usando perfil em cache:', error.message);
      } else {
        console.error('❌ Sem cache e token inválido, deslogando:', error.message);
        clearAuthSession();
        setUser(null);
        setStatus('guest');
      }
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const login = useCallback(async ({ email, password, tenantId }) => {
    setStatus('loading');
    const result = await loginApi({ email, password, tenantId });
    setUser(result?.user || null);
    setStatus('authenticated');
    return result;
  }, []);

  const registerCompany = useCallback(
    async ({ name, email, password, companyName, subdomain }) => {
      setStatus('loading');
      const result = await registerCompanyApi({
        name,
        email,
        password,
        companyName,
        subdomain,
      });
      setUser(result?.user || null);
      // Persiste tenantId para tema público na tela de login
      const tid = result?.user?.tenantId ?? result?.user?.tenant_id;
      if (tid) setTenantId(tid);
      setStatus('authenticated');
      return result;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // ignore
    } finally {
      clearAuthSession();
      setUser(null);
      setStatus('guest');
    }
  }, []);

  const value = useMemo(
    () => ({
      status,
      user,
      isAuthenticated: status === 'authenticated',
      login,
      registerCompany,
      logout,
      refreshProfile: hydrate,
    }),
    [status, user, login, registerCompany, logout, hydrate],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider />');
  }
  return ctx;
}


