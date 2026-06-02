import { apiRequest } from '@/lib/api/client';
import { resolveApiBaseUrl } from '@/lib/api/config';

const emptyTheme = {
  primaryColor: '',
  secondaryColor: '',
  logoUrl: '',
  dashboardLogoUrl: '',
  description: '',
  loginTitle: '',
  loginRightTitle: '',
  loginRightDescription: '',
};

// Normaliza a resposta do backend (tenant.metadata ou campos diretos)
function normalizeTheme(data) {
  if (!data) return emptyTheme;
  // O backend pode retornar os campos em metadata ou no nível raiz
  const src = data.metadata ?? data;
  return {
    primaryColor:          src.primaryColor          ?? data.primaryColor          ?? '',
    secondaryColor:        src.secondaryColor        ?? data.secondaryColor        ?? '',
    logoUrl:               src.logoUrl               ?? data.logoUrl               ?? '',
    dashboardLogoUrl:      src.dashboardLogoUrl      ?? data.dashboardLogoUrl      ?? '',
    description:           src.description           ?? data.description           ?? '',
    loginTitle:            src.loginTitle            ?? data.loginTitle            ?? '',
    loginRightTitle:       src.loginRightTitle       ?? data.loginRightTitle       ?? '',
    loginRightDescription: src.loginRightDescription ?? data.loginRightDescription ?? '',
  };
}

/**
 * Retorna o tema do tenant (autenticado) via GET /admin/party-profile
 */
export async function getTheme() {
  try {
    const res = await apiRequest('/admin/party-profile', { method: 'GET' });
    // A API pode responder { success, data } ou o objeto direto
    const raw = res?.data ?? res;
    return normalizeTheme(raw);
  } catch {
    return emptyTheme;
  }
}

/**
 * Atualiza o tema do tenant via PUT /admin/party-profile
 * Os campos são salvos em metadata no schema Tenant.
 */
export async function updateTheme(partyProfile) {
  const res = await apiRequest('/admin/party-profile', {
    method: 'PUT',
    body: { metadata: partyProfile },
  });
  if (res?.success === false) throw new Error(res?.message || 'Erro ao atualizar aparência');
  const raw = res?.data ?? res;
  return normalizeTheme(raw);
}

/**
 * Retorna o tema público (sem autenticação) para a tela de login.
 * GET /admin/party-profile/public?tenantId=xxx  — fallback para emptyTheme se 404.
 */
export async function getThemePublic(tenantId) {
  if (!tenantId?.trim()) return emptyTheme;
  try {
    const baseUrl = await resolveApiBaseUrl();
    const url = `${baseUrl.replace(/\/+$/, '')}/admin/party-profile/public?tenantId=${encodeURIComponent(tenantId.trim())}`;
    const res = await fetch(url, { method: 'GET', cache: 'no-store' });
    if (!res.ok) return emptyTheme;
    const json = await res.json().catch(() => null);
    return normalizeTheme(json?.data ?? json);
  } catch {
    return emptyTheme;
  }
}
