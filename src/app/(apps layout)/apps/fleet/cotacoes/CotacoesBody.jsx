'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Card, Badge, Table, Button, Form, InputGroup, Row, Col, Modal,
  Spinner, Alert, ListGroup,
} from 'react-bootstrap';
import {
  Search, X, Plus, Eye, RefreshCw, CheckCircle, XCircle,
  Send, ArrowRight, DollarSign, FileText, Clock, Truck,
} from 'react-feather';
import SimpleBar from 'simplebar-react';
import {
  getCotacaoStats, listCotacoes, getCotacao,
  createCotacao, updateCotacaoStatus, recalculateCotacao, convertCotacao,
} from '@/lib/api/services/cotacoes';
import { lookupClientes } from '@/lib/api/services/clientes';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtCurrency = (v) =>
  v != null ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '–';

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR') : '–';

const fmtDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '–';

// ─── Enums ────────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  draft:     { bg: 'secondary', label: 'Rascunho',   icon: <FileText size={11} /> },
  sent:      { bg: 'info',      label: 'Enviada',    icon: <Send size={11} /> },
  approved:  { bg: 'success',   label: 'Aprovada',   icon: <CheckCircle size={11} /> },
  rejected:  { bg: 'danger',    label: 'Recusada',   icon: <XCircle size={11} /> },
  expired:   { bg: 'warning',   label: 'Expirada',   icon: <Clock size={11} />, textDark: true },
  converted: { bg: 'primary',   label: 'Convertida', icon: <Truck size={11} /> },
  cancelled: { bg: 'dark',      label: 'Cancelada',  icon: <XCircle size={11} /> },
};

const STATUS_NEXT = {
  draft:    ['sent', 'cancelled'],
  sent:     ['approved', 'rejected', 'expired', 'cancelled'],
  approved: ['converted'],
};

const STATUS_LABELS = {
  sent:      'Enviar ao cliente',
  approved:  'Aprovar',
  rejected:  'Recusar',
  expired:   'Marcar expirada',
  cancelled: 'Cancelar',
};

const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

const MODALITIES = [
  { value: 'FTL',       label: 'FTL — Carga completa' },
  { value: 'LTL',       label: 'LTL — Fracionado' },
  { value: 'dedicated', label: 'Dedicado' },
  { value: 'spot',      label: 'Spot' },
];

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.draft;
  return (
    <Badge bg={cfg.bg} text={cfg.textDark ? 'dark' : undefined}
      className="d-inline-flex align-items-center gap-1">
      {cfg.icon} {cfg.label}
    </Badge>
  );
}

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

// ─── PricingBreakdown ─────────────────────────────────────────────────────────

function PricingBreakdown({ pricing }) {
  if (!pricing) return <p className="text-muted small mb-0">Sem precificação.</p>;
  return (
    <div>
      {pricing.tarifaNumber && (
        <div className="text-muted small mb-2">
          Tarifa: <strong>{pricing.tarifaNumber}</strong>
          {pricing.isManual && <Badge bg="secondary" className="ms-2 small">manual</Badge>}
        </div>
      )}
      <ListGroup variant="flush" className="small">
        {Object.entries(pricing.breakdown ?? {
          'Frete base':  pricing.baseRateBRL,
          'GRIS':        pricing.grisBRL,
          'Ad Valorem':  pricing.adValoremBRL,
          'Pedágios':    pricing.tollsBRL,
          'Sobretaxas':  pricing.surchargesBRL,
        }).filter(([, v]) => v > 0).map(([k, v]) => (
          <ListGroup.Item key={k} className="d-flex justify-content-between px-0 py-1 border-0">
            <span className="text-muted">{k}</span>
            <span>{fmtCurrency(v)}</span>
          </ListGroup.Item>
        ))}
        <ListGroup.Item className="d-flex justify-content-between px-0 pt-2 fw-bold border-top">
          <span>Total</span>
          <span className="text-success fs-6">{fmtCurrency(pricing.totalFreightBRL)}</span>
        </ListGroup.Item>
      </ListGroup>
    </div>
  );
}

// ─── ClienteLookup ────────────────────────────────────────────────────────────

function ClienteLookup({ value, label, onChange }) {
  const [query, setQuery] = useState(label ?? '');
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (query.length < 2) { setOptions([]); return; }
    const t = setTimeout(() => {
      lookupClientes(query).then(r => setOptions(r ?? [])).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const select = (c) => {
    onChange({ id: c._id, label: c.razaoSocial });
    setQuery(c.razaoSocial);
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <Form.Control size="sm" placeholder="Digite para buscar cliente…"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); if (!e.target.value) onChange({ id: '', label: '' }); }}
        onFocus={() => setOpen(true)} />
      {open && options.length > 0 && (
        <div className="border rounded shadow-sm bg-white position-absolute w-100 z-3" style={{ top: '100%', zIndex: 1000 }}>
          {options.map(c => (
            <div key={c._id} className="px-3 py-2 small" style={{ cursor: 'pointer' }}
              onMouseDown={() => select(c)}>
              <div className="fw-medium">{c.razaoSocial}</div>
              {c.cnpj && <div className="text-muted">{c.cnpj}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── NewCotacaoModal ──────────────────────────────────────────────────────────

function NewCotacaoModal({ show, onHide, onCreated }) {
  const empty = {
    cliente: { id: '', label: '' },
    originState: 'SP', originCity: '', originAddress: '',
    destState: 'PR', destCity: '', destAddress: '',
    modality: 'FTL',
    weightKg: '', volumeM3: '', quantity: '', cargoValue: '',
    description: '', packageType: '',
    requestedPickupDate: '', requestedDeliveryDate: '',
    validUntil: '', notes: '',
    autoPrice: true,
  };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [err, setErr]   = useState('');

  useEffect(() => { if (show) { setForm(empty); setErr(''); } }, [show]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.originState || !form.destState) { setErr('UF de origem e destino obrigatórias'); return; }
    setErr(''); setSaving(true);
    try {
      const payload = {
        clienteId:          form.cliente.id   || undefined,
        clienteRazaoSocial: form.cliente.label || undefined,
        origin: {
          state:   form.originState,
          city:    form.originCity   || undefined,
          address: form.originAddress || undefined,
        },
        destination: {
          state:   form.destState,
          city:    form.destCity    || undefined,
          address: form.destAddress || undefined,
        },
        cargo: {
          description:  form.description   || undefined,
          weightKg:     form.weightKg      ? Number(form.weightKg)    : undefined,
          volumeM3:     form.volumeM3      ? Number(form.volumeM3)    : undefined,
          quantity:     form.quantity      ? Number(form.quantity)    : undefined,
          packageType:  form.packageType   || undefined,
          'valueR$':    form.cargoValue    ? Number(form.cargoValue)  : undefined,
        },
        modality:             form.modality   || undefined,
        requestedPickupDate:  form.requestedPickupDate   || undefined,
        requestedDeliveryDate: form.requestedDeliveryDate || undefined,
        validUntil:           form.validUntil || undefined,
        notes:                form.notes      || undefined,
        autoPrice:            form.autoPrice,
      };
      const created = await createCotacao(payload);
      onCreated(created?.data ?? created);
      onHide();
    } catch (e) {
      setErr(e?.message ?? 'Erro ao criar cotação');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Nova Cotação</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <SimpleBar style={{ maxHeight: '72vh' }}>
            {err && <Alert variant="danger" className="py-2">{err}</Alert>}

            <h6 className="text-muted mb-2">Cliente</h6>
            <div className="mb-3">
              <ClienteLookup
                value={form.cliente.id}
                label={form.cliente.label}
                onChange={v => set('cliente', v)} />
            </div>

            <h6 className="text-muted mb-2">Rota</h6>
            <Row className="g-2 mb-3">
              <Col md={2}>
                <Form.Label className="small">Origem (UF) *</Form.Label>
                <Form.Select size="sm" required value={form.originState}
                  onChange={e => set('originState', e.target.value)}>
                  {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label className="small">Cidade origem</Form.Label>
                <Form.Control size="sm" value={form.originCity}
                  onChange={e => set('originCity', e.target.value)} />
              </Col>
              <Col md={2}>
                <Form.Label className="small">Destino (UF) *</Form.Label>
                <Form.Select size="sm" required value={form.destState}
                  onChange={e => set('destState', e.target.value)}>
                  {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label className="small">Cidade destino</Form.Label>
                <Form.Control size="sm" value={form.destCity}
                  onChange={e => set('destCity', e.target.value)} />
              </Col>
              <Col md={3}>
                <Form.Label className="small">Modalidade</Form.Label>
                <Form.Select size="sm" value={form.modality}
                  onChange={e => set('modality', e.target.value)}>
                  {MODALITIES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </Form.Select>
              </Col>
            </Row>

            <h6 className="text-muted mb-2">Carga</h6>
            <Row className="g-2 mb-3">
              <Col md={6}>
                <Form.Control size="sm" placeholder="Descrição da carga"
                  value={form.description} onChange={e => set('description', e.target.value)} />
              </Col>
              <Col md={3}>
                <Form.Control size="sm" type="number" min={0} placeholder="Peso (kg)"
                  value={form.weightKg} onChange={e => set('weightKg', e.target.value)} />
              </Col>
              <Col md={3}>
                <Form.Control size="sm" type="number" min={0} step="0.01" placeholder="Volume (m³)"
                  value={form.volumeM3} onChange={e => set('volumeM3', e.target.value)} />
              </Col>
              <Col md={3}>
                <Form.Control size="sm" type="number" min={0} placeholder="Qtd volumes"
                  value={form.quantity} onChange={e => set('quantity', e.target.value)} />
              </Col>
              <Col md={3}>
                <Form.Control size="sm" placeholder="Tipo embalagem"
                  value={form.packageType} onChange={e => set('packageType', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Control size="sm" type="number" min={0} step="0.01" placeholder="Valor NF (R$)"
                  value={form.cargoValue} onChange={e => set('cargoValue', e.target.value)} />
              </Col>
            </Row>

            <h6 className="text-muted mb-2">Datas</h6>
            <Row className="g-2 mb-3">
              <Col md={4}>
                <Form.Label className="small">Coleta desejada</Form.Label>
                <Form.Control size="sm" type="date" value={form.requestedPickupDate}
                  onChange={e => set('requestedPickupDate', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small">Entrega desejada</Form.Label>
                <Form.Control size="sm" type="date" value={form.requestedDeliveryDate}
                  onChange={e => set('requestedDeliveryDate', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small">Validade da proposta</Form.Label>
                <Form.Control size="sm" type="date" value={form.validUntil}
                  onChange={e => set('validUntil', e.target.value)} />
              </Col>
            </Row>

            <Form.Check type="switch" id="autoPrice" className="mb-2"
              label="Calcular preço automaticamente via tarifas ativas"
              checked={form.autoPrice}
              onChange={e => set('autoPrice', e.target.checked)} />

            <Form.Control as="textarea" rows={2} size="sm" placeholder="Observações…"
              value={form.notes} onChange={e => set('notes', e.target.value)} />
          </SimpleBar>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onHide} disabled={saving}>Cancelar</Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? <Spinner size="sm" /> : 'Criar Cotação'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

// ─── DetailModal ──────────────────────────────────────────────────────────────

function DetailModal({ show, cotacaoId, onHide, onRefresh }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');
  const [showStatus, setShowStatus] = useState(false);
  const [converted, setConverted]   = useState(null);

  const load = useCallback(() => {
    if (!cotacaoId) return;
    setLoading(true);
    getCotacao(cotacaoId).then(setData).finally(() => setLoading(false));
  }, [cotacaoId]);

  useEffect(() => { if (show) { load(); setErr(''); setConverted(null); } }, [show, load]);

  const handleRecalc = async () => {
    setSaving(true); setErr('');
    try { const r = await recalculateCotacao(cotacaoId); setData(r?.data ?? r); onRefresh(); }
    catch (e) { setErr(e?.message ?? 'Erro ao recalcular'); }
    finally { setSaving(false); }
  };

  const handleStatus = async (newStatus, reason) => {
    setSaving(true); setErr('');
    try {
      const r = await updateCotacaoStatus(cotacaoId, newStatus, reason ? { rejectionReason: reason } : {});
      setData(r?.data ?? r); onRefresh();
    } catch (e) { setErr(e?.message ?? 'Erro'); }
    finally { setSaving(false); setShowStatus(false); }
  };

  const handleConvert = async () => {
    if (!confirm('Converter esta cotação em Frete confirmado?')) return;
    setSaving(true); setErr('');
    try {
      const r = await convertCotacao(cotacaoId);
      const result = r?.data ?? r;
      setData(result.cotacao);
      setConverted(result.frete);
      onRefresh();
    } catch (e) { setErr(e?.message ?? 'Erro ao converter'); }
    finally { setSaving(false); }
  };

  const c = data;
  const nexts = c ? (STATUS_NEXT[c.status] ?? []) : [];

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {c ? c.cotacaoNumber : 'Cotação'}
            {c && <span className="ms-2"><StatusBadge status={c.status} /></span>}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loading && <div className="text-center py-4"><Spinner /></div>}
          {!loading && c && (
            <>
              {err && <Alert variant="danger" className="py-2">{err}</Alert>}

              {converted && (
                <Alert variant="success" className="py-2">
                  <Truck size={14} className="me-2" />
                  Frete <strong>{converted.freteNumber ?? converted.freteNumber}</strong> criado com sucesso e já está confirmado.
                </Alert>
              )}

              <Row className="g-3 mb-3">
                <Col md={6}>
                  <h6 className="text-muted small mb-1">Cliente</h6>
                  <p className="mb-0 fw-medium">{c.clienteRazaoSocial || '–'}</p>
                </Col>
                <Col md={6}>
                  <h6 className="text-muted small mb-1">Rota</h6>
                  <p className="mb-0">
                    <span className="fw-medium">{c.origin?.state}</span>
                    {c.origin?.city && ` (${c.origin.city})`}
                    <ArrowRight size={13} className="mx-1 text-muted" />
                    <span className="fw-medium">{c.destination?.state}</span>
                    {c.destination?.city && ` (${c.destination.city})`}
                  </p>
                </Col>
                <Col md={3}><h6 className="text-muted small mb-1">Modalidade</h6>
                  <p className="mb-0">{c.modality || '–'}</p></Col>
                <Col md={3}><h6 className="text-muted small mb-1">Peso</h6>
                  <p className="mb-0">{c.cargo?.weightKg ? `${c.cargo.weightKg} kg` : '–'}</p></Col>
                <Col md={3}><h6 className="text-muted small mb-1">Valor NF</h6>
                  <p className="mb-0">{fmtCurrency(c.cargo?.['valueR$'])}</p></Col>
                <Col md={3}><h6 className="text-muted small mb-1">Validade</h6>
                  <p className="mb-0">{fmtDate(c.validUntil)}</p></Col>
                {c.cargo?.description && (
                  <Col xs={12}><h6 className="text-muted small mb-1">Descrição</h6>
                    <p className="mb-0 small">{c.cargo.description}</p></Col>
                )}
                <Col md={4}><h6 className="text-muted small mb-1">Coleta desejada</h6>
                  <p className="mb-0">{fmtDate(c.requestedPickupDate)}</p></Col>
                <Col md={4}><h6 className="text-muted small mb-1">Entrega desejada</h6>
                  <p className="mb-0">{fmtDate(c.requestedDeliveryDate)}</p></Col>
                {c.freteNumber && (
                  <Col md={4}><h6 className="text-muted small mb-1">Frete gerado</h6>
                    <p className="mb-0 fw-medium text-primary">{c.freteNumber}</p></Col>
                )}
                {c.rejectionReason && (
                  <Col xs={12}><h6 className="text-muted small mb-1">Motivo recusa</h6>
                    <p className="mb-0 text-danger small">{c.rejectionReason}</p></Col>
                )}
              </Row>

              <hr />
              <h6 className="text-muted small mb-2">Precificação</h6>
              <PricingBreakdown pricing={c.pricing} />

              {c.notes && <><hr /><p className="text-muted small mb-0">{c.notes}</p></>}
            </>
          )}
        </Modal.Body>
        {c && !loading && (
          <Modal.Footer className="justify-content-between">
            <div className="d-flex gap-2 flex-wrap">
              {c.status === 'draft' && !c.pricing && (
                <Button size="sm" variant="outline-info" onClick={handleRecalc} disabled={saving}>
                  <RefreshCw size={13} className="me-1" /> Calcular Preço
                </Button>
              )}
              {c.status === 'draft' && c.pricing && (
                <Button size="sm" variant="outline-secondary" onClick={handleRecalc} disabled={saving}>
                  <RefreshCw size={13} className="me-1" /> Recalcular
                </Button>
              )}
              {nexts.filter(s => s !== 'converted').map(s => (
                <Button key={s} size="sm"
                  variant={s === 'approved' ? 'success' : s === 'rejected' ? 'danger' : 'outline-secondary'}
                  disabled={saving}
                  onClick={() => {
                    if (s === 'rejected') {
                      const reason = prompt('Motivo da recusa (opcional):');
                      handleStatus(s, reason);
                    } else {
                      handleStatus(s);
                    }
                  }}>
                  {STATUS_LABELS[s] ?? s}
                </Button>
              ))}
              {c.status === 'approved' && (
                <Button size="sm" variant="primary" disabled={saving} onClick={handleConvert}>
                  {saving ? <Spinner size="sm" /> : <><Truck size={13} className="me-1" /> Converter em Frete</>}
                </Button>
              )}
            </div>
            <Button variant="light" onClick={onHide}>Fechar</Button>
          </Modal.Footer>
        )}
      </Modal>
    </>
  );
}

// ─── CotacoesBody ─────────────────────────────────────────────────────────────

export default function CotacoesBody() {
  const [stats, setStats]     = useState(null);
  const [items, setItems]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [showNew,    setShowNew]    = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, list] = await Promise.all([
        getCotacaoStats(),
        listCotacoes({ status: filterStatus || undefined, limit: 100 }),
      ]);
      setStats(s);
      setItems(list?.items ?? []);
      setTotal(list?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(c =>
    !search ||
    c.cotacaoNumber?.toLowerCase().includes(search.toLowerCase()) ||
    c.clienteRazaoSocial?.toLowerCase().includes(search.toLowerCase()),
  );

  const open = (id) => { setSelectedId(id); setShowDetail(true); };

  return (
    <div className="hk-pg-body">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="mb-1">Cotações</h3>
          <p className="text-muted mb-0">Pipeline comercial — da solicitação ao frete confirmado</p>
        </div>
        <Button variant="primary" onClick={() => setShowNew(true)}>
          <Plus size={16} className="me-1" /> Nova Cotação
        </Button>
      </div>

      {/* KPIs */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={2}>
          <KpiCard label="Total"      value={stats?.total ?? 0}                icon={<FileText size={18} />}   color="primary" />
        </Col>
        <Col xs={6} md={2}>
          <KpiCard label="Enviadas"   value={stats?.byStatus?.sent ?? 0}       icon={<Send size={18} />}       color="info" />
        </Col>
        <Col xs={6} md={2}>
          <KpiCard label="Aprovadas"  value={stats?.byStatus?.approved ?? 0}   icon={<CheckCircle size={18} />} color="success" />
        </Col>
        <Col xs={6} md={2}>
          <KpiCard label="Convertidas" value={stats?.byStatus?.converted ?? 0} icon={<Truck size={18} />}     color="primary" />
        </Col>
        <Col xs={6} md={2}>
          <KpiCard label="Recusadas"  value={stats?.byStatus?.rejected ?? 0}   icon={<XCircle size={18} />}   color="danger" />
        </Col>
        <Col xs={6} md={2}>
          <KpiCard label="Expiradas"  value={stats?.byStatus?.expired ?? 0}    icon={<Clock size={18} />}     color="warning" />
        </Col>
      </Row>

      {/* Filtros */}
      <Card className="shadow-sm mb-3">
        <Card.Body className="py-2">
          <Row className="g-2 align-items-center">
            <Col md={5}>
              <InputGroup size="sm">
                <InputGroup.Text><Search size={14} /></InputGroup.Text>
                <Form.Control placeholder="Buscar por número ou cliente…"
                  value={search} onChange={e => setSearch(e.target.value)} />
                {search && <Button variant="outline-secondary" onClick={() => setSearch('')}><X size={14} /></Button>}
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select size="sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">Todos os status</option>
                {Object.entries(STATUS_CFG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </Form.Select>
            </Col>
            <Col className="text-end">
              <small className="text-muted">{filtered.length} de {total}</small>
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
                <th>Cliente</th>
                <th>Rota</th>
                <th>Peso</th>
                <th>Total</th>
                <th>Validade</th>
                <th>Status</th>
                <th>Frete</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-4"><Spinner size="sm" /> Carregando…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-4 text-muted">
                  <FileText size={24} className="mb-2 d-block mx-auto" />
                  Nenhuma cotação encontrada.
                </td></tr>
              ) : filtered.map(c => (
                <tr key={c._id} style={{ cursor: 'pointer' }} onClick={() => open(c._id)}>
                  <td className="fw-medium">{c.cotacaoNumber}</td>
                  <td className="small">{c.clienteRazaoSocial || <span className="text-muted">–</span>}</td>
                  <td className="small text-muted">
                    {c.origin?.state} <ArrowRight size={11} /> {c.destination?.state}
                  </td>
                  <td className="small">{c.cargo?.weightKg ? `${c.cargo.weightKg} kg` : '–'}</td>
                  <td className="fw-medium text-success">
                    {c.pricing?.totalFreightBRL ? fmtCurrency(c.pricing.totalFreightBRL) : <span className="text-muted small">sem preço</span>}
                  </td>
                  <td className="small text-muted">{fmtDate(c.validUntil)}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td className="small">
                    {c.freteNumber
                      ? <span className="text-primary fw-medium">{c.freteNumber}</span>
                      : <span className="text-muted">–</span>}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="light" onClick={() => open(c._id)}>
                      <Eye size={13} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </SimpleBar>
      </Card>

      <NewCotacaoModal show={showNew}
        onHide={() => setShowNew(false)}
        onCreated={() => load()} />

      <DetailModal show={showDetail} cotacaoId={selectedId}
        onHide={() => setShowDetail(false)}
        onRefresh={load} />
    </div>
  );
}
