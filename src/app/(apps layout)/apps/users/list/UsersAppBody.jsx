'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Badge, Button, Form, InputGroup,
  Row, Col, Spinner, Alert, Modal, Nav, Tab, OverlayTrigger, Tooltip,
} from 'react-bootstrap';
import {
  Search, UserPlus, Edit2, Trash2, Shield, User, Users,
  Briefcase, Lock, Check, X, Eye, EyeOff, ChevronRight, ChevronLeft,
} from 'react-feather';
import SimpleBar from 'simplebar-react';
import { listUsers, createUser, updateUser, deleteUser } from '@/lib/api/services/users';
import { useAuth } from '@/lib/auth/AuthProvider';

// ─── configuração de roles ─────────────────────────────────────────────────────
const ROLES = {
  owner:    { label: 'Proprietário', bg: 'danger',  icon: <Shield size={11} /> },
  admin:    { label: 'Admin',        bg: 'warning',  icon: <Shield size={11} /> },
  employee: { label: 'Funcionário',  bg: 'primary', icon: <User   size={11} /> },
};

// ─── departamentos e cargos TMS ───────────────────────────────────────────────
const DEPARTAMENTOS = [
  { value: 'operacoes',  label: '🚛 Operações de Frota' },
  { value: 'logistica',  label: '📦 Logística & Rotas' },
  { value: 'manutencao', label: '🔧 Manutenção' },
  { value: 'financeiro', label: '💰 Financeiro' },
  { value: 'rh',         label: '👥 Recursos Humanos' },
  { value: 'tecnologia', label: '💻 Tecnologia' },
];

const CARGOS_POR_DEPTO = {
  operacoes:  ['Operador de Frota', 'Despachante', 'Controlador de Tráfego', 'Analista de Rastreamento', 'Coordenador de Viagens'],
  logistica:  ['Coordenador de Logística', 'Analista de Rotas', 'Planejador de Frota', 'Analista de Transporte', 'Supervisor de Entregas'],
  manutencao: ['Mecânico', 'Técnico de Rastreamento', 'Eletricista Automotivo', 'Coordenador de Manutenção', 'Técnico de Telemetria'],
  financeiro: ['Contador', 'Tesoureiro', 'Analista Financeiro', 'Assistente Administrativo', 'Comprador/Procurement'],
  rh:         ['Analista de RH', 'Gestor de Motoristas', 'Recrutador', 'Coordenador de Treinamento'],
  tecnologia: ['Desenvolvedor', 'Suporte de TI', 'Operador de Painel', 'DevOps', 'Analista de Dados'],
};

// ─── módulos de permissão ─────────────────────────────────────────────────────
const MODULES = [
  { id: 'admin',      name: '🔐 ADMIN',        description: 'Usuários, Empresa, Monitor, Suporte' },
  { id: 'fleet',      name: '🚛 FROTA',         description: 'Veículos, Motoristas, Dispositivos GPS, Manutenção' },
  { id: 'monitoring', name: '📡 MONITORAMENTO', description: 'Torre de Controle, Geofences, Alertas, Relatórios' },
  { id: 'financial',  name: '💰 FINANCEIRO',    description: 'Despesas, Receitas, Notas Fiscais' },
  { id: 'marketing',  name: '📢 MARKETING',     description: 'Campanhas, Leads, Oportunidades' },
];

const PERMISSION_PROFILES = {
  operacional: {
    label: 'Operacional', description: 'Visualiza frota e monitoramento',
    permissions: {
      admin:      { read: false, write: false, delete: false },
      fleet:      { read: true,  write: false, delete: false },
      monitoring: { read: true,  write: false, delete: false },
      financial:  { read: false, write: false, delete: false },
      marketing:  { read: false, write: false, delete: false },
    },
  },
  coordenador: {
    label: 'Coordenador', description: 'Gerencia frota e viagens',
    permissions: {
      admin:      { read: false, write: false, delete: false },
      fleet:      { read: true,  write: true,  delete: false },
      monitoring: { read: true,  write: true,  delete: false },
      financial:  { read: true,  write: false, delete: false },
      marketing:  { read: false, write: false, delete: false },
    },
  },
  gestor: {
    label: 'Gestor', description: 'Acesso gerencial completo',
    permissions: {
      admin:      { read: true,  write: false, delete: false },
      fleet:      { read: true,  write: true,  delete: true  },
      monitoring: { read: true,  write: true,  delete: true  },
      financial:  { read: true,  write: true,  delete: false },
      marketing:  { read: true,  write: true,  delete: false },
    },
  },
};

const EMPTY_PERMISSIONS = Object.fromEntries(
  MODULES.map(m => [m.id, { read: false, write: false, delete: false }])
);

const EMPTY_FORM = {
  // aba 1
  name: '', email: '', password: '', phone: '', status: 'ativo',
  // aba 2
  departamento: '', cargo: '', nivelAcesso: '',
  // aba 3
  permissions: EMPTY_PERMISSIONS,
};

// ─── helpers ──────────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const cfg = ROLES[role] ?? { label: role ?? 'N/A', bg: 'secondary' };
  return (
    <Badge bg="" className={`d-inline-flex align-items-center gap-1 border border-${cfg.bg} text-${cfg.bg}`} style={{ backgroundColor: 'transparent' }}>
      {cfg.icon} {cfg.label}
    </Badge>
  );
}

function Avatar({ name, role }) {
  const initials = (name ?? '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const color = ROLES[role]?.bg ?? 'secondary';
  return (
    <div className={`avatar avatar-sm avatar-soft-${color} avatar-rounded`}>
      <span className="initial-wrap">{initials}</span>
    </div>
  );
}

function PermIcon({ ok }) {
  return ok
    ? <Check size={13} className="text-success" />
    : <X size={13} className="text-muted opacity-50" />;
}

// ─── componente principal ─────────────────────────────────────────────────────
export default function UsersAppBody() {
  const { user: me } = useAuth();
  const isOwner = me?.role === 'owner' || me?.role === 'admin';

  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [stats,    setStats]    = useState({ total: 0, owners: 0, employees: 0 });
  const [apiError, setApiError] = useState('');

  // modal
  const [showModal,  setShowModal]  = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [activeTab,  setActiveTab]  = useState('dados');
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,        setSaving]      = useState(false);
  const [formError,     setFormError]   = useState('');
  const [showPass,      setShowPass]    = useState(false);
  const [successMsg,    setSuccessMsg]  = useState('');
  const [modalSuccess,  setModalSuccess] = useState('');

  // ── carga ─────────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true); setApiError('');
    try {
      const raw = await listUsers();
      const list = Array.isArray(raw) ? raw : (raw?.users ?? []);
      setUsers(list);
      setStats({
        total:     list.length,
        owners:    list.filter(u => u.role === 'owner' || u.role === 'admin').length,
        employees: list.filter(u => u.role === 'employee').length,
      });
    } catch (err) {
      setApiError(err?.message ?? 'Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  }, []);

  const [isDark, setIsDark] = useState(false);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.getAttribute('data-bs-theme') === 'dark');
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] });
    return () => observer.disconnect();
  }, []);

  // ── filtro ────────────────────────────────────────────────────────────────────
  const filtered = users.filter(u =>
    !search ||
    (u.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (u.department ?? '').toLowerCase().includes(search.toLowerCase())
  );

  // ── modal ─────────────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setActiveTab('dados');
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditTarget(u);
    setForm({
      name:        u.name        ?? '',
      email:       u.email       ?? '',
      password:    '',
      phone:       u.phone       ?? '',
      status:      u.isActive !== false ? 'ativo' : 'inativo',
      departamento: u.department ?? '',
      cargo:       u.cargo       ?? '',
      nivelAcesso: '',
      permissions: { ...EMPTY_PERMISSIONS, ...(u.permissions ?? {}) },
    });
    setFormError('');
    setActiveTab('dados');
    setShowModal(true);
  };

  const setField = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const applyProfile = (profileKey) => {
    const p = PERMISSION_PROFILES[profileKey];
    if (p) setForm(f => ({ ...f, nivelAcesso: profileKey, permissions: p.permissions }));
  };

  const togglePerm = (moduleId, action) => {
    setForm(f => ({
      ...f,
      permissions: {
        ...f.permissions,
        [moduleId]: { ...f.permissions[moduleId], [action]: !f.permissions[moduleId][action] },
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())  { setFormError('Nome é obrigatório.'); setActiveTab('dados'); return; }
    if (!editTarget && !form.email.trim()) { setFormError('E-mail é obrigatório.'); setActiveTab('dados'); return; }
    if (!editTarget && form.password.length < 6) { setFormError('Senha mínima de 6 caracteres.'); setActiveTab('dados'); return; }

    setSaving(true); setFormError('');
    try {
      const payload = {
        name:        form.name.trim(),
        role:        'employee',
        department:  form.departamento || undefined,
        cargo:       form.cargo        || undefined,
        phone:       form.phone        || undefined,
        isActive:    form.status === 'ativo',
        permissions: form.permissions,
      };

      const isEdit = !!editTarget;
      if (isEdit) {
        if (form.password) payload.password = form.password;
        await updateUser(editTarget._id ?? editTarget.id, payload);
      } else {
        payload.email    = form.email.trim();
        payload.password = form.password;
        await createUser(payload);
      }

      const msg = isEdit
        ? `${form.name.trim()} atualizado com sucesso!`
        : `Funcionário ${form.name.trim()} criado com sucesso!`;

      setModalSuccess(msg);
      load();

      setTimeout(() => {
        setShowModal(false);
        setModalSuccess('');
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 5000);
      }, 2500);
    } catch (err) {
      setFormError(err?.body?.message ?? err?.message ?? 'Erro ao salvar usuário.');
    } finally {
      setSaving(false);
    }
  };

  // ── delete ────────────────────────────────────────────────────────────────────
  const handleDelete = async (u) => {
    if (!confirm(`Remover "${u.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteUser(u._id ?? u.id);
      load();
    } catch (err) {
      alert(err?.body?.message ?? err?.message ?? 'Erro ao remover usuário.');
    }
  };

  const isSelf    = (u) => (u._id ?? u.id) === (me?._id ?? me?.id);
  const canEdit   = (u) => isOwner && !isSelf(u) && u.role !== 'owner';
  const canDelete = (u) => isOwner && !isSelf(u) && u.role !== 'owner';

  const cargoOptions = form.departamento
    ? [...(CARGOS_POR_DEPTO[form.departamento] ?? []), 'Outros']
    : [];

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <div className="fm-body">
      <SimpleBar className="nicescroll-bar">
        <div className="container-fluid px-4 py-4">

          {/* Header */}
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h4 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <Users size={20} className="text-primary" /> Usuários
              </h4>
              <small className="text-muted">Gerencie quem tem acesso ao TMS-Fácil</small>
            </div>
            {isOwner && (
              <Button variant="primary" className="d-flex align-items-center gap-2" onClick={openAdd}>
                <UserPlus size={16} /> Novo Membro da Equipe
              </Button>
            )}
          </div>

          {apiError   && <Alert variant="danger"  className="py-2 small mb-3" dismissible onClose={() => setApiError('')}>{apiError}</Alert>}
          {successMsg && <Alert variant="success" className="py-2 small mb-3" dismissible onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

          {/* KPIs */}
          <Row className="g-3 mb-4">
            {[
              { label: 'Total',        value: stats.total,     color: 'primary', icon: <Users  size={18} /> },
              { label: 'Admins',       value: stats.owners,    color: 'danger',  icon: <Shield size={18} /> },
              { label: 'Funcionários', value: stats.employees, color: 'info',    icon: <User   size={18} /> },
            ].map(k => (
              <Col key={k.label} xs={6} md={4}>
                <Card className="card-border text-center">
                  <Card.Body className="py-3">
                    <div className={`text-${k.color} mb-1`}>{k.icon}</div>
                    <h3 className={`fw-bold text-${k.color} mb-0`}>{loading ? '…' : k.value}</h3>
                    <small className="text-muted">{k.label}</small>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Busca */}
          <Card className="card-border mb-4">
            <Card.Body className="py-2">
              <InputGroup>
                <InputGroup.Text><Search size={15} /></InputGroup.Text>
                <Form.Control
                  placeholder="Buscar por nome, e-mail ou departamento…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </InputGroup>
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
                      <Users size={40} className="mb-3 opacity-25" />
                      <p className="mb-1">Nenhum usuário encontrado.</p>
                      {isOwner && (
                        <Button variant="primary" size="sm" onClick={openAdd}>
                          <UserPlus size={14} className="me-1" /> Adicionar primeiro membro da equipe
                        </Button>
                      )}
                    </div>
                  ) : (
                    <SimpleBar>
                      <Table className="mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th>Usuário</th>
                            <th>Departamento / Cargo</th>
                            <th>Perfil</th>
                            <th>Permissões</th>
                            <th>Desde</th>
                            <th className="text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map(u => (
                            <tr key={u._id ?? u.id}>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <Avatar name={u.name} role={u.role} />
                                  <div>
                                    <div className="fw-semibold small">
                                      {u.name ?? '—'}
                                      {isSelf(u) && (
                                        <span
                                          className="ms-1 small"
                                          style={{
                                            display: 'inline-block',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '0.25rem',
                                            background: isDark ? 'transparent' : '#f8f9fa',
                                            color: isDark ? '#adb5bd' : '#212529',
                                            border: `1px solid ${isDark ? '#6c757d' : '#dee2e6'}`,
                                            position: 'relative',
                                            zIndex: 10,
                                          }}
                                        >
                                          Você
                                        </span>
                                      )}
                                    </div>
                                    <small className="text-muted">{u.email}</small>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="small fw-semibold">
                                  {DEPARTAMENTOS.find(d => d.value === u.department)?.label ?? u.department ?? '—'}
                                </div>
                                {u.cargo && <small className="text-muted">{u.cargo}</small>}
                              </td>
                              <td><RoleBadge role={u.role} /></td>
                              <td>
                                <div className="d-flex gap-2 flex-wrap">
                                  {MODULES.map(m => {
                                    const p = u.permissions?.[m.id];
                                    if (!p?.read && !p?.write && !p?.delete) return null;
                                    return (
                                      <OverlayTrigger
                                        key={m.id}
                                        placement="top"
                                        overlay={
                                          <Tooltip>
                                            {m.name}<br />
                                            {p?.read   && '✅ leitura '  }
                                            {p?.write  && '✏️ escrita '  }
                                            {p?.delete && '🗑️ exclusão'}
                                          </Tooltip>
                                        }
                                      >
                                        <Badge bg="light" text="dark" className="small border" style={{ cursor: 'default', background: '#f8f9fa !important', color: '#212529 !important', borderColor: '#dee2e6 !important' }}>
                                          {m.name.split(' ')[0]}
                                        </Badge>
                                      </OverlayTrigger>
                                    );
                                  })}
                                  {!u.permissions || MODULES.every(m => !u.permissions[m.id]?.read) && (
                                    <small className="text-muted">—</small>
                                  )}
                                </div>
                              </td>
                              <td>
                                <small className="text-muted">
                                  {u.createdAt
                                    ? new Date(u.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                                    : '—'}
                                </small>
                              </td>
                              <td className="text-center">
                                <div className="d-flex justify-content-center gap-1">
                                  {canEdit(u) && (
                                    <Button variant={isDark ? "outline-warning" : "warning"} size="sm" title="Editar" onClick={() => openEdit(u)} className={!isDark ? "text-dark" : ""}>
                                      <Edit2 size={13} />
                                    </Button>
                                  )}
                                  {canDelete(u) && (
                                    <Button variant={isDark ? "outline-danger" : "danger"} size="sm" title="Remover" onClick={() => handleDelete(u)} className={!isDark ? "text-white" : ""}>
                                      <Trash2 size={13} />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </SimpleBar>
                  )}
            </Card.Body>
          </Card>
        </div>
      </SimpleBar>

      {/* ── Modal criar / editar funcionário ────────────────────────────────── */}
      <Modal show={showModal} onHide={() => { if (!modalSuccess) setShowModal(false); }} centered size="lg">
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton={!modalSuccess} className="border-bottom">
            <Modal.Title className="fs-6 fw-bold d-flex align-items-center gap-2 w-100 text-dark">
              <UserPlus size={16} className="text-primary" />
              {editTarget ? `Editar: ${editTarget.name}` : 'Novo Membro da Equipe'}
              {!editTarget && !modalSuccess && (
                <span className="ms-auto me-3 text-muted fw-normal" style={{ fontSize: '0.75rem' }}>
                  Passo {activeTab === 'dados' ? 1 : activeTab === 'depto' ? 2 : 3} de 3
                </span>
              )}
            </Modal.Title>
          </Modal.Header>

          {/* Tela de sucesso — substitui as abas */}
          {modalSuccess ? (
            <Modal.Body style={{ minHeight: 260 }} className="d-flex flex-column align-items-center justify-content-center gap-3 py-5">
              <div style={{ fontSize: '3rem', lineHeight: 1 }}>✅</div>
              <h5 className="fw-bold text-success mb-0">{modalSuccess}</h5>
              <small className="text-muted">A lista foi atualizada. Fechando…</small>
            </Modal.Body>
          ) : (
          <>
          {/* Abas */}
          <div className="px-4 pt-3 border-bottom">
            <Nav variant="tabs" className="nav-line" activeKey={activeTab} onSelect={setActiveTab}>
              <Nav.Item>
                <Nav.Link eventKey="dados">
                  <User size={13} className="me-1" /> Dados Básicos
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="depto" disabled={!editTarget && !form.name}>
                  <Briefcase size={13} className="me-1" /> Departamento
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="perms" disabled={!editTarget && !form.name}>
                  <Lock size={13} className="me-1" /> Permissões
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </div>

          <Modal.Body style={{ minHeight: 340 }}>
            {formError && <Alert variant="danger" className="py-2 small mb-3">{formError}</Alert>}

            {/* ─── Aba 1: Dados Básicos ─────────────────────────────────────── */}
            {activeTab === 'dados' && (
              <Row className="g-3">
                <Col xs={12} md={6}>
                  <Form.Label className="small fw-semibold">Nome completo *</Form.Label>
                  <Form.Control
                    value={form.name}
                    onChange={e => setField('name', e.target.value)}
                    placeholder="Ex: João Silva"
                    required
                  />
                </Col>
                <Col xs={12} md={6}>
                  <Form.Label className="small fw-semibold">Telefone</Form.Label>
                  <Form.Control
                    value={form.phone}
                    onChange={e => setField('phone', e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </Col>
                {!editTarget && (
                  <Col xs={12} md={6}>
                    <Form.Label className="small fw-semibold">E-mail *</Form.Label>
                    <Form.Control
                      type="email"
                      value={form.email}
                      onChange={e => setField('email', e.target.value)}
                      placeholder="joao@empresa.com"
                      required
                    />
                  </Col>
                )}
                <Col xs={12} md={6}>
                  <Form.Label className="small fw-semibold">
                    {editTarget ? 'Nova senha (opcional)' : 'Senha *'}
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setField('password', e.target.value)}
                      placeholder={editTarget ? 'Deixe vazio para manter' : 'Mínimo 6 caracteres'}
                    />
                    <Button variant="outline-secondary" onClick={() => setShowPass(s => !s)} tabIndex={-1}>
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </Button>
                  </InputGroup>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Label className="small fw-semibold">Status</Form.Label>
                  <Form.Select value={form.status} onChange={e => setField('status', e.target.value)}>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </Form.Select>
                </Col>
              </Row>
            )}

            {/* ─── Aba 2: Departamento & Cargo ─────────────────────────────── */}
            {activeTab === 'depto' && (
              <Row className="g-3">
                <Col xs={12}>
                  <Form.Label className="small fw-semibold">Departamento</Form.Label>
                  <Form.Select
                    value={form.departamento}
                    onChange={e => setField('departamento', e.target.value)}
                  >
                    <option value="">— selecione —</option>
                    {DEPARTAMENTOS.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </Form.Select>
                </Col>
                {form.departamento && (
                  <Col xs={12}>
                    <Form.Label className="small fw-semibold">Cargo / Função</Form.Label>
                    <Form.Select
                      value={form.cargo}
                      onChange={e => setField('cargo', e.target.value)}
                    >
                      <option value="">— selecione —</option>
                      {cargoOptions.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </Form.Select>
                  </Col>
                )}
                <Col xs={12}>
                  <Form.Label className="small fw-semibold">Perfil de acesso rápido</Form.Label>
                  <Row className="g-2">
                    {Object.entries(PERMISSION_PROFILES).map(([key, p]) => (
                      <Col xs={12} md={4} key={key}>
                        <Card
                          className={`card-border h-100 cursor-pointer ${form.nivelAcesso === key ? 'border-primary' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => applyProfile(key)}
                        >
                          <Card.Body className="py-2 px-3">
                            <div className="d-flex align-items-center justify-content-between">
                              <strong className="small">{p.label}</strong>
                              {form.nivelAcesso === key && <Check size={14} className="text-primary" />}
                            </div>
                            <small className="text-muted">{p.description}</small>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                  <Form.Text className="text-muted">
                    Selecionar um perfil preenche automaticamente as permissões na próxima aba.
                  </Form.Text>
                </Col>
              </Row>
            )}

            {/* ─── Aba 3: Permissões granulares ────────────────────────────── */}
            {activeTab === 'perms' && (
              <div>
                <div className="mb-3 p-2 bg-light rounded">
                  <small className="text-muted">
                    <Lock size={12} className="me-1" />
                    Defina exatamente o que este funcionário pode fazer em cada módulo.
                  </small>
                </div>
                <Table size="sm" className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Módulo</th>
                      <th className="text-center">Leitura</th>
                      <th className="text-center">Escrita</th>
                      <th className="text-center">Exclusão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MODULES.map(m => (
                      <tr key={m.id}>
                        <td>
                          <div className="small fw-semibold">{m.name}</div>
                          <small className="text-muted">{m.description}</small>
                        </td>
                        {['read', 'write', 'delete'].map(action => (
                          <td key={action} className="text-center align-middle">
                            <Form.Check
                              type="switch"
                              id={`perm-${m.id}-${action}`}
                              checked={form.permissions[m.id]?.[action] ?? false}
                              onChange={() => togglePerm(m.id, action)}
                              disabled={action !== 'read' && !form.permissions[m.id]?.read}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Modal.Body>

          <Modal.Footer className="justify-content-between">
            <div className="d-flex gap-2">
              {activeTab !== 'dados' && (
                <Button type="button" variant="light" size="sm" onClick={() => setActiveTab(activeTab === 'perms' ? 'depto' : 'dados')}>
                  <ChevronLeft size={14} className="me-1" /> Anterior
                </Button>
              )}
            </div>
            <div className="d-flex gap-2">
              <Button type="button" variant="light" size="sm" onClick={() => setShowModal(false)}>Cancelar</Button>
              {activeTab !== 'perms'
                ? (
                  <Button
                    type="button"
                    variant="primary" size="sm"
                    onClick={() => setActiveTab(activeTab === 'dados' ? 'depto' : 'perms')}
                    disabled={!form.name.trim()}
                  >
                    Próximo <ChevronRight size={14} className="ms-1" />
                  </Button>
                ) : (
                  <Button type="submit" variant="primary" size="sm" disabled={saving}>
                    {saving && <Spinner size="sm" className="me-1" />}
                    {saving ? 'Salvando…' : editTarget ? 'Salvar alterações' : 'Criar funcionário'}
                  </Button>
                )
              }
            </div>
          </Modal.Footer>
          </>
          )}
        </Form>
      </Modal>
    </div>
  );
}
