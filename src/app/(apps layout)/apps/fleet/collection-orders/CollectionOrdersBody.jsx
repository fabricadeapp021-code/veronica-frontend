'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Card, Badge, Table, Button, Form, InputGroup, Row, Col, Modal,
  Spinner, Alert, Tabs, Tab,
} from 'react-bootstrap';
import {
  Search, Package, Clock, CheckCircle, AlertCircle, AlertTriangle,
  Plus, X, Eye, ChevronRight, Truck, MapPin, FileText, CheckSquare,
  XCircle, List, Activity,
} from 'react-feather';
import SimpleBar from 'simplebar-react';
import {
  getCollectionOrderStats,
  listCollectionOrders,
  getCollectionOrder,
  createCollectionOrder,
  updateCollectionOrderStatus,
  addCollectionOrderOccurrence,
  approveCollectionOrderFiscal,
  getCollectionOrderEventLog,
} from '@/lib/api/services/collectionOrders';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '–';

const fmtCurrency = (val) =>
  val != null ? `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '–';

// ─── Enums (espelham o backend) ────────────────────────────────────────────────

const STATUS_CFG = {
  created:         { bg: 'secondary', label: 'Criada',          icon: <Package size={11} /> },
  scheduled:       { bg: 'info',      label: 'Agendada',        icon: <Clock size={11} /> },
  in_transit:      { bg: 'primary',   label: 'Em Trânsito',     icon: <Truck size={11} /> },
  on_site:         { bg: 'warning',   label: 'No Local',        icon: <MapPin size={11} /> },
  collecting:      { bg: 'warning',   label: 'Coletando',       icon: <Activity size={11} /> },
  collected:       { bg: 'success',   label: 'Coletado',        icon: <CheckCircle size={11} /> },
  with_divergence: { bg: 'danger',    label: 'Com Divergência', icon: <AlertCircle size={11} /> },
  cancelled:       { bg: 'dark',      label: 'Cancelada',       icon: <XCircle size={11} /> },
};

const STATUS_NEXT = {
  created:    ['scheduled', 'cancelled'],
  scheduled:  ['in_transit', 'cancelled'],
  in_transit: ['on_site', 'cancelled'],
  on_site:    ['collecting', 'cancelled'],
  collecting: ['collected', 'with_divergence', 'cancelled'],
  with_divergence: ['collecting', 'cancelled'],
};

const OPERATION_TYPES = [
  { value: 'fob', label: 'FOB — Frete por conta do comprador' },
  { value: 'cif', label: 'CIF — Frete por conta do vendedor' },
  { value: 'dap', label: 'DAP — Entregue no local' },
  { value: 'exw', label: 'EXW — Na fábrica (Ex Works)' },
];

const TRANSPORT_TYPES = [
  { value: 'ftl',       label: 'FTL — Carga completa' },
  { value: 'ltl',       label: 'LTL — Fracionado' },
  { value: 'dedicated', label: 'Dedicado' },
];

const LOCATION_TYPES = [
  { value: 'distribution_center', label: 'Centro de Distribuição' },
  { value: 'factory',             label: 'Fábrica' },
  { value: 'client',              label: 'Cliente' },
  { value: 'port',                label: 'Porto' },
  { value: 'terminal',            label: 'Terminal' },
  { value: 'warehouse',           label: 'Armazém' },
  { value: 'supplier',            label: 'Fornecedor' },
];

const OCC_TYPES = [
  { value: 'damage',          label: 'Avaria' },
  { value: 'loss',            label: 'Extravio' },
  { value: 'delay',           label: 'Atraso' },
  { value: 'shortage',        label: 'Falta de volume' },
  { value: 'excess',          label: 'Volume excedente' },
  { value: 'wrong_address',   label: 'Endereço incorreto' },
  { value: 'access_denied',   label: 'Acesso negado no local' },
  { value: 'fiscal_block',    label: 'Bloqueio fiscal' },
  { value: 'weather',         label: 'Condição climática' },
  { value: 'breakdown',       label: 'Pane mecânica' },
  { value: 'accident',        label: 'Acidente' },
  { value: 'other',           label: 'Outros' },
];

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.created;
  return (
    <Badge bg={cfg.bg} className="d-inline-flex align-items-center gap-1 text-white">
      {cfg.icon} {cfg.label}
    </Badge>
  );
}

// ─── KpiCard ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, color = 'primary', icon }) {
  return (
    <Card className="card-border text-center h-100">
      <Card.Body className="py-3">
        {icon && <div className={`text-${color} mb-1`}>{icon}</div>}
        <h3 className={`fw-bold text-${color} mb-0`}>{value ?? '–'}</h3>
        <small className="text-muted">{label}</small>
      </Card.Body>
    </Card>
  );
}

// ─── Modal: Nova Ordem ────────────────────────────────────────────────────────

function NewOrderModal({ show, onHide, onCreated }) {
  const EMPTY = {
    operationType: 'cif',
    transportType: 'ftl',
    locationType: 'client',
    razaoSocial: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    cnpj: '',
    windowStart: '',
    windowEnd: '',
    cargoDesc: '',
    cargoWeightKg: '',
    cargoVolumeM3: '',
    cargoValueR$: '',
    nfNumbers: '',
    requiresRefrigeration: false,
    isHazmat: false,
    notes: '',
  };
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    if (!form.razaoSocial || !form.address) {
      setError('Preencha razão social e endereço do local de coleta.');
      return;
    }
    setSaving(true); setError('');
    try {
      await createCollectionOrder({
        operationType: form.operationType,
        transportType: form.transportType,
        pickupLocation: {
          type:        form.locationType,
          razaoSocial: form.razaoSocial,
          cnpj:        form.cnpj || undefined,
          address:     form.address,
          city:        form.city || undefined,
          state:       form.state || undefined,
          zipCode:     form.zipCode || undefined,
        },
        collectionWindow: (form.windowStart && form.windowEnd) ? {
          start: form.windowStart,
          end:   form.windowEnd,
        } : undefined,
        cargo: {
          description:          form.cargoDesc || undefined,
          weightKg:             form.cargoWeightKg ? parseFloat(form.cargoWeightKg) : undefined,
          volumeM3:             form.cargoVolumeM3 ? parseFloat(form.cargoVolumeM3) : undefined,
          'valueR$':            form['cargoValueR$'] ? parseFloat(form['cargoValueR$']) : undefined,
          nfNumbers:            form.nfNumbers ? form.nfNumbers.split(',').map(s => s.trim()).filter(Boolean) : undefined,
          requiresRefrigeration: form.requiresRefrigeration || undefined,
          isHazmat:             form.isHazmat || undefined,
        },
        notes: form.notes || undefined,
      });
      setForm(EMPTY);
      onCreated();
    } catch (e) {
      setError(e?.message ?? 'Erro ao criar ordem.');
    }
    setSaving(false);
  };

  const handleClose = () => { setForm(EMPTY); setError(''); onHide(); };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="fs-6 text-dark">
          <Package size={16} className="me-2 text-primary" />Nova Ordem de Coleta
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
        <Row className="g-3">
          {/* Tipo de operação e transporte */}
          <Col md={6}>
            <Form.Label className="small fw-semibold">Tipo de Operação *</Form.Label>
            <Form.Select size="sm" value={form.operationType} onChange={e => set('operationType', e.target.value)}>
              {OPERATION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Form.Select>
          </Col>
          <Col md={6}>
            <Form.Label className="small fw-semibold">Tipo de Transporte *</Form.Label>
            <Form.Select size="sm" value={form.transportType} onChange={e => set('transportType', e.target.value)}>
              {TRANSPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Form.Select>
          </Col>

          {/* Local de coleta */}
          <Col xs={12}><hr className="my-1" /><small className="fw-semibold text-muted">Local de Coleta</small></Col>
          <Col md={4}>
            <Form.Label className="small fw-semibold">Tipo do Local *</Form.Label>
            <Form.Select size="sm" value={form.locationType} onChange={e => set('locationType', e.target.value)}>
              {LOCATION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Form.Select>
          </Col>
          <Col md={5}>
            <Form.Label className="small fw-semibold">Razão Social *</Form.Label>
            <Form.Control size="sm" value={form.razaoSocial} onChange={e => set('razaoSocial', e.target.value)} placeholder="Ex: Empresa XYZ Ltda" />
          </Col>
          <Col md={3}>
            <Form.Label className="small fw-semibold">CNPJ</Form.Label>
            <Form.Control size="sm" value={form.cnpj} onChange={e => set('cnpj', e.target.value)} placeholder="00.000.000/0001-00" />
          </Col>
          <Col md={6}>
            <Form.Label className="small fw-semibold">Endereço *</Form.Label>
            <Form.Control size="sm" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Rua, número, bairro" />
          </Col>
          <Col md={3}>
            <Form.Label className="small fw-semibold">Cidade</Form.Label>
            <Form.Control size="sm" value={form.city} onChange={e => set('city', e.target.value)} />
          </Col>
          <Col md={1}>
            <Form.Label className="small fw-semibold">UF</Form.Label>
            <Form.Control size="sm" maxLength={2} value={form.state} onChange={e => set('state', e.target.value.toUpperCase())} />
          </Col>
          <Col md={2}>
            <Form.Label className="small fw-semibold">CEP</Form.Label>
            <Form.Control size="sm" value={form.zipCode} onChange={e => set('zipCode', e.target.value)} />
          </Col>

          {/* Janela de coleta */}
          <Col xs={12}><hr className="my-1" /><small className="fw-semibold text-muted">Janela de Coleta</small></Col>
          <Col md={6}>
            <Form.Label className="small fw-semibold">Início</Form.Label>
            <Form.Control size="sm" type="datetime-local" value={form.windowStart} onChange={e => set('windowStart', e.target.value)} />
          </Col>
          <Col md={6}>
            <Form.Label className="small fw-semibold">Fim</Form.Label>
            <Form.Control size="sm" type="datetime-local" value={form.windowEnd} onChange={e => set('windowEnd', e.target.value)} />
          </Col>

          {/* Carga */}
          <Col xs={12}><hr className="my-1" /><small className="fw-semibold text-muted">Carga</small></Col>
          <Col md={4}>
            <Form.Label className="small fw-semibold">Peso (kg)</Form.Label>
            <Form.Control size="sm" type="number" min="0" value={form.cargoWeightKg} onChange={e => set('cargoWeightKg', e.target.value)} placeholder="ex: 5000" />
          </Col>
          <Col md={4}>
            <Form.Label className="small fw-semibold">Volume (m³)</Form.Label>
            <Form.Control size="sm" type="number" min="0" value={form.cargoVolumeM3} onChange={e => set('cargoVolumeM3', e.target.value)} placeholder="ex: 12.5" />
          </Col>
          <Col md={4}>
            <Form.Label className="small fw-semibold">Valor da Carga (R$)</Form.Label>
            <Form.Control size="sm" type="number" min="0" value={form['cargoValueR$']} onChange={e => set('cargoValueR$', e.target.value)} placeholder="ex: 50000" />
          </Col>
          <Col md={6}>
            <Form.Label className="small fw-semibold">Descrição</Form.Label>
            <Form.Control size="sm" value={form.cargoDesc} onChange={e => set('cargoDesc', e.target.value)} placeholder="Descrição da mercadoria" />
          </Col>
          <Col md={6}>
            <Form.Label className="small fw-semibold">NFs vinculadas (separadas por vírgula)</Form.Label>
            <Form.Control size="sm" value={form.nfNumbers} onChange={e => set('nfNumbers', e.target.value)} placeholder="ex: 12345, 12346" />
          </Col>
          <Col md={6}>
            <Form.Check type="checkbox" label="Requer refrigeração" checked={form.requiresRefrigeration} onChange={e => set('requiresRefrigeration', e.target.checked)} className="small" />
          </Col>
          <Col md={6}>
            <Form.Check type="checkbox" label="Carga perigosa (HAZMAT)" checked={form.isHazmat} onChange={e => set('isHazmat', e.target.checked)} className="small" />
          </Col>

          {/* Observações */}
          <Col xs={12}>
            <Form.Label className="small fw-semibold">Observações</Form.Label>
            <Form.Control as="textarea" rows={2} size="sm" value={form.notes} onChange={e => set('notes', e.target.value)} />
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" size="sm" onClick={handleClose}>Cancelar</Button>
        <Button variant="primary" size="sm" onClick={handleCreate} disabled={saving}>
          {saving ? <Spinner size="sm" /> : <><Plus size={14} className="me-1" />Criar Ordem</>}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// ─── Modal: Ocorrência ────────────────────────────────────────────────────────

function OccurrenceModal({ orderId, show, onHide, onAdded }) {
  const [form, setForm] = useState({ type: 'delay', description: '', severity: 'low' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handle = async () => {
    if (!form.description.trim()) { setError('Descreva a ocorrência.'); return; }
    setSaving(true); setError('');
    try {
      await addCollectionOrderOccurrence(orderId, form);
      setForm({ type: 'delay', description: '', severity: 'low' });
      onAdded();
    } catch (e) { setError(e?.message ?? 'Erro.'); }
    setSaving(false);
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="fs-6">
          <AlertTriangle size={15} className="me-2 text-warning" />Registrar Ocorrência
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
        <Form.Label className="small fw-semibold">Tipo</Form.Label>
        <Form.Select size="sm" className="mb-2" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
          {OCC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Form.Select>
        <Form.Label className="small fw-semibold">Severidade</Form.Label>
        <Form.Select size="sm" className="mb-2" value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
          <option value="low">Baixa</option>
          <option value="medium">Média</option>
          <option value="high">Alta — gera auto-divergência</option>
        </Form.Select>
        <Form.Label className="small fw-semibold">Descrição *</Form.Label>
        <Form.Control as="textarea" rows={3} size="sm" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" size="sm" onClick={onHide}>Cancelar</Button>
        <Button variant="warning" size="sm" onClick={handle} disabled={saving}>
          {saving ? <Spinner size="sm" /> : 'Registrar'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// ─── Modal: Detalhes ──────────────────────────────────────────────────────────

function DetailModal({ orderId, show, onHide, onRefresh }) {
  const [order, setOrder] = useState(null);
  const [eventLog, setEventLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('info');
  const [approvingFiscal, setApprovingFiscal] = useState(false);
  const [fiscalMsg, setFiscalMsg] = useState('');
  const [showOcc, setShowOcc] = useState(false);

  const load = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const [o, log] = await Promise.allSettled([
        getCollectionOrder(orderId),
        getCollectionOrderEventLog(orderId),
      ]);
      setOrder(o.value ?? null);
      setEventLog(Array.isArray(log.value) ? log.value : []);
    } catch {}
    setLoading(false);
  }, [orderId]);

  useEffect(() => { if (show) load(); }, [show, load]);

  const handleFiscalApprove = async () => {
    setApprovingFiscal(true); setFiscalMsg('');
    try {
      await approveCollectionOrderFiscal(orderId);
      setFiscalMsg('Documentação fiscal aprovada com sucesso.');
      load();
      onRefresh();
    } catch (e) { setFiscalMsg(e?.message ?? 'Erro.'); }
    setApprovingFiscal(false);
  };

  const sevColor = (s) => s === 'high' ? 'danger' : s === 'medium' ? 'warning' : 'secondary';

  return (
    <>
      <Modal show={show} onHide={onHide} centered size="xl">
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 text-dark">
            <Package size={15} className="me-2 text-primary" />
            {order ? `${order.orderNumber} — ${order.pickupLocation?.razaoSocial}` : 'Detalhes da Ordem'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loading
            ? <div className="text-center py-4"><Spinner /></div>
            : order && (
              <Tabs activeKey={tab} onSelect={k => setTab(k)} className="mb-3">

                {/* ── Informações ── */}
                <Tab eventKey="info" title={<><FileText size={13} className="me-1" />Informações</>}>
                  <Row className="g-3">
                    <Col xs={6} md={3}><small className="text-muted d-block">Número</small><strong className="small">{order.orderNumber}</strong></Col>
                    <Col xs={6} md={3}><small className="text-muted d-block">Status</small><StatusBadge status={order.status} /></Col>
                    <Col xs={6} md={3}><small className="text-muted d-block">Operação</small><strong className="small">{OPERATION_TYPES.find(t => t.value === order.operationType)?.label?.split(' — ')[0] ?? order.operationType}</strong></Col>
                    <Col xs={6} md={3}><small className="text-muted d-block">Transporte</small><strong className="small">{TRANSPORT_TYPES.find(t => t.value === order.transportType)?.label?.split(' — ')[0] ?? order.transportType}</strong></Col>

                    <Col xs={12}><hr className="my-1" /><small className="fw-semibold">Local de Coleta</small></Col>
                    <Col xs={12} md={6}><small className="text-muted d-block">Razão Social</small><strong className="small">{order.pickupLocation?.razaoSocial}</strong></Col>
                    <Col xs={12} md={6}><small className="text-muted d-block">Endereço</small><strong className="small">{order.pickupLocation?.address}{order.pickupLocation?.city ? ` — ${order.pickupLocation.city}/${order.pickupLocation.state}` : ''}</strong></Col>
                    {order.pickupLocation?.cnpj && <Col xs={6} md={3}><small className="text-muted d-block">CNPJ</small><strong className="small">{order.pickupLocation.cnpj}</strong></Col>}

                    {order.collectionWindow && (
                      <>
                        <Col xs={12}><hr className="my-1" /><small className="fw-semibold">Janela de Coleta</small></Col>
                        <Col xs={6} md={3}><small className="text-muted d-block">Início</small><strong className="small">{fmtDate(order.collectionWindow.start)}</strong></Col>
                        <Col xs={6} md={3}><small className="text-muted d-block">Fim</small><strong className="small">{fmtDate(order.collectionWindow.end)}</strong></Col>
                      </>
                    )}

                    {order.cargo && (
                      <>
                        <Col xs={12}><hr className="my-1" /><small className="fw-semibold">Carga</small></Col>
                        {order.cargo.description && <Col xs={12} md={6}><small className="text-muted d-block">Descrição</small><strong className="small">{order.cargo.description}</strong></Col>}
                        {order.cargo.weightKg != null && <Col xs={6} md={3}><small className="text-muted d-block">Peso</small><strong className="small">{order.cargo.weightKg.toLocaleString('pt-BR')} kg</strong></Col>}
                        {order.cargo.volumeM3 != null && <Col xs={6} md={3}><small className="text-muted d-block">Volume</small><strong className="small">{order.cargo.volumeM3.toLocaleString('pt-BR')} m³</strong></Col>}
                        {order.cargo['valueR$'] != null && <Col xs={6} md={3}><small className="text-muted d-block">Valor</small><strong className="small">{fmtCurrency(order.cargo['valueR$'])}</strong></Col>}
                        {order.cargo.nfNumbers?.length > 0 && <Col xs={12} md={6}><small className="text-muted d-block">NFs</small><strong className="small">{order.cargo.nfNumbers.join(', ')}</strong></Col>}
                        <Col xs={6} md={3}>
                          {order.cargo.requiresRefrigeration && <Badge bg="info" className="me-1">Refrigerado</Badge>}
                          {order.cargo.isHazmat && <Badge bg="danger">HAZMAT</Badge>}
                        </Col>
                      </>
                    )}

                    {order.fiscal && (
                      <>
                        <Col xs={12}><hr className="my-1" /><small className="fw-semibold">Fiscal</small></Col>
                        <Col xs={6} md={3}><small className="text-muted d-block">Aprovação requerida</small><strong className="small">{order.fiscal.requiresApproval ? 'Sim' : 'Não'}</strong></Col>
                        {order.fiscal.approvedAt && <Col xs={6} md={3}><small className="text-muted d-block">Aprovado em</small><strong className="small">{fmtDate(order.fiscal.approvedAt)}</strong></Col>}
                        {order.fiscal.blockedReason && <Col xs={12}><Alert variant="warning" className="py-2 small mb-0"><strong>Bloqueio:</strong> {order.fiscal.blockedReason}</Alert></Col>}
                        {fiscalMsg && <Col xs={12}><Alert variant="info" className="py-2 small mb-0">{fiscalMsg}</Alert></Col>}
                      </>
                    )}
                  </Row>
                </Tab>

                {/* ── Ocorrências ── */}
                <Tab eventKey="occ" title={<><AlertTriangle size={13} className="me-1" />Ocorrências ({order.occurrences?.length ?? 0})</>}>
                  {order.occurrences?.length === 0
                    ? <div className="text-center py-4 text-muted"><AlertTriangle size={32} className="mb-2 opacity-25" /><p className="small mb-0">Nenhuma ocorrência registrada.</p></div>
                    : order.occurrences?.map((o, i) => (
                      <div key={i} className={`p-3 mb-2 rounded border border-${sevColor(o.severity)}`}>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <Badge bg={sevColor(o.severity)} className="me-2 text-uppercase" style={{ fontSize: '0.65rem' }}>{o.severity}</Badge>
                            <strong className="small">{OCC_TYPES.find(t => t.value === o.type)?.label ?? o.type}</strong>
                          </div>
                          <small className="text-muted">{fmtDate(o.timestamp)}</small>
                        </div>
                        <p className="small text-muted mb-0 mt-1">{o.description}</p>
                        {o.resolvedAt && <small className="text-success">Resolvido em {fmtDate(o.resolvedAt)}</small>}
                      </div>
                    ))
                  }
                </Tab>

                {/* ── Event Log ── */}
                <Tab eventKey="log" title={<><List size={13} className="me-1" />Event Log ({eventLog.length})</>}>
                  {eventLog.length === 0
                    ? <div className="text-center py-4 text-muted"><Activity size={32} className="mb-2 opacity-25" /><p className="small mb-0">Nenhum evento registrado.</p></div>
                    : (
                      <div style={{ borderLeft: '2px solid #dee2e6', paddingLeft: 16 }}>
                        {eventLog.map((ev, i) => (
                          <div key={i} className="d-flex gap-2 mb-3">
                            <div>
                              <small className="text-muted d-block" style={{ whiteSpace: 'nowrap' }}>{fmtDate(ev.timestamp)}</small>
                              <small className="fw-semibold d-block">{ev.eventType ?? ev.type}</small>
                              {ev.origin && <Badge bg="light" text="dark" className="me-1" style={{ fontSize: '0.65rem' }}>{ev.origin}</Badge>}
                              {ev.note && <small className="text-muted d-block">{ev.note}</small>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  }
                </Tab>
              </Tabs>
            )
          }
        </Modal.Body>
        <Modal.Footer>
          {order && order.fiscal?.requiresApproval && !order.fiscal?.approvedAt && (
            <Button variant="outline-success" size="sm" onClick={handleFiscalApprove} disabled={approvingFiscal}>
              {approvingFiscal ? <Spinner size="sm" /> : <><CheckSquare size={13} className="me-1" />Aprovar Fiscal</>}
            </Button>
          )}
          {order && !['collected', 'cancelled', 'with_divergence'].includes(order.status) && (
            <Button variant="outline-warning" size="sm" onClick={() => setShowOcc(true)}>
              <AlertTriangle size={13} className="me-1" />Ocorrência
            </Button>
          )}
          <Button variant="light" size="sm" onClick={onHide}>Fechar</Button>
        </Modal.Footer>
      </Modal>

      {showOcc && order && (
        <OccurrenceModal
          orderId={order._id}
          show
          onHide={() => setShowOcc(false)}
          onAdded={() => { setShowOcc(false); load(); onRefresh(); }}
        />
      )}
    </>
  );
}

// ─── Modal: Confirmação de Status ─────────────────────────────────────────────

function StatusModal({ target, onHide, onConfirmed }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError]  = useState('');

  const handle = async () => {
    setSaving(true); setError('');
    try {
      await updateCollectionOrderStatus(target.order._id, target.newStatus, {
        note: reason || undefined,
        cancellationReason: target.newStatus === 'cancelled' ? reason : undefined,
      });
      onConfirmed();
    } catch (e) { setError(e?.message ?? 'Erro.'); }
    setSaving(false);
  };

  const STATUS_LABELS = {
    scheduled:       'Agendar Coleta',
    in_transit:      'Iniciar Trânsito',
    on_site:         'Chegou ao Local',
    collecting:      'Iniciando Coleta',
    collected:       'Confirmar Coleta',
    with_divergence: 'Registrar Divergência',
    cancelled:       'Cancelar Ordem',
  };

  return (
    <Modal show onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="fs-6">{STATUS_LABELS[target.newStatus] ?? target.newStatus}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
        <p className="small mb-2">
          Ordem: <strong>{target.order.orderNumber}</strong><br />
          Local: <strong>{target.order.pickupLocation?.razaoSocial}</strong>
        </p>
        {['cancelled', 'with_divergence'].includes(target.newStatus) && (
          <>
            <Form.Label className="small fw-semibold">
              {target.newStatus === 'cancelled' ? 'Motivo do cancelamento' : 'Descrição da divergência'}
            </Form.Label>
            <Form.Control as="textarea" rows={2} size="sm" value={reason} onChange={e => setReason(e.target.value)} />
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" size="sm" onClick={onHide}>Cancelar</Button>
        <Button
          variant={target.newStatus === 'cancelled' ? 'danger' : target.newStatus === 'with_divergence' ? 'warning' : 'primary'}
          size="sm" onClick={handle} disabled={saving}
        >
          {saving ? <Spinner size="sm" /> : 'Confirmar'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// ─── Componente Principal ──────────────────────────────────────────────────────

export default function CollectionOrdersBody() {
  const [orders,  setOrders]  = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState('');
  const [to,   setTo]   = useState('');

  const [showNew,      setShowNew]      = useState(false);
  const [detailId,     setDetailId]     = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, st] = await Promise.allSettled([
        listCollectionOrders({
          status: filterStatus || undefined,
          from:   from ? new Date(from).toISOString() : undefined,
          to:     to   ? new Date(to + 'T23:59:59').toISOString() : undefined,
          limit:  100,
        }),
        getCollectionOrderStats(),
      ]);
      const raw = list.value;
      setOrders(Array.isArray(raw) ? raw : (raw?.items ?? []));
      setStats(st.value ?? null);
    } catch {}
    setLoading(false);
  }, [filterStatus, from, to]);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter(o => {
    if (!search) return true;
    const txt = [o.orderNumber, o.pickupLocation?.razaoSocial, o.pickupLocation?.city, o.status].filter(Boolean).join(' ').toLowerCase();
    return txt.includes(search.toLowerCase());
  });

  return (
    <div className="fm-body">
      <SimpleBar className="nicescroll-bar">
        <div className="container-fluid px-4 py-4">

          {/* Header */}
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h4 className="fw-bold mb-0">Ordens de Coleta</h4>
              <small className="text-muted">Gestão do fluxo de coletas e ocorrências</small>
            </div>
            <Button variant="primary" size="sm" onClick={() => setShowNew(true)}>
              <Plus size={15} className="me-1" />Nova Ordem
            </Button>
          </div>

          {/* KPIs */}
          <Row className="g-3 mb-4">
            <Col xs={6} md={3}>
              <KpiCard label="Total"           value={stats?.total ?? orders.length}                  color="secondary" icon={<Package size={18} />} />
            </Col>
            <Col xs={6} md={3}>
              <KpiCard label="Agendadas"       value={stats?.byStatus?.scheduled ?? orders.filter(o => o.status === 'scheduled').length}      color="info"      icon={<Clock size={18} />} />
            </Col>
            <Col xs={6} md={3}>
              <KpiCard label="Em Trânsito"     value={stats?.byStatus?.in_transit ?? orders.filter(o => ['in_transit','on_site','collecting'].includes(o.status)).length} color="primary" icon={<Truck size={18} />} />
            </Col>
            <Col xs={6} md={3}>
              <KpiCard label="Com Divergência" value={stats?.byStatus?.with_divergence ?? orders.filter(o => o.status === 'with_divergence').length} color="danger"  icon={<AlertCircle size={18} />} />
            </Col>
          </Row>

          {/* Filtros */}
          <Card className="card-border mb-4">
            <Card.Body>
              <Row className="g-2 align-items-end">
                <Col md={4}>
                  <InputGroup size="sm">
                    <InputGroup.Text><Search size={14} /></InputGroup.Text>
                    <Form.Control placeholder="Número, razão social, cidade..." value={search} onChange={e => setSearch(e.target.value)} />
                    {search && <Button variant="light" onClick={() => setSearch('')}><X size={13} /></Button>}
                  </InputGroup>
                </Col>
                <Col md={2}>
                  <Form.Select size="sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">Todos status</option>
                    {Object.entries(STATUS_CFG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
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

          {/* Tabela */}
          <Card className="card-border">
            <Card.Body className="p-0">
              {loading
                ? <div className="text-center py-5"><Spinner /></div>
                : filtered.length === 0
                  ? (
                    <div className="text-center py-5 text-muted">
                      <Package size={40} className="mb-3 opacity-50" />
                      <p className="mb-1">Nenhuma ordem encontrada.</p>
                      <Button variant="primary" size="sm" onClick={() => setShowNew(true)}>
                        <Plus size={14} className="me-1" />Criar primeira ordem
                      </Button>
                    </div>
                  ) : (
                    <SimpleBar>
                      <Table hover className="mb-0 small">
                        <thead className="bg-light">
                          <tr>
                            <th>Número</th>
                            <th>Local de Coleta</th>
                            <th>Cidade/UF</th>
                            <th>Carga</th>
                            <th>Janela</th>
                            <th>Status</th>
                            <th className="text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map(o => (
                            <tr key={o._id}>
                              <td>
                                <div className="fw-semibold">{o.orderNumber}</div>
                                <small className="text-muted">{OPERATION_TYPES.find(t => t.value === o.operationType)?.label?.split(' — ')[0] ?? o.operationType} / {TRANSPORT_TYPES.find(t => t.value === o.transportType)?.label?.split(' — ')[0] ?? o.transportType}</small>
                              </td>
                              <td>
                                <div className="fw-semibold text-truncate" style={{ maxWidth: 180 }}>{o.pickupLocation?.razaoSocial ?? '–'}</div>
                                <small className="text-muted text-truncate d-block" style={{ maxWidth: 180 }}>{o.pickupLocation?.address}</small>
                              </td>
                              <td><small>{o.pickupLocation?.city ?? '–'}{o.pickupLocation?.state ? `/${o.pickupLocation.state}` : ''}</small></td>
                              <td>
                                {o.cargo?.weightKg != null && <small className="d-block">{o.cargo.weightKg.toLocaleString('pt-BR')} kg</small>}
                                {o.cargo?.['valueR$'] != null && <small className="text-muted">{fmtCurrency(o.cargo['valueR$'])}</small>}
                                {(!o.cargo?.weightKg && !o.cargo?.['valueR$']) && <small className="text-muted">–</small>}
                              </td>
                              <td>
                                {o.collectionWindow
                                  ? <small>{fmtDate(o.collectionWindow.start)}<br /><span className="text-muted">até {fmtDate(o.collectionWindow.end)}</span></small>
                                  : <small className="text-muted">–</small>
                                }
                              </td>
                              <td><StatusBadge status={o.status} /></td>
                              <td>
                                <div className="d-flex justify-content-center gap-1">
                                  <Button variant="primary" size="sm" title="Detalhes" onClick={() => setDetailId(o._id)} className="text-white">
                                    <Eye size={13} />
                                  </Button>
                                  {(STATUS_NEXT[o.status] ?? []).slice(0, 2).map(next => (
                                    <Button
                                      key={next}
                                      variant={next === 'cancelled' ? 'danger' : next === 'with_divergence' ? 'warning' : 'success'}
                                      size="sm"
                                      title={STATUS_CFG[next]?.label ?? next}
                                      onClick={() => setStatusTarget({ order: o, newStatus: next })}
                                      className={next !== 'with_divergence' ? 'text-white' : 'text-dark'}
                                    >
                                      {STATUS_CFG[next]?.icon}
                                    </Button>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </SimpleBar>
                  )
              }
            </Card.Body>
          </Card>

        </div>
      </SimpleBar>

      {/* Modais */}
      <NewOrderModal show={showNew} onHide={() => setShowNew(false)} onCreated={() => { setShowNew(false); load(); }} />

      {detailId && (
        <DetailModal
          orderId={detailId}
          show
          onHide={() => setDetailId(null)}
          onRefresh={load}
        />
      )}

      {statusTarget && (
        <StatusModal
          target={statusTarget}
          onHide={() => setStatusTarget(null)}
          onConfirmed={() => { setStatusTarget(null); load(); }}
        />
      )}
    </div>
  );
}
