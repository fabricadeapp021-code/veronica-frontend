import { apiRequest } from '../client';

/**
 * Busca as configurações do tenant
 * @param {string} tenantId - ID do tenant
 * @returns {Promise<Object>} Configurações do tenant
 */
export async function getTenantSettings(tenantId) {
  return await apiRequest(`/tenants/${tenantId}/settings`, {
    method: 'GET',
  });
}

/**
 * Atualiza as configurações do tenant
 * @param {string} tenantId - ID do tenant
 * @param {Object} settings - Configurações a serem atualizadas
 * @returns {Promise<Object>} Resultado da atualização
 */
export async function updateTenantSettings(tenantId, settings) {
  return await apiRequest(`/tenants/${tenantId}/settings`, {
    method: 'PATCH',
    body: settings,
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
