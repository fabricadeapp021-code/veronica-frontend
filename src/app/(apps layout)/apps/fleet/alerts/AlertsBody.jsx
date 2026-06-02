'use client';
import { useState, useEffect } from 'react';
import {
  Card, Table, Badge, Button, Modal, Form, Row, Col,
  Spinner, Alert, Nav, Tab,
} from 'react-bootstrap';
import { Bell, Plus, Trash2, BellOff } from 'react-feather';
import SimpleBar from 'simplebar-react';
import {
  getNotifications, createNotification, deleteNotification,
  getNotificationTypes, getAlertsHistory, getDevices, BUILT_IN_ALERT_TYPES, todayRange,
} from '@/lib/api/services/fleet';

// ─── helpers ──────────────────────────────────────────────────────────────────

const EVENT_COLORS = {
  deviceOffline:    'danger',
  deviceOnline:     'success',
  speedLimit:       'warning',
  geofenceEnter:    'info',
  geofenceExit:     'secondary',
  ignitionOn:       'success',
  ignitionOff:      'secondary',
  alarm:            'danger',
  maintenance:      'warning',
  hardBraking:      'danger',
  hardAcceleration: 'warning',
  hardCornering:    'warning',
};

function eventColor(type) { return EVENT_COLORS[type] ?? 'light'; }

const EMPTY_NOTIF = { type: '', always: false, web: true, mail: false, sms: false };

// ─── componente ───────────────────────────────────────────────────────────────

export default function AlertsBody() {
  const [notifications, setNotifications] = useState([]);
  const [notifTypes,    setNotifTypes]    = useState(BUILT_IN_ALERT_TYPES);
  const [history,       setHistory]       = useState([]);
  const [devices,       setDevices]       = useState([]);
  const [loadingNotif,  setLoadingNotif]  = useState(true);
  const [loadingHist,   setLoadingHist]   = useState(true);
  const [notifError,    setNotifError]    = useState('');
  const [histError,     setHistError]     = useState('');
  const [showAdd,       setShowAdd]       = useState(false);
  const [form,          setForm]          = useState(EMPTY_NOTIF);
  const [saving,        setSaving]        = useState(false);
  const [addError,      setAddError]      = useState('');

  // Range padrão: hoje
  const [range, setRange] = useState(() => {
    const { from, to } = todayRange();
    return { from: from.slice(0, 16), to: to.slice(0, 16) };
  });

  const loadNotifications = async () => {
    setLoadingNotif(true);
    setNotifError('');
    try {
      const [types, notifs] = await Promise.allSettled([
        getNotificationTypes(),
        getNotifications(),
      ]);
      if (types.status === 'fulfilled' && Array.isArray(types.value) && types.value.length) {
        const merged = types.value.map(t => ({
          type:  t.type,
          label: BUILT_IN_ALERT_TYPES.find(b => b.type === t.type)?.label ?? t.type,
        }));
        setNotifTypes(merged);
      }
      if (notifs.status === 'fulfilled' && Array.isArray(notifs.value)) setNotifications(notifs.value);
      if (notifs.status === 'rejected') setNotifError(notifs.reason?.message ?? 'Erro ao carregar alertas configurados.');
    } finally {
      setLoadingNotif(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHist(true);
    setHistError('');
    try {
      const [data, devs] = await Promise.allSettled([
        getAlertsHistory({
          from: new Date(range.from).toISOString(),
          to:   new Date(range.to).toISOString(),
        }),
        devices.length ? Promise.resolve(devices) : getDevices({ all: true }),
      ]);
      setHistory(data.status === 'fulfilled' && Array.isArray(data.value) ? data.value : []);
      if (devs.status === 'fulfilled' && Array.isArray(devs.value) && devs.value.length) {
        setDevices(devs.value);
      }
    } catch (err) {
      setHistError(err?.message ?? 'Erro ao carregar histórico de eventos.');
      setHistory([]);
    } finally {
      setLoadingHist(false);
    }
  };

  useEffect(() => { loadNotifications(); loadHistory(); }, []);

  // ── label helper ────────────────────────────────────────────────────────────
  const typeLabel = (type) =>
    BUILT_IN_ALERT_TYPES.find(t => t.type === type)?.label
    ?? notifTypes.find(t => t.type === type)?.type
    ?? type;

  // ── adicionar notificação ───────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.type) { setAddError('Selecione o tipo de alerta.'); return; }
    setSaving(true); setAddError('');
    try {
      await createNotification(form);
      await loadNotifications();
      setShowAdd(false);
      setForm(EMPTY_NOTIF);
    } catch (err) {
      setAddError(err?.message ?? 'Erro ao criar alerta.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover este alerta?')) return;
    try { await deleteNotification(id); await loadNotifications(); } catch { alert('Erro ao remover.'); }
  };

  const handleFilterHistory = (e) => {
    e.preventDefault();
    loadHistory();
  };

  return (
    <div className="fm-body">
      <SimpleBar className="nicescroll-bar">
        <div className="container-fluid px-4 py-4">

          {/* Header */}
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h4 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <Bell size={20} className="text-primary" /> Alertas &amp; Notificações
              </h4>
              <small className="text-muted">Configure alertas e visualize o histórico de eventos</small>
            </div>
          </div>

          <Tab.Container defaultActiveKey="config">
            <Nav variant="tabs" className="mb-4">
              <Nav.Item>
                <Nav.Link eventKey="config">
                  <Bell size={14} className="me-1" /> Configurar Alertas
                  {notifications.length > 0 && (
                    <Badge bg="primary" className="ms-2 text-white" pill>{notifications.length}</Badge>
                  )}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="history">
                  📋 Histórico de Eventos
                  {history.length > 0 && (
                    <Badge bg="secondary" className="ms-2 text-white" pill>{history.length}</Badge>
                  )}
                </Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content>

              {/* ── ABA: Configurar alertas ───────────────────────────────── */}
              <Tab.Pane eventKey="config">
                {notifError && <Alert variant="danger" className="py-2 small mb-3">{notifError}</Alert>}
                <div className="d-flex justify-content-end mb-3">
                  <Button variant="primary" size="sm" className="d-flex align-items-center gap-2"
                    onClick={() => { setForm(EMPTY_NOTIF); setAddError(''); setShowAdd(true); }}>
                    <Plus size={14} /> Novo Alerta
                  </Button>
                </div>

                <Card className="card-border">
                  <Card.Body className="p-0">
                    {loadingNotif
                      ? <div className="text-center py-5"><Spinner /></div>
                      : notifications.length === 0
                        ? (
                        <div className="text-center py-5 text-muted">
                          <BellOff size={40} className="mb-3 opacity-50" />
                          <p className="mb-0">Nenhum alerta configurado.</p>
                          <small>Crie alertas para ser notificado sobre eventos da frota.</small>
                        </div>
                        )
                        : (
                        <Table hover className="mb-0">
                          <thead className="bg-light">
                            <tr>
                              <th>Tipo de Alerta</th>
                              <th>Escopo</th>
                              <th>Canais</th>
                              <th className="text-center">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {notifications.map(n => (
                              <tr key={n.id}>
                                <td>
                                  <Badge bg={eventColor(n.type)} className="text-white me-2">{' '}</Badge>
                                  <strong className="small">{typeLabel(n.type)}</strong>
                                </td>
                                <td>
                                  <Badge bg="light" text="dark">
                                    {n.always ? 'Todos os dispositivos' : 'Selecionados'}
                                  </Badge>
                                </td>
                                <td>
                                  <div className="d-flex gap-1">
                                    {n.web  && <Badge bg="primary"   className="text-white">Web</Badge>}
                                    {n.mail && <Badge bg="secondary" className="text-white">E-mail</Badge>}
                                    {n.sms  && <Badge bg="success"   className="text-white">SMS</Badge>}
                                    {!n.web && !n.mail && !n.sms && <span className="text-muted small">–</span>}
                                  </div>
                                </td>
                                <td className="text-center">
                                  <Button variant="soft-danger" size="sm" onClick={() => handleDelete(n.id)}>
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

                {/* Legenda dos tipos disponíveis */}
                <Card className="card-border mt-4">
                  <Card.Header><h6 className="mb-0 small">Tipos de alerta disponíveis</h6></Card.Header>
                  <Card.Body>
                    <div className="d-flex flex-wrap gap-2">
                      {BUILT_IN_ALERT_TYPES.map(t => (
                        <Badge key={t.type} bg={eventColor(t.type)} text={eventColor(t.type) === 'light' ? 'dark' : undefined} className="fw-normal">
                          {t.label}
                        </Badge>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </Tab.Pane>

              {/* ── ABA: Histórico ────────────────────────────────────────── */}
              <Tab.Pane eventKey="history">
                {histError && <Alert variant="danger" className="py-2 small mb-3">{histError}</Alert>}

                {/* Filtro de período */}
                <Card className="card-border mb-4">
                  <Card.Body>
                    <Form onSubmit={handleFilterHistory}>
                      <Row className="g-2 align-items-end">
                        <Col md={4}>
                          <Form.Label className="small fw-semibold mb-1">Data inicial</Form.Label>
                          <Form.Control type="datetime-local" value={range.from}
                            onChange={e => setRange(r => ({ ...r, from: e.target.value }))} />
                        </Col>
                        <Col md={4}>
                          <Form.Label className="small fw-semibold mb-1">Data final</Form.Label>
                          <Form.Control type="datetime-local" value={range.to}
                            onChange={e => setRange(r => ({ ...r, to: e.target.value }))} />
                        </Col>
                        <Col md={2}>
                          <Button type="submit" variant="primary" className="w-100" disabled={loadingHist}>
                            {loadingHist ? <Spinner size="sm" /> : 'Filtrar'}
                          </Button>
                        </Col>
                      </Row>
                    </Form>
                  </Card.Body>
                </Card>

                <Card className="card-border">
                  <Card.Header className="d-flex align-items-center justify-content-between">
                    <h6 className="mb-0">Eventos Registrados</h6>
                    <small className="text-muted">{history.length} evento{history.length !== 1 ? 's' : ''}</small>
                  </Card.Header>
                  <Card.Body className="p-0">
                    {loadingHist
                      ? <div className="text-center py-5"><Spinner /></div>
                      : history.length === 0
                        ? (
                        <div className="text-center py-5 text-muted">
                          <Bell size={40} className="mb-3 opacity-50" />
                          <p className="mb-0">Nenhum evento no período selecionado.</p>
                        </div>
                        )
                        : (
                        <SimpleBar>
                          <Table hover className="mb-0">
                            <thead className="bg-light">
                              <tr>
                                <th>Data/Hora</th>
                                <th>Tipo</th>
                                <th>Dispositivo</th>
                                <th>Geofence</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[...history]
                                .sort((a, b) => new Date(b.eventTime ?? b.fixTime) - new Date(a.eventTime ?? a.fixTime))
                                .map((ev, i) => {
                                  const dev = devices.find(d => (d.traccarId ?? d.id) === ev.deviceId);
                                  const devName = dev?.name ?? `Device #${ev.deviceId}`;
                                  return (
                                  <tr key={ev.id ?? i}>
                                    <td>
                                      <small className="text-muted">
                                        {new Date(ev.eventTime ?? ev.fixTime).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                      </small>
                                    </td>
                                    <td>
                                      <Badge bg={eventColor(ev.type)} className="text-white">
                                        {typeLabel(ev.type)}
                                      </Badge>
                                    </td>
                                    <td><small className="fw-semibold">{devName}</small></td>
                                    <td><small className="text-muted">{ev.geofenceId ? `Geofence #${ev.geofenceId}` : '–'}</small></td>
                                  </tr>
                                  );
                                })}
                            </tbody>
                          </Table>
                        </SimpleBar>
                        )}
                  </Card.Body>
                </Card>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </div>
      </SimpleBar>

      {/* Modal novo alerta */}
      <Modal show={showAdd} onHide={() => setShowAdd(false)} centered>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold">Novo Alerta</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {addError && <Alert variant="danger" className="py-2 small">{addError}</Alert>}
            <Row className="g-3">
              <Col xs={12}>
                <Form.Label className="small fw-semibold">Tipo de alerta *</Form.Label>
                <Form.Select name="type" value={form.type} onChange={handleChange} required>
                  <option value="">— selecione —</option>
                  {notifTypes.map(t => (
                    <option key={t.type} value={t.type}>{t.label ?? t.type}</option>
                  ))}
                </Form.Select>
              </Col>

              <Col xs={12}>
                <Form.Label className="small fw-semibold d-block mb-2">Canais de notificação</Form.Label>
                <div className="d-flex gap-3">
                  <Form.Check type="switch" id="notif-web"  name="web"  checked={form.web}  onChange={handleChange} label="Web" />
                  <Form.Check type="switch" id="notif-mail" name="mail" checked={form.mail} onChange={handleChange} label="E-mail" />
                  <Form.Check type="switch" id="notif-sms"  name="sms"  checked={form.sms}  onChange={handleChange} label="SMS" />
                </div>
              </Col>

              <Col xs={12}>
                <Form.Check
                  type="switch"
                  id="notif-always"
                  name="always"
                  checked={form.always}
                  onChange={handleChange}
                  label="Aplicar a todos os dispositivos"
                />
                <Form.Text className="text-muted">
                  Quando ativado, o alerta cobre toda a frota do tenant.
                </Form.Text>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" size="sm" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button type="submit" variant="primary" size="sm" disabled={saving}>
              {saving && <Spinner size="sm" className="me-1" />}
              {saving ? 'Criando…' : 'Criar Alerta'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
