'use client';
import React, { useState, useEffect, useMemo } from 'react';
import SimpleBar from 'simplebar-react';
import { Card, Col, Row, Form, Button, Alert, Accordion, Badge, InputGroup } from 'react-bootstrap';
import { Send, HelpCircle, MessageCircle, Mail, Search } from 'react-feather';
import { createTicket } from '@/lib/api/services/support';

const SUPPORT_EMAIL = 'suporte@tmsfacil.com';

const FAQ_ITEMS = [
  {
    q: 'Como acompanho viagens e ocorrências da frota?',
    a: 'Acesse Operação ou Monitoramento para visualizar viagens em andamento, ocorrências, alertas e o status da operação em tempo real.',
  },
  {
    q: 'Como cadastro um motorista ou veículo?',
    a: 'Vá em Operação e acesse os módulos de Motoristas ou Frota. Clique em "Novo" e preencha os dados principais para começar a operar no sistema.',
  },
  {
    q: 'Como funciona o rastreamento e os alertas?',
    a: 'Com os dispositivos configurados, o sistema centraliza localização, eventos de telemetria, geofences e alertas operacionais em uma única plataforma.',
  },
  {
    q: 'Posso ajustar configurações da empresa depois?',
    a: 'Sim. Em Perfil da empresa você pode atualizar logo, cores, textos de login e outras configurações exibidas no sistema.',
  },
  {
    q: 'Como gerencio permissões de usuários?',
    a: 'Usuários com perfil administrador podem acessar Usuários e definir permissões por módulo, conforme o papel de cada pessoa na operação.',
  },
];

const CATEGORIES = [
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'usuarios', label: 'Usuários' },
  { value: 'operacao', label: 'Operação' },
  { value: 'documentos', label: 'Documentos' },
  { value: 'integracao', label: 'Integração' },
  { value: 'outros', label: 'Outros' },
];

const PRIORITIES = [
  { value: 'baixa', label: 'Baixa', variant: 'secondary' },
  { value: 'media', label: 'Média', variant: 'info' },
  { value: 'alta', label: 'Alta', variant: 'warning' },
  { value: 'urgente', label: 'Urgente', variant: 'danger' },
];

const SupportPage = () => {
  const [form, setForm] = useState({
    subject: '',
    category: '',
    priority: 'media',
    description: '',
  });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [faqSearch, setFaqSearch] = useState('');

  const filteredFaq = useMemo(() => {
    if (!faqSearch?.trim()) return FAQ_ITEMS;
    const q = faqSearch.toLowerCase().trim();
    return FAQ_ITEMS.filter((item) =>
      item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
    );
  }, [faqSearch]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 6000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!form.subject?.trim()) {
      setError('Assunto é obrigatório.');
      return;
    }
    if (!form.description?.trim()) {
      setError('Descrição é obrigatória.');
      return;
    }
    try {
      setSending(true);
      const res = await createTicket({
        subject: form.subject.trim(),
        category: form.category || undefined,
        priority: form.priority || undefined,
        description: form.description.trim(),
      });
      setSuccess(res?.message || 'Chamado enviado com sucesso.');
      setForm({ subject: '', category: '', priority: 'media', description: '' });
    } catch (err) {
      setError(err.message || 'Erro ao enviar chamado.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fm-body">
      <SimpleBar className="nicescroll-bar">
        <div className="container-fluid px-4 py-4">
          <div className="mb-4">
            <h4 className="mb-1">
              <MessageCircle size={22} className="me-2" />
              Suporte
            </h4>
            <p className="text-muted mb-2">
              Como podemos ajudar? Descreva sua dúvida ou problema e nossa equipe responderá em breve.
            </p>
            <div className="d-flex align-items-center gap-2 text-muted small">
              <Mail size={14} />
              <span>{SUPPORT_EMAIL}</span>
              <span className="text-muted">•</span>
              <span>Tempo médio de resposta: 24h úteis</span>
            </div>
          </div>

          <Row>
            <Col lg={6} className="mb-4">
              <Card className="card-border">
                <Card.Header>
                  <h5 className="mb-0">
                    <Send size={18} className="me-2" />
                    Abrir Chamado
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={handleSubmit}>
                    {error && (
                      <Alert variant="danger" dismissible onClose={() => setError(null)}>
                        {error}
                      </Alert>
                    )}
                    {success && (
                      <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
                        {success}
                      </Alert>
                    )}

                    <Form.Group className="mb-3">
                      <Form.Label>Assunto *</Form.Label>
                      <Form.Control
                        type="text"
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        placeholder="Ex: Dúvida sobre rastreamento ou viagens"
                        maxLength={200}
                      />
                      <Form.Text className="text-muted">{form.subject.length}/200</Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Categoria</Form.Label>
                      <Form.Select
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                      >
                        <option value="">Selecione...</option>
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="d-flex align-items-center gap-2">
                        Prioridade
                        <Badge bg={PRIORITIES.find((p) => p.value === form.priority)?.variant || 'secondary'} className="fw-normal">
                          {PRIORITIES.find((p) => p.value === form.priority)?.label || 'Média'}
                        </Badge>
                      </Form.Label>
                      <Form.Select
                        name="priority"
                        value={form.priority}
                        onChange={handleChange}
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Descrição *</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Descreva seu problema ou dúvida em detalhes..."
                        maxLength={5000}
                      />
                      <Form.Text className="text-muted">
                        {form.description.length}/5000 caracteres
                      </Form.Text>
                    </Form.Group>

                    <Button
                      type="submit"
                      variant="primary"
                      disabled={sending}
                    >
                      {sending ? 'Enviando...' : 'Enviar Chamado'}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6}>
              <Card className="card-border">
                <Card.Header>
                  <h5 className="mb-0">
                    <HelpCircle size={18} className="me-2" />
                    Perguntas Frequentes
                  </h5>
                </Card.Header>
                <Card.Body>
                  <InputGroup className="mb-3">
                    <InputGroup.Text>
                      <Search size={16} />
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="Buscar no FAQ..."
                      value={faqSearch}
                      onChange={(e) => setFaqSearch(e.target.value)}
                    />
                  </InputGroup>
                  {filteredFaq.length === 0 ? (
                    <p className="text-muted mb-0">Nenhuma pergunta encontrada para &quot;{faqSearch}&quot;</p>
                  ) : (
                    <Accordion defaultActiveKey={filteredFaq.length > 0 ? '0' : null}>
                      {filteredFaq.map((item, i) => (
                        <Accordion.Item key={i} eventKey={String(i)}>
                          <Accordion.Header>{item.q}</Accordion.Header>
                          <Accordion.Body>{item.a}</Accordion.Body>
                        </Accordion.Item>
                      ))}
                    </Accordion>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      </SimpleBar>
    </div>
  );
};

export default SupportPage;

