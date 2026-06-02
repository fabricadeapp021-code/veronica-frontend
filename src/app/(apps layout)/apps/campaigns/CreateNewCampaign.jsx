'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { X } from 'react-feather';
import { createCampaign } from '@/lib/api/services/campaigns';
import { useAuth } from '@/lib/auth/AuthProvider';
import { showCustomAlert } from '@/components/CustomAlert';

const CreateNewCampaign = ({ show, close, onSuccess }) => {
    const router = useRouter();
    const { status } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        message: '',
        instanceName: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Validação básica
        if (!formData.name.trim()) {
            setError('O nome da campanha é obrigatório');
            return;
        }
        if (!formData.message.trim()) {
            setError('A mensagem é obrigatória');
            return;
        }
        if (!formData.instanceName.trim()) {
            setError('A instância WhatsApp é obrigatória');
            return;
        }

        if (status !== 'authenticated') {
            setError('Você precisa estar autenticado para criar uma campanha');
            return;
        }

        try {
            setLoading(true);
            const response = await createCampaign({
                name: formData.name.trim(),
                description: formData.description.trim() || undefined,
                message: formData.message.trim(),
                instanceName: formData.instanceName.trim(),
            });

            if (response?.success === false) {
                setError(response?.message || 'Erro ao criar campanha');
                return;
            }

            // Limpar formulário
            setFormData({
                name: '',
                description: '',
                message: '',
                instanceName: '',
            });
            await showCustomAlert({
                variant: 'success',
                title: 'Sucesso',
                text: 'Campanha criada com sucesso!',
            });
            // Redirecionar para a página de edição da campanha criada
            if (response.data?.id) {
                router.push(`/apps/campaigns/${response.data.id}`);
            } else {
                router.push('/apps/campaigns/list');
            }
            close();
            if (onSuccess) {
                onSuccess(response.data);
            }
        } catch (err) {
            console.error('Erro ao criar campanha:', err);
            setError(err?.message || 'Erro ao criar campanha. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            name: '',
            description: '',
            message: '',
            instanceName: '',
        });
        setError(null);
        close();
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header>
                <Modal.Title>Nova Campanha</Modal.Title>
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
                    {error && (
                        <Alert variant="danger" className="mb-3">
                            {error}
                        </Alert>
                    )}
                    <Form.Group className="mb-3">
                        <Form.Label>Nome da Campanha *</Form.Label>
                        <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Digite o nome da campanha"
                            required
                            disabled={loading}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Descrição</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Descrição da campanha"
                            disabled={loading}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Mensagem *</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            placeholder="Mensagem a ser enviada"
                            required
                            disabled={loading}
                        />
                        <Form.Text className="text-muted">
                            Use variáveis como {`{nome}`} para personalizar a mensagem
                        </Form.Text>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Instância WhatsApp *</Form.Label>
                        <Form.Control
                            type="text"
                            name="instanceName"
                            value={formData.instanceName}
                            onChange={handleChange}
                            placeholder="Nome da instância Evolution API"
                            required
                            disabled={loading}
                        />
                        <Form.Text className="text-muted">
                            Digite o nome da instância do WhatsApp configurada no Evolution API
                        </Form.Text>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={handleClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? 'Criando...' : 'Criar Campanha'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default CreateNewCampaign;

