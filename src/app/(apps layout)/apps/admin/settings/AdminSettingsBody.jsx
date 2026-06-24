'use client';

import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { Col, Row, Form, Button, Alert, Spinner, Nav, Tab, Card } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import {
  Save, Menu, Briefcase, Shield, Bell, Lock,
  CheckCircle, AlertTriangle, MapPin, Phone, Mail, Hash, Download, Trash2, User, Eye, EyeOff,
} from 'react-feather';
import Link from 'next/link';
import AdminSidebar from '../../users/AdminSidebar';
import {
  getTenantSettings, updateTenantSettings,
  exportTenantData, requestTenantDataDeletion,
} from '@/lib/api/services/tenant';
import { changePassword as changePasswordApi } from '@/lib/api/services/auth';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import PartyProfileSettingsBody from './PartyProfileSettingsBody';

const ALLOWED_ROLES = ['owner'];

const UF_LIST = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const AdminSettingsBody = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [showSidebar, setShowSidebar] = useState(true);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [error,       setError]       = useState(null);
  const [tenantName,  setTenantName]  = useState('');
  const [activeTab,   setActiveTab]   = useState('organization');
  const [privacyBusy, setPrivacyBusy] = useState(null);
  const [privacyMsg,  setPrivacyMsg]  = useState(null);

  const [pwdForm,    setPwdForm]    = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdSaving,  setPwdSaving]  = useState(false);
  const [pwdMsg,     setPwdMsg]     = useState(null);
  const [pwdShow,    setPwdShow]    = useState({ current: false, next: false, confirm: false });

  const [settings, setSettings] = useState({
    organization: {
      companyName: '',
      tradeName:   '',
      cnpj:        '',
      email:       '',
      phone:       '',
      address:     '',
      city:        '',
      state:       '',
      website:     '',
    },
    security: {
      require2FA:           false,
      sessionTimeout:       60,
      strongPasswordPolicy: true,
      allowSocialLogin:     false,
    },
    notifications: {
      email: {
        handoffRequired:    true,
        integrationFailure: true,
        weeklyReport:       true,
      },
      push: {
        enabled: true,
      },
    },
    privacy: {
      dpoEmail:              '',
      dataProcessingConsent: false,
    },
  });

  // ── carga ──────────────────────────────────────────────────────────────────
  useEffect(() => { loadSettings(); }, [user]);

  const loadSettings = async () => {
    if (!user?.tenantId) { setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      const response = await getTenantSettings();
      if (response?.tenantName) setTenantName(response.tenantName);
      setSettings(prev => ({
        organization:  { ...prev.organization,  ...(response?.organization ?? {}) },
        security:      { ...prev.security,      ...(response?.security      ?? {}) },
        notifications: {
          email: { ...prev.notifications.email, ...(response?.notifications?.email ?? {}) },
          push:  { ...prev.notifications.push,  ...(response?.notifications?.push  ?? {}) },
        },
        privacy:       { ...prev.privacy,        ...(response?.privacy        ?? {}) },
      }));
    } catch {
      setError('Erro ao carregar configurações. Usando valores padrão.');
    } finally {
      setLoading(false);
    }
  };

  // ── salvar ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user?.tenantId) { setError('Tenant não identificado'); return; }
    try {
      setSaving(true); setError(null);
      await updateTenantSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err?.message ?? 'Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  // ── LGPD: exportar / solicitar exclusão ───────────────────────────────────
  const handleExportData = async () => {
    try {
      setPrivacyBusy('export'); setPrivacyMsg(null);
      const data = await exportTenantData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dados-conta-${user?.tenantId || 'tenant'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setPrivacyMsg({ type: 'success', text: 'Exportação concluída. O arquivo foi baixado.' });
    } catch (err) {
      setPrivacyMsg({ type: 'danger', text: err?.message ?? 'Erro ao exportar dados.' });
    } finally {
      setPrivacyBusy(null);
    }
  };

  const handleDeleteRequest = async () => {
    const confirmed = window.confirm(
      'Tem certeza que deseja solicitar a exclusão dos dados desta conta? ' +
      'Essa ação será registrada e analisada pela nossa equipe — não é uma exclusão imediata.'
    );
    if (!confirmed) return;
    try {
      setPrivacyBusy('delete'); setPrivacyMsg(null);
      const res = await requestTenantDataDeletion('Solicitado pelo proprietário via Configurações');
      setPrivacyMsg({ type: 'success', text: res?.message ?? 'Solicitação registrada com sucesso.' });
    } catch (err) {
      setPrivacyMsg({ type: 'danger', text: err?.message ?? 'Erro ao registrar solicitação.' });
    } finally {
      setPrivacyBusy(null);
    }
  };

  // ── trocar senha ──────────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    setPwdMsg(null);
    if (!pwdForm.currentPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
      setPwdMsg({ type: 'warning', text: 'Preencha todos os campos.' });
      return;
    }
    if (pwdForm.newPassword.length < 8) {
      setPwdMsg({ type: 'warning', text: 'A nova senha deve ter no mínimo 8 caracteres.' });
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdMsg({ type: 'warning', text: 'A nova senha e a confirmação não coincidem.' });
      return;
    }
    try {
      setPwdSaving(true);
      await changePasswordApi({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
      setPwdMsg({ type: 'success', text: 'Senha alterada com sucesso!' });
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const msg = err?.message ?? '';
      if (msg.includes('incorreta') || msg.includes('401') || msg.includes('Unauthorized')) {
        setPwdMsg({ type: 'danger', text: 'Senha atual incorreta.' });
      } else {
        setPwdMsg({ type: 'danger', text: msg || 'Erro ao alterar senha.' });
      }
    } finally {
      setPwdSaving(false);
    }
  };

  // ── helpers de formato ─────────────────────────────────────────────────────
  const fmtCNPJ = (v = '') => {
    const d = String(v).replace(/\D/g, '').slice(0, 14);
    return d
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  const fmtPhone = (v = '') => {
    const d = String(v).replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  };

  const handleChange = (path, value) => {
    if (path === 'organization.cnpj')  value = fmtCNPJ(value);
    if (path === 'organization.phone') value = fmtPhone(value);
    setSettings(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

  // ── acesso restrito ────────────────────────────────────────────────────────
  if (user && !ALLOWED_ROLES.includes(user.role)) {
    return (
      <div className="hk-pg-body py-0 d-flex align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
        <div className="text-center" style={{ maxWidth: 480 }}>
          <div style={{ fontSize: 56 }}>🔒</div>
          <h4 className="mt-3 mb-2">Acesso Restrito</h4>
          <p className="text-muted mb-4">
            As configurações da conta são gerenciadas exclusivamente pelo <strong>Proprietário</strong>.
          </p>
          <Button variant="primary" onClick={() => router.push('/apps/agents')}>
            Voltar para Agentes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="hk-pg-body py-0">
      <div className={classNames('fmapp-wrap', { 'fmapp-sidebar-toggle': !showSidebar })}>
        <AdminSidebar />
        <div className="fmapp-content">
          <div className="fmapp-detail-wrap">

            {/* Header */}
            <header className="contact-header">
              <div className="d-flex align-items-center">
                <Button
                  variant="flush-dark"
                  className="btn-icon btn-rounded flush-soft-hover me-3"
                  onClick={() => setShowSidebar(s => !s)}
                >
                  <span className="icon"><span className="feather-icon"><Menu size={20} /></span></span>
                </Button>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item"><Link href="/apps/agents">Venorica AI</Link></li>
                    <li className="breadcrumb-item active">Configurações</li>
                  </ol>
                </nav>
              </div>
              <div className="contact-options-wrap">
                {activeTab !== 'appearance' && activeTab !== 'account' && (
                  <Button variant="primary" onClick={handleSave} disabled={saving || loading}>
                    {saving
                      ? <><Spinner size="sm" className="me-2" />Salvando…</>
                      : <><Save size={15} className="me-2" />Salvar alterações</>}
                  </Button>
                )}
              </div>
            </header>

            {/* Body */}
            <div className="fm-body">
              <SimpleBar className="nicescroll-bar">
                <div className="contact-list-view">
                  {loading
                    ? <div className="d-flex justify-content-center align-items-center" style={{ height: 400 }}><Spinner variant="primary" /></div>
                    : (
                    <div className="p-4">
                      {saved && (
                        <Alert variant="success" className="d-flex align-items-center mb-4 py-2">
                          <CheckCircle size={16} className="me-2" /> Configurações salvas com sucesso!
                        </Alert>
                      )}
                      {error && (
                        <Alert variant="warning" className="d-flex align-items-center mb-4 py-2">
                          <AlertTriangle size={16} className="me-2" /> {error}
                        </Alert>
                      )}

                      <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
                        <Row>
                          {/* Nav lateral */}
                          <Col md={3}>
                            <Nav variant="pills" className="flex-column">
                              <Nav.Item>
                                <Nav.Link eventKey="organization">
                                  <Briefcase size={15} className="me-2" />Empresa
                                </Nav.Link>
                              </Nav.Item>
                              <Nav.Item>
                                <Nav.Link eventKey="security">
                                  <Shield size={15} className="me-2" />Segurança
                                </Nav.Link>
                              </Nav.Item>
                              <Nav.Item>
                                <Nav.Link eventKey="notifications">
                                  <Bell size={15} className="me-2" />Notificações
                                </Nav.Link>
                              </Nav.Item>
                              <Nav.Item>
                                <Nav.Link eventKey="privacy">
                                  <Lock size={15} className="me-2" />Privacidade &amp; LGPD
                                </Nav.Link>
                              </Nav.Item>
                              <Nav.Item>
                                <Nav.Link eventKey="appearance">
                                  <span className="me-2">🎨</span>Aparência
                                </Nav.Link>
                              </Nav.Item>
                              <Nav.Item>
                                <Nav.Link eventKey="account">
                                  <User size={15} className="me-2" />Minha Conta
                                </Nav.Link>
                              </Nav.Item>
                            </Nav>
                          </Col>

                          {/* Conteúdo */}
                          <Col md={9}>
                            <Tab.Content>

                              {/* ── Empresa ── */}
                              <Tab.Pane eventKey="organization">
                                <h5 className="fw-bold mb-1 d-flex align-items-center gap-2">
                                  <Briefcase size={18} className="text-primary" /> Dados da Empresa
                                </h5>
                                {tenantName && (
                                  <p className="small text-muted mb-4">Conta: <strong>{tenantName}</strong></p>
                                )}

                                <Form>
                                  <h6 className="text-primary border-bottom pb-2 mb-3">Identificação</h6>
                                  <Row className="gx-3">
                                    <Col sm={8}>
                                      <Form.Group className="mb-3">
                                        <Form.Label className="small fw-semibold">Razão Social</Form.Label>
                                        <Form.Control
                                          value={settings.organization.companyName || ''}
                                          onChange={e => handleChange('organization.companyName', e.target.value)}
                                          placeholder="Ex: Acme Imóveis Ltda"
                                        />
                                      </Form.Group>
                                    </Col>
                                    <Col sm={4}>
                                      <Form.Group className="mb-3">
                                        <Form.Label className="small fw-semibold">Nome Fantasia</Form.Label>
                                        <Form.Control
                                          value={settings.organization.tradeName || ''}
                                          onChange={e => handleChange('organization.tradeName', e.target.value)}
                                          placeholder="Ex: Acme"
                                        />
                                      </Form.Group>
                                    </Col>
                                    <Col sm={6}>
                                      <Form.Group className="mb-3">
                                        <Form.Label className="small fw-semibold">
                                          <Hash size={13} className="me-1" />CNPJ
                                        </Form.Label>
                                        <Form.Control
                                          value={settings.organization.cnpj || ''}
                                          onChange={e => handleChange('organization.cnpj', e.target.value)}
                                          placeholder="12.345.678/0001-90"
                                          inputMode="numeric"
                                          maxLength={18}
                                        />
                                        <Form.Text className="text-muted">Usado para faturamento e nota fiscal.</Form.Text>
                                      </Form.Group>
                                    </Col>
                                  </Row>

                                  <h6 className="text-secondary border-bottom pb-2 mb-3 mt-2">
                                    <MapPin size={14} className="me-1" />Localização e Contato
                                  </h6>
                                  <Row className="gx-3">
                                    <Col sm={6}>
                                      <Form.Group className="mb-3">
                                        <Form.Label className="small fw-semibold">
                                          <Mail size={13} className="me-1" />Email Principal
                                        </Form.Label>
                                        <Form.Control
                                          type="email"
                                          value={settings.organization.email || ''}
                                          onChange={e => handleChange('organization.email', e.target.value)}
                                          placeholder="contato@empresa.com.br"
                                        />
                                      </Form.Group>
                                    </Col>
                                    <Col sm={6}>
                                      <Form.Group className="mb-3">
                                        <Form.Label className="small fw-semibold">
                                          <Phone size={13} className="me-1" />Telefone
                                        </Form.Label>
                                        <Form.Control
                                          value={settings.organization.phone || ''}
                                          onChange={e => handleChange('organization.phone', e.target.value)}
                                          placeholder="(11) 99999-0000"
                                          inputMode="numeric"
                                          maxLength={15}
                                        />
                                      </Form.Group>
                                    </Col>
                                    <Col sm={8}>
                                      <Form.Group className="mb-3">
                                        <Form.Label className="small fw-semibold">Endereço</Form.Label>
                                        <Form.Control
                                          value={settings.organization.address || ''}
                                          onChange={e => handleChange('organization.address', e.target.value)}
                                          placeholder="Av. Brasil, 1000 — São Paulo"
                                        />
                                      </Form.Group>
                                    </Col>
                                    <Col sm={2}>
                                      <Form.Group className="mb-3">
                                        <Form.Label className="small fw-semibold">Cidade</Form.Label>
                                        <Form.Control
                                          value={settings.organization.city || ''}
                                          onChange={e => handleChange('organization.city', e.target.value)}
                                          placeholder="São Paulo"
                                        />
                                      </Form.Group>
                                    </Col>
                                    <Col sm={2}>
                                      <Form.Group className="mb-3">
                                        <Form.Label className="small fw-semibold">UF</Form.Label>
                                        <Form.Select
                                          value={settings.organization.state || ''}
                                          onChange={e => handleChange('organization.state', e.target.value)}
                                        >
                                          <option value="">—</option>
                                          {UF_LIST.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                        </Form.Select>
                                      </Form.Group>
                                    </Col>
                                    <Col sm={6}>
                                      <Form.Group className="mb-3">
                                        <Form.Label className="small fw-semibold">Website</Form.Label>
                                        <Form.Control
                                          type="url"
                                          value={settings.organization.website || ''}
                                          onChange={e => handleChange('organization.website', e.target.value)}
                                          placeholder="https://www.empresa.com.br"
                                        />
                                      </Form.Group>
                                    </Col>
                                  </Row>
                                </Form>
                              </Tab.Pane>

                              {/* ── Segurança ── */}
                              <Tab.Pane eventKey="security">
                                <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                                  <Shield size={18} className="text-primary" /> Segurança e Acesso
                                </h5>
                                <Form>
                                  <Card className="card-border mb-3">
                                    <Card.Body>
                                      <Form.Check
                                        type="switch" id="s-2fa"
                                        label="Exigir autenticação de dois fatores (2FA)"
                                        checked={!!settings.security.require2FA}
                                        onChange={e => handleChange('security.require2FA', e.target.checked)}
                                        className="mb-3"
                                      />
                                      <Form.Check
                                        type="switch" id="s-pwd"
                                        label="Política de senha forte (mínimo 8 caracteres, letras e números)"
                                        checked={!!settings.security.strongPasswordPolicy}
                                        onChange={e => handleChange('security.strongPasswordPolicy', e.target.checked)}
                                        className="mb-3"
                                      />
                                      <Form.Check
                                        type="switch" id="s-social"
                                        label="Permitir login com Google / Microsoft"
                                        checked={!!settings.security.allowSocialLogin}
                                        onChange={e => handleChange('security.allowSocialLogin', e.target.checked)}
                                      />
                                    </Card.Body>
                                  </Card>
                                  <Form.Group style={{ maxWidth: 280 }}>
                                    <Form.Label className="small fw-semibold">Expiração de sessão inativa</Form.Label>
                                    <Form.Select
                                      value={settings.security.sessionTimeout}
                                      onChange={e => handleChange('security.sessionTimeout', parseInt(e.target.value, 10))}
                                    >
                                      <option value={15}>15 minutos</option>
                                      <option value={30}>30 minutos</option>
                                      <option value={60}>1 hora</option>
                                      <option value={120}>2 horas</option>
                                      <option value={0}>Nunca expirar</option>
                                    </Form.Select>
                                  </Form.Group>
                                </Form>
                              </Tab.Pane>

                              {/* ── Notificações ── */}
                              <Tab.Pane eventKey="notifications">
                                <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                                  <Bell size={18} className="text-primary" /> Notificações
                                </h5>
                                <Card className="card-border mb-3">
                                  <Card.Header className="small fw-semibold">Email</Card.Header>
                                  <Card.Body>
                                    <Form.Check type="switch" id="n-handoff"
                                      label="Agente solicitou atendimento humano (handoff)"
                                      checked={!!settings.notifications.email.handoffRequired}
                                      onChange={e => handleChange('notifications.email.handoffRequired', e.target.checked)}
                                      className="mb-2"
                                    />
                                    <Form.Check type="switch" id="n-fail"
                                      label="Falha em integração ou execução de ferramenta"
                                      checked={!!settings.notifications.email.integrationFailure}
                                      onChange={e => handleChange('notifications.email.integrationFailure', e.target.checked)}
                                      className="mb-2"
                                    />
                                    <Form.Check type="switch" id="n-report"
                                      label="Resumo semanal de atividade dos agentes"
                                      checked={!!settings.notifications.email.weeklyReport}
                                      onChange={e => handleChange('notifications.email.weeklyReport', e.target.checked)}
                                    />
                                  </Card.Body>
                                </Card>
                                <Card className="card-border">
                                  <Card.Header className="small fw-semibold">Push (navegador)</Card.Header>
                                  <Card.Body>
                                    <Form.Check type="switch" id="n-push"
                                      label="Notificações push em tempo real"
                                      checked={!!settings.notifications.push.enabled}
                                      onChange={e => handleChange('notifications.push.enabled', e.target.checked)}
                                    />
                                  </Card.Body>
                                </Card>
                              </Tab.Pane>

                              {/* ── Privacidade & LGPD ── */}
                              <Tab.Pane eventKey="privacy">
                                <h5 className="fw-bold mb-1 d-flex align-items-center gap-2">
                                  <Lock size={18} className="text-primary" /> Privacidade &amp; LGPD
                                </h5>
                                <p className="small text-muted mb-4">
                                  Controles de privacidade conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
                                </p>

                                <Form>
                                  <Form.Group className="mb-3" style={{ maxWidth: 420 }}>
                                    <Form.Label className="small fw-semibold">
                                      Email do Encarregado de Dados (DPO)
                                    </Form.Label>
                                    <Form.Control
                                      type="email"
                                      value={settings.privacy.dpoEmail || ''}
                                      onChange={e => handleChange('privacy.dpoEmail', e.target.value)}
                                      placeholder="dpo@empresa.com.br"
                                    />
                                    <Form.Text className="text-muted">
                                      Contato responsável por dúvidas sobre dados pessoais tratados pelos seus agentes de IA.
                                    </Form.Text>
                                  </Form.Group>

                                  <Form.Check
                                    type="switch" id="p-consent"
                                    label="Autorizo o uso de dados anonimizados desta conta para melhoria do produto Venorica AI"
                                    checked={!!settings.privacy.dataProcessingConsent}
                                    onChange={e => handleChange('privacy.dataProcessingConsent', e.target.checked)}
                                    className="mb-4"
                                  />
                                </Form>

                                <Alert variant="info" className="small mb-4" style={{ maxWidth: 640 }}>
                                  <strong>Retenção de dados:</strong> a memória de trabalho das conversas é descartada
                                  ao final do atendimento. Fatos semânticos e reflexões usados para personalizar o
                                  atendimento são mantidos enquanto a conta estiver ativa e podem ser exportados ou
                                  excluídos a qualquer momento abaixo.
                                </Alert>

                                {privacyMsg && (
                                  <Alert variant={privacyMsg.type} className="small" style={{ maxWidth: 640 }}>
                                    {privacyMsg.text}
                                  </Alert>
                                )}

                                <div className="d-flex gap-2">
                                  <Button
                                    variant="outline-primary"
                                    onClick={handleExportData}
                                    disabled={privacyBusy !== null}
                                  >
                                    {privacyBusy === 'export'
                                      ? <Spinner size="sm" className="me-2" />
                                      : <Download size={15} className="me-2" />}
                                    Exportar meus dados
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    onClick={handleDeleteRequest}
                                    disabled={privacyBusy !== null}
                                  >
                                    {privacyBusy === 'delete'
                                      ? <Spinner size="sm" className="me-2" />
                                      : <Trash2 size={15} className="me-2" />}
                                    Solicitar exclusão de dados
                                  </Button>
                                </div>
                              </Tab.Pane>

                              {/* ── Aparência ── */}
                              <Tab.Pane eventKey="appearance">
                                <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                                  <span>🎨</span> Aparência e Marca
                                </h5>
                                <PartyProfileSettingsBody />
                              </Tab.Pane>

                              {/* ── Minha Conta ── */}
                              <Tab.Pane eventKey="account">
                                <h5 className="fw-bold mb-1 d-flex align-items-center gap-2">
                                  <User size={18} className="text-primary" /> Minha Conta
                                </h5>
                                <p className="small text-muted mb-4">
                                  Logado como <strong>{user?.email}</strong>
                                </p>

                                <Card className="card-border" style={{ maxWidth: 480 }}>
                                  <Card.Header className="small fw-semibold">Alterar Senha</Card.Header>
                                  <Card.Body>
                                    {pwdMsg && (
                                      <Alert variant={pwdMsg.type} className="small py-2 d-flex align-items-center">
                                        {pwdMsg.type === 'success'
                                          ? <CheckCircle size={15} className="me-2 flex-shrink-0" />
                                          : <AlertTriangle size={15} className="me-2 flex-shrink-0" />}
                                        {pwdMsg.text}
                                      </Alert>
                                    )}

                                    <Form.Group className="mb-3">
                                      <Form.Label className="small fw-semibold">Senha atual</Form.Label>
                                      <div className="input-group">
                                        <Form.Control
                                          type={pwdShow.current ? 'text' : 'password'}
                                          value={pwdForm.currentPassword}
                                          onChange={e => setPwdForm(p => ({ ...p, currentPassword: e.target.value }))}
                                          placeholder="Digite sua senha atual"
                                          autoComplete="current-password"
                                        />
                                        <button
                                          type="button"
                                          className="btn btn-outline-secondary"
                                          onClick={() => setPwdShow(s => ({ ...s, current: !s.current }))}
                                          tabIndex={-1}
                                        >
                                          {pwdShow.current ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                      </div>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                      <Form.Label className="small fw-semibold">Nova senha</Form.Label>
                                      <div className="input-group">
                                        <Form.Control
                                          type={pwdShow.next ? 'text' : 'password'}
                                          value={pwdForm.newPassword}
                                          onChange={e => setPwdForm(p => ({ ...p, newPassword: e.target.value }))}
                                          placeholder="Mínimo 8 caracteres"
                                          autoComplete="new-password"
                                        />
                                        <button
                                          type="button"
                                          className="btn btn-outline-secondary"
                                          onClick={() => setPwdShow(s => ({ ...s, next: !s.next }))}
                                          tabIndex={-1}
                                        >
                                          {pwdShow.next ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                      </div>
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                      <Form.Label className="small fw-semibold">Confirmar nova senha</Form.Label>
                                      <div className="input-group">
                                        <Form.Control
                                          type={pwdShow.confirm ? 'text' : 'password'}
                                          value={pwdForm.confirmPassword}
                                          onChange={e => setPwdForm(p => ({ ...p, confirmPassword: e.target.value }))}
                                          placeholder="Repita a nova senha"
                                          autoComplete="new-password"
                                        />
                                        <button
                                          type="button"
                                          className="btn btn-outline-secondary"
                                          onClick={() => setPwdShow(s => ({ ...s, confirm: !s.confirm }))}
                                          tabIndex={-1}
                                        >
                                          {pwdShow.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                      </div>
                                    </Form.Group>

                                    <Button
                                      variant="primary"
                                      onClick={handleChangePassword}
                                      disabled={pwdSaving}
                                    >
                                      {pwdSaving
                                        ? <><Spinner size="sm" className="me-2" />Salvando…</>
                                        : <><Lock size={14} className="me-2" />Alterar senha</>}
                                    </Button>
                                  </Card.Body>
                                </Card>
                              </Tab.Pane>

                            </Tab.Content>
                          </Col>
                        </Row>
                      </Tab.Container>
                    </div>
                  )}
                </div>
              </SimpleBar>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsBody;
