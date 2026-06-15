'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card, Table, Badge, Button, Form, InputGroup,
  Row, Col, Spinner, Alert, Modal, Nav,
} from 'react-bootstrap';
import {
  Search, UserPlus, Edit2, Trash2, Shield, User, Users,
  Phone, Eye, EyeOff, ChevronRight, ChevronLeft, Check, Camera,
} from 'react-feather';
import SimpleBar from 'simplebar-react';
import { listUsers, createUser, updateUser, deleteUser } from '@/lib/api/services/users';
import { useAuth } from '@/lib/auth/AuthProvider';

const ROLES = {
  owner:    { label: 'Proprietário', bg: 'danger',    icon: <Shield size={11} /> },
  admin:    { label: 'Admin',        bg: 'warning',   icon: <Shield size={11} /> },
  employee: { label: 'Funcionário',  bg: 'primary',   icon: <User   size={11} /> },
  external: { label: 'Externo',      bg: 'secondary', icon: <User   size={11} /> },
};

const EMPTY_FORM = {
  name: '', email: '', password: '', whatsApp: '',
  role: 'employee', status: 'ativo',
};

function RoleBadge({ role }) {
  const cfg = ROLES[role] ?? { label: role ?? 'N/A', bg: 'secondary' };
  return (
    <Badge bg="" className={`d-inline-flex align-items-center gap-1 border border-${cfg.bg} text-${cfg.bg}`} style={{ backgroundColor: 'transparent' }}>
      {cfg.icon} {cfg.label}
    </Badge>
  );
}

function Avatar({ name, role, avatarUrl }) {
  const initials = (name ?? '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const color = ROLES[role]?.bg ?? 'secondary';
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <div className={`avatar avatar-sm avatar-soft-${color} avatar-rounded`}>
      <span className="initial-wrap">{initials}</span>
    </div>
  );
}

export default function UsersAppBody() {
  const { user: me } = useAuth();
  const isOwner = me?.role === 'owner' || me?.role === 'admin';

  const [users,     setUsers]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [stats,     setStats]     = useState({ total: 0, admins: 0, employees: 0 });
  const [apiError,  setApiError]  = useState('');

  const [showModal,    setShowModal]    = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [activeTab,    setActiveTab]    = useState('dados');
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [saving,       setSaving]       = useState(false);
  const [formError,    setFormError]    = useState('');
  const [showPass,     setShowPass]     = useState(false);
  const [successMsg,   setSuccessMsg]   = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [isDark,       setIsDark]       = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarBase64,  setAvatarBase64]  = useState('');
  const avatarInputRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true); setApiError('');
    try {
      const raw = await listUsers();
      const list = Array.isArray(raw) ? raw : (raw?.users ?? []);
      setUsers(list);
      setStats({
        total:     list.length,
        admins:    list.filter(u => u.role === 'owner' || u.role === 'admin').length,
        employees: list.filter(u => u.role === 'employee').length,
      });
    } catch (err) {
      setApiError(err?.message ?? 'Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.getAttribute('data-bs-theme') === 'dark');
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] });
    return () => obs.disconnect();
  }, []);

  const filtered = users.filter(u =>
    !search ||
    (u.name  ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (u.whatsAppNumbers?.[0] ?? '').includes(search)
  );

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setAvatarPreview(''); setAvatarBase64('');
    setFormError(''); setActiveTab('dados'); setShowModal(true);
  };

  const openEdit = (u) => {
    setEditTarget(u);
    setForm({
      name:     u.name     ?? '',
      email:    u.email    ?? '',
      password: '',
      whatsApp: u.whatsAppNumbers?.[0] ?? '',
      role:     u.role     ?? 'employee',
      status:   u.isActive !== false ? 'ativo' : 'inativo',
    });
    setAvatarPreview(u.avatarUrl ?? ''); setAvatarBase64('');
    setFormError(''); setActiveTab('dados'); setShowModal(true);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setFormError('Selecione uma imagem válida (JPG, PNG).'); return; }
    if (file.size > 2 * 1024 * 1024) { setFormError('Imagem muito grande. Máximo 2 MB.'); return; }
    setAvatarPreview(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarBase64(ev.target.result);
    reader.readAsDataURL(file);
  };

  const setField = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const maskWhatsApp = (raw) => {
    const d = raw.replace(/\D/g, '').slice(0, 13);
    if (!d) return '';
    let r = '+' + d.slice(0, 2);
    if (d.length > 2) r += ' (' + d.slice(2, 4);
    if (d.length > 4) r += ') ' + d.slice(4, 9);
    if (d.length > 9) r += '-' + d.slice(9, 13);
    return r;
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('Nome é obrigatório.'); setActiveTab('dados'); return; }
    if (!editTarget && !form.email.trim()) { setFormError('E-mail é obrigatório.'); setActiveTab('dados'); return; }
    if (!editTarget && form.password.length < 6) { setFormError('Senha mínima de 6 caracteres.'); setActiveTab('dados'); return; }
    if (!editTarget) {
      const emailTaken = users.some(u => (u.email ?? '').toLowerCase() === form.email.trim().toLowerCase());
      if (emailTaken) { setFormError('Este e-mail já está cadastrado.'); setActiveTab('dados'); return; }
    }

    setSaving(true); setFormError('');
    try {
      const payload = {
        name:            form.name.trim(),
        role:            form.role,
        isActive:        form.status === 'ativo',
        whatsAppNumbers: form.whatsApp.trim() ? [form.whatsApp.trim()] : [],
      };
      if (avatarBase64) {
        payload.avatarBase64 = avatarBase64;           // nova imagem → backend faz upload
      } else if (editTarget && !avatarPreview) {
        payload.avatarUrl = null;                      // imagem removida explicitamente → limpa no backend
      }
      // sem alteração de avatar (novo usuário sem foto ou edição sem mudança) → não envia nada

      if (editTarget) {
        if (form.password) payload.password = form.password;
        await updateUser(editTarget._id ?? editTarget.id, payload);
      } else {
        payload.email    = form.email.trim();
        payload.password = form.password;
        await createUser(payload);
      }

      const msg = editTarget
        ? `${form.name.trim()} atualizado com sucesso!`
        : `${form.name.trim()} adicionado à equipe!`;

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

  const roleOptions = me?.role === 'owner'
    ? [{ value: 'admin', label: 'Admin' }, { value: 'employee', label: 'Funcionário' }, { value: 'external', label: 'Externo' }]
    : [{ value: 'employee', label: 'Funcionário' }, { value: 'external', label: 'Externo' }];

  return (
    <div className="fm-body">
      <SimpleBar className="nicescroll-bar">
        <div className="container-fluid px-4 py-4">

          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h4 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <Users size={20} className="text-primary" /> Equipe
              </h4>
              <small className="text-muted">Gerencie quem tem acesso à plataforma Venorica</small>
            </div>
            {isOwner && (
              <Button variant="primary" className="d-flex align-items-center gap-2" onClick={openAdd}>
                <UserPlus size={16} /> Adicionar membro
              </Button>
            )}
          </div>

          {apiError   && <Alert variant="danger"  className="py-2 small mb-3" dismissible onClose={() => setApiError('')}>{apiError}</Alert>}
          {successMsg && <Alert variant="success" className="py-2 small mb-3" dismissible onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

          <Row className="g-3 mb-4">
            {[
              { label: 'Total',        value: stats.total,     color: 'primary', icon: <Users  size={18} /> },
              { label: 'Admins',       value: stats.admins,    color: 'danger',  icon: <Shield size={18} /> },
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

          <Card className="card-border mb-4">
            <Card.Body className="py-2">
              <InputGroup>
                <InputGroup.Text><Search size={15} /></InputGroup.Text>
                <Form.Control
                  placeholder="Buscar por nome, e-mail ou WhatsApp…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </InputGroup>
            </Card.Body>
          </Card>

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
                          <UserPlus size={14} className="me-1" /> Adicionar primeiro membro
                        </Button>
                      )}
                    </div>
                  ) : (
                    <SimpleBar>
                      <Table className="mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th>Usuário</th>
                            <th>Tipo</th>
                            <th>WhatsApp</th>
                            <th>Desde</th>
                            <th className="text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map(u => (
                            <tr key={u._id ?? u.id}>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <Avatar name={u.name} role={u.role} avatarUrl={u.avatarUrl} />
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
                              <td><RoleBadge role={u.role} /></td>
                              <td>
                                {u.whatsAppNumbers?.[0]
                                  ? <span className="small d-flex align-items-center gap-1"><Phone size={12} className="text-success" />{u.whatsAppNumbers[0]}</span>
                                  : <small className="text-muted">—</small>}
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
                                    <Button variant={isDark ? 'outline-warning' : 'warning'} size="sm" title="Editar" onClick={() => openEdit(u)} className={!isDark ? 'text-dark' : ''}>
                                      <Edit2 size={13} />
                                    </Button>
                                  )}
                                  {canDelete(u) && (
                                    <Button variant={isDark ? 'outline-danger' : 'danger'} size="sm" title="Remover" onClick={() => handleDelete(u)} className={!isDark ? 'text-white' : ''}>
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

      <Modal show={showModal} onHide={() => { if (!modalSuccess) setShowModal(false); }} centered>
        <div>
          <Modal.Header closeButton={!modalSuccess} className="border-bottom">
            <Modal.Title className="fs-6 fw-bold d-flex align-items-center gap-2 w-100 text-dark">
              <UserPlus size={16} className="text-primary" />
              {editTarget ? `Editar: ${editTarget.name}` : 'Adicionar membro'}
              {!editTarget && !modalSuccess && (
                <span className="ms-auto me-3 text-muted fw-normal" style={{ fontSize: '0.75rem' }}>
                  Passo {activeTab === 'dados' ? 1 : 2} de 2
                </span>
              )}
            </Modal.Title>
          </Modal.Header>

          {modalSuccess ? (
            <Modal.Body style={{ minHeight: 220 }} className="d-flex flex-column align-items-center justify-content-center gap-3 py-5">
              <div style={{ fontSize: '3rem', lineHeight: 1 }}>✅</div>
              <h5 className="fw-bold text-success mb-0">{modalSuccess}</h5>
              <small className="text-muted">A lista foi atualizada. Fechando…</small>
            </Modal.Body>
          ) : (
            <>
              <div className="px-4 pt-3 border-bottom">
                <Nav variant="tabs" className="nav-line" activeKey={activeTab} onSelect={setActiveTab}>
                  <Nav.Item>
                    <Nav.Link eventKey="dados">
                      <User size={13} className="me-1" /> Dados Básicos
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="perfil" disabled={!form.name.trim()}>
                      <Shield size={13} className="me-1" /> Perfil
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </div>

              <Modal.Body style={{ minHeight: 280 }}>
                {formError && <Alert variant="danger" className="py-2 small mb-3">{formError}</Alert>}

                {activeTab === 'dados' && (
                  <Row className="g-3">

                    {/* ── Avatar upload ── */}
                    <Col xs={12} className="d-flex align-items-center gap-3 mb-1">
                      <div
                        style={{ position: 'relative', width: 72, height: 72, flexShrink: 0, cursor: 'pointer' }}
                        onClick={() => avatarInputRef.current?.click()}
                        title="Clique para adicionar foto"
                      >
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt="Avatar"
                            style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid #0d6efd' }}
                          />
                        ) : (
                          <div style={{
                            width: 72, height: 72, borderRadius: '50%',
                            background: isDark ? '#1e293b' : '#f1f5f9',
                            border: `2px dashed ${isDark ? '#4b5563' : '#cbd5e1'}`,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', gap: 2,
                          }}>
                            <Camera size={18} color={isDark ? '#6b7280' : '#94a3b8'} />
                            <span style={{ fontSize: '0.6rem', color: isDark ? '#6b7280' : '#94a3b8' }}>Foto</span>
                          </div>
                        )}
                        <div style={{
                          position: 'absolute', bottom: 0, right: 0,
                          background: '#0d6efd', borderRadius: '50%',
                          width: 22, height: 22,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 0 0 2px ' + (isDark ? '#1e293b' : '#fff'),
                        }}>
                          <Camera size={11} color="white" />
                        </div>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          style={{ display: 'none' }}
                          onChange={handleAvatarChange}
                        />
                      </div>
                      <div>
                        <div className="small fw-semibold mb-1">Foto de identificação</div>
                        <div style={{ fontSize: '0.72rem' }} className="text-muted">JPG, PNG ou WebP — máx. 2 MB</div>
                        {avatarPreview && (
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 text-danger"
                            style={{ fontSize: '0.72rem' }}
                            onClick={() => { setAvatarPreview(''); setAvatarBase64(''); }}
                          >
                            Remover foto
                          </button>
                        )}
                      </div>
                    </Col>

                    <Col xs={12}>
                      <Form.Label className="small fw-semibold">Nome completo *</Form.Label>
                      <Form.Control
                        value={form.name}
                        onChange={e => setField('name', e.target.value)}
                        placeholder="Ex: Maria Silva"
                      />
                    </Col>

                    {!editTarget && (
                      <Col xs={12}>
                        <Form.Label className="small fw-semibold">E-mail *</Form.Label>
                        <Form.Control
                          type="email"
                          value={form.email}
                          onChange={e => setField('email', e.target.value)}
                          placeholder="maria@empresa.com"
                        />
                      </Col>
                    )}

                    <Col xs={12}>
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

                    <Col xs={12}>
                      <Form.Label className="small fw-semibold d-flex align-items-center gap-1">
                        <Phone size={13} className="text-success" /> WhatsApp
                        <span className="text-muted fw-normal ms-1">(necessário para acesso PRIVADO a agentes)</span>
                      </Form.Label>
                      <Form.Control
                        value={form.whatsApp}
                        onChange={e => setField('whatsApp', maskWhatsApp(e.target.value))}
                        placeholder="+55 (11) 99999-9999"
                      />
                    </Col>
                  </Row>
                )}

                {activeTab === 'perfil' && (
                  <Row className="g-3">
                    <Col xs={12}>
                      <Form.Label className="small fw-semibold">Tipo de acesso *</Form.Label>
                      <Form.Select
                        value={form.role}
                        onChange={e => setField('role', e.target.value)}
                        disabled={editTarget?.role === 'owner'}
                      >
                        {roleOptions.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Funcionários e externos podem ser vinculados a agentes no modo PRIVADO.
                      </Form.Text>
                    </Col>

                    <Col xs={12}>
                      <Form.Label className="small fw-semibold">Status</Form.Label>
                      <Form.Select value={form.status} onChange={e => setField('status', e.target.value)}>
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                      </Form.Select>
                    </Col>
                  </Row>
                )}
              </Modal.Body>

              <Modal.Footer className="justify-content-between">
                <div>
                  {activeTab === 'perfil' && (
                    <Button type="button" variant="light" size="sm" onClick={() => setActiveTab('dados')}>
                      <ChevronLeft size={14} className="me-1" /> Anterior
                    </Button>
                  )}
                </div>
                <div className="d-flex gap-2">
                  <Button type="button" variant="light" size="sm" onClick={() => setShowModal(false)}>Cancelar</Button>
                  {activeTab === 'dados'
                    ? (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => setActiveTab('perfil')}
                        disabled={!form.name.trim()}
                      >
                        Próximo <ChevronRight size={14} className="ms-1" />
                      </Button>
                    ) : (
                      <Button variant="primary" size="sm" disabled={saving} onClick={handleSave}>
                        {saving && <Spinner size="sm" className="me-1" />}
                        {saving ? 'Salvando…' : editTarget ? 'Salvar alterações' : 'Adicionar membro'}
                      </Button>
                    )
                  }
                </div>
              </Modal.Footer>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
