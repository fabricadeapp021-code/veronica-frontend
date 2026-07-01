'use client';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Card, Badge, Button, Spinner } from 'react-bootstrap';
import { Truck, RefreshCw, MapPin, Navigation, ChevronRight } from 'react-feather';
import SimpleBar from 'simplebar-react';
import { getTraccarDevices, getPositions, getPlannedTrips, getTripAlerts, updateTripAlert } from '@/lib/api/services/fleet';
import { apiRequest } from '@/lib/api/client';
import { resolveApiBaseUrl } from '@/lib/api/config';
import { getAccessToken } from '@/lib/auth/session';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
const POLL_INTERVAL_MS = 30000;

// Paleta de cores para múltiplas rotas simultâneas
const ROUTE_COLORS = ['#0d6efd', '#198754', '#fd7e14', '#6610f2', '#20c997', '#dc3545', '#ffc107'];

const statusConfig = {
  online:  { color: '#28a745', label: 'Online' },
  offline: { color: '#dc3545', label: 'Offline' },
  unknown: { color: '#6c757d', label: 'Inativo' },
};

const STAGE_LABELS = {
  planned:    { label: 'Planejada',   color: '#6c757d' },
  checked_in: { label: 'Check-in',    color: '#0dcaf0' },
  loading:    { label: 'Carregando',  color: '#ffc107' },
  loaded:     { label: 'Carregado',   color: '#fd7e14' },
  in_transit: { label: 'Em trânsito', color: '#0d6efd' },
  arrived:    { label: 'Chegou',      color: '#20c997' },
  delivered:  { label: 'Entregue',    color: '#28a745' },
  completed:  { label: 'Concluída',   color: '#198754' },
};

const EVENT_LABELS = {
  trip_created:         '🗓️ Viagem criada',
  checkin:              '📍 Check-in na origem',
  loading_started:      '📦 Carregamento iniciado',
  loading_completed:    '✅ Carregamento concluído',
  trip_started:         '🚀 Viagem iniciada',
  arrived_at_client:    '📍 Chegou ao cliente',
  delivery_completed:   '✅ Entrega confirmada',
  delivery_attempted:   '🔄 Tentativa de entrega',
  trip_finished:        '🏁 Viagem finalizada',
  occurrence_reported:  '⚠️ Ocorrência reportada',
  refueling:            '⛽ Abastecimento registrado',
  panic_button:         '🚨 Emergência acionada',
  checklist_completed:  '📋 Checklist concluído',
};

const COMMAND_TYPES = [
  ['message', 'Mensagem'],
  ['request_location', 'Solicitar localização'],
  ['reroute', 'Nova instrução de rota'],
  ['call_operator', 'Pedir ligação'],
  ['cancel_instruction', 'Cancelar instrução'],
];

const COMMAND_STATUS_LABELS = {
  pending: 'Pendente',
  delivered: 'Entregue',
  acknowledged: 'Confirmado',
  rejected: 'Recusado',
  expired: 'Expirado',
};

const ALERT_META = {
  speed_limit:     { label: 'Excesso de velocidade', icon: '⚡' },
  route_deviation: { label: 'Desvio de rota',        icon: '🗺️' },
  device_offline:  { label: 'Rastreador offline',    icon: '📡' },
  panic_alarm:     { label: 'Alarme de pânico',      icon: '🆘' },
  unsafe_driving:  { label: 'Direção perigosa',      icon: '⚠️' },
  long_stop:       { label: 'Parada longa',          icon: '⏸️' },
  eta_delay:       { label: 'Atraso de ETA',         icon: '🕐' },
};

function loadGoogleMapsScript(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google?.maps?.Map) { resolve(); return; }
    const SCRIPT_ID = 'google-maps-script-v2';
    const old = document.getElementById('google-maps-script');
    if (old) old.remove();
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      const wait = () => window.google?.maps?.Map ? resolve() : setTimeout(wait, 50);
      wait(); return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&libraries=marker&loading=async`;
    script.async = true; script.defer = true;
    script.onload = () => { const wait = () => window.google?.maps?.Map ? resolve() : setTimeout(wait, 50); wait(); };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function loadSocketIoScript(baseUrl) {
  return new Promise((resolve, reject) => {
    if (window.io) { resolve(window.io); return; }

    const SCRIPT_ID = 'socket-io-client-script';
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      const wait = () => window.io ? resolve(window.io) : setTimeout(wait, 50);
      wait(); return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `${baseUrl.replace(/\/+$/, '')}/socket.io/socket.io.js`;
    script.async = true;
    script.onload = () => window.io ? resolve(window.io) : reject(new Error('Socket.IO client indisponível'));
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function isTripVisibleInTower(trip) {
  return trip?.status === 'in_progress' && !['completed', 'cancelled'].includes(trip?.executionStage);
}

function deviceEmoji(device) {
  const kind = device.attributes?.deviceKind ?? '';
  const cat  = device.category ?? device.linkedVehicle?.category ?? '';
  if (kind === 'smartphone' || kind === 'personal') return '📱';
  if (cat === 'truck') return '🚛';
  if (cat === 'van')   return '🚐';
  if (cat === 'motorcycle') return '🏍️';
  if (cat === 'bus')   return '🚌';
  if (cat === 'person') return '🚶';
  return '🚗';
}

function upsertMarker(map, markersRef, device, pos, onSelect) {
  const id  = device.id;
  const cfg = statusConfig[device.status] ?? statusConfig.unknown;
  const lat = pos.latitude;
  const lng = pos.longitude;

  const existing = markersRef.current[id];
  if (existing) { existing.position = { lat, lng }; return; }

  const content = document.createElement('div');
  content.style.cssText = 'display:flex;flex-direction:column;align-items:center;cursor:pointer';
  content.innerHTML = `
    <div style="background:${cfg.color};border:2px solid #fff;border-radius:50%;
      width:28px;height:28px;display:flex;align-items:center;justify-content:center;
      font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,.35);">${deviceEmoji(device)}</div>
    <div style="background:rgba(0,0,0,.65);color:#fff;border-radius:3px;
      padding:1px 5px;font-size:10px;font-weight:600;margin-top:2px;white-space:nowrap;"
    >${device.linkedVehicle?.name ?? device.name}</div>
  `;

  const marker = new window.google.maps.marker.AdvancedMarkerElement({
    map, position: { lat, lng }, title: device.name, content,
  });

  const infoWindow = new window.google.maps.InfoWindow({
    content: `<div style="font-size:13px;font-weight:600">${device.linkedVehicle?.name ?? device.name}</div>
              <div style="font-size:11px;color:#666">${cfg.label} · ${pos.speed ?? 0} km/h</div>`,
  });

  marker.addEventListener('gmp-click', () => {
    onSelect({ ...device, position: pos });
    infoWindow.open({ anchor: marker, map });
  });

  markersRef.current[id] = marker;
}

/** Desenha rota OSRM (GeoJSON LineString) ou polyline codificada no Google Maps */
function drawRouteOnMap(map, trip, color) {
  const layers = {};

  // ── Rota ──────────────────────────────────────────────────────────────────
  const geoJson = trip.planned?.routeGeoJson;
  const polyline = trip.planned?.polyline;

  if (geoJson?.coordinates?.length > 1) {
    // GeoJSON: coordenadas são [lng, lat]
    const path = geoJson.coordinates.map(([lng, lat]) => ({ lat, lng }));
    layers.route = new window.google.maps.Polyline({
      path,
      map,
      strokeColor: color,
      strokeOpacity: 0.75,
      strokeWeight: 4,
      zIndex: 1,
    });
  } else if (polyline && window.google.maps.geometry?.encoding) {
    // Google Encoded Polyline (requer lib geometry)
    const path = window.google.maps.geometry.encoding.decodePath(polyline);
    layers.route = new window.google.maps.Polyline({
      path,
      map,
      strokeColor: color,
      strokeOpacity: 0.75,
      strokeWeight: 4,
      zIndex: 1,
    });
  }

  // ── Marcador de Origem ────────────────────────────────────────────────────
  if (trip.origin?.lat != null) {
    const el = document.createElement('div');
    el.innerHTML = `<div style="background:#28a745;width:14px;height:14px;border-radius:50%;
      border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);"></div>`;
    layers.originMarker = new window.google.maps.marker.AdvancedMarkerElement({
      map,
      position: { lat: trip.origin.lat, lng: trip.origin.lng },
      title: `Origem: ${trip.origin.address}`,
      content: el,
      zIndex: 2,
    });
  }

  // ── Marcador de Destino ───────────────────────────────────────────────────
  if (trip.destination?.lat != null) {
    const el = document.createElement('div');
    el.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="background:#dc3545;color:#fff;border-radius:4px;
          padding:2px 6px;font-size:10px;font-weight:700;white-space:nowrap;
          box-shadow:0 1px 4px rgba(0,0,0,.35);">🏁 ${trip.destination.address.slice(0, 28)}…</div>
        <div style="width:2px;height:8px;background:#dc3545;"></div>
      </div>`;
    layers.destMarker = new window.google.maps.marker.AdvancedMarkerElement({
      map,
      position: { lat: trip.destination.lat, lng: trip.destination.lng },
      title: `Destino: ${trip.destination.address}`,
      content: el,
      zIndex: 3,
    });
  }

  return layers;
}

/** Remove todos os layers de uma rota do mapa */
function clearRouteLayers(layers) {
  if (!layers) return;
  layers.route?.setMap(null);
  if (layers.originMarker) layers.originMarker.map = null;
  if (layers.destMarker)   layers.destMarker.map   = null;
}

/** Estima distância haversine entre dois pontos (km) */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

/** ETA formatado com base na distância restante e velocidade atual */
function calcEta(remainingKm, speedKmh) {
  const spd = speedKmh > 5 ? speedKmh : 60;
  const hours = remainingKm / spd;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h > 0) return `~${h}h ${m}m`;
  return `~${m}m`;
}

export default function ControlTowerBody() {
  const mapRef       = useRef(null);
  const mapInstance  = useRef(null);
  const markersRef   = useRef({});
  const routeLayersRef = useRef({}); // tripId → { route, originMarker, destMarker }
  const pollTimer    = useRef(null);
  const sseRef       = useRef(null);
  const socketRef    = useRef(null);

  const [mapReady,       setMapReady]       = useState(false);
  const [devices,        setDevices]        = useState([]);
  const [positions,      setPositions]      = useState([]);
  const [activeTrips,    setActiveTrips]    = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [selectedTripPanel, setSelectedTripPanel] = useState(null);
  const [isLive,         setIsLive]         = useState(true);
  const [lastRefresh,    setLastRefresh]    = useState(null);
  const [refreshing,     setRefreshing]     = useState(false);
  const [showAll,        setShowAll]        = useState(false);
  const [sseConnected,   setSseConnected]   = useState(false);
  const [tripAlerts,     setTripAlerts]     = useState([]);
  const [alertsLoading,  setAlertsLoading]  = useState(false);
  const [commandType,    setCommandType]    = useState('message');
  const [commandMessage, setCommandMessage] = useState('');
  const [commandSending, setCommandSending] = useState(false);
  const [commandFeedback, setCommandFeedback] = useState('');
  const [driverCommands, setDriverCommands] = useState([]);

  // ── Busca dados ────────────────────────────────────────────────────────────

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const [d, p, t] = await Promise.allSettled([
        getTraccarDevices(),
        getPositions(),
        getPlannedTrips({ status: 'in_progress', limit: 50 }),
      ]);
      if (d.status === 'fulfilled' && Array.isArray(d.value)) setDevices(d.value);
      if (p.status === 'fulfilled' && Array.isArray(p.value)) setPositions(p.value);
      if (t.status === 'fulfilled') {
        const trips = Array.isArray(t.value) ? t.value : (t.value?.items ?? []);
        setActiveTrips(trips);
      }
      setLastRefresh(new Date());
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchTripAlerts = useCallback(async (tripId) => {
    if (!tripId) { setTripAlerts([]); return; }
    setAlertsLoading(true);
    try {
      const res = await getTripAlerts({ tripId });
      const all = Array.isArray(res) ? res : (res?.items ?? []);
      setTripAlerts(all.filter(a => a.status === 'open' || a.status === 'acknowledged'));
    } catch { setTripAlerts([]); }
    finally { setAlertsLoading(false); }
  }, []);

  const handleAlertAction = useCallback(async (alertId, status) => {
    try {
      await updateTripAlert(alertId, { status });
      if (status === 'resolved' || status === 'dismissed') {
        setTripAlerts(prev => prev.filter(a => a._id !== alertId));
      } else {
        setTripAlerts(prev => prev.map(a => a._id === alertId ? { ...a, status } : a));
      }
    } catch (e) { console.error('Erro ao atualizar alerta:', e); }
  }, []);

  const sendDriverCommand = useCallback(async (trip) => {
    const tripId = String(trip?._id ?? trip?.id ?? '');
    if (!tripId) return;
    setCommandSending(true);
    setCommandFeedback('');
    try {
      const command = await apiRequest(`/driver/admin/trips/${tripId}/commands`, {
        method: 'POST',
        body: {
          type: commandType,
          message: commandMessage.trim() || undefined,
        },
      });
      setDriverCommands(prev => [command, ...prev.filter(item => String(item._id ?? item.id) !== String(command._id ?? command.id))].slice(0, 20));
      setCommandMessage('');
      setCommandFeedback('Comando enviado ao motorista.');
    } catch (e) {
      setCommandFeedback(e?.message ?? 'Falha ao enviar comando.');
    } finally {
      setCommandSending(false);
    }
  }, [commandMessage, commandType]);

  const fetchDriverCommands = useCallback(async (tripId) => {
    if (!tripId) { setDriverCommands([]); return; }
    try {
      const data = await apiRequest(`/driver/admin/trips/${tripId}/commands`);
      setDriverCommands(Array.isArray(data) ? data : []);
    } catch {
      setDriverCommands([]);
    }
  }, []);

  // ── Polling de posições ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isLive) {
      sseRef.current?.close(); sseRef.current = null; setSseConnected(false);
      socketRef.current?.disconnect(); socketRef.current = null;
      clearInterval(pollTimer.current); return;
    }
    pollTimer.current = setInterval(() => fetchData(true), POLL_INTERVAL_MS);
    return () => {
      sseRef.current?.close(); sseRef.current = null; setSseConnected(false);
      socketRef.current?.disconnect(); socketRef.current = null;
      clearInterval(pollTimer.current);
    };
  }, [isLive, fetchData]);

  // ── WebSocket: eventos de viagem ──────────────────────────────────────────
  useEffect(() => {
    if (!isLive) return;
    let cancelled = false;

    async function connectTripRealtime() {
      try {
        const [baseUrl, token] = await Promise.all([
          resolveApiBaseUrl(),
          Promise.resolve(getAccessToken()),
        ]);
        if (!token || cancelled) return;

        const io = await loadSocketIoScript(baseUrl);
        if (cancelled) return;

        const socket = io(`${baseUrl.replace(/\/+$/, '')}/fleet-realtime`, {
          transports: ['websocket', 'polling'],
          auth: { type: 'operator', token },
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 10000,
        });

        socketRef.current = socket;

        socket.on('realtime.ready', () => {
          setSseConnected(true);
          clearInterval(pollTimer.current);
        });

        socket.on('trip.updated', (payload) => {
          const trip = payload?.trip;
          const tripId = String(payload?.tripId ?? trip?._id ?? trip?.id ?? '');
          if (!tripId) return;

          setActiveTrips(prev => {
            const exists = prev.some(t => String(t._id ?? t.id) === tripId);
            if (!isTripVisibleInTower(trip)) {
              return prev.filter(t => String(t._id ?? t.id) !== tripId);
            }
            if (!exists) return [trip, ...prev];
            return prev.map(t => String(t._id ?? t.id) === tripId ? { ...t, ...trip } : t);
          });

          setSelectedTripPanel(prev => {
            if (!prev || String(prev._id ?? prev.id) !== tripId) return prev;
            return { ...prev, ...trip };
          });

          setLastRefresh(new Date());
        });

        socket.on('driver.command.created', (payload) => {
          const command = payload?.command;
          if (!command) return;
          setDriverCommands(prev => [command, ...prev.filter(item => String(item._id ?? item.id) !== String(command._id ?? command.id))].slice(0, 20));
        });

        socket.on('driver.command.updated', (payload) => {
          const command = payload?.command;
          if (!command) return;
          setDriverCommands(prev => prev.map(item =>
            String(item._id ?? item.id) === String(command._id ?? command.id) ? command : item
          ));
        });

        socket.on('disconnect', () => {
          if (!pollTimer.current) {
            pollTimer.current = setInterval(() => fetchData(true), POLL_INTERVAL_MS);
          }
        });

        socket.on('connect_error', (error) => {
          console.warn('Realtime de viagens indisponível:', error?.message ?? error);
          if (!pollTimer.current) {
            pollTimer.current = setInterval(() => fetchData(true), POLL_INTERVAL_MS);
          }
        });
      } catch (error) {
        console.warn('Falha ao iniciar realtime de viagens:', error);
      }
    }

    connectTripRealtime();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [isLive, fetchData]);

  // ── Inicializa mapa ────────────────────────────────────────────────────────
  useEffect(() => {
    loadGoogleMapsScript(GOOGLE_MAPS_API_KEY).then(() => {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: -22.9068, lng: -43.1729 },
        zoom: 11,
        ...(GOOGLE_MAPS_MAP_ID ? { mapId: GOOGLE_MAPS_MAP_ID } : {}),
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });
      mapInstance.current = map;
      setMapReady(true);
    }).catch(console.error);
    return () => {
      // Limpa rotas ao desmontar
      Object.values(routeLayersRef.current).forEach(clearRouteLayers);
      routeLayersRef.current = {};
    };
  }, []);

  // ── Markers dos veículos ───────────────────────────────────────────────────
  const devicesWithPos = useMemo(() =>
    devices.map(d => ({
      ...d,
      position: positions.find(p => p.deviceId === d.id),
    })),
  [devices, positions]);

  const initialFitDone = useRef(false);

  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    const map = mapInstance.current;
    const bounds = new window.google.maps.LatLngBounds();
    let hasAny = false;

    devicesWithPos.forEach(device => {
      if (!device.position) return;
      upsertMarker(map, markersRef, device, device.position, setSelectedDevice);
      bounds.extend({ lat: device.position.latitude, lng: device.position.longitude });
      hasAny = true;
    });

    if (hasAny && !initialFitDone.current) {
      initialFitDone.current = true;
      if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
        map.setCenter(bounds.getCenter()); map.setZoom(15);
      } else {
        map.fitBounds(bounds, { padding: 80 });
      }
    }
  }, [mapReady, devicesWithPos]);

  // ── Overlay de rotas ativas ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    const map = mapInstance.current;
    const currentIds = new Set(activeTrips.map(t => String(t._id)));

    // Remove rotas que já não estão ativas
    Object.keys(routeLayersRef.current).forEach(id => {
      if (!currentIds.has(id)) {
        clearRouteLayers(routeLayersRef.current[id]);
        delete routeLayersRef.current[id];
      }
    });

    // Adiciona / mantém rotas ativas
    activeTrips.forEach((trip, idx) => {
      const id = String(trip._id);
      if (routeLayersRef.current[id]) return; // já desenhada
      const color = ROUTE_COLORS[idx % ROUTE_COLORS.length];
      const layers = drawRouteOnMap(map, trip, color);
      if (Object.keys(layers).length > 0) {
        routeLayersRef.current[id] = { ...layers, color };
      }
    });
  }, [mapReady, activeTrips]);

  // ── Foca device no mapa ────────────────────────────────────────────────────
  const focusDevice = (device) => {
    const withPos = devicesWithPos.find(d => d.id === device.id) ?? device;
    setSelectedDevice(withPos);
    if (mapInstance.current && withPos.position) {
      mapInstance.current.panTo({ lat: withPos.position.latitude, lng: withPos.position.longitude });
      mapInstance.current.setZoom(16);
    }
  };

  // ── Trip ativa vinculada ao device selecionado ─────────────────────────────
  const selectedTrip = useMemo(() => {
    if (!selectedDevice) return null;
    const vehicleId = selectedDevice.linkedVehicle?._id ?? selectedDevice.linkedVehicleId;
    if (!vehicleId) return null;
    return activeTrips.find(t => String(t.vehicleId) === String(vehicleId) || String(t.vehicle?._id) === String(vehicleId)) ?? null;
  }, [selectedDevice, activeTrips]);

  useEffect(() => {
    const id = selectedTripPanel?._id ?? selectedTrip?._id;
    fetchTripAlerts(id);
    fetchDriverCommands(id);
  }, [selectedTripPanel, selectedTrip, fetchTripAlerts, fetchDriverCommands]);

  // ── Contadores ─────────────────────────────────────────────────────────────
  const onlineCount  = devices.filter(d => d.status === 'online').length;
  const offlineCount = devices.filter(d => d.status === 'offline').length;
  const unknownCount = devices.filter(d => d.status === 'unknown' || !d.status).length;

  const devicesWithPosSorted = useMemo(() => ({
    withPos:    devicesWithPos.filter(d => d.position),
    withoutPos: devicesWithPos.filter(d => !d.position),
  }), [devicesWithPos]);

  const selectedId = selectedDevice?.id ?? null;

  return (
    <div style={{ height: 'calc(100vh - 60px)', display: 'flex', overflow: 'hidden' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <div style={{ width: 320, borderRight: '1px solid #dee2e6', background: 'var(--bs-body-bg)', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div className="p-3 border-bottom">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h6 className="fw-bold mb-0">Torre de Controle</h6>
            <Button
              variant={isLive ? 'soft-success' : 'soft-secondary'}
              size="sm"
              className="d-flex align-items-center gap-1"
              onClick={() => setIsLive(l => !l)}
            >
              <span className={`rounded-circle d-inline-block bg-${isLive ? 'success' : 'secondary'}`} style={{ width: 8, height: 8 }} />
              {isLive ? 'Ao vivo' : 'Pausado'}
            </Button>
          </div>

          <div className="d-flex gap-2 mb-2">
            <Badge bg="success" className="text-white">{onlineCount} online</Badge>
            <Badge bg="danger"  className="text-white">{offlineCount} offline</Badge>
            <Badge bg="secondary" className="text-white">{unknownCount} inativo</Badge>
            {activeTrips.length > 0 && (
              <Badge bg="primary" className="text-white">{activeTrips.length} viagem{activeTrips.length > 1 ? 's' : ''}</Badge>
            )}
          </div>

          <div className="d-flex align-items-center justify-content-between">
            <Button variant="link" size="sm" className="p-0 text-muted d-flex align-items-center gap-1" onClick={() => fetchData()}>
              {refreshing ? <Spinner size="sm" /> : <RefreshCw size={12} />}
              <span className="small">Atualizar</span>
            </Button>
            {lastRefresh && (
              <small className="text-muted">
                {lastRefresh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </small>
            )}
          </div>
        </div>

        {/* Viagens ativas */}
        {activeTrips.length > 0 && (
          <div className="px-3 py-2 border-bottom" style={{ background: 'rgba(13,110,253,.06)' }}>
            <small className="fw-semibold text-primary d-block mb-1">
              <Navigation size={11} className="me-1" />VIAGENS EM ANDAMENTO
            </small>
            {activeTrips.slice(0, 3).map((trip, idx) => (
              <div
                key={trip._id}
                className="d-flex align-items-center gap-2 mb-1 rounded px-1"
                style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                onClick={() => { setSelectedTripPanel(trip); setSelectedDevice(null); }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(13,110,253,.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: ROUTE_COLORS[idx % ROUTE_COLORS.length], flexShrink: 0 }} />
                <small className="text-truncate text-muted" style={{ flex: 1 }}>
                  {trip.vehicle?.name ?? '–'} → {trip.destination?.address?.slice(0, 24)}…
                </small>
                <small className="text-primary" style={{ fontSize: '0.65rem' }}>ver</small>
              </div>
            ))}
            {activeTrips.length > 3 && <small className="text-muted">+{activeTrips.length - 3} mais</small>}
          </div>
        )}

        {/* Lista de devices */}
        <SimpleBar style={{ flex: 1 }}>
          {devicesWithPosSorted.withPos.map(device => {
            const cfg = statusConfig[device.status] ?? statusConfig.unknown;
            const pos = device.position;
            const isSelected = device.id === selectedId;
            const label = device.linkedVehicle?.name ?? device.name;
            const sub   = device.linkedVehicle?.plate ?? (device.attributes?.deviceKind ? `📱 ${device.attributes.deviceKind}` : null);
            // Verifica se tem viagem ativa
            const vehicleId = device.linkedVehicle?._id ?? device.linkedVehicleId;
            const hasActiveTrip = vehicleId && activeTrips.some(t =>
              String(t.vehicleId) === String(vehicleId) || String(t.vehicle?._id) === String(vehicleId)
            );
            return (
              <div
                key={device.id}
                onClick={() => focusDevice(device)}
                className={`p-3 border-bottom ${isSelected ? 'bg-primary bg-opacity-10 border-start border-primary border-3' : ''}`}
                style={{ cursor: 'pointer', transition: 'background 0.2s' }}
              >
                <div className="d-flex align-items-start gap-2">
                  <div className="mt-1" style={{ fontSize: 20 }}>{deviceEmoji(device)}</div>
                  <div className="flex-fill min-w-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <strong className="small text-truncate">{label}</strong>
                      <div className="d-flex align-items-center gap-1">
                        {hasActiveTrip && <Navigation size={10} className="text-primary" title="Viagem em andamento" />}
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                      </div>
                    </div>
                    {sub && <small className="text-muted d-block">{sub}</small>}
                    <small className="text-muted d-block">
                      {pos?.attributes?.ignition ? '🔑 Ligado' : '🔒 Desligado'} · {pos?.speed ?? 0} km/h
                    </small>
                    <small className="text-muted d-block text-truncate">
                      {pos?.address ?? `${pos.latitude?.toFixed(4)}, ${pos.longitude?.toFixed(4)}`}
                    </small>
                  </div>
                </div>
              </div>
            );
          })}

          {devicesWithPosSorted.withoutPos.length > 0 && (
            <>
              <div
                className="px-3 py-2 d-flex align-items-center justify-content-between"
                style={{ background: 'var(--bs-secondary-bg)', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setShowAll(v => !v)}
              >
                <small className="text-muted fw-semibold">SEM SINAL ({devicesWithPosSorted.withoutPos.length})</small>
                <small className="text-muted">{showAll ? '▲' : '▼'}</small>
              </div>
              {showAll && devicesWithPosSorted.withoutPos.map(device => {
                const cfg = statusConfig[device.status] ?? statusConfig.unknown;
                const isSelected = device.id === selectedId;
                const label = device.linkedVehicle?.name ?? device.name;
                const sub   = device.attributes?.deviceKind ? `📱 ${device.attributes.deviceKind}` : device.uniqueId;
                return (
                  <div key={device.id} onClick={() => setSelectedDevice(device)}
                    className={`p-3 border-bottom opacity-60 ${isSelected ? 'bg-primary bg-opacity-10' : ''}`}
                    style={{ cursor: 'pointer' }}>
                    <div className="d-flex align-items-start gap-2">
                      <div className="mt-1 opacity-50" style={{ fontSize: 18 }}>{deviceEmoji(device)}</div>
                      <div className="flex-fill min-w-0">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="small text-muted text-truncate">{label}</span>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                        </div>
                        {sub && <small className="text-muted d-block">{sub}</small>}
                        <small className="text-muted d-block">📡 Sem posição</small>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {devicesWithPos.length === 0 && (
            <div className="text-center text-muted py-5">
              <Truck size={32} className="mb-2 opacity-25" />
              <p className="small">Nenhum device cadastrado.</p>
            </div>
          )}
        </SimpleBar>
      </div>

      {/* ── Mapa ────────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

        {/* Painel do device selecionado */}
        {selectedDevice && (
          <div style={{ position: 'absolute', bottom: 24, left: 24, zIndex: 10, width: 340 }}>
            <Card className="shadow-lg border-0">
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h6 className="fw-bold mb-0">{selectedDevice.linkedVehicle?.name ?? selectedDevice.name}</h6>
                    <small className="text-muted">
                      {selectedDevice.linkedVehicle?.plate && `${selectedDevice.linkedVehicle.plate} · `}
                      {selectedDevice.linkedVehicle?.model ?? selectedDevice.attributes?.deviceKind ?? 'Device'}
                    </small>
                  </div>
                  <Badge
                    bg={selectedDevice.status === 'online' ? 'success' : selectedDevice.status === 'offline' ? 'danger' : 'secondary'}
                    className="text-white"
                  >
                    {statusConfig[selectedDevice.status]?.label ?? 'Inativo'}
                  </Badge>
                </div>

                {selectedDevice.position ? (
                  <>
                    <div className="row g-2 text-center mb-2">
                      <div className="col-4">
                        <div className="bg-light rounded p-2">
                          <div className="fw-bold">{selectedDevice.position.speed ?? '--'}</div>
                          <small className="text-muted">km/h</small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="bg-light rounded p-2">
                          <div className="fw-bold">
                            {selectedDevice.position.attributes?.batteryLevel ?? '--'}
                            {selectedDevice.position.attributes?.batteryLevel !== undefined ? '%' : ''}
                          </div>
                          <small className="text-muted">Bateria</small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="bg-light rounded p-2">
                          <div className="fw-bold">{selectedDevice.position.attributes?.ignition ? 'Sim' : 'Não'}</div>
                          <small className="text-muted">Ligado</small>
                        </div>
                      </div>
                    </div>
                    <p className="text-muted small mb-1">
                      📍 {selectedDevice.position.address || `${selectedDevice.position.latitude?.toFixed(5)}, ${selectedDevice.position.longitude?.toFixed(5)}`}
                    </p>
                    {selectedDevice.position.attributes?.totalDistance > 0 && (
                      <p className="text-muted small mb-1">
                        🛣️ {Math.round(selectedDevice.position.attributes.totalDistance / 1000).toLocaleString('pt-BR')} km total
                      </p>
                    )}
                    {!selectedDevice.linked && (
                      <p className="text-warning small mb-1">⚠️ Device não vinculado a um veículo.</p>
                    )}
                  </>
                ) : (
                  <p className="text-muted small mb-2">📡 Aguardando primeiro sinal GPS…</p>
                )}

                {/* Painel de viagem ativa */}
                {selectedTrip && (
                  <div className="mt-2 pt-2 border-top">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <div className="d-flex align-items-center gap-1">
                        <Navigation size={12} className="text-primary" />
                        <small className="fw-semibold text-primary">Viagem em andamento</small>
                      </div>
                      {selectedTrip.executionStage && (() => {
                        const s = STAGE_LABELS[selectedTrip.executionStage] ?? { label: selectedTrip.executionStage, color: '#6c757d' };
                        return <span className="badge" style={{ background: s.color, color: '#fff', fontSize: '0.6rem' }}>{s.label}</span>;
                      })()}
                    </div>
                    <div className="d-flex align-items-start gap-1 mb-1">
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#28a745', flexShrink: 0, marginTop: 4 }} />
                      <small className="text-muted text-truncate">{selectedTrip.origin?.address}</small>
                    </div>
                    <div className="d-flex align-items-center ps-1 mb-1">
                      <ChevronRight size={10} className="text-muted" />
                    </div>
                    <div className="d-flex align-items-start gap-1 mb-2">
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc3545', flexShrink: 0, marginTop: 4 }} />
                      <small className="text-muted text-truncate">{selectedTrip.destination?.address}</small>
                    </div>

                    {/* ETA estimado */}
                    {selectedDevice.position && selectedTrip.destination?.lat != null && (
                      (() => {
                        const remainKm = haversineKm(
                          selectedDevice.position.latitude,
                          selectedDevice.position.longitude,
                          selectedTrip.destination.lat,
                          selectedTrip.destination.lng,
                        );
                        const eta = calcEta(remainKm, selectedDevice.position.speed ?? 0);
                        return (
                          <div className="d-flex justify-content-between mb-2">
                            <small className="text-muted">Distância restante</small>
                            <small className="fw-semibold">{remainKm.toFixed(1)} km · {eta}</small>
                          </div>
                        );
                      })()
                    )}

                    {/* Timeline de eventos do motorista */}
                    {(() => {
                      const evts = (selectedTrip.events ?? [])
                        .filter(e => e.type !== 'location_update')
                        .slice(-6)
                        .reverse();
                      if (!evts.length) return null;
                      return (
                        <div className="pt-2 border-top">
                          <small className="text-muted fw-semibold d-block mb-1" style={{ fontSize: '0.65rem', letterSpacing: 1 }}>
                            EVENTOS DO MOTORISTA
                          </small>
                          {evts.map((evt, i) => (
                            <div key={i} className="d-flex align-items-start gap-2 mb-1">
                              <small style={{ color: '#888', fontSize: '0.65rem', whiteSpace: 'nowrap', marginTop: 2 }}>
                                {new Date(evt.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </small>
                              <small style={{ fontSize: '0.75rem' }}>
                                {EVENT_LABELS[evt.type] ?? evt.type}
                                {evt.type === 'occurrence_reported' && evt.metadata?.occurrenceType && (
                                  <span className="text-muted"> — {evt.metadata.occurrenceType}</span>
                                )}
                              </small>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}

                <button className="btn btn-xs btn-light w-100 mt-2" onClick={() => setSelectedDevice(null)}>Fechar</button>
              </Card.Body>
            </Card>
          </div>
        )}

        {/* Painel de viagem selecionada diretamente (sem device GPS) */}
        {selectedTripPanel && !selectedDevice && (() => {
          const trip = selectedTripPanel;
          const evts = (trip.events ?? []).filter(e => e.type !== 'location_update');
          return (
            <div style={{ position: 'absolute', bottom: 24, left: 24, zIndex: 10, width: 360 }}>
              <Card className="shadow-lg border-0">
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h6 className="fw-bold mb-0">{trip.vehicle?.name ?? '–'}</h6>
                      <small className="text-muted">
                        {trip.driver?.name ?? '–'} · {trip.vehicle?.plate ?? ''}
                      </small>
                    </div>
                    <div className="d-flex flex-column align-items-end gap-1">
                      <Badge bg="primary" className="text-white">Em andamento</Badge>
                      {trip.executionStage && (() => {
                        const s = STAGE_LABELS[trip.executionStage] ?? { label: trip.executionStage, color: '#6c757d' };
                        return <span className="badge" style={{ background: s.color, color: '#fff', fontSize: '0.6rem' }}>{s.label}</span>;
                      })()}
                    </div>
                  </div>

                  <div className="d-flex align-items-start gap-1 mb-1">
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#28a745', flexShrink: 0, marginTop: 4 }} />
                    <small className="text-muted text-truncate">{trip.origin?.address ?? '–'}</small>
                  </div>
                  <div className="d-flex align-items-center ps-1 mb-1">
                    <ChevronRight size={10} className="text-muted" />
                  </div>
                  <div className="d-flex align-items-start gap-1 mb-3">
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc3545', flexShrink: 0, marginTop: 4 }} />
                    <small className="text-muted text-truncate">{trip.destination?.address ?? '–'}</small>
                  </div>

                  {evts.length > 0 ? (
                    <div className="border-top pt-2">
                      <small className="text-muted fw-semibold d-block mb-2" style={{ fontSize: '0.65rem', letterSpacing: 1 }}>
                        EVENTOS DO MOTORISTA ({evts.length})
                      </small>
                      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                        {evts.slice().reverse().map((evt, i) => (
                          <div key={i} className="d-flex align-items-start gap-2 mb-2">
                            <small style={{ color: '#888', fontSize: '0.65rem', whiteSpace: 'nowrap', marginTop: 2 }}>
                              {new Date(evt.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </small>
                            <small style={{ fontSize: '0.8rem' }}>
                              {EVENT_LABELS[evt.type] ?? evt.type}
                              {evt.type === 'occurrence_reported' && evt.metadata?.occurrenceType && (
                                <span className="text-muted"> — {evt.metadata.occurrenceType}</span>
                              )}
                            </small>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted small text-center mb-0">Nenhum evento registrado ainda.</p>
                  )}

                  <div className="border-top pt-2 mt-2">
                    <small className="text-muted fw-semibold d-block mb-2" style={{ fontSize: '0.65rem', letterSpacing: 1 }}>
                      COMANDO AO MOTORISTA
                    </small>
                    <select
                      className="form-select form-select-sm mb-2"
                      value={commandType}
                      onChange={(event) => setCommandType(event.target.value)}
                    >
                      {COMMAND_TYPES.map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <textarea
                      className="form-control form-control-sm mb-2"
                      rows={2}
                      value={commandMessage}
                      onChange={(event) => setCommandMessage(event.target.value)}
                      placeholder="Mensagem ou instrução para o motorista"
                    />
                    {commandFeedback && (
                      <small className="d-block mb-2 text-muted">{commandFeedback}</small>
                    )}
                    <button
                      className="btn btn-outline-primary btn-sm w-100"
                      disabled={commandSending}
                      onClick={() => sendDriverCommand(trip)}
                    >
                      {commandSending ? 'Enviando…' : 'Enviar comando'}
                    </button>
                    {driverCommands.length > 0 && (
                      <div className="mt-2">
                        {driverCommands.slice(0, 4).map((command) => (
                          <div key={command._id ?? command.id} className="d-flex justify-content-between gap-2 mb-1">
                            <small className="text-truncate" style={{ fontSize: '0.68rem' }}>
                              {COMMAND_TYPES.find(([value]) => value === command.type)?.[1] ?? command.type}
                            </small>
                            <small className="text-muted" style={{ fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                              {COMMAND_STATUS_LABELS[command.status] ?? command.status}
                            </small>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Alertas operacionais */}
                  {(tripAlerts.length > 0 || alertsLoading) && (
                    <div className="border-top pt-2 mt-2">
                      <small className="text-muted fw-semibold d-block mb-1" style={{ fontSize: '0.65rem', letterSpacing: 1 }}>
                        ALERTAS OPERACIONAIS {alertsLoading ? '…' : `(${tripAlerts.length})`}
                      </small>
                      {tripAlerts.map(alert => {
                        const meta = ALERT_META[alert.type] ?? { label: alert.type, icon: '⚠️' };
                        return (
                          <div key={alert._id} className="d-flex align-items-start gap-2 mb-2 p-2 rounded"
                            style={{ background: 'rgba(220,53,69,.07)', border: '1px solid rgba(220,53,69,.2)' }}>
                            <span style={{ fontSize: 13, marginTop: 1 }}>{meta.icon}</span>
                            <div className="flex-fill min-w-0">
                              <div className="d-flex align-items-center gap-1 mb-1">
                                <small className="fw-semibold" style={{ fontSize: '0.72rem' }}>{meta.label}</small>
                                <span className={`badge bg-${alert.severity === 'critical' ? 'danger' : alert.severity === 'high' ? 'warning' : 'secondary'}`}
                                  style={{ fontSize: '0.58rem', color: alert.severity === 'high' ? '#000' : '#fff' }}>
                                  {alert.severity}
                                </span>
                              </div>
                              {alert.message && <small className="text-muted d-block" style={{ fontSize: '0.68rem' }}>{alert.message}</small>}
                              <div className="d-flex align-items-center gap-1 mt-1 flex-wrap">
                                {alert.status === 'open' && (
                                  <button className="btn btn-outline-warning py-0 px-1" style={{ fontSize: '0.62rem' }}
                                    onClick={() => handleAlertAction(alert._id, 'acknowledged')}>Reconhecer</button>
                                )}
                                {(alert.status === 'open' || alert.status === 'acknowledged') && (
                                  <>
                                    <button className="btn btn-outline-success py-0 px-1" style={{ fontSize: '0.62rem' }}
                                      onClick={() => handleAlertAction(alert._id, 'resolved')}>Resolver</button>
                                    <button className="btn btn-outline-secondary py-0 px-1" style={{ fontSize: '0.62rem' }}
                                      onClick={() => handleAlertAction(alert._id, 'dismissed')}>Ignorar</button>
                                  </>
                                )}
                                <small className="text-muted ms-auto" style={{ fontSize: '0.6rem' }}>
                                  {alert.status === 'acknowledged' ? '👁 Reconhecido' : '🔴 Aberto'}
                                </small>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button className="btn btn-xs btn-light w-100 mt-2" onClick={() => { setSelectedTripPanel(null); setTripAlerts([]); }}>Fechar</button>
                </Card.Body>
              </Card>
            </div>
          );
        })()}

        {/* Indicador ao vivo */}
        {isLive && (
          <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
            <Badge bg={sseConnected ? 'success' : 'warning'} text={sseConnected ? 'white' : 'dark'} className="d-flex align-items-center gap-1 shadow-sm py-2 px-3">
              <span className={`rounded-circle d-inline-block bg-${sseConnected ? 'white' : 'dark'}`} style={{ width: 6, height: 6, animation: 'pulse 1.5s infinite' }} />
              {sseConnected ? 'Ao vivo (SSE)' : 'Polling 30s'}
            </Badge>
          </div>
        )}

        {/* Legenda de rotas */}
        {activeTrips.length > 0 && (
          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10 }}>
            <Card className="shadow-sm border-0" style={{ minWidth: 180 }}>
              <Card.Body className="p-2">
                <small className="fw-semibold d-block mb-1 text-muted">ROTAS ATIVAS</small>
                {activeTrips.slice(0, 5).map((trip, idx) => (
                  <div key={trip._id} className="d-flex align-items-center gap-2 mb-1">
                    <span style={{ width: 20, height: 4, borderRadius: 2, background: ROUTE_COLORS[idx % ROUTE_COLORS.length], flexShrink: 0 }} />
                    <small className="text-truncate" style={{ maxWidth: 140 }}>
                      {trip.vehicle?.name ?? '–'}
                    </small>
                    <MapPin size={10} className="text-danger flex-shrink-0" title={trip.destination?.address} />
                  </div>
                ))}
              </Card.Body>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
