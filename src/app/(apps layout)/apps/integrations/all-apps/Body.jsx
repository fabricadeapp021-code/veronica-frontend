'use client';

import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Modal, Row, Spinner } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import {
  createIntegration,
  deleteIntegration,
  getGoogleAuthUrl,
  getIntegrationProviders,
  getIntegrations,
} from '@/lib/api/services/integrations';

const CATEGORY_LABELS = {
  communication: 'Comunicação',
  crm: 'CRM',
  knowledge: 'Conhecimento',
  helpdesk: 'Helpdesk',
  channel: 'Canal',
  runtime: 'Runtime',
};

const PROVIDER_ICONS = {
  google_calendar: { bg: '#fff', emoji: '📅' },
  google_gmail: { bg: '#fff', emoji: '✉️' },
  google_drive: { bg: '#fff', emoji: '📁' },
  google_sheets: { bg: '#fff', emoji: '📊' },
  clickup: { bg: '#7B68EE', emoji: '✔️' },
  slack: { bg: '#4A154B', emoji: '💬' },
  hubspot: { bg: '#FF7A59', emoji: '🔶' },
  pipedrive: { bg: '#1A73E8', emoji: '📈' },
  notion: { bg: '#000', emoji: '📝' },
  whatsapp: { bg: '#25D366', emoji: '💬' },
  helpdesk: { bg: '#0078D4', emoji: '🎫' },
  documents: { bg: '#6366F1', emoji: '📄' },
  webhook: { bg: '#374151', emoji: '🔗' },
  openclaw_gateway: { bg: '#1F2937', emoji: '⚙️' },
};

const OAUTH_PROVIDERS = ['google_calendar', 'google_gmail', 'google_drive', 'google_sheets', 'slack'];
const GOOGLE_PROVIDERS = ['google_calendar', 'google_gmail', 'google_drive', 'google_sheets'];

function ProviderIcon({ providerKey }) {
  const icon = PROVIDER_ICONS[providerKey] || { bg: '#6B7280', emoji: '🔌' };
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        background: icon.bg,
        border: '1px solid #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 22,
        marginBottom: 12,
      }}
    >
      {icon.emoji}
    </div>
  );
}

function ApiKeyModal({ provider, onClose, onSaved }) {
  const [fields, setFields] = useState({ apiKey: '', listId: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!fields.apiKey.trim()) {
      setError('API Key é obrigatória.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const credentials = { apiKey: fields.apiKey.trim() };
      if (fields.listId.trim()) credentials.defaultListId = fields.listId.trim();

      await createIntegration({
        providerKey: provider.key,
        name: provider.name,
        credentials,
        scopes: provider.requiredScopes,
        config: provider.defaultConfig || {},
      });
      onSaved();
    } catch (e) {
      setError(e?.message || 'Erro ao salvar integração.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal show onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          <ProviderIcon providerKey={provider.key} />
          Conectar {provider.name}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted fs-7 mb-3">{provider.description}</p>
        {error && <Alert variant="danger" className="py-2 fs-7">{error}</Alert>}
        <Form>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">API Key <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="password"
              placeholder={`Cole sua ${provider.name} API Key`}
              value={fields.apiKey}
              onChange={e => setFields(f => ({ ...f, apiKey: e.target.value }))}
            />
            {provider.key === 'clickup' && (
              <Form.Text className="text-muted">
                Encontre em: ClickUp → Configurações → Apps → API Token
              </Form.Text>
            )}
          </Form.Group>
          {provider.key === 'clickup' && (
            <Form.Group>
              <Form.Label className="fw-semibold">List ID padrão <span className="text-muted fw-normal">(opcional)</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="Ex: 901234567890"
                value={fields.listId}
                onChange={e => setFields(f => ({ ...f, listId: e.target.value }))}
              />
              <Form.Text className="text-muted">
                ID da lista onde as tarefas serão criadas por padrão.
              </Form.Text>
            </Form.Group>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? <><Spinner size="sm" className="me-2" />Salvando...</> : 'Conectar'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function IntegrationCard({ provider, connectedMap, onConnect, onDisconnect }) {
  const connected = connectedMap[provider.key];
  const isOauth = OAUTH_PROVIDERS.includes(provider.key);
  const isInternal = provider.authType === 'internal' || provider.authType === 'file_upload';

  if (isInternal) return null;

  return (
    <Col xxl={3} xl={4} md={6} className="mb-4">
      <Card className="card-border h-100" style={{ borderRadius: 12 }}>
        <Card.Body className="pb-2">
          <ProviderIcon providerKey={provider.key} />
          <div className="d-flex align-items-center gap-2 mb-1">
            <strong className="fs-6">{provider.name}</strong>
            {connected && (
              <Badge bg="success" style={{ fontSize: 10 }}>Conectado</Badge>
            )}
          </div>
          <div className="text-muted" style={{ fontSize: 11, marginBottom: 6 }}>
            {CATEGORY_LABELS[provider.category] || provider.category}
            {' · '}
            {isOauth ? 'OAuth' : 'API Key'}
          </div>
          <p className="p-sm text-muted mb-0" style={{ fontSize: 12, lineHeight: 1.5 }}>
            {provider.description}
          </p>
        </Card.Body>
        <Card.Footer className="d-flex justify-content-between align-items-center border-0 pt-0">
          <div style={{ fontSize: 11, color: '#9CA3AF' }}>
            {provider.requiredScopes?.slice(0, 2).join(', ')}
            {provider.requiredScopes?.length > 2 && ` +${provider.requiredScopes.length - 2}`}
          </div>
          {connected ? (
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => onDisconnect(connected._id)}
            >
              Desconectar
            </Button>
          ) : (
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => onConnect(provider)}
            >
              Conectar
            </Button>
          )}
        </Card.Footer>
      </Card>
    </Col>
  );
}

const Body = () => {
  const [providers, setProviders] = useState([]);
  const [connectedMap, setConnectedMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  const [connectingOauth, setConnectingOauth] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [providersRes, integrationsRes] = await Promise.all([
        getIntegrationProviders(),
        getIntegrations(),
      ]);
      setProviders(providersRes.providers || []);
      const map = {};
      for (const i of integrationsRes.integrations || []) {
        map[i.providerKey] = i;
      }
      setConnectedMap(map);
    } catch (e) {
      setError('Erro ao carregar integrações.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleConnect(provider) {
    if (GOOGLE_PROVIDERS.includes(provider.key)) {
      setConnectingOauth(provider.key);
      try {
        const res = await getGoogleAuthUrl();
        window.location.href = res.authUrl;
      } catch {
        setError('Erro ao obter URL de autorização do Google.');
        setConnectingOauth(null);
      }
      return;
    }
    if (provider.authType === 'api_key') {
      setActiveModal(provider);
      return;
    }
    setError(`Conexão via ${provider.authType} ainda não implementada neste painel.`);
  }

  async function handleDisconnect(id) {
    try {
      await deleteIntegration(id);
      setSuccessMsg('Integração desconectada.');
      setTimeout(() => setSuccessMsg(''), 3000);
      load();
    } catch {
      setError('Erro ao desconectar integração.');
    }
  }

  function handleSaved() {
    setActiveModal(null);
    setSuccessMsg('Integração conectada com sucesso!');
    setTimeout(() => setSuccessMsg(''), 3000);
    load();
  }

  const grouped = providers.reduce((acc, p) => {
    const cat = p.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const categoryOrder = ['communication', 'crm', 'knowledge', 'helpdesk', 'channel'];

  return (
    <div className="integrations-body">
      <SimpleBar className="nicescroll-bar">
        <Container className="mt-md-7 mt-3 pb-6">
          {successMsg && (
            <Alert variant="success" className="py-2 fs-7" onClose={() => setSuccessMsg('')} dismissible>
              {successMsg}
            </Alert>
          )}
          {error && (
            <Alert variant="danger" className="py-2 fs-7" onClose={() => setError('')} dismissible>
              {error}
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-6">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-3">Carregando integrações...</p>
            </div>
          ) : (
            categoryOrder.map(cat => {
              const items = grouped[cat];
              if (!items?.length) return null;
              return (
                <div key={cat} className="mb-6">
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <div>
                      <h5 className="mb-1">{CATEGORY_LABELS[cat] || cat}</h5>
                      <p className="text-muted fs-7 mb-0">
                        {items.filter(p => connectedMap[p.key]).length} de {items.filter(p => p.authType !== 'internal' && p.authType !== 'file_upload').length} conectados
                      </p>
                    </div>
                  </div>
                  <Row>
                    {items.map(provider => (
                      <IntegrationCard
                        key={provider.key}
                        provider={provider}
                        connectedMap={connectedMap}
                        onConnect={handleConnect}
                        onDisconnect={handleDisconnect}
                      />
                    ))}
                  </Row>
                </div>
              );
            })
          )}
        </Container>
      </SimpleBar>

      {activeModal && (
        <ApiKeyModal
          provider={activeModal}
          onClose={() => setActiveModal(null)}
          onSaved={handleSaved}
        />
      )}

      {connectingOauth && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, textAlign: 'center' }}>
            <Spinner animation="border" variant="primary" className="mb-3" />
            <p className="mb-0">Redirecionando para autorização Google...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Body;
