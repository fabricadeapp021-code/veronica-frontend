'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card, Badge, Table, Button, Form, InputGroup, Row, Col, Modal,
  Spinner, Alert, Tabs, Tab, ProgressBar,
} from 'react-bootstrap';
import {
  Search, Navigation, Clock, Eye, CheckCircle, AlertCircle,
  Play, Pause, RotateCcw, MapPin, Plus, Truck, X, AlertTriangle,
  CheckSquare, XCircle, ChevronRight, Layers, DollarSign,
} from 'react-feather';
import SimpleBar from 'simplebar-react';
import {
  getPlannedTrips, createPlannedTrip, previewRoute as apiPreviewRoute,
  updateTripStatus, addTripOccurrence, deletePlannedTrip,
  getTrips, getRouteReport, todayRange,
  getVehicles, getDrivers,
} from '@/lib/api/services/fleet';
import { createWizard } from '@/lib/api/services/tripWizard';
import { GooglePlaceInput, RoutePreviewMap, loadGoogleRouteLibraries } from '@/components/fleet/GoogleRoutePlanning';
import { useRouter } from 'next/navigation';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtSec = (sec) => {
  if (!sec) return '–';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '–';

const fmtKm = (meters) =>
  meters ? `${(meters / 1000).toFixed(1)} km` : '–';

const fmtCurrency = (val) =>
  val != null ? `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '–';

const parseBRNumber = (val) => {
  if (val == null || val === '') return 0;
  return Number(String(val).replace(/\./g, '').replace(',', '.')) || 0;
};

// ─── Configs ──────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  scheduled:   { bg: 'secondary', label: 'Agendada',     icon: <Clock size={11} /> },
  in_progress: { bg: 'primary',   label: 'Em andamento', icon: <Navigation size={11} /> },
  completed:   { bg: 'success',   label: 'Concluída',    icon: <CheckCircle size={11} /> },
  cancelled:   { bg: 'danger',    label: 'Cancelada',    icon: <XCircle size={11} /> },
  // traccar statuses
  running:     { bg: 'primary',   label: 'Em andamento', icon: <Navigation size={11} /> },
};

const CARGO_TYPES = [
  { value: 'general',     label: 'Carga geral' },
  { value: 'refrigerated',label: 'Frigorificado' },
  { value: 'hazmat',      label: 'Carga perigosa' },
  { value: 'bulk',        label: 'Granel' },
  { value: 'liquid',      label: 'Líquido' },
  { value: 'vehicle',     label: 'Veículo transportado' },
  { value: 'live',        label: 'Animais vivos' },
  { value: 'other',       label: 'Outros' },
];

const OCC_TYPES = [
  { value: 'breakdown',   label: 'Pane mecânica' },
  { value: 'delay',       label: 'Atraso' },
  { value: 'accident',    label: 'Acidente' },
  { value: 'theft',       label: 'Roubo / Furto' },
  { value: 'fuel',        label: 'Abastecimento' },
  { value: 'weather',     label: 'Condição climática' },
  { value: 'inspection',  label: 'Fiscalização / blitz' },
  { value: 'other',       label: 'Outros' },
];

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.scheduled;
  return (
    <Badge bg={cfg.bg} className="d-inline-flex align-items-center gap-1 text-white">
      {cfg.icon} {cfg.label}
    </Badge>
  );
}

// ─── Decodifica Google Encoded Polyline ───────────────────────────────────────
function decodePolyline(encoded) {
  const result = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let shift = 0, result_lat = 0;
    let b;
    do { b = encoded.charCodeAt(index++) - 63; result_lat |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += result_lat & 1 ? ~(result_lat >> 1) : result_lat >> 1;
    shift = 0; let result_lng = 0;
    do { b = encoded.charCodeAt(index++) - 63; result_lng |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += result_lng & 1 ? ~(result_lng >> 1) : result_lng >> 1;
    result.push([lat / 1e5, lng / 1e5]);
  }
  return result;
}

// ─── PlannedRouteMap — mapa da viagem planejada ───────────────────────────────
function PlannedRouteMap({ trip }) {
  const mapRef  = useRef(null);
  const mapInst = useRef(null);

  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;
    let cancelled = false;

    async function init() {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');
      if (cancelled) return;

      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current, { center: [-15.78, -47.93], zoom: 4 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' }).addTo(map);
      mapInst.current = map;

      const bounds = [];

      // ── Rota OSRM (GeoJSON LineString) ────────────────────────────────────
      if (trip.planned?.routeGeoJson) {
        const geoLayer = L.geoJSON(trip.planned.routeGeoJson, {
          style: { color: '#0d6efd', weight: 5, opacity: 0.85 },
        }).addTo(map);
        geoLayer.getBounds().isValid() && bounds.push(...Object.values(geoLayer.getBounds()));
        map.fitBounds(geoLayer.getBounds(), { padding: [50, 50] });
      }

      // ── Polyline Google (encoded) ─────────────────────────────────────────
      if (!trip.planned?.routeGeoJson && trip.planned?.polyline) {
        const pts = decodePolyline(trip.planned.polyline);
        if (pts.length > 1) {
          const poly = L.polyline(pts, { color: '#0d6efd', weight: 5 }).addTo(map);
          map.fitBounds(poly.getBounds(), { padding: [50, 50] });
          pts.forEach(p => bounds.push(p));
        }
      }

      // ── Ícones de Origem e Destino ────────────────────────────────────────
      const mkIcon = (color) => L.divIcon({
        className: '',
        html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.5)"></div>`,
        iconSize: [16, 16], iconAnchor: [8, 8],
      });

      if (trip.origin?.lat != null) {
        const ll = [trip.origin.lat, trip.origin.lng];
        L.marker(ll, { icon: mkIcon('#28a745') })
          .bindPopup(`<b>Origem</b><br>${trip.origin.address}`).addTo(map);
        bounds.push(ll);
      }

      if (trip.destination?.lat != null) {
        const ll = [trip.destination.lat, trip.destination.lng];
        L.marker(ll, { icon: mkIcon('#dc3545') })
          .bindPopup(`<b>Destino</b><br>${trip.destination.address}`).addTo(map);
        bounds.push(ll);
      }

      // ── Linha reta tracejada (sem rota real nem coordenadas suficientes) ──
      if (!trip.planned?.routeGeoJson && !trip.planned?.polyline
          && trip.origin?.lat != null && trip.destination?.lat != null) {
        const pts = [[trip.origin.lat, trip.origin.lng], [trip.destination.lat, trip.destination.lng]];
        L.polyline(pts, { color: '#6c757d', weight: 3, dashArray: '8 6' }).addTo(map);
        map.fitBounds(pts, { padding: [60, 60] });
      }

      // Ajusta viewport se OSRM não ajustou
      if (!trip.planned?.routeGeoJson && bounds.length >= 2) {
        try { map.fitBounds(bounds, { padding: [50, 50] }); } catch {}
      }
    }

    init().catch(console.error);
    return () => {
      cancelled = true;
      if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; }
    };
  }, [trip]);

  const hasRoute   = !!(trip.planned?.routeGeoJson || trip.planned?.polyline);
  const hasCoords  = trip.origin?.lat != null && trip.destination?.lat != null;
  const apiUsed    = trip.planned?.apiUsed;

  return (
    <div>
      {/* Cabeçalho da rota */}
      <div className="d-flex flex-wrap gap-3 mb-3 align-items-start">
        <div>
          <div className="d-flex align-items-center gap-1 mb-1">
            <span style={{ display:'inline-block', width:12, height:12, background:'#28a745', borderRadius:'50%' }} />
            <small className="fw-semibold">Origem</small>
          </div>
          <small className="text-muted">{trip.origin?.address}</small>
        </div>
        <div className="d-flex align-items-center text-muted pt-3"><ChevronRight size={16} /></div>
        <div>
          <div className="d-flex align-items-center gap-1 mb-1">
            <span style={{ display:'inline-block', width:12, height:12, background:'#dc3545', borderRadius:'50%' }} />
            <small className="fw-semibold">Destino</small>
          </div>
          <small className="text-muted">{trip.destination?.address}</small>
        </div>
        {trip.planned && (
          <div className="ms-auto d-flex gap-3">
            <div className="text-end">
              <small className="text-muted d-block">Distância</small>
              <strong className="small">{fmtKm(trip.planned.distanceMeters)}</strong>
            </div>
            <div className="text-end">
              <small className="text-muted d-block">Tempo est.</small>
              <strong className="small">{fmtSec(trip.planned.durationSeconds)}</strong>
            </div>
            {trip.planned.tollCostBRL != null && (
              <div className="text-end">
                <small className="text-muted d-block">Pedágios</small>
                <strong className="small">{fmtCurrency(trip.planned.tollCostBRL)}</strong>
              </div>
            )}
            <div className="text-end">
              <small className="text-muted d-block">Fonte</small>
              <Badge bg={apiUsed === 'routes_api' ? 'success' : apiUsed === 'osrm' ? 'primary' : 'secondary'} className="small">
                {apiUsed === 'routes_api' ? 'Google' : apiUsed === 'osrm' ? 'OSRM' : 'Estimativa'}
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Mapa */}
      <div ref={mapRef} style={{ height: 420, borderRadius: 8, border: '1px solid #dee2e6' }} />

      {/* Aviso sem rota */}
      {!hasRoute && !hasCoords && (
        <Alert variant="info" className="py-2 mt-2 small">
          <strong>Sem dados de rota.</strong> Edite a viagem e clique em &quot;Calcular Rota&quot; para ver o traçado real no mapa.
        </Alert>
      )}
      {!hasRoute && hasCoords && (
        <Alert variant="warning" className="py-2 mt-2 small">
          Mostrando linha reta entre os pontos. Clique em &quot;Calcular Rota&quot; para o traçado pelas estradas.
        </Alert>
      )}
    </div>
  );
}

// ─── RouteReplay (Traccar) ────────────────────────────────────────────────────

function RouteReplay({ trip }) {
  const mapRef    = useRef(null);
  const mapInst   = useRef(null);
  const markerRef = useRef(null);
  const polyRef   = useRef(null);
  const animRef   = useRef(null);
  const posRef    = useRef(0);

  const [points,  setPoints]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [playing, setPlaying] = useState(false);
  const [pos,     setPos]     = useState(0);
  const [speed,   setSpeed]   = useState(3);

  useEffect(() => {
    if (!trip) return;
    setLoading(true); setError('');
    const from = trip.startTime || trip.startedAt;
    const to   = trip.endTime   || trip.completedAt || new Date().toISOString();
    const deviceId = trip.deviceId || trip.vehicle?.traccarId;
    if (!deviceId) { setLoading(false); setError('Veículo sem device Traccar vinculado.'); return; }
    getRouteReport({ from, to, deviceId })
      .then(d => { const pts = Array.isArray(d) ? d : []; setPoints(pts); posRef.current = 0; setPos(0); })
      .catch(() => setError('Não foi possível carregar a rota do Traccar.'))
      .finally(() => setLoading(false));
  }, [trip]);

  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;
    async function init() {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');
      if (cancelled || mapInst.current) return;
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      const map = L.map(mapRef.current, { center: [-15.78, -47.93], zoom: 4 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' }).addTo(map);
      mapInst.current = map;
    }
    init().catch(console.error);
    return () => { cancelled = true; if (animRef.current) clearInterval(animRef.current); if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; } };
  }, []);

  useEffect(() => {
    if (!mapInst.current || !points.length) return;
    const L = window.L;
    if (polyRef.current)  mapInst.current.removeLayer(polyRef.current);
    if (markerRef.current) mapInst.current.removeLayer(markerRef.current);
    const latlngs = points.map(p => [p.latitude, p.longitude]);
    const fp = L.polyline(latlngs, { color: '#adb5bd', weight: 3, dashArray: '5 5' }).addTo(mapInst.current);
    polyRef.current = fp;
    const mk = L.marker(latlngs[0]).addTo(mapInst.current);
    markerRef.current = mk;
    mapInst.current.fitBounds(fp.getBounds(), { padding: [40, 40] });
    L.circleMarker(latlngs[0], { radius: 7, color: '#28a745', fillColor: '#28a745', fillOpacity: 1 }).bindTooltip('Início').addTo(mapInst.current);
    L.circleMarker(latlngs[latlngs.length - 1], { radius: 7, color: '#dc3545', fillColor: '#dc3545', fillOpacity: 1 }).bindTooltip('Fim').addTo(mapInst.current);
    setPos(0); posRef.current = 0;
  }, [points]);

  const startAnim = useCallback(() => {
    if (!points.length || !mapInst.current) return;
    const L = window.L;
    if (animRef.current) clearInterval(animRef.current);
    let bp = L.polyline([], { color: '#0d6efd', weight: 4 }).addTo(mapInst.current);
    animRef.current = setInterval(() => {
      posRef.current = Math.min(posRef.current + speed, points.length - 1);
      const p = points[posRef.current];
      const ll = [p.latitude, p.longitude];
      markerRef.current?.setLatLng(ll);
      bp.addLatLng(ll);
      mapInst.current.panTo(ll, { animate: true, duration: 0.3 });
      setPos(posRef.current);
      if (posRef.current >= points.length - 1) { clearInterval(animRef.current); setPlaying(false); }
    }, 100);
  }, [points, speed]);

  const progress = points.length > 0 ? Math.round((pos / (points.length - 1)) * 100) : 0;
  const cur = points[pos];

  return (
    <div>
      {error && <Alert variant="warning" className="py-2 small">{error}</Alert>}
      {loading && <div className="text-center py-4"><Spinner size="sm" className="me-2" /><small className="text-muted">Carregando rota…</small></div>}
      <div ref={mapRef} style={{ height: 360, border: '1px solid #dee2e6', borderRadius: 8 }} />
      {!loading && points.length > 0 && (
        <div className="mt-3">
          <div className="d-flex align-items-center gap-2 mb-2">
            <Button variant={playing ? 'warning' : 'primary'} size="sm"
              onClick={() => { if (pos >= points.length - 1) { setPos(0); posRef.current = 0; } setPlaying(true); startAnim(); }}>
              {playing ? <><Pause size={13} className="me-1" />Pausar</> : <><Play size={13} className="me-1" />Replay</>}
            </Button>
            <Button variant="light" size="sm" onClick={() => { if (animRef.current) clearInterval(animRef.current); setPlaying(false); setPos(0); posRef.current = 0; if (markerRef.current && points[0]) markerRef.current.setLatLng([points[0].latitude, points[0].longitude]); }}>
              <RotateCcw size={13} />
            </Button>
            <Form.Select size="sm" style={{ width: 130 }} value={speed} onChange={e => setSpeed(Number(e.target.value))}>
              <option value={1}>Lento</option><option value={3}>Normal</option><option value={8}>Rápido</option><option value={20}>Muito rápido</option>
            </Form.Select>
            <small className="text-muted ms-auto">{pos + 1} / {points.length}</small>
          </div>
          <div className="progress mb-2" style={{ height: 5 }}>
            <div className="progress-bar bg-primary" style={{ width: `${progress}%`, transition: 'none' }} />
          </div>
          {cur && (
            <Row className="g-2">
              {[
                { label: 'Hora', value: fmtDate(cur.fixTime || cur.deviceTime) },
                { label: 'Velocidade', value: `${Math.round(cur.speed ?? 0)} km/h` },
                { label: 'Lat/Lng', value: `${cur.latitude?.toFixed(5)}, ${cur.longitude?.toFixed(5)}` },
              ].map(i => (
                <Col key={i.label} xs={4}><small className="text-muted d-block">{i.label}</small><strong className="small">{i.value}</strong></Col>
              ))}
            </Row>
          )}
        </div>
      )}
      {!loading && !points.length && !error && <div className="text-center py-3 text-muted"><small>Nenhum ponto de rota disponível.</small></div>}
    </div>
  );
}

// ─── Modal de Nova Viagem ─────────────────────────────────────────────────────

function NewTripModal({ show, onHide, onCreated, vehicles, drivers }) {
  const EMPTY = {
    vehicleId: '', driverId: '', scheduledAt: '',
    originAddr: '', destAddr: '',
    originPlace: null, destPlace: null,
    cargoType: '', cargoWeightKg: '', cargoDesc: '',
    costPerKm: '', notes: '',
  };

  const [form,      setForm]      = useState(EMPTY);
  const [preview,   setPreview]   = useState(null);
  const [prevLoading, setPrevLoading] = useState(false);
  const [prevError,   setPrevError]   = useState('');
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const costPerKmValue = parseBRNumber(form.costPerKm);
  const previewDistanceKm = (preview?.distanceMeters ?? 0) / 1000;
  const previewTollCost = preview?.tollCostBRL ?? 0;
  const previewEstimatedCost = preview ? (previewDistanceKm * costPerKmValue) + previewTollCost : 0;

  const maskCurrency = (v) => {
    const clean = v.replace(/\D/g, '');
    if (!clean) return '';
    const num = parseInt(clean, 10) / 100;
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePreview = async () => {
    if (!form.originAddr || !form.destAddr) { setPrevError('Informe origem e destino.'); return; }
    setPrevLoading(true); setPrevError(''); setPreview(null);
    try {
      const veh = vehicles.find(v => v._id === form.vehicleId);
      const res = await apiPreviewRoute({
        origin: {
          address: form.originPlace?.address ?? form.originAddr,
          placeId: form.originPlace?.placeId,
          lat: form.originPlace?.lat,
          lng: form.originPlace?.lng,
        },
        destination: {
          address: form.destPlace?.address ?? form.destAddr,
          placeId: form.destPlace?.placeId,
          lat: form.destPlace?.lat,
          lng: form.destPlace?.lng,
        },
        vehicleCategory: veh?.category ?? 'truck',
      });
      setPreview(res);
    } catch (e) {
      setPrevError(e?.message ?? 'Erro ao calcular rota.');
    }
    setPrevLoading(false);
  };

  const handleCreate = async () => {
    if (!form.vehicleId || !form.originAddr || !form.destAddr || !form.scheduledAt) {
      setSaveError('Preencha veículo, origem, destino e data/hora.');
      return;
    }
    setSaving(true); setSaveError('');
    try {
      const costPerKm = costPerKmValue;
      const distKm    = (preview?.distanceMeters ?? 0) / 1000;
      const tollCost  = preview?.tollCostBRL ?? 0;
      const estimatedCostBRL = distKm * costPerKm + tollCost;

      await createPlannedTrip({
        vehicleId:       form.vehicleId,
        driverId:        form.driverId || undefined,
        origin:          {
          address: form.originPlace?.address ?? form.originAddr,
          placeId: form.originPlace?.placeId,
          lat: form.originPlace?.lat ?? preview?.originCoords?.lat,
          lng: form.originPlace?.lng ?? preview?.originCoords?.lng,
        },
        destination:     {
          address: form.destPlace?.address ?? form.destAddr,
          placeId: form.destPlace?.placeId,
          lat: form.destPlace?.lat ?? preview?.destinationCoords?.lat,
          lng: form.destPlace?.lng ?? preview?.destinationCoords?.lng,
        },
        scheduledAt:     form.scheduledAt,
        notes:           form.notes || undefined,
        costPerKmBRL:    costPerKm,
        estimatedCostBRL: estimatedCostBRL > 0 ? estimatedCostBRL : undefined,
        cargo: form.cargoType ? {
          type:     form.cargoType,
          weightKg: form.cargoWeightKg ? parseFloat(form.cargoWeightKg) : undefined,
          description: form.cargoDesc || undefined,
        } : undefined,
        planned: preview ? {
          distanceMeters:  preview.distanceMeters,
          durationSeconds: preview.durationSeconds,
          polyline:        preview.polyline,
          routeGeoJson:    preview.routeGeoJson,
          tollCostBRL:     preview.tollCostBRL,
          routeSummary:    preview.routeSummary,
          estimatedFuelL:  preview.estimatedFuelL,
          apiUsed:         preview.apiUsed,
        } : undefined,
      });
      setForm(EMPTY); setPreview(null);
      onCreated();
    } catch (e) {
      setSaveError(e?.message ?? 'Erro ao criar viagem.');
    }
    setSaving(false);
  };

  const handleClose = () => { setForm(EMPTY); setPreview(null); setPrevError(''); setSaveError(''); onHide(); };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="fs-6 text-dark"><Navigation size={16} className="me-2 text-primary" />Nova Viagem</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {saveError && <Alert variant="danger" className="py-2 small">{saveError}</Alert>}
        <Row className="g-3">
          {/* Veículo e Motorista */}
          <Col md={6}>
            <Form.Label className="small fw-semibold">Veículo *</Form.Label>
            <Form.Select size="sm" value={form.vehicleId} onChange={e => set('vehicleId', e.target.value)}>
              <option value="">Selecione...</option>
              {vehicles.map(v => <option key={v._id} value={v._id}>{v.name} — {v.plate}</option>)}
            </Form.Select>
          </Col>
          <Col md={6}>
            <Form.Label className="small fw-semibold">Motorista</Form.Label>
            <Form.Select size="sm" value={form.driverId} onChange={e => set('driverId', e.target.value)}>
              <option value="">Sem motorista</option>
              {drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </Form.Select>
          </Col>

          {/* Datas */}
          <Col md={6}>
            <Form.Label className="small fw-semibold">Data / Hora de saída *</Form.Label>
            <Form.Control size="sm" type="datetime-local" value={form.scheduledAt} onChange={e => set('scheduledAt', e.target.value)} />
          </Col>
          <Col md={6}>
            <Form.Label className="small fw-semibold">Custo por km (R$/km)</Form.Label>
            <Form.Control size="sm" placeholder="ex: 1,80" value={form.costPerKm} onChange={e => set('costPerKm', maskCurrency(e.target.value))} />
          </Col>

          {/* Origem / Destino */}
          <Col md={6}>
            <Form.Label className="small fw-semibold">Origem *</Form.Label>
            <GooglePlaceInput
              value={form.originAddr}
              placeholder="Ex: Av. Paulista, 1000 - São Paulo, SP"
              onTextChange={(value) => setForm(f => ({ ...f, originAddr: value, originPlace: null }))}
              onPlaceSelect={(place) => setForm(f => ({ ...f, originAddr: place.address, originPlace: place }))}
            />
            <Form.Text className="text-muted">{form.originPlace?.placeId ? 'Endereço validado pelo Google Places' : 'Digite e selecione uma sugestão do Google'}</Form.Text>
          </Col>
          <Col md={6}>
            <Form.Label className="small fw-semibold">Destino *</Form.Label>
            <GooglePlaceInput
              value={form.destAddr}
              placeholder="Endereço de destino"
              onTextChange={(value) => setForm(f => ({ ...f, destAddr: value, destPlace: null }))}
              onPlaceSelect={(place) => setForm(f => ({ ...f, destAddr: place.address, destPlace: place }))}
            />
            <Form.Text className="text-muted">{form.destPlace?.placeId ? 'Endereço validado pelo Google Places' : 'Digite e selecione uma sugestão do Google'}</Form.Text>
          </Col>

          {/* Carga */}
          <Col md={4}>
            <Form.Label className="small fw-semibold">Tipo de carga</Form.Label>
            <Form.Select size="sm" value={form.cargoType} onChange={e => set('cargoType', e.target.value)}>
              <option value="">Não especificado</option>
              {CARGO_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Form.Select>
          </Col>
          <Col md={4}>
            <Form.Label className="small fw-semibold">Peso (kg)</Form.Label>
            <Form.Control size="sm" type="number" min="0" placeholder="ex: 15000" value={form.cargoWeightKg} onChange={e => set('cargoWeightKg', e.target.value)} />
          </Col>
          <Col md={4}>
            <Form.Label className="small fw-semibold">Descrição da carga</Form.Label>
            <Form.Control size="sm" placeholder="opcional" value={form.cargoDesc} onChange={e => set('cargoDesc', e.target.value)} />
          </Col>

          {/* Observações */}
          <Col md={12}>
            <Form.Label className="small fw-semibold">Observações</Form.Label>
            <Form.Control as="textarea" rows={2} size="sm" value={form.notes} onChange={e => set('notes', e.target.value)} />
          </Col>

          {/* Botão preview */}
          <Col md={12}>
            <div className="d-flex align-items-center gap-2">
              <Button variant="outline-primary" size="sm" onClick={handlePreview} disabled={prevLoading}>
                {prevLoading ? <Spinner size="sm" /> : <><Layers size={13} className="me-1" />Calcular Rota</>}
              </Button>
              <small className="text-muted">Clique para estimar distância, tempo e pedágios</small>
            </div>
            {prevError && <Alert variant="warning" className="py-1 mt-2 small">{prevError}</Alert>}
          </Col>

          {/* Preview resultado */}
          {preview && (
            <Col md={12}>
              <div className={`p-3 rounded border ${preview.apiUsed === 'estimate' ? 'border-warning bg-warning bg-opacity-10' : 'border-success bg-success bg-opacity-10'}`}>
                <div className="d-flex align-items-center gap-2 mb-3">
                  {preview.apiUsed === 'estimate'
                    ? <><AlertTriangle size={14} className="text-warning" /><small className="fw-semibold text-warning">Estimativa (sem acesso a APIs de rota)</small></>
                    : preview.apiUsed === 'osrm'
                      ? <><CheckSquare size={14} className="text-success" /><small className="fw-semibold text-success">Rota real via OSRM (OpenStreetMap)</small></>
                      : <><CheckSquare size={14} className="text-success" /><small className="fw-semibold text-success">Google Routes API</small></>
                  }
                  <Badge bg={preview.apiUsed === 'routes_api' ? 'success' : preview.apiUsed === 'osrm' ? 'primary' : 'warning'} className="ms-auto">
                    {preview.apiUsed === 'routes_api' ? 'com pedágios' : preview.apiUsed === 'osrm' ? 'sem pedágios' : 'estimado'}
                  </Badge>
                </div>
                <RoutePreviewMap preview={preview} />
                <Row className="g-2">
                  {[
                    { icon: <Navigation size={14} />, label: 'Distância', value: fmtKm(preview.distanceMeters) },
                    { icon: <Clock size={14} />, label: 'Tempo est.', value: fmtSec(preview.durationSeconds) },
                    { icon: <Truck size={14} />, label: 'Combustível', value: preview.estimatedFuelL ? `${preview.estimatedFuelL.toFixed(1)} L` : '–' },
                    { icon: <DollarSign size={14} />, label: 'Pedágios est.', value: preview.tollCostBRL != null ? fmtCurrency(preview.tollCostBRL) : '–' },
                    { icon: <MapPin size={14} />, label: 'Rota', value: preview.routeSummary ?? '–' },
                    { icon: <DollarSign size={14} />, label: 'Custo total est.', value: costPerKmValue ? fmtCurrency(previewEstimatedCost) : '–' },
                  ].map(i => (
                    <Col xs={6} md={4} key={i.label}>
                      <div className="p-2 rounded bg-body bg-opacity-50 h-100">
                        <small className="text-muted d-flex align-items-center gap-1">{i.icon}{i.label}</small>
                        <strong className="small">{i.value}</strong>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            </Col>
          )}
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" size="sm" onClick={handleClose}>Cancelar</Button>
        <Button variant="primary" size="sm" onClick={handleCreate} disabled={saving}>
          {saving ? <Spinner size="sm" /> : <><Plus size={14} className="me-1" />Criar Viagem</>}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// ─── Modal de Ocorrência ──────────────────────────────────────────────────────

function OccurrenceModal({ tripId, show, onHide, onAdded }) {
  const [form, setForm] = useState({ type: 'delay', description: '', severity: 'low' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handle = async () => {
    if (!form.description.trim()) { setError('Descreva a ocorrência.'); return; }
    setSaving(true); setError('');
    try {
      await addTripOccurrence(tripId, form);
      setForm({ type: 'delay', description: '', severity: 'low' });
      onAdded();
    } catch (e) { setError(e?.message ?? 'Erro.'); }
    setSaving(false);
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="fs-6"><AlertTriangle size={15} className="me-2 text-warning" />Registrar Ocorrência</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
        <Form.Label className="small fw-semibold">Tipo</Form.Label>
        <Form.Select size="sm" className="mb-2" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
          {OCC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Form.Select>
        <Form.Label className="small fw-semibold">Descrição *</Form.Label>
        <Form.Control as="textarea" rows={3} size="sm" className="mb-2" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        <Form.Label className="small fw-semibold">Severidade</Form.Label>
        <Form.Select size="sm" value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
          <option value="low">Baixa</option>
          <option value="medium">Média</option>
          <option value="high">Alta</option>
        </Form.Select>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" size="sm" onClick={onHide}>Cancelar</Button>
        <Button variant="warning" size="sm" onClick={handle} disabled={saving}>{saving ? <Spinner size="sm" /> : 'Registrar'}</Button>
      </Modal.Footer>
    </Modal>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, color = 'primary', icon }) {
  return (
    <Card className="card-border text-center h-100">
      <Card.Body className="py-3">
        {icon && <div className={`text-${color} mb-1`}>{icon}</div>}
        <h3 className={`fw-bold text-${color} mb-0`}>{value}</h3>
        <small className="text-muted">{label}</small>
      </Card.Body>
    </Card>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function TripsBody() {
  const [tab,          setTab]          = useState('planned');
  const [trips,        setTrips]        = useState([]);
  const [traccarTrips, setTraccarTrips] = useState([]);
  const [vehicles,     setVehicles]     = useState([]);
  const [drivers,      setDrivers]      = useState([]);
  const [loading,      setLoading]      = useState(true);

  // Filtros
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const { from: defFrom, to: defTo }    = todayRange();
  const [from, setFrom] = useState('');
  const [to,   setTo]   = useState('');

  const router = useRouter();
  const [wizardLoading, setWizardLoading] = useState(false);

  const handleOpenWizard = async () => {
    setWizardLoading(true);
    try {
      const res = await createWizard();
      const id  = res?._id ?? res?.id;
      if (id) router.push(`/apps/fleet/trip-wizard/${id}`);
    } catch (err) {
      console.error('Erro ao criar wizard:', err);
    } finally {
      setWizardLoading(false);
    }
  };

  // Modais
  const [showNew,       setShowNew]       = useState(false);
  const [selected,      setSelected]      = useState(null);
  const [replayTrip,    setReplayTrip]    = useState(null);
  const [mapTrip,       setMapTrip]       = useState(null); // mapa viagem planejada
  const [occTrip,       setOccTrip]       = useState(null);
  const [statusTarget,  setStatusTarget]  = useState(null); // { trip, newStatus }
  const [statusSaving,  setStatusSaving]  = useState(false);
  const [statusReason,  setStatusReason]  = useState('');
  const [statusError,   setStatusError]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const plannedParams = {
        ...(from ? { from: new Date(from).toISOString() } : {}),
        ...(to ? { to: new Date(to + 'T23:59:59').toISOString() } : {}),
        ...(filterStatus ? { status: filterStatus } : {}),
      };
      const reportFrom = from ? new Date(from).toISOString() : defFrom;
      const reportTo = to ? new Date(to + 'T23:59:59').toISOString() : defTo;
      const [planned, traccar, vehs, drvs] = await Promise.allSettled([
        getPlannedTrips(plannedParams),
        getTrips({ from: reportFrom, to: reportTo }),
        getVehicles ? getVehicles() : Promise.resolve([]),
        getDrivers ? getDrivers() : Promise.resolve([]),
      ]);
      setTrips(planned.value?.items ?? planned.value ?? []);
      setTraccarTrips(Array.isArray(traccar.value) ? traccar.value : []);
      if (vehs.value) setVehicles(Array.isArray(vehs.value) ? vehs.value : (vehs.value?.items ?? []));
      if (drvs.value) setDrivers(Array.isArray(drvs.value) ? drvs.value : (drvs.value?.items ?? []));
    } catch {}
    setLoading(false);
  }, [from, to, filterStatus, defFrom, defTo]);

  useEffect(() => { load(); }, [load]);

  // ── detect dark mode ──────────────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.getAttribute('data-bs-theme') === 'dark');
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] });
    return () => observer.disconnect();
  }, []);

  // Filtro local por busca
  const filteredPlanned = trips.filter(t => {
    if (!search) return true;
    const txt = [t.vehicle?.name, t.vehicle?.plate, t.driver?.name, t.origin?.address, t.destination?.address].filter(Boolean).join(' ').toLowerCase();
    return txt.includes(search.toLowerCase());
  });

  const filteredTraccar = traccarTrips.filter(t => {
    if (!search) return true;
    return [t.deviceName, t.driverName].filter(Boolean).some(v => v.toLowerCase().includes(search.toLowerCase()));
  });

  // KPIs
  const kpiScheduled   = trips.filter(t => t.status === 'scheduled').length;
  const kpiInProgress  = trips.filter(t => t.status === 'in_progress').length;
  const kpiCompleted   = trips.filter(t => t.status === 'completed').length;
  const kpiTotalKmTraccar = (traccarTrips.reduce((a, t) => a + (t.distance ?? 0), 0) / 1000).toFixed(0);

  const handleStatusChange = async () => {
    if (!statusTarget) return;
    setStatusSaving(true); setStatusError('');
    try {
      await updateTripStatus(statusTarget.trip._id, {
        status: statusTarget.newStatus,
        cancellationReason: statusTarget.newStatus === 'cancelled' ? statusReason : undefined,
      });
      setStatusTarget(null); setStatusReason('');
      load();
    } catch (e) {
      setStatusError(e?.message ?? 'Erro ao atualizar status.');
    }
    setStatusSaving(false);
  };

  const handleDelete = async (trip) => {
    if (!confirm(`Excluir viagem para ${trip.destination?.address}?`)) return;
    await deletePlannedTrip(trip._id).catch(() => {});
    load();
  };

  return (
    <div className="fm-body">
      <SimpleBar className="nicescroll-bar">
        <div className="container-fluid px-4 py-4">

          {/* Header */}
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h4 className="fw-bold mb-0">Viagens</h4>
              <small className="text-muted">Planejamento, monitoramento e histórico de viagens</small>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline-primary" size="sm" onClick={handleOpenWizard} disabled={wizardLoading}>
                {wizardLoading
                  ? <Spinner size="sm" animation="border" className="me-1" />
                  : <Layers size={15} className="me-1" />}
                Wizard de Viagem
              </Button>
              <Button variant="primary" size="sm" onClick={() => setShowNew(true)}>
                <Plus size={15} className="me-1" />Nova Viagem
              </Button>
            </div>
          </div>

          {/* KPIs */}
          <Row className="g-3 mb-4">
            <Col xs={6} md={3}>
              <KpiCard label="Agendadas"    value={kpiScheduled}  color="secondary" icon={<Clock size={18} />} />
            </Col>
            <Col xs={6} md={3}>
              <KpiCard label="Em andamento" value={kpiInProgress} color="primary"   icon={<Navigation size={18} />} />
            </Col>
            <Col xs={6} md={3}>
              <KpiCard label="Concluídas"   value={kpiCompleted}  color="success"   icon={<CheckCircle size={18} />} />
            </Col>
            <Col xs={6} md={3}>
              <KpiCard label="KM Traccar (período)" value={`${kpiTotalKmTraccar} km`} color="info" icon={<Truck size={18} />} />
            </Col>
          </Row>

          {/* Filtros */}
          <Card className="card-border mb-4">
            <Card.Body>
              <Row className="g-2 align-items-end">
                <Col md={4}>
                  <InputGroup size="sm">
                    <InputGroup.Text><Search size={14} /></InputGroup.Text>
                    <Form.Control placeholder="Veículo, placa, motorista, endereço..." value={search} onChange={e => setSearch(e.target.value)} />
                    {search && <Button variant="light" onClick={() => setSearch('')}><X size={13} /></Button>}
                  </InputGroup>
                </Col>
                <Col md={2}>
                  <Form.Select size="sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">Todos status</option>
                    <option value="scheduled">Agendadas</option>
                    <option value="in_progress">Em andamento</option>
                    <option value="completed">Concluídas</option>
                    <option value="cancelled">Canceladas</option>
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Control size="sm" type="date" value={from} onChange={e => setFrom(e.target.value)} />
                </Col>
                <Col md={2}>
                  <Form.Control size="sm" type="date" value={to} onChange={e => setTo(e.target.value)} />
                </Col>
                <Col md={2}>
                  <Button variant="primary" size="sm" className="w-100" onClick={load} disabled={loading}>
                    {loading ? <Spinner size="sm" /> : 'Filtrar'}
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Tabs */}
          <Tabs activeKey={tab} onSelect={k => setTab(k)} className="mb-3">
            <Tab eventKey="planned" title={<><Navigation size={14} className="me-1" />Viagens Planejadas ({filteredPlanned.length})</>}>

              <Card className="card-border">
                <Card.Body className="p-0">
                  {loading
                    ? <div className="text-center py-5"><Spinner /></div>
                    : filteredPlanned.length === 0
                      ? (
                        <div className="text-center py-5 text-muted">
                          <Navigation size={40} className="mb-3 opacity-50" />
                          <p className="mb-1">Nenhuma viagem planejada no período.</p>
                          <Button variant="primary" size="sm" onClick={() => setShowNew(true)}>
                            <Plus size={14} className="me-1" />Criar primeira viagem
                          </Button>
                        </div>
                      ) : (
                        <SimpleBar>
                          <Table hover className="mb-0 small">
                            <thead className="bg-light">
                              <tr>
                                <th>Veículo</th>
                                <th>Motorista</th>
                                <th>Origem <ChevronRight size={11} /> Destino</th>
                                <th>Saída</th>
                                <th>Dist. plan.</th>
                                <th>Custo est.</th>
                                <th>Status</th>
                                <th className="text-center">Ações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredPlanned.map((t) => (
                                <tr key={t._id}>
                                  <td>
                                    <div className="fw-semibold">{t.vehicle?.name ?? '–'}</div>
                                    <small className="text-muted">{t.vehicle?.plate}</small>
                                  </td>
                                  <td><small className="text-muted">{t.driver?.name ?? '–'}</small></td>
                                  <td>
                                    <div className="small text-truncate" style={{ maxWidth: 220 }}>
                                      <MapPin size={10} className="text-success me-1" />
                                      {t.origin?.address}
                                    </div>
                                    <div className="small text-truncate text-muted" style={{ maxWidth: 220 }}>
                                      <MapPin size={10} className="text-danger me-1" />
                                      {t.destination?.address}
                                    </div>
                                  </td>
                                  <td><small>{fmtDate(t.scheduledAt)}</small></td>
                                  <td>
                                    <small>{t.planned ? fmtKm(t.planned.distanceMeters) : '–'}</small>
                                    {t.planned?.apiUsed === 'estimate' && <span className="ms-1 text-warning" title="Estimativa">~</span>}
                                  </td>
                                  <td><small className="fw-semibold">{fmtCurrency(t.estimatedCostBRL)}</small></td>
                                  <td><StatusBadge status={t.status} /></td>
                                  <td className="text-center">
                                    <div className="d-flex justify-content-center gap-1">
                                      <Button variant={isDark ? "outline-primary" : "primary"} size="sm" title="Detalhes" onClick={() => setSelected(t)} className={!isDark ? "text-white" : ""}>
                                        <Eye size={13} />
                                      </Button>
                                      <Button variant={isDark ? "outline-success" : "success"} size="sm" title="Ver no mapa" onClick={() => setMapTrip(t)} className={!isDark ? "text-white" : ""}>
                                        <MapPin size={13} />
                                      </Button>
                                      {t.status === 'in_progress' && (
                                        <Button variant={isDark ? "outline-warning" : "warning"} size="sm" title="Registrar ocorrência" onClick={() => setOccTrip(t)} className={isDark ? "" : "text-dark"}>
                                          <AlertTriangle size={13} />
                                        </Button>
                                      )}
                                      {t.status === 'scheduled' && (
                                        <Button variant={isDark ? "outline-success" : "success"} size="sm" title="Iniciar viagem" onClick={() => setStatusTarget({ trip: t, newStatus: 'in_progress' })} className={!isDark ? "text-white" : ""}>
                                          <Play size={13} />
                                        </Button>
                                      )}
                                      {t.status === 'in_progress' && (
                                        <Button variant={isDark ? "outline-success" : "success"} size="sm" title="Concluir viagem" onClick={() => setStatusTarget({ trip: t, newStatus: 'completed' })} className={!isDark ? "text-white" : ""}>
                                          <CheckCircle size={13} />
                                        </Button>
                                      )}
                                      {['scheduled', 'in_progress'].includes(t.status) && (
                                        <Button variant={isDark ? "outline-danger" : "danger"} size="sm" title="Cancelar" onClick={() => setStatusTarget({ trip: t, newStatus: 'cancelled' })} className={!isDark ? "text-white" : ""}>
                                          <XCircle size={13} />
                                        </Button>
                                      )}
                                      {['scheduled', 'cancelled'].includes(t.status) && (
                                        <Button variant={isDark ? "outline-danger" : "danger"} size="sm" title="Excluir" onClick={() => handleDelete(t)} className={!isDark ? "text-white" : ""}>
                                          <X size={13} />
                                        </Button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </SimpleBar>
                      )}
                </Card.Body>
              </Card>
            </Tab>

            {/* Tab histórico Traccar */}
            <Tab eventKey="traccar" title={<><Truck size={14} className="me-1" />Histórico Traccar ({filteredTraccar.length})</>}>
              <Card className="card-border">
                <Card.Body className="p-0">
                  {loading
                    ? <div className="text-center py-5"><Spinner /></div>
                    : filteredTraccar.length === 0
                      ? (
                        <div className="text-center py-5 text-muted">
                          <Truck size={40} className="mb-3 opacity-50" />
                          <p className="mb-0">Nenhuma viagem Traccar no período.</p>
                        </div>
                      ) : (
                        <SimpleBar>
                          <Table hover className="mb-0 small">
                            <thead className="bg-light">
                              <tr>
                                <th>Veículo</th>
                                <th>Motorista</th>
                                <th>Início</th>
                                <th>Duração</th>
                                <th>Distância</th>
                                <th>Vel. Média</th>
                                <th className="text-center">Rota</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredTraccar.map((t, i) => {
                                const dur = t.endTime
                                  ? (new Date(t.endTime) - new Date(t.startTime)) / 1000
                                  : (Date.now() - new Date(t.startTime)) / 1000;
                                return (
                                  <tr key={t.id ?? i}>
                                    <td className="fw-semibold">{t.deviceName ?? '–'}</td>
                                    <td className="text-muted">{t.driverName ?? '–'}</td>
                                    <td>{fmtDate(t.startTime)}</td>
                                    <td>{fmtSec(dur)}</td>
                                    <td>{t.distance ? `${(t.distance / 1000).toFixed(1)} km` : '–'}</td>
                                    <td>{t.averageSpeed ? `${Math.round(t.averageSpeed)} km/h` : '–'}</td>
                                    <td className="text-center">
                                      <Button variant={isDark ? "outline-success" : "success"} size="sm" title="Replay no mapa" onClick={() => setReplayTrip(t)} className={!isDark ? "text-white" : ""}>
                                        <MapPin size={13} />
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </Table>
                        </SimpleBar>
                      )}
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </div>
      </SimpleBar>

      {/* Modal nova viagem */}
      <NewTripModal
        show={showNew}
        onHide={() => setShowNew(false)}
        onCreated={() => { setShowNew(false); load(); }}
        vehicles={vehicles}
        drivers={drivers}
      />

      {/* Modal detalhes */}
      {selected && (
        <Modal show onHide={() => setSelected(null)} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 text-dark">
              <Navigation size={15} className="me-2 text-primary" />
              Detalhes — {selected.vehicle?.name ?? selected.vehicleId}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row className="g-3">
              <Col xs={6} md={4}><small className="text-muted d-block">Status</small><StatusBadge status={selected.status} /></Col>
              <Col xs={6} md={4}><small className="text-muted d-block">Veículo</small><strong className="small">{selected.vehicle?.name} — {selected.vehicle?.plate}</strong></Col>
              <Col xs={6} md={4}><small className="text-muted d-block">Motorista</small><strong className="small">{selected.driver?.name ?? '–'}</strong></Col>
              <Col xs={12} md={6}><small className="text-muted d-block">Origem</small><strong className="small">{selected.origin?.address}</strong></Col>
              <Col xs={12} md={6}><small className="text-muted d-block">Destino</small><strong className="small">{selected.destination?.address}</strong></Col>
              <Col xs={6} md={4}><small className="text-muted d-block">Saída planejada</small><strong className="small">{fmtDate(selected.scheduledAt)}</strong></Col>
              {selected.planned && (
                <>
                  <Col xs={6} md={4}><small className="text-muted d-block">Distância plan.</small><strong className="small">{fmtKm(selected.planned.distanceMeters)} {selected.planned.apiUsed === 'estimate' && <span className="text-warning">~est.</span>}</strong></Col>
                  <Col xs={6} md={4}><small className="text-muted d-block">Tempo plan.</small><strong className="small">{fmtSec(selected.planned.durationSeconds)}</strong></Col>
                  <Col xs={6} md={4}><small className="text-muted d-block">Pedágios est.</small><strong className="small">{fmtCurrency(selected.planned.tollCostBRL)}</strong></Col>
                  <Col xs={6} md={4}><small className="text-muted d-block">Combustível est.</small><strong className="small">{selected.planned.estimatedFuelL ? `${selected.planned.estimatedFuelL.toFixed(1)} L` : '–'}</strong></Col>
                </>
              )}
              <Col xs={6} md={4}><small className="text-muted d-block">Custo estimado</small><strong className="small">{fmtCurrency(selected.estimatedCostBRL)}</strong></Col>
              {selected.actual && (
                <>
                  <Col xs={12}><hr className="my-1" /><small className="fw-semibold text-success">Dados Reais (Traccar)</small></Col>
                  <Col xs={6} md={4}><small className="text-muted d-block">Distância real</small><strong className="small">{fmtKm(selected.actual.distanceMeters)}</strong></Col>
                  <Col xs={6} md={4}><small className="text-muted d-block">Duração real</small><strong className="small">{fmtSec(selected.actual.durationSeconds)}</strong></Col>
                  <Col xs={6} md={4}><small className="text-muted d-block">Vel. Média</small><strong className="small">{selected.actual.averageSpeedKmh ? `${Math.round(selected.actual.averageSpeedKmh)} km/h` : '–'}</strong></Col>
                  <Col xs={6} md={4}><small className="text-muted d-block">Combustível real</small><strong className="small">{selected.actual.spentFuelL ? `${selected.actual.spentFuelL.toFixed(1)} L` : '–'}</strong></Col>
                </>
              )}
              {selected.cargo?.type && (
                <>
                  <Col xs={12}><hr className="my-1" /><small className="fw-semibold">Carga</small></Col>
                  <Col xs={6} md={4}><small className="text-muted d-block">Tipo</small><strong className="small">{CARGO_TYPES.find(t => t.value === selected.cargo.type)?.label ?? selected.cargo.type}</strong></Col>
                  {selected.cargo.weightKg && <Col xs={6} md={4}><small className="text-muted d-block">Peso</small><strong className="small">{selected.cargo.weightKg.toLocaleString('pt-BR')} kg</strong></Col>}
                  {selected.cargo.description && <Col xs={12}><small className="text-muted d-block">Descrição</small><strong className="small">{selected.cargo.description}</strong></Col>}
                </>
              )}
              {selected.occurrences?.length > 0 && (
                <>
                  <Col xs={12}><hr className="my-1" /><small className="fw-semibold">Ocorrências ({selected.occurrences.length})</small></Col>
                  {selected.occurrences.map((o, idx) => (
                    <Col xs={12} key={idx}>
                      <div className={`p-2 rounded border ${o.severity === 'high' ? 'border-danger' : o.severity === 'medium' ? 'border-warning' : 'border-secondary'}`}>
                        <div className="d-flex justify-content-between">
                          <small className="fw-semibold">{OCC_TYPES.find(t => t.value === o.type)?.label ?? o.type}</small>
                          <small className="text-muted">{fmtDate(o.timestamp)}</small>
                        </div>
                        <small className="text-muted">{o.description}</small>
                      </div>
                    </Col>
                  ))}
                </>
              )}
              {selected.events?.filter(e => e.type !== 'location_update').length > 0 && (() => {
                const EVENT_LABELS = {
                  trip_started:        '🚀 Viagem iniciada',
                  arrived_at_client:   '📍 Chegou ao cliente',
                  delivery_completed:  '✅ Entrega confirmada',
                  delivery_attempted:  '🔄 Tentativa de entrega',
                  trip_finished:       '🏁 Viagem finalizada',
                  occurrence_reported: '⚠️ Ocorrência reportada',
                  refueling:           '⛽ Abastecimento',
                  panic_button:        '🆘 PÂNICO',
                  checklist_completed: '📋 Checklist concluído',
                };
                const evts = selected.events.filter(e => e.type !== 'location_update');
                return (
                  <>
                    <Col xs={12}><hr className="my-1" /><small className="fw-semibold">Eventos do Motorista ({evts.length})</small></Col>
                    <Col xs={12}>
                      <div style={{ borderLeft: '2px solid #dee2e6', paddingLeft: 12 }}>
                        {evts.map((evt, idx) => (
                          <div key={idx} className="d-flex align-items-start gap-2 mb-2">
                            <small className="text-muted" style={{ whiteSpace: 'nowrap', minWidth: 70 }}>
                              {new Date(evt.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </small>
                            <div>
                              <small className="fw-semibold d-block">{EVENT_LABELS[evt.type] ?? evt.type}</small>
                              {evt.type === 'occurrence_reported' && evt.metadata?.occurrenceType && (
                                <small className="text-muted">{evt.metadata.occurrenceType}</small>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Col>
                  </>
                );
              })()}
              {selected.notes && (
                <Col xs={12}><small className="text-muted d-block">Observações</small><small>{selected.notes}</small></Col>
              )}
            </Row>
          </Modal.Body>
          <Modal.Footer>
            {selected.status === 'in_progress' && (
              <Button variant="outline-warning" size="sm" onClick={() => { setOccTrip(selected); setSelected(null); }}>
                <AlertTriangle size={13} className="me-1" />Ocorrência
              </Button>
            )}
            {selected.vehicle?.traccarId && (selected.status === 'completed' || selected.status === 'in_progress') && (
              <Button variant="soft-success" size="sm" onClick={() => { setReplayTrip(selected); setSelected(null); }}>
                <MapPin size={13} className="me-1" />Ver Rota
              </Button>
            )}
            <Button variant="outline-primary" size="sm" onClick={() => { setMapTrip(selected); setSelected(null); }}>
              <MapPin size={13} className="me-1" />Ver no Mapa
            </Button>
            <Button variant="light" size="sm" onClick={() => setSelected(null)}>Fechar</Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Modal status */}
      {statusTarget && (
        <Modal show onHide={() => setStatusTarget(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 text-dark">
              {statusTarget.newStatus === 'in_progress' && <><Play size={14} className="me-2 text-primary" />Iniciar Viagem</>}
              {statusTarget.newStatus === 'completed'   && <><CheckCircle size={14} className="me-2 text-success" />Concluir Viagem</>}
              {statusTarget.newStatus === 'cancelled'   && <><XCircle size={14} className="me-2 text-danger" />Cancelar Viagem</>}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {statusError && <Alert variant="danger" className="py-2 small">{statusError}</Alert>}
            <p className="small mb-2">
              Veículo: <strong>{statusTarget.trip.vehicle?.name ?? statusTarget.trip.vehicleId}</strong><br />
              Destino: <strong>{statusTarget.trip.destination?.address}</strong>
            </p>
            {statusTarget.newStatus === 'completed' && (
              <Alert variant="info" className="py-2 small">
                O sistema tentará buscar automaticamente os dados reais do Traccar para esta viagem.
              </Alert>
            )}
            {statusTarget.newStatus === 'cancelled' && (
              <>
                <Form.Label className="small fw-semibold">Motivo do cancelamento</Form.Label>
                <Form.Control as="textarea" rows={2} size="sm" value={statusReason} onChange={e => setStatusReason(e.target.value)} />
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" size="sm" onClick={() => setStatusTarget(null)}>Cancelar</Button>
            <Button
              variant={statusTarget.newStatus === 'cancelled' ? 'danger' : statusTarget.newStatus === 'completed' ? 'success' : 'primary'}
              size="sm" onClick={handleStatusChange} disabled={statusSaving}
            >
              {statusSaving ? <Spinner size="sm" /> : 'Confirmar'}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Modal ocorrência */}
      {occTrip && (
        <OccurrenceModal
          tripId={occTrip._id}
          show
          onHide={() => setOccTrip(null)}
          onAdded={() => { setOccTrip(null); load(); }}
        />
      )}

      {/* Modal mapa viagem planejada */}
      {mapTrip && (
        <Modal show onHide={() => setMapTrip(null)} centered size="xl">
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 text-dark">
              <MapPin size={15} className="me-2 text-primary" />
              Rota Planejada — {mapTrip.vehicle?.name ?? mapTrip.vehicleId}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <PlannedRouteMap trip={mapTrip} />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" size="sm" onClick={() => setMapTrip(null)}>Fechar</Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Modal replay (Traccar) */}
      <Modal show={!!replayTrip} onHide={() => setReplayTrip(null)} centered size="xl">
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 text-dark">
            <MapPin size={15} className="me-2 text-success" />
            Replay de Rota — {replayTrip?.vehicle?.name ?? replayTrip?.deviceName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {replayTrip && <RouteReplay trip={replayTrip} />}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" size="sm" onClick={() => setReplayTrip(null)}>Fechar</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
