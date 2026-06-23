'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import classNames from 'classnames';
import {
  Alert,
  Badge,
  Button,
  ButtonGroup,
  Card,
  Col,
  Form,
  ListGroup,
  Row,
  Spinner,
} from 'react-bootstrap';
import {
  Activity,
  Archive,
  CheckCircle,
  Clock,
  Cpu,
  Edit3,
  Eye,
  Heart,
  RotateCcw,
  Save,
  Shield,
  Tool,
  User,
  Users,
} from 'react-feather';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { apiRequest } from '@/lib/api/client';
import { useColorMode } from '@/hooks/useColorMode';

const PROMPT_SECTIONS = [
  {
    key: 'SOUL',
    label: 'Alma',
    file: 'SOUL.md',
    icon: Heart,
    helper: 'Personalidade, valores, tom de voz e limites humanos da agente.',
    questions: [
      'Quem a agente e quando conversa com clientes?',
      'Qual tom ela deve usar?',
      'Quando ela deve chamar uma pessoa?',
      'O que ela nunca deve prometer?',
    ],
  },
  {
    key: 'IDENTITY',
    label: 'Identidade',
    file: 'IDENTITY.md',
    icon: User,
    helper: 'Nome, cargo, marca, apresentacao e papel dentro da empresa.',
    questions: [
      'Como ela se apresenta?',
      'Qual cargo aparece para o cliente?',
      'Qual e o estilo da marca?',
    ],
  },
  {
    key: 'AGENTS',
    label: 'Comportamento',
    file: 'AGENTS.md',
    icon: Cpu,
    helper: 'Regras operacionais, fluxo de atendimento e politica de decisao.',
    questions: [
      'Como ela deve conduzir um atendimento?',
      'Quais etapas ela sempre segue?',
      'Que assuntos sao criticos?',
    ],
  },
  {
    key: 'TOOLS',
    label: 'Ferramentas',
    file: 'TOOLS.md',
    icon: Tool,
    helper: 'O que ela pode usar, o que e proibido e quando precisa de aprovacao.',
    questions: [
      'Quais ferramentas pode acionar?',
      'Quais acoes precisam de aprovacao?',
      'Quais ferramentas nunca devem ser usadas?',
    ],
  },
  {
    key: 'USER',
    label: 'Perfil do Usuario',
    file: 'USER.md',
    icon: Users,
    helper: 'Perfil e preferencias do usuario aprendidos automaticamente durante as conversas.',
    questions: [
      'O que a agente ja sabe sobre este usuario?',
      'Ha preferencias ou contexto de negocio registrado?',
      'Tem informacao sensivel que deve ser removida?',
    ],
  },
  {
    key: 'HEARTBEAT',
    label: 'Heartbeat',
    file: 'HEARTBEAT.md',
    icon: Activity,
    helper: 'Tarefas periodicas que o agente executa automaticamente. Deixe vazio (so comentarios #) para desativar.',
    questions: [
      'O agente deve verificar algo periodicamente?',
      'Ha follow-ups ou checagens agendadas?',
      'Deixe o arquivo apenas com # para desativar o heartbeat.',
    ],
  },
  {
    key: 'KNOWLEDGE',
    label: 'Conhecimento',
    file: 'KNOWLEDGE.md',
    icon: Archive,
    helper: 'Informacoes da empresa, produto, FAQ e contexto comercial.',
    questions: [
      'O que a empresa faz?',
      'Quais respostas ela pode dar com seguranca?',
      'Quais perguntas frequentes existem?',
    ],
  },
  {
    key: 'PRICING',
    label: 'Precos',
    file: 'PRICING.md',
    icon: CheckCircle,
    helper: 'Planos, valores, condicoes, descontos e limites comerciais.',
    questions: [
      'Quais planos existem?',
      'Ela pode falar valores?',
      'Quando deve encaminhar para comercial?',
    ],
  },
  {
    key: 'OBJECTIONS',
    label: 'Objecoes',
    file: 'OBJECTIONS.md',
    icon: Shield,
    helper: 'Respostas para duvidas, receios e resistencia de clientes.',
    questions: [
      'Como responder quando acham caro?',
      'Como lidar com comparacao com concorrente?',
      'Quando parar e chamar humano?',
    ],
  },
  {
    key: 'MEMORY',
    label: 'Memoria',
    file: 'MEMORY.md',
    icon: Clock,
    helper: 'Fatos persistentes e contexto aprendido. Edite com cuidado.',
    questions: [
      'Que fatos permanentes ela deve lembrar?',
      'O que nao deve ser guardado?',
      'Ha informacao sensivel para remover?',
    ],
  },
];

const SECTION_MAP = Object.fromEntries(PROMPT_SECTIONS.map((section) => [section.key, section]));

function formatDate(value) {
  if (!value) return 'Sem data';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return 'Sem data';
  }
}

export default function AgentPromptEditorPage() {
  const params = useParams();
  const agentId = params?.agentId;
  const { isDark } = useColorMode();

  const [agent, setAgent] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [activeKey, setActiveKey] = useState('SOUL');
  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishingVersion, setPublishingVersion] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mode, setMode] = useState('write');
  const [changeSummary, setChangeSummary] = useState('');

  const activeSection = SECTION_MAP[activeKey] || PROMPT_SECTIONS[0];
  const isDirty = content !== savedContent;
  const openClawAgentId = agent?.tenantId && agent?.id ? `${agent.tenantId}--${agent.id}` : '';
  const openClawWorkspacePath = agent?.tenantId && openClawAgentId
    ? `/home/node/.openclaw/workspaces/${agent.tenantId}/${openClawAgentId}`
    : '';

  const loadAgent = useCallback(async () => {
    const res = await apiRequest(`/agents/${agentId}`);
    setAgent(res?.agent || res);
  }, [agentId]);

  const loadDocuments = useCallback(async () => {
    const res = await apiRequest(`/agents/${agentId}/workspace`);
    const docs = res?.documents || [];
    setDocuments(docs);

    const current = docs.find((doc) => (doc.fileKey || doc.slug) === activeKey);
    const nextContent = current?.content || '';
    setContent(nextContent);
    setSavedContent(nextContent);
  }, [agentId, activeKey]);

  const loadVersions = useCallback(async () => {
    try {
      const res = await apiRequest(`/agents/${agentId}/workspace/${activeKey}/versions`);
      setVersions(res?.versions || []);
    } catch {
      setVersions([]);
    }
  }, [agentId, activeKey]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError('');
        await Promise.all([loadAgent(), loadDocuments(), loadVersions()]);
      } catch (err) {
        if (mounted) setError(err?.message || 'Nao foi possivel carregar os prompts.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (agentId) load();
    return () => {
      mounted = false;
    };
  }, [agentId, loadAgent, loadDocuments, loadVersions]);

  const currentDocument = useMemo(
    () => documents.find((doc) => (doc.fileKey || doc.slug) === activeKey),
    [documents, activeKey],
  );

  const handleSelectSection = (nextKey) => {
    setActiveKey(nextKey);
    setMode('write');
    setChangeSummary('');
    setSuccess('');
    setError('');
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const draft = await apiRequest(`/agents/${agentId}/workspace/${activeKey}/drafts`, {
        method: 'POST',
        body: {
          content,
          changeSummary: changeSummary || undefined,
          metadata: { editor: 'agent-prompt-editor' },
        },
      });
      setSuccess(`Rascunho salvo na versao ${draft?.version || ''}.`);
      await loadVersions();
    } catch (err) {
      setError(err?.message || 'Nao foi possivel salvar o rascunho.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const published = await apiRequest(`/agents/${agentId}/workspace/${activeKey}`, {
        method: 'PUT',
        body: {
          content,
          changeSummary: changeSummary || 'Publicado pelo editor de prompts',
          metadata: { editor: 'agent-prompt-editor' },
        },
      });
      setSavedContent(content);
      setSuccess(`Publicado na versao ${published?.version || ''}.`);
      await Promise.all([loadDocuments(), loadVersions()]);
    } catch (err) {
      setError(err?.message || 'Nao foi possivel publicar.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishVersion = async (version) => {
    try {
      setPublishingVersion(version);
      setError('');
      setSuccess('');
      const published = await apiRequest(
        `/agents/${agentId}/workspace/${activeKey}/versions/${version}/publish`,
        {
          method: 'POST',
          body: { reason: 'Publicado pelo historico do editor de prompts' },
        },
      );
      setContent(published?.content || content);
      setSavedContent(published?.content || content);
      setSuccess(`Versao ${version} publicada.`);
      await Promise.all([loadDocuments(), loadVersions()]);
    } catch (err) {
      setError(err?.message || 'Nao foi possivel publicar esta versao.');
    } finally {
      setPublishingVersion(null);
    }
  };

  if (loading) {
    return (
      <div className="hk-pg-body py-0">
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 mb-0">Carregando personalidade do agente...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hk-pg-body py-0">
      <div className="container-fluid py-4">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <Button as={Link} href="/apps/agents" variant="light" size="sm">
                Voltar
              </Button>
              <Badge bg={agent?.status === 'active' ? 'success' : 'secondary'}>
                {agent?.status || 'agente'}
              </Badge>
            </div>
            <h4 className="mb-1">{agent?.name || 'Agente'}</h4>
            <p className="text-muted mb-0">{agent?.roleTitle || 'Funcionario IA'}</p>
            {openClawAgentId && (
              <div className="mt-2">
                <Badge bg="light" text="dark" className="me-2">
                  OpenClaw: {openClawAgentId}
                </Badge>
                <small className="text-muted">{openClawWorkspacePath}</small>
              </div>
            )}
          </div>

          <div className="d-flex flex-wrap gap-2">
            <ButtonGroup>
              <Button
                variant={mode === 'write' ? 'primary' : 'outline-primary'}
                onClick={() => setMode('write')}
              >
                <Edit3 size={16} className="me-1" />
                Escrever
              </Button>
              <Button
                variant={mode === 'preview' ? 'primary' : 'outline-primary'}
                onClick={() => setMode('preview')}
              >
                <Eye size={16} className="me-1" />
                Preview
              </Button>
            </ButtonGroup>
            <Button variant="outline-secondary" disabled={saving} onClick={handleSaveDraft}>
              <Save size={16} className="me-1" />
              Salvar rascunho
            </Button>
            <Button variant="success" disabled={saving || !content.trim()} onClick={handlePublish}>
              {saving ? <Spinner animation="border" size="sm" className="me-1" /> : <CheckCircle size={16} className="me-1" />}
              Publicar
            </Button>
          </div>
        </div>

        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
        {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
        {isDirty && (
          <Alert variant="warning" className="py-2">
            Existem alteracoes nao publicadas em {activeSection.label}.
          </Alert>
        )}

        <Row className="g-3">
          <Col xl={3} lg={4}>
            <Card className="card-border h-100">
              <Card.Body className="p-0">
                <ListGroup variant="flush">
                  {PROMPT_SECTIONS.map((section) => {
                    const Icon = section.icon;
                    const doc = documents.find((item) => (item.fileKey || item.slug) === section.key);
                    return (
                      <ListGroup.Item
                        key={section.key}
                        action
                        active={activeKey === section.key}
                        onClick={() => handleSelectSection(section.key)}
                        className="d-flex align-items-start gap-3 py-3"
                      >
                        <Icon size={18} className="mt-1 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="fw-semibold">{section.label}</div>
                          <small className={activeKey === section.key ? 'text-white-50' : 'text-muted'}>
                            {section.file} · v{doc?.version || 0}
                          </small>
                        </div>
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>

          <Col xl={6} lg={8}>
            <Card className="card-border h-100">
              <Card.Header className="border-bottom">
                <div className="d-flex justify-content-between align-items-start gap-3">
                  <div>
                    <h5 className="mb-1">{activeSection.label}</h5>
                    <p className="text-muted mb-0">{activeSection.helper}</p>
                  </div>
                  <Badge bg="light" text="dark">{activeSection.file}</Badge>
                </div>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Resumo da alteracao</Form.Label>
                  <Form.Control
                    value={changeSummary}
                    onChange={(event) => setChangeSummary(event.target.value)}
                    placeholder="Ex: Ajustei o tom de voz para atendimento da SBT"
                  />
                </Form.Group>

                {mode === 'write' ? (
                  <Form.Control
                    as="textarea"
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    spellCheck={false}
                    style={{
                      minHeight: 520,
                      resize: 'vertical',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      fontSize: 13,
                      lineHeight: 1.6,
                      background: isDark ? '#111827' : '#fbfcfe',
                    }}
                  />
                ) : (
                  <div
                    className={classNames('border rounded p-4', { 'bg-dark text-light': isDark })}
                    style={{ minHeight: 520, overflow: 'auto' }}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {content || '_Sem conteudo ainda._'}
                    </ReactMarkdown>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col xl={3}>
            <Card className="card-border mb-3">
              <Card.Header>
                <h6 className="mb-0">Perguntas guia</h6>
              </Card.Header>
              <Card.Body>
                <ul className="ps-3 mb-0">
                  {activeSection.questions.map((question) => (
                    <li key={question} className="mb-2 text-muted small">{question}</li>
                  ))}
                </ul>
              </Card.Body>
            </Card>

            <Card className="card-border">
              <Card.Header className="d-flex align-items-center gap-2">
                <RotateCcw size={16} />
                <h6 className="mb-0">Historico</h6>
              </Card.Header>
              <Card.Body className="p-0">
                {versions.length === 0 ? (
                  <div className="p-3 text-muted small">Nenhuma versao salva ainda.</div>
                ) : (
                  <ListGroup variant="flush">
                    {versions.slice(0, 8).map((version) => (
                      <ListGroup.Item key={version.id || version._id || version.version}>
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <div>
                            <div className="fw-semibold">Versao {version.version}</div>
                            <small className="text-muted d-block">
                              {version.status} · {formatDate(version.publishedAt || version.createdAt)}
                            </small>
                            {version.changeSummary && (
                              <small className="text-muted d-block mt-1">{version.changeSummary}</small>
                            )}
                          </div>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            disabled={publishingVersion === version.version}
                            onClick={() => handlePublishVersion(version.version)}
                          >
                            {publishingVersion === version.version ? (
                              <Spinner animation="border" size="sm" />
                            ) : (
                              'Publicar'
                            )}
                          </Button>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
