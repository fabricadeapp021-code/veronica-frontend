import { apiRequest } from '@/lib/api/client';

/**
 * Uso e custo reportado diretamente pelo gateway OpenClaw (independe do
 * transporte usado na conversa). Pode retornar zeros se o gateway em uso
 * não implementar o método `gateway.usage-cost`.
 */
export async function getGatewayUsageCost(filters = {}) {
  const params = new URLSearchParams();

  if (filters.agentId) params.append('agentId', filters.agentId);
  if (filters.from) params.append('from', filters.from);
  if (filters.to) params.append('to', filters.to);

  const query = params.toString();
  return await apiRequest(`/openclaw/gateway/usage-cost${query ? `?${query}` : ''}`, {
    method: 'GET',
  });
}
