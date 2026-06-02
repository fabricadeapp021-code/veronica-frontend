import { apiRequest } from '@/lib/api/client';

function qs(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') q.set(k, String(v)); });
  const s = q.toString();
  return s ? `?${s}` : '';
}

const get  = async (path, params) => ({ data: await apiRequest(`${path}${qs(params)}`, { method: 'GET' }) });
const post = async (path, body)   => ({ data: await apiRequest(path, { method: 'POST', body }) });

export const entregasService = {
  stats:      (params)   => get('/entregas/stats', params),
  list:       (params)   => get('/entregas', params),
  getOne:     (id)       => get(`/entregas/${id}`),
  create:     (data)     => post('/entregas', data),
  confirm:    (id, data) => post(`/entregas/${id}/confirm`, data),
  refuse:     (id, data) => post(`/entregas/${id}/refuse`, data),
  addAttempt: (id, data) => post(`/entregas/${id}/attempts`, data),
};
