'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Card, Badge, Table, Button, Form, InputGroup, Row, Col, Modal,
  Spinner, Alert, Tabs, Tab, ListGroup,
} from 'react-bootstrap';
import {
  Search, X, Plus, Eye, Edit2, Trash2,
  User, Users, CheckCircle, XCircle, AlertTriangle,
  Phone, Mail, MapPin, DollarSign, ChevronRight,
} from 'react-feather';
import SimpleBar from 'simplebar-react';
import {
  getClienteStats,
  listClientes,
  getCliente,
  createCliente,
  updateCliente,
  deleteCliente,
} from '@/lib/api/services/clientes';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtCNPJ = (v) => {
  if (!v) return '–';
  const d = v.replace(/\D/g, '');
  return d.length === 14
    ? d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    : v;
};

const fmtPhone = (v) => {
  if (!v) return '–';
  const d = v.replace(/\D/g, '');
  return d.length === 11
    ? d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    : d.length === 10
    ? d.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    : v;
};

// ─── Enums ────────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  active:   { bg: 'success',   label: 'Ativo',     icon: <CheckCircle size={11} /> },
  inactive: { bg: 'secondary', label: 'Inativo',   icon: <XCircle size={11} /> },
  blocked:  { bg: 'danger',    label: 'Bloqueado', icon: <AlertTriangle size={11} /> },
};

const PAYMENT_METHODS = [
  { value: 'boleto',       label: 'Boleto bancário' },
  { value: 'pix',          label: 'PIX' },
  { value: 'transferencia',label: 'Transferência' },
  { value: 'cheque',       label: 'Cheque' },
  { value: 'credito',      label: 'Crédito em conta' },
];

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.active;
  return (
    <Badge bg={cfg.bg} className="d-inline-flex align-items-center gap-1">
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

// ─── ClienteForm ──────────────────────────────────────────────────────────────

function ClienteForm({ initial = {}, onSubmit, saving, err }) {
  const [form, setForm] = useState({
    razaoSocial: '', nomeFantasia: '', tipo: 'pj',
    cnpj: '', cpf: '',
    email: '', phone: '', website: '',
    street: '', number: '', complement: '', neighborhood: '',
    city: '', state: '', zipCode: '',
    paymentTermDays: '', creditLimitBRL: '', paymentMethod: '',
    notes: '',
    ...initial,
    street:       initial.address?.street       ?? '',
    number:       initial.address?.number       ?? '',
    complement:   initial.address?.complement   ?? '',
    neighborhood: initial.address?.neighborhood ?? '',
    city:         initial.address?.city         ?? '',
    state:        initial.address?.state        ?? '',
    zipCode:      initial.address?.zipCode      ?? '',
    paymentTermDays:  initial.financial?.paymentTermDays  ?? '',
    creditLimitBRL:   initial.financial?.creditLimitBRL   ?? '',
    paymentMethod:    initial.financial?.paymentMethod    ?? '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      razaoSocial:  form.razaoSocial,
      nomeFantasia: form.nomeFantasia || undefined,
      tipo:         form.tipo,
      cnpj:         form.tipo === 'pj' ? form.cnpj.replace(/\D/g, '') || undefined : undefined,
      cpf:          form.tipo === 'pf' ? form.cpf.replace(/\D/g, '')  || undefined : undefined,
      email:        form.email   || undefined,
      phone:        form.phone   || undefined,
      website:      form.website || undefined,
      address: (form.street || form.city) ? {
        street:       form.street       || undefined,
        number:       form.number       || undefined,
        complement:   form.complement   || undefined,
        neighborhood: form.neighborhood || undefined,
        city:         form.city         || undefined,
        state:        form.state        || undefined,
        zipCode:      form.zipCode      || undefined,
      } : undefined,
      financial: (form.paymentTermDays || form.creditLimitBRL || form.paymentMethod) ? {
        paymentTermDays: form.paymentTermDays ? Number(form.paymentTermDays) : undefined,
        creditLimitBRL:  form.creditLimitBRL  ? Number(form.creditLimitBRL)  : undefined,
        paymentMethod:   form.paymentMethod   || undefined,
      } : undefined,
      notes: form.notes || undefined,
    });
  };

  return (
    <Form onSubmit={handleSubmit}>
      {err && <Alert variant="danger" className="py-2">{err}</Alert>}

      <h6 className="text-muted mb-2">Dados principais</h6>
      <Row className="g-2 mb-3">
        <Col md={8}>
          <Form.Label className="small">Razão Social *</Form.Label>
          <Form.Control size="sm" required value={form.razaoSocial}
            onChange={e => set('razaoSocial', e.target.value)} />
        </Col>
        <Col md={4}>
          <Form.Label className="small">Tipo</Form.Label>
          <Form.Select size="sm" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
            <option value="pj">Pessoa Jurídica</option>
            <option value="pf">Pessoa Física</option>
          </Form.Select>
        </Col>
        <Col md={6}>
          <Form.Label className="small">Nome Fantasia</Form.Label>
          <Form.Control size="sm" value={form.nomeFantasia}
            onChange={e => set('nomeFantasia', e.target.value)} />
        </Col>
        <Col md={6}>
          {form.tipo === 'pj' ? (
            <>
              <Form.Label className="small">CNPJ</Form.Label>
              <Form.Control size="sm" placeholder="00.000.000/0000-00"
                value={form.cnpj} onChange={e => set('cnpj', e.target.value)} />
            </>
          ) : (
            <>
              <Form.Label className="small">CPF</Form.Label>
              <Form.Control size="sm" placeholder="000.000.000-00"
                value={form.cpf} onChange={e => set('cpf', e.target.value)} />
            </>
          )}
        </Col>
      </Row>

      <h6 className="text-muted mb-2">Contato</h6>
      <Row className="g-2 mb-3">
        <Col md={4}>
          <Form.Label className="small">E-mail</Form.Label>
          <Form.Control size="sm" type="email" value={form.email}
            onChange={e => set('email', e.target.value)} />
        </Col>
        <Col md={4}>
          <Form.Label className="small">Telefone</Form.Label>
          <Form.Control size="sm" placeholder="(00) 00000-0000" value={form.phone}
            onChange={e => set('phone', e.target.value)} />
        </Col>
        <Col md={4}>
          <Form.Label className="small">Website</Form.Label>
          <Form.Control size="sm" value={form.website}
            onChange={e => set('website', e.target.value)} />
        </Col>
      </Row>

      <h6 className="text-muted mb-2">Endereço</h6>
      <Row className="g-2 mb-3">
        <Col md={5}>
          <Form.Control size="sm" placeholder="Rua / Avenida" value={form.street}
            onChange={e => set('street', e.target.value)} />
        </Col>
        <Col md={2}>
          <Form.Control size="sm" placeholder="Nº" value={form.number}
            onChange={e => set('number', e.target.value)} />
        </Col>
        <Col md={5}>
          <Form.Control size="sm" placeholder="Complemento" value={form.complement}
            onChange={e => set('complement', e.target.value)} />
        </Col>
        <Col md={4}>
          <Form.Control size="sm" placeholder="Bairro" value={form.neighborhood}
            onChange={e => set('neighborhood', e.target.value)} />
        </Col>
        <Col md={3}>
          <Form.Control size="sm" placeholder="Cidade" value={form.city}
            onChange={e => set('city', e.target.value)} />
        </Col>
        <Col md={2}>
          <Form.Control size="sm" placeholder="UF" maxLength={2}
            value={form.state} onChange={e => set('state', e.target.value.toUpperCase())} />
        </Col>
        <Col md={3}>
          <Form.Control size="sm" placeholder="CEP" value={form.zipCode}
            onChange={e => set('zipCode', e.target.value)} />
        </Col>
      </Row>

      <h6 className="text-muted mb-2">Financeiro</h6>
      <Row className="g-2 mb-3">
        <Col md={3}>
          <Form.Label className="small">Prazo pagamento (dias)</Form.Label>
          <Form.Control size="sm" type="number" min={0} value={form.paymentTermDays}
            onChange={e => set('paymentTermDays', e.target.value)} />
        </Col>
        <Col md={4}>
          <Form.Label className="small">Limite de crédito (R$)</Form.Label>
          <Form.Control size="sm" type="number" min={0} value={form.creditLimitBRL}
            onChange={e => set('creditLimitBRL', e.target.value)} />
        </Col>
        <Col md={5}>
          <Form.Label className="small">Forma de pagamento</Form.Label>
          <Form.Select size="sm" value={form.paymentMethod}
            onChange={e => set('paymentMethod', e.target.value)}>
            <option value="">Selecione…</option>
            {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </Form.Select>
        </Col>
      </Row>

      <Form.Control as="textarea" rows={2} size="sm" placeholder="Observações…"
        value={form.notes} onChange={e => set('notes', e.target.value)} />

      <div className="d-flex justify-content-end gap-2 mt-3">
        <Button variant="primary" type="submit" disabled={saving}>
          {saving ? <Spinner size="sm" /> : 'Salvar'}
        </Button>
      </div>
    </Form>
  );
}

// ─── NewClienteModal ──────────────────────────────────────────────────────────

function NewClienteModal({ show, onHide, onCreated }) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { if (show) setErr(''); }, [show]);

  const handleSubmit = async (data) => {
    setErr(''); setSaving(true);
    try {
      const created = await createCliente(data);
      onCreated(created);
      onHide();
    } catch (e) {
      setErr(e?.message ?? 'Erro ao criar cliente');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Novo Cliente</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <SimpleBar style={{ maxHeight: '72vh' }}>
          <ClienteForm onSubmit={handleSubmit} saving={saving} err={err} />
        </SimpleBar>
      </Modal.Body>
    </Modal>
  );
}

// ─── DetailModal ──────────────────────────────────────────────────────────────

function DetailModal({ show, clienteId, onHide, onRefresh }) {
  const [data, setData]     = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && clienteId) {
      setLoading(true); setEditing(false); setErr('');
      getCliente(clienteId).then(setData).finally(() => setLoading(false));
    }
  }, [show, clienteId]);

  const handleUpdate = async (dto) => {
    setErr(''); setSaving(true);
    try {
      const updated = await updateCliente(clienteId, dto);
      setData(updated); setEditing(false); onRefresh();
    } catch (e) {
      setErr(e?.message ?? 'Erro ao atualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async (newStatus) => {
    setSaving(true);
    try {
      const updated = await updateCliente(clienteId, { status: newStatus });
      setData(updated); onRefresh();
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm(`Remover cliente ${data?.razaoSocial}?`)) return;
    setSaving(true);
    try {
      await deleteCliente(clienteId);
      onRefresh(); onHide();
    } catch (e) {
      setErr(e?.message ?? 'Erro ao remover');
      setSaving(false);
    }
  };

  if (!show) return null;
  const c = data;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {c ? `${c.clienteNumber} — ${c.razaoSocial}` : 'Cliente'}
          {c && <span className="ms-2"><StatusBadge status={c.status} /></span>}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading && <div className="text-center py-4"><Spinner /></div>}
        {!loading && c && !editing && (
          <Tabs defaultActiveKey="info" className="mb-3">
            <Tab eventKey="info" title="Dados">
              <Row className="g-3">
                <Col md={6}><h6 className="text-muted small mb-1">Razão Social</h6>
                  <p className="mb-0 fw-medium">{c.razaoSocial}</p></Col>
                <Col md={6}><h6 className="text-muted small mb-1">Nome Fantasia</h6>
                  <p className="mb-0">{c.nomeFantasia || '–'}</p></Col>
                <Col md={4}><h6 className="text-muted small mb-1">CNPJ / CPF</h6>
                  <p className="mb-0">{fmtCNPJ(c.cnpj || c.cpf)}</p></Col>
                <Col md={4}><h6 className="text-muted small mb-1">Tipo</h6>
                  <p className="mb-0">{c.tipo === 'pj' ? 'Pessoa Jurídica' : 'Pessoa Física'}</p></Col>
                <Col md={4}><h6 className="text-muted small mb-1">Número</h6>
                  <p className="mb-0">{c.clienteNumber}</p></Col>

                {(c.email || c.phone) && <>
                  <Col md={6}><h6 className="text-muted small mb-1"><Mail size={12} className="me-1" />E-mail</h6>
                    <p className="mb-0">{c.email || '–'}</p></Col>
                  <Col md={6}><h6 className="text-muted small mb-1"><Phone size={12} className="me-1" />Telefone</h6>
                    <p className="mb-0">{fmtPhone(c.phone)}</p></Col>
                </>}

                {c.address?.city && (
                  <Col xs={12}><h6 className="text-muted small mb-1"><MapPin size={12} className="me-1" />Endereço</h6>
                    <p className="mb-0 small">
                      {[c.address.street, c.address.number, c.address.complement]
                        .filter(Boolean).join(', ')}
                      {c.address.neighborhood ? ` — ${c.address.neighborhood}` : ''}
                      {c.address.city ? ` · ${c.address.city}/${c.address.state}` : ''}
                    </p>
                  </Col>
                )}

                {c.financial && (c.financial.paymentTermDays || c.financial.creditLimitBRL) && (
                  <>
                    <Col md={4}><h6 className="text-muted small mb-1"><DollarSign size={12} className="me-1" />Prazo</h6>
                      <p className="mb-0">{c.financial.paymentTermDays ? `${c.financial.paymentTermDays} dias` : '–'}</p></Col>
                    <Col md={4}><h6 className="text-muted small mb-1">Limite crédito</h6>
                      <p className="mb-0">{c.financial.creditLimitBRL
                        ? `R$ ${Number(c.financial.creditLimitBRL).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : '–'}</p></Col>
                    <Col md={4}><h6 className="text-muted small mb-1">Pagamento</h6>
                      <p className="mb-0">{c.financial.paymentMethod || '–'}</p></Col>
                  </>
                )}

                {c.notes && <Col xs={12}><h6 className="text-muted small mb-1">Obs.</h6>
                  <p className="mb-0 text-muted small">{c.notes}</p></Col>}
              </Row>

              {(c.contacts ?? []).length > 0 && (
                <>
                  <hr />
                  <h6 className="text-muted small mb-2">Contatos</h6>
                  <ListGroup variant="flush">
                    {c.contacts.map((ct, i) => (
                      <ListGroup.Item key={i} className="px-0 py-1">
                        <div className="fw-medium small">{ct.name} {ct.isPrimary && <Badge bg="primary" className="ms-1">principal</Badge>}</div>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          {ct.role && <span className="me-2">{ct.role}</span>}
                          {ct.email && <span className="me-2"><Mail size={10} className="me-1" />{ct.email}</span>}
                          {ct.phone && <span><Phone size={10} className="me-1" />{fmtPhone(ct.phone)}</span>}
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </>
              )}
            </Tab>
          </Tabs>
        )}
        {!loading && c && editing && (
          <SimpleBar style={{ maxHeight: '65vh' }}>
            <ClienteForm
              initial={c}
              onSubmit={handleUpdate}
              saving={saving}
              err={err} />
          </SimpleBar>
        )}
        {err && !editing && <Alert variant="danger" className="mt-2 py-2">{err}</Alert>}
      </Modal.Body>
      {c && !loading && (
        <Modal.Footer className="justify-content-between">
          <div className="d-flex gap-2">
            <Button size="sm" variant={editing ? 'secondary' : 'outline-primary'}
              onClick={() => setEditing(e => !e)}>
              <Edit2 size={13} className="me-1" /> {editing ? 'Cancelar edição' : 'Editar'}
            </Button>
            {!editing && c.status === 'active' && (
              <Button size="sm" variant="outline-warning"
                onClick={() => handleStatusToggle('inactive')} disabled={saving}>
                Inativar
              </Button>
            )}
            {!editing && c.status === 'inactive' && (
              <Button size="sm" variant="outline-success"
                onClick={() => handleStatusToggle('active')} disabled={saving}>
                Reativar
              </Button>
            )}
            {!editing && c.status !== 'blocked' && (
              <Button size="sm" variant="outline-danger"
                onClick={() => handleStatusToggle('blocked')} disabled={saving}>
                Bloquear
              </Button>
            )}
            {!editing && (
              <Button size="sm" variant="outline-danger" onClick={handleDelete} disabled={saving}>
                <Trash2 size={13} />
              </Button>
            )}
          </div>
          <Button variant="light" onClick={onHide}>Fechar</Button>
        </Modal.Footer>
      )}
    </Modal>
  );
}

// ─── ClientesBody ─────────────────────────────────────────────────────────────

export default function ClientesBody() {
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
        getClienteStats(),
        listClientes({ status: filterStatus || undefined, search: search || undefined, limit: 100 }),
      ]);
      setStats(s);
      setItems(list?.items ?? []);
      setTotal(list?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search]);

  useEffect(() => { load(); }, [load]);

  const open = (id) => { setSelectedId(id); setShowDetail(true); };

  return (
    <div className="hk-pg-body">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="mb-1">Clientes</h3>
          <p className="text-muted mb-0">Cadastro de embarcadores e tomadores de frete</p>
        </div>
        <Button variant="primary" onClick={() => setShowNew(true)}>
          <Plus size={16} className="me-1" /> Novo Cliente
        </Button>
      </div>

      {/* KPIs */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <KpiCard label="Total"     value={stats?.total ?? 0}               icon={<Users size={20} />}       color="primary" />
        </Col>
        <Col xs={6} md={3}>
          <KpiCard label="Ativos"    value={stats?.byStatus?.active ?? 0}    icon={<CheckCircle size={20} />} color="success" />
        </Col>
        <Col xs={6} md={3}>
          <KpiCard label="Inativos"  value={stats?.byStatus?.inactive ?? 0}  icon={<User size={20} />}        color="secondary" />
        </Col>
        <Col xs={6} md={3}>
          <KpiCard label="Bloqueados" value={stats?.byStatus?.blocked ?? 0}  icon={<AlertTriangle size={20} />} color="danger" />
        </Col>
      </Row>

      {/* Filtros */}
      <Card className="shadow-sm mb-3">
        <Card.Body className="py-2">
          <Row className="g-2 align-items-center">
            <Col md={6}>
              <InputGroup size="sm">
                <InputGroup.Text><Search size={14} /></InputGroup.Text>
                <Form.Control placeholder="Buscar por razão social, fantasia ou CNPJ…"
                  value={search} onChange={e => setSearch(e.target.value)} />
                {search && (
                  <Button variant="outline-secondary" onClick={() => setSearch('')}><X size={14} /></Button>
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
            <Col md={3} className="text-end">
              <small className="text-muted">{items.length} de {total} clientes</small>
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
                <th>Razão Social</th>
                <th>CNPJ / CPF</th>
                <th>Cidade / UF</th>
                <th>Contato</th>
                <th>Prazo</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-4"><Spinner size="sm" /> Carregando…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-4 text-muted">
                  <Users size={24} className="mb-2 d-block mx-auto" />
                  Nenhum cliente encontrado.
                </td></tr>
              ) : items.map(c => (
                <tr key={c._id} style={{ cursor: 'pointer' }} onClick={() => open(c._id)}>
                  <td className="text-muted small">{c.clienteNumber}</td>
                  <td>
                    <div className="fw-medium">{c.razaoSocial}</div>
                    {c.nomeFantasia && <div className="text-muted small">{c.nomeFantasia}</div>}
                  </td>
                  <td className="small">{fmtCNPJ(c.cnpj || c.cpf)}</td>
                  <td className="small text-muted">
                    {c.address?.city
                      ? `${c.address.city}${c.address.state ? ` / ${c.address.state}` : ''}`
                      : '–'}
                  </td>
                  <td className="small">
                    {c.email
                      ? <span><Mail size={11} className="me-1 text-muted" />{c.email}</span>
                      : c.phone
                      ? <span><Phone size={11} className="me-1 text-muted" />{fmtPhone(c.phone)}</span>
                      : '–'}
                  </td>
                  <td className="small text-muted">
                    {c.financial?.paymentTermDays ? `${c.financial.paymentTermDays}d` : '–'}
                  </td>
                  <td><StatusBadge status={c.status} /></td>
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

      <NewClienteModal show={showNew}
        onHide={() => setShowNew(false)}
        onCreated={() => load()} />

      <DetailModal show={showDetail} clienteId={selectedId}
        onHide={() => setShowDetail(false)}
        onRefresh={load} />
    </div>
  );
}
