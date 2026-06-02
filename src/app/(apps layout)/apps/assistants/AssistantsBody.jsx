'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Col, Container, Row, Badge, Spinner, Alert } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import { apiRequest } from '@/lib/api/client';

/**
 * Body da página de assistentes
 * Exibe grid de cards com todos os assistentes disponíveis
 */
const AssistantsBody = () => {
  const router = useRouter();
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregar assistentes do backend
  useEffect(() => {
    loadAssistants();
  }, []);

  const loadAssistants = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiRequest('/assistants', { method: 'GET' });
      setAssistants(response.data || []);
    } catch (err) {
      console.error('Erro ao carregar assistentes:', err);
      setError('Não foi possível carregar os assistentes. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssistantClick = (assistant) => {
    // Navegar para a página de chat do assistente
    router.push(`/apps/assistants/${assistant.assistantId}`);
  };

  if (loading) {
    return (
      <div className="integrations-body">
        <Container className="mt-md-7 mt-3">
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Carregando assistentes...</p>
          </div>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="integrations-body">
        <Container className="mt-md-7 mt-3">
          <Alert variant="danger">
            <Alert.Heading>Erro ao carregar assistentes</Alert.Heading>
            <p>{error}</p>
          </Alert>
        </Container>
      </div>
    );
  }

  return (
    <>
      <div className="integrations-body">
        <SimpleBar className="nicescroll-bar">
          <Container className="mt-md-7 mt-3">
            {assistants.length === 0 ? (
              <Alert variant="info">
                <Alert.Heading>Nenhum assistente disponível</Alert.Heading>
                <p>Os assistentes serão carregados em breve.</p>
              </Alert>
            ) : (
              <Row>
                {assistants.map((assistant) => (
                  <Col xxl={3} xl={4} md={6} key={assistant.assistantId}>
                    <Card 
                      className="card-border card-int mb-4" 
                      onClick={() => handleAssistantClick(assistant)}
                      style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div className="avatar avatar-sm avatar-logo">
                            <span className="initial-wrap fs-1">
                              {assistant.icon || '🤖'}
                            </span>
                          </div>
                          <Badge bg={assistant.active ? 'success' : 'secondary'}>
                            {assistant.active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <div className="app-name fw-bold">{assistant.name}</div>
                        <p className="p-sm multine-ellipsis text-muted" style={{ 
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {assistant.description}
                        </p>
                        {assistant.category && (
                          <Badge bg="light" text="dark" className="mt-2">
                            {getCategoryLabel(assistant.category)}
                          </Badge>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Container>
        </SimpleBar>
      </div>
    </>
  );
};

// Helper para labels de categoria
const getCategoryLabel = (category) => {
  const labels = {
    finance: 'Financeiro',
    legal: 'Jurídico',
    support: 'Suporte',
    marketing: 'Marketing',
    analytics: 'Analytics',
  };
  return labels[category] || category;
};

export default AssistantsBody;
