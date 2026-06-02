import { apiRequest } from '@/lib/api/client';

async function safeGet(path) {
  try {
    const res = await apiRequest(path, { method: 'GET' });
    return res?.data ?? res;
  } catch (err) {
    console.error(`[cotacoes] GET ${path} falhou:`, err?.message ?? err);
    throw err;
  }
}

export async function getCotacaoStats() {
  return safeGet('/cotacoes/stats');
}

export async function listCotacoes(filters = {}) {
  const q = new URLSearchParams();
  if (filters.status)    q.set('status',    filters.status);
  if (filters.clienteId) q.set('clienteId', filters.clienteId);
  if (filters.from)      q.set('from',      filters.from);
  if (filters.to)        q.set('to',        filters.to);
  if (filters.page)      q.set('page',      String(filters.page));
  if (filters.limit)     q.set('limit',     String(filters.limit));
  const qs = q.toString();
  return safeGet(qs ? `/cotacoes?${qs}` : '/cotacoes');
}

export async function getCotacao(id) {
  return safeGet(`/cotacoes/${id}`);
}

export async function createCotacao(data) {
  return apiRequest('/cotacoes', { method: 'POST', body: data });
}

export async function updateCotacao(id, data) {
  return apiRequest(`/cotacoes/${id}`, { method: 'PUT', body: data });
}

export async function recalculateCotacao(id) {
  return apiRequest(`/cotacoes/${id}/recalculate`, { method: 'POST', body: {} });
}

export async function updateCotacaoStatus(id, status, opts = {}) {
  return apiRequest(`/cotacoes/${id}/status`, { method: 'PUT', body: { status, ...opts } });
}

export async function convertCotacao(id) {
  return apiRequest(`/cotacoes/${id}/convert`, { method: 'POST', body: {} });
}
