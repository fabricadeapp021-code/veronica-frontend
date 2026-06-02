'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Card, Badge, Table, Button, Form, InputGroup, Row, Col, Modal,
  Spinner, Alert, Tabs, Tab,
} from 'react-bootstrap';
import {
  Search, Truck, Clock, CheckCircle, AlertTriangle,
  Plus, X, Eye, ChevronRight, FileText, XCircle,
  Navigation, Activity, Package,
} from 'react-feather';
import SimpleBar from 'simplebar-react';
import {
  getRomaneioStats,
  listRomaneios,
  getRomaneio,
  createRomaneio,
  updateRomaneioStatus,
  addRomaneioOccurrence,
  getRomaneioEventLog,
} from '@/lib/api/services/romaneios';
import { listFretes } from '@/lib/api/services/fretes';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '–';

const fmtCurrency = (val) =>
  val != null ? `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '–';

const fmtKg = (v) => (v != null ? `${Number(v).toLocaleString('pt-BR')} kg` : '–');

// ─── Enums ────────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  draft:      { bg: 'secondary', label: 'Rascunho',     icon: <FileText size={11} /> },
  confirmed:  { bg: 'info',      label: 'Confirmado',   icon: <CheckCircle size={11} /> },
  dispatched: { bg: 'primary',   label: 'Despachado',   icon: <Navigation size={11} /> },
  in_transit: { bg: 'warning',   label: 'Em Trânsito',  icon: <Truck size={11} />, textDark: true },
  delivered:  { bg: 'success',   label: 'Entregue',     icon: <CheckCircle size={11} /> },
  cancelled:  { bg: 'dark',      label: 'Cancelado',    icon: <XCircle size={11} /> },
};

const STATUS_NEXT = {
  draft:      ['confirmed', 'cancelled'],
  confirmed:  ['dispatched', 'cancelled'],
  dispatched: ['in_transit', 'cancelled'],
  in_transit: ['delivered', 'cancelled'],
};

const STATUS_LABELS = {
  confirmed:  'Confirmar',
  dispatched: 'Despachar',
  in_transit: 'Iniciar Trânsito',
  delivered:  'Marcar Entregue',
  cancelled:  'Cancelar',
};

const OCC_TYPES = [
  { value: 'damage',        label: 'Avaria' },
  { value: 'loss',          label: 'Extravio' },
  { value: 'delay',         label: 'Atraso' },
  { value: 'shortage',      label: 'Falta de volume' },
  { value: 'wrong_address', label: 'Endereço incorreto' },
  { value: 'robbery',       label: 'Roubo / furto' },
  { value: 'other',         label: 'Outros' },
];

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.draft;
  return (
    <Badge bg={cfg.bg} text={cfg.textDark ? 'dark' : undefined}
      className="d-inline-flex align-items-center gap-1">
      {cfg.icon} {cfg.label}
    </Badge>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon, color = 'primary' }) {
  return (
    <Card className="h-100 shadow-sm">
      <Card.Body className="d-flex align-items-center gap-3">
        <div className={`rounded-circle bg-${color} bg-opacity-10 p-3 d-flex`}>
          <span className={`text-${color}`}>{icon}</span>
        </div>
        <div>
          <div className="fs-4 fw-bold">{value ?? '–'}</div>
          <div className="text-muted small">{label}</div>
        </div>
      </Card.Body>
    </Card>
  );
}

// ─── NewRomaneioModal ─────────────────────────────────────────────────────────

function NewRomaneioModal({ show, onHide, onCreated }) {
  const [form, setForm] = useState({
    vehicleId: '', driverId: '', carrierId: '',
    freteIds: [],
    originAddress: '', originCity: '', originState: '',
    destAddress: '', destCity: '', destState: '',
    totalWeightKg: '', totalVolumeM3: '', totalFreightBRL: '',
    lacre: '',
    scheduledDepartureDate: '', scheduledArrivalDate: '',
    notes: '',
  });
  const [freteOptions, setFreteOptions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (show) {
      listFretes({ status: 'confirmed', limit: 100 })
        .then(r => setFreteOptions(r?.items ?? []))
        .catch(() => {});
    }
  }, [show]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleFrete = (id) =>
    setForm(f => ({
      ...f,
      freteIds: f.freteIds.includes(id)
        ? f.freteIds.filter(x => x !== id)
        : [...f.freteIds, id],
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setSaving(true);
    try {
      const payload = {
        vehicleId:  form.vehicleId  || undefined,
        driverId:   form.driverId   || undefined,
        carrierId:  form.carrierId  || undefined,
        freteIds:   form.freteIds,
        origin: form.originAddress ? {
          address: form.originAddress,
          city:    form.originCity  || undefined,
          state:   form.originState || undefined,
        } : undefined,
        destination: form.destAddress ? {
          address: form.destAddress,
          city:    form.destCity  || undefined,
          state:   form.destState || undefined,
        } : undefined,
        totalWeightKg:  form.totalWeightKg  ? Number(form.totalWeightKg)  : undefined,
        totalVolumeM3:  form.totalVolumeM3  ? Number(form.totalVolumeM3)  : undefined,
        totalFreightBRL: form.totalFreightBRL ? Number(form.totalFreightBRL) : undefined,
        lacre:     form.lacre     || undefined,
        scheduledDepartureDate: form.scheduledDepartureDate || undefined,
        scheduledArrivalDate:   form.scheduledArrivalDate   || undefined,
        notes:     form.notes     || undefined,
      };
      const created = await createRomaneio(payload);
      onCreated(created);
      onHide();
    } catch (e) {
      setErr(e?.message ?? 'Erro ao criar romaneio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Novo Romaneio</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <SimpleBar style={{ maxHeight: '70vh' }}>
            {err && <Alert variant="danger" className="py-2">{err}</Alert>}

            <h6 className="text-muted mb-2 mt-1">Operação</h6>
            <Row className="g-2 mb-3">
              <Col md={4}>
                <Form.Label className="small">Veículo (ID)</Form.Label>
                <Form.Control size="sm" placeholder="vehicleId"
                  value={form.vehicleId} onChange={e => set('vehicleId', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small">Motorista (ID)</Form.Label>
                <Form.Control size="sm" placeholder="driverId"
                  value={form.driverId} onChange={e => set('driverId', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small">Transportadora (ID)</Form.Label>
                <Form.Control size="sm" placeholder="carrierId"
                  value={form.carrierId} onChange={e => set('carrierId', e.target.value)} />
              </Col>
            </Row>

            <h6 className="text-muted mb-2">Origem</h6>
            <Row className="g-2 mb-3">
              <Col md={6}>
                <Form.Control size="sm" placeholder="Endereço de origem"
                  value={form.originAddress} onChange={e => set('originAddress', e.target.value)} />
              </Col>
              <Col md={3}>
                <Form.Control size="sm" placeholder="Cidade"
                  value={form.originCity} onChange={e => set('originCity', e.target.value)} />
              </Col>
              <Col md={3}>
                <Form.Control size="sm" placeholder="UF" maxLength={2}
                  value={form.originState} onChange={e => set('originState', e.target.value.toUpperCase())} />
              </Col>
            </Row>

            <h6 className="text-muted mb-2">Destino</h6>
            <Row className="g-2 mb-3">
              <Col md={6}>
                <Form.Control size="sm" placeholder="Endereço de destino"
                  value={form.destAddress} onChange={e => set('destAddress', e.target.value)} />
              </Col>
              <Col md={3}>
                <Form.Control size="sm" placeholder="Cidade"
                  value={form.destCity} onChange={e => set('destCity', e.target.value)} />
              </Col>
              <Col md={3}>
                <Form.Control size="sm" placeholder="UF" maxLength={2}
                  value={form.destState} onChange={e => set('destState', e.target.value.toUpperCase())} />
              </Col>
            </Row>

            <h6 className="text-muted mb-2">Fretes vinculados</h6>
            {freteOptions.length === 0 ? (
              <p className="text-muted small mb-3">Nenhum frete confirmado disponível.</p>
            ) : (
              <div className="border rounded p-2 mb-3" style={{ maxHeight: 160, overflowY: 'auto' }}>
                {freteOptions.map(f => (
                  <Form.Check key={f._id} type="checkbox" id={`fr-${f._id}`}
                    label={`${f.freteNumber} — ${f.destinatario?.razaoSocial ?? '–'}`}
                    checked={form.freteIds.includes(f._id)}
                    onChange={() => toggleFrete(f._id)}
                    className="small" />
                ))}
              </div>
            )}

            <h6 className="text-muted mb-2">Totalizadores</h6>
            <Row className="g-2 mb-3">
              <Col md={4}>
                <Form.Label className="small">Peso total (kg)</Form.Label>
                <Form.Control size="sm" type="number" min={0}
                  value={form.totalWeightKg} onChange={e => set('totalWeightKg', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small">Volume total (m³)</Form.Label>
                <Form.Control size="sm" type="number" min={0} step="0.01"
                  value={form.totalVolumeM3} onChange={e => set('totalVolumeM3', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small">Frete total (R$)</Form.Label>
                <Form.Control size="sm" type="number" min={0} step="0.01"
                  value={form.totalFreightBRL} onChange={e => set('totalFreightBRL', e.target.value)} />
              </Col>
            </Row>

            <Row className="g-2 mb-3">
              <Col md={4}>
                <Form.Label className="small">Lacre</Form.Label>
                <Form.Control size="sm" placeholder="Número do lacre"
                  value={form.lacre} onChange={e => set('lacre', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small">Saída prevista</Form.Label>
                <Form.Control size="sm" type="datetime-local"
                  value={form.scheduledDepartureDate}
                  onChange={e => set('scheduledDepartureDate', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small">Chegada prevista</Form.Label>
                <Form.Control size="sm" type="datetime-local"
                  value={form.scheduledArrivalDate}
                  onChange={e => set('scheduledArrivalDate', e.target.value)} />
              </Col>
            </Row>

            <Form.Control as="textarea" rows={2} size="sm" placeholder="Observações…"
              value={form.notes} onChange={e => set('notes', e.target.value)} />
          </SimpleBar>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onHide} disabled={saving}>Cancelar</Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? <Spinner size="sm" /> : 'Criar Romaneio'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

// ─── OccurrenceModal ──────────────────────────────────────────────────────────

function OccurrenceModal({ show, romaneioId, onHide, onSaved }) {
  const [form, setForm] = useState({ type: 'delay', severity: 'low', description: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) { setErr('Descrição obrigatória'); return; }
    setErr(''); setSaving(true);
    try {
      await addRomaneioOccurrence(romaneioId, form);
      onSaved(); onHide();
    } catch (e) {
      setErr(e?.message ?? 'Erro ao registrar ocorrência');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Registrar Ocorrência</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {err && <Alert variant="danger" className="py-2">{err}</Alert>}
          <Row className="g-2 mb-2">
            <Col md={6}>
              <Form.Label className="small">Tipo</Form.Label>
              <Form.Select size="sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {OCC_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Form.Select>
            </Col>
            <Col md={6}>
              <Form.Label className="small">Severidade</Form.Label>
              <Form.Select size="sm" value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </Form.Select>
            </Col>
          </Row>
          {form.severity === 'high' && (
            <Alert variant="warning" className="py-1 small mb-2">
              <AlertTriangle size={12} className="me-1" /> Ocorrência de alta severidade será registrada no log centralizado.
            </Alert>
          )}
          <Form.Control as="textarea" rows={3} size="sm" placeholder="Descreva a ocorrência…"
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onHide} disabled={saving}>Cancelar</Button>
          <Button variant="danger" type="submit" disabled={saving}>
            {saving ? <Spinner size="sm" /> : 'Registrar'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

// ─── StatusModal ──────────────────────────────────────────────────────────────

function StatusModal({ show, romaneio, onHide, onUpdated }) {
  const [targetStatus, setTargetStatus] = useState('');
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const nexts = romaneio ? (STATUS_NEXT[romaneio.status] ?? []) : [];

  useEffect(() => {
    if (show && nexts.length) setTargetStatus(nexts[0]);
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(''); setSaving(true);
    try {
      await updateRomaneioStatus(romaneio._id, targetStatus, {
        note: note || undefined,
        cancellationReason: targetStatus === 'cancelled' ? reason || undefined : undefined,
      });
      onUpdated(); onHide();
    } catch (e) {
      setErr(e?.message ?? 'Erro ao atualizar status');
    } finally {
      setSaving(false);
    }
  };

  if (!romaneio) return null;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Atualizar Status — {romaneio.romaneioNumber}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {err && <Alert variant="danger" className="py-2">{err}</Alert>}
          {nexts.length === 0 ? (
            <p className="text-muted">Nenhuma transição disponível.</p>
          ) : (
            <>
              <Form.Label className="small">Novo status</Form.Label>
              <Form.Select size="sm" className="mb-2" value={targetStatus}
                onChange={e => setTargetStatus(e.target.value)}>
                {nexts.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
                ))}
              </Form.Select>
              {targetStatus === 'cancelled' && (
                <Form.Control size="sm" className="mb-2" placeholder="Motivo do cancelamento"
                  value={reason} onChange={e => setReason(e.target.value)} />
              )}
              <Form.Control size="sm" as="textarea" rows={2} placeholder="Nota (opcional)"
                value={note} onChange={e => setNote(e.target.value)} />
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onHide} disabled={saving}>Cancelar</Button>
          {nexts.length > 0 && (
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? <Spinner size="sm" /> : 'Confirmar'}
            </Button>
          )}
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

// ─── DetailModal ──────────────────────────────────────────────────────────────

function DetailModal({ show, romaneio, onHide, onRefresh }) {
  const [detail, setDetail] = useState(null);
  const [eventLog, setEventLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showOcc, setShowOcc] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    if (show && romaneio?._id) {
      setLoading(true);
      Promise.all([
        getRomaneio(romaneio._id),
        getRomaneioEventLog(romaneio._id),
      ])
        .then(([r, log]) => { setDetail(r); setEventLog(log ?? []); })
        .finally(() => setLoading(false));
    }
  }, [show, romaneio?._id]);

  const refresh = () => {
    getRomaneio(romaneio._id).then(setDetail);
    getRomaneioEventLog(romaneio._id).then(l => setEventLog(l ?? []));
    onRefresh();
  };

  if (!romaneio) return null;
  const r = detail ?? romaneio;

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {r.romaneioNumber} <StatusBadge status={r.status} />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loading ? (
            <div className="text-center py-4"><Spinner /></div>
          ) : (
            <Tabs defaultActiveKey="info" className="mb-3">
              {/* ── Info ── */}
              <Tab eventKey="info" title="Informações">
                <Row className="g-3">
                  <Col md={6}>
                    <h6 className="text-muted small mb-1">Origem</h6>
                    <p className="mb-1">{r.origin?.address ?? '–'}</p>
                    <small className="text-muted">{r.origin?.city}{r.origin?.state ? ` / ${r.origin.state}` : ''}</small>
                  </Col>
                  <Col md={6}>
                    <h6 className="text-muted small mb-1">Destino</h6>
                    <p className="mb-1">{r.destination?.address ?? '–'}</p>
                    <small className="text-muted">{r.destination?.city}{r.destination?.state ? ` / ${r.destination.state}` : ''}</small>
                  </Col>
                  <Col md={3}>
                    <h6 className="text-muted small mb-1">Veículo</h6>
                    <p className="mb-0">{r.vehicleId ?? '–'}</p>
                  </Col>
                  <Col md={3}>
                    <h6 className="text-muted small mb-1">Motorista</h6>
                    <p className="mb-0">{r.driverId ?? '–'}</p>
                  </Col>
                  <Col md={3}>
                    <h6 className="text-muted small mb-1">Lacre</h6>
                    <p className="mb-0">{r.lacre ?? '–'}</p>
                  </Col>
                  <Col md={3}>
                    <h6 className="text-muted small mb-1">Fretes vinculados</h6>
                    <p className="mb-0">{(r.freteIds ?? []).length}</p>
                  </Col>
                  <Col md={4}>
                    <h6 className="text-muted small mb-1">Peso total</h6>
                    <p className="mb-0">{fmtKg(r.totalWeightKg)}</p>
                  </Col>
                  <Col md={4}>
                    <h6 className="text-muted small mb-1">Volume total</h6>
                    <p className="mb-0">{r.totalVolumeM3 != null ? `${r.totalVolumeM3} m³` : '–'}</p>
                  </Col>
                  <Col md={4}>
                    <h6 className="text-muted small mb-1">Frete total</h6>
                    <p className="mb-0 fw-bold">{fmtCurrency(r.totalFreightBRL)}</p>
                  </Col>
                  <Col md={6}>
                    <h6 className="text-muted small mb-1">Saída prevista</h6>
                    <p className="mb-0">{fmtDate(r.scheduledDepartureDate)}</p>
                  </Col>
                  <Col md={6}>
                    <h6 className="text-muted small mb-1">Chegada prevista</h6>
                    <p className="mb-0">{fmtDate(r.scheduledArrivalDate)}</p>
                  </Col>
                  {r.actualDepartureDate && (
                    <Col md={6}>
                      <h6 className="text-muted small mb-1">Saída real</h6>
                      <p className="mb-0 text-success">{fmtDate(r.actualDepartureDate)}</p>
                    </Col>
                  )}
                  {r.actualArrivalDate && (
                    <Col md={6}>
                      <h6 className="text-muted small mb-1">Chegada real</h6>
                      <p className="mb-0 text-success">{fmtDate(r.actualArrivalDate)}</p>
                    </Col>
                  )}
                  {r.notes && (
                    <Col xs={12}>
                      <h6 className="text-muted small mb-1">Observações</h6>
                      <p className="mb-0 text-muted">{r.notes}</p>
                    </Col>
                  )}
                </Row>
              </Tab>

              {/* ── Eventos ── */}
              <Tab eventKey="events" title={`Eventos (${(r.events ?? []).length})`}>
                <SimpleBar style={{ maxHeight: 320 }}>
                  {(r.events ?? []).length === 0 ? (
                    <p className="text-muted text-center py-3">Nenhum evento registrado.</p>
                  ) : (
                    <div className="timeline-simple">
                      {[...(r.events ?? [])].reverse().map((ev, i) => (
                        <div key={i} className="d-flex gap-2 mb-2">
                          <div className="pt-1"><Activity size={14} className="text-primary" /></div>
                          <div>
                            <div className="small fw-medium">{ev.type}</div>
                            <div className="text-muted" style={{ fontSize: 11 }}>
                              {fmtDate(ev.timestamp)} · {ev.origin ?? 'system'}
                            </div>
                            {ev.note && <div className="text-muted small">{ev.note}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SimpleBar>
              </Tab>

              {/* ── Ocorrências ── */}
              <Tab eventKey="occurrences" title={`Ocorrências (${(r.occurrences ?? []).length})`}>
                <SimpleBar style={{ maxHeight: 320 }}>
                  {(r.occurrences ?? []).length === 0 ? (
                    <p className="text-muted text-center py-3">Nenhuma ocorrência registrada.</p>
                  ) : (
                    (r.occurrences ?? []).map((oc, i) => (
                      <div key={i} className="d-flex gap-2 mb-2 p-2 rounded border">
                        <AlertTriangle size={14} className={`mt-1 text-${oc.severity === 'high' ? 'danger' : oc.severity === 'medium' ? 'warning' : 'muted'}`} />
                        <div>
                          <Badge bg={oc.severity === 'high' ? 'danger' : oc.severity === 'medium' ? 'warning' : 'secondary'}
                            text={oc.severity === 'medium' ? 'dark' : undefined} className="me-1">
                            {oc.severity}
                          </Badge>
                          <span className="small fw-medium">{oc.type}</span>
                          <div className="text-muted small">{oc.description}</div>
                          <div className="text-muted" style={{ fontSize: 11 }}>{fmtDate(oc.timestamp)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </SimpleBar>
              </Tab>

              {/* ── Log centralizado ── */}
              <Tab eventKey="log" title={`Log (${eventLog.length})`}>
                <SimpleBar style={{ maxHeight: 320 }}>
                  {eventLog.length === 0 ? (
                    <p className="text-muted text-center py-3">Nenhum log centralizado.</p>
                  ) : (
                    eventLog.map((l, i) => (
                      <div key={i} className="d-flex gap-2 mb-2">
                        <div className="pt-1"><ChevronRight size={12} className="text-muted" /></div>
                        <div>
                          <div className="small fw-medium">{l.type}</div>
                          <div className="text-muted" style={{ fontSize: 11 }}>
                            {fmtDate(l.timestamp)} · {l.entityRef}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </SimpleBar>
              </Tab>
            </Tabs>
          )}
        </Modal.Body>
        <Modal.Footer className="justify-content-between">
          <div className="d-flex gap-2">
            <Button size="sm" variant="outline-warning"
              onClick={() => setShowOcc(true)}>
              <AlertTriangle size={13} className="me-1" /> Ocorrência
            </Button>
            {STATUS_NEXT[r.status]?.length > 0 && (
              <Button size="sm" variant="outline-primary"
                onClick={() => setShowStatus(true)}>
                <ChevronRight size={13} className="me-1" /> Status
              </Button>
            )}
          </div>
          <Button variant="light" onClick={onHide}>Fechar</Button>
        </Modal.Footer>
      </Modal>

      <OccurrenceModal show={showOcc} romaneioId={r._id}
        onHide={() => setShowOcc(false)} onSaved={refresh} />
      <StatusModal show={showStatus} romaneio={r}
        onHide={() => setShowStatus(false)} onUpdated={refresh} />
    </>
  );
}

// ─── RomaneiosBody ────────────────────────────────────────────────────────────

export default function RomaneiosBody() {
  const [stats, setStats]       = useState(null);
  const [items, setItems]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [showNew, setShowNew]       = useState(false);
  const [selected, setSelected]     = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, list] = await Promise.all([
        getRomaneioStats(),
        listRomaneios({ status: filterStatus || undefined, limit: 100 }),
      ]);
      setStats(s);
      setItems(list?.items ?? []);
      setTotal(list?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(r =>
    !search || r.romaneioNumber?.toLowerCase().includes(search.toLowerCase()) ||
    r.origin?.city?.toLowerCase().includes(search.toLowerCase()) ||
    r.destination?.city?.toLowerCase().includes(search.toLowerCase()),
  );

  const openDetail = (r) => { setSelected(r); setShowDetail(true); };

  return (
    <div className="hk-pg-body">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-1">Romaneios</h3>
          <p className="text-muted mb-0">Manifestos de carga agrupando fretes por viagem</p>
        </div>
        <Button variant="primary" onClick={() => setShowNew(true)}>
          <Plus size={16} className="me-1" /> Novo Romaneio
        </Button>
      </div>

      {/* KPIs */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <KpiCard label="Total" value={stats?.total ?? 0} icon={<FileText size={20} />} color="primary" />
        </Col>
        <Col xs={6} md={3}>
          <KpiCard label="Em Trânsito"
            value={(stats?.byStatus?.in_transit ?? 0) + (stats?.byStatus?.dispatched ?? 0)}
            icon={<Truck size={20} />} color="warning" />
        </Col>
        <Col xs={6} md={3}>
          <KpiCard label="Entregues"
            value={stats?.byStatus?.delivered ?? 0}
            icon={<CheckCircle size={20} />} color="success" />
        </Col>
        <Col xs={6} md={3}>
          <KpiCard label="Rascunho / Confirmado"
            value={(stats?.byStatus?.draft ?? 0) + (stats?.byStatus?.confirmed ?? 0)}
            icon={<Clock size={20} />} color="secondary" />
        </Col>
      </Row>

      {/* Filtros */}
      <Card className="shadow-sm mb-3">
        <Card.Body className="py-2">
          <Row className="g-2 align-items-center">
            <Col md={5}>
              <InputGroup size="sm">
                <InputGroup.Text><Search size={14} /></InputGroup.Text>
                <Form.Control placeholder="Buscar por número, origem ou destino…"
                  value={search} onChange={e => setSearch(e.target.value)} />
                {search && (
                  <Button variant="outline-secondary" onClick={() => setSearch('')}>
                    <X size={14} />
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select size="sm" value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}>
                <option value="">Todos os status</option>
                {Object.entries(STATUS_CFG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4} className="text-end">
              <small className="text-muted">{filtered.length} de {total} romaneios</small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabela */}
      <Card className="shadow-sm">
        <SimpleBar>
          <Table hover responsive className="mb-0">
            <thead className="table-light">
              <tr>
                <th>Número</th>
                <th>Status</th>
                <th>Origem → Destino</th>
                <th>Fretes</th>
                <th>Peso total</th>
                <th>Frete total</th>
                <th>Saída prevista</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-4"><Spinner size="sm" /> Carregando…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-4 text-muted">
                  <Package size={24} className="mb-2 d-block mx-auto" />
                  Nenhum romaneio encontrado.
                </td></tr>
              ) : filtered.map(r => (
                <tr key={r._id} style={{ cursor: 'pointer' }} onClick={() => openDetail(r)}>
                  <td className="fw-medium">{r.romaneioNumber}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>
                    <span className="text-muted small">
                      {r.origin?.city ?? '–'} {r.origin?.state ? `(${r.origin.state})` : ''}
                    </span>
                    <ChevronRight size={12} className="mx-1 text-muted" />
                    <span className="text-muted small">
                      {r.destination?.city ?? '–'} {r.destination?.state ? `(${r.destination.state})` : ''}
                    </span>
                  </td>
                  <td>{(r.freteIds ?? []).length}</td>
                  <td>{fmtKg(r.totalWeightKg)}</td>
                  <td className="fw-medium">{fmtCurrency(r.totalFreightBRL)}</td>
                  <td>{fmtDate(r.scheduledDepartureDate)}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="light" onClick={() => openDetail(r)}>
                      <Eye size={13} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </SimpleBar>
      </Card>

      <NewRomaneioModal show={showNew}
        onHide={() => setShowNew(false)}
        onCreated={() => load()} />

      <DetailModal show={showDetail} romaneio={selected}
        onHide={() => setShowDetail(false)}
        onRefresh={load} />
    </div>
  );
}
