'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card, Badge, Table, Button, Form, InputGroup, Row, Col,
  Modal, Spinner, Alert,
} from 'react-bootstrap';
import {
  FileText, Search, X, Plus, Eye, CheckCircle, XCircle,
  RefreshCw, Send, Clock, AlertTriangle, AlertCircle,
} from 'react-feather';
import { ctesService } from '@/lib/api/services/ctes';
import { listFretes } from '@/lib/api/services/fretes';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const UF_OPTIONS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

const IS_PROD = process.env.NEXT_PUBLIC_FOCUS_NFE_HOMOLOGACAO !== 'true';

const fmtCurrency = (v) =>
  v != null ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '–';

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '–';

const errMsg = (e, fallback = 'Erro inesperado') =>
  e?.response?.data?.message ?? e?.message ?? fallback;

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG = {
  pendente:    { bg: 'warning',   text: true,  label: 'Pendente' },
  processando: { bg: 'primary',   text: false, label: 'Processando' },
  autorizado:  { bg: 'success',   text: false, label: 'Autorizado' },
  cancelado:   { bg: 'danger',    text: false, label: 'Cancelado' },
  denegado:    { bg: 'warning',   text: true,  label: 'Denegado' },
  inutilizado: { bg: 'secondary', text: false, label: 'Inutilizado' },
  erro:        { bg: 'danger',    text: false, label: 'Erro SEFAZ' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? { bg: 'secondary', text: false, label: status };
  return (
    <Badge bg={cfg.bg} text={cfg.text ? 'dark' : undefined} className="fw-normal">
      {cfg.label}
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
          <div className="fs-4 fw-bold">{value ?? 0}</div>
          <div className="text-muted small">{label}</div>
        </div>
      </Card.Body>
    </Card>
  );
}

// ─── Frete Search ──────────────────────────────────────────────────────────────

function FreteSearch({ selected, onSelect }) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen]       = useState(false);
  const [busy, setBusy]       = useState(false);
  const debounce              = useRef(null);
  const wrapper               = useRef(null);

  useEffect(() => {
    const handler = e => {
      if (wrapper.current && !wrapper.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setBusy(true);
    try {
      const res = await listFretes({ q, limit: 10 });
      const items = res?.items ?? res?.data?.items ?? [];
      setResults(items);
      setOpen(items.length > 0);
    } catch { setResults([]); }
    finally { setBusy(false); }
  }, []);

  const handleChange = e => {
    const q = e.target.value;
    setQuery(q);
    if (selected) onSelect(null);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => doSearch(q), 350);
  };

  const pick = frete => {
    onSelect(frete);
    setQuery(frete.freteNumber);
    setOpen(false);
  };

  return (
    <div ref={wrapper} style={{ position: 'relative' }}>
      <InputGroup size="sm">
        <InputGroup.Text><Search size={14} /></InputGroup.Text>
        <Form.Control
          placeholder="Digite o número do frete…"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          autoComplete="off"
          isValid={!!selected}
        />
        {busy && (
          <InputGroup.Text>
            <Spinner animation="border" size="sm" style={{ width: 14, height: 14 }} />
          </InputGroup.Text>
        )}
      </InputGroup>
      {selected && (
        <Form.Text className="text-success">
          Frete selecionado: <strong>{selected.freteNumber}</strong>
          {selected.valorTotal != null && ` · ${fmtCurrency(selected.valorTotal)}`}
        </Form.Text>
      )}
      {open && (
        <div className="border rounded shadow-sm bg-white"
          style={{ position: 'absolute', zIndex: 2000, width: '100%', maxHeight: 200, overflowY: 'auto' }}>
          {results.map(f => (
            <div key={f._id}
              className="px-3 py-2 d-flex justify-content-between align-items-center cursor-pointer"
              style={{ cursor: 'pointer' }}
              onMouseDown={() => pick(f)}
              onMouseEnter={e => e.currentTarget.classList.add('bg-light')}
              onMouseLeave={e => e.currentTarget.classList.remove('bg-light')}
            >
              <span className="fw-semibold font-monospace small">{f.freteNumber}</span>
              <span className="text-muted small ms-2 text-truncate">
                {f.remetente?.nome ?? ''}{f.status ? ` · ${f.status}` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

function CreateModal({ show, onHide, onDone }) {
  const [frete, setFrete] = useState(null);
  const [form, setForm] = useState({
    serie: '001', cfop: '6351',
    naturezaOperacao: 'Prestação de serviço de transporte',
    valorTotal: '', valorCarga: '', pesoKg: '',
    remetenteNome: '', remetenteUF: '',
    destinatarioNome: '', destinatarioUF: '',
    observacoes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFreteSelect = f => {
    setFrete(f);
    if (!f) return;
    set('valorTotal',       f.valorTotal     ?? '');
    set('remetenteNome',    f.remetente?.nome ?? '');
    set('remetenteUF',      f.remetente?.uf   ?? '');
    set('destinatarioNome', f.destinatario?.nome ?? '');
    set('destinatarioUF',   f.destinatario?.uf   ?? '');
  };

  const handleClose = () => {
    setFrete(null); setError('');
    setForm({ serie: '001', cfop: '6351', naturezaOperacao: 'Prestação de serviço de transporte',
      valorTotal: '', valorCarga: '', pesoKg: '', remetenteNome: '', remetenteUF: '',
      destinatarioNome: '', destinatarioUF: '', observacoes: '' });
    onHide();
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!frete) { setError('Selecione um frete'); return; }
    setSaving(true); setError('');
    try {
      await ctesService.create({
        freteId:          frete._id,
        serie:            form.serie || '001',
        cfop:             form.cfop  || '6351',
        naturezaOperacao: form.naturezaOperacao || undefined,
        valorTotal:       form.valorTotal ? Number(form.valorTotal) : undefined,
        valorCarga:       form.valorCarga ? Number(form.valorCarga) : undefined,
        pesoKg:           form.pesoKg     ? Number(form.pesoKg)     : undefined,
        remetente:     (form.remetenteNome || form.remetenteUF)
          ? { nome: form.remetenteNome || undefined, uf: form.remetenteUF || undefined } : undefined,
        destinatario:  (form.destinatarioNome || form.destinatarioUF)
          ? { nome: form.destinatarioNome || undefined, uf: form.destinatarioUF || undefined } : undefined,
        observacoes: form.observacoes || undefined,
      });
      handleClose(); onDone();
    } catch (e) { setError(errMsg(e, 'Erro ao criar CT-e')); }
    finally { setSaving(false); }
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="fs-6 text-dark">
          <FileText size={16} className="me-2 text-primary" />Novo CT-e
        </Modal.Title>
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
          <Row className="g-3">
            <Col xs={12}>
              <Form.Label className="small fw-semibold">Frete *</Form.Label>
              <FreteSearch selected={frete} onSelect={handleFreteSelect} />
            </Col>
            <Col md={3}>
              <Form.Label className="small fw-semibold">Série</Form.Label>
              <Form.Control size="sm" value={form.serie} onChange={e => set('serie', e.target.value)} />
            </Col>
            <Col md={3}>
              <Form.Label className="small fw-semibold">CFOP</Form.Label>
              <Form.Control size="sm" value={form.cfop} onChange={e => set('cfop', e.target.value)} />
            </Col>
            <Col md={6}>
              <Form.Label className="small fw-semibold">Natureza da operação</Form.Label>
              <Form.Control size="sm" value={form.naturezaOperacao} onChange={e => set('naturezaOperacao', e.target.value)} />
            </Col>
            <Col md={4}>
              <Form.Label className="small fw-semibold">Valor total (R$)</Form.Label>
              <Form.Control size="sm" type="number" step="0.01" min="0" value={form.valorTotal} onChange={e => set('valorTotal', e.target.value)} />
            </Col>
            <Col md={4}>
              <Form.Label className="small fw-semibold">Valor carga (R$)</Form.Label>
              <Form.Control size="sm" type="number" step="0.01" min="0" value={form.valorCarga} onChange={e => set('valorCarga', e.target.value)} />
            </Col>
            <Col md={4}>
              <Form.Label className="small fw-semibold">Peso (kg)</Form.Label>
              <Form.Control size="sm" type="number" step="0.01" min="0" value={form.pesoKg} onChange={e => set('pesoKg', e.target.value)} />
            </Col>
            <Col xs={12}><hr className="my-1" /><small className="fw-semibold text-muted">Remetente</small></Col>
            <Col md={9}>
              <Form.Label className="small fw-semibold">Nome / Razão Social</Form.Label>
              <Form.Control size="sm" value={form.remetenteNome} onChange={e => set('remetenteNome', e.target.value)} />
            </Col>
            <Col md={3}>
              <Form.Label className="small fw-semibold">UF</Form.Label>
              <Form.Control size="sm" maxLength={2} value={form.remetenteUF}
                onChange={e => set('remetenteUF', e.target.value.toUpperCase())} />
            </Col>
            <Col xs={12}><hr className="my-1" /><small className="fw-semibold text-muted">Destinatário</small></Col>
            <Col md={9}>
              <Form.Label className="small fw-semibold">Nome / Razão Social</Form.Label>
              <Form.Control size="sm" value={form.destinatarioNome} onChange={e => set('destinatarioNome', e.target.value)} />
            </Col>
            <Col md={3}>
              <Form.Label className="small fw-semibold">UF</Form.Label>
              <Form.Control size="sm" maxLength={2} value={form.destinatarioUF}
                onChange={e => set('destinatarioUF', e.target.value.toUpperCase())} />
            </Col>
            <Col xs={12}>
              <Form.Label className="small fw-semibold">Observações</Form.Label>
              <Form.Control as="textarea" rows={2} size="sm" value={form.observacoes} onChange={e => set('observacoes', e.target.value)} />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={handleClose}>Cancelar</Button>
          <Button variant="primary" size="sm" type="submit" disabled={saving || !frete}>
            {saving ? <><Spinner size="sm" animation="border" className="me-1" />Criando…</> : 'Criar CT-e'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

// ─── Emitir SEFAZ Modal ───────────────────────────────────────────────────────

const EMITIR_INIT = {
  municipio_envio: '', codigo_municipio_envio: '', uf_envio: 'SP',
  municipio_inicio: '', codigo_municipio_inicio: '', uf_inicio: 'SP',
  municipio_fim: '', codigo_municipio_fim: '', uf_fim: 'PR',
  cnpj_emitente: '', inscricao_estadual_emitente: '', nome_emitente: '',
  logradouro_emitente: '', numero_emitente: '', bairro_emitente: '',
  municipio_emitente: '', codigo_municipio_emitente: '', uf_emitente: 'SP', cep_emitente: '',
  cnpj_remetente: '', nome_remetente: '', logradouro_remetente: '', numero_remetente: '',
  bairro_remetente: '', municipio_remetente: '', codigo_municipio_remetente: '', uf_remetente: 'SP', cep_remetente: '',
  cnpj_destinatario: '', nome_destinatario: '', logradouro_destinatario: '', numero_destinatario: '',
  bairro_destinatario: '', municipio_destinatario: '', codigo_municipio_destinatario: '', uf_destinatario: 'PR', cep_destinatario: '',
  valor_total: '', valor_receber: '', valor_carga: '', peso_bruto: '',
  icms_situacao_tributaria: '00', tipo_documento: '1', modal: '01', tipo_servico: '0', tomador: '0',
  rntrc: '',
};

function EmitirModal({ show, cte, onHide, onDone }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (cte) {
      setForm({
        ...EMITIR_INIT,
        cnpj_remetente:       cte.remetente?.cnpj  ?? '',
        nome_remetente:       cte.remetente?.nome  ?? '',
        municipio_remetente:  cte.remetente?.cidade ?? '',
        uf_remetente:         cte.remetente?.uf    ?? 'SP',
        cnpj_destinatario:    cte.destinatario?.cnpj  ?? '',
        nome_destinatario:    cte.destinatario?.nome  ?? '',
        municipio_destinatario: cte.destinatario?.cidade ?? '',
        uf_destinatario:      cte.destinatario?.uf  ?? 'PR',
        valor_total:          cte.valorTotal ?? '',
        valor_receber:        cte.valorTotal ?? '',
        valor_carga:          cte.valorCarga ?? '',
        peso_bruto:           cte.pesoKg    ?? '',
      });
    }
  }, [cte]);

  const handleClose = () => { setError(''); onHide(); };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await ctesService.emitir(cte._id, {
        cfop: cte.cfop ?? '6351',
        natureza_operacao: cte.naturezaOperacao ?? 'Prestação de serviço de transporte',
        data_emissao: new Date().toISOString(),
        tipo_documento: form.tipo_documento, modal: form.modal,
        ...(form.modal === '01' ? { modal_rodoviario: { rntrc: form.rntrc.replace(/\D/g,'') } } : {}),
        tipo_servico: form.tipo_servico, tomador: form.tomador,
        icms_situacao_tributaria: form.icms_situacao_tributaria,
        municipio_envio: form.municipio_envio, codigo_municipio_envio: form.codigo_municipio_envio, uf_envio: form.uf_envio,
        municipio_inicio: form.municipio_inicio, codigo_municipio_inicio: form.codigo_municipio_inicio, uf_inicio: form.uf_inicio,
        municipio_fim: form.municipio_fim, codigo_municipio_fim: form.codigo_municipio_fim, uf_fim: form.uf_fim,
        cnpj_emitente: form.cnpj_emitente.replace(/\D/g,''),
        inscricao_estadual_emitente: form.inscricao_estadual_emitente || undefined,
        nome_emitente: form.nome_emitente, logradouro_emitente: form.logradouro_emitente,
        numero_emitente: form.numero_emitente, bairro_emitente: form.bairro_emitente,
        codigo_municipio_emitente: form.codigo_municipio_emitente,
        municipio_emitente: form.municipio_emitente, uf_emitente: form.uf_emitente,
        cep_emitente: form.cep_emitente.replace(/\D/g,''),
        cnpj_remetente: form.cnpj_remetente.replace(/\D/g,'') || undefined,
        nome_remetente: form.nome_remetente, logradouro_remetente: form.logradouro_remetente,
        numero_remetente: form.numero_remetente, bairro_remetente: form.bairro_remetente,
        codigo_municipio_remetente: form.codigo_municipio_remetente,
        municipio_remetente: form.municipio_remetente, uf_remetente: form.uf_remetente,
        cep_remetente: form.cep_remetente.replace(/\D/g,''),
        cnpj_destinatario: form.cnpj_destinatario.replace(/\D/g,'') || undefined,
        nome_destinatario: form.nome_destinatario, logradouro_destinatario: form.logradouro_destinatario,
        numero_destinatario: form.numero_destinatario, bairro_destinatario: form.bairro_destinatario,
        codigo_municipio_destinatario: form.codigo_municipio_destinatario,
        municipio_destinatario: form.municipio_destinatario, uf_destinatario: form.uf_destinatario,
        cep_destinatario: form.cep_destinatario.replace(/\D/g,''),
        valor_total:   Number(form.valor_total),
        valor_receber: Number(form.valor_receber),
        valor_carga:   form.valor_carga  ? Number(form.valor_carga)  : undefined,
        peso_bruto:    form.peso_bruto   ? Number(form.peso_bruto)   : undefined,
      });
      handleClose(); onDone();
    } catch (e) { setError(errMsg(e, 'Erro ao enviar para o SEFAZ')); }
    finally { setSaving(false); }
  };

  const UF = UF_OPTIONS.map(u => <option key={u} value={u}>{u}</option>);

  const F = ({ label, k, type = 'text', required = false, maxLength, md = 4 }) => (
    <Col md={md}>
      <Form.Label className="small fw-semibold">{label}{required && ' *'}</Form.Label>
      <Form.Control size="sm" type={type} required={required} maxLength={maxLength}
        value={form[k] ?? ''} onChange={e => set(k, e.target.value)} />
    </Col>
  );
  const S = ({ label, k, options, md = 4 }) => (
    <Col md={md}>
      <Form.Label className="small fw-semibold">{label}</Form.Label>
      <Form.Select size="sm" value={form[k] ?? ''} onChange={e => set(k, e.target.value)}>
        {options}
      </Form.Select>
    </Col>
  );

  return (
    <Modal show={show} onHide={handleClose} centered size="xl" scrollable>
      <Modal.Header closeButton>
        <Modal.Title className="fs-6 text-dark">
          <Send size={15} className="me-2 text-indigo-600" />
          Emitir CT-e no SEFAZ — {cte?.cteNumber}
          {!IS_PROD && (
            <Badge bg="warning" text="dark" className="ms-2 fw-normal fs-7">Homologação</Badge>
          )}
        </Modal.Title>
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
          <Row className="g-3">
            {/* Config */}
            <Col xs={12}><small className="fw-semibold text-muted">Configuração</small></Col>
            <S label="Tipo documento" k="tipo_documento" md={3} options={<>
              <option value="1">Normal</option>
              <option value="3">Substituição</option>
              <option value="4">Anulação</option>
            </>} />
            <S label="Modal" k="modal" md={3} options={<>
              <option value="01">Rodoviário</option>
              <option value="02">Aéreo</option>
              <option value="03">Aquaviário</option>
              <option value="04">Ferroviário</option>
            </>} />
            <S label="Tipo serviço" k="tipo_servico" md={3} options={<>
              <option value="0">Normal</option>
              <option value="1">Subcontratação</option>
              <option value="2">Redespacho</option>
            </>} />
            <S label="Tomador" k="tomador" md={3} options={<>
              <option value="0">Remetente</option>
              <option value="1">Expedidor</option>
              <option value="2">Recebedor</option>
              <option value="3">Destinatário</option>
            </>} />
            {form.modal === '01' && (
              <F label="RNTRC" k="rntrc" required maxLength={8} md={3} />
            )}

            {/* Localidades */}
            <Col xs={12}><hr className="my-1" /><small className="fw-semibold text-muted">Localidades</small></Col>
            <F label="Município envio" k="municipio_envio" required md={4} />
            <F label="Cód. IBGE envio" k="codigo_municipio_envio" required maxLength={7} md={2} />
            <S label="UF envio" k="uf_envio" md={2} options={UF} />
            <F label="Município início" k="municipio_inicio" required md={4} />
            <F label="Cód. IBGE início" k="codigo_municipio_inicio" required maxLength={7} md={2} />
            <S label="UF início" k="uf_inicio" md={2} options={UF} />
            <F label="Município fim" k="municipio_fim" required md={4} />
            <F label="Cód. IBGE fim" k="codigo_municipio_fim" required maxLength={7} md={2} />
            <S label="UF fim" k="uf_fim" md={2} options={UF} />

            {/* Emitente */}
            <Col xs={12}><hr className="my-1" /><small className="fw-semibold text-muted">Emitente (Transportadora)</small></Col>
            <F label="CNPJ" k="cnpj_emitente" required maxLength={18} md={3} />
            <F label="IE" k="inscricao_estadual_emitente" maxLength={14} md={2} />
            <F label="Razão Social" k="nome_emitente" required md={4} />
            <F label="CEP" k="cep_emitente" required maxLength={9} md={3} />
            <F label="Logradouro" k="logradouro_emitente" required md={5} />
            <F label="Número" k="numero_emitente" required maxLength={6} md={2} />
            <F label="Bairro" k="bairro_emitente" required md={3} />
            <F label="Município" k="municipio_emitente" required md={4} />
            <F label="Cód. IBGE" k="codigo_municipio_emitente" required maxLength={7} md={2} />
            <S label="UF" k="uf_emitente" md={2} options={UF} />

            {/* Remetente */}
            <Col xs={12}><hr className="my-1" /><small className="fw-semibold text-muted">Remetente</small></Col>
            <F label="CNPJ/CPF" k="cnpj_remetente" maxLength={18} md={3} />
            <F label="Nome / Razão Social" k="nome_remetente" required md={5} />
            <F label="CEP" k="cep_remetente" required maxLength={9} md={2} />
            <F label="Logradouro" k="logradouro_remetente" required md={5} />
            <F label="Número" k="numero_remetente" required maxLength={6} md={2} />
            <F label="Bairro" k="bairro_remetente" required md={3} />
            <F label="Município" k="municipio_remetente" required md={4} />
            <F label="Cód. IBGE" k="codigo_municipio_remetente" required maxLength={7} md={2} />
            <S label="UF" k="uf_remetente" md={2} options={UF} />

            {/* Destinatário */}
            <Col xs={12}><hr className="my-1" /><small className="fw-semibold text-muted">Destinatário</small></Col>
            <F label="CNPJ/CPF" k="cnpj_destinatario" maxLength={18} md={3} />
            <F label="Nome / Razão Social" k="nome_destinatario" required md={5} />
            <F label="CEP" k="cep_destinatario" required maxLength={9} md={2} />
            <F label="Logradouro" k="logradouro_destinatario" required md={5} />
            <F label="Número" k="numero_destinatario" required maxLength={6} md={2} />
            <F label="Bairro" k="bairro_destinatario" required md={3} />
            <F label="Município" k="municipio_destinatario" required md={4} />
            <F label="Cód. IBGE" k="codigo_municipio_destinatario" required maxLength={7} md={2} />
            <S label="UF" k="uf_destinatario" md={2} options={UF} />

            {/* Valores */}
            <Col xs={12}><hr className="my-1" /><small className="fw-semibold text-muted">Valores e ICMS</small></Col>
            <F label="Valor total (R$)" k="valor_total" type="number" required md={3} />
            <F label="Valor a receber (R$)" k="valor_receber" type="number" required md={3} />
            <F label="Valor carga (R$)" k="valor_carga" type="number" md={3} />
            <F label="Peso bruto (kg)" k="peso_bruto" type="number" md={3} />
            <S label="ICMS CST" k="icms_situacao_tributaria" md={4} options={<>
              <option value="00">00 – Tributação normal ICMS</option>
              <option value="20">20 – Com redução de BC</option>
              <option value="45">45 – Isentas / não tributadas</option>
              <option value="60">60 – ICMS cobrado anteriormente</option>
              <option value="90">90 – Outros</option>
            </>} />
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={handleClose}>Cancelar</Button>
          <Button variant="primary" size="sm" type="submit" disabled={saving}>
            {saving ? <><Spinner size="sm" animation="border" className="me-1" />Enviando…</> : <><Send size={14} className="me-1" />Enviar ao SEFAZ</>}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

// ─── Authorize Modal ──────────────────────────────────────────────────────────

function AuthorizeModal({ show, cte, onHide, onDone }) {
  const [chave, setChave]         = useState('');
  const [protocolo, setProtocolo] = useState('');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const handleClose = () => { setChave(''); setProtocolo(''); setError(''); onHide(); };

  const handleSubmit = async e => {
    e.preventDefault();
    const digits = chave.replace(/\D/g, '');
    if (digits.length !== 44) { setError('A chave de acesso deve ter 44 dígitos'); return; }
    if (!protocolo.trim())    { setError('Protocolo é obrigatório'); return; }
    setSaving(true); setError('');
    try {
      await ctesService.authorize(cte._id, { chaveAcesso: digits, protocolo: protocolo.trim() });
      handleClose(); onDone();
    } catch (e) { setError(errMsg(e, 'Erro ao autorizar CT-e')); }
    finally { setSaving(false); }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title className="fs-6 text-dark">
          <CheckCircle size={15} className="me-2 text-success" />Autorizar Manualmente — {cte?.cteNumber}
        </Modal.Title>
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
          <Row className="g-3">
            <Col xs={12}>
              <Form.Label className="small fw-semibold">Chave de acesso (44 dígitos) *</Form.Label>
              <Form.Control size="sm" className="font-monospace" required
                placeholder="00000000000000000000000000000000000000000000"
                value={chave} onChange={e => setChave(e.target.value)} />
              <Form.Text className={chave.replace(/\D/g,'').length === 44 ? 'text-success' : 'text-muted'}>
                {chave.replace(/\D/g,'').length}/44 dígitos
              </Form.Text>
            </Col>
            <Col xs={12}>
              <Form.Label className="small fw-semibold">Protocolo SEFAZ *</Form.Label>
              <Form.Control size="sm" required value={protocolo} onChange={e => setProtocolo(e.target.value)} />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={handleClose}>Cancelar</Button>
          <Button variant="success" size="sm" type="submit" disabled={saving}>
            {saving ? <Spinner size="sm" animation="border" /> : 'Autorizar'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

// ─── Cancel Modal ─────────────────────────────────────────────────────────────

function CancelModal({ show, cte, onHide, onDone }) {
  const [motivo, setMotivo]       = useState('');
  const [protocolo, setProtocolo] = useState('');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const handleClose = () => { setMotivo(''); setProtocolo(''); setError(''); onHide(); };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!motivo.trim()) { setError('Motivo é obrigatório'); return; }
    setSaving(true); setError('');
    try {
      await ctesService.cancel(cte._id, {
        motivoCancelamento:    motivo.trim(),
        protocoloCancelamento: protocolo || undefined,
      });
      handleClose(); onDone();
    } catch (e) { setError(errMsg(e, 'Erro ao cancelar CT-e')); }
    finally { setSaving(false); }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title className="fs-6 text-dark">
          <XCircle size={15} className="me-2 text-danger" />Cancelar CT-e — {cte?.cteNumber}
        </Modal.Title>
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
          <Row className="g-3">
            <Col xs={12}>
              <Form.Label className="small fw-semibold">Motivo do cancelamento *</Form.Label>
              <Form.Control size="sm" required value={motivo} onChange={e => setMotivo(e.target.value)} />
            </Col>
            <Col xs={12}>
              <Form.Label className="small fw-semibold">Protocolo de cancelamento</Form.Label>
              <Form.Control size="sm" value={protocolo} onChange={e => setProtocolo(e.target.value)} />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={handleClose}>Fechar</Button>
          <Button variant="danger" size="sm" type="submit" disabled={saving}>
            {saving ? <Spinner size="sm" animation="border" /> : 'Cancelar CT-e'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({ show, cte, onHide }) {
  if (!cte) return null;
  const chaveFormatted = cte.chaveAcesso
    ? cte.chaveAcesso.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
    : '–';

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="fs-6 text-dark">
          <Eye size={15} className="me-2 text-secondary" />
          {cte.cteNumber} <StatusBadge status={cte.status} />
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {cte.status === 'erro' && cte.focusNfeErro && (
          <Alert variant="danger" className="py-2 small">
            <strong>Erro SEFAZ:</strong>
            <pre className="mb-0 mt-1 font-monospace" style={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
              {cte.focusNfeErro}
            </pre>
          </Alert>
        )}
        <Row className="g-2 small">
          {[
            ['Frete',          <span key="frete" className="font-monospace">{cte.freteNumber ?? '–'}</span>],
            ['Status',         <StatusBadge key="status" status={cte.status} />],
            ['CFOP',           cte.cfop ?? '–'],
            ['Série',          cte.serie ?? '–'],
            ['Emissão',        fmtDate(cte.dataEmissao)],
            ['Valor total',    fmtCurrency(cte.valorTotal)],
            ['Valor carga',    fmtCurrency(cte.valorCarga)],
            ['Peso (kg)',      cte.pesoKg ?? '–'],
          ].map(([label, val]) => (
            <Col xs={6} md={4} key={label}>
              <div className="text-muted">{label}</div>
              <div className="fw-semibold">{val}</div>
            </Col>
          ))}
          {cte.remetente?.nome && (
            <Col xs={6} md={4}>
              <div className="text-muted">Remetente</div>
              <div className="fw-semibold">{cte.remetente.nome} {cte.remetente.uf ? `(${cte.remetente.uf})` : ''}</div>
            </Col>
          )}
          {cte.destinatario?.nome && (
            <Col xs={6} md={4}>
              <div className="text-muted">Destinatário</div>
              <div className="fw-semibold">{cte.destinatario.nome} {cte.destinatario.uf ? `(${cte.destinatario.uf})` : ''}</div>
            </Col>
          )}
          {cte.protocolo && (
            <Col xs={6} md={4}>
              <div className="text-muted">Protocolo SEFAZ</div>
              <div className="fw-semibold font-monospace">{cte.protocolo}</div>
            </Col>
          )}
          {cte.autorizadoEm && (
            <Col xs={6} md={4}>
              <div className="text-muted">Autorizado em</div>
              <div className="fw-semibold">{fmtDate(cte.autorizadoEm)}</div>
            </Col>
          )}
          {cte.motivoCancelamento && (
            <Col xs={12}>
              <div className="text-muted">Motivo cancelamento</div>
              <div className="fw-semibold text-danger">{cte.motivoCancelamento}</div>
            </Col>
          )}
          {cte.focusNfeStatus && (
            <Col xs={6} md={4}>
              <div className="text-muted">Status Focus NFe</div>
              <div className="fw-semibold font-monospace small">{cte.focusNfeStatus}</div>
            </Col>
          )}
          <Col xs={12}>
            <div className="text-muted">Chave de acesso</div>
            <div className="font-monospace small bg-light p-2 rounded mt-1" style={{ wordBreak: 'break-all' }}>
              {chaveFormatted}
            </div>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" size="sm" onClick={onHide}>Fechar</Button>
      </Modal.Footer>
    </Modal>
  );
}

// ─── Sync Button ──────────────────────────────────────────────────────────────

function SyncButton({ cteId, onDone }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState('');

  const handle = async () => {
    setBusy(true); setErr('');
    try { await ctesService.sincronizar(cteId); onDone(); }
    catch (e) { setErr(errMsg(e, 'Falha ao sincronizar')); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <Button variant="outline-primary" size="sm" onClick={handle} disabled={busy}
        className="d-flex align-items-center gap-1">
        {busy ? <Spinner size="sm" animation="border" style={{ width: 12, height: 12 }} /> : <RefreshCw size={12} />}
        Sincronizar
      </Button>
      {err && <div className="text-danger" style={{ fontSize: '0.7rem' }}>{err}</div>}
    </div>
  );
}

// ─── CtesBody ─────────────────────────────────────────────────────────────────

export default function CtesBody() {
  const [ctes, setCtes]     = useState([]);
  const [stats, setStats]   = useState(null);
  const [total, setTotal]   = useState(0);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [showCreate,   setShowCreate]   = useState(false);
  const [emitirCte,    setEmitirCte]    = useState(null);
  const [authorizeCte, setAuthorizeCte] = useState(null);
  const [cancelCte,    setCancelCte]    = useState(null);
  const [detailCte,    setDetailCte]    = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const [listRes, statsRes] = await Promise.all([
        ctesService.list({ ...params, limit: 100 }),
        ctesService.stats(),
      ]);
      const payload = listRes.data ?? listRes;
      setCtes(payload?.items ?? []);
      setTotal(payload?.total ?? 0);
      setStats(statsRes.data ?? statsRes);
    } catch (err) {
      setCtes([]);
      setTotal(0);
      setStats(null);
      setLoadError(errMsg(err, 'Não foi possível carregar CT-e da API.'));
    }
    finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  const handleDone = () => load();

  const filtered = ctes.filter(c =>
    !search ||
    c.cteNumber?.toLowerCase().includes(search.toLowerCase()) ||
    c.freteNumber?.toLowerCase().includes(search.toLowerCase()),
  );

  const byStatus = stats?.byStatus ?? {};

  return (
    <div className="hk-pg-body">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-1">CT-e</h3>
          <p className="text-muted mb-0">Conhecimento de Transporte Eletrônico</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} className="me-1" /> Novo CT-e
        </Button>
      </div>

      {/* KPIs */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={2}>
          <KpiCard label="Total" value={stats?.total ?? 0} icon={<FileText size={20} />} color="primary" />
        </Col>
        <Col xs={6} md={2}>
          <KpiCard label="Pendentes" value={byStatus.pendente ?? stats?.pendente ?? 0} icon={<Clock size={20} />} color="warning" />
        </Col>
        <Col xs={6} md={2}>
          <KpiCard label="Processando" value={byStatus.processando ?? 0} icon={<RefreshCw size={20} />} color="info" />
        </Col>
        <Col xs={6} md={2}>
          <KpiCard label="Autorizados" value={byStatus.autorizado ?? stats?.autorizado ?? 0} icon={<CheckCircle size={20} />} color="success" />
        </Col>
        <Col xs={6} md={2}>
          <KpiCard label="Cancelados" value={byStatus.cancelado ?? 0} icon={<XCircle size={20} />} color="danger" />
        </Col>
        <Col xs={6} md={2}>
          <KpiCard label="Com erro" value={byStatus.erro ?? 0} icon={<AlertCircle size={20} />} color="danger" />
        </Col>
      </Row>

      {/* Filtros */}
      <Card className="shadow-sm mb-3">
        <Card.Body className="py-2">
          <Row className="g-2 align-items-center">
            <Col md={5}>
              <InputGroup size="sm">
                <InputGroup.Text><Search size={14} /></InputGroup.Text>
                <Form.Control placeholder="Buscar por número CT-e ou frete…"
                  value={search} onChange={e => setSearch(e.target.value)} />
                {search && (
                  <Button variant="outline-secondary" onClick={() => setSearch('')}>
                    <X size={14} />
                  </Button>
                )}
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
            <Col md={4} className="text-end">
              <small className="text-muted">{filtered.length} de {total} CT-es</small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabela */}
      <Card className="shadow-sm">
        {loadError && (
          <Card.Body className="border-bottom">
            <Alert variant="danger" className="mb-0 py-2 small">
              {loadError}
            </Alert>
          </Card.Body>
        )}
        {loading ? (
          <Card.Body className="text-center py-5">
            <Spinner animation="border" variant="primary" />
          </Card.Body>
        ) : filtered.length === 0 ? (
          <Card.Body className="text-center py-5 text-muted">
            <AlertTriangle size={32} className="mb-2 opacity-50" />
            <div>Nenhum CT-e encontrado</div>
          </Card.Body>
        ) : (
          <div className="table-responsive">
            <Table hover className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th className="small fw-semibold">Número</th>
                  <th className="small fw-semibold">Frete</th>
                  <th className="small fw-semibold">CFOP</th>
                  <th className="small fw-semibold">Valor</th>
                  <th className="small fw-semibold">Status</th>
                  <th className="small fw-semibold">Protocolo</th>
                  <th className="small fw-semibold">Emissão</th>
                  <th className="small fw-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c._id}>
                    <td className="font-monospace small fw-semibold">{c.cteNumber}</td>
                    <td className="font-monospace small text-muted">{c.freteNumber ?? '–'}</td>
                    <td className="small">{c.cfop ?? '–'}</td>
                    <td className="small">{fmtCurrency(c.valorTotal)}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td className="font-monospace small text-muted">{c.protocolo ?? '–'}</td>
                    <td className="small">{fmtDate(c.dataEmissao)}</td>
                    <td>
                      <div className="d-flex gap-1 flex-wrap">
                        <Button variant="outline-secondary" size="sm"
                          onClick={() => setDetailCte(c)}>
                          <Eye size={13} />
                        </Button>
                        {(c.status === 'pendente' || c.status === 'erro') && (
                          <Button variant="outline-primary" size="sm"
                            onClick={() => setEmitirCte(c)}
                            title="Emitir via SEFAZ">
                            <Send size={13} />
                          </Button>
                        )}
                        {(c.status === 'pendente' || c.status === 'erro') && (
                          <Button variant="outline-success" size="sm"
                            onClick={() => setAuthorizeCte(c)}
                            title="Autorizar manualmente">
                            <CheckCircle size={13} />
                          </Button>
                        )}
                        {c.status === 'processando' && (
                          <SyncButton cteId={c._id} onDone={handleDone} />
                        )}
                        {c.status === 'autorizado' && (
                          <Button variant="outline-danger" size="sm"
                            onClick={() => setCancelCte(c)}
                            title="Cancelar">
                            <XCircle size={13} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card>

      {/* Modals */}
      <CreateModal
        show={showCreate}
        onHide={() => setShowCreate(false)}
        onDone={handleDone}
      />
      <EmitirModal
        show={!!emitirCte}
        cte={emitirCte}
        onHide={() => setEmitirCte(null)}
        onDone={handleDone}
      />
      <AuthorizeModal
        show={!!authorizeCte}
        cte={authorizeCte}
        onHide={() => setAuthorizeCte(null)}
        onDone={handleDone}
      />
      <CancelModal
        show={!!cancelCte}
        cte={cancelCte}
        onHide={() => setCancelCte(null)}
        onDone={handleDone}
      />
      <DetailModal
        show={!!detailCte}
        cte={detailCte}
        onHide={() => setDetailCte(null)}
      />
    </div>
  );
}
