import { apiRequest } from '@/lib/api/client';

function qs(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') q.set(k, String(v)); });
  const s = q.toString();
  return s ? `?${s}` : '';
}

const get  = async (path, params) => ({ data: await apiRequest(`${path}${qs(params)}`, { method: 'GET' }) });
const post = async (path, body)   => ({ data: await apiRequest(path, { method: 'POST', body }) });
const del  = async (path, body)   => ({ data: await apiRequest(path, { method: 'DELETE', body }) });

export const ctesService = {
  stats:         (params)     => get('/ctes/stats', params),
  list:          (params)     => get('/ctes', params),
  getOne:        (id)         => get(`/ctes/${id}`),
  create:        (data)       => post('/ctes', data),
  authorize:     (id, data)   => post(`/ctes/${id}/authorize`, data),
  cancel:        (id, data)   => post(`/ctes/${id}/cancel`, data),
  emitir:        (id, data)   => post(`/ctes/${id}/emitir`, data),
  sincronizar:   (id)         => post(`/ctes/${id}/sincronizar`),
  cancelarSefaz: (id, data)   => post(`/ctes/${id}/cancelar-sefaz`, data),
};
