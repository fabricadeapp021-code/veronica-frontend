import { apiRequest } from '@/lib/api/client';

function qs(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') q.set(k, String(v)); });
  const s = q.toString();
  return s ? `?${s}` : '';
}

const get = async (path, params) => ({ data: await apiRequest(`${path}${qs(params)}`, { method: 'GET' }) });
const post = async (path, body) => ({ data: await apiRequest(path, { method: 'POST', body }) });

export const nfsesService = {
  list:   (params) => get('/nfses', params),
  getOne: (id) => get(`/nfses/${id}`),
  create: (data) => post('/nfses', data),
};
