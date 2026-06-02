import { apiRequest } from '@/lib/api/client';

/**
 * Busca campanhas ativas do tenant
 * GET /admin/monitor/campaigns
 */
export async function getMonitorCampaigns() {
  return await apiRequest('/admin/monitor/campaigns', { method: 'GET' });
}

/**
 * Status atual da fila de disparo (waiting, active, completed, failed, delayed)
 * GET /admin/monitor/queue
 */
export async function getMonitorQueueStatus() {
  return await apiRequest('/admin/monitor/queue', { method: 'GET' });
}

/**
 * Estatísticas gerais de campanhas do tenant (total, active, paused, completed, draft)
 * GET /admin/monitor/stats
 */
export async function getMonitorStats() {
  return await apiRequest('/admin/monitor/stats', { method: 'GET' });
}
