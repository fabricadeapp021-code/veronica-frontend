'use client';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, Col, Form, InputGroup, Row, Spinner } from 'react-bootstrap';
import { Plus, Search, ShoppingBag, ExternalLink } from 'react-feather';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api/client';
import AgentsSidebar from '../AgentsSidebar';
import { showCustomAlert, showCustomToast } from '@/components/CustomAlert/CustomAlert';

// Mapeamento de conectores para badge visual (mesmo padrão das integrações)
const CONNECTOR_ICONS = {
  whatsapp:         { bg: '#25D366', emoji: '💬', label: 'WhatsApp' },
  clickup:          { bg: '#7B68EE', emoji: '✔️', label: 'ClickUp' },
  property_catalog: { bg: '#F59E0B', emoji: '🏠', label: 'Catálogo' },
  google_calendar:  { bg: '#4285F4', emoji: '📅', label: 'Agenda' },
  google_gmail:     { bg: '#EA4335', emoji: '✉️', label: 'Gmail' },
  slack:            { bg: '#4A154B', emoji: '💬', label: 'Slack' },
  hubspot:          { bg: '#FF7A59', emoji: '🔶', label: 'HubSpot' },
  pipedrive:        { bg: '#1A73E8', emoji: '📈', label: 'Pipedrive' },
  crm:              { bg: '#6366F1', emoji: '📋', label: 'CRM' },
};

// Categorias do marketplace
const CATEGORIES = {
  all:         { label: 'Todos', filter: () => true },
  real_estate: { label: '🏠 Imobiliário', filter: (t) => t.key.startsWith('real_estate') },
  hospital:    { label: '🏥 Hospitalar',  filter: (t) => t.key.startsWith('hospital') },
  commercial:  { label: '💼 Comercial',   filter: (t) => ['venorica_clara_247', 'timesheet_manager'].includes(t.key) },
};

// Avatar com inicial do agente
const AgentAvatar = ({ name, recommended }) => {
  const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div
      className="d-flex align-items-center justify-content-center rounded-circle mb-3 flex-shrink-0"
      style={{ width: 56, height: 56, background: color, fontSize: 22, fontWeight: 700, color: '#fff', position: 'relative' }}
    >
      {name?.[0]?.toUpperCase() || '?'}
      {recommended && (
        <span
          style={{
            position: 'absolute', bottom: -2, right: -2,
            background: '#22C55E', borderRadius: '50%',
            width: 18, height: 18, fontSize: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          }}
          title="Recomendado"
        >★</span>
      )}
    </div>
  );
};

// Badge de conector
const ConnectorBadge = ({ providerKey }) => {
  const icon = CONNECTOR_ICONS[providerKey] || { bg: '#6B7280', emoji: '🔌', label: providerKey };
  return (
    <span
      className="d-inline-flex align-items-center gap-1 rounded px-2 py-1 me-1 mb-1"
      style={{ background: icon.bg + '22', border: `1px solid ${icon.bg}44`, fontSize: 11 }}
      title={icon.label}
    >
      <span style={{ fontSize: 13 }}>{icon.emoji}</span>
      <span style={{ color: icon.bg, fontWeight: 600 }}>{icon.label}</span>
    </span>
  );
};

const MarketplacePage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hiring, setHiring] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/agents/templates');
      const list = data?.templates || [];
      setTemplates(
        [...list].sort((a, b) => {
          if (a.recommended && !b.recommended) return -1;
          if (!a.recommended && b.recommended) return 1;
          return String(a.name).localeCompare(String(b.name));
        }),
      );
    } catch (err) {
      showCustomAlert({
        variant: 'danger',
        title: 'Erro ao carregar marketplace',
        text: err?.message || 'Não foi possível carregar os agentes disponíveis.',
        confirmButtonText: 'Tentar novamente',
      }).then((result) => {
        if (result.isConfirmed) loadTemplates();
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const hire = async (template) => {
    const result = await showCustomAlert({
      variant: 'info',
      title: `Contratar ${template.name}?`,
      html: `
        <p class="mb-2">${template.shortDescription}</p>
        <small class="text-muted">O agente será criado e ficará disponível no seu time imediatamente.</small>
      `,
      showCancelButton: true,
      confirmButtonText: `Contratar`,
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    try {
      setHiring(template.key);
      await apiRequest('/agents', {
        method: 'POST',
        body: {
          templateKey: template.key,
          name: template.name,
          roleTitle: template.roleTitle,
          description: template.shortDescription,
          autonomyLevel: 'supervised',
          skills: template.skills || [],
          config: { tone: template.defaultConfig?.tone || '' },
        },
      });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      showCustomToast({ variant: 'success', title: `${template.name} contratada com sucesso!` });
      router.push('/apps/agents');
    } catch (err) {
      setHiring(null);
      showCustomAlert({
        variant: 'danger',
        title: 'Erro ao contratar',
        html: `
          <p class="mb-3">${err?.message || 'Não foi possível contratar este agente.'}</p>
          <a href="/apps/billing" class="btn btn-sm btn-outline-primary me-2">Ver plano</a>
          <a href="#" class="btn btn-sm btn-outline-secondary">FAQ</a>
        `,
        confirmButtonText: 'Fechar',
      });
    }
  };

  const filtered = useMemo(() => {
    const byCategory = templates.filter(CATEGORIES[category]?.filter || (() => true));
    if (!search.trim()) return byCategory;
    const q = search.toLowerCase();
    return byCategory.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.roleTitle?.toLowerCase().includes(q) ||
        t.shortDescription?.toLowerCase().includes(q) ||
        t.skills?.some((s) => s.includes(q)),
    );
  }, [templates, category, search]);

  const recommended = useMemo(() => filtered.filter((t) => t.recommended), [filtered]);
  const others = useMemo(() => filtered.filter((t) => !t.recommended), [filtered]);

  return (
    <div className="hk-pg-body py-0">
      <div className="fmapp-wrap">
        <AgentsSidebar />
        <div className="fmapp-content">
          <div className="fmapp-detail-wrap" style={{ overflowY: 'auto' }}>
            <div className="p-4">

              {/* Header */}
              <div className="d-flex align-items-center gap-3 mb-4">
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                  style={{ width: 48, height: 48, background: '#6366F1', color: '#fff' }}
                >
                  <ShoppingBag size={22} />
                </div>
                <div>
                  <h4 className="mb-0">Marketplace de Agentes IA</h4>
                  <p className="text-muted mb-0 small">Contrate funcionários IA especializados para o seu negócio.</p>
                </div>
              </div>

              {/* Busca + Categorias */}
              <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
                <InputGroup style={{ maxWidth: 320 }}>
                  <InputGroup.Text className="bg-transparent">
                    <Search size={16} />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Buscar agente..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </InputGroup>

                <div className="d-flex flex-wrap gap-2">
                  {Object.entries(CATEGORIES).map(([key, cat]) => (
                    <Button
                      key={key}
                      size="sm"
                      variant={category === key ? 'primary' : 'outline-secondary'}
                      className="btn-rounded"
                      onClick={() => setCategory(key)}
                    >
                      {cat.label}
                    </Button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 text-muted">Carregando marketplace...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <ShoppingBag size={40} className="mb-3 opacity-25" />
                  <p>Nenhum agente encontrado para <strong>{search || category}</strong>.</p>
                </div>
              ) : (
                <>
                  {/* Seção Recomendados */}
                  {recommended.length > 0 && (
                    <>
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <h6 className="mb-0 fw-semibold">⭐ Recomendados</h6>
                        <Badge bg="success" pill>{recommended.length}</Badge>
                      </div>
                      <Row className="g-3 mb-5">
                        {recommended.map((t) => (
                          <Col key={t.key} xxl={4} xl={4} lg={6} md={6}>
                            <AgentCard template={t} hiring={hiring} onHire={hire} />
                          </Col>
                        ))}
                      </Row>
                    </>
                  )}

                  {/* Seção Outros */}
                  {others.length > 0 && (
                    <>
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <h6 className="mb-0 fw-semibold">Outros agentes</h6>
                        <Badge bg="secondary" pill>{others.length}</Badge>
                      </div>
                      <Row className="g-3">
                        {others.map((t) => (
                          <Col key={t.key} xxl={4} xl={4} lg={6} md={6}>
                            <AgentCard template={t} hiring={hiring} onHire={hire} />
                          </Col>
                        ))}
                      </Row>
                    </>
                  )}

                  {/* Em breve */}
                  <div className="mt-5 pt-4 border-top">
                    <h6 className="fw-semibold mb-3 text-muted">🚧 Em breve no marketplace</h6>
                    <Row className="g-3">
                      {[
                        { name: 'RH Inteligente', role: 'Agente de Recursos Humanos', emoji: '👥' },
                        { name: 'Financeiro', role: 'Agente de Controle Financeiro', emoji: '📊' },
                        { name: 'Jurídico', role: 'Agente de Suporte Jurídico', emoji: '⚖️' },
                      ].map((item) => (
                        <Col key={item.name} xxl={4} xl={4} lg={6} md={6}>
                          <Card className="card-border h-100 opacity-60" style={{ cursor: 'default' }}>
                            <Card.Body className="d-flex flex-column">
                              <div className="d-flex align-items-center gap-3 mb-3">
                                <div
                                  className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                                  style={{ width: 56, height: 56, background: '#E5E7EB', fontSize: 22 }}
                                >
                                  {item.emoji}
                                </div>
                                <div>
                                  <h6 className="mb-0">{item.name}</h6>
                                  <small className="text-muted">{item.role}</small>
                                </div>
                              </div>
                              <Badge bg="secondary" className="align-self-start mt-auto">Em breve</Badge>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Card individual do agente
const AgentCard = ({ template, hiring, onHire }) => (
  <Card className="card-border h-100" style={{ transition: 'box-shadow .2s' }}
    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.12)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; }}
  >
    <Card.Body className="d-flex flex-column">
      {/* Header do card */}
      <div className="d-flex align-items-center gap-3 mb-3">
        <AgentAvatar name={template.name} recommended={template.recommended} />
        <div className="min-w-0">
          <h6 className="mb-0 text-truncate">{template.name}</h6>
          <small className="text-muted">{template.roleTitle}</small>
        </div>
      </div>

      {/* Descrição */}
      <p className="text-muted small mb-3" style={{ lineHeight: 1.5 }}>
        {template.shortDescription}
      </p>

      {/* Conectores sugeridos */}
      {template.suggestedIntegrations?.length > 0 && (
        <div className="mb-3">
          <small className="text-muted d-block mb-1" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: .5 }}>Conectores</small>
          <div className="d-flex flex-wrap">
            {template.suggestedIntegrations.slice(0, 4).map((key) => (
              <ConnectorBadge key={key} providerKey={key} />
            ))}
            {template.suggestedIntegrations.length > 4 && (
              <span className="text-muted small align-self-center">+{template.suggestedIntegrations.length - 4}</span>
            )}
          </div>
        </div>
      )}

      {/* Skills */}
      <div className="d-flex flex-wrap gap-1 mb-4">
        {(template.skills || []).slice(0, 4).map((skill) => (
          <Badge key={skill} bg="light" text="dark" style={{ fontSize: 10 }}>
            {skill.replaceAll('_', ' ')}
          </Badge>
        ))}
      </div>

      {/* Botão */}
      <Button
        variant={template.recommended ? 'primary' : 'outline-primary'}
        className="mt-auto w-100"
        disabled={!!hiring}
        onClick={() => onHire(template)}
      >
        {hiring === template.key ? (
          <><Spinner animation="border" size="sm" className="me-2" />Contratando...</>
        ) : (
          <><Plus size={15} className="me-1" />Contratar {template.name}</>
        )}
      </Button>
    </Card.Body>
  </Card>
);

export default MarketplacePage;
