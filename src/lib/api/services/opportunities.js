import { apiRequest } from '@/lib/api/client';

/**
 * Lista todas as oportunidades
 */
export async function listOpportunities({ offset, maxSize, where, orderBy, order, select } = {}) {
  const params = new URLSearchParams();
  if (offset) params.append('offset', offset);
  if (maxSize) params.append('maxSize', maxSize);
  if (where) params.append('where', typeof where === 'string' ? where : JSON.stringify(where));
  if (orderBy) params.append('orderBy', orderBy);
  if (order) params.append('order', order);
  if (select) params.append('select', select);
  
  const query = params.toString();
  const path = query ? `/crm/opportunities?${query}` : '/crm/opportunities';
  
  return await apiRequest(path, { method: 'GET' });
}

/**
 * Obtém uma oportunidade por ID
 */
export async function getOpportunity(id) {
  return await apiRequest(`/crm/opportunities/${id}`, { method: 'GET' });
}

/**
 * Cria uma nova oportunidade
 */
export async function createOpportunity(data) {
  return await apiRequest('/crm/opportunities', {
    method: 'POST',
    body: data,
  });
}

/**
 * Atualiza uma oportunidade
 */
export async function updateOpportunity(id, data) {
  return await apiRequest(`/crm/opportunities/${id}`, {
    method: 'PUT',
    body: data,
  });
}

/**
 * Atualiza o estágio de uma oportunidade
 */
export async function updateOpportunityStage(id, stage, probability) {
  return await apiRequest(`/crm/opportunities/${id}/stage`, {
    method: 'PUT',
    body: { stage, probability },
  });
}

/**
 * Deleta uma oportunidade
 */
export async function deleteOpportunity(id) {
  return await apiRequest(`/crm/opportunities/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Converte um lead em oportunidade
 */
export async function convertLeadToOpportunity(leadId, opportunityData) {
  return await apiRequest(`/crm/leads/${leadId}/convert`, {
    method: 'POST',
    body: opportunityData,
  });
}

