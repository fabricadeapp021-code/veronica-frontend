'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Card, Col, Form, Row } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import { Tag } from 'react-feather';
import { getLead, updateLead } from '@/lib/api/services/leads';
import { useAuth } from '@/lib/auth/AuthProvider';
import { showCustomAlert } from '@/components/CustomAlert';

const STATUS_OPTIONS = [
    { value: 'New',          label: 'Novo'           },
    { value: 'Contacted',    label: 'Abordado'       },
    { value: 'Engaged',      label: 'Engajado'       },
    { value: 'Qualified',    label: 'Prioritário'    },
    { value: 'Disqualified', label: 'Fora do Perfil' },
    { value: 'Converted',    label: 'Convertido'     },
    { value: 'Lost',         label: 'Encerrado'      },
];

const TAG_SEED = ['Zona Sul', 'Zona Norte', 'Zona Oeste', 'Prioridade', 'WhatsApp', 'Voz', 'teste'];

const EditLeadBody = () => {
    const router = useRouter();
    const params = useParams();
    const { user, status } = useAuth();
    const leadId = params?.id;

    if (user?.role === 'external') {
        return (
            <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
                <div className="text-center" style={{ maxWidth: 440 }}>
                    <div style={{ fontSize: 56 }}>🔒</div>
                    <h4 className="mt-3 mb-2">Acesso Restrito</h4>
                    <p className="text-muted mb-4">
                        Você possui apenas permissão de visualização e não pode editar leads.
                    </p>
                    <Button variant="primary" onClick={() => router.push('/apps/leads/list')}>
                        Ver Lista de Leads
                    </Button>
                </div>
            </div>
        );
    }

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lead, setLead] = useState(null);
    const [tagInput, setTagInput] = useState('');
    const [availableTags, setAvailableTags] = useState(TAG_SEED);
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
        tags: [],
    });

    const sectionCardStyle = {
        border: '1px solid var(--bs-border-color)',
        borderRadius: '12px',
        background: 'var(--bs-body-bg)',
    };

    const submitBtnStyle = {
        backgroundColor: '#16a34a',
        borderColor: '#16a34a',
        color: '#ffffff',
    };

    useEffect(() => {
        if (status === 'authenticated' && leadId) {
            loadLead();
        } else if (status === 'guest') {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, leadId]);

    const loadLead = async () => {
        try {
            setLoading(true);
            const response = await getLead(leadId);
            if (response && response.success && response.data) {
                const data = response.data;
                setLead(data);

                // Merge tags do lead com as seeds, sem duplicatas
                const leadTags = Array.isArray(data.tags) ? data.tags : [];
                const merged = [...new Set([...TAG_SEED, ...leadTags])];
                setAvailableTags(merged);

                setFormData({
                    name: data.name || '',
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    emailAddress: data.emailAddress || '',
                    phoneNumber: data.phoneNumber || '',
                    status: data.status || 'New',
                    source: data.source || '',
                    industry: data.industry || '',
                    website: data.website || '',
                    description: data.description || '',
                    tags: leadTags,
                });
            } else {
                await showCustomAlert({ variant: 'danger', title: 'Erro', text: 'Lead não encontrado' });
                router.push('/apps/leads/list');
            }
        } catch (err) {
            console.error('Erro ao carregar lead:', err);
            await showCustomAlert({ variant: 'danger', title: 'Erro', text: err?.message || 'Erro ao carregar lead' });
            router.push('/apps/leads/list');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const toggleTag = (tag) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag],
        }));
    };

    const handleAddTag = () => {
        const cleanTag = String(tagInput || '').trim();
        if (!cleanTag) return;
        if (!availableTags.includes(cleanTag)) {
            setAvailableTags(prev => [...prev, cleanTag]);
        }
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.includes(cleanTag) ? prev.tags : [...prev.tags, cleanTag],
        }));
        setTagInput('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim() && (!formData.firstName.trim() || !formData.lastName.trim())) {
            await showCustomAlert({ variant: 'danger', title: 'Erro', text: 'É necessário informar o nome completo ou primeiro nome e último nome' });
            return;
        }

        if (!formData.emailAddress.trim() && !formData.phoneNumber.trim()) {
            await showCustomAlert({ variant: 'danger', title: 'Erro', text: 'É necessário informar pelo menos o email ou telefone' });
            return;
        }

        if (status !== 'authenticated') {
            await showCustomAlert({ variant: 'danger', title: 'Erro', text: 'Você precisa estar autenticado para editar um lead' });
            return;
        }

        try {
            setSaving(true);

            const nameValue = formData.name.trim() ||
                (formData.firstName.trim() && formData.lastName.trim()
                    ? `${formData.firstName.trim()} ${formData.lastName.trim()}`
                    : formData.firstName.trim() || formData.lastName.trim() || '');

            const leadData = {};
            if (nameValue)                  leadData.name         = nameValue;
            if (formData.firstName.trim())  leadData.firstName    = formData.firstName.trim();
            if (formData.lastName.trim())   leadData.lastName     = formData.lastName.trim();
            if (formData.emailAddress.trim()) leadData.emailAddress = formData.emailAddress.trim();
            if (formData.phoneNumber.trim()) leadData.phoneNumber  = formData.phoneNumber.trim();

            leadData.status = formData.status || 'New';

            if (formData.source?.trim())      leadData.source      = formData.source.trim();
            if (formData.industry?.trim())    leadData.industry    = formData.industry.trim();
            if (formData.website?.trim())     leadData.website     = formData.website.trim();
            if (formData.description?.trim()) leadData.description = formData.description.trim();

            if (Array.isArray(formData.tags) && formData.tags.length > 0) {
                leadData.tags = formData.tags;
            }

            const response = await updateLead(leadId, leadData);

            if (response?.success === false) {
                await showCustomAlert({ variant: 'danger', title: 'Erro', text: response?.message || 'Erro ao atualizar lead' });
                return;
            }

            await showCustomAlert({ variant: 'success', title: 'Sucesso', text: 'Lead atualizado com sucesso!' });
            router.push('/apps/leads/list');
        } catch (err) {
            console.error('Erro ao atualizar lead:', err);
            let errorMessage = 'Erro ao atualizar lead. Tente novamente.';
            const errorText = err?.message || err?.body?.message || '';
            const is409 = err?.status === 409 || errorText.includes('409');
            if (is409)                  errorMessage = 'Já existe um lead com este email ou telefone.';
            else if (err?.body?.message) errorMessage = err.body.message;
            else if (err?.message)       errorMessage = err.message;
            await showCustomAlert({ variant: 'danger', title: 'Erro', text: errorMessage });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="contact-body">
                <SimpleBar className="nicescroll-bar">
                    <div className="text-center py-5"><p>Carregando lead...</p></div>
                </SimpleBar>
            </div>
        );
    }

    return (
        <>
            <style>{`
                .lead-edit-page .form-control,
                .lead-edit-page .form-select {
                    background-color: var(--bs-tertiary-bg, var(--bs-body-bg)) !important;
                    border-color: var(--bs-border-color) !important;
                    color: var(--bs-body-color) !important;
                }
                .lead-edit-page .form-control::placeholder {
                    color: var(--bs-secondary-color) !important;
                }
                .lead-edit-page .form-control:focus,
                .lead-edit-page .form-select:focus {
                    background-color: var(--bs-tertiary-bg, var(--bs-body-bg)) !important;
                    border-color: var(--bs-primary) !important;
                    color: var(--bs-body-color) !important;
                    box-shadow: 0 0 0 0.2rem rgba(var(--bs-primary-rgb), 0.15) !important;
                }
                .lead-edit-page .form-select option {
                    background-color: var(--bs-body-bg);
                    color: var(--bs-body-color);
                }
            `}</style>
        <div className="contact-body contact-detail-body lead-edit-page">
            <SimpleBar className="nicescroll-bar">
                <div className="contactapp-detail-wrap">
                    <Card>
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Editar Lead</h5>
                            {lead && (
                                <small className="text-muted">
                                    Criado em: {lead.createdAt ? new Date(lead.createdAt).toLocaleString('pt-BR') : '-'}
                                    {lead.modifiedAt && lead.modifiedAt !== lead.createdAt && (
                                        <> · Modificado: {new Date(lead.modifiedAt).toLocaleString('pt-BR')}</>
                                    )}
                                </small>
                            )}
                        </Card.Header>
                        <Card.Body className="pb-3">
                            <Form onSubmit={handleSubmit} className="mb-0">

                                {/* Dados do Contato */}
                                <div className="p-3 p-md-4 mb-3" style={sectionCardStyle}>
                                    <h6 className="mb-1 fw-semibold">Dados do Contato</h6>
                                    <p className="text-muted mb-3">Preencha as informações básicas do lead.</p>
                                    <Row>
                                        <Col md={12}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Nome Completo</Form.Label>
                                                <Form.Control
                                                    type="text" name="name" value={formData.name}
                                                    onChange={handleChange} disabled={saving}
                                                    placeholder="Digite o nome completo do lead"
                                                />
                                                <Form.Text className="text-muted">Ou preencha primeiro nome e último nome abaixo</Form.Text>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Primeiro Nome</Form.Label>
                                                <Form.Control type="text" name="firstName" value={formData.firstName} onChange={handleChange} disabled={saving} placeholder="Primeiro nome" />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Último Nome</Form.Label>
                                                <Form.Control type="text" name="lastName" value={formData.lastName} onChange={handleChange} disabled={saving} placeholder="Último nome" />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-0">
                                                <Form.Label>Email</Form.Label>
                                                <Form.Control type="email" name="emailAddress" value={formData.emailAddress} onChange={handleChange} disabled={saving} placeholder="email@exemplo.com" />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-0">
                                                <Form.Label>Telefone</Form.Label>
                                                <Form.Control type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} disabled={saving} placeholder="+55 11 99999-9999" />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </div>

                                {/* Qualificação */}
                                <div className="p-3 p-md-4 mb-3" style={sectionCardStyle}>
                                    <h6 className="mb-1 fw-semibold">Qualificação do Lead</h6>
                                    <p className="text-muted mb-3">Defina status, origem e contexto comercial.</p>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Status</Form.Label>
                                                <Form.Select name="status" value={formData.status} onChange={handleChange} disabled={saving}>
                                                    {STATUS_OPTIONS.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Origem</Form.Label>
                                                <Form.Control type="text" name="source" value={formData.source} onChange={handleChange} disabled={saving} placeholder="Ex: Website, Facebook, Indicação" />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-0">
                                                <Form.Label>Indústria</Form.Label>
                                                <Form.Control type="text" name="industry" value={formData.industry} onChange={handleChange} disabled={saving} placeholder="Ex: Tecnologia, Varejo" />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-0">
                                                <Form.Label>Website</Form.Label>
                                                <Form.Control type="url" name="website" value={formData.website} onChange={handleChange} disabled={saving} placeholder="https://exemplo.com" />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </div>

                                {/* Tags */}
                                <Row className="mb-0">
                                    <Col md={12}>
                                        <Form.Group className="mb-3">
                                            <div className="p-3 p-md-4" style={sectionCardStyle}>
                                                <div className="d-flex align-items-center gap-2 mb-1">
                                                    <Tag size={16} color="#0ea58a" />
                                                    <h6 className="mb-0 fw-semibold">Tags da Campanha</h6>
                                                </div>
                                                <p className="text-muted mb-3">Adicione tags para organizar e filtrar suas campanhas.</p>
                                                <div className="d-flex gap-2 mb-3">
                                                    <Form.Control
                                                        type="text" value={tagInput}
                                                        onChange={(e) => setTagInput(e.target.value)}
                                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                                                        placeholder="Nome da tag..." disabled={saving}
                                                        style={{ maxWidth: 420 }}
                                                    />
                                                    <Button variant="outline-secondary" type="button" onClick={handleAddTag} disabled={saving || !tagInput.trim()}>
                                                        + Criar
                                                    </Button>
                                                </div>
                                                <div className="d-flex flex-wrap gap-2">
                                                    {availableTags.map(tag => (
                                                        <Button
                                                            key={tag} type="button" size="sm"
                                                            variant={formData.tags.includes(tag) ? 'success' : 'light'}
                                                            className="rounded-pill px-3"
                                                            style={{ borderColor: formData.tags.includes(tag) ? '#0ea58a' : '#ced4da' }}
                                                            onClick={() => toggleTag(tag)} disabled={saving}
                                                        >
                                                            <Tag size={11} className="me-1" />
                                                            {tag}
                                                        </Button>
                                                    ))}
                                                </div>
                                                <div className="mt-3 small text-muted">
                                                    {formData.tags.length} tag(s) selecionada(s)
                                                </div>
                                            </div>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                {/* Observações */}
                                <div className="p-3 p-md-4 mb-3" style={sectionCardStyle}>
                                    <h6 className="mb-1 fw-semibold">Observações</h6>
                                    <p className="text-muted mb-3">Registre informações adicionais sobre o lead.</p>
                                    <Form.Group className="mb-0">
                                        <Form.Label>Descrição</Form.Label>
                                        <Form.Control
                                            as="textarea" rows={3} name="description"
                                            value={formData.description} onChange={handleChange}
                                            disabled={saving} placeholder="Informações adicionais sobre o lead"
                                        />
                                    </Form.Group>
                                </div>

                                <Row>
                                    <Col md={12}>
                                        <div className="d-flex gap-2">
                                            <Button
                                                type="submit" disabled={saving} style={submitBtnStyle}
                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#15803d'; e.currentTarget.style.borderColor = '#15803d'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#16a34a'; e.currentTarget.style.borderColor = '#16a34a'; }}
                                            >
                                                {saving ? 'Salvando...' : 'Salvar Alterações'}
                                            </Button>
                                            <Button variant="light" onClick={() => router.push('/apps/leads/list')} disabled={saving}>
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
        </div>
        </>
    );
};

export default EditLeadBody;
