'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Table, Badge, Button, Modal, Form, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { Plus, MapPin, Trash2, Edit2 } from 'react-feather';
import SimpleBar from 'simplebar-react';
import { getGeofences } from '@/lib/api/services/fleet';
import { apiRequest } from '@/lib/api/client';

const TYPE_LABELS = { circle: 'Círculo', polygon: 'Polígono', polyline: 'Linha' };
const EMPTY_FORM = { name: '', description: '', area: '', type: 'circle', color: '#3388ff', alertOnEnter: true, alertOnExit: false };

// Converte shape do Leaflet.Draw para WKT Traccar
function shapeToWkt(layer) {
  if (!layer) return '';
  const L = window.L;
  if (layer instanceof L.Circle) {
    const { lat, lng } = layer.getLatLng();
    const r = Math.round(layer.getRadius());
    return `CIRCLE (${lat} ${lng}, ${r})`;
  }
  if (layer instanceof L.Polygon) {
    const pts = layer.getLatLngs()[0].map(p => `${p.lng} ${p.lat}`).join(', ');
    const first = layer.getLatLngs()[0][0];
    return `POLYGON((${pts}, ${first.lng} ${first.lat}))`;
  }
  if (layer instanceof L.Polyline) {
    const pts = layer.getLatLngs().map(p => `${p.lng} ${p.lat}`).join(', ');
    return `LINESTRING(${pts})`;
  }
  return '';
}

// Converte WKT Traccar para layer Leaflet (para preview)
function wktToLeaflet(wkt, L) {
  if (!wkt) return null;
  try {
    const circleMatch = wkt.match(/^CIRCLE\(\s*([\d.-]+)\s+([\d.-]+)\s*,\s*([\d.]+)\s*\)$/i);
    if (circleMatch) {
      return L.circle([parseFloat(circleMatch[1]), parseFloat(circleMatch[2])], { radius: parseFloat(circleMatch[3]) });
    }
  } catch {}
  return null;
}

export default function GeofencesBody() {
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [form, setForm]           = useState(EMPTY_FORM);
  const [drawnWkt, setDrawnWkt]   = useState('');
  const [mapReady, setMapReady]   = useState(false);

  const mapRef        = useRef(null);
  const leafletMapRef = useRef(null);
  const drawLayersRef = useRef(null);
  const geofenceLayersRef = useRef([]);
  const currentDrawnLayer = useRef(null);

  // ── carrega geofences ──────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getGeofences();
      setGeofences(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  }, []);

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

  // ── inicializa mapa ────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapReady || !mapRef.current) return;
    let cancelled = false;

    async function initMap() {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');
      await import('leaflet-draw');
      await import('leaflet-draw/dist/leaflet.draw.css');

      // Corrige ícones padrão do Leaflet
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (cancelled || leafletMapRef.current) return;

      const map = L.map(mapRef.current, { center: [-15.7801, -47.9292], zoom: 4 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      // Camada de shapes desenhados
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);
      drawLayersRef.current = drawnItems;

      // Toolbar de desenho
      const drawControl = new L.Control.Draw({
        edit: { featureGroup: drawnItems, edit: false, remove: false },
        draw: {
          marker:    false,
          rectangle: false,
          circlemarker: false,
          circle:    { shapeOptions: { color: '#3388ff' } },
          polygon:   { shapeOptions: { color: '#3388ff' } },
          polyline:  { shapeOptions: { color: '#3388ff' } },
        },
      });
      map.addControl(drawControl);

      map.on(L.Draw.Event.CREATED, (e) => {
        drawnItems.clearLayers();
        drawnItems.addLayer(e.layer);
        currentDrawnLayer.current = e.layer;
        const wkt = shapeToWkt(e.layer);
        setDrawnWkt(wkt);
        setForm(f => ({ ...f, area: wkt }));
      });

      leafletMapRef.current = map;
      setMapReady(true);
    }

    initMap().catch(console.error);
    return () => { cancelled = true; };
  }, []);

  // ── renderiza geofences no mapa ────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current) return;
    const L = window.L;
    if (!L) return;

    geofenceLayersRef.current.forEach(l => leafletMapRef.current.removeLayer(l));
    geofenceLayersRef.current = [];

    geofences.forEach(g => {
      const layer = wktToLeaflet(g.area, L);
      if (layer) {
        layer.bindPopup(`<strong>${g.name}</strong><br/><small>${g.description || ''}</small>`);
        layer.addTo(leafletMapRef.current);
        geofenceLayersRef.current.push(layer);
      }
    });
  }, [geofences, mapReady]);

  // ── abrir modal ────────────────────────────────────────────────────────────
  const handleOpen = () => {
    setForm(EMPTY_FORM);
    setDrawnWkt('');
    setError('');
    if (drawLayersRef.current) drawLayersRef.current.clearLayers();
    currentDrawnLayer.current = null;
    setShowModal(true);
    // Força resize do mapa após modal abrir
    setTimeout(() => leafletMapRef.current?.invalidateSize(), 300);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // ── salvar ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const wkt = form.area || drawnWkt;
    if (!form.name || !wkt) { setError('Desenhe uma área no mapa ou informe o WKT.'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, area: wkt };
      const created = await apiRequest('/fleet/geofences', { method: 'POST', body: payload });
      setGeofences(prev => [created?.data ?? created, ...prev]);
      setShowModal(false);
      if (drawLayersRef.current) drawLayersRef.current.clearLayers();
    } catch (err) {
      setError(err?.message ?? 'Erro ao salvar geofence.');
    } finally {
      setSaving(false);
    }
  };

  // ── deletar ────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!confirm('Remover esta geofence?')) return;
    try {
      await apiRequest(`/fleet/geofences/${id}`, { method: 'DELETE' });
      setGeofences(prev => prev.filter(g => (g._id ?? g.id) !== id));
    } catch {
      alert('Erro ao remover geofence.');
    }
  };

  return (
    <div className="fm-body">
      <SimpleBar className="nicescroll-bar">
        <div className="container-fluid px-4 py-4">

          {/* Header */}
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h4 className="fw-bold mb-0">Geofences</h4>
              <small className="text-muted">{geofences.length} zona{geofences.length !== 1 ? 's' : ''} cadastrada{geofences.length !== 1 ? 's' : ''}</small>
            </div>
            <Button variant="primary" className="d-flex align-items-center gap-2" onClick={handleOpen}>
              <Plus size={16} /> Nova Geofence
            </Button>
          </div>

          {/* Mapa */}
          <Card className="card-border mb-4">
            <Card.Header>
              <h6 className="mb-0 d-flex align-items-center gap-2">
                <MapPin size={15} className="text-primary" /> Mapa de Zonas
              </h6>
            </Card.Header>
            <Card.Body className="p-0">
              <div ref={mapRef} style={{ height: 420, width: '100%', borderRadius: '0 0 8px 8px' }} />
            </Card.Body>
          </Card>

          {/* Tabela */}
          <Card className="card-border">
            <Card.Header><h6 className="mb-0">Zonas Cadastradas</h6></Card.Header>
            <Card.Body className="p-0">
              {loading
                ? <div className="text-center py-4"><Spinner size="sm" /></div>
                : geofences.length === 0
                  ? (
                    <div className="text-center py-5 text-muted">
                      <MapPin size={40} className="mb-3 opacity-50" />
                      <p className="mb-1">Nenhuma geofence cadastrada.</p>
                      <small>Clique em "Nova Geofence" e desenhe a área no mapa.</small>
                    </div>
                  ) : (
                  <Table hover className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th>Nome</th>
                        <th>Tipo</th>
                        <th>Descrição</th>
                        <th>Alertas</th>
                        <th>Status</th>
                        <th className="text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {geofences.map(g => (
                        <tr key={g._id ?? g.id}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <MapPin size={15} className="text-primary" />
                              <strong className="small">{g.name}</strong>
                            </div>
                          </td>
                          <td><Badge bg="light" text="dark">{TYPE_LABELS[g.type] ?? g.type ?? '–'}</Badge></td>
                          <td><small className="text-muted">{g.description || '–'}</small></td>
                          <td>
                            {g.alertOnEnter && <Badge bg="success" className="text-white me-1">Entrada</Badge>}
                            {g.alertOnExit  && <Badge bg="warning" text="dark">Saída</Badge>}
                            {!g.alertOnEnter && !g.alertOnExit && <span className="text-muted small">–</span>}
                          </td>
                          <td>
                            <Badge bg={g.active !== false ? 'success' : 'secondary'} className="text-white">
                              {g.active !== false ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </td>
                          <td className="text-center">
                            <Button variant={isDark ? "outline-danger" : "danger"} size="sm" onClick={() => handleDelete(g._id ?? g.id)} className={!isDark ? "text-white" : ""}>
                              <Trash2 size={13} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
            </Card.Body>
          </Card>
        </div>
      </SimpleBar>

      {/* Modal nova geofence */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="xl">
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold text-dark">
              <MapPin size={16} className="me-2 text-primary" />
              Nova Geofence — desenhe a área no mapa
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
            <Row className="g-3">
              {/* Mapa de desenho */}
              <Col xs={12}>
                <div
                  id="geofence-draw-map"
                  style={{ height: 380, border: '1px solid #dee2e6', borderRadius: 8 }}
                />
                {drawnWkt && (
                  <div className="mt-2">
                    <small className="text-muted">Área desenhada: </small>
                    <code className="small text-success">{drawnWkt.slice(0, 80)}…</code>
                  </div>
                )}
                {!drawnWkt && (
                  <small className="text-muted mt-1 d-block">
                    Use a barra lateral do mapa para desenhar um círculo, polígono ou linha.
                  </small>
                )}
              </Col>
              <Col xs={12} md={6}>
                <Form.Label className="small fw-semibold">Nome *</Form.Label>
                <Form.Control name="name" value={form.name} onChange={handleChange} placeholder="Ex: Zona Industrial Norte" required />
              </Col>
              <Col xs={6} md={3}>
                <Form.Label className="small fw-semibold">Cor</Form.Label>
                <Form.Control type="color" name="color" value={form.color} onChange={handleChange} style={{ height: 38 }} />
              </Col>
              <Col xs={6} md={3} className="d-flex flex-column justify-content-end">
                <div className="d-flex gap-3 pb-1">
                  <Form.Check type="switch" id="alertOnEnter" name="alertOnEnter" checked={form.alertOnEnter} onChange={handleChange} label="Alerta entrada" />
                  <Form.Check type="switch" id="alertOnExit"  name="alertOnExit"  checked={form.alertOnExit}  onChange={handleChange} label="Alerta saída" />
                </div>
              </Col>
              <Col xs={12}>
                <Form.Label className="small fw-semibold">Descrição</Form.Label>
                <Form.Control as="textarea" rows={2} name="description" value={form.description} onChange={handleChange} placeholder="Descrição opcional..." />
              </Col>
              <Col xs={12}>
                <Form.Label className="small fw-semibold">WKT manual (opcional)</Form.Label>
                <Form.Control
                  name="area"
                  value={form.area}
                  onChange={handleChange}
                  placeholder="Ex: CIRCLE(-23.5505 -46.6333, 5000)"
                />
                <Form.Text className="text-muted">
                  Preenchido automaticamente ao desenhar. Formato: <code>CIRCLE(lat lon, metros)</code>
                </Form.Text>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" size="sm" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" variant="primary" size="sm" disabled={saving}>
              {saving ? <><Spinner size="sm" className="me-1" />Salvando…</> : 'Criar Geofence'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ModalMapInit show={showModal} onReady={setDrawnWkt} formRef={form} setForm={setForm} />
    </div>
  );
}

// Sub-componente que inicializa o mapa dentro do Modal quando ele abre
function ModalMapInit({ show, onReady, setForm }) {
  const mapRef2   = useRef(null);
  const mapInst   = useRef(null);
  const drawnRef  = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!show || !mounted) return;
    let cancelled = false;

    async function init() {
      await new Promise(r => setTimeout(r, 200));
      const el = document.getElementById('geofence-draw-map');
      if (!el || cancelled) return;

      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');
      await import('leaflet-draw');
      await import('leaflet-draw/dist/leaflet.draw.css');

      if (mapInst.current || cancelled) return;

      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(el, { center: [-15.78, -47.93], zoom: 4 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(map);

      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);
      drawnRef.current = drawnItems;

      const ctrl = new L.Control.Draw({
        edit: { featureGroup: drawnItems, edit: false, remove: true },
        draw: {
          marker: false, rectangle: false, circlemarker: false,
          circle:   { shapeOptions: { color: '#3388ff' } },
          polygon:  { shapeOptions: { color: '#3388ff' } },
          polyline: { shapeOptions: { color: '#3388ff' } },
        },
      });
      map.addControl(ctrl);

      map.on(L.Draw.Event.CREATED, (e) => {
        drawnItems.clearLayers();
        drawnItems.addLayer(e.layer);
        const wkt = shapeToWkt(e.layer);
        onReady(wkt);
        setForm(f => ({ ...f, area: wkt }));
      });

      map.on(L.Draw.Event.DELETED, () => {
        onReady('');
        setForm(f => ({ ...f, area: '' }));
      });

      mapInst.current = map;
    }

    init().catch(console.error);
    return () => {
      cancelled = true;
      if (mapInst.current) {
        mapInst.current.remove();
        mapInst.current = null;
      }
    };
  }, [show, mounted]);

  return null;
}
