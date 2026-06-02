'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card, Row, Col, Button, Form, Alert, Spinner, Badge,
} from 'react-bootstrap';
import {
  Cpu, Smartphone, Settings, User, ChevronLeft, ChevronRight,
  CheckCircle, AlertTriangle, Clipboard, ExternalLink,
} from 'react-feather';
import { apiRequest } from '@/lib/api/client';

// ─── Definição dos 4 tipos de dispositivo ─────────────────────────────────────

const DEVICE_TYPES = [
  {
    kind:        'gps',
    icon:        <Cpu size={28} />,
    label:       'Rastreador GPS Dedicado',
    description: 'Hardware instalado no veículo. Usa IMEI para identificação. Ex: Teltonika, Queclink, Suntech.',
    color:       '#0d6efd',
    bg:          '#e8f0fe',
    requiresImei: true,
    categories:  ['truck', 'van', 'car', 'motorcycle', 'bus'],
  },
  {
    kind:        'smartphone',
    icon:        <Smartphone size={28} />,
    label:       'Smartphone / App',
    description: 'Usa o app Traccar Client (Android/iOS). Ideal para motoristas autônomos ou frotas pequenas.',
    color:       '#198754',
    bg:          '#e6f4ea',
    requiresImei: false,
    categories:  ['car', 'van', 'truck', 'motorcycle'],
  },
  {
    kind:        'obd',
    icon:        <Settings size={28} />,
    label:       'Plug OBD-II',
    description: 'Plugado na porta OBD do veículo. Lê dados do motor (RPM, velocidade, combustível). Ex: BT747, Concox OB22.',
    color:       '#fd7e14',
    bg:          '#fff3e0',
    requiresImei: true,
    categories:  ['car', 'van', 'truck', 'bus'],
  },
  {
    kind:        'personal',
    icon:        <User size={28} />,
    label:       'Dispositivo Pessoal',
    description: 'Wearable ou tracker para pessoas. Ex: relógio GPS, botão de pânico, rádio com GPS.',
    color:       '#6f42c1',
    bg:          '#f3e8ff',
    requiresImei: true,
    categories:  ['person'],
  },
];

const CATEGORIES = [
  { value: 'truck',      label: '🚛 Caminhão' },
  { value: 'van',        label: '🚐 Van / Utilitário' },
  { value: 'car',        label: '🚗 Carro / Passeio' },
  { value: 'motorcycle', label: '🏍️ Moto' },
  { value: 'bus',        label: '🚌 Ônibus' },
  { value: 'person',     label: '🚶 Pessoa' },
];

// Modelos populares por tipo
const MODELS_BY_KIND = {
  gps: [
    'Teltonika FMB920',
    'Teltonika FMC130',
    'Queclink GL300',
    'Queclink GV300',
    'Suntech ST310U',
    'Suntech ST4315',
    'Coban TK103',
    'Coban TK303',
    'Xirgo FT-2230C',
    'Calamp LMU-3030',
    'TrackerKing J16',
    'Outro',
  ],
  smartphone: [
    'Android — Traccar Client',
    'iOS — Traccar Client',
    'Outro',
  ],
  obd: [
    'BT747 (OBD Bluetooth)',
    'Concox OB22',
    'Queclink GV300W OBD',
    'ThinkRace OBD',
    'Outro',
  ],
  personal: [
    'Relógio GPS Genérico',
    'Botão de Pânico GPS',
    'Rádio com GPS',
    'Tracker Pessoal Genérico',
    'Outro',
  ],
};

// ─── Step 1: Seletor de tipo ───────────────────────────────────────────────────

function TypeSelector({ selected, onSelect, isDark }) {
  return (
    <div>
      <h6 className="text-muted mb-3 text-uppercase fw-semibold" style={{ fontSize: '0.75rem', letterSpacing: '0.08em' }}>
        Selecione o tipo de dispositivo
      </h6>
      <Row className="g-3">
        {DEVICE_TYPES.map(t => {
          const bgColor = isDark
            ? selected === t.kind ? `${t.color}22` : '#2d3748'
            : selected === t.kind ? t.bg : '#fff';
          const borderColor = selected === t.kind ? t.color : isDark ? '#404854' : '#dee2e6';
          const textColor = isDark ? '#e2e8f0' : '#212529';
          const descColor = isDark ? '#a0aec0' : '#6c757d';
          return (
            <Col key={t.kind} xs={12} sm={6}>
              <div
                role="button"
                onClick={() => onSelect(t.kind)}
                style={{
                  border: `2px solid ${borderColor}`,
                  borderRadius: 12,
                  padding: '20px 18px',
                  background: bgColor,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: selected === t.kind ? `0 0 0 4px ${t.color}22` : 'none',
                }}
              >
                <div className="d-flex align-items-start gap-3">
                  <div style={{ color: t.color, flexShrink: 0, marginTop: 2, filter: isDark ? 'brightness(1.1)' : 'none' }}>{t.icon}</div>
                  <div>
                    <div className="fw-semibold" style={{ color: selected === t.kind ? t.color : textColor, marginBottom: 4 }}>
                      {t.label}
                    </div>
                    <div style={{ fontSize: '0.82rem', lineHeight: 1.4, color: descColor }}>
                      {t.description}
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}

// ─── Step 2: Formulário dinâmico por tipo ────────────────────────────────────

function DeviceForm({ kind, form, onChange }) {
  const typeDef  = DEVICE_TYPES.find(t => t.kind === kind);
  const models   = MODELS_BY_KIND[kind] ?? [];
  const cats     = CATEGORIES.filter(c => typeDef?.categories?.includes(c.value));

  const set = (field, value) => onChange({ ...form, [field]: value });

  return (
    <div>
      <h6 className="text-muted mb-3 text-uppercase fw-semibold" style={{ fontSize: '0.75rem', letterSpacing: '0.08em' }}>
        Informações do dispositivo
      </h6>

      {/* Nome */}
      <Form.Group className="mb-3">
        <Form.Label className="fw-semibold">
          Nome do dispositivo <span className="text-danger">*</span>
        </Form.Label>
        <Form.Control
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder={kind === 'personal' ? 'Ex: João Silva — Wearable' : 'Ex: Caminhão SBT-001'}
          required
        />
        <Form.Text className="text-muted">
          Nome visível no mapa e relatórios.
        </Form.Text>
      </Form.Group>

      {/* IMEI / Identificador */}
      {typeDef?.requiresImei ? (
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold">
            {kind === 'personal' ? 'Serial / Identificador' : 'IMEI do hardware'}{' '}
            <span className="text-danger">*</span>
          </Form.Label>
          <Form.Control
            value={form.uniqueId}
            onChange={e => set('uniqueId', e.target.value)}
            placeholder={kind === 'personal' ? 'Ex: WEAR-2026-001' : 'Ex: 356938035643809 (15 dígitos)'}
          />
          <Form.Text className="text-muted">
            {kind === 'personal'
              ? 'Identificador único gravado no hardware.'
              : 'O IMEI está na etiqueta do rastreador ou na embalagem.'}
          </Form.Text>
        </Form.Group>
      ) : (
        <Alert variant="info" className="py-2 px-3 mb-3" style={{ fontSize: '0.85rem' }}>
          <strong>Identificador automático:</strong> um código único será gerado automaticamente
          para configurar o app Traccar Client.
        </Alert>
      )}

      <Row className="g-3 mb-3">
        {/* Modelo */}
        <Col xs={12} sm={6}>
          <Form.Group>
            <Form.Label className="fw-semibold">Modelo</Form.Label>
            <Form.Select value={form.model} onChange={e => set('model', e.target.value)}>
              <option value="">Selecione ou informe abaixo</option>
              {models.map(m => (
                <option key={m} value={m === 'Outro' ? '' : m}>{m}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>

        {/* Categoria */}
        <Col xs={12} sm={6}>
          <Form.Group>
            <Form.Label className="fw-semibold">Categoria</Form.Label>
            <Form.Select value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="">Padrão automático</option>
              {cats.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {/* SIM apenas para GPS e OBD */}
      {(kind === 'gps' || kind === 'obd') && (
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold">Número do SIM Card</Form.Label>
          <Form.Control
            value={form.simNumber}
            onChange={e => set('simNumber', e.target.value)}
            placeholder="Ex: 11 98765-4321"
          />
          <Form.Text className="text-muted">Opcional — apenas para registro interno.</Form.Text>
        </Form.Group>
      )}

      {/* Atributos extras */}
      <Row className="g-3">
        <Col xs={12} sm={6}>
          <Form.Group>
            <Form.Label className="fw-semibold">Operadora</Form.Label>
            <Form.Select
              value={form.attributes?.carrier ?? ''}
              onChange={e => set('attributes', { ...form.attributes, carrier: e.target.value })}
            >
              <option value="">Não informado</option>
              <option value="claro">Claro</option>
              <option value="vivo">Vivo</option>
              <option value="tim">TIM</option>
              <option value="oi">Oi</option>
              <option value="algar">Algar</option>
              <option value="sercomtel">Sercomtel</option>
            </Form.Select>
          </Form.Group>
        </Col>

        <Col xs={12} sm={6}>
          <Form.Group>
            <Form.Label className="fw-semibold">Fuso horário</Form.Label>
            <Form.Select
              value={form.attributes?.timezone ?? ''}
              onChange={e => set('attributes', { ...form.attributes, timezone: e.target.value })}
            >
              <option value="">Padrão do servidor</option>
              <option value="America/Sao_Paulo">América/São Paulo (BRT -3)</option>
              <option value="America/Manaus">América/Manaus (AMT -4)</option>
              <option value="America/Belem">América/Belém (BRT -3)</option>
              <option value="America/Fortaleza">América/Fortaleza (BRT -3)</option>
              <option value="America/Recife">América/Recife (BRT -3)</option>
              <option value="America/Cuiaba">América/Cuiabá (AMT -4)</option>
              <option value="America/Porto_Velho">América/Porto Velho (AMT -4)</option>
              <option value="America/Boa_Vista">América/Boa Vista (AMT -4)</option>
              <option value="America/Noronha">Fernando de Noronha (FNT -2)</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
    </div>
  );
}

// ─── Step 3: Resultado / Instruções smartphone ──────────────────────────────

function ResultPanel({ result, kind, onClose }) {
  const [copied, setCopied] = useState(false);

  const copy = (text) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="text-center mb-4">
        <div
          className="mx-auto mb-3 d-flex align-items-center justify-content-center"
          style={{ width: 64, height: 64, borderRadius: '50%', background: '#e6f4ea' }}
        >
          <CheckCircle size={32} color="#198754" />
        </div>
        <h5 className="fw-bold text-success mb-1">Dispositivo criado com sucesso!</h5>
        <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
          ID Traccar: <strong>#{result.device?.id}</strong> — {result.device?.name}
        </p>
      </div>

      {/* Card resumo */}
      <Card className="border-0 mb-3" style={{ background: '#f8f9fa', borderRadius: 10 }}>
        <Card.Body className="py-3 px-3">
          <Row className="g-2 text-center">
            <Col xs={6} sm={3}>
              <div style={{ fontSize: '0.72rem', color: '#6c757d', marginBottom: 2 }}>TIPO</div>
              <div className="fw-semibold" style={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>{result.kind}</div>
            </Col>
            <Col xs={6} sm={3}>
              <div style={{ fontSize: '0.72rem', color: '#6c757d', marginBottom: 2 }}>UNIQUE ID</div>
              <div className="fw-semibold" style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>{result.uniqueId}</div>
            </Col>
            <Col xs={6} sm={3}>
              <div style={{ fontSize: '0.72rem', color: '#6c757d', marginBottom: 2 }}>STATUS</div>
              <Badge bg="secondary">{result.device?.status ?? 'offline'}</Badge>
            </Col>
            <Col xs={6} sm={3}>
              <div style={{ fontSize: '0.72rem', color: '#6c757d', marginBottom: 2 }}>CATEGORIA</div>
              <div className="fw-semibold" style={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>{result.device?.category ?? '—'}</div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Instruções para smartphone */}
      {kind === 'smartphone' && result.setupInstructions && (
        <Card className="border-0 mb-3" style={{ background: '#e8f5e9', borderRadius: 10 }}>
          <Card.Body>
            <h6 className="fw-bold mb-3" style={{ color: '#1b5e20' }}>
              <Smartphone size={16} className="me-2" />
              Configurar app Traccar Client
            </h6>

            <ol className="mb-3 ps-3" style={{ fontSize: '0.87rem', lineHeight: 1.8 }}>
              <li>
                Baixe o app:{' '}
                <a href={result.setupInstructions.appAndroid} target="_blank" rel="noreferrer" className="text-decoration-none">
                  Android <ExternalLink size={12} />
                </a>
                {' / '}
                <a href={result.setupInstructions.appIos} target="_blank" rel="noreferrer" className="text-decoration-none">
                  iOS <ExternalLink size={12} />
                </a>
              </li>
              <li>Abra o app e vá em <strong>Configurações</strong></li>
              <li>
                Em <strong>URL do dispositivo</strong>, informe:{' '}
                <code style={{ background: '#c8e6c9', padding: '1px 6px', borderRadius: 4 }}>
                  {result.setupInstructions.serverUrl}
                </code>
              </li>
              <li>
                Em <strong>Identificador</strong>, informe:
              </li>
            </ol>

            <div
              className="d-flex align-items-center gap-2 p-2 rounded mb-3"
              style={{ background: '#fff', border: '1px solid #a5d6a7' }}
            >
              <code className="flex-grow-1" style={{ fontSize: '1rem', color: '#1b5e20', wordBreak: 'break-all' }}>
                {result.setupInstructions.uniqueId}
              </code>
              <Button
                variant="outline-success"
                size="sm"
                onClick={() => copy(result.setupInstructions.uniqueId)}
                className="flex-shrink-0"
              >
                {copied ? <CheckCircle size={14} /> : <Clipboard size={14} />}
              </Button>
            </div>

            <Alert variant="warning" className="py-2 px-3 mb-0" style={{ fontSize: '0.8rem' }}>
              <AlertTriangle size={14} className="me-1" />
              <strong>Guarde este código!</strong> Ele é único e identifica este dispositivo no servidor Traccar.
            </Alert>
          </Card.Body>
        </Card>
      )}

      {result.linkedVehicle && (
        <Alert variant="success" className="py-2 px-3" style={{ fontSize: '0.85rem' }}>
          <CheckCircle size={14} className="me-1" />
          Dispositivo vinculado ao veículo <strong>{result.linkedVehicle.name ?? result.linkedVehicle.plate}</strong>.
        </Alert>
      )}

      <div className="d-flex gap-2 justify-content-end">
        <Button variant="outline-secondary" onClick={onClose}>
          Fechar
        </Button>
        <Button variant="primary" as="a" href="/apps/fleet/devices">
          Ver todos os dispositivos
        </Button>
      </div>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

const EMPTY_FORM = {
  name:       '',
  uniqueId:   '',
  model:      '',
  category:   '',
  simNumber:  '',
  attributes: {},
};

export default function NewDeviceBody() {
  const router = useRouter();

  const [step,    setStep]    = useState(1); // 1=tipo  2=form  3=resultado
  const [kind,    setKind]    = useState('');
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [result,  setResult]  = useState(null);
  const [isDark,  setIsDark]  = useState(false);

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.getAttribute('data-bs-theme') === 'dark');
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] });
    return () => observer.disconnect();
  }, []);

  const typeDef = DEVICE_TYPES.find(t => t.kind === kind);

  const handleNext = () => {
    if (step === 1 && !kind) { setError('Selecione um tipo de dispositivo.'); return; }
    setError('');
    setStep(s => s + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(s => s - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('O nome do dispositivo é obrigatório.'); return; }
    if (typeDef?.requiresImei && !form.uniqueId.trim()) {
      setError('O IMEI / identificador é obrigatório para este tipo de dispositivo.');
      return;
    }

    setSaving(true); setError('');
    try {
      const payload = {
        kind,
        name:      form.name.trim(),
        uniqueId:  form.uniqueId.trim() || undefined,
        model:     form.model || undefined,
        category:  form.category || undefined,
        simNumber: form.simNumber || undefined,
        attributes: Object.fromEntries(
          Object.entries(form.attributes ?? {}).filter(([, v]) => v !== '' && v != null)
        ),
      };

      const data = await apiRequest('/fleet/traccar-devices', {
        method: 'POST',
        body: payload,
      });

      setResult(data);
      setStep(3);
    } catch (err) {
      setError(err?.message ?? 'Erro ao criar o dispositivo. Verifique os dados e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="container-fluid py-4 px-3 px-md-4" style={{ maxWidth: 820 }}>

      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => router.push('/apps/fleet/devices')}
          className="d-flex align-items-center gap-1"
        >
          <ChevronLeft size={15} /> Voltar
        </Button>
        <div>
          <h4 className="mb-0 fw-bold">Novo Dispositivo GPS</h4>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
            Cadastre um rastreador, smartphone, OBD-II ou tracker pessoal
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="d-flex align-items-center gap-2 mb-4">
        {['Tipo', 'Detalhes', 'Conclusão'].map((label, idx) => {
          const num = idx + 1;
          const active = step === num;
          const done   = step > num;
          return (
            <div key={num} className="d-flex align-items-center gap-2" style={{ flex: num < 3 ? 1 : 'none' }}>
              <div className="d-flex align-items-center gap-2 flex-shrink-0">
                <div
                  className="d-flex align-items-center justify-content-center fw-bold"
                  style={{
                    width: 30, height: 30, borderRadius: '50%', fontSize: '0.8rem',
                    background: done ? '#198754' : active ? '#0d6efd' : '#dee2e6',
                    color: done || active ? '#fff' : '#6c757d',
                  }}
                >
                  {done ? <CheckCircle size={14} /> : num}
                </div>
                <span
                  className="fw-semibold"
                  style={{ fontSize: '0.82rem', color: active ? '#0d6efd' : done ? '#198754' : '#6c757d' }}
                >
                  {label}
                </span>
              </div>
              {num < 3 && (
                <div style={{ flex: 1, height: 2, background: done ? '#198754' : '#dee2e6', borderRadius: 2 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Card principal */}
      <Card className="border-0 shadow-sm" style={{ borderRadius: 14 }}>
        <Card.Body className="p-4">

          {error && (
            <Alert variant="danger" className="py-2 px-3 mb-4" style={{ fontSize: '0.85rem' }}>
              <AlertTriangle size={14} className="me-1" />
              {error}
            </Alert>
          )}

          {/* Step 1 — Tipo */}
          {step === 1 && (
            <TypeSelector selected={kind} onSelect={k => { setKind(k); setError(''); }} isDark={isDark} />
          )}

          {/* Step 2 — Formulário */}
          {step === 2 && (
            <Form onSubmit={handleSubmit}>
              {typeDef && (
                <div
                  className="d-flex align-items-center gap-3 p-3 rounded mb-4"
                  style={{ background: isDark ? `${typeDef.color}15` : typeDef.bg, borderLeft: `4px solid ${typeDef.color}` }}
                >
                  <div style={{ color: typeDef.color }}>{typeDef.icon}</div>
                  <div>
                    <div className="fw-bold" style={{ color: typeDef.color }}>{typeDef.label}</div>
                    <div style={{ fontSize: '0.82rem', color: isDark ? '#a0aec0' : '#6c757d' }}>{typeDef.description}</div>
                  </div>
                </div>
              )}
              <DeviceForm kind={kind} form={form} onChange={setForm} />
            </Form>
          )}

          {/* Step 3 — Resultado */}
          {step === 3 && result && (
            <ResultPanel
              result={result}
              kind={kind}
              onClose={() => router.push('/apps/fleet/devices')}
            />
          )}

          {/* Navegação */}
          {step < 3 && (
            <div className="d-flex justify-content-between mt-4 pt-3 border-top">
              {step > 1 ? (
                <Button variant="outline-secondary" onClick={handleBack} className="d-flex align-items-center gap-1">
                  <ChevronLeft size={15} /> Voltar
                </Button>
              ) : (
                <div />
              )}

              {step === 1 && (
                <Button
                  variant="primary"
                  onClick={handleNext}
                  disabled={!kind}
                  className="d-flex align-items-center gap-1"
                >
                  Continuar <ChevronRight size={15} />
                </Button>
              )}

              {step === 2 && (
                <Button
                  variant="success"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="d-flex align-items-center gap-1"
                >
                  {saving
                    ? <><Spinner animation="border" size="sm" /> Criando...</>
                    : <><CheckCircle size={15} /> Criar dispositivo</>}
                </Button>
              )}
            </div>
          )}

        </Card.Body>
      </Card>
    </div>
  );
}
