import { apiRequest } from '@/lib/api/client';

// ─── Resumo da assinatura de vagas de agente ─────────────────────────────────

export async function getAgentBillingSummary() {
  return apiRequest('/billing/summary', { method: 'GET' });
}

// ─── Catálogo de preços por quantidade de agentes ────────────────────────────

export async function getAgentBillingPlans() {
  return apiRequest('/billing/plans', { method: 'GET' });
}

// ─── Cancelamento ─────────────────────────────────────────────────────────────

export async function cancelAgentSubscription(reason) {
  return apiRequest('/billing/subscription', {
    method: 'DELETE',
    body: { reason },
  });
}

// ─── Checkout de vagas de agente (1 a 4 — self-service) ──────────────────────

export async function createAgentCheckout(payload) {
  return apiRequest('/billing/checkout', {
    method: 'POST',
    body: payload,
  });
}

// ─── Histórico de pagamentos ──────────────────────────────────────────────────

export async function listAgentBillingOrders({ page = 1, limit = 20 } = {}) {
  return apiRequest(`/billing/orders?page=${page}&limit=${limit}`, { method: 'GET' });
}

// ─── Status de um pagamento ───────────────────────────────────────────────────

export async function getOrderStatus(orderId) {
  return apiRequest(`/billing/orders/${orderId}`, { method: 'GET' });
}

// ─── Plano TMS (Pulse / Orbit / Titan) ───────────────────────────────────────

export async function getTmsPlan() {
  return apiRequest('/tms-billing/my-plan', { method: 'GET' });
}

export async function simulateTmsBill(vehicleCount, driverCount = 0, userCount = 0) {
  return apiRequest('/tms-billing/my-plan/simulate', {
    method: 'POST',
    body: { vehicleCount, driverCount, userCount },
  });
}
