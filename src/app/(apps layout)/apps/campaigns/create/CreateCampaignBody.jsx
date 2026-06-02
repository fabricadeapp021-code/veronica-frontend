'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Badge, Button, Card, Col, Form, Modal, Row, Table } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import { Plus, X } from 'react-feather';
import { addLeadsToCampaign, createCampaign } from '@/lib/api/services/campaigns';
import { listLeads } from '@/lib/api/services/leads';
import { useAuth } from '@/lib/auth/AuthProvider';
import { showCustomAlert } from '@/components/CustomAlert';

const CreateCampaignBody = () => {
    const router = useRouter();
    const { status } = useAuth();

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [campaignType, setCampaignType] = useState('whatsapp'); // 'whatsapp' ou 'voice'

    const [showAddLeadsModal, setShowAddLeadsModal] = useState(false);
    const [availableLeads, setAvailableLeads] = useState([]);
    const [selectedLeads, setSelectedLeads] = useState([]);
    const [pendingLeadIds, setPendingLeadIds] = useState([]);
    const [leadLabels, setLeadLabels] = useState({});
    const [loadingLeads, setLoadingLeads] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        prompt: '',
    });

    // Webhooks predefinidos (agora usa Meta API via N8N)
    const webhooks = {
        voice: 'https://nexus-n8n.captain.nexusbr.ai/webhook/ce0328f9-175e-4512-826f-979e5d592841',
        whatsapp: 'https://nexus-n8n.captain.nexusbr.ai/webhook/outbound-whatsapp-campanha',
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setError(null);
    };

    const loadAvailableLeads = async () => {
        try {
            setLoadingLeads(true);
            const response = await listLeads({ maxSize: 100 });
            if (response && response.success && response.data) {
                setAvailableLeads(response.data);
                const labelsFromResponse = response.data.reduce((acc, lead) => {
                    acc[lead.id] = lead.name || lead.emailAddress || lead.phoneNumber || `Lead ${lead.id?.substring(0, 8) || ''}`;
                    return acc;
                }, {});
                setLeadLabels((prev) => ({ ...prev, ...labelsFromResponse }));
            } else {
                setAvailableLeads([]);
            }
        } catch (err) {
            console.error('Erro ao carregar leads:', err);
            setAvailableLeads([]);
        } finally {
            setLoadingLeads(false);
        }
    };

    const handleOpenAddLeadsModal = async () => {
        setSelectedLeads(pendingLeadIds);
        await loadAvailableLeads();
        setShowAddLeadsModal(true);
    };

    const handleToggleLeadSelection = (leadId) => {
        setSelectedLeads((prev) =>
            prev.includes(leadId)
                ? prev.filter((id) => id !== leadId)
                : [...prev, leadId]
        );
    };

    const handleConfirmLeadSelection = () => {
        setPendingLeadIds(selectedLeads);
        setShowAddLeadsModal(false);
    };

    const handleRemovePendingLead = (leadId) => {
        setPendingLeadIds((prev) => prev.filter((id) => id !== leadId));
    };

    const getLeadLabel = (leadId, index) => {
        return leadLabels[leadId] || `Lead ${index + 1} (${leadId.substring(0, 8)}...)`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Validação básica
        if (!formData.name.trim()) {
            setError('O nome da campanha é obrigatório');
            return;
        }
        if (!formData.prompt.trim()) {
            setError('O prompt é obrigatório');
            return;
        }

        if (status !== 'authenticated') {
            setError('Você precisa estar autenticado para criar uma campanha');
            return;
        }

        let createdCampaignId = null;

        try {
            setSaving(true);
            const selectedWebhook = webhooks[campaignType];
            const campaignData = {
                name: formData.name.trim(),
                description: formData.description.trim() || undefined,
                prompt: formData.prompt.trim(),
                campaignType,
                metadata: {
                    webhookUrl: selectedWebhook,
                    n8nWebhookUrl: selectedWebhook,
                },
            };

            const response = await createCampaign(campaignData);

            if (response?.success === false) {
                throw new Error(response?.message || 'Erro ao criar campanha');
            }

            createdCampaignId = response?.data?.id || null;

            if (createdCampaignId && pendingLeadIds.length > 0) {
                const leadsResponse = await addLeadsToCampaign(createdCampaignId, pendingLeadIds);
                if (!leadsResponse?.success) {
                    throw new Error(leadsResponse?.message || 'Campanha criada, mas houve erro ao adicionar leads');
                }
            }

            await showCustomAlert({
                variant: 'success',
                title: 'Sucesso',
                text: 'Campanha criada com sucesso!',
            });
            router.push('/apps/campaigns/list');
        } catch (err) {
            console.error('Erro ao criar campanha:', err);
            if (createdCampaignId) {
                setError('Campanha criada, mas não foi possível vincular os leads. Você será redirecionado para editar.');
                setTimeout(() => {
                    router.push(`/apps/campaigns/${createdCampaignId}`);
                }, 1200);
            } else {
                setError(err?.message || err?.body?.message || 'Erro ao criar campanha. Tente novamente.');
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="contact-body contact-detail-body">
            <SimpleBar className="nicescroll-bar">
                <div className="contactapp-detail-wrap">
                    <Card>
                        <Card.Header>
                            <h5>Nova Campanha</h5>
                        </Card.Header>
                        <Card.Body>
                            {error && (
                                <Alert variant="danger" className="mb-3">
                                    {error}
                                </Alert>
                            )}
                            <Form onSubmit={handleSubmit}>
                                <Row>
                                    <Col md={12}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Nome da Campanha *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="Digite o nome da campanha"
                                                required
                                                disabled={saving}
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
                                                placeholder="Descrição da campanha"
                                                disabled={saving}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={12}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Tipo de Campanha *</Form.Label>
                                            <Form.Select
                                                value={campaignType}
                                                onChange={(e) => setCampaignType(e.target.value)}
                                                disabled={saving}
                                            >
                                                <option value="whatsapp">📱 Campanha de WhatsApp</option>
                                                <option value="voice">📞 Campanha de Voz</option>
                                            </Form.Select>
                                            {/* <Form.Text className="text-muted">
                                                {campaignType === 'whatsapp'
                                                    ? '📱 Webhook: https://nexus-n8n.captain.nexusbr.ai/webhook/outbound-whatsapp-campanha'
                                                    : '📞 Webhook: https://nexus-n8n.captain.nexusbr.ai/webhook/ce0328f9-175e-4512-826f-979e5d592841'
                                                }
                                            </Form.Text> */}
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={12}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Prompt *</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={6}
                                                name="prompt"
                                                value={formData.prompt}
                                                onChange={handleChange}
                                                placeholder="Prompt/mensagem a ser enviada"
                                                required
                                                disabled={saving}
                                            />
                                            <Form.Text className="text-muted">
                                                Use variáveis como {`{{name}}`} para personalizar o prompt
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={12}>
                                        <Card className="mb-3">
                                            <Card.Header className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <strong>Leads da Campanha</strong>
                                                    <Badge bg="primary" className="ms-2">
                                                        {pendingLeadIds.length}
                                                    </Badge>
                                                </div>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={handleOpenAddLeadsModal}
                                                    disabled={saving}
                                                >
                                                    <Plus size={16} className="me-1" />
                                                    Adicionar Leads
                                                </Button>
                                            </Card.Header>
                                            <Card.Body>
                                                {pendingLeadIds.length > 0 ? (
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {pendingLeadIds.map((leadId, index) => (
                                                            <Badge key={leadId} bg="secondary" className="p-2 d-flex align-items-center gap-2">
                                                                {getLeadLabel(leadId, index)}
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-link text-white p-0 d-flex align-items-center"
                                                                    onClick={() => handleRemovePendingLead(leadId)}
                                                                    aria-label="Remover lead"
                                                                    disabled={saving}
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-muted mb-0">
                                                        Nenhum lead selecionado. Você pode selecionar agora e salvar junto com a campanha.
                                                    </p>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={12}>
                                        <div className="d-flex gap-2">
                                            <Button variant="primary" type="submit" disabled={saving}>
                                                {saving ? 'Criando...' : 'Criar Campanha'}
                                            </Button>
                                            <Button variant="light" onClick={() => router.push('/apps/campaigns/list')} disabled={saving}>
                                                Cancelar
                                            </Button>
                                        </div>
                                    </Col>
                                </Row>
                            </Form>
                        </Card.Body>
                    </Card>
                </div>
            </SimpleBar>

            <Modal show={showAddLeadsModal} onHide={() => setShowAddLeadsModal(false)} size="lg" centered>
                <Modal.Header>
                    <Modal.Title>Selecionar Leads da Campanha</Modal.Title>
                    <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover" onClick={() => setShowAddLeadsModal(false)}>
                        <span className="icon">
                            <span className="feather-icon">
                                <X />
                            </span>
                        </span>
                    </Button>
                </Modal.Header>
                <Modal.Body>
                    {loadingLeads ? (
                        <div className="text-center py-4">
                            <p>Carregando leads disponíveis...</p>
                        </div>
                    ) : availableLeads.length === 0 ? (
                        <Alert variant="info">
                            Não há leads cadastrados para selecionar.
                        </Alert>
                    ) : (
                        <>
                            <p className="mb-3">Selecione os leads que deseja vincular nesta campanha:</p>
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                <Table hover>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '50px' }}>
                                                <Form.Check
                                                    checked={selectedLeads.length === availableLeads.length && availableLeads.length > 0}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedLeads(availableLeads.map((lead) => lead.id));
                                                        } else {
                                                            setSelectedLeads([]);
                                                        }
                                                    }}
                                                />
                                            </th>
                                            <th>Nome</th>
                                            <th>Email</th>
                                            <th>Telefone</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {availableLeads.map((lead) => (
                                            <tr
                                                key={lead.id}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => handleToggleLeadSelection(lead.id)}
                                            >
                                                <td>
                                                    <Form.Check
                                                        checked={selectedLeads.includes(lead.id)}
                                                        onChange={() => handleToggleLeadSelection(lead.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </td>
                                                <td>{lead.name || '-'}</td>
                                                <td>{lead.emailAddress || '-'}</td>
                                                <td>{lead.phoneNumber || '-'}</td>
                                                <td>
                                                    <Badge bg="secondary">{lead.status || 'New'}</Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                            {selectedLeads.length > 0 && (
                                <Alert variant="info" className="mt-3 mb-0">
                                    {selectedLeads.length} lead(s) selecionado(s)
                                </Alert>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => setShowAddLeadsModal(false)} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleConfirmLeadSelection} disabled={saving}>
                        Confirmar Seleção
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default CreateCampaignBody;
