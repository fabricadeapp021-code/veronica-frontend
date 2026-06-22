import { resolveApiBaseUrl } from './config';
import { ApiError } from './errors';
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  setAuthSession,
} from '@/lib/auth/session';

function joinUrl(baseUrl, path) {
  const base = baseUrl.replace(/\/+$/, '');
  const p = String(path || '');
  if (!p) return base;
  return p.startsWith('/') ? `${base}${p}` : `${base}/${p}`;
}

async function safeParseJson(res) {
  try {
    return await res.json();
  } catch {
    return undefined;
  }
}

async function refreshAccessToken(retryCount = 0) {
  const refresh_token = getRefreshToken();
  if (!refresh_token) {
    console.warn('⚠️ Sem refresh token disponível');
    return null;
  }

  const baseUrl = await resolveApiBaseUrl();
  const url = joinUrl(baseUrl, '/auth/refresh');
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      // Se falhou e ainda temos tentativas, retry
      if (retryCount < 2) {
        console.log(`🔄 Refresh falhou (${res.status}), tentando novamente (${retryCount + 1}/2)...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Aguarda 1s
        return await refreshAccessToken(retryCount + 1);
      }
      console.error('❌ Refresh token inválido ou expirado após retries');
      return null;
    }

    const data = await safeParseJson(res);
    if (!data?.access_token) {
      console.error('❌ Resposta de refresh sem access_token');
      return null;
    }

    // Mantém user atual se backend não retornar; ou atualiza se retornar.
    setAuthSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token || refresh_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      refresh_expires_in: data.refresh_expires_in,
      user: data.user,
    });

    console.log('✅ Refresh token bem-sucedido');
    return data.access_token;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('❌ Timeout no refresh token');
    } else {
      console.error('❌ Erro ao renovar token:', error.message);
    }
    
    // Retry se for erro de rede e ainda temos tentativas
    if (retryCount < 2 && error.name !== 'AbortError') {
      console.log(`🔄 Erro de rede, tentando novamente (${retryCount + 1}/2)...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return await refreshAccessToken(retryCount + 1);
    }
    
    return null;
  }
}

/**
 * Cliente HTTP para a VOXX API.
 *
 * @param {string} path ex: "/auth/login"
 * @param {object} options
 * @param {boolean} [options.auth=true] envia Authorization Bearer automaticamente
 * @param {boolean} [options.retryAuth=true] tenta refresh token 1x em 401
 * @param {any} [options.body] objeto JS para JSON
 * @param {number} [options.timeoutMs=15000] timeout da requisição
 */
export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    headers,
    body,
    auth = true,
    retryAuth = true,
    timeoutMs = 15000,
    signal: externalSignal,
    ...rest
  } = options;

  const baseUrl = await resolveApiBaseUrl();
  const url = joinUrl(baseUrl, path);

  // Detectar se body é FormData
  const isFormData = body instanceof FormData;

  const h = {
    // Não adicionar Content-Type para FormData (browser adiciona automaticamente com boundary)
    ...(body !== undefined && !isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(headers || {}),
  };

  const token = auth ? getAccessToken() : null;
  if (token) h.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  // If caller passed its own signal, abort our controller when it fires too
  externalSignal?.addEventListener('abort', () => controller.abort());

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: h,
      body: body !== undefined ? (isFormData ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal,
      ...rest,
    });
  } catch (err) {
    if (err?.name === 'AbortError') {
      if (externalSignal?.aborted) {
        throw err; // caller cancelled intentionally — re-throw as-is
      }
      throw new ApiError('Tempo limite da requisição excedido. Tente novamente.', { status: 408 });
    }
    console.error('❌ Falha de rede:', { url, method, errorName: err?.name, errorMsg: err?.message, err });
    throw new ApiError('Não foi possível conectar ao servidor. Verifique sua conexão.', { status: 0 });
  } finally {
    clearTimeout(timeoutId);
  }

  // Tenta refresh em 401
  if (res.status === 401 && auth && retryAuth) {
    console.log('🔄 Token expirado (401), tentando refresh...');
    const newToken = await refreshAccessToken();
    if (!newToken) {
      console.error('❌ Refresh token falhou ou expirado');
      clearAuthSession();
      throw new ApiError('Não autenticado', { status: 401 });
    }

    console.log('✅ Token renovado com sucesso');
    const res2 = await fetch(url, {
      method,
      headers: { ...h, Authorization: `Bearer ${newToken}` },
      body: body !== undefined ? (isFormData ? body : JSON.stringify(body)) : undefined,
      ...rest,
    });

    if (!res2.ok) {
      const parsed = await safeParseJson(res2);
      const errorMessage = parsed?.message || 
                           parsed?.error || 
                           (res2.status === 500 ? 'Erro interno do servidor' : 
                            res2.status === 409 ? 'Conflito: já existe um registro com esses dados' :
                            res2.status === 400 ? 'Dados inválidos' :
                            res2.status === 401 ? 'Não autenticado' :
                            res2.status === 403 ? 'Acesso negado' :
                            res2.status === 404 ? 'Não encontrado' :
                            res2.statusText || `Erro HTTP ${res2.status}`);
      
    if (process.env.NODE_ENV === 'development' && res2.status !== 401) {
      console.error(`API Error (retry) [${res2.status}] ${url}`, parsed || errorMessage);
    }
      
      throw new ApiError(errorMessage, {
        status: res2.status,
        body: parsed || null,
      });
    }
    
    // Para status 204 (No Content), retorna um objeto de sucesso
    if (res2.status === 204) {
      return { success: true };
    }
    
    return await safeParseJson(res2);
  }

  if (!res.ok) {
    const parsed = await safeParseJson(res);
    let errorMessage = parsed?.message || 
                      parsed?.error || 
                      (res.status === 500 ? 'Erro interno do servidor' : 
                       res.status === 409 ? 'Conflito: já existe um registro com esses dados' :
                       res.status === 400 ? 'Dados inválidos' :
                       res.status === 401 ? 'Não autenticado' :
                       res.status === 403 ? 'Acesso negado' :
                       res.status === 404 ? 'Não encontrado' :
                       res.statusText || `Erro HTTP ${res.status}`);
    
    // 401 em /auth/profile é esperado (token expirado) — não polui o console
    if (process.env.NODE_ENV === 'development' && res.status !== 401) {
      console.error(`API Error [${res.status}] ${url}`, parsed || errorMessage);
    }
    
    throw new ApiError(errorMessage, {
      status: res.status,
      body: parsed || null,
    });
  }

  // Para status 204 (No Content), retorna um objeto de sucesso
  if (res.status === 204) {
    return { success: true };
  }

  return await safeParseJson(res);
}

/**
 * Fetch para streaming SSE (chat do agente).
 * Retorna a Response para o caller consumir com response.body.getReader().
 * Trata 401 com refresh token.
 *
 * @param {string} path ex: "/agents/definitions/:agentId/chat/stream"
 * @param {object} options
 * @param {object} options.body - payload JSON
 * @returns {Promise<Response>} Response com body stream
 */
export async function fetchStream(path, options = {}) {
  const { body, ...rest } = options;
  const baseUrl = await resolveApiBaseUrl();
  const url = joinUrl(baseUrl, path);

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  });

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      clearAuthSession();
      throw new ApiError('Não autenticado', { status: 401 });
    }
    const res2 = await fetch(url, {
      method: 'POST',
      headers: { ...headers, Authorization: `Bearer ${newToken}` },
      body: body ? JSON.stringify(body) : undefined,
      ...rest,
    });
    if (!res2.ok) {
      const parsed = await safeParseJson(res2);
      throw new ApiError(parsed?.message || parsed?.error || res2.statusText, {
        status: res2.status,
        body: parsed,
      });
    }
    return res2;
  }

  if (!res.ok) {
    const parsed = await safeParseJson(res);
    throw new ApiError(parsed?.message || parsed?.error || res.statusText, {
      status: res.status,
      body: parsed,
    });
  }

  return res;
}
