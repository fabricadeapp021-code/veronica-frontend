import { apiRequest, fetchStream } from '@/lib/api/client';

export async function fleetAiGetPendingActions() {
  const res = await apiRequest('/fleet-ai/pending-actions');
  return res?.data ?? [];
}

export async function fleetAiApproveAction(id) {
  return apiRequest(`/fleet-ai/pending-actions/${id}/approve`, { method: 'POST' });
}

export async function fleetAiRejectAction(id) {
  return apiRequest(`/fleet-ai/pending-actions/${id}`, { method: 'DELETE' });
}

/**
 * Sends a message to the Fleet AI supervisor (non-streaming).
 * @param {string} message
 * @param {Array<{role:'user'|'assistant', content:string}>} history
 * @returns {Promise<string>} AI response text
 */
export async function fleetAiChat(message, history = []) {
  const res = await apiRequest('/fleet-ai/chat', {
    method: 'POST',
    body: { message, history },
  });
  return res?.data?.message ?? res?.message ?? '';
}

/**
 * Streams a Fleet AI response via SSE.
 * Calls onChunk for every text delta, onDone when the stream ends.
 *
 * @param {string} message
 * @param {Array<{role:'user'|'assistant', content:string}>} history
 * @param {(chunk: string) => void} onChunk
 * @param {AbortSignal} [signal]
 * @returns {Promise<void>}
 */
export async function fleetAiChatStream(message, history = [], onChunk, signal) {
  const res = await fetchStream('/fleet-ai/chat/stream', {
    body: { message, history },
    signal,
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const raw = line.slice(5).trim();
      if (!raw || raw === '[DONE]') continue;
      try {
        const parsed = JSON.parse(raw);
        const text = parsed?.chunk ?? parsed?.data ?? parsed;
        if (typeof text === 'string' && text) onChunk(text);
      } catch {
        if (raw) onChunk(raw);
      }
    }
  }
}
