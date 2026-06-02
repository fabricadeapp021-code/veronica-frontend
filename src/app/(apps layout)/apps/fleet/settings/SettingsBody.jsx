'use client';
import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Alert, Spinner, Badge, Modal } from 'react-bootstrap';
import { Settings, CheckCircle, AlertTriangle, RefreshCw, User, Shield, Clock } from 'react-feather';
import SimpleBar from 'simplebar-react';
import { getTenantConfig, createTraccarUser, syncTraccarPermissions, updateTenantConfig } from '@/lib/api/services/fleet';

export default function SettingsBody() {
  const [config,      setConfig]      = useState(null);
  const [loading,     setLoading]     = useState(true);

  // Onboarding Traccar
  const [showSetup,   setShowSetup]   = useState(false);
  const [setupForm,   setSetupForm]   = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [setupSaving, setSetupSaving] = useState(false);
  const [setupError,  setSetupError]  = useState('');
  const [setupSuccess,setSetupSuccess]= useState('');

  // Sync permissões
  const [syncing,     setSyncing]     = useState(false);
  const [syncMsg,     setSyncMsg]     = useState('');

  // Timezone
  const [timezone,     setTimezone]     = useState('America/Sao_Paulo');
  const [tzSaving,     setTzSaving]     = useState(false);
  const [tzMsg,        setTzMsg]        = useState('');

  const [isDark, setIsDark] = useState(false);

  useEffect(() => { loadConfig(); }, []);

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.getAttribute('data-bs-theme') === 'dark');
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] });
    return () => observer.disconnect();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await getTenantConfig();
      setConfig(data);
      if (data?.timezone) setTimezone(data.timezone);
    } catch {
      setConfig(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    if (setupForm.password !== setupForm.confirmPassword) {
      setSetupError('As senhas não coincidem.');
      return;
    }
    if (setupForm.password.length < 8) {
      setSetupError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    setSetupSaving(true); setSetupError(''); setSetupSuccess('');
    try {
      await createTraccarUser(setupForm.name, setupForm.email, setupForm.password);
      setSetupSuccess('Usuário Traccar criado com sucesso! O isolamento de dados está ativo.');
      await loadConfig();
      setShowSetup(false);
    } catch (err) {
      setSetupError(err?.message ?? 'Erro ao criar usuário Traccar.');
    } finally {
      setSetupSaving(false);
    }
  };

  const handleSync = async () => {
    if (!config?.traccarUserId) return;
    setSyncing(true); setSyncMsg('');
    try {
      const res = await syncTraccarPermissions(config.traccarUserId);
      setSyncMsg(`Sincronização concluída: ${res?.synced ?? 0} permissões OK${res?.failed ? `, ${res.failed} falhas` : ''}.`);
    } catch (err) {
      setSyncMsg(`Erro: ${err?.message ?? 'falha ao sincronizar.'}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveTimezone = async () => {
    setTzSaving(true); setTzMsg('');
    try {
      await updateTenantConfig({ timezone });
      setTzMsg('Timezone salvo com sucesso.');
      setConfig(prev => ({ ...prev, timezone }));
    } catch (err) {
      setTzMsg(`Erro: ${err?.message ?? 'falha ao salvar.'}`);
    } finally {
      setTzSaving(false);
    }
  };

  const traccarReady = !!config?.traccarUserId;

  return (
    <div className="fm-body">
      <SimpleBar className="nicescroll-bar">
        <div className="container-fluid px-4 py-4" style={{ maxWidth: 900 }}>

          {/* Header */}
          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="avatar avatar-icon avatar-lg avatar-soft-primary avatar-rounded">
              <Settings size={22} />
            </div>
            <div>
              <h4 className="fw-bold mb-0">Configurações da Frota</h4>
              <small className="text-muted">Integração Traccar, isolamento multi-tenant e preferências</small>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5"><Spinner /></div>
          ) : (
            <Row className="g-4">

              {/* Card: Status da Integração Traccar */}
              <Col xs={12}>
                <Card className="card-border">
                  <Card.Header className="d-flex align-items-center justify-content-between bg-transparent">
                    <div className="d-flex align-items-center gap-2">
                      <Shield size={18} className="text-primary" />
                      <strong>Isolamento Traccar (Multi-tenant)</strong>
                    </div>
                    {traccarReady
                      ? (
                        <div
                          className="d-flex align-items-center gap-1 px-2 py-1 rounded"
                          style={{
                            background: isDark ? 'transparent' : '#d1e7dd',
                            border: `1px solid ${isDark ? '#198754' : '#badbcc'}`,
                            color: isDark ? '#198754' : '#0f5132',
                          }}
                        >
                          <CheckCircle size={12} /> Ativo
                        </div>
                      )
                      : <Badge bg="warning" text="dark" className="d-flex align-items-center gap-1"><AlertTriangle size={12} /> Não configurado</Badge>
                    }
                  </Card.Header>
                  <Card.Body>
                    {traccarReady ? (
                      <>
                        <Alert variant="success" className="py-2 small mb-3">
                          <CheckCircle size={14} className="me-1" />
                          Seu tenant tem um usuário Traccar dedicado. Todos os novos veículos cadastrados são automaticamente vinculados a este usuário, garantindo isolamento total entre clientes.
                        </Alert>
                        <Row className="g-3 mb-3">
                          <Col md={4}>
                            <small className="text-muted d-block">Traccar User ID</small>
                            <strong>#{config.traccarUserId}</strong>
                          </Col>
                          <Col md={4}>
                            <small className="text-muted d-block">Email Traccar</small>
                            <strong>{config.traccarUserEmail ?? '–'}</strong>
                          </Col>
                          <Col md={4}>
                            <small className="text-muted d-block">Timezone</small>
                            <strong>{config.timezone ?? 'America/Sao_Paulo'}</strong>
                          </Col>
                        </Row>
                        <div className="d-flex gap-2">
                          <Button
                            variant={isDark ? "outline-primary" : "primary"}
                            size="sm"
                            className={`d-flex align-items-center gap-1 ${!isDark ? "text-white" : ""}`}
                            disabled={syncing}
                            onClick={handleSync}
                          >
                            {syncing ? <Spinner size="sm" /> : <RefreshCw size={14} />}
                            {syncing ? 'Sincronizando…' : 'Sincronizar Permissões'}
                          </Button>
                        </div>
                        {syncMsg && (
                          <Alert variant={syncMsg.startsWith('Erro') ? 'danger' : 'success'} className="py-2 small mt-2 mb-0">
                            {syncMsg}
                          </Alert>
                        )}
                      </>
                    ) : (
                      <>
                        <Alert variant="warning" className="py-2 small mb-3">
                          <AlertTriangle size={14} className="me-1" />
                          <strong>Ação necessária:</strong> Para garantir que os dados de rastreamento da sua frota fiquem isolados dos demais clientes, é necessário criar um usuário Traccar exclusivo para o seu tenant.
                        </Alert>
                        <p className="small text-muted mb-3">
                          Após criar o usuário, todos os veículos, motoristas e geofences cadastrados serão automaticamente vinculados a ele. Sem isso, um bug de configuração no servidor Traccar poderia expor dados entre tenants.
                        </p>
                        <Button variant="primary" size="sm" className="d-flex align-items-center gap-1" onClick={() => { setSetupError(''); setSetupSuccess(''); setShowSetup(true); }}>
                          <User size={14} /> Configurar Isolamento Traccar
                        </Button>
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              {/* Card: Informações do Tenant */}
              <Col xs={12}>
                <Card className="card-border">
                  <Card.Header className="d-flex align-items-center gap-2 bg-transparent">
                    <Clock size={18} className="text-primary" />
                    <strong>Preferências da Frota</strong>
                  </Card.Header>
                  <Card.Body>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Label className="small fw-semibold">Timezone da Frota</Form.Label>
                        <div className="d-flex gap-2">
                          <Form.Select value={timezone} onChange={e => setTimezone(e.target.value)}>
                            <option value="America/Sao_Paulo">America/Sao_Paulo (GMT-3)</option>
                            <option value="America/Manaus">America/Manaus (GMT-4)</option>
                            <option value="America/Belem">America/Belem (GMT-3)</option>
                            <option value="America/Fortaleza">America/Fortaleza (GMT-3)</option>
                            <option value="America/Recife">America/Recife (GMT-3)</option>
                            <option value="America/Porto_Velho">America/Porto_Velho (GMT-4)</option>
                            <option value="America/Cuiaba">America/Cuiaba (GMT-4)</option>
                            <option value="America/Rio_Branco">America/Rio_Branco (GMT-5)</option>
                          </Form.Select>
                          <Button variant="primary" size="sm" disabled={tzSaving} onClick={handleSaveTimezone} style={{ whiteSpace: 'nowrap' }}>
                            {tzSaving ? <Spinner size="sm" /> : 'Salvar'}
                          </Button>
                        </div>
                        {tzMsg && (
                          <Form.Text className={tzMsg.startsWith('Erro') ? 'text-danger' : 'text-success'}>
                            {tzMsg}
                          </Form.Text>
                        )}
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>

            </Row>
          )}
        </div>
      </SimpleBar>

      {/* Modal: Setup Traccar User */}
      <Modal show={showSetup} onHide={() => setShowSetup(false)} centered>
        <Form onSubmit={handleSetupSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold text-dark">
              <Shield size={16} className="me-2 text-primary" />
              Configurar Isolamento Traccar
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant="info" className="py-2 small mb-3">
              Crie uma conta Traccar exclusiva para a sua frota. Use um email e senha seguros — estes dados são usados internamente pelo sistema para garantir isolamento dos dados.
            </Alert>
            {setupError   && <Alert variant="danger"  className="py-2 small">{setupError}</Alert>}
            {setupSuccess && <Alert variant="success" className="py-2 small">{setupSuccess}</Alert>}
            <Row className="g-3">
              <Col xs={12}>
                <Form.Label className="small fw-semibold">Nome da Frota *</Form.Label>
                <Form.Control
                  placeholder="Ex: Frota SBT Logística"
                  value={setupForm.name}
                  onChange={e => setSetupForm(p => ({ ...p, name: e.target.value }))}
                  required
                />
              </Col>
              <Col xs={12}>
                <Form.Label className="small fw-semibold">Email Traccar *</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="frota@suaempresa.com.br"
                  value={setupForm.email}
                  onChange={e => setSetupForm(p => ({ ...p, email: e.target.value }))}
                  required
                />
                <Form.Text className="text-muted">Deve ser diferente do seu email de login no TMS.</Form.Text>
              </Col>
              <Col md={6}>
                <Form.Label className="small fw-semibold">Senha *</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={setupForm.password}
                  onChange={e => setSetupForm(p => ({ ...p, password: e.target.value }))}
                  required
                  minLength={8}
                />
              </Col>
              <Col md={6}>
                <Form.Label className="small fw-semibold">Confirmar senha *</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Repita a senha"
                  value={setupForm.confirmPassword}
                  onChange={e => setSetupForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  required
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" size="sm" onClick={() => setShowSetup(false)}>Cancelar</Button>
            <Button type="submit" variant="primary" size="sm" disabled={setupSaving}>
              {setupSaving && <Spinner size="sm" className="me-1" />}
              {setupSaving ? 'Criando…' : 'Ativar Isolamento'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
