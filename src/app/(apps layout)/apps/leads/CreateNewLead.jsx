'use client';
import { useState } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { X } from 'react-feather';
import { createLead } from '@/lib/api/services/leads';
import { useAuth } from '@/lib/auth/AuthProvider';
import { showCustomAlert } from '@/components/CustomAlert';

const CreateNewLead = ({ show, close, onSuccess }) => {
    const { status } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        firstName: '',
        lastName: '',
        emailAddress: '',
        phoneNumber: '',
        status: 'New',
        source: '',
        industry: '',
        website: '',
        description: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validação básica - pelo menos nome ou primeiro nome + último nome
        if (!formData.name.trim() && (!formData.firstName.trim() || !formData.lastName.trim())) {
            await showCustomAlert({
                variant: 'danger',
                title: 'Erro',
                text: 'É necessário informar o nome completo ou primeiro nome e último nome',
            });
            return;
        }

        // Validação de email ou telefone
        if (!formData.emailAddress.trim() && !formData.phoneNumber.trim()) {
            await showCustomAlert({
                variant: 'danger',
                title: 'Erro',
                text: 'É necessário informar pelo menos o email ou telefone',
            });
            return;
        }

        if (status !== 'authenticated') {
            await showCustomAlert({
                variant: 'danger',
                title: 'Erro',
                text: 'Você precisa estar autenticado para criar um lead',
            });
            return;
        }

        try {
            setLoading(true);
            
            // Preparar dados para envio
            const leadData = {
                ...formData,
                name: formData.name.trim() || `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
                firstName: formData.firstName.trim() || undefined,
                lastName: formData.lastName.trim() || undefined,
                emailAddress: formData.emailAddress.trim() || undefined,
                phoneNumber: formData.phoneNumber.trim() || undefined,
                status: formData.status || 'New',
                source: formData.source.trim() || undefined,
                industry: formData.industry.trim() || undefined,
                website: formData.website.trim() || undefined,
                description: formData.description.trim() || undefined,
            };

            // Remover campos vazios
            Object.keys(leadData).forEach(key => {
                if (leadData[key] === undefined || leadData[key] === '') {
                    delete leadData[key];
                }
            });

            const response = await createLead(leadData);

            if (response?.success === false) {
                await showCustomAlert({
                    variant: 'danger',
                    title: 'Erro',
                    text: response?.message || 'Erro ao criar lead',
                });
                return;
            }

            // Limpar formulário
            setFormData({
                name: '',
                firstName: '',
                lastName: '',
                emailAddress: '',
                phoneNumber: '',
                status: 'New',
                source: '',
                industry: '',
                website: '',
                description: '',
            });
            await showCustomAlert({
                variant: 'success',
                title: 'Sucesso',
                text: 'Lead criado com sucesso!',
            });
            close();
            if (onSuccess) {
                onSuccess(response.data);
            }
            // Opcional: redirecionar para a página de edição do lead criado
            // if (response.data?.id) {
            //     router.push(`/apps/leads/${response.data.id}`);
            // }
        } catch (err) {
            console.error('Erro ao criar lead:', err);
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
        setFormData({
            name: '',
            firstName: '',
            lastName: '',
            emailAddress: '',
            phoneNumber: '',
            status: 'New',
            source: '',
            industry: '',
            website: '',
            description: '',
        });
        close();
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header>
                <Modal.Title>Novo Lead</Modal.Title>
                <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover" onClick={handleClose}>
                    <span className="icon">
                        <span className="feather-icon">
                            <X />
                        </span>
                    </span>
                </Button>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <Row>
                        <Col md={12}>
                            <Form.Group className="mb-3">
                                <Form.Label>Nome Completo</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Digite o nome completo do lead"
                                    disabled={loading}
                                />
                                <Form.Text className="text-muted">
                                    Ou preencha primeiro nome e último nome abaixo
                                </Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Primeiro Nome</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    placeholder="Primeiro nome"
                                    disabled={loading}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Último Nome</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    placeholder="Último nome"
                                    disabled={loading}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                    type="email"
                                    name="emailAddress"
                                    value={formData.emailAddress}
                                    onChange={handleChange}
                                    placeholder="email@exemplo.com"
                                    disabled={loading}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Telefone</Form.Label>
                                <Form.Control
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    placeholder="+55 11 99999-9999"
                                    disabled={loading}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Status</Form.Label>
                                <Form.Select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    disabled={loading}
                                >
                                    <option value="New">Novo</option>
                                    <option value="Contacted">Contatado</option>
                                    <option value="Qualified">Qualificado</option>
                                    <option value="Converted">Convertido</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Origem</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="source"
                                    value={formData.source}
                                    onChange={handleChange}
                                    placeholder="Ex: Website, Facebook, Indicação"
                                    disabled={loading}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Indústria</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="industry"
                                    value={formData.industry}
                                    onChange={handleChange}
                                    placeholder="Ex: Tecnologia, Varejo"
                                    disabled={loading}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Website</Form.Label>
                                <Form.Control
                                    type="url"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    placeholder="https://exemplo.com"
                                    disabled={loading}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={12}>
                            <Form.Group className="mb-3">
                                <Form.Label>Descrição</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Informações adicionais sobre o lead"
                                    disabled={loading}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={handleClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? 'Criando...' : 'Criar Lead'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default CreateNewLead;

