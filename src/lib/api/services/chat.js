import { apiRequest } from '@/lib/api/client';

/**
 * Envia uma mensagem para o chat via backend
 * O backend roteia para n8n que processa com RAG + LLM
 * 
 * @param {string} message - Mensagem do usuário
 * @param {string} [conversationId] - ID da conversa (opcional, para manter contexto)
 * @returns {Promise<{success: boolean, data: {message: string, conversationId?: string}}>}
 */
export async function sendChatMessage(message, conversationId) {
  return await apiRequest('/chat/webhook', {
    method: 'POST',
    body: {
      message,
      ...(conversationId && { conversationId }),
    },
  });
}

/**
 * Busca o histórico de uma conversa
 * 
 * @param {string} conversationId - ID da conversa
 * @param {number} [limit=20] - Número máximo de mensagens a retornar
 * @returns {Promise<{success: boolean, data: Array}>}
 */
export async function getChatHistory(conversationId, limit = 20) {
  return await apiRequest(`/chat/conversations/${conversationId}/history?limit=${limit}`, {
    method: 'GET',
  });
}

/**
 * Lista todas as conversas do usuário
 * 
 * @param {number} [limit=50] - Número máximo de conversas a retornar
 * @returns {Promise<{success: boolean, data: Array}>}
 */
export async function listConversations(limit = 50) {
  return await apiRequest(`/chat/conversations?limit=${limit}`, {
    method: 'GET',
  });
}

