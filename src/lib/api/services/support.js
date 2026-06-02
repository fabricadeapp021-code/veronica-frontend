import { apiRequest } from '@/lib/api/client';

/**
 * Lista tickets de suporte do tenant
 * GET /admin/support/tickets
 */
export async function listTickets({ status, page } = {}) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (page) params.append('page', page);
  const query = params.toString();
  return apiRequest(`/admin/support/tickets${query ? `?${query}` : ''}`, {
    method: 'GET',
  });
}

/**
 * Busca um ticket por ID
 * GET /admin/support/tickets/:id
 */
export async function getTicket(id) {
  return apiRequest(`/admin/support/tickets/${id}`, {
    method: 'GET',
  });
}

/**
 * Abre um novo chamado de suporte
 * POST /admin/support/tickets
 * @param {object} data - { subject, category?, priority?, description }
 */
export async function createTicket(data) {
  return apiRequest('/admin/support/tickets', {
    method: 'POST',
    body: data,
  });
}

/**
 * Responde a um ticket existente
 * POST /admin/support/tickets/:id/reply
 * @param {string} id - ID do ticket
 * @param {object} data - { message }
 */
export async function replyTicket(id, data) {
  return apiRequest(`/admin/support/tickets/${id}/reply`, {
    method: 'POST',
    body: data,
  });
}
