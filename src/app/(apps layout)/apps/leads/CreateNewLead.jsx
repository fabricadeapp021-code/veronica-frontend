'use client';
import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { X } from 'react-feather';
import { createLead } from '@/lib/api/services/leads';
import { apiRequest } from '@/lib/api/client';
import { showCustomAlert } from '@/components/CustomAlert';

const STAGES = [
  { value: 'novo', label: 'Novo' },
  { value: 'contatado', label: 'Contatado' },
  { value: 'qualificado', label: 'Qualificado' },
  { value: 'perdido', label: 'Perdido' },
];

const EMPTY_FORM = {
  name: '',
  phone: '',
  email: '',
  company: '',
  agentId: '',
  stage: 'novo',
};

const CreateNewLead = ({ show, close, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!show) return;
    apiRequest('/agents')
      .then((res) => setAgents(res?.agents ?? res ?? []))
      .catch(() => setAgents([]));
  }, [show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      await showCustomAlert({ variant: 'danger', title: 'Erro', text: 'Informe o nome do lead.' });
      return;
    }
    if (!formData.phone.trim() && !formData.email.trim()) {
      await showCustomAlert({ variant: 'danger', title: 'Erro', text: 'Informe telefone ou e-mail.' });
      return;
    }
    if (!formData.agentId) {
      await showCustomAlert({ variant: 'danger', title: 'Erro', text: 'Selecione o agente responsável.' });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        company: formData.company.trim() || undefined,
        agentId: formData.agentId,
        stage: formData.stage,
      };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

      const response = await createLead(payload);

      if (response?.success === false) {
        await showCustomAlert({ variant: 'danger', title: 'Erro', text: response?.message || 'Erro ao criar lead.' });
        return;
      }

      await showCustomAlert({ variant: 'success', title: 'Sucesso', text: 'Lead criado com sucesso!' });
      setFormData(EMPTY_FORM);
      close();
      if (onSuccess) onSuccess(response?.lead ?? response);
    } catch (err) {
      await showCustomAlert({
        variant: 'danger',
        title: 'Erro',
        text: err?.message || err?.body?.message || 'Erro ao criar lead. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(EMPTY_FORM);
    close();
  };

  return (
    <Modal show={show} onHide={handleClose} size="md" centered>
      <Modal.Header>
        <Modal.Title>Novo Lead</Modal.Title>
        <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover" onClick={handleClose}>
          <span className="icon"><span className="feather-icon"><X /></span></span>
        </Button>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Nome <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nome completo"
              disabled={loading}
              autoFocus
            />
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Telefone</Form.Label>
                <Form.Control
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+55 11 99999-9999"
                  disabled={loading}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>E-mail</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@exemplo.com"
                  disabled={loading}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Empresa</Form.Label>
            <Form.Control
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="Nome da empresa (opcional)"
              disabled={loading}
            />
          </Form.Group>

          <Row>
            <Col md={7}>
              <Form.Group className="mb-3">
                <Form.Label>Agente responsável <span className="text-danger">*</span></Form.Label>
                <Form.Select name="agentId" value={formData.agentId} onChange={handleChange} disabled={loading}>
                  <option value="">Selecione um agente</option>
                  {agents.map((a) => (
                    <option key={a._id ?? a.id} value={a._id ?? a.id}>
                      {a.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={5}>
              <Form.Group className="mb-3">
                <Form.Label>Estágio</Form.Label>
                <Form.Select name="stage" value={formData.stage} onChange={handleChange} disabled={loading}>
                  {STAGES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={handleClose} disabled={loading}>Cancelar</Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Criando…' : 'Criar Lead'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CreateNewLead;
