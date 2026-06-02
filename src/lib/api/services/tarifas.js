import { apiRequest } from '@/lib/api/client';

async function safeGet(path) {
  try {
    const res = await apiRequest(path, { method: 'GET' });
    return res?.data ?? res;
  } catch (err) {
    console.error(`[tarifas] GET ${path} falhou:`, err?.message ?? err);
    throw err;
  }
}

export async function getTarifaStats() {
  return safeGet('/tarifas/stats');
}

export async function listTarifas(filters = {}) {
  const q = new URLSearchParams();
  if (filters.status)        q.set('status',        filters.status);
  if (filters.carrierId)     q.set('carrierId',     filters.carrierId);
  if (filters.originUF)      q.set('originUF',      filters.originUF);
  if (filters.destinationUF) q.set('destinationUF', filters.destinationUF);
  if (filters.modality)      q.set('modality',      filters.modality);
  if (filters.page)          q.set('page',          String(filters.page));
  if (filters.limit)         q.set('limit',         String(filters.limit));
  const qs = q.toString();
  return safeGet(qs ? `/tarifas?${qs}` : '/tarifas');
}

export async function getTarifa(id) {
  return safeGet(`/tarifas/${id}`);
}

export async function createTarifa(data) {
  return apiRequest('/tarifas', { method: 'POST', body: data });
}

export async function updateTarifa(id, data) {
  return apiRequest(`/tarifas/${id}`, { method: 'PUT', body: data });
}

export async function updateTarifaStatus(id, status) {
  return apiRequest(`/tarifas/${id}/status`, { method: 'PUT', body: { status } });
}

export async function deleteTarifa(id) {
  return apiRequest(`/tarifas/${id}`, { method: 'DELETE' });
}

export async function calculateFreight(data) {
  return apiRequest('/tarifas/calculate', { method: 'POST', body: data });
}
