import { apiRequest } from '@/lib/api/client';

async function safeGet(path) {
  try {
    const res = await apiRequest(path, { method: 'GET' });
    return res?.data ?? res;
  } catch (err) {
    console.error(`[fleet] GET ${path} falhou:`, err?.message ?? err);
    throw err;
  }
}

// ==================== DASHBOARD ====================

export async function getFleetDashboard() {
  return safeGet('/fleet/dashboard');
}

// ==================== DEVICES / VEHICLES ====================

export async function getDevices(params = {}) {
  const query = new URLSearchParams();
  if (params.all) query.set('all', 'true');
  const q = query.toString();
  return safeGet(q ? `/fleet/devices?${q}` : '/fleet/devices');
}

export async function getDevice(id) {
  return safeGet(`/fleet/devices/${id}`);
}

// ==================== POSITIONS ====================

export async function getPositions(deviceIds = []) {
  const query = deviceIds.length ? `?deviceId=${deviceIds.join(',')}` : '';
  return safeGet(`/fleet/positions${query}`);
}

// ==================== TRACCAR DEVICES (hardware GPS) ====================

export async function getTraccarDevices() {
  return safeGet('/fleet/traccar-devices');
}

export async function createTraccarDevice(data) {
  return apiRequest('/fleet/traccar-devices', {
    method: 'POST',
    body: data,
  });
}

export async function linkTraccarDevice(traccarId, vehicleId) {
  return apiRequest(`/fleet/traccar-devices/${traccarId}/link`, {
    method: 'PUT',
    body: { vehicleId },
  });
}

export async function unlinkTraccarDevice(traccarId) {
  return apiRequest(`/fleet/traccar-devices/${traccarId}/unlink`, { method: 'PUT' });
}

export async function updateTraccarDevice(traccarId, data) {
  return apiRequest(`/fleet/traccar-devices/${traccarId}`, {
    method: 'PUT',
    body: data,
  });
}

export async function deleteTraccarDevice(traccarId) {
  return apiRequest(`/fleet/traccar-devices/${traccarId}`, { method: 'DELETE' });
}

export async function shareTraccarDevice(traccarId, expiration) {
  return apiRequest(`/fleet/traccar-devices/${traccarId}/share`, {
    method: 'POST',
    body: expiration ? { expiration } : {},
  });
}

// ==================== ACCUMULATOR (correção de odômetro) ====================

export async function updateAccumulator(traccarDeviceId, totalDistanceKm, hoursDecimal) {
  return apiRequest(`/fleet/devices/${traccarDeviceId}/accumulator`, {
    method: 'PUT',
    body: {
      totalDistanceM: Math.round(totalDistanceKm * 1000),
      hours: Math.round(hoursDecimal * 3600),
    },
  });
}

// ==================== TENANT CONFIG / ONBOARDING TRACCAR ====================

export async function getTenantConfig() {
  try {
    return await safeGet('/fleet/tenant-config');
  } catch {
    return null;
  }
}

export async function createTraccarUser(name, email, password) {
  return apiRequest('/fleet/traccar-user', {
    method: 'POST',
    body: { name, email, password },
  });
}

export async function syncTraccarPermissions(traccarUserId) {
  return apiRequest('/fleet/traccar-user/sync-permissions', {
    method: 'POST',
    body: { traccarUserId },
  });
}

// ==================== MAINTENANCES ====================

export async function getMaintenances() {
  return safeGet('/fleet/maintenances');
}

export async function createMaintenance(data) {
  return apiRequest('/fleet/maintenances', { method: 'POST', body: data });
}

export async function updateMaintenance(id, data) {
  return apiRequest(`/fleet/maintenances/${id}`, { method: 'PUT', body: data });
}

export async function deleteMaintenance(id) {
  return apiRequest(`/fleet/maintenances/${id}`, { method: 'DELETE' });
}

export async function createMaintenanceRecord(maintenanceId, data) {
  return apiRequest(`/fleet/maintenances/${maintenanceId}/records`, {
    method: 'POST',
    body: data,
  });
}

export async function getMaintenanceRecords(maintenanceId) {
  if (maintenanceId != null) {
    return safeGet(`/fleet/maintenances/${maintenanceId}/records`);
  }
  // Sem maintenanceId → busca todos os registros do tenant
  return safeGet('/fleet/maintenances/records');
}

// ==================== NOTIFICATIONS / ALERTS ====================

export async function getNotificationTypes() {
  return safeGet('/fleet/notification-types');
}

export async function getNotifications() {
  return safeGet('/fleet/notifications');
}

export async function createNotification(data) {
  return apiRequest('/fleet/notifications', { method: 'POST', body: data });
}

export async function deleteNotification(id) {
  return apiRequest(`/fleet/notifications/${id}`, { method: 'DELETE' });
}

export async function getAlertsHistory(params = {}) {
  const { from, to } = todayRange();
  const query = new URLSearchParams();
  query.set('from', params.from ?? from);
  query.set('to',   params.to   ?? to);
  if (params.deviceIds?.length) query.set('deviceId', params.deviceIds.join(','));
  if (params.types?.length)     query.set('type',     params.types.join(','));
  return safeGet(`/fleet/alerts/history?${query}`);
}

export async function getEventById(id) {
  return safeGet(`/fleet/alerts/event/${id}`);
}

export const BUILT_IN_ALERT_TYPES = [
  { type: 'deviceOffline',    label: 'Dispositivo offline' },
  { type: 'deviceOnline',     label: 'Dispositivo online' },
  { type: 'deviceMoving',     label: 'Veículo em movimento' },
  { type: 'deviceStopped',    label: 'Veículo parado' },
  { type: 'geofenceEnter',    label: 'Entrada em geofence' },
  { type: 'geofenceExit',     label: 'Saída de geofence' },
  { type: 'speedLimit',       label: 'Excesso de velocidade' },
  { type: 'ignitionOn',       label: 'Ignição ligada' },
  { type: 'ignitionOff',      label: 'Ignição desligada' },
  { type: 'alarm',            label: 'Alarme geral' },
  { type: 'maintenance',      label: 'Manutenção pendente' },
  { type: 'driverChanged',    label: 'Motorista trocado' },
  { type: 'lowBattery',       label: 'Bateria fraca (dispositivo)' },
  { type: 'powerCut',         label: 'Corte de energia (dispositivo)' },
  { type: 'hardAcceleration', label: 'Aceleração brusca' },
  { type: 'hardBraking',      label: 'Frenagem brusca' },
  { type: 'hardCornering',    label: 'Curva brusca' },
];

// ==================== GROUPS ====================

export async function getGroups() {
  return safeGet('/fleet/groups');
}

export async function updateGroup(id, dto) {
  return apiRequest(`/fleet/groups/${id}`, { method: 'PUT', body: dto });
}

export async function assignDriver(vehicleId, driverId) {
  return apiRequest(`/fleet/vehicles/${vehicleId}/assign-driver`, {
    method: 'PUT',
    body: driverId ? { driverId } : {},
  });
}

// ==================== DRIVERS ====================

export async function getDrivers() {
  return safeGet('/fleet/fleet-drivers');
}

// ==================== GEOFENCES ====================

export async function getGeofences() {
  return safeGet('/fleet/geofences');
}

// ==================== REPORTS ====================

export async function getTrips(params = {}) {
  const query = new URLSearchParams();
  if (params.from) query.set('from', params.from);
  if (params.to)   query.set('to', params.to);
  if (params.deviceIds?.length) query.set('deviceId', params.deviceIds.join(','));
  return safeGet(`/fleet/reports/trips?${query}`);
}

export async function getStops(params = {}) {
  const query = new URLSearchParams();
  if (params.from) query.set('from', params.from);
  if (params.to)   query.set('to', params.to);
  if (params.deviceIds?.length) query.set('deviceId', params.deviceIds.join(','));
  return safeGet(`/fleet/reports/stops?${query}`);
}

export async function getSummary(params = {}) {
  const query = new URLSearchParams();
  if (params.from) query.set('from', params.from);
  if (params.to)   query.set('to', params.to);
  if (params.deviceIds?.length) query.set('deviceId', params.deviceIds.join(','));
  return safeGet(`/fleet/reports/summary?${query}`);
}

export async function getEvents(params = {}) {
  const query = new URLSearchParams();
  if (params.from) query.set('from', params.from);
  if (params.to)   query.set('to', params.to);
  if (params.deviceIds?.length) query.set('deviceId', params.deviceIds.join(','));
  if (params.types?.length)    query.set('type', params.types.join(','));
  return safeGet(`/fleet/reports/events?${query}`);
}

export async function getRouteReport(params = {}) {
  const query = new URLSearchParams();
  if (params.from)     query.set('from', params.from);
  if (params.to)       query.set('to', params.to);
  if (params.deviceId) query.set('deviceId', params.deviceId);
  return safeGet(`/fleet/reports/route?${query}`);
}

// ==================== COMMANDS ====================

export async function getCommandTypes(deviceId) {
  return safeGet(`/fleet/commands/${deviceId}/types`);
}

export async function sendCommand(deviceId, body) {
  return apiRequest(`/fleet/commands/${deviceId}`, { method: 'POST', body });
}

// ==================== VEHICLES (alias para getDevices) ====================

export async function getVehicles(params = {}) {
  return getDevices(params);
}

// ==================== PLANNED TRIPS (MongoDB) ====================

export async function previewRoute(body) {
  return apiRequest('/fleet/trips/preview-route', { method: 'POST', body });
}

export async function createPlannedTrip(body) {
  return apiRequest('/fleet/trips', { method: 'POST', body });
}

export async function getPlannedTrips(params = {}) {
  const q = new URLSearchParams();
  if (params.status)    q.set('status',    params.status);
  if (params.vehicleId) q.set('vehicleId', params.vehicleId);
  if (params.driverId)  q.set('driverId',  params.driverId);
  if (params.from)      q.set('from',      params.from);
  if (params.to)        q.set('to',        params.to);
  if (params.page)      q.set('page',      params.page);
  if (params.limit)     q.set('limit',     params.limit);
  return safeGet(`/fleet/trips?${q}`);
}

export async function getPlannedTrip(id) {
  return safeGet(`/fleet/trips/${id}`);
}

export async function updateTripStatus(id, body) {
  return apiRequest(`/fleet/trips/${id}/status`, { method: 'PUT', body });
}

export async function addTripOccurrence(id, body) {
  return apiRequest(`/fleet/trips/${id}/occurrences`, { method: 'POST', body });
}

export async function deletePlannedTrip(id) {
  return apiRequest(`/fleet/trips/${id}`, { method: 'DELETE' });
}

export async function getTripStats() {
  return safeGet('/fleet/trips/stats');
}

// ==================== INCIDENTS (Ocorrências persistidas) ====================

export async function getIncidents(params = {}) {
  const { from, to } = todayRange();
  const query = new URLSearchParams();
  query.set('from', params.from ?? from);
  query.set('to',   params.to   ?? to);
  if (params.status)   query.set('status',   params.status);
  if (params.deviceId) query.set('deviceId', params.deviceId);
  return safeGet(`/fleet/incidents?${query}`);
}

export async function updateIncidentStatus(id, body) {
  return apiRequest(`/fleet/incidents/${id}`, { method: 'PUT', body });
}

// ==================== TRIP ALERTS ====================

export async function getTripAlerts(params = {}) {
  const query = new URLSearchParams();
  if (params.tripId)   query.set('tripId',   params.tripId);
  if (params.status)   query.set('status',   params.status);
  if (params.severity) query.set('severity', params.severity);
  const q = query.toString();
  return safeGet(q ? `/fleet/trip-alerts?${q}` : '/fleet/trip-alerts');
}

export async function updateTripAlert(id, body) {
  return apiRequest(`/fleet/trip-alerts/${id}`, { method: 'PUT', body });
}

// ==================== SCORE DE MOTORISTAS ====================

export async function syncDriverScores() {
  return apiRequest('/fleet/fleet-drivers/sync-scores', { method: 'POST' });
}

// ==================== TENANT CONFIG ====================

export async function updateTenantConfig(data) {
  return apiRequest('/fleet/tenant-config', { method: 'PUT', body: data });
}

// ==================== HELPERS ====================

export function todayRange() {
  const now  = new Date();
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  const to   = new Date(now);
  to.setHours(23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

export default {
  getFleetDashboard,
  getDevices,
  getDevice,
  getPositions,
  getTraccarDevices,
  createTraccarDevice,
  linkTraccarDevice,
  unlinkTraccarDevice,
  updateTraccarDevice,
  updateAccumulator,
  getTenantConfig,
  updateTenantConfig,
  createTraccarUser,
  syncTraccarPermissions,
  getMaintenances,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  createMaintenanceRecord,
  getMaintenanceRecords,
  getNotificationTypes,
  getNotifications,
  createNotification,
  deleteNotification,
  getAlertsHistory,
  getEventById,
  getGroups,
  updateGroup,
  assignDriver,
  getDrivers,
  getGeofences,
  getTrips,
  getStops,
  getSummary,
  getEvents,
  getRouteReport,
  getCommandTypes,
  sendCommand,
  deleteTraccarDevice,
  shareTraccarDevice,
  todayRange,
  // incidents
  getIncidents,
  updateIncidentStatus,
  // trip alerts
  getTripAlerts,
  updateTripAlert,
  // score
  syncDriverScores,
  // vehicles alias
  getVehicles,
  // planned trips
  previewRoute,
  createPlannedTrip,
  getPlannedTrips,
  getPlannedTrip,
  updateTripStatus,
  addTripOccurrence,
  deletePlannedTrip,
  getTripStats,
};
