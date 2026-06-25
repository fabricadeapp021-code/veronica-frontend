'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, Badge, Button, Card, Col, Row, Spinner } from 'react-bootstrap';
import { ArrowLeft, Plus } from 'react-feather';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api/client';

const NewAgentPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hiring, setHiring] = useState(null);
  const [error, setError] = useState('');

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
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
      setError(err?.message || 'Erro ao carregar catálogo de funcionários IA.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const hire = async (template) => {
    try {
      setHiring(template.key);
      setError('');
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
      router.push('/apps/agents');
    } catch (err) {
      setError(err?.message || 'Erro ao contratar funcionário IA.');
      setHiring(null);
    }
  };

  if (loading) {
    return (
      <div className="hk-pg-body">
        <div className="container-fluid py-5 text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 mb-0">Carregando catálogo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hk-pg-body">
      <div className="container-fluid">
        <div className="d-flex align-items-center gap-3 mb-4">
          <Button
            as={Link}
            href="/apps/agents"
            variant="flush-dark"
            className="btn-icon btn-rounded"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h4 className="mb-1">Contratar funcionário IA</h4>
            <p className="text-muted mb-0">Escolha um cargo e contrate com um clique.</p>
          </div>
        </div>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Row className="g-4 justify-content-center">
          {templates.map((template) => (
            <Col key={template.key} xxl={4} lg={5} md={6}>
              <Card className="card-border h-100">
                <Card.Body className="d-flex flex-column">
                  {template.recommended && (
                    <Badge bg="success" className="mb-2 align-self-start">
                      Recomendado
                    </Badge>
                  )}
                  <h5 className="mb-1">{template.name}</h5>
                  <p className="text-muted small mb-3">{template.roleTitle}</p>
                  <p className="text-muted mb-4">{template.shortDescription}</p>
                  <div className="d-flex flex-wrap gap-2 mb-4">
                    {(template.skills || []).slice(0, 5).map((skill) => (
                      <Badge key={skill} bg="light" text="dark">
                        {skill.replaceAll('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    variant="primary"
                    className="mt-auto w-100"
                    disabled={!!hiring}
                    onClick={() => hire(template)}
                  >
                    {hiring === template.key ? (
                      <Spinner animation="border" size="sm" className="me-2" />
                    ) : (
                      <Plus size={16} className="me-1" />
                    )}
                    Contratar {template.name}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default NewAgentPage;
