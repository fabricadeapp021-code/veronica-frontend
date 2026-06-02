'use client';

import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { Col, Row, Form, Button, Alert, Spinner, Nav, Tab, Card } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import {
  Save, Menu, Briefcase, Shield, Bell, Link2, Database,
  CheckCircle, AlertTriangle, Truck, MapPin, Phone, Mail, Hash,
} from 'react-feather';
import AdminSidebar from '../../users/AdminSidebar';
import { getTenantSettings, updateTenantSettings, getTenant } from '@/lib/api/services/tenant';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import PartyProfileSettingsBody from './PartyProfileSettingsBody';

const ALLOWED_ROLES = ['owner'];

const UF_LIST = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const SEGMENT_OPTIONS = [
  'Transportadora',
  'Logística',
  'Frota Própria',
  'Locadora de Veículos',
  'Construção Civil',
  'Agronegócio',
  'Mineração',
  'Outro',
];

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

  const [settings, setSettings] = useState({
    organization: {
      companyName: '',
      tradeName:   '',
      segment:     '',
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
        deviceOffline:  true,
        geofenceAlerts: true,
        weeklyReports:  true,
        maintenance:    true,
      },
      push: {
        enabled: true,
      },
    },
    integrations: {
      traccar:  { connected: false },
      whatsapp: { connected: false },
    },
    backup: {
      frequency:      'daily',
      retention:      30,
      lastBackup:     null,
      lastBackupSize: null,
    },
  });

  // ── carga ──────────────────────────────────────────────────────────────────
  useEffect(() => { loadSettings(); }, [user]);

  const loadSettings = async () => {
    if (!user?.tenantId) { setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      const [response, tenantData] = await Promise.all([
        getTenantSettings(user.tenantId),
        getTenant(user.tenantId).catch(() => null),
      ]);
      if (tenantData?.name) setTenantName(tenantData.name);
      const org = response?.organization ?? {};
      // compatibilidade retroativa — se a API ainda retornar partyName, mapeamos
      if (!org.companyName && org.partyName) org.companyName = org.partyName;
      setSettings(prev => ({
        organization:  { ...prev.organization,  ...org },
        security:      { ...prev.security,      ...(response?.security      ?? {}) },
        notifications: {
          email: { ...prev.notifications.email, ...(response?.notifications?.email ?? {}) },
          push:  { ...prev.notifications.push,  ...(response?.notifications?.push  ?? {}) },
        },
        integrations:  { ...prev.integrations,  ...(response?.integrations  ?? {}) },
        backup:        { ...prev.backup,         ...(response?.backup        ?? {}) },
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
      await updateTenantSettings(user.tenantId, settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err?.message ?? 'Erro ao salvar configurações.');
    } finally {
      setSaving(false);
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
          <Button variant="primary" onClick={() => router.push('/apps/fleet/dashboard')}>
            Voltar ao Dashboard
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
                    <li className="breadcrumb-item"><a href="/apps/fleet/dashboard">TMS</a></li>
                    <li className="breadcrumb-item active">Configurações</li>
                  </ol>
                </nav>
              </div>
              <div className="contact-options-wrap">
                {activeTab !== 'appearance' && (
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
                                <Nav.Link eventKey="integrations">
                                  <Link2 size={15} className="me-2" />Integrações
                                </Nav.Link>
                              </Nav.Item>
                              <Nav.Item>
                                <Nav.Link eventKey="backup">
                                  <Database size={15} className="me-2" />Backup
                                </Nav.Link>
                              </Nav.Item>
                              <Nav.Item>
                                <Nav.Link eventKey="appearance">
                                  <span className="me-2">🎨</span>Aparência
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
                                  <Truck size={18} className="text-primary" /> Dados da Empresa
                                </h5>
                                {tenantName && (
                                  <p className="small text-muted mb-4">Conta: <strong>{tenantName}</strong></p>
                                )}

                                <Form>
                                  <h6 className="text-primary border-bottom pb-2 mb-3">Identificação</h6>
                                  <Row className="gx-3">
                                    <Col sm={8}>
                                      <Form.Group className="mb-3">
                                        <Form.Label className="small fw-semibold">Razão Social *</Form.Label>
                                        <Form.Control
                                          value={settings.organization.companyName || ''}
                                          onChange={e => handleChange('organization.companyName', e.target.value)}
                                          placeholder="Ex: Transportadora Silva Ltda"
                                        />
                                      </Form.Group>
                                    </Col>
                                    <Col sm={4}>
                                      <Form.Group className="mb-3">
                                        <Form.Label className="small fw-semibold">Nome Fantasia</Form.Label>
                                        <Form.Control
                                          value={settings.organization.tradeName || ''}
                                          onChange={e => handleChange('organization.tradeName', e.target.value)}
                                          placeholder="Ex: Silva Transportes"
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
                                      </Form.Group>
                                    </Col>
                                    <Col sm={6}>
                                      <Form.Group className="mb-3">
                                        <Form.Label className="small fw-semibold">Segmento</Form.Label>
                                        <Form.Select
                                          value={settings.organization.segment || ''}
                                          onChange={e => handleChange('organization.segment', e.target.value)}
                                        >
                                          <option value="">Selecione…</option>
                                          {SEGMENT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                        </Form.Select>
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
                                    <Form.Check type="switch" id="n-offline"
                                      label="Dispositivo offline por mais de 1 hora"
                                      checked={!!settings.notifications.email.deviceOffline}
                                      onChange={e => handleChange('notifications.email.deviceOffline', e.target.checked)}
                                      className="mb-2"
                                    />
                                    <Form.Check type="switch" id="n-geo"
                                      label="Alertas de entrada/saída em geofences"
                                      checked={!!settings.notifications.email.geofenceAlerts}
                                      onChange={e => handleChange('notifications.email.geofenceAlerts', e.target.checked)}
                                      className="mb-2"
                                    />
                                    <Form.Check type="switch" id="n-maint"
                                      label="Lembretes de manutenção preventiva"
                                      checked={!!settings.notifications.email.maintenance}
                                      onChange={e => handleChange('notifications.email.maintenance', e.target.checked)}
                                      className="mb-2"
                                    />
                                    <Form.Check type="switch" id="n-report"
                                      label="Resumo semanal de viagens e KPIs"
                                      checked={!!settings.notifications.email.weeklyReports}
                                      onChange={e => handleChange('notifications.email.weeklyReports', e.target.checked)}
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

                              {/* ── Integrações ── */}
                              <Tab.Pane eventKey="integrations">
                                <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                                  <Link2 size={18} className="text-primary" /> Integrações
                                </h5>
                                <div className="list-group">
                                  <div className="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                      <strong>Traccar (rastreamento GPS)</strong>
                                      <br />
                                      <small className="text-muted">
                                        Configurações avançadas em <a href="/apps/fleet/settings">Frota → Configurações</a>
                                      </small>
                                    </div>
                                    <span className={`badge bg-${settings.integrations.traccar?.connected ? 'success' : 'secondary'}`}>
                                      {settings.integrations.traccar?.connected ? 'Ativo' : 'Verificar'}
                                    </span>
                                  </div>
                                  <div className="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                      <strong>WhatsApp Business API</strong>
                                      <br />
                                      <small className="text-muted">Alertas e notificações via WhatsApp</small>
                                    </div>
                                    {settings.integrations.whatsapp?.connected
                                      ? <span className="badge bg-success">Conectado</span>
                                      : <Button variant="outline-primary" size="sm">Conectar</Button>}
                                  </div>
                                </div>
                              </Tab.Pane>

                              {/* ── Backup ── */}
                              <Tab.Pane eventKey="backup">
                                <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                                  <Database size={18} className="text-primary" /> Backup e Recuperação
                                </h5>
                                <Row className="gx-3" style={{ maxWidth: 480 }}>
                                  <Col sm={6}>
                                    <Form.Group className="mb-3">
                                      <Form.Label className="small fw-semibold">Frequência</Form.Label>
                                      <Form.Select
                                        value={settings.backup.frequency}
                                        onChange={e => handleChange('backup.frequency', e.target.value)}
                                      >
                                        <option value="hourly">A cada hora</option>
                                        <option value="daily">Diário</option>
                                        <option value="weekly">Semanal</option>
                                        <option value="monthly">Mensal</option>
                                      </Form.Select>
                                    </Form.Group>
                                  </Col>
                                  <Col sm={6}>
                                    <Form.Group className="mb-3">
                                      <Form.Label className="small fw-semibold">Retenção</Form.Label>
                                      <Form.Select
                                        value={settings.backup.retention}
                                        onChange={e => handleChange('backup.retention', parseInt(e.target.value, 10))}
                                      >
                                        <option value={7}>7 dias</option>
                                        <option value={30}>30 dias</option>
                                        <option value={90}>90 dias</option>
                                        <option value={365}>1 ano</option>
                                      </Form.Select>
                                    </Form.Group>
                                  </Col>
                                </Row>
                                {settings.backup.lastBackup && (
                                  <Alert variant="info" className="small mt-2" style={{ maxWidth: 480 }}>
                                    <strong>Último backup:</strong>{' '}
                                    {new Date(settings.backup.lastBackup).toLocaleString('pt-BR')}
                                    {settings.backup.lastBackupSize && (
                                      <> &mdash; {settings.backup.lastBackupSize}</>
                                    )}
                                  </Alert>
                                )}
                              </Tab.Pane>

                              {/* ── Aparência ── */}
                              <Tab.Pane eventKey="appearance">
                                <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                                  <span>🎨</span> Aparência e Marca
                                </h5>
                                <PartyProfileSettingsBody />
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
