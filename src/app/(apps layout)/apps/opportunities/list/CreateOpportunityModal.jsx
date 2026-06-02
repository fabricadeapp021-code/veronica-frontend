import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { createOpportunity, updateOpportunity } from '@/lib/api/services/opportunities';

const CreateOpportunityModal = ({ show, onHide, onSuccess, opportunity = null }) => {
    const isEdit = !!opportunity;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        stage: 'Prospecting',
        amount: '',
        amountCurrency: 'BRL',
        probability: '10',
        accountName: '',
        contactName: '',
        leadSource: '',
        description: '',
        expectedCloseDate: '',
    });

    useEffect(() => {
        if (opportunity) {
            setFormData({
                name: opportunity.name || '',
                stage: opportunity.stage || 'Prospecting',
                amount: opportunity.amount || '',
                amountCurrency: opportunity.amountCurrency || 'BRL',
                probability: opportunity.probability || '10',
                accountName: opportunity.accountName || '',
                contactName: opportunity.contactName || '',
                leadSource: opportunity.leadSource || '',
                description: opportunity.description || '',
                expectedCloseDate: opportunity.expectedCloseDateRaw || '',
            });
        } else {
            // Reset form when creating new
            setFormData({
                name: '',
                stage: 'Prospecting',
                amount: '',
                amountCurrency: 'BRL',
                probability: '10',
                accountName: '',
                contactName: '',
                leadSource: '',
                description: '',
                expectedCloseDate: '',
            });
        }
        setError('');
    }, [opportunity, show]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Atualizar probabilidade padrão ao mudar estágio
        if (name === 'stage') {
            const probabilityMap = {
                'Prospecting': '10',
                'Qualification': '25',
                'Proposal': '50',
                'Negotiation': '75',
                'Won': '100',
                'Lost': '0',
            };
            setFormData(prev => ({
                ...prev,
                probability: probabilityMap[value] || '10'
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validações
        if (!formData.name.trim()) {
            setError('O nome da oportunidade é obrigatório');
            return;
        }

        try {
            setLoading(true);

            const payload = {
                name: formData.name.trim(),
                stage: formData.stage,
                amount: formData.amount ? parseFloat(formData.amount) : undefined,
                amountCurrency: formData.amountCurrency,
                probability: formData.probability ? parseInt(formData.probability) : undefined,
                accountName: formData.accountName.trim() || undefined,
                contactName: formData.contactName.trim() || undefined,
                leadSource: formData.leadSource.trim() || undefined,
                description: formData.description.trim() || undefined,
                expectedCloseDate: formData.expectedCloseDate || undefined,
            };

            let response;
            if (isEdit) {
                response = await updateOpportunity(opportunity.id, payload);
            } else {
                response = await createOpportunity(payload);
            }

            if (response && response.success) {
                if (onSuccess) {
                    onSuccess(response.data);
                }
                onHide();
            } else {
                setError(response?.message || `Erro ao ${isEdit ? 'atualizar' : 'criar'} oportunidade`);
            }
        } catch (err) {
            console.error(`Erro ao ${isEdit ? 'atualizar' : 'criar'} oportunidade:`, err);
            setError(err?.message || `Erro ao ${isEdit ? 'atualizar' : 'criar'} oportunidade. Tente novamente.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>{isEdit ? 'Editar Oportunidade' : 'Nova Oportunidade'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && (
                    <Alert variant="danger" dismissible onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={12} className="mb-3">
                            <Form.Group>
                                <Form.Label>Nome da Oportunidade <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="text"
                                    name="name"
                                    placeholder="Ex: Venda de Carro para João Silva"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </Col>

                        <Col md={6} className="mb-3">
                            <Form.Group>
                                <Form.Label>Estágio</Form.Label>
                                <Form.Select
                                    name="stage"
                                    value={formData.stage}
                                    onChange={handleChange}
                                >
                                    <option value="Prospecting">Prospecção</option>
                                    <option value="Qualification">Qualificação</option>
                                    <option value="Proposal">Proposta</option>
                                    <option value="Negotiation">Negociação</option>
                                    <option value="Won">Ganha</option>
                                    <option value="Lost">Perdida</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={6} className="mb-3">
                            <Form.Group>
                                <Form.Label>Probabilidade (%)</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="probability"
                                    min="0"
                                    max="100"
                                    placeholder="0-100"
                                    value={formData.probability}
                                    onChange={handleChange}
                                />
                                <Form.Text className="text-muted">
                                    Probabilidade de fechamento (0-100%)
                                </Form.Text>
                            </Form.Group>
                        </Col>

                        <Col md={8} className="mb-3">
                            <Form.Group>
                                <Form.Label>Valor</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="amount"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={formData.amount}
                                    onChange={handleChange}
                                />
                            </Form.Group>
                        </Col>

                        <Col md={4} className="mb-3">
                            <Form.Group>
                                <Form.Label>Moeda</Form.Label>
                                <Form.Select
                                    name="amountCurrency"
                                    value={formData.amountCurrency}
                                    onChange={handleChange}
                                >
                                    <option value="BRL">BRL (R$)</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={6} className="mb-3">
                            <Form.Group>
                                <Form.Label>Conta (Empresa)</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="accountName"
                                    placeholder="Nome da empresa"
                                    value={formData.accountName}
                                    onChange={handleChange}
                                />
                            </Form.Group>
                        </Col>

                        <Col md={6} className="mb-3">
                            <Form.Group>
                                <Form.Label>Contato</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="contactName"
                                    placeholder="Nome do contato"
                                    value={formData.contactName}
                                    onChange={handleChange}
                                />
                            </Form.Group>
                        </Col>

                        <Col md={6} className="mb-3">
                            <Form.Group>
                                <Form.Label>Origem do Lead</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="leadSource"
                                    placeholder="Ex: Campanha WhatsApp, Website, etc."
                                    value={formData.leadSource}
                                    onChange={handleChange}
                                />
                            </Form.Group>
                        </Col>

                        <Col md={6} className="mb-3">
                            <Form.Group>
                                <Form.Label>Data Prevista de Fechamento</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="expectedCloseDate"
                                    value={formData.expectedCloseDate}
                                    onChange={handleChange}
                                />
                            </Form.Group>
                        </Col>

                        <Col md={12} className="mb-3">
                            <Form.Group>
                                <Form.Label>Descrição</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    name="description"
                                    rows={3}
                                    placeholder="Informações adicionais sobre a oportunidade..."
                                    value={formData.description}
                                    onChange={handleChange}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={loading}>
                    Cancelar
                </Button>
                <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar Oportunidade')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default CreateOpportunityModal;

