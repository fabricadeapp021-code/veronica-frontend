'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Card, Badge, Table, Button, Form, InputGroup, Row, Col, Modal,
  Spinner, Alert, Tabs, Tab,
} from 'react-bootstrap';
import {
  Search, Truck, Clock, CheckCircle, AlertTriangle, DollarSign,
  Plus, X, Eye, ChevronRight, Package, FileText, XCircle,
  Navigation, List, Activity,
} from 'react-feather';
import SimpleBar from 'simplebar-react';
import {
  getFreteStats,
  listFretes,
  getFrete,
  createFrete,
  updateFreteStatus,
  addFreteOccurrence,
  getFreteEventLog,
} from '@/lib/api/services/fretes';
import { listCollectionOrders } from '@/lib/api/services/collectionOrders';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '–';

const fmtCurrency = (val) =>
  val != null ? `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '–';

// ─── Enums ────────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  draft:      { bg: 'secondary', label: 'Rascunho',     icon: <FileText size={11} /> },
  confirmed:  { bg: 'info',      label: 'Confirmado',   icon: <CheckCircle size={11} /> },
  dispatched: { bg: 'primary',   label: 'Despachado',   icon: <Navigation size={11} /> },
  in_transit: { bg: 'warning',   label: 'Em Trânsito',  icon: <Truck size={11} />, textDark: true },
  delivered:  { bg: 'success',   label: 'Entregue',     icon: <CheckCircle size={11} /> },
  invoiced:   { bg: 'success',   label: 'Faturado',     icon: <DollarSign size={11} /> },
  cancelled:  { bg: 'dark',      label: 'Cancelado',    icon: <XCircle size={11} /> },
};

const STATUS_NEXT = {
  draft:      ['confirmed', 'cancelled'],
  confirmed:  ['dispatched', 'cancelled'],
  dispatched: ['in_transit', 'cancelled'],
  in_transit: ['delivered', 'cancelled'],
  delivered:  ['invoiced'],
};

const PAYMENT_CFG = {
  pending:   { bg: 'warning', label: 'Pendente',   textDark: true },
  paid:      { bg: 'success', label: 'Pago' },
  overdue:   { bg: 'danger',  label: 'Vencido' },
  cancelled: { bg: 'secondary', label: 'Cancelado' },
};

const MODALITIES = [
  { value: 'spot',       label: 'Spot (avulso)' },
  { value: 'contracted', label: 'Contratado' },
  { value: 'table',      label: 'Tabela de preços' },
];

const OCC_TYPES = [
  { value: 'damage',       label: 'Avaria' },
  { value: 'loss',         label: 'Extravio' },
  { value: 'delay',        label: 'Atraso' },
  { value: 'shortage',     label: 'Falta de volume' },
  { value: 'wrong_address',label: 'Endereço incorreto' },
  { value: 'fiscal_block', label: 'Bloqueio fiscal' },
  { value: 'other',        label: 'Outros' },
];

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.draft;
  return (
    <Badge bg={cfg.bg} text={cfg.textDark ? 'dark' : undefined} className="d-inline-flex align-items-center gap-1">
      {cfg.icon} {cfg.label}
    </Badge>
  );
}

function PaymentBadge({ status }) {
  const cfg = PAYMENT_CFG[status] ?? PAYMENT_CFG.pending;
  return (
    <Badge bg={cfg.bg} text={cfg.textDark ? 'dark' : undefined} style={{ fontSize: '0.7rem' }}>
      {cfg.label}
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

// ─── Modal: Novo Frete ────────────────────────────────────────────────────────

function NewFreteModal({ show, onHide, onCreated }) {
  const EMPTY = {
    // Remetente
    remRazaoSocial: '', remCnpj: '', remAddress: '', remCity: '', remState: '', remZip: '',
    // Destinatário
    destRazaoSocial: '', destCnpj: '', destAddress: '', destCity: '', destState: '', destZip: '',
    // Carga
    cargoDesc: '', cargoWeightKg: '', cargoVolumeM3: '', cargoValueR$: '', nfNumbers: '',
    requiresRefrigeration: false, isHazmat: false,
    // Precificação
    modality: 'spot', baseRate: '', adValorem: '', gris: '', tolls: '', totalFreight: '',
    // Datas
    expectedPickupDate: '', expectedDeliveryDate: '',
    // Ordens de coleta vinculadas
    collectionOrderIds: [],
    notes: '',
  };

  const [form, setForm] = useState(EMPTY);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!show) return;
    listCollectionOrders({ status: 'collected', limit: 100 })
      .then(r => setAvailableOrders(Array.isArray(r) ? r : (r?.items ?? [])))
      .catch(() => {});
  }, [show]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleOrder = (id) => setForm(f => ({
    ...f,
    collectionOrderIds: f.collectionOrderIds.includes(id)
      ? f.collectionOrderIds.filter(x => x !== id)
      : [...f.collectionOrderIds, id],
  }));

  const handleCreate = async () => {
    if (!form.remRazaoSocial || !form.remAddress || !form.destRazaoSocial || !form.destAddress) {
      setError('Preencha os dados de remetente e destinatário.');
      return;
    }
    setSaving(true); setError('');
    try {
      const p = form.totalFreight ? parseFloat(form.totalFreight) : undefined;
      await createFrete({
        remetente: {
          razaoSocial: form.remRazaoSocial,
          cnpj:    form.remCnpj || undefined,
          address: form.remAddress,
          city:    form.remCity || undefined,
          state:   form.remState || undefined,
          zipCode: form.remZip || undefined,
        },
        destinatario: {
          razaoSocial: form.destRazaoSocial,
          cnpj:    form.destCnpj || undefined,
          address: form.destAddress,
          city:    form.destCity || undefined,
          state:   form.destState || undefined,
          zipCode: form.destZip || undefined,
        },
        cargo: {
          description:          form.cargoDesc || undefined,
          weightKg:             form.cargoWeightKg ? parseFloat(form.cargoWeightKg) : undefined,
          volumeM3:             form.cargoVolumeM3 ? parseFloat(form.cargoVolumeM3) : undefined,
          'valueR$':            form['cargoValueR$'] ? parseFloat(form['cargoValueR$']) : undefined,
          nfNumbers:            form.nfNumbers ? form.nfNumbers.split(',').map(s => s.trim()).filter(Boolean) : undefined,
          requiresRefrigeration: form.requiresRefrigeration || undefined,
          isHazmat:             form.isHazmat || undefined,
        },
        pricing: {
          modality:       form.modality,
          baseRateBRL:    form.baseRate     ? parseFloat(form.baseRate)    : undefined,
          adValoremPct:   form.adValorem    ? parseFloat(form.adValorem)   : undefined,
          grisPct:        form.gris         ? parseFloat(form.gris)        : undefined,
          tollsBRL:       form.tolls        ? parseFloat(form.tolls)       : undefined,
          totalFreightBRL: p,
        },
        collectionOrderIds:  form.collectionOrderIds.length ? form.collectionOrderIds : undefined,
        expectedPickupDate:  form.expectedPickupDate || undefined,
        expectedDeliveryDate: form.expectedDeliveryDate || undefined,
        notes: form.notes || undefined,
      });
      setForm(EMPTY);
      onCreated();
    } catch (e) {
      setError(e?.message ?? 'Erro ao criar frete.');
    }
    setSaving(false);
  };

  const handleClose = () => { setForm(EMPTY); setError(''); onHide(); };

  return (
    <Modal show={show} onHide={handleClose} centered size="xl">
      <Modal.Header closeButton>
        <Modal.Title className="fs-6 text-dark">
          <Truck size={16} className="me-2 text-primary" />Novo Frete
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
        <Row className="g-3">

          {/* Remetente */}
          <Col xs={12}><small className="fw-semibold text-muted">Remetente (Origem)</small></Col>
          <Col md={5}>
            <Form.Label className="small fw-semibold">Razão Social *</Form.Label>
            <Form.Control size="sm" value={form.remRazaoSocial} onChange={e => set('remRazaoSocial', e.target.value)} />
          </Col>
          <Col md={3}>
            <Form.Label className="small fw-semibold">CNPJ</Form.Label>
            <Form.Control size="sm" value={form.remCnpj} onChange={e => set('remCnpj', e.target.value)} placeholder="00.000.000/0001-00" />
          </Col>
          <Col md={4}>
            <Form.Label className="small fw-semibold">Endereço *</Form.Label>
            <Form.Control size="sm" value={form.remAddress} onChange={e => set('remAddress', e.target.value)} />
          </Col>
          <Col md={4}>
            <Form.Label className="small fw-semibold">Cidade</Form.Label>
            <Form.Control size="sm" value={form.remCity} onChange={e => set('remCity', e.target.value)} />
          </Col>
          <Col md={1}>
            <Form.Label className="small fw-semibold">UF</Form.Label>
            <Form.Control size="sm" maxLength={2} value={form.remState} onChange={e => set('remState', e.target.value.toUpperCase())} />
          </Col>
          <Col md={2}>
            <Form.Label className="small fw-semibold">CEP</Form.Label>
            <Form.Control size="sm" value={form.remZip} onChange={e => set('remZip', e.target.value)} />
          </Col>

          {/* Destinatário */}
          <Col xs={12}><hr className="my-1" /><small className="fw-semibold text-muted">Destinatário (Destino)</small></Col>
          <Col md={5}>
            <Form.Label className="small fw-semibold">Razão Social *</Form.Label>
            <Form.Control size="sm" value={form.destRazaoSocial} onChange={e => set('destRazaoSocial', e.target.value)} />
          </Col>
          <Col md={3}>
            <Form.Label className="small fw-semibold">CNPJ</Form.Label>
            <Form.Control size="sm" value={form.destCnpj} onChange={e => set('destCnpj', e.target.value)} placeholder="00.000.000/0001-00" />
          </Col>
          <Col md={4}>
            <Form.Label className="small fw-semibold">Endereço *</Form.Label>
            <Form.Control size="sm" value={form.destAddress} onChange={e => set('destAddress', e.target.value)} />
          </Col>
          <Col md={4}>
            <Form.Label className="small fw-semibold">Cidade</Form.Label>
            <Form.Control size="sm" value={form.destCity} onChange={e => set('destCity', e.target.value)} />
          </Col>
          <Col md={1}>
            <Form.Label className="small fw-semibold">UF</Form.Label>
            <Form.Control size="sm" maxLength={2} value={form.destState} onChange={e => set('destState', e.target.value.toUpperCase())} />
          </Col>
          <Col md={2}>
            <Form.Label className="small fw-semibold">CEP</Form.Label>
            <Form.Control size="sm" value={form.destZip} onChange={e => set('destZip', e.target.value)} />
          </Col>

          {/* Carga */}
          <Col xs={12}><hr className="my-1" /><small className="fw-semibold text-muted">Carga</small></Col>
          <Col md={4}>
            <Form.Label className="small fw-semibold">Descrição</Form.Label>
            <Form.Control size="sm" value={form.cargoDesc} onChange={e => set('cargoDesc', e.target.value)} />
          </Col>
          <Col md={2}>
            <Form.Label className="small fw-semibold">Peso (kg)</Form.Label>
            <Form.Control size="sm" type="number" min="0" value={form.cargoWeightKg} onChange={e => set('cargoWeightKg', e.target.value)} />
          </Col>
          <Col md={2}>
            <Form.Label className="small fw-semibold">Volume (m³)</Form.Label>
            <Form.Control size="sm" type="number" min="0" value={form.cargoVolumeM3} onChange={e => set('cargoVolumeM3', e.target.value)} />
          </Col>
          <Col md={2}>
            <Form.Label className="small fw-semibold">Valor (R$)</Form.Label>
            <Form.Control size="sm" type="number" min="0" value={form['cargoValueR$']} onChange={e => set('cargoValueR$', e.target.value)} />
          </Col>
          <Col md={2}>
            <Form.Label className="small fw-semibold">NFs (vírgula)</Form.Label>
            <Form.Control size="sm" value={form.nfNumbers} onChange={e => set('nfNumbers', e.target.value)} placeholder="12345, 12346" />
          </Col>
          <Col md={3}>
            <Form.Check label="Refrigerado" checked={form.requiresRefrigeration} onChange={e => set('requiresRefrigeration', e.target.checked)} className="small mt-2" />
          </Col>
          <Col md={3}>
            <Form.Check label="HAZMAT" checked={form.isHazmat} onChange={e => set('isHazmat', e.target.checked)} className="small mt-2" />
          </Col>

          {/* Precificação */}
          <Col xs={12}><hr className="my-1" /><small className="fw-semibold text-muted">Precificação do Frete</small></Col>
          <Col md={3}>
            <Form.Label className="small fw-semibold">Modalidade</Form.Label>
            <Form.Select size="sm" value={form.modality} onChange={e => set('modality', e.target.value)}>
              {MODALITIES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </Form.Select>
          </Col>
          <Col md={2}>
            <Form.Label className="small fw-semibold">Frete base (R$)</Form.Label>
            <Form.Control size="sm" type="number" min="0" value={form.baseRate} onChange={e => set('baseRate', e.target.value)} />
          </Col>
          <Col md={2}>
            <Form.Label className="small fw-semibold">Ad valorem (%)</Form.Label>
            <Form.Control size="sm" type="number" min="0" step="0.01" value={form.adValorem} onChange={e => set('adValorem', e.target.value)} />
          </Col>
          <Col md={2}>
            <Form.Label className="small fw-semibold">GRIS (%)</Form.Label>
            <Form.Control size="sm" type="number" min="0" step="0.01" value={form.gris} onChange={e => set('gris', e.target.value)} />
          </Col>
          <Col md={2}>
            <Form.Label className="small fw-semibold">Pedágios (R$)</Form.Label>
            <Form.Control size="sm" type="number" min="0" value={form.tolls} onChange={e => set('tolls', e.target.value)} />
          </Col>
          <Col md={1}>
            <Form.Label className="small fw-semibold">Total (R$)</Form.Label>
            <Form.Control size="sm" type="number" min="0" value={form.totalFreight} onChange={e => set('totalFreight', e.target.value)} className="fw-semibold" />
          </Col>

          {/* Datas */}
          <Col xs={12}><hr className="my-1" /><small className="fw-semibold text-muted">Datas</small></Col>
          <Col md={3}>
            <Form.Label className="small fw-semibold">Coleta prevista</Form.Label>
            <Form.Control size="sm" type="datetime-local" value={form.expectedPickupDate} onChange={e => set('expectedPickupDate', e.target.value)} />
          </Col>
          <Col md={3}>
            <Form.Label className="small fw-semibold">Entrega prevista</Form.Label>
            <Form.Control size="sm" type="datetime-local" value={form.expectedDeliveryDate} onChange={e => set('expectedDeliveryDate', e.target.value)} />
          </Col>

          {/* Ordens de coleta */}
          {availableOrders.length > 0 && (
            <>
              <Col xs={12}><hr className="my-1" /><small className="fw-semibold text-muted">Vincular Ordens de Coleta (coletadas)</small></Col>
              <Col xs={12}>
                <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: 6, padding: 8 }}>
                  {availableOrders.map(o => (
                    <Form.Check
                      key={o._id}
                      type="checkbox"
                      label={`${o.orderNumber} — ${o.pickupLocation?.razaoSocial} (${o.pickupLocation?.city ?? ''})`}
                      checked={form.collectionOrderIds.includes(o._id)}
                      onChange={() => toggleOrder(o._id)}
                      className="small mb-1"
                    />
                  ))}
                </div>
              </Col>
            </>
          )}

          {/* Observações */}
          <Col xs={12}><hr className="my-1" /></Col>
          <Col xs={12}>
            <Form.Label className="small fw-semibold">Observações</Form.Label>
            <Form.Control as="textarea" rows={2} size="sm" value={form.notes} onChange={e => set('notes', e.target.value)} />
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" size="sm" onClick={handleClose}>Cancelar</Button>
        <Button variant="primary" size="sm" onClick={handleCreate} disabled={saving}>
          {saving ? <Spinner size="sm" /> : <><Plus size={14} className="me-1" />Criar Frete</>}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// ─── Modal: Ocorrência ────────────────────────────────────────────────────────

function OccurrenceModal({ freteId, show, onHide, onAdded }) {
  const [form, setForm] = useState({ type: 'delay', description: '', severity: 'low' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handle = async () => {
    if (!form.description.trim()) { setError('Descreva a ocorrência.'); return; }
    setSaving(true); setError('');
    try {
      await addFreteOccurrence(freteId, form);
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
        <Form.Label className="small fw-semibold">Severidade</Form.Label>
        <Form.Select size="sm" className="mb-2" value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
          <option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option>
        </Form.Select>
        <Form.Label className="small fw-semibold">Descrição *</Form.Label>
        <Form.Control as="textarea" rows={3} size="sm" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" size="sm" onClick={onHide}>Cancelar</Button>
        <Button variant="warning" size="sm" onClick={handle} disabled={saving}>{saving ? <Spinner size="sm" /> : 'Registrar'}</Button>
      </Modal.Footer>
    </Modal>
  );
}

// ─── Modal: Detalhes ──────────────────────────────────────────────────────────

function DetailModal({ freteId, show, onHide, onRefresh }) {
  const [frete,    setFrete]    = useState(null);
  const [eventLog, setEventLog] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('info');
  const [showOcc,  setShowOcc]  = useState(false);

  const load = useCallback(async () => {
    if (!freteId) return;
    setLoading(true);
    try {
      const [f, log] = await Promise.allSettled([
        getFrete(freteId),
        getFreteEventLog(freteId),
      ]);
      setFrete(f.value ?? null);
      setEventLog(Array.isArray(log.value) ? log.value : []);
    } catch {}
    setLoading(false);
  }, [freteId]);

  useEffect(() => { if (show) load(); }, [show, load]);

  const sevColor = (s) => s === 'high' ? 'danger' : s === 'medium' ? 'warning' : 'secondary';

  return (
    <>
      <Modal show={show} onHide={onHide} centered size="xl">
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 text-dark">
            <Truck size={15} className="me-2 text-primary" />
            {frete ? `${frete.freteNumber}` : 'Detalhes do Frete'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loading
            ? <div className="text-center py-4"><Spinner /></div>
            : frete && (
              <Tabs activeKey={tab} onSelect={k => setTab(k)} className="mb-3">

                <Tab eventKey="info" title={<><FileText size={13} className="me-1" />Informações</>}>
                  <Row className="g-3">
                    <Col xs={6} md={3}><small className="text-muted d-block">Número</small><strong className="small">{frete.freteNumber}</strong></Col>
                    <Col xs={6} md={3}><small className="text-muted d-block">Status</small><StatusBadge status={frete.status} /></Col>
                    <Col xs={6} md={3}><small className="text-muted d-block">Pagamento</small><PaymentBadge status={frete.paymentStatus} /></Col>
                    {frete.pricing?.totalFreightBRL != null && (
                      <Col xs={6} md={3}><small className="text-muted d-block">Valor do Frete</small><strong className="small text-success">{fmtCurrency(frete.pricing.totalFreightBRL)}</strong></Col>
                    )}

                    <Col xs={12}><hr className="my-1" /><small className="fw-semibold">Remetente → Destinatário</small></Col>
                    <Col xs={12} md={6}>
                      <small className="text-muted d-block">Remetente</small>
                      <strong className="small">{frete.remetente?.razaoSocial}</strong>
                      <small className="text-muted d-block">{frete.remetente?.address}{frete.remetente?.city ? ` — ${frete.remetente.city}/${frete.remetente.state}` : ''}</small>
                    </Col>
                    <Col xs={12} md={6}>
                      <small className="text-muted d-block">Destinatário</small>
                      <strong className="small">{frete.destinatario?.razaoSocial}</strong>
                      <small className="text-muted d-block">{frete.destinatario?.address}{frete.destinatario?.city ? ` — ${frete.destinatario.city}/${frete.destinatario.state}` : ''}</small>
                    </Col>

                    {frete.cargo && (
                      <>
                        <Col xs={12}><hr className="my-1" /><small className="fw-semibold">Carga</small></Col>
                        {frete.cargo.description && <Col xs={12} md={4}><small className="text-muted d-block">Descrição</small><strong className="small">{frete.cargo.description}</strong></Col>}
                        {frete.cargo.weightKg   != null && <Col xs={6} md={2}><small className="text-muted d-block">Peso</small><strong className="small">{frete.cargo.weightKg.toLocaleString('pt-BR')} kg</strong></Col>}
                        {frete.cargo.volumeM3   != null && <Col xs={6} md={2}><small className="text-muted d-block">Volume</small><strong className="small">{frete.cargo.volumeM3.toLocaleString('pt-BR')} m³</strong></Col>}
                        {frete.cargo['valueR$'] != null && <Col xs={6} md={2}><small className="text-muted d-block">Valor</small><strong className="small">{fmtCurrency(frete.cargo['valueR$'])}</strong></Col>}
                        {frete.cargo.nfNumbers?.length > 0 && <Col xs={12} md={4}><small className="text-muted d-block">NFs</small><strong className="small">{frete.cargo.nfNumbers.join(', ')}</strong></Col>}
                      </>
                    )}

                    {frete.pricing && (
                      <>
                        <Col xs={12}><hr className="my-1" /><small className="fw-semibold">Precificação</small></Col>
                        <Col xs={6} md={2}><small className="text-muted d-block">Modalidade</small><strong className="small">{MODALITIES.find(m => m.value === frete.pricing.modality)?.label ?? frete.pricing.modality}</strong></Col>
                        {frete.pricing.baseRateBRL   != null && <Col xs={6} md={2}><small className="text-muted d-block">Base</small><strong className="small">{fmtCurrency(frete.pricing.baseRateBRL)}</strong></Col>}
                        {frete.pricing.adValoremPct  != null && <Col xs={6} md={2}><small className="text-muted d-block">Ad Valorem</small><strong className="small">{frete.pricing.adValoremPct}%</strong></Col>}
                        {frete.pricing.grisPct       != null && <Col xs={6} md={2}><small className="text-muted d-block">GRIS</small><strong className="small">{frete.pricing.grisPct}%</strong></Col>}
                        {frete.pricing.tollsBRL      != null && <Col xs={6} md={2}><small className="text-muted d-block">Pedágios</small><strong className="small">{fmtCurrency(frete.pricing.tollsBRL)}</strong></Col>}
                        {frete.pricing.totalFreightBRL != null && <Col xs={6} md={2}><small className="text-muted d-block fw-semibold text-success">Total</small><strong className="small text-success">{fmtCurrency(frete.pricing.totalFreightBRL)}</strong></Col>}
                      </>
                    )}

                    {frete.collectionOrderIds?.length > 0 && (
                      <>
                        <Col xs={12}><hr className="my-1" /><small className="fw-semibold">Ordens de Coleta vinculadas ({frete.collectionOrderIds.length})</small></Col>
                        <Col xs={12}><small className="text-muted">{frete.collectionOrderIds.join(', ')}</small></Col>
                      </>
                    )}

                    {(frete.expectedPickupDate || frete.expectedDeliveryDate) && (
                      <>
                        <Col xs={12}><hr className="my-1" /><small className="fw-semibold">Datas</small></Col>
                        {frete.expectedPickupDate   && <Col xs={6} md={3}><small className="text-muted d-block">Coleta prevista</small><strong className="small">{fmtDate(frete.expectedPickupDate)}</strong></Col>}
                        {frete.actualPickupDate     && <Col xs={6} md={3}><small className="text-muted d-block">Coleta real</small><strong className="small text-success">{fmtDate(frete.actualPickupDate)}</strong></Col>}
                        {frete.expectedDeliveryDate && <Col xs={6} md={3}><small className="text-muted d-block">Entrega prevista</small><strong className="small">{fmtDate(frete.expectedDeliveryDate)}</strong></Col>}
                        {frete.actualDeliveryDate   && <Col xs={6} md={3}><small className="text-muted d-block">Entrega real</small><strong className="small text-success">{fmtDate(frete.actualDeliveryDate)}</strong></Col>}
                      </>
                    )}
                  </Row>
                </Tab>

                <Tab eventKey="occ" title={<><AlertTriangle size={13} className="me-1" />Ocorrências ({frete.occurrences?.length ?? 0})</>}>
                  {frete.occurrences?.length === 0
                    ? <div className="text-center py-4 text-muted"><AlertTriangle size={32} className="mb-2 opacity-25" /><p className="small mb-0">Nenhuma ocorrência.</p></div>
                    : frete.occurrences?.map((o, i) => (
                      <div key={i} className={`p-3 mb-2 rounded border border-${sevColor(o.severity)}`}>
                        <div className="d-flex justify-content-between">
                          <div>
                            <Badge bg={sevColor(o.severity)} className="me-2 text-uppercase" style={{ fontSize: '0.65rem' }}>{o.severity}</Badge>
                            <strong className="small">{OCC_TYPES.find(t => t.value === o.type)?.label ?? o.type}</strong>
                          </div>
                          <small className="text-muted">{fmtDate(o.timestamp)}</small>
                        </div>
                        <p className="small text-muted mb-0 mt-1">{o.description}</p>
                      </div>
                    ))
                  }
                </Tab>

                <Tab eventKey="log" title={<><List size={13} className="me-1" />Event Log ({eventLog.length})</>}>
                  {eventLog.length === 0
                    ? <div className="text-center py-4 text-muted"><Activity size={32} className="mb-2 opacity-25" /><p className="small mb-0">Nenhum evento.</p></div>
                    : (
                      <div style={{ borderLeft: '2px solid #dee2e6', paddingLeft: 16 }}>
                        {eventLog.map((ev, i) => (
                          <div key={i} className="d-flex gap-2 mb-3">
                            <div>
                              <small className="text-muted d-block">{fmtDate(ev.timestamp)}</small>
                              <small className="fw-semibold d-block">{ev.eventType ?? ev.type}</small>
                              {ev.origin && <Badge bg="light" text="dark" className="me-1" style={{ fontSize: '0.65rem' }}>{ev.origin}</Badge>}
                              {ev.metadata?.note && <small className="text-muted d-block">{ev.metadata.note}</small>}
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
          {frete && !['delivered', 'invoiced', 'cancelled'].includes(frete.status) && (
            <Button variant="outline-warning" size="sm" onClick={() => setShowOcc(true)}>
              <AlertTriangle size={13} className="me-1" />Ocorrência
            </Button>
          )}
          <Button variant="light" size="sm" onClick={onHide}>Fechar</Button>
        </Modal.Footer>
      </Modal>

      {showOcc && frete && (
        <OccurrenceModal
          freteId={frete._id}
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
      await updateFreteStatus(target.frete._id, target.newStatus, {
        note: reason || undefined,
        cancellationReason: target.newStatus === 'cancelled' ? reason : undefined,
      });
      onConfirmed();
    } catch (e) { setError(e?.message ?? 'Erro.'); }
    setSaving(false);
  };

  const LABELS = {
    confirmed:  'Confirmar Frete',
    dispatched: 'Despachar',
    in_transit: 'Iniciar Trânsito',
    delivered:  'Confirmar Entrega',
    invoiced:   'Faturar',
    cancelled:  'Cancelar Frete',
  };

  return (
    <Modal show onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="fs-6">{LABELS[target.newStatus] ?? target.newStatus}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
        <p className="small mb-2">Frete: <strong>{target.frete.freteNumber}</strong></p>
        {target.newStatus === 'cancelled' && (
          <>
            <Form.Label className="small fw-semibold">Motivo do cancelamento</Form.Label>
            <Form.Control as="textarea" rows={2} size="sm" value={reason} onChange={e => setReason(e.target.value)} />
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" size="sm" onClick={onHide}>Cancelar</Button>
        <Button
          variant={target.newStatus === 'cancelled' ? 'danger' : 'primary'}
          size="sm" onClick={handle} disabled={saving}
        >
          {saving ? <Spinner size="sm" /> : 'Confirmar'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// ─── Componente Principal ──────────────────────────────────────────────────────

export default function FretesBody() {
  const [fretes,  setFretes]  = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to,   setTo]   = useState('');

  const [showNew,      setShowNew]      = useState(false);
  const [detailId,     setDetailId]     = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, st] = await Promise.allSettled([
        listFretes({
          status: filterStatus || undefined,
          from:   from ? new Date(from).toISOString() : undefined,
          to:     to   ? new Date(to + 'T23:59:59').toISOString() : undefined,
          limit:  100,
        }),
        getFreteStats(),
      ]);
      const raw = list.value;
      setFretes(Array.isArray(raw) ? raw : (raw?.items ?? []));
      setStats(st.value ?? null);
    } catch {}
    setLoading(false);
  }, [filterStatus, from, to]);

  useEffect(() => { load(); }, [load]);

  const filtered = fretes.filter(f => {
    if (!search) return true;
    const txt = [f.freteNumber, f.remetente?.razaoSocial, f.destinatario?.razaoSocial, f.remetente?.city, f.destinatario?.city].filter(Boolean).join(' ').toLowerCase();
    return txt.includes(search.toLowerCase());
  });

  return (
    <div className="fm-body">
      <SimpleBar className="nicescroll-bar">
        <div className="container-fluid px-4 py-4">

          {/* Header */}
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h4 className="fw-bold mb-0">Fretes</h4>
              <small className="text-muted">Contratos de transporte — remetente → destinatário</small>
            </div>
            <Button variant="primary" size="sm" onClick={() => setShowNew(true)}>
              <Plus size={15} className="me-1" />Novo Frete
            </Button>
          </div>

          {/* KPIs */}
          <Row className="g-3 mb-4">
            <Col xs={6} md={3}>
              <KpiCard label="Total"           value={stats?.total ?? fretes.length}                         color="secondary" icon={<Truck size={18} />} />
            </Col>
            <Col xs={6} md={3}>
              <KpiCard label="Em Trânsito"     value={stats?.byStatus?.in_transit ?? fretes.filter(f => f.status === 'in_transit').length} color="warning" icon={<Navigation size={18} />} />
            </Col>
            <Col xs={6} md={3}>
              <KpiCard label="Entregues"       value={stats?.byStatus?.delivered ?? fretes.filter(f => f.status === 'delivered').length}   color="success" icon={<CheckCircle size={18} />} />
            </Col>
            <Col xs={6} md={3}>
              <KpiCard label="Pgto. Pendente"  value={stats?.pendingPayment ?? fretes.filter(f => f.paymentStatus === 'pending' && ['delivered','invoiced'].includes(f.status)).length} color="danger" icon={<DollarSign size={18} />} />
            </Col>
          </Row>

          {/* Filtros */}
          <Card className="card-border mb-4">
            <Card.Body>
              <Row className="g-2 align-items-end">
                <Col md={4}>
                  <InputGroup size="sm">
                    <InputGroup.Text><Search size={14} /></InputGroup.Text>
                    <Form.Control placeholder="Número, remetente, destinatário..." value={search} onChange={e => setSearch(e.target.value)} />
                    {search && <Button variant="light" onClick={() => setSearch('')}><X size={13} /></Button>}
                  </InputGroup>
                </Col>
                <Col md={2}>
                  <Form.Select size="sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">Todos status</option>
                    {Object.entries(STATUS_CFG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                  </Form.Select>
                </Col>
                <Col md={2}><Form.Control size="sm" type="date" value={from} onChange={e => setFrom(e.target.value)} /></Col>
                <Col md={2}><Form.Control size="sm" type="date" value={to}   onChange={e => setTo(e.target.value)} /></Col>
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
                      <Truck size={40} className="mb-3 opacity-50" />
                      <p className="mb-1">Nenhum frete encontrado.</p>
                      <Button variant="primary" size="sm" onClick={() => setShowNew(true)}>
                        <Plus size={14} className="me-1" />Criar primeiro frete
                      </Button>
                    </div>
                  ) : (
                    <SimpleBar>
                      <Table hover className="mb-0 small">
                        <thead className="bg-light">
                          <tr>
                            <th>Número</th>
                            <th>Remetente <ChevronRight size={11} /> Destinatário</th>
                            <th>Carga</th>
                            <th>Valor do Frete</th>
                            <th>Entrega Prev.</th>
                            <th>Status</th>
                            <th>Pagamento</th>
                            <th className="text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map(f => (
                            <tr key={f._id}>
                              <td><div className="fw-semibold">{f.freteNumber}</div></td>
                              <td>
                                <div className="small fw-semibold text-truncate" style={{ maxWidth: 200 }}>
                                  <span className="text-muted">DE</span> {f.remetente?.razaoSocial}
                                </div>
                                <div className="small text-muted text-truncate" style={{ maxWidth: 200 }}>
                                  <span>PARA</span> {f.destinatario?.razaoSocial}
                                </div>
                              </td>
                              <td>
                                {f.cargo?.weightKg != null && <small className="d-block">{f.cargo.weightKg.toLocaleString('pt-BR')} kg</small>}
                                {f.cargo?.['valueR$'] != null && <small className="text-muted">{fmtCurrency(f.cargo['valueR$'])}</small>}
                                {(!f.cargo?.weightKg && !f.cargo?.['valueR$']) && <small className="text-muted">–</small>}
                              </td>
                              <td><strong className="small text-success">{f.pricing?.totalFreightBRL != null ? fmtCurrency(f.pricing.totalFreightBRL) : '–'}</strong></td>
                              <td><small>{fmtDate(f.expectedDeliveryDate)}</small></td>
                              <td><StatusBadge status={f.status} /></td>
                              <td><PaymentBadge status={f.paymentStatus} /></td>
                              <td>
                                <div className="d-flex justify-content-center gap-1">
                                  <Button variant="primary" size="sm" title="Detalhes" onClick={() => setDetailId(f._id)} className="text-white">
                                    <Eye size={13} />
                                  </Button>
                                  {(STATUS_NEXT[f.status] ?? []).slice(0, 2).map(next => (
                                    <Button
                                      key={next}
                                      variant={next === 'cancelled' ? 'danger' : 'success'}
                                      size="sm"
                                      title={STATUS_CFG[next]?.label ?? next}
                                      onClick={() => setStatusTarget({ frete: f, newStatus: next })}
                                      className="text-white"
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

      <NewFreteModal show={showNew} onHide={() => setShowNew(false)} onCreated={() => { setShowNew(false); load(); }} />

      {detailId && (
        <DetailModal freteId={detailId} show onHide={() => setDetailId(null)} onRefresh={load} />
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
