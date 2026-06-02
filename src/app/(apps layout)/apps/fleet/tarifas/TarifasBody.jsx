'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Card, Badge, Table, Button, Form, InputGroup, Row, Col, Modal,
  Spinner, Alert, Tabs, Tab, ListGroup,
} from 'react-bootstrap';
import {
  Search, X, Plus, Eye, CheckCircle, Archive, Trash2,
  DollarSign, TrendingUp, AlertTriangle, ChevronRight, Hash,
} from 'react-feather';
import SimpleBar from 'simplebar-react';
import {
  getTarifaStats,
  listTarifas,
  getTarifa,
  createTarifa,
  updateTarifa,
  updateTarifaStatus,
  deleteTarifa,
  calculateFreight,
} from '@/lib/api/services/tarifas';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtCurrency = (v) =>
  v != null ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '–';

const fmtPct = (v) => (v != null ? `${v}%` : '–');

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR') : '–';

// ─── Enums ────────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  draft:    { bg: 'secondary', label: 'Rascunho' },
  active:   { bg: 'success',   label: 'Ativa' },
  archived: { bg: 'dark',      label: 'Arquivada' },
};

const MODALITIES = [
  { value: '', label: 'Qualquer modalidade' },
  { value: 'FTL',       label: 'FTL — Carga completa' },
  { value: 'LTL',       label: 'LTL — Carga fracionada' },
  { value: 'dedicated', label: 'Dedicado' },
  { value: 'spot',      label: 'Spot' },
];

const UFS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO',
];

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.draft;
  return <Badge bg={cfg.bg}>{cfg.label}</Badge>;
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

// ─── WeightRangesEditor ───────────────────────────────────────────────────────

function WeightRangesEditor({ ranges, onChange }) {
  const add = () =>
    onChange([...ranges, { minKg: 0, maxKg: 0, ratePerKg: 0, minFreightBRL: 0 }]);

  const remove = (i) => onChange(ranges.filter((_, idx) => idx !== i));

  const update = (i, field, val) => {
    const next = ranges.map((r, idx) => idx === i ? { ...r, [field]: Number(val) } : r);
    onChange(next);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="text-muted small fw-medium">Faixas de peso</span>
        <Button size="sm" variant="outline-primary" onClick={add}>
          <Plus size={12} className="me-1" /> Faixa
        </Button>
      </div>
      {ranges.length === 0 && (
        <p className="text-muted small text-center py-2 border rounded">
          Nenhuma faixa. Adicione ao menos uma.
        </p>
      )}
      {ranges.map((r, i) => (
        <div key={i} className="border rounded p-2 mb-2">
          <Row className="g-1 align-items-center">
            <Col xs={3}>
              <Form.Label className="small mb-0">Min kg</Form.Label>
              <Form.Control size="sm" type="number" min={0} value={r.minKg}
                onChange={e => update(i, 'minKg', e.target.value)} />
            </Col>
            <Col xs={3}>
              <Form.Label className="small mb-0">Max kg <span className="text-muted">(0=∞)</span></Form.Label>
              <Form.Control size="sm" type="number" min={0} value={r.maxKg}
                onChange={e => update(i, 'maxKg', e.target.value)} />
            </Col>
            <Col xs={3}>
              <Form.Label className="small mb-0">R$/kg</Form.Label>
              <Form.Control size="sm" type="number" min={0} step="0.01" value={r.ratePerKg}
                onChange={e => update(i, 'ratePerKg', e.target.value)} />
            </Col>
            <Col xs={2}>
              <Form.Label className="small mb-0">Mínimo R$</Form.Label>
              <Form.Control size="sm" type="number" min={0} step="0.01" value={r.minFreightBRL}
                onChange={e => update(i, 'minFreightBRL', e.target.value)} />
            </Col>
            <Col xs={1} className="d-flex align-items-end pb-1">
              <Button size="sm" variant="outline-danger" onClick={() => remove(i)}>
                <X size={12} />
              </Button>
            </Col>
          </Row>
        </div>
      ))}
    </div>
  );
}

// ─── NewTarifaModal ───────────────────────────────────────────────────────────

function NewTarifaModal({ show, onHide, onCreated }) {
  const empty = {
    name: '', carrierId: '', modality: '',
    originUF: '', destinationUF: '',
    validFrom: '', validUntil: '',
    weightRanges: [],
    grisPct: 0, adValoremPct: 0,
    tollsBRL: 0, surchargesBRL: 0,
    notes: '',
  };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { if (show) { setForm(empty); setErr(''); } }, [show]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setErr('Nome obrigatório'); return; }
    setErr(''); setSaving(true);
    try {
      const payload = {
        name:          form.name,
        carrierId:     form.carrierId  || undefined,
        modality:      form.modality   || undefined,
        originUF:      form.originUF   || undefined,
        destinationUF: form.destinationUF || undefined,
        validFrom:     form.validFrom  || undefined,
        validUntil:    form.validUntil || undefined,
        weightRanges:  form.weightRanges,
        grisPct:       Number(form.grisPct),
        adValoremPct:  Number(form.adValoremPct),
        tollsBRL:      Number(form.tollsBRL),
        surchargesBRL: Number(form.surchargesBRL),
        notes:         form.notes || undefined,
      };
      const created = await createTarifa(payload);
      onCreated(created);
      onHide();
    } catch (e) {
      setErr(e?.message ?? 'Erro ao criar tarifa');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Nova Tarifa de Frete</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <SimpleBar style={{ maxHeight: '72vh' }}>
            {err && <Alert variant="danger" className="py-2">{err}</Alert>}

            <h6 className="text-muted mb-2">Identificação</h6>
            <Row className="g-2 mb-3">
              <Col md={8}>
                <Form.Label className="small">Nome da tarifa *</Form.Label>
                <Form.Control size="sm" placeholder="Ex: SP → PR FTL Contratado"
                  value={form.name} onChange={e => set('name', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small">Modalidade</Form.Label>
                <Form.Select size="sm" value={form.modality} onChange={e => set('modality', e.target.value)}>
                  {MODALITIES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </Form.Select>
              </Col>
              <Col md={6}>
                <Form.Label className="small">Transportadora (ID)</Form.Label>
                <Form.Control size="sm" placeholder="carrierId (opcional)"
                  value={form.carrierId} onChange={e => set('carrierId', e.target.value)} />
              </Col>
            </Row>

            <h6 className="text-muted mb-2">Rota</h6>
            <Row className="g-2 mb-3">
              <Col md={3}>
                <Form.Label className="small">UF Origem</Form.Label>
                <Form.Select size="sm" value={form.originUF} onChange={e => set('originUF', e.target.value)}>
                  <option value="">Qualquer</option>
                  {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Label className="small">UF Destino</Form.Label>
                <Form.Select size="sm" value={form.destinationUF} onChange={e => set('destinationUF', e.target.value)}>
                  <option value="">Qualquer</option>
                  {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Label className="small">Válida de</Form.Label>
                <Form.Control size="sm" type="date"
                  value={form.validFrom} onChange={e => set('validFrom', e.target.value)} />
              </Col>
              <Col md={3}>
                <Form.Label className="small">Válida até</Form.Label>
                <Form.Control size="sm" type="date"
                  value={form.validUntil} onChange={e => set('validUntil', e.target.value)} />
              </Col>
            </Row>

            <div className="mb-3">
              <WeightRangesEditor
                ranges={form.weightRanges}
                onChange={v => set('weightRanges', v)} />
            </div>

            <h6 className="text-muted mb-2">Componentes adicionais</h6>
            <Row className="g-2 mb-3">
              <Col md={3}>
                <Form.Label className="small">GRIS (%)</Form.Label>
                <Form.Control size="sm" type="number" min={0} step="0.01"
                  value={form.grisPct} onChange={e => set('grisPct', e.target.value)} />
              </Col>
              <Col md={3}>
                <Form.Label className="small">Ad Valorem (%)</Form.Label>
                <Form.Control size="sm" type="number" min={0} step="0.01"
                  value={form.adValoremPct} onChange={e => set('adValoremPct', e.target.value)} />
              </Col>
              <Col md={3}>
                <Form.Label className="small">Pedágios (R$)</Form.Label>
                <Form.Control size="sm" type="number" min={0} step="0.01"
                  value={form.tollsBRL} onChange={e => set('tollsBRL', e.target.value)} />
              </Col>
              <Col md={3}>
                <Form.Label className="small">Sobretaxas (R$)</Form.Label>
                <Form.Control size="sm" type="number" min={0} step="0.01"
                  value={form.surchargesBRL} onChange={e => set('surchargesBRL', e.target.value)} />
              </Col>
            </Row>

            <Form.Control as="textarea" rows={2} size="sm" placeholder="Observações…"
              value={form.notes} onChange={e => set('notes', e.target.value)} />
          </SimpleBar>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onHide} disabled={saving}>Cancelar</Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? <Spinner size="sm" /> : 'Criar Tarifa'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

// ─── HashModal ──────────────────────────────────────────────────────────

function HashModal({ show, onHide }) {
  const [form, setForm] = useState({
    originUF: 'SP', destinationUF: 'PR',
    weightKg: '', cargoValueBRL: '',
    modality: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setResult(null); };

  const handleCalc = async (e) => {
    e.preventDefault();
    if (!form.weightKg) { setErr('Informe o peso'); return; }
    setErr(''); setLoading(true);
    try {
      const r = await calculateFreight({
        originUF:      form.originUF,
        destinationUF: form.destinationUF,
        weightKg:      Number(form.weightKg),
        cargoValueBRL: form.cargoValueBRL ? Number(form.cargoValueBRL) : undefined,
        modality:      form.modality || undefined,
      });
      setResult(r?.data ?? r);
    } catch (e) {
      setErr(e?.message ?? 'Nenhuma tarifa ativa encontrada para essa rota/peso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title><Hash size={16} className="me-2" />Simulador de Frete</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleCalc}>
        <Modal.Body>
          {err && <Alert variant="warning" className="py-2 small">{err}</Alert>}
          <Row className="g-2 mb-3">
            <Col md={3}>
              <Form.Label className="small">Origem (UF)</Form.Label>
              <Form.Select size="sm" value={form.originUF} onChange={e => set('originUF', e.target.value)}>
                {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label className="small">Destino (UF)</Form.Label>
              <Form.Select size="sm" value={form.destinationUF} onChange={e => set('destinationUF', e.target.value)}>
                {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label className="small">Peso (kg)</Form.Label>
              <Form.Control size="sm" type="number" min={1} placeholder="0"
                value={form.weightKg} onChange={e => set('weightKg', e.target.value)} />
            </Col>
            <Col md={3}>
              <Form.Label className="small">Valor NF (R$)</Form.Label>
              <Form.Control size="sm" type="number" min={0} placeholder="opcional"
                value={form.cargoValueBRL} onChange={e => set('cargoValueBRL', e.target.value)} />
            </Col>
            <Col md={4}>
              <Form.Label className="small">Modalidade</Form.Label>
              <Form.Select size="sm" value={form.modality} onChange={e => set('modality', e.target.value)}>
                {MODALITIES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </Form.Select>
            </Col>
          </Row>

          {result && (
            <Card className="border-success">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <div className="fw-bold">{result.name}</div>
                    <div className="text-muted small">{result.tarifaNumber} · {result.originUF} → {result.destinationUF}</div>
                  </div>
                  <div className="fs-5 fw-bold text-success">{fmtCurrency(result.totalFreightBRL)}</div>
                </div>
                <ListGroup variant="flush" className="small">
                  {Object.entries(result.breakdown ?? {}).map(([k, v]) => (
                    <ListGroup.Item key={k} className="d-flex justify-content-between px-0 py-1">
                      <span className="text-muted">{k}</span>
                      <span>{fmtCurrency(v)}</span>
                    </ListGroup.Item>
                  ))}
                  <ListGroup.Item className="d-flex justify-content-between px-0 py-1 fw-bold border-top">
                    <span>Total</span>
                    <span className="text-success">{fmtCurrency(result.totalFreightBRL)}</span>
                  </ListGroup.Item>
                </ListGroup>
                <div className="text-muted" style={{ fontSize: 11 }} className="mt-1">
                  Faixa: {result.weightRange?.minKg}–{result.weightRange?.maxKg || '∞'} kg
                  @ R$ {result.weightRange?.ratePerKg}/kg · mínimo {fmtCurrency(result.weightRange?.minFreightBRL)}
                </div>
              </Card.Body>
            </Card>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onHide}>Fechar</Button>
          <Button variant="success" type="submit" disabled={loading}>
            {loading ? <Spinner size="sm" /> : <><Hash size={14} className="me-1" />Calcular</>}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

// ─── DetailModal ──────────────────────────────────────────────────────────────

function DetailModal({ show, tarifa: t, onHide, onRefresh }) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  if (!t) return null;

  const activate = async () => {
    setSaving(true); setErr('');
    try { await updateTarifaStatus(t._id, 'active'); onRefresh(); onHide(); }
    catch (e) { setErr(e?.message ?? 'Erro'); }
    finally { setSaving(false); }
  };

  const archive = async () => {
    setSaving(true); setErr('');
    try { await updateTarifaStatus(t._id, 'archived'); onRefresh(); onHide(); }
    catch (e) { setErr(e?.message ?? 'Erro'); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    if (!confirm(`Remover ${t.tarifaNumber}?`)) return;
    setSaving(true);
    try { await deleteTarifa(t._id); onRefresh(); onHide(); }
    catch (e) { setErr(e?.message ?? 'Erro'); }
    finally { setSaving(false); }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {t.tarifaNumber} — {t.name} <StatusBadge status={t.status} />
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {err && <Alert variant="danger" className="py-2">{err}</Alert>}
        <Row className="g-3 mb-3">
          <Col md={4}><h6 className="text-muted small mb-1">Rota</h6>
            <p className="mb-0 fw-medium">{t.originUF || '—'} → {t.destinationUF || '—'}</p></Col>
          <Col md={4}><h6 className="text-muted small mb-1">Modalidade</h6>
            <p className="mb-0">{t.modality || '–'}</p></Col>
          <Col md={4}><h6 className="text-muted small mb-1">Transportadora</h6>
            <p className="mb-0">{t.carrierId || '–'}</p></Col>
          <Col md={4}><h6 className="text-muted small mb-1">GRIS</h6>
            <p className="mb-0">{fmtPct(t.grisPct)}</p></Col>
          <Col md={4}><h6 className="text-muted small mb-1">Ad Valorem</h6>
            <p className="mb-0">{fmtPct(t.adValoremPct)}</p></Col>
          <Col md={4}><h6 className="text-muted small mb-1">Pedágios</h6>
            <p className="mb-0">{fmtCurrency(t.tollsBRL)}</p></Col>
          <Col md={4}><h6 className="text-muted small mb-1">Sobretaxas</h6>
            <p className="mb-0">{fmtCurrency(t.surchargesBRL)}</p></Col>
          <Col md={4}><h6 className="text-muted small mb-1">Vigência</h6>
            <p className="mb-0">{fmtDate(t.validFrom)} – {fmtDate(t.validUntil)}</p></Col>
        </Row>

        <h6 className="text-muted small mb-2">Faixas de peso</h6>
        {(t.weightRanges ?? []).length === 0 ? (
          <p className="text-muted small">Nenhuma faixa configurada.</p>
        ) : (
          <Table size="sm" bordered className="small mb-0">
            <thead className="table-light">
              <tr>
                <th>Min kg</th><th>Max kg</th><th>R$/kg</th><th>Mínimo R$</th>
              </tr>
            </thead>
            <tbody>
              {t.weightRanges.map((r, i) => (
                <tr key={i}>
                  <td>{r.minKg}</td>
                  <td>{r.maxKg === 0 ? '∞' : r.maxKg}</td>
                  <td>{fmtCurrency(r.ratePerKg)}</td>
                  <td>{fmtCurrency(r.minFreightBRL)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {t.notes && <p className="text-muted small mt-3 mb-0">{t.notes}</p>}
      </Modal.Body>
      <Modal.Footer className="justify-content-between">
        <div className="d-flex gap-2">
          {t.status === 'draft' && (
            <Button size="sm" variant="success" onClick={activate} disabled={saving}>
              <CheckCircle size={13} className="me-1" /> Ativar
            </Button>
          )}
          {t.status === 'active' && (
            <Button size="sm" variant="warning" onClick={archive} disabled={saving}>
              <Archive size={13} className="me-1" /> Arquivar
            </Button>
          )}
          {t.status !== 'active' && (
            <Button size="sm" variant="outline-danger" onClick={remove} disabled={saving}>
              <Trash2 size={13} className="me-1" /> Remover
            </Button>
          )}
        </div>
        <Button variant="light" onClick={onHide}>Fechar</Button>
      </Modal.Footer>
    </Modal>
  );
}

// ─── TarifasBody ──────────────────────────────────────────────────────────────

export default function TarifasBody() {
  const [stats, setStats]     = useState(null);
  const [items, setItems]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOrigin, setFilterOrigin] = useState('');
  const [filterDest, setFilterDest]     = useState('');

  const [showNew,   setShowNew]   = useState(false);
  const [showCalc,  setShowCalc]  = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, list] = await Promise.all([
        getTarifaStats(),
        listTarifas({
          status:        filterStatus   || undefined,
          originUF:      filterOrigin   || undefined,
          destinationUF: filterDest     || undefined,
          limit: 100,
        }),
      ]);
      setStats(s);
      setItems(list?.items ?? []);
      setTotal(list?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterOrigin, filterDest]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(t =>
    !search ||
    t.tarifaNumber?.toLowerCase().includes(search.toLowerCase()) ||
    t.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const open = (t) => { setSelected(t); setShowDetail(true); };

  return (
    <div className="hk-pg-body">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="mb-1">Tarifas de Frete</h3>
          <p className="text-muted mb-0">Tabela de preços por rota, peso e modal — base para cotações automáticas</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-success" onClick={() => setShowCalc(true)}>
            <Hash size={15} className="me-1" /> Simular Frete
          </Button>
          <Button variant="primary" onClick={() => setShowNew(true)}>
            <Plus size={16} className="me-1" /> Nova Tarifa
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <KpiCard label="Total"    value={stats?.total ?? 0}               icon={<DollarSign size={20} />} color="primary" />
        </Col>
        <Col xs={6} md={3}>
          <KpiCard label="Ativas"   value={stats?.byStatus?.active ?? 0}    icon={<CheckCircle size={20} />} color="success" />
        </Col>
        <Col xs={6} md={3}>
          <KpiCard label="Rascunho" value={stats?.byStatus?.draft ?? 0}     icon={<TrendingUp size={20} />} color="warning" />
        </Col>
        <Col xs={6} md={3}>
          <KpiCard label="Arquivadas" value={stats?.byStatus?.archived ?? 0} icon={<Archive size={20} />} color="secondary" />
        </Col>
      </Row>

      {/* Filtros */}
      <Card className="shadow-sm mb-3">
        <Card.Body className="py-2">
          <Row className="g-2 align-items-center">
            <Col md={4}>
              <InputGroup size="sm">
                <InputGroup.Text><Search size={14} /></InputGroup.Text>
                <Form.Control placeholder="Buscar por número ou nome…"
                  value={search} onChange={e => setSearch(e.target.value)} />
                {search && (
                  <Button variant="outline-secondary" onClick={() => setSearch('')}><X size={14} /></Button>
                )}
              </InputGroup>
            </Col>
            <Col md={2}>
              <Form.Select size="sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">Todos status</option>
                {Object.entries(STATUS_CFG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select size="sm" value={filterOrigin} onChange={e => setFilterOrigin(e.target.value)}>
                <option value="">Origem (UF)</option>
                {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select size="sm" value={filterDest} onChange={e => setFilterDest(e.target.value)}>
                <option value="">Destino (UF)</option>
                {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </Form.Select>
            </Col>
            <Col md={2} className="text-end">
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
                <th>Nome</th>
                <th>Status</th>
                <th>Rota</th>
                <th>Modal</th>
                <th>Faixas</th>
                <th>GRIS</th>
                <th>Ad Val.</th>
                <th>Pedágios</th>
                <th>Vigência</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} className="text-center py-4"><Spinner size="sm" /> Carregando…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-4 text-muted">
                  <DollarSign size={24} className="mb-2 d-block mx-auto" />
                  Nenhuma tarifa encontrada.
                </td></tr>
              ) : filtered.map(t => (
                <tr key={t._id} style={{ cursor: 'pointer' }} onClick={() => open(t)}>
                  <td className="fw-medium">{t.tarifaNumber}</td>
                  <td>{t.name}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td>
                    <span className="text-muted small">
                      {t.originUF || '–'} <ChevronRight size={11} /> {t.destinationUF || '–'}
                    </span>
                  </td>
                  <td><span className="small">{t.modality || '–'}</span></td>
                  <td>{(t.weightRanges ?? []).length}</td>
                  <td>{fmtPct(t.grisPct)}</td>
                  <td>{fmtPct(t.adValoremPct)}</td>
                  <td>{fmtCurrency(t.tollsBRL)}</td>
                  <td className="small text-muted">
                    {t.validFrom ? fmtDate(t.validFrom) : '–'} {t.validUntil ? `→ ${fmtDate(t.validUntil)}` : ''}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="light" onClick={() => open(t)}>
                      <Eye size={13} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </SimpleBar>
      </Card>

      <NewTarifaModal show={showNew}
        onHide={() => setShowNew(false)}
        onCreated={() => load()} />

      <HashModal show={showCalc}
        onHide={() => setShowCalc(false)} />

      <DetailModal show={showDetail} tarifa={selected}
        onHide={() => setShowDetail(false)}
        onRefresh={load} />
    </div>
  );
}
