const ACCESS_TOKEN_KEY = 'voxx.access_token';
const REFRESH_TOKEN_KEY = 'voxx.refresh_token';
const USER_KEY = 'voxx.user';
const TENANT_ID_KEY = 'voxx.tenantId';

function safeGet(key) {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function safeRemove(key) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function getAccessToken() {
  return safeGet(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return safeGet(REFRESH_TOKEN_KEY);
}

export function getAuthUser() {
  const raw = safeGet(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuthSession(session) {
  if (!session) return;

  if (session.access_token) safeSet(ACCESS_TOKEN_KEY, session.access_token);
  if (session.refresh_token) safeSet(REFRESH_TOKEN_KEY, session.refresh_token);

  // Só atualiza user se vier no payload
  if (session.user !== undefined) {
    safeSet(USER_KEY, JSON.stringify(session.user));
  }
}

export function clearAuthSession() {
  safeRemove(ACCESS_TOKEN_KEY);
  safeRemove(REFRESH_TOKEN_KEY);
  safeRemove(USER_KEY);
  // NÃO remove TENANT_ID para manter após logout
}

export function getTenantId() {
  return safeGet(TENANT_ID_KEY);
}

export function setTenantId(tenantId) {
  if (tenantId) {
    safeSet(TENANT_ID_KEY, tenantId);
  }
}

export function clearTenantId() {
  safeRemove(TENANT_ID_KEY);
}

// ─── Theme cache ────────────────────────────────────────────────────────────
const THEME_CACHE_KEY = 'voxx.theme';
const THEME_CACHE_TTL = 60 * 60 * 1000; // 1 hora em ms
const THEME_CACHE_VERSION = 2; // incrementar quando o schema de campos mudar

export function getCachedTheme() {
  const raw = safeGet(THEME_CACHE_KEY);
  if (!raw) return null;
  try {
    const { data, ts, v } = JSON.parse(raw);
    if (v !== THEME_CACHE_VERSION) return null; // versão antiga → descarta
    if (Date.now() - ts > THEME_CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

export function setCachedTheme(data) {
  if (!data) return;
  safeSet(THEME_CACHE_KEY, JSON.stringify({ data, ts: Date.now(), v: THEME_CACHE_VERSION }));
}

export function clearCachedTheme() {
  safeRemove(THEME_CACHE_KEY);
}

