import { apiRequest } from '@/lib/api/client';

async function safeGet(path) {
  try {
    const res = await apiRequest(path, { method: 'GET' });
    return res?.data ?? res;
  } catch (err) {
    console.error(`[collectionOrders] GET ${path} falhou:`, err?.message ?? err);
    throw err;
  }
}

export async function getCollectionOrderStats() {
  return safeGet('/collection-orders/stats');
}

export async function listCollectionOrders(filters = {}) {
  const q = new URLSearchParams();
  if (filters.status)    q.set('status',    filters.status);
  if (filters.clientId)  q.set('clientId',  filters.clientId);
  if (filters.carrierId) q.set('carrierId', filters.carrierId);
  if (filters.from)      q.set('from',      filters.from);
  if (filters.to)        q.set('to',        filters.to);
  if (filters.page)      q.set('page',      String(filters.page));
  if (filters.limit)     q.set('limit',     String(filters.limit));
  const qs = q.toString();
  return safeGet(qs ? `/collection-orders?${qs}` : '/collection-orders');
}

export async function getCollectionOrder(id) {
  return safeGet(`/collection-orders/${id}`);
}

export async function createCollectionOrder(data) {
  return apiRequest('/collection-orders', { method: 'POST', body: data });
}

export async function updateCollectionOrder(id, data) {
  return apiRequest(`/collection-orders/${id}`, { method: 'PUT', body: data });
}

export async function updateCollectionOrderStatus(id, status, opts = {}) {
  return apiRequest(`/collection-orders/${id}/status`, {
    method: 'PUT',
    body: { status, ...opts },
  });
}

export async function addCollectionOrderEvent(id, data) {
  return apiRequest(`/collection-orders/${id}/events`, { method: 'POST', body: data });
}

export async function addCollectionOrderOccurrence(id, data) {
  return apiRequest(`/collection-orders/${id}/occurrences`, { method: 'POST', body: data });
}

export async function approveCollectionOrderFiscal(id) {
  return apiRequest(`/collection-orders/${id}/fiscal/approve`, { method: 'POST' });
}

export async function getCollectionOrderEventLog(id) {
  return safeGet(`/collection-orders/${id}/event-log`);
}
