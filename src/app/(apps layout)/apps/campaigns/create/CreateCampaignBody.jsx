'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import { Upload } from 'react-feather';
import { createCampaign } from '@/lib/api/services/campaigns';
import { importLeads } from '@/lib/api/services/leads';
import { apiRequest } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { showCustomAlert } from '@/components/CustomAlert';

const WEBHOOKS = {
    voice: 'https://nexus-n8n.captain.nexusbr.ai/webhook/ce0328f9-175e-4512-826f-979e5d592841',
    whatsapp: 'https://nexus-n8n.captain.nexusbr.ai/webhook/outbound-whatsapp-campanha',
};

const CreateCampaignBody = () => {
    const router = useRouter();
    const { status } = useAuth();
    const fileInputRef = useRef(null);

    const [agents, setAgents] = useState([]);
    const [loadingAgents, setLoadingAgents] = useState(true);

    const [saving, setSaving] = useState(false);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState(null);
    const [campaignType, setCampaignType] = useState('whatsapp');

    const [selectedAgentId, setSelectedAgentId] = useState('');
    const [csvFile, setCsvFile] = useState(null);
    const [importedLeadIds, setImportedLeadIds] = useState([]);
    const [importCount, setImportCount] = useState(null);

    const [formData, setFormData] = useState({ name: '', description: '', prompt: '' });

    useEffect(() => {
        apiRequest('/agents')
            .then((res) => {
                const list = res?.data ?? res?.agents ?? res ?? [];
                setAgents(Array.isArray(list) ? list : []);
            })
            .catch(() => setAgents([]))
            .finally(() => setLoadingAgents(false));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!selectedAgentId) {
            setError('Selecione um agente antes de importar o arquivo.');
            return;
        }
        setCsvFile(file);
        setImportedLeadIds([]);
        setImportCount(null);
        setError(null);

        try {
            setImporting(true);
            const result = await importLeads(file, selectedAgentId);
            const leadIds = result?.leadIds ?? result?.data?.leadIds ?? [];
            const imported = result?.imported ?? result?.data?.imported ?? leadIds.length;
            setImportedLeadIds(leadIds);
            setImportCount(imported);
        } catch (err) {
            setError(err?.message || 'Erro ao importar arquivo. Verifique o formato e tente novamente.');
            setCsvFile(null);
        } finally {
            setImporting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!selectedAgentId) { setError('Selecione um agente para executar a campanha.'); return; }
        if (!formData.name.trim()) { setError('O nome da campanha é obrigatório.'); return; }
        if (!formData.prompt.trim()) { setError('O prompt é obrigatório.'); return; }
        if (importedLeadIds.length === 0) { setError('Importe um arquivo CSV ou XLSX com os leads antes de criar a campanha.'); return; }
        if (status !== 'authenticated') { setError('Você precisa estar autenticado.'); return; }

        try {
            setSaving(true);
            const response = await createCampaign({
                name: formData.name.trim(),
                description: formData.description.trim() || undefined,
                prompt: formData.prompt.trim(),
                agentId: selectedAgentId,
                campaignType,
                leadIds: importedLeadIds,
                metadata: {
                    webhookUrl: WEBHOOKS[campaignType],
                    n8nWebhookUrl: WEBHOOKS[campaignType],
                },
            });

            if (response?.success === false) throw new Error(response?.message || 'Erro ao criar campanha');

            const campaignId = response?.campaign?.id ?? response?.data?.id;
            await showCustomAlert({ variant: 'success', title: 'Sucesso', text: 'Campanha criada! Redirecionando para monitoramento...' });

            if (campaignId) {
                router.push(`/apps/campaigns/${campaignId}/monitor`);
            } else {
                router.push('/apps/campaigns/list');
            }
        } catch (err) {
            setError(err?.message || 'Erro ao criar campanha. Tente novamente.');
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
                            {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
                            <Form onSubmit={handleSubmit}>
                                <Row>
                                    <Col md={12}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Agente Executor *</Form.Label>
                                            {loadingAgents ? (
                                                <div><Spinner size="sm" className="me-2" />Carregando agentes...</div>
                                            ) : (
                                                <Form.Select
                                                    value={selectedAgentId}
                                                    onChange={(e) => { setSelectedAgentId(e.target.value); setImportedLeadIds([]); setImportCount(null); setCsvFile(null); }}
                                                    disabled={saving}
                                                    required
                                                >
                                                    <option value="">Selecione o agente que vai atender os leads...</option>
                                                    {agents.map((agent) => (
                                                        <option key={agent.id} value={agent.id}>{agent.name || agent.agentName || agent.id}</option>
                                                    ))}
                                                </Form.Select>
                                            )}
                                            <Form.Text className="text-muted">O agente selecionado irá abordar e qualificar os leads após o disparo.</Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={12}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Nome da Campanha *</Form.Label>
                                            <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ex: Prospecção Imóveis Janeiro 2025" required disabled={saving} />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={12}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Tipo de Campanha *</Form.Label>
                                            <Form.Select value={campaignType} onChange={(e) => setCampaignType(e.target.value)} disabled={saving}>
                                                <option value="whatsapp">📱 WhatsApp</option>
                                                <option value="voice">📞 Voz (Ligação)</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={12}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Importar Lista de Leads (CSV ou XLSX) *</Form.Label>
                                            <div
                                                className="border rounded p-3 text-center"
                                                style={{ cursor: 'pointer', background: '#f8f9fa' }}
                                                onClick={() => selectedAgentId && fileInputRef.current?.click()}
                                            >
                                                {importing ? (
                                                    <><Spinner size="sm" className="me-2" />Importando leads...</>
                                                ) : importCount !== null ? (
                                                    <div>
                                                        <Badge bg="success" className="fs-6 p-2">{importCount} leads importados</Badge>
                                                        <br /><small className="text-muted mt-1 d-block">{csvFile?.name} — clique para trocar o arquivo</small>
                                                    </div>
                                                ) : (
                                                    <div className="text-muted">
                                                        <Upload size={24} className="mb-2" />
                                                        <p className="mb-0">{selectedAgentId ? 'Clique para selecionar CSV ou XLSX' : 'Selecione um agente primeiro'}</p>
                                                        <small>Colunas: name, phone (obrigatórios) + email, company, stage, score (opcionais)</small>
                                                    </div>
                                                )}
                                            </div>
                                            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="d-none" onChange={handleFileChange} disabled={saving || importing || !selectedAgentId} />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={12}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Prompt da Mensagem *</Form.Label>
                                            <Form.Control as="textarea" rows={6} name="prompt" value={formData.prompt} onChange={handleChange} placeholder="Mensagem inicial que o agente enviará aos leads..." required disabled={saving} />
                                            <Form.Text className="text-muted">Use {`{{name}}`} para personalizar com o nome do lead.</Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={12}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Descrição</Form.Label>
                                            <Form.Control as="textarea" rows={2} name="description" value={formData.description} onChange={handleChange} placeholder="Descrição interna da campanha (opcional)" disabled={saving} />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={12}>
                                        <div className="d-flex gap-2">
                                            <Button variant="primary" type="submit" disabled={saving || importing || importedLeadIds.length === 0}>
                                                {saving ? 'Criando...' : 'Criar Campanha'}
                                            </Button>
                                            <Button variant="light" onClick={() => router.push('/apps/campaigns/list')} disabled={saving}>Cancelar</Button>
                                        </div>
                                    </Col>
                                </Row>
                            </Form>
                        </Card.Body>
                    </Card>
                </div>
            </SimpleBar>
        </div>
    );
};

export default CreateCampaignBody;
