import { apiRequest } from '@/lib/api/client';

// ─── Saldo ────────────────────────────────────────────────────────────────────

export async function getBillingBalance() {
  return apiRequest('/billing/balance', { method: 'GET' });
}

// ─── Planos ───────────────────────────────────────────────────────────────────

export async function getBillingPlans() {
  return apiRequest('/billing/plans', { method: 'GET' });
}

// ─── Assinatura ───────────────────────────────────────────────────────────────

export async function getBillingSubscription() {
  return apiRequest('/billing/subscription', { method: 'GET' });
}

export async function cancelBillingSubscription(reason) {
  return apiRequest('/billing/subscription', {
    method: 'DELETE',
    body: { reason },
  });
}

// ─── Checkout de plano ────────────────────────────────────────────────────────

export async function subscribePlan(payload) {
  return apiRequest('/billing/subscribe', {
    method: 'POST',
    body: payload,
  });
}

// ─── Checkout avulso de créditos ─────────────────────────────────────────────

export async function createCreditsCheckout(payload) {
  return apiRequest('/payments/checkout', {
    method: 'POST',
    body: payload,
  });
}

// ─── Histórico de transações ─────────────────────────────────────────────────

export async function getCreditsHistory({ page = 1, limit = 15 } = {}) {
  return apiRequest(`/credits/history?page=${page}&limit=${limit}`, { method: 'GET' });
}

// ─── Status de um pagamento ───────────────────────────────────────────────────

export async function getOrderStatus(orderId) {
  return apiRequest(`/payments/orders/${orderId}`, { method: 'GET' });
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
