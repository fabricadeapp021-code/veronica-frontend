'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Col, Form, Modal, ProgressBar, Row } from 'react-bootstrap';
import {
    ArrowLeft,
    Check,
    CheckCircle,
    ChevronRight,
    Link as LinkIcon,
    MessageCircle,
    PenTool,
    ShoppingCart,
    User,
    Plus,
    Search,
    Tag,
    Upload,
    Users,
    X,
    Save,
} from 'react-feather';
import { listLeads } from '@/lib/api/services/leads';
import { createCampaign } from '@/lib/api/services/campaigns';
import { showCustomAlert } from '@/components/CustomAlert';
import { useAuth } from '@/lib/auth/AuthProvider';
import { apiRequest } from '@/lib/api/client';

const FIXED_TEMPLATE = {
    id: 'ola_vamos_conversar|pt_BR',
    name: 'ola_vamos_conversar',
    label: 'Olá, Vamos Conversar',
    approved: true,
};

const STEPS = [
    { key: 'basic',    title: 'Dados Básicos', subtitle: 'Nome da campanha',             icon: PenTool },
    { key: 'template', title: 'Template',       subtitle: 'Template de mensagem WhatsApp', icon: MessageCircle },
    { key: 'audience', title: 'Público',        subtitle: 'Tags, segmentação e leads',     icon: User },
    { key: 'review',   title: 'Revisar',        subtitle: 'Confirmar e salvar',            icon: Check },
];

const INITIAL_TAG_OPTIONS = ['Zona Sul', 'Zona Norte', 'Zona Oeste', 'Prioridade', 'WhatsApp', 'Voz'];
const INITIAL_SELECTED_TAGS = ['WhatsApp'];
const LEADS_PAGE_SIZE = 5;

const CreateCampaignWhatsAppBody = () => {
    const router = useRouter();
    const { status } = useAuth();

    const [step, setStep] = useState(1);

    // Step 1 — Dados Básicos
    const [campaignName, setCampaignName] = useState('');
    const [agentId, setAgentId] = useState('');
    const [agents, setAgents] = useState([]);
    const [loadingAgents, setLoadingAgents] = useState(false);

    // Step 2 — Template
    const [bodyMessage, setBodyMessage] = useState('');

    // Step 3 — Público
    const [tagOptions, setTagOptions] = useState(INITIAL_TAG_OPTIONS);
    const [selectedTags, setSelectedTags] = useState(INITIAL_SELECTED_TAGS);
    const [tagInput, setTagInput] = useState('');
    const [showLeadsModal, setShowLeadsModal] = useState(false);
    const [leadSearch, setLeadSearch] = useState('');
    const [selectedLeadIds, setSelectedLeadIds] = useState([]);
    const [leadOptions, setLeadOptions] = useState([]);
    const [loadingLeads, setLoadingLeads] = useState(false);
    const [leadModalTab, setLeadModalTab] = useState('list');
    const [leadModalPage, setLeadModalPage] = useState(1);
    const [importFile, setImportFile] = useState(null);

    // Step 4 — Revisar / save
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);

    const totalSteps = STEPS.length;
    const progressPercent = useMemo(() => Math.floor(((step - 1) / (totalSteps - 1)) * 100), [step, totalSteps]);
    const linkedLeads = useMemo(() => leadOptions.filter((l) => selectedLeadIds.includes(l.id)), [leadOptions, selectedLeadIds]);
    const filteredLeads = useMemo(() => {
        const term = leadSearch.trim().toLowerCase();
        if (!term) return leadOptions;
        return leadOptions.filter((l) => [l.name, l.email, l.phone].join(' ').toLowerCase().includes(term));
    }, [leadOptions, leadSearch]);
    const totalLeadPages = useMemo(() => Math.max(1, Math.ceil(filteredLeads.length / LEADS_PAGE_SIZE)), [filteredLeads.length]);
    const paginatedLeads = useMemo(() => {
        const start = (leadModalPage - 1) * LEADS_PAGE_SIZE;
        return filteredLeads.slice(start, start + LEADS_PAGE_SIZE);
    }, [filteredLeads, leadModalPage]);

    const selectedAgent = useMemo(() => agents.find((a) => a.id === agentId || a._id === agentId), [agents, agentId]);

    const loadAgents = async () => {
        try {
            setLoadingAgents(true);
            const data = await apiRequest('/agents');
            const list = Array.isArray(data) ? data : (data?.data ?? data?.agents ?? []);
            setAgents(list);
            if (list.length === 1) setAgentId(list[0].id || list[0]._id);
        } catch {
            setAgents([]);
        } finally {
            setLoadingAgents(false);
        }
    };

    const loadLeads = async () => {
        try {
            setLoadingLeads(true);
            const response = await listLeads({ limit: 1000 });
            const rawLeads = Array.isArray(response?.leads)
                ? response.leads
                : Array.isArray(response)
                ? response
                : [];
            setLeadOptions(rawLeads.map((l) => ({
                id: String(l._id ?? l.id),
                name: l.name || '-',
                email: l.email || '-',
                phone: l.phone || '-',
                status: String(l.stage || 'novo'),
            })));
        } catch {
            setLeadOptions([]);
        } finally {
            setLoadingLeads(false);
        }
    };

    useEffect(() => {
        if (status === 'authenticated') {
            loadAgents();
            loadLeads();
        }
    }, [status]);

    useEffect(() => {
        if (showLeadsModal && status === 'authenticated') loadLeads();
    }, [showLeadsModal, status]);

    useEffect(() => { setLeadModalPage(1); }, [showLeadsModal, leadSearch, leadModalTab]);
    useEffect(() => {
        if (leadModalPage > totalLeadPages) setLeadModalPage(totalLeadPages);
    }, [leadModalPage, totalLeadPages]);

    const toggleTag = (tag) => setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

    const handleCreateTag = () => {
        const n = tagInput.trim();
        if (!n) return;
        if (!tagOptions.includes(n)) setTagOptions((prev) => [...prev, n]);
        setSelectedTags((prev) => prev.includes(n) ? prev : [...prev, n]);
        setTagInput('');
    };

    const toggleLead = (leadId) => setSelectedLeadIds((prev) => prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]);

    const getLeadStatusClass = (s) => {
        const v = String(s || '').trim().toLowerCase();
        if (v === 'new' || v === 'novo') return 'bg-success-subtle text-success border border-success-subtle';
        if (['qualified', 'engajado', 'prioritario'].includes(v)) return 'bg-primary-subtle text-primary border border-primary-subtle';
        return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
    };

    const goNext = () => { if (step < totalSteps) setStep((p) => p + 1); };
    const goBack = () => {
        if (step > 1) { setStep((p) => p - 1); return; }
        router.push('/apps/campaigns/list');
    };

    const handleSaveCampaign = async () => {
        if (!campaignName.trim()) { setStep(1); setSaveError('O nome da campanha é obrigatório.'); return; }
        if (!agentId) { setStep(1); setSaveError('Selecione o agente responsável pela campanha.'); return; }
        if (!bodyMessage.trim()) { setStep(2); setSaveError('A mensagem da campanha é obrigatória.'); return; }

        setSaving(true);
        setSaveError(null);
        let createdId = null;

        try {
            const payload = {
                name: campaignName.trim(),
                prompt: bodyMessage.trim(),
                campaignType: 'whatsapp',
                agentId,
                templateId: FIXED_TEMPLATE.id,
                leadIds: selectedLeadIds,
                metadata: { tags: selectedTags },
            };

            const response = await createCampaign(payload);
            if (response?.success === false) throw new Error(response?.message || 'Erro ao criar campanha');

            createdId = response?.campaign?._id ?? response?.campaign?.id ?? response?.data?.id ?? null;

            await showCustomAlert({ variant: 'success', title: 'Campanha criada!', text: `"${campaignName}" foi salva com sucesso.` });
            router.push('/apps/campaigns/list');
        } catch (err) {
            console.error('Erro ao salvar campanha WhatsApp:', err);
            if (createdId) {
                setSaveError('Campanha criada, mas não foi possível vincular os leads. Redirecionando...');
                setTimeout(() => router.push(`/apps/campaigns/${createdId}`), 1500);
            } else {
                setSaveError(err?.message || 'Erro ao criar campanha. Tente novamente.');
            }
        } finally {
            setSaving(false);
        }
    };

    const STEP_TITLES = ['Dados Básicos', 'Template', 'Público', 'Revisar'];
    const STEP_SUBTITLES = ['Nome da campanha', 'Template de mensagem WhatsApp', 'Tags, segmentação e leads', 'Confirmação final'];

    return (
        <div className="contact-body contact-detail-body">
            <style>{`
                .wc-step-item {
                    border-radius: 12px;
                    padding: 12px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    border: 1px solid transparent;
                    opacity: .48;
                    width: 100%;
                    text-align: left;
                    background: transparent;
                    cursor: pointer;
                    transition: background .15s, border-color .15s, opacity .15s;
                }
                .wc-step-item.active {
                    background: rgba(21,160,133,.12);
                    border-color: rgba(21,160,133,.4);
                    opacity: 1;
                }
                .wc-step-item.completed { opacity: 1; }
                .wc-step-icon {
                    width: 28px; height: 28px; border-radius: 999px;
                    display: inline-flex; align-items: center; justify-content: center;
                    background: var(--bs-body-bg);
                    border: 1px solid var(--bs-border-color);
                    flex-shrink: 0;
                }
                .wc-step-item.active .wc-step-icon { background: #15a085; border-color: #15a085; color: #fff; }
                .wc-step-item.completed .wc-step-icon { background: rgba(21,160,133,.15); border-color: rgba(21,160,133,.4); color: #15a085; }

                .wc-card {
                    border: 1px solid var(--bs-border-color);
                    border-radius: 14px;
                    background: var(--bs-body-bg);
                    box-shadow: 0 2px 10px rgba(15,23,42,.04);
                }
                .wc-soft-btn {
                    background: var(--bs-body-bg) !important;
                    border: 1px solid var(--bs-border-color) !important;
                    color: var(--bs-body-color) !important;
                    box-shadow: none !important;
                }
                .wc-soft-btn:hover, .wc-soft-btn:focus, .wc-soft-btn:active, .wc-soft-btn.show {
                    background: var(--bs-secondary-bg) !important;
                    border-color: var(--bs-border-color) !important;
                    color: var(--bs-body-color) !important;
                    box-shadow: none !important;
                }
                .wc-back-btn {
                    width: 36px; height: 36px; padding: 0 !important; border-radius: 8px;
                    display: inline-flex; align-items: center; justify-content: center;
                    background: var(--bs-body-bg) !important;
                    border: 1px solid var(--bs-border-color) !important;
                    color: var(--bs-body-color) !important;
                    box-shadow: none !important;
                }
                .wc-back-btn:hover, .wc-back-btn:focus, .wc-back-btn:active {
                    background: var(--bs-secondary-bg) !important;
                    border-color: var(--bs-border-color) !important;
                    color: var(--bs-body-color) !important;
                    box-shadow: none !important;
                }
                .wc-title-badge {
                    background: rgba(99,102,241,.1);
                    color: #6366f1;
                    border: 1px solid rgba(99,102,241,.3);
                    border-radius: 999px; padding: 6px 14px;
                    font-weight: 600; font-size: 14px;
                    display: inline-flex; align-items: center; gap: 8px;
                }
                .wc-layout { min-height: calc(100vh - 160px); }
                .wc-tag-chip {
                    border-radius: 999px;
                    border: 1px solid var(--bs-border-color);
                    background: var(--bs-secondary-bg);
                    color: var(--bs-body-color);
                    padding: 6px 12px; font-size: 14px;
                    display: inline-flex; align-items: center; gap: 6px;
                    cursor: pointer; transition: background .12s, color .12s;
                }
                .wc-tag-chip.selected { background: #15a085; border-color: #15a085; color: #fff; }
                .wc-empty-box {
                    min-height: 190px; display: flex; align-items: center;
                    justify-content: center; text-align: center; color: var(--bs-secondary-color);
                }
                .wc-lead-table td, .wc-lead-table th { vertical-align: middle; }
                .wc-modal-tab {
                    border: 1px solid transparent !important;
                    background: transparent !important;
                    color: var(--bs-secondary-color) !important;
                    min-height: 42px; border-radius: 10px !important;
                }
                .wc-modal-tab.active {
                    background: var(--bs-body-bg) !important;
                    border-color: #15a085 !important;
                    color: var(--bs-body-color) !important;
                    box-shadow: none !important;
                }
                .wc-modal-segmented {
                    border: 1px solid var(--bs-border-color);
                    background: var(--bs-secondary-bg);
                    border-radius: 12px; padding: 6px;
                }
                .wc-dropzone {
                    border: 2px dashed var(--bs-border-color); border-radius: 14px;
                    min-height: 210px; display: flex; align-items: center;
                    justify-content: center; text-align: center; padding: 16px;
                    background: var(--bs-secondary-bg);
                }
                .wc-file-sample {
                    background: var(--bs-secondary-bg); border: 1px solid var(--bs-border-color);
                    border-radius: 10px; padding: 14px; color: var(--bs-secondary-color);
                    font-family: ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
                    font-size: 14px; white-space: pre-line;
                }
                .wc-review-title {
                    color: var(--bs-secondary-color); letter-spacing: .06em;
                    font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 10px;
                }
                .wc-tpl-preview {
                    background: rgba(21,160,133,.08);
                    border: 1px solid rgba(21,160,133,.25);
                    border-radius: 12px; padding: 16px;
                    white-space: pre-line; line-height: 1.7; font-size: 15px;
                }
                .wc-tpl-var {
                    background: rgba(245,158,11,.18);
                    border: 1px solid rgba(245,158,11,.35);
                    border-radius: 4px; padding: 1px 5px;
                    font-weight: 600; font-family: ui-monospace,monospace; font-size: 13px;
                }
            `}</style>

            <Row className="g-0 wc-layout">
                {/* Sidebar */}
                <Col xl={2} lg={3} className="border-end px-3 py-3" style={{ background: 'var(--bs-body-bg)' }}>
                    <div className="text-uppercase text-muted small fw-semibold mb-3">Etapas</div>
                    <div className="d-flex flex-column gap-2">
                        {STEPS.map((item, index) => {
                            const Icon = item.icon;
                            const sn = index + 1;
                            const isActive = sn === step;
                            const isCompleted = sn < step;
                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setStep(sn)}
                                    className={`wc-step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                                >
                                    <span className="wc-step-icon">
                                        {isCompleted ? <CheckCircle size={14} /> : <Icon size={14} />}
                                    </span>
                                    <div>
                                        <div className="fw-semibold" style={{ fontSize: 14 }}>{item.title}</div>
                                        <div className="small text-muted">{item.subtitle}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </Col>

                {/* Main */}
                <Col xl={10} lg={9} className="px-4 py-4">
                    {/* Header */}
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                        <div className="d-flex align-items-center gap-3">
                            <Button variant="outline-secondary" className="wc-back-btn" onClick={goBack}>
                                <ArrowLeft size={18} />
                            </Button>
                            <h1 className="h3 mb-0">Nova Campanha WhatsApp</h1>
                            <span className="wc-title-badge">
                                <MessageCircle size={14} />
                                Campanha WhatsApp
                            </span>
                        </div>
                        <Button variant="outline-secondary" className="wc-soft-btn" onClick={() => router.push('/apps/campaigns/list')}>
                            Cancelar
                        </Button>
                    </div>

                    {/* Credits bar */}
                    <div className="d-flex flex-wrap justify-content-end align-items-center gap-3 mb-2">
                        <div className="d-flex align-items-center gap-1 small text-muted">
                            <LinkIcon size={13} style={{ color: '#f59e0b' }} />
                            <span>Créditos Restantes:</span>
                            <strong>1.000</strong>
                        </div>
                        <div className="small text-muted">Totais: <strong>5.000</strong></div>
                        <div className="rounded-pill" style={{ width: 56, height: 6, background: 'var(--bs-secondary-bg)' }}>
                            <div className="rounded-pill" style={{ width: '80%', height: '100%', background: '#f59e0b' }} />
                        </div>
                        <Button variant="outline-secondary" className="wc-soft-btn d-inline-flex align-items-center gap-1">
                            <ShoppingCart size={14} /> Comprar Créditos
                        </Button>
                    </div>

                    <div style={{ maxWidth: 640, margin: '0 auto' }}>
                        {/* Progress */}
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="fw-semibold">Passo {step} de {totalSteps}</div>
                            <small className="text-muted">{progressPercent}% concluído</small>
                        </div>
                        <ProgressBar now={progressPercent} className="mb-4" style={{ height: 7 }} />

                        <h2 className="mb-1">{STEP_TITLES[step - 1]}</h2>
                        <p className="text-muted mb-4">{STEP_SUBTITLES[step - 1]}</p>

                        {/* ── Step 1: Dados Básicos ── */}
                        {step === 1 && (
                            <Card className="wc-card mb-4">
                                <Card.Body className="p-4">
                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-semibold">Nome da Campanha <span className="text-danger">*</span></Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Ex: Abordagem Inicial Imóveis"
                                            value={campaignName}
                                            onChange={(e) => setCampaignName(e.target.value)}
                                        />
                                        <Form.Text className="text-muted">Escolha um nome descritivo para identificar esta campanha.</Form.Text>
                                    </Form.Group>

                                    <Form.Group>
                                        <Form.Label className="fw-semibold">Agente Responsável <span className="text-danger">*</span></Form.Label>
                                        <Form.Select
                                            value={agentId}
                                            onChange={(e) => setAgentId(e.target.value)}
                                            disabled={loadingAgents}
                                        >
                                            <option value="">{loadingAgents ? 'Carregando agentes...' : 'Selecione o agente'}</option>
                                            {agents.map((a) => (
                                                <option key={a.id || a._id} value={a.id || a._id}>
                                                    {a.name || a.agentName || a.id}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        <Form.Text className="text-muted">O agente que conduzirá as conversas após o disparo.</Form.Text>
                                    </Form.Group>
                                </Card.Body>
                            </Card>
                        )}

                        {/* ── Step 2: Template ── */}
                        {step === 2 && (
                            <Card className="wc-card mb-4">
                                <Card.Body className="p-4">
                                    <h5 className="d-flex align-items-center gap-2 mb-1">
                                        <MessageCircle size={16} style={{ color: '#15a085' }} />
                                        Template WhatsApp
                                    </h5>
                                    <p className="text-muted mb-4">Template aprovado que será usado como base para as mensagens.</p>

                                    {/* Fixed template badge */}
                                    <div className="d-flex align-items-center justify-content-between p-3 rounded-3 mb-4"
                                        style={{ background: 'var(--bs-secondary-bg)', border: '1px solid var(--bs-border-color)' }}>
                                        <div>
                                            <div className="fw-semibold">{FIXED_TEMPLATE.label}</div>
                                            <div className="small text-muted font-monospace mt-1">{FIXED_TEMPLATE.name}</div>
                                        </div>
                                        <span style={{ fontSize: 11, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 999, padding: '2px 10px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                            ✓ Aprovado
                                        </span>
                                    </div>

                                    {/* Template preview */}
                                    <div className="mb-4">
                                        <div className="wc-review-title">Preview do Template</div>
                                        <div className="wc-tpl-preview">
                                            {'Olá, '}<span className="wc-tpl-var">{'{{lead_name}}'}</span>{'\n'}
                                            {'Tudo bem? 😊\n\n'}
                                            {'- '}<span className="wc-tpl-var">{'{{body_message}}'}</span>{'\n\n'}
                                            {'Vamos conversar?'}
                                        </div>
                                    </div>

                                    {/* Body message */}
                                    <Form.Group>
                                        <Form.Label className="fw-semibold">
                                            Mensagem da Campanha <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            placeholder="Ex: Vi que você demonstrou interesse em um dos nossos imóveis."
                                            value={bodyMessage}
                                            onChange={(e) => setBodyMessage(e.target.value)}
                                        />
                                        <Form.Text className="text-muted">
                                            Substituirá <code>{'{{body_message}}'}</code> no template. O nome do lead é preenchido automaticamente.
                                        </Form.Text>
                                    </Form.Group>
                                </Card.Body>
                            </Card>
                        )}

                        {/* ── Step 3: Público ── */}
                        {step === 3 && (
                            <>
                                <Card className="wc-card mb-4">
                                    <Card.Body className="p-4">
                                        <h5 className="d-flex align-items-center gap-2 mb-3">
                                            <Tag size={16} style={{ color: '#15a085' }} />
                                            Tags da Campanha
                                        </h5>
                                        <p className="text-muted mb-3">Adicione tags para organizar e filtrar suas campanhas.</p>
                                        <div className="d-flex flex-wrap gap-2 mb-3">
                                            <Form.Control
                                                type="text"
                                                style={{ maxWidth: 280 }}
                                                placeholder="Nome da tag..."
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateTag(); } }}
                                            />
                                            <Button variant="outline-secondary" className="wc-soft-btn d-inline-flex align-items-center gap-2" onClick={handleCreateTag}>
                                                <Plus size={14} /> Criar
                                            </Button>
                                        </div>
                                        <div className="d-flex flex-wrap gap-2 mb-3">
                                            {tagOptions.map((tag) => (
                                                <button key={tag} type="button" className={`wc-tag-chip ${selectedTags.includes(tag) ? 'selected' : ''}`} onClick={() => toggleTag(tag)}>
                                                    <Tag size={12} />{tag}
                                                </button>
                                            ))}
                                        </div>
                                        <small className="text-muted">{selectedTags.length} tag(s) selecionada(s)</small>
                                    </Card.Body>
                                </Card>

                                <Card className="wc-card mb-4">
                                    <Card.Body className="p-4">
                                        <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                                            <div>
                                                <h5 className="mb-1">Leads Vinculados</h5>
                                                <p className="text-muted mb-0">Escolha quais contatos receberão as mensagens.</p>
                                            </div>
                                            <Button variant="success" className="d-inline-flex align-items-center gap-2" onClick={() => { setLeadModalTab('list'); setShowLeadsModal(true); }}>
                                                <Plus size={14} /> Adicionar Leads
                                            </Button>
                                        </div>
                                        {linkedLeads.length === 0 ? (
                                            <div className="wc-empty-box">
                                                <div>
                                                    <Users size={42} className="text-muted mb-2" />
                                                    <div className="h5 fw-normal mb-1">Nenhum lead adicionado</div>
                                                    <div className="small text-muted">Clique em &quot;Adicionar Leads&quot; para selecionar contatos</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="table-responsive">
                                                <table className="table table-sm align-middle mb-0 wc-lead-table">
                                                    <thead><tr><th>Nome</th><th>Email</th><th>Telefone</th><th>Status</th></tr></thead>
                                                    <tbody>
                                                        {linkedLeads.map((lead) => (
                                                            <tr key={lead.id}>
                                                                <td>{lead.name}</td>
                                                                <td>{lead.email}</td>
                                                                <td>{lead.phone}</td>
                                                                <td><span className={`badge rounded-pill ${getLeadStatusClass(lead.status)}`}>{lead.status}</span></td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </>
                        )}

                        {/* ── Step 4: Revisar ── */}
                        {step === 4 && (
                            <>
                                <p className="text-muted mb-4">Revise os dados antes de salvar. Você pode voltar a qualquer etapa clicando no menu lateral.</p>
                                {saveError && (
                                    <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" role="alert">
                                        <span>{saveError}</span>
                                    </div>
                                )}

                                <Card className="wc-card mb-4">
                                    <Card.Body className="p-4">
                                        <div className="wc-review-title">Dados Básicos</div>
                                        <Row className="g-3">
                                            <Col md={6}><span className="text-muted">Nome:</span> <strong>{campaignName || '-'}</strong></Col>
                                            <Col md={6}><span className="text-muted">Agente:</span> <strong>{selectedAgent?.name || selectedAgent?.agentName || agentId || '-'}</strong></Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                <Card className="wc-card mb-4">
                                    <Card.Body className="p-4">
                                        <div className="wc-review-title">Template</div>
                                        <div className="d-flex align-items-center gap-2 mb-3">
                                            <span className="fw-medium">{FIXED_TEMPLATE.label}</span>
                                            <span style={{ fontSize: 11, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 999, padding: '1px 8px', fontWeight: 600 }}>✓ Aprovado</span>
                                        </div>
                                        <div className="text-muted small mb-1">Mensagem:</div>
                                        <div className="p-3 rounded-3 small" style={{ background: 'var(--bs-secondary-bg)', border: '1px solid var(--bs-border-color)', whiteSpace: 'pre-wrap' }}>
                                            {bodyMessage || <em className="text-muted">–</em>}
                                        </div>
                                    </Card.Body>
                                </Card>

                                <Card className="wc-card mb-4">
                                    <Card.Body className="p-4">
                                        <div className="wc-review-title">Público</div>
                                        <Row className="g-3">
                                            <Col md={6}><span className="text-muted">Tags:</span> {selectedTags.length ? selectedTags.join(', ') : '-'}</Col>
                                            <Col md={6}><span className="text-muted">Leads:</span> <strong>{linkedLeads.length} lead(s)</strong></Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            </>
                        )}

                        <hr className="my-4" />

                        <div className="d-flex justify-content-between align-items-center">
                            <Button variant="outline-secondary" className="wc-soft-btn d-inline-flex align-items-center gap-2" onClick={goBack}>
                                <ArrowLeft size={15} />
                                {step === 1 ? 'Cancelar' : 'Voltar'}
                            </Button>
                            {step < totalSteps ? (
                                <Button variant="success" className="px-4 d-inline-flex align-items-center gap-2" onClick={goNext}>
                                    Próximo Passo <ChevronRight size={16} />
                                </Button>
                            ) : (
                                <Button variant="success" className="px-4 d-inline-flex align-items-center gap-2" onClick={handleSaveCampaign} disabled={saving}>
                                    {saving ? (
                                        <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" /> Salvando...</>
                                    ) : (
                                        <><Save size={15} /> Salvar Campanha</>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Leads Modal */}
            <Modal show={showLeadsModal} onHide={() => setShowLeadsModal(false)} centered size="lg">
                <Modal.Header className="border-0 pb-4">
                    <Modal.Title>Adicionar Leads à Campanha</Modal.Title>
                    <Button variant="link" className="p-3 text-muted" onClick={() => setShowLeadsModal(false)}>
                        <X size={20} className="position-absolute top-0 end-0 m-4" />
                    </Button>
                </Modal.Header>
                <Modal.Body className="pt-1">
                    <div className="d-flex gap-2 mb-3 wc-modal-segmented">
                        <Button type="button" className={`wc-modal-tab flex-grow-1 d-inline-flex align-items-center justify-content-center gap-2 ${leadModalTab === 'list' ? 'active' : ''}`} onClick={() => setLeadModalTab('list')}>
                            <Search size={14} /> Selecionar da Lista
                        </Button>
                        <Button type="button" className={`wc-modal-tab flex-grow-1 d-inline-flex align-items-center justify-content-center gap-2 ${leadModalTab === 'import' ? 'active' : ''}`} onClick={() => setLeadModalTab('import')}>
                            <Upload size={14} /> Importar CSV/Excel
                        </Button>
                    </div>

                    {leadModalTab === 'list' && (
                        <>
                            <div className="position-relative mb-3">
                                <Form.Control type="text" placeholder="Buscar por nome, telefone ou email..." value={leadSearch} onChange={(e) => setLeadSearch(e.target.value)} className="ps-5" />
                                <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                            </div>
                            <p className="text-muted mb-2">Selecione os leads que deseja adicionar à campanha:</p>
                            <div className="table-responsive border rounded-3">
                                <table className="table align-middle mb-0 wc-lead-table">
                                    <thead><tr><th style={{ width: 44 }} /><th>NOME</th><th>EMAIL</th><th>TELEFONE</th><th>STATUS</th></tr></thead>
                                    <tbody>
                                        {loadingLeads && <tr><td colSpan={5} className="text-center py-4 text-muted">Carregando leads...</td></tr>}
                                        {!loadingLeads && filteredLeads.length === 0 && <tr><td colSpan={5} className="text-center py-4 text-muted">Nenhum lead encontrado.</td></tr>}
                                        {!loadingLeads && paginatedLeads.map((lead) => (
                                            <tr key={lead.id}>
                                                <td><Form.Check type="checkbox" checked={selectedLeadIds.includes(lead.id)} onChange={() => toggleLead(lead.id)} /></td>
                                                <td>{lead.name}</td><td>{lead.email}</td><td>{lead.phone}</td>
                                                <td><span className={`badge rounded-pill ${getLeadStatusClass(lead.status)}`}>{lead.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {!loadingLeads && filteredLeads.length > LEADS_PAGE_SIZE && (
                                <div className="d-flex justify-content-end align-items-center gap-2 mt-3">
                                    <Button variant="outline-secondary" className="wc-soft-btn px-2 py-1" onClick={() => setLeadModalPage((p) => Math.max(1, p - 1))} disabled={leadModalPage === 1}>‹</Button>
                                    <small className="text-muted">Página {leadModalPage} de {totalLeadPages}</small>
                                    <Button variant="outline-secondary" className="wc-soft-btn px-2 py-1" onClick={() => setLeadModalPage((p) => Math.min(totalLeadPages, p + 1))} disabled={leadModalPage === totalLeadPages}>›</Button>
                                </div>
                            )}
                        </>
                    )}

                    {leadModalTab === 'import' && (
                        <>
                            <div className="wc-dropzone mb-3">
                                <div>
                                    <Upload size={40} className="text-muted mb-2" />
                                    <div className="h5 fw-normal mb-1">Arraste seu arquivo aqui</div>
                                    <div className="text-muted mb-3">ou clique para selecionar (CSV, XLS, XLSX)</div>
                                    <Form.Control id="campaign-leads-import-file" type="file" accept=".csv,.xls,.xlsx" className="d-none" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
                                    <Button variant="outline-secondary" className="wc-soft-btn d-inline-flex align-items-center gap-2" onClick={() => document.getElementById('campaign-leads-import-file')?.click()}>
                                        <Upload size={14} /> Selecionar Arquivo
                                    </Button>
                                    {importFile && <div className="small text-muted mt-2">{importFile.name}</div>}
                                </div>
                            </div>
                            <div className="fw-semibold mb-2">Formato esperado:</div>
                            <div className="wc-file-sample">nome,email,telefone,status{'\n'}João Silva,joao@email.com,+5521999887766,New</div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 pt-2">
                    <Button variant="outline-secondary" className="wc-soft-btn" onClick={() => setShowLeadsModal(false)}>Cancelar</Button>
                    {leadModalTab === 'list' ? (
                        <Button variant="success" className="d-inline-flex align-items-center gap-2" onClick={() => setShowLeadsModal(false)}>
                            <Plus size={14} /> Adicionar
                        </Button>
                    ) : (
                        <Button variant="success" className="d-inline-flex align-items-center gap-2" disabled={!importFile}>
                            <Upload size={14} /> Importar
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default CreateCampaignWhatsAppBody;
