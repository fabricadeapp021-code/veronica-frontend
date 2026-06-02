import { apiRequest } from '../client';

export async function getIntegrationProviders() {
  return apiRequest('/integrations/providers', { auth: true });
}

export async function getIntegrations() {
  return apiRequest('/integrations', { auth: true });
}

export async function createIntegration(payload) {
  return apiRequest('/integrations', {
    method: 'POST',
    body: payload,
    auth: true,
  });
}

export async function deleteIntegration(id) {
  return apiRequest(`/integrations/${id}`, {
    method: 'DELETE',
    auth: true,
  });
}

export async function getGoogleAuthUrl() {
  return apiRequest('/integrations/google/auth', { auth: true });
}
