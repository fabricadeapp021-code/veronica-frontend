import { apiRequest } from '../client';

/**
 * Busca as configurações da conta (tenant autenticado)
 * @returns {Promise<Object>} Configurações da conta
 */
export async function getTenantSettings() {
  const res = await apiRequest('/admin/settings', { method: 'GET' });
  return res?.data ?? res;
}

/**
 * Atualiza as configurações da conta (tenant autenticado)
 * @param {Object} settings - Configurações a serem atualizadas
 * @returns {Promise<Object>} Resultado da atualização
 */
export async function updateTenantSettings(settings) {
  const res = await apiRequest('/admin/settings', {
    method: 'PUT',
    body: settings,
  });
  return res?.data ?? res;
}

/**
 * Solicita a exportação dos dados da conta (portabilidade — LGPD)
 * @returns {Promise<Object>} Dados exportados
 */
export async function exportTenantData() {
  const res = await apiRequest('/admin/settings/privacy/export', { method: 'POST' });
  return res?.data ?? res;
}

/**
 * Solicita a exclusão dos dados da conta (direito ao esquecimento — LGPD)
 * @param {string} [reason] - Motivo opcional da solicitação
 * @returns {Promise<Object>} Confirmação do registro da solicitação
 */
export async function requestTenantDataDeletion(reason) {
  return await apiRequest('/admin/settings/privacy/delete-request', {
    method: 'POST',
    body: { reason },
  });
}

/**
 * Busca informações do tenant
 * @param {string} tenantId - ID do tenant
 * @returns {Promise<Object>} Informações do tenant
 */
export async function getTenant(tenantId) {
  return await apiRequest(`/tenants/${tenantId}`, {
    method: 'GET',
  });
}

/**
 * Busca estatísticas do tenant
 * @param {string} tenantId - ID do tenant
 * @returns {Promise<Object>} Estatísticas do tenant
 */
export async function getTenantStats(tenantId) {
  return await apiRequest(`/tenants/${tenantId}/stats`, {
    method: 'GET',
  });
}
