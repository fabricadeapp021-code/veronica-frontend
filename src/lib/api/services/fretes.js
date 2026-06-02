import { apiRequest } from '@/lib/api/client';

async function safeGet(path) {
  try {
    const res = await apiRequest(path, { method: 'GET' });
    return res?.data ?? res;
  } catch (err) {
    console.error(`[fretes] GET ${path} falhou:`, err?.message ?? err);
    throw err;
  }
}

export async function getFreteStats() {
  return safeGet('/fretes/stats');
}

export async function listFretes(filters = {}) {
  const q = new URLSearchParams();
  if (filters.status)    q.set('status',    filters.status);
  if (filters.clientId)  q.set('clientId',  filters.clientId);
  if (filters.carrierId) q.set('carrierId', filters.carrierId);
  if (filters.from)      q.set('from',      filters.from);
  if (filters.to)        q.set('to',        filters.to);
  if (filters.page)      q.set('page',      String(filters.page));
  if (filters.limit)     q.set('limit',     String(filters.limit));
  if (filters.q)         q.set('q',         filters.q);
  const qs = q.toString();
  return safeGet(qs ? `/fretes?${qs}` : '/fretes');
}

export async function getFrete(id) {
  return safeGet(`/fretes/${id}`);
}

export async function createFrete(data) {
  return apiRequest('/fretes', { method: 'POST', body: data });
}

export async function updateFrete(id, data) {
  return apiRequest(`/fretes/${id}`, { method: 'PUT', body: data });
}

export async function updateFreteStatus(id, status, opts = {}) {
  return apiRequest(`/fretes/${id}/status`, {
    method: 'PUT',
    body: { status, ...opts },
  });
}

export async function addFreteEvent(id, data) {
  return apiRequest(`/fretes/${id}/events`, { method: 'POST', body: data });
}

export async function addFreteOccurrence(id, data) {
  return apiRequest(`/fretes/${id}/occurrences`, { method: 'POST', body: data });
}

export async function getFreteEventLog(id) {
  return safeGet(`/fretes/${id}/event-log`);
}
