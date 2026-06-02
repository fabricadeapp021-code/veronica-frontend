import { apiRequest } from '@/lib/api/client';

function qs(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') q.set(k, String(v)); });
  const s = q.toString();
  return s ? `?${s}` : '';
}

const get  = async (path, params) => ({ data: await apiRequest(`${path}${qs(params)}`, { method: 'GET' }) });
const post = async (path, body)   => ({ data: await apiRequest(path, { method: 'POST', body }) });

export const mdfesService = {
  stats:       (params)   => get('/mdfes/stats', params),
  list:        (params)   => get('/mdfes', params),
  getOne:      (id)       => get(`/mdfes/${id}`),
  create:      (data)     => post('/mdfes', data),
  authorize:   (id, data) => post(`/mdfes/${id}/authorize`, data),
  emitir:      (id, data) => post(`/mdfes/${id}/emitir`, data),
  sincronizar: (id)       => post(`/mdfes/${id}/sincronizar`),
  encerrar:    (id, data) => post(`/mdfes/${id}/encerrar`, data),
  cancelar:    (id, data) => post(`/mdfes/${id}/cancelar`, data),
};
