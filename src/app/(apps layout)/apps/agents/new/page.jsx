'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { ArrowLeft, Briefcase, CheckCircle, Plus } from 'react-feather';
import { apiRequest } from '@/lib/api/client';

const autonomyOptions = [
  { value: 'supervised', label: 'Supervisionado' },
  { value: 'assisted', label: 'Assistido' },
  { value: 'monitored', label: 'Monitorado' },
  { value: 'trusted', label: 'Confiável' },
];

const NewAgentPage = () => {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [form, setForm] = useState({
    name: '',
    roleTitle: '',
    description: '',
    autonomyLevel: 'supervised',
    tone: '',
    skills: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiRequest('/agents/templates');
      const list = data?.templates || [];
      const sorted = [...list].sort((a, b) => {
        if (a.recommended && !b.recommended) return -1;
        if (!a.recommended && b.recommended) return 1;
        return String(a.name).localeCompare(String(b.name));
      });
      setTemplates(sorted);

      const first = sorted[0];
      if (first) selectTemplate(first);
    } catch (err) {
      setError(err?.message || 'Erro ao carregar templates de funcionários IA.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.key === selectedKey),
    [templates, selectedKey],
  );

  const selectTemplate = (template) => {
    setSelectedKey(template.key);
    setForm({
      name: template.name || '',
      roleTitle: template.roleTitle || '',
      description: template.shortDescription || '',
      autonomyLevel: 'supervised',
      tone: template.defaultConfig?.tone || '',
      skills: template.skills || [],
    });
    setError('');
  };

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
  };

  const toggleSkill = (skill) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((item) => item !== skill)
        : [...prev.skills, skill],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedTemplate) {
      setError('Escolha um template para contratar o funcionário IA.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await apiRequest('/agents', {
        method: 'POST',
        body: {
          templateKey: selectedTemplate.key,
          name: form.name,
          roleTitle: form.roleTitle,
          description: form.description,
          autonomyLevel: form.autonomyLevel,
          skills: form.skills,
          config: {
            tone: form.tone,
          },
        },
      });
      router.push('/apps/agents');
    } catch (err) {
      setError(err?.message || 'Erro ao contratar funcionário IA.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="hk-pg-body">
        <div className="container-fluid py-5 text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 mb-0">Carregando catálogo de funcionários IA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hk-pg-body">
      <div className="container-fluid">
        <div className="d-flex align-items-center justify-content-between gap-3 mb-4">
          <div className="d-flex align-items-center">
            <Button
              as={Link}
              href="/apps/agents"
              variant="flush-dark"
              className="btn-icon btn-rounded"
            >
              <ArrowLeft size={20} />
            </Button>
            <div className="ms-3">
              <h4 className="mb-1">Contratar funcionário IA</h4>
              <p className="text-muted mb-0">
                Escolha um cargo, ajuste as skills e conecte depois as bases do cliente.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Row className="g-4">
          <Col xxl={4} lg={5}>
            <h6 className="mb-3">Catálogo inicial</h6>
            <div className="d-flex flex-column gap-3">
              {templates.map((template) => (
                <Card
                  key={template.key}
                  className={`card-border ${selectedKey === template.key ? 'border-primary' : ''}`}
                  role="button"
                  onClick={() => selectTemplate(template)}
                >
                  <Card.Body>
                    <div className="d-flex align-items-start justify-content-between gap-3">
                      <div>
                        {template.recommended && (
                          <Badge bg="success" className="mb-2">
                            Recomendado
                          </Badge>
                        )}
                        <h6 className="mb-1">{template.name}</h6>
                        <p className="text-muted small mb-2">{template.roleTitle}</p>
                      </div>
                      {selectedKey === template.key && <CheckCircle size={20} className="text-primary" />}
                    </div>
                    <p className="text-muted mb-3">{template.shortDescription}</p>
                    <div className="d-flex flex-wrap gap-2">
                      {(template.skills || []).slice(0, 4).map((skill) => (
                        <Badge key={skill} bg="light" text="dark">
                          {skill.replaceAll('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          </Col>

          <Col xxl={8} lg={7}>
            <Form onSubmit={handleSubmit}>
              <Card className="card-border mb-4">
                <Card.Header>
                  <div className="d-flex align-items-center gap-2">
                    <Briefcase size={18} />
                    <h5 className="mb-0">Configuração do funcionário</h5>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Nome *</Form.Label>
                        <Form.Control
                          value={form.name}
                          onChange={(event) => update('name', event.target.value)}
                          required
                          placeholder="Atendente 24/7 IA"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Cargo *</Form.Label>
                        <Form.Control
                          value={form.roleTitle}
                          onChange={(event) => update('roleTitle', event.target.value)}
                          required
                          placeholder="Atendente Digital 24/7"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Descrição</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={form.description}
                      onChange={(event) => update('description', event.target.value)}
                    />
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Nível de autonomia</Form.Label>
                        <Form.Select
                          value={form.autonomyLevel}
                          onChange={(event) => update('autonomyLevel', event.target.value)}
                        >
                          {autonomyOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Tom de atendimento</Form.Label>
                        <Form.Control
                          value={form.tone}
                          onChange={(event) => update('tone', event.target.value)}
                          placeholder="claro, acolhedor e resolutivo"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-0">
                    <Form.Label>Skills ativadas</Form.Label>
                    <div className="d-flex flex-wrap gap-2">
                      {(selectedTemplate?.skills || []).map((skill) => (
                        <Button
                          key={skill}
                          type="button"
                          variant={form.skills.includes(skill) ? 'primary' : 'outline-secondary'}
                          size="sm"
                          onClick={() => toggleSkill(skill)}
                        >
                          {skill.replaceAll('_', ' ')}
                        </Button>
                      ))}
                    </div>
                  </Form.Group>
                </Card.Body>
              </Card>

              <Card className="card-border">
                <Card.Body className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                  <div>
                    <h6 className="mb-1">Próximo passo após contratar</h6>
                    <p className="text-muted mb-0">
                      Conectar WhatsApp, documentos, CRM ou helpdesk pelo painel de conectores.
                    </p>
                  </div>
                  <div className="d-flex gap-2">
                    <Button as={Link} href="/apps/agents" variant="outline-secondary">
                      Cancelar
                    </Button>
                    <Button type="submit" variant="primary" disabled={saving || !selectedTemplate}>
                      {saving ? (
                        <Spinner animation="border" size="sm" className="me-2" />
                      ) : (
                        <Plus size={16} className="me-1" />
                      )}
                      Contratar funcionário
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Form>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default NewAgentPage;
