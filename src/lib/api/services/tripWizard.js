import { apiRequest } from '@/lib/api/client';

async function safeGet(path) {
  const res = await apiRequest(path, { method: 'GET' });
  return res?.data ?? res;
}

export async function createWizard() {
  return apiRequest('/trip-wizard', { method: 'POST', body: {} });
}

export async function getWizard(id) {
  return safeGet(`/trip-wizard/${id}`);
}

export async function listWizards(params = {}) {
  const q = new URLSearchParams();
  if (params.status) q.set('status', params.status);
  if (params.page)   q.set('page',   String(params.page));
  if (params.limit)  q.set('limit',  String(params.limit));
  const qs = q.toString();
  return safeGet(`/trip-wizard${qs ? '?' + qs : ''}`);
}

export async function saveStep(id, step, data) {
  return apiRequest(`/trip-wizard/${id}/step/${step}`, { method: 'PATCH', body: data });
}

export async function createWizardCte(id) {
  return apiRequest(`/trip-wizard/${id}/fiscal/cte`, { method: 'POST', body: {} });
}

export async function createWizardMdfe(id) {
  return apiRequest(`/trip-wizard/${id}/fiscal/mdfe`, { method: 'POST', body: {} });
}

export async function submitWizard(id, data = {}) {
  return apiRequest(`/trip-wizard/${id}/submit`, { method: 'POST', body: data });
}

export async function approveWizard(id, notes = '') {
  return apiRequest(`/trip-wizard/${id}/approve`, { method: 'POST', body: { notes } });
}

export async function rejectWizard(id, reason) {
  return apiRequest(`/trip-wizard/${id}/reject`, { method: 'POST', body: { reason } });
}

export async function activateWizard(id) {
  return apiRequest(`/trip-wizard/${id}/activate`, { method: 'POST', body: {} });
}

export async function cancelWizard(id) {
  return apiRequest(`/trip-wizard/${id}`, { method: 'DELETE' });
}

export async function validateCep(cep) {
  try {
    return await safeGet(`/trip-wizard/validate/cep/${cep.replace(/\D/g, '')}`);
  } catch {
    return null;
  }
}

export async function validateDriver(id) {
  return safeGet(`/trip-wizard/validate/driver/${id}`);
}

export async function validateVehicle(id) {
  return safeGet(`/trip-wizard/validate/vehicle/${id}`);
}
