import { apiRequest } from '@/lib/api/client';

async function safeGet(path) {
  try {
    const res = await apiRequest(path, { method: 'GET' });
    return res?.data ?? res;
  } catch (err) {
    console.error(`[clientes] GET ${path} falhou:`, err?.message ?? err);
    throw err;
  }
}

export async function getClienteStats() {
  return safeGet('/clientes/stats');
}

export async function listClientes(filters = {}) {
  const q = new URLSearchParams();
  if (filters.status) q.set('status', filters.status);
  if (filters.search) q.set('search', filters.search);
  if (filters.page)   q.set('page',   String(filters.page));
  if (filters.limit)  q.set('limit',  String(filters.limit));
  const qs = q.toString();
  return safeGet(qs ? `/clientes?${qs}` : '/clientes');
}

export async function lookupClientes(q = '') {
  return safeGet(`/clientes/lookup${q ? `?q=${encodeURIComponent(q)}` : ''}`);
}

export async function getCliente(id) {
  return safeGet(`/clientes/${id}`);
}

export async function createCliente(data) {
  return apiRequest('/clientes', { method: 'POST', body: data });
}

export async function updateCliente(id, data) {
  return apiRequest(`/clientes/${id}`, { method: 'PUT', body: data });
}

export async function deleteCliente(id) {
  return apiRequest(`/clientes/${id}`, { method: 'DELETE' });
}
