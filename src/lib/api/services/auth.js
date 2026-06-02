import { apiRequest } from '@/lib/api/client';
import { setAuthSession, setTenantId } from '@/lib/auth/session';

export async function login({ email, password, tenantId }) {
  const payload = { email, password, ...(tenantId ? { tenantId } : {}) };
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    auth: false,
    body: payload,
  });

  // Login do backend já retorna {access_token, refresh_token, user, ...}
  setAuthSession(data);
  // Persiste tenantId para tema público na tela de login (próxima visita)
  const tid = data?.user?.tenantId ?? data?.user?.tenant_id;
  if (tid) setTenantId(tid);
  return data;
}

export async function registerCompany({ name, email, password, companyName, subdomain }) {
  const payload = {
    name,
    email,
    password,
    companyName,
    ...(subdomain ? { subdomain } : {}),
  };

  const data = await apiRequest('/auth/register-company', {
    method: 'POST',
    auth: false,
    body: payload,
  });

  // Backend retorna tokens + user com tenantId
  setAuthSession(data);
  const tid = data?.user?.tenantId ?? data?.user?.tenant_id;
  if (tid) setTenantId(tid);
  return data;
}

export async function refresh(refresh_token) {
  return await apiRequest('/auth/refresh', {
    method: 'POST',
    auth: false,
    body: { refresh_token },
  });
}

export async function getProfile() {
  return await apiRequest('/auth/profile', { method: 'GET' });
}

export async function logout() {
  return await apiRequest('/auth/logout', { method: 'POST' });
}

