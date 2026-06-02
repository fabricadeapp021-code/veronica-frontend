import { apiRequest } from '@/lib/api/client';

/**
 * Lista todos os leads
 */
export async function listLeads({ offset, maxSize, select, where, orderBy, order } = {}) {
  const params = new URLSearchParams();
  if (offset) params.append('offset', offset);
  if (maxSize) params.append('maxSize', maxSize);
  if (select) params.append('select', select);
  if (where) params.append('where', typeof where === 'string' ? where : JSON.stringify(where));
  if (orderBy) params.append('orderBy', orderBy);
  if (order) params.append('order', order);
  
  const query = params.toString();
  const path = query ? `/crm/leads?${query}` : '/crm/leads';
  
  return await apiRequest(path, { method: 'GET' });
}

/**
 * Obtém um lead por ID
 */
export async function getLead(id) {
  return await apiRequest(`/crm/leads/${id}`, { method: 'GET' });
}

/**
 * Cria um novo lead
 */
export async function createLead(data) {
  return await apiRequest('/crm/leads', {
    method: 'POST',
    body: data,
  });
}

/**
 * Atualiza um lead
 */
export async function updateLead(id, data) {
  return await apiRequest(`/crm/leads/${id}`, {
    method: 'PUT',
    body: data,
  });
}

/**
 * Deleta um lead
 */
export async function deleteLead(id) {
  return await apiRequest(`/crm/leads/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Converte um lead em oportunidade
 */
export async function convertLead(id, opportunityData) {
  return await apiRequest(`/crm/leads/${id}/convert`, {
    method: 'POST',
    body: opportunityData || {},
  });
}

