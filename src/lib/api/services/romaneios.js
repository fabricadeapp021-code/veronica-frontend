import { apiRequest } from '@/lib/api/client';

async function safeGet(path) {
  try {
    const res = await apiRequest(path, { method: 'GET' });
    return res?.data ?? res;
  } catch (err) {
    console.error(`[romaneios] GET ${path} falhou:`, err?.message ?? err);
    throw err;
  }
}

export async function getRomaneioStats() {
  return safeGet('/romaneios/stats');
}

export async function listRomaneios(filters = {}) {
  const q = new URLSearchParams();
  if (filters.status)    q.set('status',    filters.status);
  if (filters.vehicleId) q.set('vehicleId', filters.vehicleId);
  if (filters.driverId)  q.set('driverId',  filters.driverId);
  if (filters.carrierId) q.set('carrierId', filters.carrierId);
  if (filters.from)      q.set('from',      filters.from);
  if (filters.to)        q.set('to',        filters.to);
  if (filters.page)      q.set('page',      String(filters.page));
  if (filters.limit)     q.set('limit',     String(filters.limit));
  const qs = q.toString();
  return safeGet(qs ? `/romaneios?${qs}` : '/romaneios');
}

export async function getRomaneio(id) {
  return safeGet(`/romaneios/${id}`);
}

export async function createRomaneio(data) {
  return apiRequest('/romaneios', { method: 'POST', body: data });
}

export async function updateRomaneio(id, data) {
  return apiRequest(`/romaneios/${id}`, { method: 'PUT', body: data });
}

export async function updateRomaneioStatus(id, status, opts = {}) {
  return apiRequest(`/romaneios/${id}/status`, {
    method: 'PUT',
    body: { status, ...opts },
  });
}

export async function addRomaneioEvent(id, data) {
  return apiRequest(`/romaneios/${id}/events`, { method: 'POST', body: data });
}

export async function addRomaneioOccurrence(id, data) {
  return apiRequest(`/romaneios/${id}/occurrences`, { method: 'POST', body: data });
}

export async function getRomaneioEventLog(id) {
  return safeGet(`/romaneios/${id}/event-log`);
}
