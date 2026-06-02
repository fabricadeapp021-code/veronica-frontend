import { apiRequest } from '@/lib/api/client';

/**
 * Lista logs de auditoria com filtros e paginação
 */
export async function listAuditLogs(filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.level) params.append('level', filters.level);
  if (filters.userId) params.append('userId', filters.userId);
  if (filters.context) params.append('context', filters.context);
  if (filters.search) params.append('search', filters.search);
  if (filters.statusCode) params.append('statusCode', filters.statusCode);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);
  
  const query = params.toString();
  return await apiRequest(`/audit/logs${query ? `?${query}` : ''}`, {
    method: 'GET',
  });
}

/**
 * Busca um log específico por ID
 */
export async function getAuditLogById(logId) {
  return await apiRequest(`/audit/logs/${logId}`, {
    method: 'GET',
  });
}

/**
 * Retorna estatísticas de logs
 */
export async function getAuditStats(filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  
  const query = params.toString();
  return await apiRequest(`/audit/stats${query ? `?${query}` : ''}`, {
    method: 'GET',
  });
}

/**
 * Limpeza manual de logs antigos (apenas OWNER)
 */
export async function cleanupOldLogs(olderThanDays) {
  return await apiRequest('/audit/cleanup', {
    method: 'DELETE',
    body: { olderThanDays },
  });
}

