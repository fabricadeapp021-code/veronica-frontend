'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card, Row, Col, Button, Form, Alert, Spinner, Badge,
} from 'react-bootstrap';
import {
  ChevronLeft, ChevronRight, CheckCircle, AlertTriangle,
  MapPin, Package, FileText, Truck, User, Navigation,
  Plus, Trash2, RefreshCw, ArrowRight, Save, Zap,
} from 'react-feather';
import { getVehicles, getDrivers, previewRoute } from '@/lib/api/services/fleet';
import {
  getWizard, saveStep, submitWizard, approveWizard,
  rejectWizard, activateWizard, validateCep,
} from '@/lib/api/services/tripWizard';
import { GooglePlaceInput, RoutePreviewMap } from '@/components/fleet/GoogleRoutePlanning';
import { nfesService } from '@/lib/api/services/nfes';
import { nfsesService } from '@/lib/api/services/nfses';

// ── Formatadores ──────────────────────────────────────────────────────────────

const fmtCurrency = (v) =>
  v != null ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '–';

const fmtKm = (m) => (m ? `${(m / 1000).toFixed(0)} km` : '–');

const fmtSec = (s) => {
  if (!s) return '–';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const fmtDt = (iso) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '–';

const stepToPhase = (step) => {
  if (!step || step <= 1) return 1;
  if (step === 2) return 2;
  if (step === 3) return 3;
  if (step <= 5) return 4;
  return 5;
};

// ── Constantes ────────────────────────────────────────────────────────────────

const PHASES = [
  { id: 1, label: 'Pedido',      desc: 'Cliente, origem e destino' },
  { id: 2, label: 'Validação',   desc: 'CEP e pré-frete' },
  { id: 3, label: 'Fiscal',      desc: 'NF-e e documentos' },
  { id: 4, label: 'Operacional', desc: 'Veículo, motorista e rota' },
  { id: 5, label: 'Revisão',     desc: 'Aprovação e ativação' },
];

const CARGO_TYPES = [
  { value: 'general',      label: 'Carga geral' },
  { value: 'refrigerated', label: 'Frigorificado' },
  { value: 'hazmat',       label: 'Carga perigosa' },
  { value: 'bulk',         label: 'Granel' },
  { value: 'liquid',       label: 'Líquido' },
  { value: 'vehicle',      label: 'Veículo transportado' },
  { value: 'live',         label: 'Animais vivos' },
  { value: 'other',        label: 'Outros' },
];

// ── Dados de placeholder para testes ─────────────────────────────────────────

const TEST_FORM1 = () => {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 7);
  deadline.setHours(12, 0, 0, 0);
  return {
    clientName:    'Magazine Luiza S.A.',
    origin: {
      razaoSocial: 'Armazém Central SP',
      cnpj:        '47.960.950/0001-21',
      zipCode:     '01310100',
      address:     'Av. Paulista, 1000, Bela Vista',
      city:        'São Paulo',
      state:       'SP',
    },
    destination: {
      razaoSocial: 'Magazine Luiza Curitiba',
      cnpj:        '47.960.950/0078-11',
      zipCode:     '80020310',
      address:     'Rua XV de Novembro, 500, Centro',
      city:        'Curitiba',
      state:       'PR',
    },
    cargo: {
      type:        'general',
      description: 'Eletrodomésticos (geladeiras, fogões)',
      weightKg:    8500,
      volumeM3:    42.5,
      quantity:    120,
      'valueR$':   285000,
      nfNumbers:   'NF-2024-001, NF-2024-002',
    },
    deadline:      deadline.toISOString().slice(0, 16),
    operationType: 'cif',
    transportType: 'ftl',
    notes:         'Mercadoria frágil — manusear com cuidado',
  };
};

const STATUS_BADGE = {
  draft:     'secondary',
  in_review: 'warning',
  approved:  'success',
  rejected:  'danger',
  active:    'primary',
  completed: 'success',
  cancelled: 'dark',
};

function friendlyOperationalError(err) {
  const body = err?.body;
  const issues = Array.isArray(body?.issues) ? body.issues : [];
  const traccarIssue = issues.find((issue) => issue?.field === 'traccarId');

  if (traccarIssue) {
    return [
      'Este veículo ainda não tem rastreador GPS vinculado.',
      'Para continuar, vá em Frota > Dispositivos, crie ou selecione um device Traccar e vincule ao veículo escolhido.',
    ].join(' ');
  }

  if (issues.length) {
    return issues.map((issue) => issue?.message).filter(Boolean).join(' ');
  }

  return err?.message ?? 'Não foi possível salvar a etapa operacional.';
}

// ── Sub-componentes genéricos ─────────────────────────────────────────────────

function StepIndicator({ phase }) {
  return (
    <div className="d-flex align-items-center gap-2 mb-4">
      {PHASES.map((p, idx) => {
        const done = phase > p.id, active = phase === p.id;
        return (
          <div key={p.id} className="d-flex align-items-center gap-2"
            style={{ flex: idx < PHASES.length - 1 ? 1 : 'none' }}>
            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              <div className="d-flex align-items-center justify-content-center fw-bold"
                style={{
                  width: 28, height: 28, borderRadius: '50%', fontSize: '0.78rem',
                  background: done ? '#198754' : active ? '#0d6efd' : '#dee2e6',
                  color: done || active ? '#fff' : '#6c757d',
                  transition: 'all 0.2s',
                }}>
                {done ? <CheckCircle size={13} /> : p.id}
              </div>
              <div className="d-none d-md-block">
                <div style={{ fontSize: '0.78rem', fontWeight: active ? 700 : 500, color: active ? '#0d6efd' : done ? '#198754' : '#6c757d' }}>
                  {p.label}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#adb5bd', lineHeight: 1.2 }}>{p.desc}</div>
              </div>
            </div>
            {idx < PHASES.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? '#198754' : '#dee2e6', borderRadius: 2, transition: 'background 0.3s' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SectionTitle({ icon, title, subtitle }) {
  return (
    <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
      <span className="text-primary">{icon}</span>
      <div>
        <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>{title}</div>
        {subtitle && <div className="text-muted" style={{ fontSize: '0.78rem' }}>{subtitle}</div>}
      </div>
    </div>
  );
}

// ── PHASE 1 — Pedido ─────────────────────────────────────────────────────────

function Phase1({ form, onChange, onFillTest }) {
  const set = useCallback((path, value) => {
    onChange(prev => {
      const keys = path.split('.');
      const next = { ...prev };
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = { ...cur[keys[i]] };
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  }, [onChange]);

  const handleCepBlur = async (field) => {
    const cep = form[field]?.zipCode?.replace(/\D/g, '');
    if (!cep || cep.length !== 8) return;
    const res = await validateCep(cep);
    if (res?.valid && res?.data) {
      const d = res.data;
      onChange(prev => ({
        ...prev,
        [field]: {
          ...prev[field],
          address: d.logradouro ? `${d.logradouro}, ${d.bairro}` : prev[field].address,
          city:  d.localidade || prev[field].city,
          state: d.uf         || prev[field].state,
        },
      }));
    }
  };

  const handleAddressTextChange = (field, value) => {
    onChange(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        address: value,
        placeId: undefined,
        lat: undefined,
        lng: undefined,
      },
    }));
  };

  const handlePlaceSelect = (field, place) => {
    onChange(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        address: place.address || prev[field]?.address || '',
        city: place.city || prev[field]?.city || '',
        state: place.state || prev[field]?.state || '',
        zipCode: place.zipCode || prev[field]?.zipCode || '',
        placeId: place.placeId,
        lat: place.lat,
        lng: place.lng,
      },
    }));
  };

  const AddrSection = ({ field, title }) => (
    <div className="mb-4">
      <SectionTitle icon={<MapPin size={15} />} title={title} />
      <Row className="g-2">
        <Col xs={12} md={8}>
          <Form.Group>
            <Form.Label style={{ fontSize: '0.8rem' }}>Razão Social <span className="text-danger">*</span></Form.Label>
            <Form.Control size="sm" value={form[field]?.razaoSocial || ''} onChange={e => set(`${field}.razaoSocial`, e.target.value)} placeholder="Empresa XYZ Ltda" />
          </Form.Group>
        </Col>
        <Col xs={12} md={4}>
          <Form.Group>
            <Form.Label style={{ fontSize: '0.8rem' }}>CNPJ</Form.Label>
            <Form.Control size="sm" value={form[field]?.cnpj || ''} onChange={e => set(`${field}.cnpj`, e.target.value)} placeholder="00.000.000/0001-00" />
          </Form.Group>
        </Col>
        <Col xs={6} md={2}>
          <Form.Group>
            <Form.Label style={{ fontSize: '0.8rem' }}>CEP <span className="text-danger">*</span></Form.Label>
            <Form.Control size="sm" value={form[field]?.zipCode || ''} onChange={e => set(`${field}.zipCode`, e.target.value)} onBlur={() => handleCepBlur(field)} placeholder="00000-000" />
          </Form.Group>
        </Col>
        <Col xs={6} md={1}>
          <Form.Group>
            <Form.Label style={{ fontSize: '0.8rem' }}>UF</Form.Label>
            <Form.Control size="sm" value={form[field]?.state || ''} onChange={e => set(`${field}.state`, e.target.value)} placeholder="SP" maxLength={2} />
          </Form.Group>
        </Col>
        <Col xs={12} md={5}>
          <Form.Group>
            <Form.Label style={{ fontSize: '0.8rem' }}>Endereço</Form.Label>
            <GooglePlaceInput
              value={form[field]?.address || ''}
              placeholder="Rua, número, bairro"
              onTextChange={(value) => handleAddressTextChange(field, value)}
              onPlaceSelect={(place) => handlePlaceSelect(field, place)}
            />
            <Form.Text className="text-muted">
              {form[field]?.placeId ? 'Endereço validado pelo Google Places' : 'Digite e selecione uma sugestão do Google'}
            </Form.Text>
          </Form.Group>
        </Col>
        <Col xs={12} md={4}>
          <Form.Group>
            <Form.Label style={{ fontSize: '0.8rem' }}>Cidade <span className="text-danger">*</span></Form.Label>
            <Form.Control size="sm" value={form[field]?.city || ''} onChange={e => set(`${field}.city`, e.target.value)} placeholder="Cidade" />
          </Form.Group>
        </Col>
      </Row>
    </div>
  );

  return (
    <div>
      {/* Botão de dados de teste */}
      <div className="d-flex justify-content-end mb-3">
        <Button
          variant="outline-warning"
          size="sm"
          onClick={onFillTest}
          className="d-flex align-items-center gap-1"
          title="Preenche o formulário com dados de exemplo para teste"
        >
          <Zap size={12} /> Preencher dados de teste
        </Button>
      </div>

      <div className="mb-4">
        <SectionTitle icon={<User size={15} />} title="Dados do Pedido" />
        <Row className="g-2">
          <Col xs={12} md={5}>
            <Form.Group>
              <Form.Label style={{ fontSize: '0.8rem' }}>Cliente <span className="text-danger">*</span></Form.Label>
              <Form.Control size="sm" value={form.clientName || ''} onChange={e => onChange(p => ({ ...p, clientName: e.target.value }))} placeholder="Nome do cliente ou empresa" />
            </Form.Group>
          </Col>
          <Col xs={12} md={3}>
            <Form.Group>
              <Form.Label style={{ fontSize: '0.8rem' }}>Prazo de Entrega <span className="text-danger">*</span></Form.Label>
              <Form.Control size="sm" type="datetime-local" value={form.deadline || ''} onChange={e => onChange(p => ({ ...p, deadline: e.target.value }))} />
            </Form.Group>
          </Col>
          <Col xs={6} md={2}>
            <Form.Group>
              <Form.Label style={{ fontSize: '0.8rem' }}>Operação</Form.Label>
              <Form.Select size="sm" value={form.operationType || 'cif'} onChange={e => onChange(p => ({ ...p, operationType: e.target.value }))}>
                <option value="cif">CIF</option>
                <option value="fob">FOB</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col xs={6} md={2}>
            <Form.Group>
              <Form.Label style={{ fontSize: '0.8rem' }}>Tipo Frete</Form.Label>
              <Form.Select size="sm" value={form.transportType || 'ftl'} onChange={e => onChange(p => ({ ...p, transportType: e.target.value }))}>
                <option value="ftl">FTL</option>
                <option value="ltl">LTL</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      </div>

      <AddrSection field="origin" title="Origem — Remetente" />
      <AddrSection field="destination" title="Destino — Destinatário" />

      <div className="mb-3">
        <SectionTitle icon={<Package size={15} />} title="Dados da Carga" />
        <Row className="g-2">
          <Col xs={12} md={3}>
            <Form.Group>
              <Form.Label style={{ fontSize: '0.8rem' }}>Tipo <span className="text-danger">*</span></Form.Label>
              <Form.Select size="sm" value={form.cargo?.type || 'general'} onChange={e => set('cargo.type', e.target.value)}>
                {CARGO_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col xs={12} md={5}>
            <Form.Group>
              <Form.Label style={{ fontSize: '0.8rem' }}>Descrição</Form.Label>
              <Form.Control size="sm" value={form.cargo?.description || ''} onChange={e => set('cargo.description', e.target.value)} placeholder="Ex: Eletrodomésticos, geladeiras e fogões" />
            </Form.Group>
          </Col>
          <Col xs={4} md={2}>
            <Form.Group>
              <Form.Label style={{ fontSize: '0.8rem' }}>Peso (kg) <span className="text-danger">*</span></Form.Label>
              <Form.Control size="sm" type="number" min="0" value={form.cargo?.weightKg || ''} onChange={e => set('cargo.weightKg', parseFloat(e.target.value) || '')} placeholder="0" />
            </Form.Group>
          </Col>
          <Col xs={4} md={1}>
            <Form.Group>
              <Form.Label style={{ fontSize: '0.8rem' }}>Vol (m³)</Form.Label>
              <Form.Control size="sm" type="number" min="0" step="0.1" value={form.cargo?.volumeM3 || ''} onChange={e => set('cargo.volumeM3', parseFloat(e.target.value) || '')} placeholder="0" />
            </Form.Group>
          </Col>
          <Col xs={4} md={1}>
            <Form.Group>
              <Form.Label style={{ fontSize: '0.8rem' }}>Qtd</Form.Label>
              <Form.Control size="sm" type="number" min="0" value={form.cargo?.quantity || ''} onChange={e => set('cargo.quantity', parseInt(e.target.value) || '')} placeholder="0" />
            </Form.Group>
          </Col>
          <Col xs={12} md={3}>
            <Form.Group>
              <Form.Label style={{ fontSize: '0.8rem' }}>Valor (R$)</Form.Label>
              <Form.Control size="sm" type="number" min="0" step="0.01" value={form.cargo?.valueR$ || ''} onChange={e => set('cargo.valueR$', parseFloat(e.target.value) || '')} placeholder="0,00" />
            </Form.Group>
          </Col>
          <Col xs={12} md={5}>
            <Form.Group>
              <Form.Label style={{ fontSize: '0.8rem' }}>Números das NF <small className="text-muted">(separados por vírgula)</small></Form.Label>
              <Form.Control size="sm" value={form.cargo?.nfNumbers || ''} onChange={e => set('cargo.nfNumbers', e.target.value)} placeholder="NF-2024-001, NF-2024-002" />
            </Form.Group>
          </Col>
          <Col xs={12} md={4}>
            <Form.Group>
              <Form.Label style={{ fontSize: '0.8rem' }}>Observações</Form.Label>
              <Form.Control size="sm" value={form.notes || ''} onChange={e => onChange(p => ({ ...p, notes: e.target.value }))} placeholder="Informações adicionais..." />
            </Form.Group>
          </Col>
        </Row>
      </div>
    </div>
  );
}

// ── PHASE 2 — Validação (auto) ────────────────────────────────────────────────

function Phase2({ validation }) {
  if (!validation) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" className="me-2" />
        <span className="text-muted">Validando CEP e calculando pré-frete...</span>
      </div>
    );
  }

  const { originCepValid, destinationCepValid, weightOk, preFrete } = validation;

  const CheckCard = ({ ok, title, okMsg, failMsg }) => (
    <Card className={`border-0 h-100 bg-${ok ? 'success' : 'danger'} bg-opacity-10`}>
      <Card.Body className="p-3">
        <div className="d-flex align-items-center gap-2 mb-1">
          {ok
            ? <CheckCircle size={14} className="text-success" />
            : <AlertTriangle size={14} className="text-danger" />}
          <span className="fw-semibold" style={{ fontSize: '0.85rem' }}>{title}</span>
        </div>
        <div className="text-muted" style={{ fontSize: '0.8rem' }}>{ok ? okMsg : failMsg}</div>
      </Card.Body>
    </Card>
  );

  return (
    <div>
      <SectionTitle icon={<CheckCircle size={15} />} title="Resultado da Validação" subtitle="Confira os dados antes de prosseguir" />
      <Row className="g-3 mb-4">
        <Col xs={12} md={4}>
          <CheckCard ok={originCepValid} title="CEP de Origem" okMsg="✓ CEP válido e confirmado" failMsg="✗ CEP inválido ou não encontrado" />
        </Col>
        <Col xs={12} md={4}>
          <CheckCard ok={destinationCepValid} title="CEP de Destino" okMsg="✓ CEP válido e confirmado" failMsg="✗ CEP inválido ou não encontrado" />
        </Col>
        <Col xs={12} md={4}>
          <CheckCard ok={weightOk} title="Peso da Carga" okMsg="✓ Dentro do limite" failMsg="⚠ Verifique a capacidade do veículo" />
        </Col>
      </Row>

      {preFrete && (
        <Card className="border-0 bg-light">
          <Card.Body className="p-3">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="fw-semibold" style={{ fontSize: '0.88rem' }}>Pré-cálculo do Frete</span>
              <Badge bg="primary" style={{ fontSize: '1rem' }}>{fmtKm((preFrete.distanceKm || 0) * 1000)}</Badge>
            </div>
            <Row className="g-2">
              {[
                ['Frete Base',  preFrete.baseRateBRL],
                ['Ad Valorem',  preFrete.adValoremBRL],
                ['GRIS',        preFrete.grisBRL],
              ].filter(([, v]) => v != null).map(([label, val]) => (
                <Col xs={6} md={4} key={label}>
                  <div style={{ fontSize: '0.75rem' }} className="text-muted">{label}</div>
                  <div className="fw-semibold" style={{ fontSize: '0.88rem' }}>{fmtCurrency(val)}</div>
                </Col>
              ))}
            </Row>
            <div className="border-top pt-2 mt-2 d-flex justify-content-between align-items-center">
              <div>
                <span className="fw-semibold">Subtotal s/ pedágios</span>
                <div className="text-muted" style={{ fontSize: '0.72rem' }}>Pedágios calculados na fase Operacional</div>
              </div>
              <span className="fw-bold text-primary" style={{ fontSize: '1.1rem' }}>
                {fmtCurrency((preFrete.baseRateBRL || 0) + (preFrete.adValoremBRL || 0) + (preFrete.grisBRL || 0))}
              </span>
            </div>
          </Card.Body>
        </Card>
      )}

      {!(originCepValid && destinationCepValid) && (
        <Alert variant="warning" className="mt-3 py-2 px-3" style={{ fontSize: '0.85rem' }}>
          <AlertTriangle size={13} className="me-1" />
          CEP inválido. Volte ao passo anterior e corrija o endereço.
        </Alert>
      )}
    </div>
  );
}

// ── PHASE 3 — Fiscal ─────────────────────────────────────────────────────────

function Phase3({ form, onChange, order, nfes, nfses }) {
  const entries = form.nfeEntries || [{ number: '', key: '' }];
  const selectedNfe = nfes.find(item => item._id === form.selectedNfeId);
  const selectedNfse = nfses.find(item => item._id === form.selectedNfseId);
  const sameCity = Boolean(
    order?.origin?.city &&
    order?.destination?.city &&
    order.origin.city.trim().toLowerCase() === order.destination.city.trim().toLowerCase() &&
    (order.origin.state || '').trim().toLowerCase() === (order.destination.state || '').trim().toLowerCase()
  );
  const currentFlow = form.fiscalFlowType || (sameCity ? 'nfse_manual' : 'cte_mdfe');

  const set = (field, value) => onChange(p => ({ ...p, [field]: value }));
  const setSource = (value) => onChange(p => ({
    ...p,
    fiscalDocumentSource: value,
    ...(value === 'manual' ? { selectedNfeId: '', selectedNfseId: '' } : {}),
    ...(value === 'tms_nfe' ? { selectedNfseId: '', fiscalFlowType: 'cte_mdfe' } : {}),
    ...(value === 'tms_nfse' ? { selectedNfeId: '', fiscalFlowType: 'nfse_manual' } : {}),
  }));
  const selectNfe = (id) => {
    const nfe = nfes.find(item => item._id === id);
    onChange(p => ({
      ...p,
      fiscalDocumentSource: 'tms_nfe',
      selectedNfeId: id,
      selectedNfseId: '',
      nfeMode: 'existing_key',
      nfeStatus: nfe?.status === 'autorizada' ? 'autorizada' : 'informada',
      nfeEntries: nfe ? [{ number: nfe.numeroDocumento || nfe.nfeNumber || '', key: nfe.chaveAcesso || '' }] : p.nfeEntries,
    }));
  };
  const selectNfse = (id) => {
    onChange(p => ({
      ...p,
      fiscalDocumentSource: 'tms_nfse',
      selectedNfeId: '',
      selectedNfseId: id,
      fiscalFlowType: 'nfse_manual',
    }));
  };
  const setTomador = (field, value) => onChange(p => ({
    ...p,
    tomadorFiscal: { ...(p.tomadorFiscal || {}), [field]: value },
  }));

  const addEntry    = () => onChange(p => ({ ...p, nfeEntries: [...entries, { number: '', key: '' }] }));
  const removeEntry = (i) => onChange(p => ({ ...p, nfeEntries: entries.filter((_, idx) => idx !== i) }));
  const setEntry    = (i, field, value) => onChange(p => ({
    ...p,
    nfeEntries: entries.map((e, idx) => idx === i ? { ...e, [field]: value } : e),
  }));

  return (
    <div>
      <SectionTitle icon={<FileText size={15} />} title="Fiscal" subtitle="Defina o fluxo fiscal e prepare NF-e, CT-e e MDF-e" />

      {sameCity && (
        <Alert variant="warning" className="py-2 px-3 mb-3" style={{ fontSize: '0.82rem' }}>
          Origem e destino estão no mesmo município. Para o MVP, marque como NFS-e externa/manual ou apenas vínculo externo.
        </Alert>
      )}

      <div className="mb-4">
        <div className="fw-semibold mb-2" style={{ fontSize: '0.85rem' }}>Tipo de operação fiscal</div>
        <Row className="g-2">
          <Col xs={12} md={4}>
            <Form.Check
              type="radio"
              id="flow-cte-mdfe"
              label="CT-e + MDF-e"
              checked={currentFlow === 'cte_mdfe'}
              onChange={() => set('fiscalFlowType', 'cte_mdfe')}
            />
            <div className="text-muted ms-4" style={{ fontSize: '0.73rem' }}>Intermunicipal ou interestadual</div>
          </Col>
          <Col xs={12} md={4}>
            <Form.Check
              type="radio"
              id="flow-nfse"
              label="NFS-e externa/manual"
              checked={currentFlow === 'nfse_manual'}
              onChange={() => set('fiscalFlowType', 'nfse_manual')}
            />
            <div className="text-muted ms-4" style={{ fontSize: '0.73rem' }}>Intramunicipal no MVP</div>
          </Col>
          <Col xs={12} md={4}>
            <Form.Check
              type="radio"
              id="flow-external"
              label="Apenas vínculo externo"
              checked={currentFlow === 'external_only'}
              onChange={() => set('fiscalFlowType', 'external_only')}
            />
            <div className="text-muted ms-4" style={{ fontSize: '0.73rem' }}>Documento gerenciado fora do TMS</div>
          </Col>
        </Row>
      </div>

      <div className="mb-4">
        <div className="fw-semibold mb-2" style={{ fontSize: '0.85rem' }}>Origem da nota</div>
        <Row className="g-2">
          <Col xs={12} md={4}>
            <Form.Group>
              <Form.Label style={{ fontSize: '0.8rem' }}>Fonte</Form.Label>
              <Form.Select size="sm" value={form.fiscalDocumentSource || 'manual'} onChange={e => setSource(e.target.value)}>
                <option value="manual">Informar manualmente</option>
                <option value="tms_nfe">Selecionar NF-e do TMS</option>
                <option value="tms_nfse">Selecionar NFS-e do TMS</option>
              </Form.Select>
            </Form.Group>
          </Col>
          {(form.fiscalDocumentSource || 'manual') === 'tms_nfe' && (
            <Col xs={12} md={8}>
              <Form.Group>
                <Form.Label style={{ fontSize: '0.8rem' }}>NF-e criada no TMS</Form.Label>
                <Form.Select size="sm" value={form.selectedNfeId || ''} onChange={e => selectNfe(e.target.value)}>
                  <option value="">Selecione uma NF-e...</option>
                  {nfes.map(n => (
                    <option key={n._id} value={n._id}>
                      {n.nfeNumber} · {n.status}{n.focusNfeRef ? ' · Focus NFe' : ''}{n.chaveAcesso ? ` · ${n.chaveAcesso}` : ''}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          )}
          {form.fiscalDocumentSource === 'tms_nfse' && (
            <Col xs={12} md={8}>
              <Form.Group>
                <Form.Label style={{ fontSize: '0.8rem' }}>NFS-e criada no TMS</Form.Label>
                <Form.Select size="sm" value={form.selectedNfseId || ''} onChange={e => selectNfse(e.target.value)}>
                  <option value="">Selecione uma NFS-e...</option>
                  {nfses.map(n => (
                    <option key={n._id} value={n._id}>
                      {n.nfseNumber} · {n.status}{n.focusNfeRef ? ' · Focus NFe' : ''}{n.codigoVerificacao ? ` · ${n.codigoVerificacao}` : ''}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          )}
        </Row>
        {selectedNfe && (
          <Alert variant="success" className="py-2 px-3 mt-3 mb-0" style={{ fontSize: '0.82rem' }}>
            NF-e {selectedNfe.nfeNumber} selecionada
            {selectedNfe.focusNfeRef ? ' da Focus NFe' : ''}: chave {selectedNfe.chaveAcesso || 'não informada'}.
          </Alert>
        )}
        {selectedNfse && (
          <Alert variant="info" className="py-2 px-3 mt-3 mb-0" style={{ fontSize: '0.82rem' }}>
            NFS-e {selectedNfse.nfseNumber} selecionada
            {selectedNfse.focusNfeRef ? ' da Focus NFe' : ''}: status {selectedNfse.status}.
          </Alert>
        )}
      </div>

      <div className="mb-4">
        <div className="fw-semibold mb-2" style={{ fontSize: '0.85rem' }}>NF-e da mercadoria</div>
        <Row className="g-2 mb-3">
          <Col xs={12} md={4}>
            <Form.Group>
              <Form.Label style={{ fontSize: '0.8rem' }}>Modo NF-e</Form.Label>
              <Form.Select size="sm" value={form.nfeMode || 'existing_key'} onChange={e => set('nfeMode', e.target.value)}>
                <option value="existing_key">NF-e existente/terceiros</option>
                <option value="emit_by_tms">Emitir pelo TMS (futuro)</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col xs={12} md={4}>
            <Form.Group>
              <Form.Label style={{ fontSize: '0.8rem' }}>Status NF-e</Form.Label>
              <Form.Select size="sm" value={form.nfeStatus || 'informada'} onChange={e => set('nfeStatus', e.target.value)}>
                <option value="informada">Informada</option>
                <option value="validada_manualmente">Validada manualmente</option>
                <option value="autorizada">Autorizada</option>
                <option value="erro">Erro</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
        <Alert variant="info" className="py-2 px-3 mb-3" style={{ fontSize: '0.82rem' }}>
          A chave de acesso possui exatamente 44 dígitos e será usada como referência automática do CT-e.
        </Alert>

        {entries.map((entry, idx) => (
          <Card key={idx} className="border mb-3">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-semibold" style={{ fontSize: '0.85rem' }}>NF-e #{idx + 1}</span>
                {entries.length > 1 && (
                  <Button variant="outline-danger" size="sm" onClick={() => removeEntry(idx)} style={{ padding: '1px 6px' }}>
                    <Trash2 size={12} />
                  </Button>
                )}
              </div>
              <Row className="g-2">
                <Col xs={12} md={4}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: '0.8rem' }}>Número da NF-e</Form.Label>
                    <Form.Control size="sm" value={entry.number} onChange={e => setEntry(idx, 'number', e.target.value)} placeholder="Ex: NF-2024-001" />
                  </Form.Group>
                </Col>
                <Col xs={12} md={8}>
                  <Form.Group>
                    <Form.Label style={{ fontSize: '0.8rem' }}>
                      Chave de Acesso (44 dígitos)
                      {entry.key.length > 0 && (
                        <span className={`ms-1 ${entry.key.length === 44 ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.75rem' }}>
                          {entry.key.length === 44 ? 'ok' : `${entry.key.length}/44`}
                        </span>
                      )}
                    </Form.Label>
                    <Form.Control
                      size="sm"
                      value={entry.key}
                      onChange={e => setEntry(idx, 'key', e.target.value.replace(/\D/g, ''))}
                      placeholder="44 dígitos numéricos"
                      maxLength={44}
                      isValid={entry.key.length === 44}
                      isInvalid={entry.key.length > 0 && entry.key.length !== 44}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        ))}

        <Button variant="outline-primary" size="sm" onClick={addEntry} className="d-flex align-items-center gap-1">
          <Plus size={13} /> Adicionar NF-e
        </Button>
      </div>

      <div className="mb-4">
        <div className="fw-semibold mb-2" style={{ fontSize: '0.85rem' }}>Tomador do frete</div>
        <Row className="g-2">
          <Col xs={12} md={4}>
            <Form.Group>
              <Form.Label style={{ fontSize: '0.8rem' }}>Contrato</Form.Label>
              <Form.Select size="sm" value={form.freightContractType || 'cif'} onChange={e => set('freightContractType', e.target.value)}>
                <option value="cif">CIF - remetente paga</option>
                <option value="fob">FOB - destinatário paga</option>
                <option value="third_party">Terceiro pagador</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col xs={12} md={4}>
            <Form.Group>
              <Form.Label style={{ fontSize: '0.8rem' }}>Tomador CT-e</Form.Label>
              <Form.Select size="sm" value={form.cteTomador || 'remetente'} onChange={e => set('cteTomador', e.target.value)}>
                <option value="remetente">Remetente</option>
                <option value="destinatario">Destinatário</option>
                <option value="expedidor">Expedidor</option>
                <option value="recebedor">Recebedor</option>
                <option value="terceiro">Terceiro</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col xs={12} md={4}>
            <Form.Group>
              <Form.Label style={{ fontSize: '0.8rem' }}>Indicador IE</Form.Label>
              <Form.Select
                size="sm"
                value={form.tomadorFiscal?.indicadorInscricaoEstadual || '9'}
                onChange={e => setTomador('indicadorInscricaoEstadual', e.target.value)}
              >
                <option value="1">1 - Contribuinte ICMS</option>
                <option value="2">2 - Isento</option>
                <option value="9">9 - Não contribuinte</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      </div>

      <div>
        <div className="fw-semibold mb-2" style={{ fontSize: '0.85rem' }}>Dados fiscais do tomador</div>
        <Row className="g-2">
          <Col xs={12} md={6}>
            <Form.Group>
              <Form.Label style={{ fontSize: '0.8rem' }}>Razão social / nome</Form.Label>
              <Form.Control size="sm" value={form.tomadorFiscal?.nome || ''} onChange={e => setTomador('nome', e.target.value)} placeholder="Tomador do serviço" />
            </Form.Group>
          </Col>
          <Col xs={6} md={3}>
            <Form.Group>
              <Form.Label style={{ fontSize: '0.8rem' }}>CNPJ</Form.Label>
              <Form.Control size="sm" value={form.tomadorFiscal?.cnpj || ''} onChange={e => setTomador('cnpj', e.target.value)} placeholder="00.000.000/0001-00" />
            </Form.Group>
          </Col>
          <Col xs={6} md={3}>
            <Form.Group>
              <Form.Label style={{ fontSize: '0.8rem' }}>CPF</Form.Label>
              <Form.Control size="sm" value={form.tomadorFiscal?.cpf || ''} onChange={e => setTomador('cpf', e.target.value)} placeholder="000.000.000-00" />
            </Form.Group>
          </Col>
          <Col xs={6} md={3}>
            <Form.Group>
              <Form.Label style={{ fontSize: '0.8rem' }}>Inscrição estadual</Form.Label>
              <Form.Control size="sm" value={form.tomadorFiscal?.inscricaoEstadual || ''} onChange={e => setTomador('inscricaoEstadual', e.target.value)} placeholder="IE" />
            </Form.Group>
          </Col>
          <Col xs={6} md={3}>
            <Form.Group>
              <Form.Label style={{ fontSize: '0.8rem' }}>Código IBGE</Form.Label>
              <Form.Control size="sm" value={form.tomadorFiscal?.codigoIbge || ''} onChange={e => setTomador('codigoIbge', e.target.value)} placeholder="3550308" />
            </Form.Group>
          </Col>
          <Col xs={6} md={2}>
            <Form.Group>
              <Form.Label style={{ fontSize: '0.8rem' }}>CEP</Form.Label>
              <Form.Control size="sm" value={form.tomadorFiscal?.zipCode || ''} onChange={e => setTomador('zipCode', e.target.value)} placeholder="00000-000" />
            </Form.Group>
          </Col>
          <Col xs={6} md={1}>
            <Form.Group>
              <Form.Label style={{ fontSize: '0.8rem' }}>UF</Form.Label>
              <Form.Control size="sm" value={form.tomadorFiscal?.state || ''} onChange={e => setTomador('state', e.target.value.toUpperCase())} maxLength={2} placeholder="SP" />
            </Form.Group>
          </Col>
          <Col xs={12} md={3}>
            <Form.Group>
              <Form.Label style={{ fontSize: '0.8rem' }}>Município</Form.Label>
              <Form.Control size="sm" value={form.tomadorFiscal?.city || ''} onChange={e => setTomador('city', e.target.value)} placeholder="São Paulo" />
            </Form.Group>
          </Col>
          <Col xs={12} md={3}>
            <Form.Group>
              <Form.Label style={{ fontSize: '0.8rem' }}>Endereço</Form.Label>
              <Form.Control size="sm" value={form.tomadorFiscal?.address || ''} onChange={e => setTomador('address', e.target.value)} placeholder="Rua, número, bairro" />
            </Form.Group>
          </Col>
        </Row>
      </div>

      <div className="border-top mt-4 pt-3">
        <Row className="g-2">
          <Col xs={12} md={6}>
            <div className="d-flex justify-content-between align-items-center border rounded px-3 py-2">
              <div>
                <div className="fw-semibold" style={{ fontSize: '0.82rem' }}>CT-e</div>
                <div className="text-muted" style={{ fontSize: '0.73rem' }}>
                  {form.cteNumber ? form.cteNumber : 'Criação pelo wizard temporariamente pausada'}
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <Badge bg={form.cteStatus ? 'primary' : 'secondary'}>{form.cteStatus || 'pendente'}</Badge>
              </div>
            </div>
          </Col>
          <Col xs={12} md={6}>
            <div className="d-flex justify-content-between align-items-center border rounded px-3 py-2">
              <div>
                <div className="fw-semibold" style={{ fontSize: '0.82rem' }}>MDF-e</div>
                <div className="text-muted" style={{ fontSize: '0.73rem' }}>
                  {form.mdfeNumber ? form.mdfeNumber : 'Criação pelo wizard temporariamente pausada'}
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <Badge bg={form.mdfeStatus ? 'primary' : 'secondary'}>{form.mdfeStatus || 'aguardando'}</Badge>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
}

// ── PHASE 4 — Operacional + Rota ─────────────────────────────────────────────

function Phase4({ form, onChange, onCalculateRoute, routeResult, calcRouteLoading }) {
  const set = (field, value) => onChange(p => ({ ...p, [field]: value }));
  const vehicles = form._vehicles || [];
  const drivers  = form._drivers  || [];
  const sv = vehicles.find(v => v._id === form.vehicleId);
  const sd = drivers.find(d => d._id === form.driverId);

  return (
    <div>
      <SectionTitle icon={<Truck size={15} />} title="Planejamento Operacional" subtitle="Defina veículo e motorista" />
      <Row className="g-3 mb-4">
        <Col xs={12} md={5}>
          <Form.Group>
            <Form.Label style={{ fontSize: '0.8rem' }}>Veículo <span className="text-danger">*</span></Form.Label>
            <Form.Select size="sm" value={form.vehicleId || ''} onChange={e => set('vehicleId', e.target.value)}>
              <option value="">Selecione...</option>
              {vehicles.map(v => (
                <option key={v._id} value={v._id}>
                  {v.plate} — {v.model || v.name}{v.maxPayloadKg ? ` (${v.maxPayloadKg}kg)` : ''}
                </option>
              ))}
            </Form.Select>
            {sv && <div className="mt-1 text-muted" style={{ fontSize: '0.73rem' }}>{sv.brand} · {sv.fuelType} · {sv.status}</div>}
          </Form.Group>
        </Col>
        <Col xs={12} md={5}>
          <Form.Group>
            <Form.Label style={{ fontSize: '0.8rem' }}>Motorista <span className="text-danger">*</span></Form.Label>
            <Form.Select size="sm" value={form.driverId || ''} onChange={e => set('driverId', e.target.value)}>
              <option value="">Selecione...</option>
              {drivers.map(d => (
                <option key={d._id} value={d._id}>{d.name} — CNH {d.cnhCategory}</option>
              ))}
            </Form.Select>
            {sd && <div className="mt-1 text-muted" style={{ fontSize: '0.73rem' }}>CNH: {sd.cnhNumber} · Validade: {sd.cnhExpiry ? new Date(sd.cnhExpiry).toLocaleDateString('pt-BR') : '–'}</div>}
          </Form.Group>
        </Col>
        <Col xs={12} md={2}>
          <Form.Group>
            <Form.Label style={{ fontSize: '0.8rem' }}>Saída Prevista <span className="text-danger">*</span></Form.Label>
            <Form.Control size="sm" type="datetime-local" value={form.scheduledAt || ''} onChange={e => set('scheduledAt', e.target.value)} />
          </Form.Group>
        </Col>
      </Row>

      <SectionTitle icon={<Navigation size={15} />} title="Planejamento da Rota" subtitle="Calcule distância, tempo e pedágios" />
      <div className="mb-3">
        <Button
          variant={routeResult ? 'outline-success' : 'outline-primary'}
          size="sm"
          onClick={onCalculateRoute}
          disabled={calcRouteLoading || !form.vehicleId}
          className="d-flex align-items-center gap-2"
        >
          {calcRouteLoading ? <Spinner size="sm" animation="border" /> : <RefreshCw size={13} />}
          {routeResult ? 'Recalcular Rota' : 'Calcular Rota'}
          {!form.vehicleId && <span className="text-muted" style={{ fontSize: '0.73rem' }}>(selecione um veículo primeiro)</span>}
        </Button>
      </div>

      {routeResult && (
        <Card className="border-0 bg-light mb-3">
          <Card.Body className="p-3">
            <div className="mb-3">
              <RoutePreviewMap preview={routeResult} height={280} />
            </div>
            <Row className="g-3">
              {[
                ['Distância',     fmtKm(routeResult.distanceMeters)],
                ['Tempo',         fmtSec(routeResult.durationSeconds)],
                ['Pedágios',      fmtCurrency(routeResult.tollCostBRL)],
                ['Combustível',   routeResult.estimatedFuelL ? `${Math.round(routeResult.estimatedFuelL)} L` : '–'],
              ].map(([label, val]) => (
                <Col xs={6} md={3} key={label}>
                  <div style={{ fontSize: '0.73rem' }} className="text-muted">{label}</div>
                  <div className="fw-bold">{val}</div>
                </Col>
              ))}
            </Row>
            <div className="mt-1" style={{ fontSize: '0.75rem', color: '#6c757d' }}>Via: {routeResult.apiUsed}</div>
          </Card.Body>
        </Card>
      )}

      <div className="border-top pt-3">
        <div className="fw-semibold mb-2" style={{ fontSize: '0.85rem' }}>Configurações de Alerta</div>
        <Row className="g-2">
          <Col xs={6} md={3}>
            <Form.Group>
              <Form.Label style={{ fontSize: '0.78rem' }}>Vel. Máx (km/h)</Form.Label>
              <Form.Control size="sm" type="number" value={form.alertsConfig?.speedLimitKmh ?? 90}
                onChange={e => onChange(p => ({ ...p, alertsConfig: { ...(p.alertsConfig || {}), speedLimitKmh: +e.target.value } }))} />
            </Form.Group>
          </Col>
          <Col xs={6} md={3}>
            <Form.Group>
              <Form.Label style={{ fontSize: '0.78rem' }}>Parada Máx (min)</Form.Label>
              <Form.Control size="sm" type="number" value={form.alertsConfig?.maxStopMinutes ?? 120}
                onChange={e => onChange(p => ({ ...p, alertsConfig: { ...(p.alertsConfig || {}), maxStopMinutes: +e.target.value } }))} />
            </Form.Group>
          </Col>
          <Col xs={12} md={6} className="d-flex align-items-end pb-1">
            <Form.Check type="switch" label="Alertar desvio de rota"
              checked={form.alertsConfig?.deviationAlerts !== false}
              onChange={e => onChange(p => ({ ...p, alertsConfig: { ...(p.alertsConfig || {}), deviationAlerts: e.target.checked } }))} />
          </Col>
        </Row>
      </div>
    </div>
  );
}

// ── PHASE 5 — Revisão ─────────────────────────────────────────────────────────

function Phase5({ wizard, onSubmit, onApprove, onReject, onActivate, actionLoading }) {
  const [rejectReason, setRejectReason] = useState('');
  const [showReject,   setShowReject]   = useState(false);

  const { step1: s1, step2: s2, step3: s3, step4: s4, step5: s5, status } = wizard;

  const InfoRow = ({ label, value }) => (
    <div className="d-flex justify-content-between py-1 border-bottom" style={{ fontSize: '0.82rem' }}>
      <span className="text-muted">{label}</span>
      <span className="fw-semibold text-end" style={{ maxWidth: '60%', wordBreak: 'break-word' }}>{value || '–'}</span>
    </div>
  );

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-4">
        <div>
          <div className="fw-semibold">Revisão Completa</div>
          <div className="text-muted" style={{ fontSize: '0.78rem' }}>Confirme os dados antes de submeter para aprovação</div>
        </div>
        <Badge bg={STATUS_BADGE[status] || 'secondary'} className="ms-auto text-capitalize px-3 py-2">
          {status}
        </Badge>
      </div>

      <Row className="g-3 mb-4">
        {s1 && (
          <Col xs={12} md={6}>
            <Card className="border h-100">
              <Card.Header className="py-2 px-3 d-flex align-items-center gap-2 bg-light" style={{ fontSize: '0.8rem' }}>
                <User size={12} /> Pedido
              </Card.Header>
              <Card.Body className="p-3">
                <InfoRow label="Cliente"   value={s1.clientName} />
                <InfoRow label="Origem"    value={`${s1.origin?.city}, ${s1.origin?.state}`} />
                <InfoRow label="Destino"   value={`${s1.destination?.city}, ${s1.destination?.state}`} />
                <InfoRow label="Carga"     value={s1.cargo?.type} />
                <InfoRow label="Peso"      value={s1.cargo?.weightKg ? `${s1.cargo.weightKg} kg` : null} />
                <InfoRow label="Valor"     value={fmtCurrency(s1.cargo?.['valueR$'])} />
                <InfoRow label="Prazo"     value={fmtDt(s1.deadline)} />
              </Card.Body>
            </Card>
          </Col>
        )}
        {s2?.preFrete && (
          <Col xs={12} md={6}>
            <Card className="border h-100">
              <Card.Header className="py-2 px-3 d-flex align-items-center gap-2 bg-light" style={{ fontSize: '0.8rem' }}>
                <Navigation size={12} /> Rota e Frete
              </Card.Header>
              <Card.Body className="p-3">
                <InfoRow label="Base"       value={fmtCurrency(s2.preFrete.baseRateBRL)} />
                <InfoRow label="Ad Valorem" value={fmtCurrency(s2.preFrete.adValoremBRL)} />
                <InfoRow label="GRIS"       value={fmtCurrency(s2.preFrete.grisBRL)} />
                <div className="d-flex justify-content-between pt-2 mt-1">
                  <span className="fw-bold">Subtotal s/ pedágios</span>
                  <span className="fw-bold text-primary">
                    {fmtCurrency((s2.preFrete.baseRateBRL || 0) + (s2.preFrete.adValoremBRL || 0) + (s2.preFrete.grisBRL || 0))}
                  </span>
                </div>
              </Card.Body>
            </Card>
          </Col>
        )}
        {s3?.nfeNumbers?.length > 0 && (
          <Col xs={12} md={6}>
            <Card className="border h-100">
              <Card.Header className="py-2 px-3 d-flex align-items-center gap-2 bg-light" style={{ fontSize: '0.8rem' }}>
                <FileText size={12} /> Fiscal
              </Card.Header>
              <Card.Body className="p-3">
                {s3.nfeNumbers.map((n, i) => <InfoRow key={i} label={`NF-e ${i + 1}`} value={n} />)}
              </Card.Body>
            </Card>
          </Col>
        )}
        {(s4 || s5) && (
          <Col xs={12} md={6}>
            <Card className="border h-100">
              <Card.Header className="py-2 px-3 d-flex align-items-center gap-2 bg-light" style={{ fontSize: '0.8rem' }}>
                <Truck size={12} /> Operacional
              </Card.Header>
              <Card.Body className="p-3">
                {s4 && <>
                  <InfoRow label="Placa"      value={s4.vehiclePlate} />
                  <InfoRow label="Motorista"  value={s4.driverName} />
                  <InfoRow label="Saída"      value={fmtDt(s4.scheduledAt)} />
                </>}
                {s5 && <>
                  <InfoRow label="Distância"  value={fmtKm(s5.distanceMeters)} />
                  <InfoRow label="Tempo Est." value={fmtSec(s5.durationSeconds)} />
                  <InfoRow label="Pedágios"   value={fmtCurrency(s5.tollCostBRL)} />
                </>}
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      <Card className="border-0 bg-light">
        <Card.Body className="p-3">
          <div className="fw-semibold mb-3" style={{ fontSize: '0.88rem' }}>Ações</div>
          <div className="d-flex flex-wrap gap-2">
            {(status === 'draft' || status === 'rejected') && (
              <Button variant="primary" onClick={onSubmit} disabled={actionLoading} className="d-flex align-items-center gap-1">
                {actionLoading ? <Spinner size="sm" animation="border" /> : <ArrowRight size={14} />}
                Submeter para Aprovação
              </Button>
            )}
            {status === 'in_review' && (<>
              <Button variant="success" onClick={onApprove} disabled={actionLoading} className="d-flex align-items-center gap-1">
                {actionLoading ? <Spinner size="sm" animation="border" /> : <CheckCircle size={14} />} Aprovar
              </Button>
              <Button variant="outline-danger" onClick={() => setShowReject(true)} disabled={actionLoading} className="d-flex align-items-center gap-1">
                <AlertTriangle size={14} /> Rejeitar
              </Button>
            </>)}
            {status === 'approved' && (
              <Button variant="success" onClick={onActivate} disabled={actionLoading} className="d-flex align-items-center gap-1">
                {actionLoading ? <Spinner size="sm" animation="border" /> : <Truck size={14} />} Ativar Viagem
              </Button>
            )}
            {status === 'active' && (
              <Alert variant="success" className="py-2 px-3 mb-0 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
                <CheckCircle size={14} /> Viagem ativada! Trip: <code>{wizard.tripId}</code> — redirecionando...
              </Alert>
            )}
          </div>

          {showReject && (
            <div className="mt-3 p-3 border rounded bg-white">
              <Form.Group className="mb-2">
                <Form.Label style={{ fontSize: '0.82rem' }}>Motivo da Rejeição <span className="text-danger">*</span></Form.Label>
                <Form.Control as="textarea" rows={2} size="sm" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Descreva o motivo..." />
              </Form.Group>
              <div className="d-flex gap-2">
                <Button variant="danger" size="sm" onClick={() => { onReject(rejectReason); setShowReject(false); }} disabled={!rejectReason.trim()}>
                  Confirmar Rejeição
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={() => setShowReject(false)}>Cancelar</Button>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

// ── Estado inicial dos formulários ────────────────────────────────────────────

const mkForm1 = () => ({
  clientName:    '',
  origin:        { razaoSocial: '', cnpj: '', address: '', city: '', state: '', zipCode: '' },
  destination:   { razaoSocial: '', cnpj: '', address: '', city: '', state: '', zipCode: '' },
  cargo:         { type: 'general', description: '', weightKg: '', volumeM3: '', quantity: '', 'valueR$': '', nfNumbers: '' },
  deadline:      '',
  operationType: 'cif',
  transportType: 'ftl',
  notes:         '',
});

const mkForm3 = () => ({
  fiscalFlowType:     '',
  fiscalDocumentSource: 'manual',
  selectedNfeId:      '',
  selectedNfseId:     '',
  nfeMode:            'existing_key',
  nfeStatus:          'informada',
  nfeEntries:         [{ number: '', key: '' }],
  freightContractType: 'cif',
  cteTomador:         'remetente',
  tomadorFiscal:      {
    nome: '',
    cnpj: '',
    cpf: '',
    inscricaoEstadual: '',
    indicadorInscricaoEstadual: '9',
    address: '',
    city: '',
    codigoIbge: '',
    state: '',
    zipCode: '',
  },
  cteStatus: '',
  cteId: '',
  cteNumber: '',
  mdfeStatus: '',
  mdfeId: '',
  mdfeNumber: '',
});

const mkForm4 = () => ({
  vehicleId:    '',
  driverId:     '',
  scheduledAt:  '',
  alertsConfig: { speedLimitKmh: 90, maxStopMinutes: 120, deviationAlerts: true },
  _vehicles:    [],
  _drivers:     [],
});

// ── WizardBody — Componente principal ─────────────────────────────────────────

export default function WizardBody({ wizardId }) {
  const router = useRouter();

  const [wizard,          setWizard]          = useState(null);
  const [phase,           setPhase]           = useState(1);
  const [form1,           setForm1]           = useState(mkForm1);
  const [form3,           setForm3]           = useState(mkForm3);
  const [form4,           setForm4]           = useState(mkForm4);
  const [nfeOptions,      setNfeOptions]      = useState([]);
  const [nfseOptions,     setNfseOptions]     = useState([]);
  const [validation,      setValidation]      = useState(null);
  const [routeResult,     setRouteResult]     = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [calcRouteLoading, setCalcRouteLoading] = useState(false);
  const [actionLoading,   setActionLoading]   = useState(false);
  const [error,           setError]           = useState('');

  // ── Carga inicial ─────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const w = await getWizard(wizardId);
        setWizard(w);
        setPhase(stepToPhase(w.currentStep));

        if (w.step1) {
          const s1 = w.step1;
          setForm1({
            clientName:    s1.clientName || '',
            origin:        { ...mkForm1().origin,      ...s1.origin },
            destination:   { ...mkForm1().destination, ...s1.destination },
            cargo: {
              ...mkForm1().cargo,
              ...s1.cargo,
              nfNumbers: Array.isArray(s1.cargo?.nfNumbers)
                ? s1.cargo.nfNumbers.join(', ')
                : (s1.cargo?.nfNumbers || ''),
            },
            deadline:      s1.deadline ? new Date(s1.deadline).toISOString().slice(0, 16) : '',
            operationType: s1.operationType || 'cif',
            transportType: s1.transportType || 'ftl',
            notes:         s1.notes || '',
          });
        }
        if (w.step2) setValidation(w.step2);
        if (w.step3) {
          const s3 = w.step3;
          const nums = s3.nfeNumbers || [];
          const keys = s3.nfeKeys    || [];
          setForm3({
            ...mkForm3(),
            fiscalFlowType:      s3.fiscalFlowType || '',
            fiscalDocumentSource: s3.fiscalDocumentSource || 'manual',
            selectedNfeId:       s3.selectedNfeId || '',
            selectedNfseId:      s3.selectedNfseId || '',
            nfeMode:             s3.nfeMode || 'existing_key',
            nfeStatus:           s3.nfeStatus || 'informada',
            nfeEntries:          nums.length ? nums.map((n, i) => ({ number: n, key: keys[i] || '' })) : [{ number: '', key: '' }],
            freightContractType: s3.freightContractType || 'cif',
            cteTomador:          s3.cteTomador || 'remetente',
            tomadorFiscal:       { ...mkForm3().tomadorFiscal, ...(s3.tomadorFiscal || {}) },
            cteStatus:           s3.cteStatus || '',
            cteId:               s3.cteId || '',
            cteNumber:           s3.cteNumber || '',
            mdfeStatus:          s3.mdfeStatus || '',
            mdfeId:              s3.mdfeId || '',
            mdfeNumber:          s3.mdfeNumber || '',
          });
        }
        if (w.step5) setRouteResult(w.step5);
      } catch (err) {
        setError('Erro ao carregar wizard: ' + (err?.message ?? ''));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [wizardId]);

  // ── Carregar veículos e motoristas na fase 4 ──────────────────────────────
  useEffect(() => {
    if (phase !== 4) return;
    async function loadResources() {
      try {
        const [vs, ds] = await Promise.all([
          getVehicles().catch(() => []),
          getDrivers().catch(() => []),
        ]);
        const vehicles = Array.isArray(vs) ? vs : (vs?.data ?? vs?.vehicles ?? []);
        const drivers  = Array.isArray(ds) ? ds : (ds?.data ?? ds?.drivers  ?? []);
        setForm4(p => ({
          ...p,
          _vehicles: vehicles,
          _drivers:  drivers,
          ...(wizard?.step4 ? {
            scheduledAt: wizard.step4.scheduledAt
              ? new Date(wizard.step4.scheduledAt).toISOString().slice(0, 16)
              : p.scheduledAt,
          } : {}),
        }));
      } catch {}
    }
    loadResources();
  }, [phase, wizard]);

  useEffect(() => {
    if (phase !== 3) return;
    async function loadFiscalDocs() {
      const [nfesRes, nfsesRes] = await Promise.all([
        nfesService.list({ limit: 100 }).catch(() => null),
        nfsesService.list({ limit: 100 }).catch(() => null),
      ]);
      setNfeOptions(nfesRes?.data?.items || nfesRes?.items || []);
      setNfseOptions(nfsesRes?.data?.items || nfsesRes?.items || []);
    }
    loadFiscalDocs();
  }, [phase]);

  // ── Invalida rota ao trocar veículo ──────────────────────────────────────
  const prevVehicleIdRef = useRef(null);
  useEffect(() => {
    if (phase !== 4) return;
    const cur = form4.vehicleId;
    if (prevVehicleIdRef.current && prevVehicleIdRef.current !== cur && routeResult) {
      setRouteResult(null);
    }
    prevVehicleIdRef.current = cur;
  }, [form4.vehicleId, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Calcular rota ─────────────────────────────────────────────────────────
  const handleCalculateRoute = useCallback(async () => {
    const s1 = wizard?.step1 || wizard?.steps?.step1;
    // Fallback to current form1 state if step1 not yet persisted
    const origin      = s1?.origin      || form1.origin;
    const destination = s1?.destination || form1.destination;

    if (!origin?.city && !origin?.address) {
      setError('Preencha o passo "Pedido" (fase 1) com origem e destino antes de calcular a rota.');
      return;
    }

    setCalcRouteLoading(true);
    try {
      const buildAddr = (loc) => [loc?.address, loc?.city, loc?.state].filter(Boolean).join(', ');
      const selectedVehicle = form4._vehicles?.find(v => v._id === form4.vehicleId);
      const res = await previewRoute({
        origin: {
          address: buildAddr(origin),
          placeId: origin?.placeId,
          lat: origin?.lat,
          lng: origin?.lng,
        },
        destination: {
          address: buildAddr(destination),
          placeId: destination?.placeId,
          lat: destination?.lat,
          lng: destination?.lng,
        },
        vehicleCategory: selectedVehicle?.category || 'truck',
      });
      setRouteResult(res?.data ?? res);
    } catch (err) {
      setError('Erro ao calcular rota: ' + (err?.message ?? ''));
    } finally {
      setCalcRouteLoading(false);
    }
  }, [wizard, form1, form4.vehicleId, form4._vehicles]);

  // ── Validação da Fase 1 ───────────────────────────────────────────────────
  const validatePhase1 = () => {
    if (!form1.clientName.trim())              return 'Nome do cliente é obrigatório.';
    if (!form1.origin.razaoSocial.trim())      return 'Razão social da origem é obrigatória.';
    if (!form1.origin.zipCode.trim())          return 'CEP de origem é obrigatório.';
    if (!form1.origin.city.trim())             return 'Cidade de origem é obrigatória.';
    if (!form1.destination.razaoSocial.trim()) return 'Razão social do destino é obrigatória.';
    if (!form1.destination.zipCode.trim())     return 'CEP de destino é obrigatório.';
    if (!form1.destination.city.trim())        return 'Cidade de destino é obrigatória.';
    if (!form1.cargo.weightKg || form1.cargo.weightKg <= 0) return 'Peso da carga é obrigatório.';
    if (!form1.deadline)                       return 'Prazo de entrega é obrigatório.';
    return null;
  };

  const getPhase3Flow = () => {
    const sameCity = Boolean(
      form1.origin?.city &&
      form1.destination?.city &&
      form1.origin.city.trim().toLowerCase() === form1.destination.city.trim().toLowerCase() &&
      (form1.origin.state || '').trim().toLowerCase() === (form1.destination.state || '').trim().toLowerCase()
    );
    return form3.fiscalFlowType || (sameCity ? 'nfse_manual' : 'cte_mdfe');
  };

  const validatePhase3 = () => {
    const flow = getPhase3Flow();
    const nfeKeys = form3.nfeEntries.map(e => e.key).filter(Boolean);
    if (flow === 'cte_mdfe' && (form3.nfeMode || 'existing_key') === 'existing_key' && nfeKeys.length === 0) {
      return 'Informe ao menos uma chave NF-e para seguir com CT-e + MDF-e.';
    }
    const invalidKey = nfeKeys.find(k => k.length !== 44);
    if (invalidKey) return 'Todas as chaves NF-e informadas precisam ter 44 dígitos.';
    if (form3.tomadorFiscal?.indicadorInscricaoEstadual === '1' && !form3.tomadorFiscal?.inscricaoEstadual?.trim()) {
      return 'Informe a IE do tomador quando ele for contribuinte de ICMS.';
    }
    return null;
  };

  const buildStep3Payload = () => {
    const nfeNumbers = form3.nfeEntries.map(e => e.number).filter(Boolean);
    const nfeKeys    = form3.nfeEntries.map(e => e.key).filter(Boolean);
    return {
      fiscalFlowType:      getPhase3Flow(),
      fiscalDocumentSource: form3.fiscalDocumentSource || 'manual',
      selectedNfeId:       form3.selectedNfeId || undefined,
      selectedNfseId:      form3.selectedNfseId || undefined,
      nfeMode:             form3.nfeMode,
      nfeStatus:           form3.nfeStatus,
      nfeNumbers,
      nfeKeys,
      freightContractType: form3.freightContractType,
      cteTomador:          form3.cteTomador,
      tomadorFiscal:       form3.tomadorFiscal,
      cteId:               form3.cteId || undefined,
      cteNumber:           form3.cteNumber || undefined,
      cteStatus:           form3.cteStatus || undefined,
      mdfeId:              form3.mdfeId || undefined,
      mdfeNumber:          form3.mdfeNumber || undefined,
      mdfeStatus:          form3.mdfeStatus || undefined,
    };
  };


  // ── Avançar fase ──────────────────────────────────────────────────────────
  const handleNext = async () => {
    setError('');

    if (phase === 1) {
      const err = validatePhase1();
      if (err) { setError(err); return; }
      setSaving(true);
      try {
        const payload = {
          ...form1,
          cargo: {
            ...form1.cargo,
            nfNumbers: form1.cargo.nfNumbers
              ? form1.cargo.nfNumbers.split(',').map(s => s.trim()).filter(Boolean)
              : [],
          },
          deadline: form1.deadline ? new Date(form1.deadline).toISOString() : undefined,
        };
        await saveStep(wizardId, 1, payload);
        const res2  = await saveStep(wizardId, 2, {});
        const upd   = res2?.data ?? res2;
        setValidation(upd?.steps?.step2 ?? upd?.step2 ?? null);
        setWizard(upd);
        setPhase(2);
      } catch (err) {
        setError('Erro ao salvar: ' + (err?.message ?? ''));
      } finally {
        setSaving(false);
      }
      return;
    }

    if (phase === 2) { setPhase(3); return; }

    if (phase === 3) {
      const err = validatePhase3();
      if (err) { setError(err); return; }
      setSaving(true);
      try {
        const res = await saveStep(wizardId, 3, buildStep3Payload());
        setWizard(res?.data ?? res);
        setPhase(4);
      } catch (err) {
        setError('Erro ao salvar NF-e: ' + (err?.message ?? ''));
      } finally {
        setSaving(false);
      }
      return;
    }

    if (phase === 4) {
      if (!form4.vehicleId)   { setError('Selecione um veículo.'); return; }
      if (!form4.driverId)    { setError('Selecione um motorista.'); return; }
      if (!form4.scheduledAt) { setError('Informe a data/hora de saída.'); return; }
      if (!routeResult)       { setError('Clique em "Calcular Rota" antes de avançar.'); return; }
      setSaving(true);
      try {
        await saveStep(wizardId, 4, {
          vehicleId:   form4.vehicleId,
          driverId:    form4.driverId,
          scheduledAt: new Date(form4.scheduledAt).toISOString(),
        });
        if (routeResult) {
          const distKm    = Math.round((routeResult.distanceMeters || 0) / 1000);
          const totalCost = distKm * 3.80 + (routeResult.tollCostBRL || 0);
          await saveStep(wizardId, 5, {
            distanceMeters:        routeResult.distanceMeters,
            durationSeconds:       routeResult.durationSeconds,
            tollCostBRL:           routeResult.tollCostBRL,
            estimatedFuelL:        routeResult.estimatedFuelL,
            totalEstimatedCostBRL: totalCost,
            polyline:              routeResult.polyline,
            routeGeoJson:          routeResult.routeGeoJson,
            routeSummary:          routeResult.routeSummary || routeResult.apiUsed || 'estimate',
            apiUsed:               routeResult.apiUsed,
            alertsConfig:          form4.alertsConfig,
          });
        }
        const fresh = await getWizard(wizardId);
        setWizard(fresh);
        setPhase(5);
      } catch (err) {
        setError('Erro ao salvar operacional: ' + friendlyOperationalError(err));
      } finally {
        setSaving(false);
      }
      return;
    }
  };

  // ── Ações da Fase 5 ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const hasRoute = wizard?.step5?.distanceMeters;
    if (!hasRoute) {
      setError('Calcule a rota na fase Operacional antes de submeter.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await submitWizard(wizardId, {
        totalFreightBRL:  (wizard?.step2?.preFrete?.baseRateBRL || 0) + (wizard?.step2?.preFrete?.adValoremBRL || 0) + (wizard?.step2?.preFrete?.grisBRL || 0),
        totalDistanceKm:  wizard?.step2?.preFrete?.distanceKm,
        observations:     wizard?.step1?.notes,
      });
      setWizard(res?.data ?? res);
    } catch (err) { setError('Erro ao submeter: ' + (err?.message ?? '')); }
    finally { setActionLoading(false); }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = await approveWizard(wizardId, 'Aprovado pelo gestor');
      setWizard(res?.data ?? res);
    } catch (err) { setError('Erro ao aprovar: ' + (err?.message ?? '')); }
    finally { setActionLoading(false); }
  };

  const handleReject = async (reason) => {
    setActionLoading(true);
    try {
      const res = await rejectWizard(wizardId, reason);
      setWizard(res?.data ?? res);
    } catch (err) { setError('Erro ao rejeitar: ' + (err?.message ?? '')); }
    finally { setActionLoading(false); }
  };

  const handleActivate = async () => {
    setActionLoading(true);
    try {
      const res = await activateWizard(wizardId);
      const upd = res?.data ?? res;
      setWizard(upd);
      if (upd?.tripId) setTimeout(() => router.push('/apps/fleet/trips'), 2500);
    } catch (err) { setError('Erro ao ativar: ' + (err?.message ?? '')); }
    finally { setActionLoading(false); }
  };

  const handleSaveDraft = async () => {
    if (phase !== 1) return;
    setSaving(true);
    try {
      const payload = {
        ...form1,
        cargo: {
          ...form1.cargo,
          nfNumbers: form1.cargo.nfNumbers
            ? form1.cargo.nfNumbers.split(',').map(s => s.trim()).filter(Boolean)
            : [],
        },
        deadline: form1.deadline ? new Date(form1.deadline).toISOString() : undefined,
      };
      await saveStep(wizardId, 1, payload);
    } catch {}
    setSaving(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 300 }}>
        <Spinner animation="border" className="me-2" />
        <span className="text-muted">Carregando wizard...</span>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 px-3 px-md-4" style={{ maxWidth: 1000, paddingBottom: 90 }}>

      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <Button variant="outline-secondary" size="sm" className="d-flex align-items-center gap-1"
          onClick={() => router.push('/apps/fleet/trips')}>
          <ChevronLeft size={15} /> Voltar
        </Button>
        <div>
          <h4 className="mb-0 fw-bold">Nova Viagem</h4>
          {wizard && (
            <p className="text-muted mb-0" style={{ fontSize: '0.82rem' }}>
              {wizard.wizardNumber} · {fmtDt(wizard.createdAt)}
            </p>
          )}
        </div>
        {wizard?.status && (
          <Badge bg={STATUS_BADGE[wizard.status] || 'secondary'} className="ms-auto px-3 py-2 text-capitalize">
            {wizard.status}
          </Badge>
        )}
      </div>

      {/* Stepper */}
      <StepIndicator phase={phase} />

      {/* Conteúdo */}
      <Card className="border-0 shadow-sm" style={{ borderRadius: 14 }}>
        <Card.Body className="p-4">
          {error && (
            <Alert variant="danger" className="py-2 px-3 mb-4 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
              <AlertTriangle size={14} /> {error}
              <Button variant="link" size="sm" className="ms-auto p-0 text-danger" onClick={() => setError('')}>×</Button>
            </Alert>
          )}

          {phase === 1 && <Phase1 form={form1} onChange={setForm1} onFillTest={() => setForm1(TEST_FORM1())} />}
          {phase === 2 && <Phase2 validation={validation} />}
          {phase === 3 && (
            <Phase3
              form={form3}
              onChange={setForm3}
              order={form1}
              nfes={nfeOptions}
              nfses={nfseOptions}
            />
          )}
          {phase === 4 && (
            <Phase4
              form={form4}
              onChange={setForm4}
              onCalculateRoute={handleCalculateRoute}
              routeResult={routeResult}
              calcRouteLoading={calcRouteLoading}
            />
          )}
          {phase === 5 && wizard && (
            <Phase5
              wizard={wizard}
              onSubmit={handleSubmit}
              onApprove={handleApprove}
              onReject={handleReject}
              onActivate={handleActivate}
              actionLoading={actionLoading}
            />
          )}
        </Card.Body>
      </Card>

      {/* Footer de navegação — sticky acima da barra de IA */}
      <div
        style={{
          position: 'sticky',
          bottom: 60,
          zIndex: 1039,
          background: 'var(--bs-body-bg)',
          borderTop: '1px solid var(--bs-border-color)',
          marginTop: 12,
          padding: '12px 0',
        }}
        className="d-flex align-items-center justify-content-between"
      >
        <Button variant="outline-secondary" size="sm"
          disabled={(phase === 1 || saving) && phase !== 5}
          className="d-flex align-items-center gap-1"
          onClick={() => {
            setError('');
            if (phase === 5) setPhase(4);
            else setPhase(p => Math.max(1, p - 1));
          }}>
          <ChevronLeft size={15} /> {phase === 5 ? 'Voltar ao Operacional' : 'Voltar'}
        </Button>
        <div className="d-flex gap-2">
          {phase === 1 && (
            <Button variant="outline-secondary" size="sm" onClick={handleSaveDraft} disabled={saving}
              className="d-flex align-items-center gap-1">
              <Save size={13} /> Salvar Rascunho
            </Button>
          )}
          {phase < 5 && (
            <Button variant="primary" size="sm" onClick={handleNext}
              disabled={saving || (phase === 2 && !validation)}
              className="d-flex align-items-center gap-1">
              {saving && <Spinner size="sm" animation="border" />}
              {phase === 4 ? 'Ir para Revisão' : 'Próximo'}
              {!saving && <ChevronRight size={15} />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
