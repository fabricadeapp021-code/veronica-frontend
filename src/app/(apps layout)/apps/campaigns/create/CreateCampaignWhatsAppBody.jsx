'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Col, Dropdown, Form, Modal, ProgressBar, Row } from 'react-bootstrap';
import {
    ArrowLeft,
    Check,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    Clock,
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
import { createCampaign, addLeadsToCampaign } from '@/lib/api/services/campaigns';
import { showCustomAlert } from '@/components/CustomAlert';
import { useAuth } from '@/lib/auth/AuthProvider';

const CAMPAIGN_KIND_OPTIONS = [
    'Pesquisa',
    'Informativa',
    'Mobilização',
    'Convite para Evento',
    'Lembrete',
    'Outro',
];

// id = nome exato do template no Meta Business Manager
// approved = true → já aprovado e ativo; false → em análise, pode selecionar mas exibe aviso
const WHATSAPP_TEMPLATE_OPTIONS = [
    {
        id: 'campanha_inicial|pt_BR',
        label: 'Campanha Inicial',
        description: 'Template genérico de abertura de conversa. Personalizado pela IA.',
        approved: true,
    },
    {
        id: 'convite_para_evento|pt_BR',
        label: 'Convite para Evento',
        description: 'Convite personalizado para evento político ou comunitário.',
        approved: false,
    },
    {
        id: 'lembrete_de_votacao|pt_BR',
        label: 'Lembrete de Votação',
        description: 'Lembrete de data, local e horário de votação.',
        approved: false,
    },
    {
        id: 'pesquisa_de_opiniao|pt_BR',
        label: 'Pesquisa de Opinião',
        description: 'Abertura de conversa para coleta de intenção de voto.',
        approved: false,
    },
];
const STEPS = [
    { key: 'basic', title: 'Dados Básicos', subtitle: 'Nome e tipo da campanha', icon: PenTool },
    { key: 'template', title: 'Template', subtitle: 'Template de mensagem WhatsApp', icon: MessageCircle },
    { key: 'config', title: 'Configurações', subtitle: 'Horários e automações', icon: Clock },
    { key: 'audience', title: 'Público', subtitle: 'Tags, segmentação e leads', icon: User },
    { key: 'review', title: 'Revisar', subtitle: 'Confirmar e salvar', icon: Check },
];

const INITIAL_TAG_OPTIONS = ['Zona Sul', 'Zona Norte', 'Zona Oeste', 'Prioridade', 'WhatsApp', 'Voz'];
const INITIAL_SELECTED_TAGS = ['WhatsApp'];
const LEADS_PAGE_SIZE = 5;
const CreateCampaignWhatsAppBody = () => {
    const router = useRouter();
    const { status } = useAuth();

    const [step, setStep] = useState(1);
    const [campaignName, setCampaignName] = useState('');
    const [campaignKind, setCampaignKind] = useState('Pesquisa');
    const [whatsAppTemplate, setWhatsAppTemplate] = useState('campanha_inicial|pt_BR');
    const [triggerDate, setTriggerDate] = useState('');
    const [tagOptions, setTagOptions] = useState(INITIAL_TAG_OPTIONS);
    const [selectedTags, setSelectedTags] = useState(INITIAL_SELECTED_TAGS);
    const [tagInput, setTagInput] = useState('');
    const [showLeadsModal, setShowLeadsModal] = useState(false);
    const [leadSearch, setLeadSearch] = useState('');
    const [selectedLeadIds, setSelectedLeadIds] = useState([]);
    const [leadOptions, setLeadOptions] = useState([]);
    const [loadingLeads, setLoadingLeads] = useState(false);
    const [leadModalTab, setLeadModalTab] = useState('import');
    const [leadModalPage, setLeadModalPage] = useState(1);
    const [importFile, setImportFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);

    const totalSteps = STEPS.length;
    const progressPercent = useMemo(() => Math.floor(((step - 1) / (totalSteps - 1)) * 100), [step, totalSteps]);
    const linkedLeads = useMemo(() => leadOptions.filter((lead) => selectedLeadIds.includes(lead.id)), [leadOptions, selectedLeadIds]);
    const filteredLeads = useMemo(() => {
        const term = leadSearch.trim().toLowerCase();
        if (!term) return leadOptions;
        return leadOptions.filter((lead) => [lead.name, lead.email, lead.phone].join(' ').toLowerCase().includes(term));
    }, [leadOptions, leadSearch]);
    const totalLeadPages = useMemo(
        () => Math.max(1, Math.ceil(filteredLeads.length / LEADS_PAGE_SIZE)),
        [filteredLeads.length]
    );
    const paginatedLeads = useMemo(() => {
        const start = (leadModalPage - 1) * LEADS_PAGE_SIZE;
        return filteredLeads.slice(start, start + LEADS_PAGE_SIZE);
    }, [filteredLeads, leadModalPage]);
    const reviewDateLabel = useMemo(() => {
        if (!triggerDate) return 'Imediato';
        try {
            return new Date(triggerDate).toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
            });
        } catch {
            return triggerDate;
        }
    }, [triggerDate]);

    const loadLeads = async () => {
        try {
            setLoadingLeads(true);
            let response = await listLeads({ maxSize: 1000 });
            if (!response?.success) {
                response = await listLeads();
            }

            if (response?.success && Array.isArray(response.data)) {
                const formattedLeads = response.data.map((lead) => ({
                    id: String(lead.id),
                    name: lead.name || '-',
                    email: lead.emailAddress || '-',
                    phone: lead.phoneNumber || '-',
                    status: String(lead.status || 'New'),
                }));
                setLeadOptions(formattedLeads);
            } else {
                setLeadOptions([]);
            }
        } catch (error) {
            console.error('Erro ao carregar leads para campanha:', error);
            setLeadOptions([]);
        } finally {
            setLoadingLeads(false);
        }
    };

    const toggleTag = (tag) => {
        setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]));
    };

    const handleCreateTag = () => {
        const normalized = tagInput.trim();
        if (!normalized) return;
        if (!tagOptions.includes(normalized)) {
            setTagOptions((prev) => [...prev, normalized]);
        }
        setSelectedTags((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
        setTagInput('');
    };

    const toggleLead = (leadId) => {
        setSelectedLeadIds((prev) => (prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]));
    };

    const getLeadStatusClass = (statusValue) => {
        const normalized = String(statusValue || '').trim().toLowerCase();
        if (normalized === 'new' || normalized === 'novo') return 'bg-success-subtle text-success border border-success-subtle';
        if (normalized === 'qualified' || normalized === 'engajado' || normalized === 'prioritario') return 'bg-primary-subtle text-primary border border-primary-subtle';
        return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
    };

    const handleOpenLeadsModal = () => {
        setLeadModalTab('list');
        setShowLeadsModal(true);
    };

    useEffect(() => {
        if (status === 'authenticated') {
            loadLeads();
        }
        if (status === 'guest') {
            setLeadOptions([]);
        }
    }, [status]);

    useEffect(() => {
        if (showLeadsModal && status === 'authenticated') {
            loadLeads();
        }
    }, [showLeadsModal, status]);

    useEffect(() => {
        setLeadModalPage(1);
    }, [showLeadsModal, leadSearch, leadModalTab]);

    useEffect(() => {
        if (leadModalPage > totalLeadPages) {
            setLeadModalPage(totalLeadPages);
        }
    }, [leadModalPage, totalLeadPages]);

    const goNext = () => {
        if (step < 5) setStep((prev) => prev + 1);
    };

    const goBack = () => {
        if (step > 1) {
            setStep((prev) => prev - 1);
            return;
        }
        router.push('/apps/campaigns/list');
    };

    const handleSaveCampaign = async () => {
        if (!campaignName.trim()) {
            setStep(1);
            setSaveError('O nome da campanha é obrigatório.');
            return;
        }

        setSaving(true);
        setSaveError(null);
        let createdId = null;

        try {
            const payload = {
                name: campaignName.trim(),
                prompt: campaignName.trim(),
                campaignType: 'whatsapp',
                metadata: {
                    campaignKind,
                    whatsAppTemplate: whatsAppTemplate || null,
                    triggerDate: triggerDate || null,
                    tags: selectedTags,
                },
            };

            const response = await createCampaign(payload);

            if (response?.success === false) {
                throw new Error(response?.message || 'Erro ao criar campanha');
            }

            createdId = response?.data?.id || null;

            if (createdId && selectedLeadIds.length > 0) {
                const leadsRes = await addLeadsToCampaign(createdId, selectedLeadIds);
                if (!leadsRes?.success) {
                    throw new Error('Campanha criada, mas houve erro ao vincular os leads.');
                }
            }

            await showCustomAlert({
                variant: 'success',
                title: 'Campanha criada!',
                text: `"${campaignName}" foi salva com sucesso.`,
            });
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

    return (
        <div className="contact-body contact-detail-body">
            <style>{`
                .voice-create-step-item {
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
                }
                .voice-create-step-item.active {
                    background: #dff4ef;
                    border-color: #93ddd0;
                    opacity: 1;
                }
                .voice-create-step-item.completed {
                    opacity: 1;
                }
                .voice-create-step-icon {
                    width: 28px;
                    height: 28px;
                    border-radius: 999px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: #ffffff;
                    border: 1px solid #d8dee9;
                    flex-shrink: 0;
                }
                .voice-create-step-item.active .voice-create-step-icon {
                    background: #15a085;
                    border-color: #15a085;
                    color: #ffffff;
                }
                .voice-create-step-item.completed .voice-create-step-icon {
                    background: #dff4ef;
                    border-color: #93ddd0;
                    color: #15a085;
                }
                .voice-create-card {
                    border: 1px solid #d8dee9;
                    border-radius: 14px;
                    box-shadow: 0 2px 10px rgba(15, 23, 42, .03);
                }
                .voice-create-soft-btn {
                    background: #ffffff !important;
                    border: 1px solid #d8dee9 !important;
                    color: #0f172a !important;
                    box-shadow: none !important;
                }
                .voice-create-soft-btn:hover,
                .voice-create-soft-btn:focus,
                .voice-create-soft-btn:active,
                .voice-create-soft-btn.show {
                    background: #ffffff !important;
                    border-color: #c9d2df !important;
                    color: #0f172a !important;
                    box-shadow: none !important;
                }
                .voice-create-back-btn {
                    width: 36px;
                    height: 36px;
                    padding: 0 !important;
                    border-radius: 8px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: #ffffff !important;
                    border: 1px solid #d8dee9 !important;
                    color: #0f172a !important;
                    box-shadow: none !important;
                }
                .voice-create-back-btn:hover,
                .voice-create-back-btn:focus,
                .voice-create-back-btn:active {
                    background: #f8fafc !important;
                    border-color: #c9d2df !important;
                    color: #0f172a !important;
                    box-shadow: none !important;
                }
                .voice-create-title-badge {
                    background: #e6e9ff;
                    color: #3f3fd8;
                    border: 1px solid #cfd5ff;
                    border-radius: 999px;
                    padding: 6px 14px;
                    font-weight: 600;
                    font-size: 14px;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }
                .voice-create-layout {
                    min-height: calc(100vh - 160px);
                }
                .voice-create-select-btn {
                    min-height: 40px !important;
                    border-radius: 8px !important;
                    text-align: left !important;
                    padding: 8px 38px 8px 12px !important;
                    position: relative !important;
                    font-size: 16px !important;
                    line-height: 1.4 !important;
                }
                .voice-create-select-btn .voice-create-select-text {
                    display: block;
                    text-align: left !important;
                }
                .voice-create-select-btn .voice-create-select-icon {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    pointer-events: none;
                }
                .voice-create-script-box {
                    min-height: 280px;
                    resize: vertical;
                }
                .voice-create-tag-chip {
                    border-radius: 999px;
                    border: 1px solid #d8dee9;
                    background: #f8fafc;
                    color: #475467;
                    padding: 6px 12px;
                    font-size: 14px;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                }
                .voice-create-tag-chip.selected {
                    background: #15a085;
                    border-color: #15a085;
                    color: #ffffff;
                }
                .voice-create-empty-box {
                    min-height: 190px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    color: #667085;
                }
                .voice-create-lead-table td,
                .voice-create-lead-table th {
                    vertical-align: middle;
                }
                .voice-create-modal-tab {
                    border: 1px solid transparent !important;
                    background: transparent !important;
                    color: #667085 !important;
                    min-height: 42px;
                    border-radius: 10px !important;
                }
                .voice-create-modal-tab.active {
                    background: #ffffff !important;
                    border-color: #15a085 !important;
                    color: #111827 !important;
                    box-shadow: none !important;
                }
                .voice-create-modal-segmented {
                    border: 1px solid #eaecf0;
                    background: #f8fafc;
                    border-radius: 12px;
                    padding: 6px;
                }
                .voice-create-import-dropzone {
                    border: 2px dashed #d0d5dd;
                    border-radius: 14px;
                    min-height: 210px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 16px;
                    background: #f8fafc;
                }
                .voice-create-file-sample {
                    background: #f8fafc;
                    border: 1px solid #eaecf0;
                    border-radius: 10px;
                    padding: 14px;
                    color: #667085;
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
                    font-size: 14px;
                    white-space: pre-line;
                }
                .voice-create-import-btn {
                    background: #9ddfce !important;
                    border-color: #9ddfce !important;
                    color: #ffffff !important;
                }
                .voice-create-import-btn:hover,
                .voice-create-import-btn:focus,
                .voice-create-import-btn:active {
                    background: #7fd1bc !important;
                    border-color: #7fd1bc !important;
                    color: #ffffff !important;
                }
                .voice-create-review-title {
                    color: #667085;
                    letter-spacing: .06em;
                    font-size: 12px;
                    font-weight: 700;
                    text-transform: uppercase;
                    margin-bottom: 10px;
                }
                .voice-create-review-script {
                    background: #f8fafc;
                    border: 1px solid #eaecf0;
                    border-radius: 10px;
                    padding: 12px;
                    max-height: 160px;
                    overflow: auto;
                    white-space: pre-wrap;
                }
                .voice-create-rule-chip {
                    background: #f2f4f7;
                    border: 1px solid #eaecf0;
                    color: #344054;
                    border-radius: 999px;
                    padding: 4px 10px;
                    font-size: 12px;
                    font-weight: 600;
                }
            `}</style>

            <Row className="g-0 voice-create-layout">
                <Col xl={2} lg={3} className="border-end bg-white px-3 py-3">
                    <div className="text-uppercase text-muted small fw-semibold mb-3">Etapas</div>
                    <div className="d-flex flex-column gap-2">
                        {STEPS.map((item, index) => {
                            const Icon = item.icon;
                            const stepNumber = index + 1;
                            const isActive = stepNumber === step;
                            const isCompleted = stepNumber < step;

                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setStep(stepNumber)}
                                    className={`voice-create-step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                                >
                                    <span className="voice-create-step-icon">
                                        {isCompleted ? <CheckCircle size={14} /> : <Icon size={14} />}
                                    </span>
                                    <div>
                                        <div className="fw-semibold">{item.title}</div>
                                        <div className="small text-muted">{item.subtitle}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </Col>

                <Col xl={10} lg={9} className="px-4 py-4">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                        <div className="d-flex align-items-center gap-3">
                            <Button variant="outline-secondary" className="voice-create-back-btn" onClick={goBack}>
                                <ArrowLeft size={18} />
                            </Button>
                            <h1 className="h3 mb-0">Nova Campanha WhatsApp</h1>
                            <span className="voice-create-title-badge bg-success-subtle text-success">
                                <MessageCircle size={14} />
                                Campanha WhatsApp
                            </span>
                        </div>
                        <Button variant="outline-secondary" className="voice-create-soft-btn" onClick={() => router.push('/apps/campaigns/list')}>
                            Cancelar
                        </Button>
                    </div>

                    <div className="d-flex flex-wrap justify-content-center justify-content-xl-end align-items-center gap-3 mb-2">
                        <div className="d-flex align-items-center gap-1 small text-muted">
                            <LinkIcon size={13} style={{ color: '#f59e0b' }} />
                            <span>Créditos Restantes:</span>
                            <strong className="text-dark">1.000</strong>
                        </div>
                        <div className="small text-muted">Totais: <strong className="text-dark">5.000</strong></div>
                        <div className="rounded-pill" style={{ width: 56, height: 6, background: '#eceff3' }}>
                            <div className="rounded-pill" style={{ width: '80%', height: '100%', background: '#f59e0b' }} />
                        </div>
                        <Button variant="outline-secondary" className="voice-create-soft-btn d-inline-flex align-items-center gap-1">
                            <ShoppingCart size={14} />
                            Comprar Créditos
                        </Button>
                    </div>

                    <div style={{ maxWidth: 640, margin: '0 auto' }}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="fw-semibold">Passo {step} de {totalSteps}</div>
                            <small className="text-muted">{progressPercent}% concluído</small>
                        </div>
                        <ProgressBar now={progressPercent} className="mb-4" style={{ height: 7 }} />

                        <h2 className="mb-1">
                            {step === 1 ? 'Dados Básicos' : step === 2 ? 'Template' : step === 3 ? 'Configurações' : step === 4 ? 'Público' : 'Revisar'}
                        </h2>
                        <p className="text-muted mb-4">
                            {step === 1 ? 'Nome e tipo da campanha' : step === 2 ? 'Template de mensagem WhatsApp' : step === 3 ? 'Horários e automações' : step === 4 ? 'Tags, segmentação e leads' : 'Confirmação final'}
                        </p>

                        {step === 1 && (
                            <Card className="voice-create-card mb-4">
                                <Card.Body className="p-4">
                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-semibold">Nome da Campanha *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Ex: Pesquisa Zona Norte"
                                            value={campaignName}
                                            onChange={(e) => setCampaignName(e.target.value)}
                                        />
                                        <Form.Text className="text-muted">
                                            Escolha um nome descritivo para identificar esta campanha.
                                        </Form.Text>
                                    </Form.Group>

                                    <Form.Group>
                                        <Form.Label className="fw-semibold">Tipo de Campanha</Form.Label>
                                        <Dropdown>
                                            <Dropdown.Toggle as="button" type="button" className="btn w-100 voice-create-soft-btn voice-create-select-btn no-caret">
                                                <span className="voice-create-select-text">{campaignKind}</span>
                                                <ChevronDown size={16} className="voice-create-select-icon" />
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu className="w-100">
                                                {CAMPAIGN_KIND_OPTIONS.map((item) => (
                                                    <Dropdown.Item
                                                        key={item}
                                                        active={campaignKind === item}
                                                        onClick={() => setCampaignKind(item)}
                                                        className="d-flex align-items-center gap-2"
                                                    >
                                                        {campaignKind === item ? <Check size={14} /> : <span style={{ width: 14 }} />}
                                                        {item}
                                                    </Dropdown.Item>
                                                ))}
                                            </Dropdown.Menu>
                                        </Dropdown>
                                        <Form.Text className="text-muted">
                                            O tipo influencia como a IA gerará o script da mensagem.
                                        </Form.Text>
                                    </Form.Group>
                                </Card.Body>
                            </Card>
                        )}

                                                {step === 2 && (
                            <>
                                <Card className="voice-create-card mb-4">
                                    <Card.Body className="p-4">
                                        <h5 className="d-flex align-items-center gap-2 mb-3">
                                            <MessageCircle size={16} style={{ color: '#15a085' }} />
                                            Template WhatsApp
                                        </h5>
                                        <p className="text-muted mb-4">Selecione o template aprovado que ser? usado como base para as mensagens.</p>

                                        <Form.Group>
                                            <Form.Label className="fw-semibold">Template</Form.Label>
                                            <Dropdown>
                                                <Dropdown.Toggle as="button" type="button" className="btn w-100 voice-create-soft-btn voice-create-select-btn no-caret">
                                                    <span className="voice-create-select-text">
                                                        {(() => {
                                                            const t = WHATSAPP_TEMPLATE_OPTIONS.find(o => o.id === whatsAppTemplate);
                                                            return t ? t.label : 'Selecione o template';
                                                        })()}
                                                    </span>
                                                    <ChevronDown size={16} className="voice-create-select-icon" />
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu className="w-100">
                                                    {WHATSAPP_TEMPLATE_OPTIONS.map((tpl) => (
                                                        <Dropdown.Item
                                                            key={tpl.id}
                                                            active={whatsAppTemplate === tpl.id}
                                                            onClick={() => setWhatsAppTemplate(tpl.id)}
                                                            className="d-flex align-items-start gap-2 py-2"
                                                        >
                                                            <span style={{ marginTop: 2, flexShrink: 0, width: 14 }}>
                                                                {whatsAppTemplate === tpl.id ? <Check size={14} /> : null}
                                                            </span>
                                                            <div style={{ flex: 1 }}>
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <span className="fw-medium">{tpl.label}</span>
                                                                    {tpl.approved ? (
                                                                        <span style={{ fontSize: 11, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 999, padding: '1px 8px', fontWeight: 600 }}>
                                                                            ✓ Aprovado
                                                                        </span>
                                                                    ) : (
                                                                        <span style={{ fontSize: 11, background: '#fefce8', color: '#92400e', border: '1px solid #fde68a', borderRadius: 999, padding: '1px 8px', fontWeight: 600 }}>
                                                                            ⚠️ Em análise
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{tpl.description}</div>
                                                            </div>
                                                        </Dropdown.Item>
                                                    ))}
                                                </Dropdown.Menu>
                                            </Dropdown>
                                            {whatsAppTemplate && !WHATSAPP_TEMPLATE_OPTIONS.find(t => t.id === whatsAppTemplate)?.approved && (
                                                <div style={{ marginTop: 8, padding: '8px 12px', background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
                                                    ⚠️ Este template ainda está em análise pela Meta. O disparo só funcionará após aprovação.
                                                </div>
                                            )}
                                            <Form.Text className="text-muted">
                                                Somente templates aprovados pela Meta podem ser usados em disparos em massa.
                                            </Form.Text>
                                        </Form.Group>
                                    </Card.Body>
                                </Card>
                            </>
                        )}

                        {step === 3 && (
                            <>
                                <Card className="voice-create-card mb-4">
                                    <Card.Body className="p-4">
                                        <h5 className="d-flex align-items-center gap-2 mb-3">
                                            <Clock size={16} style={{ color: '#15a085' }} />
                                            Data e Horário das Mensagens
                                        </h5>
                                        <p className="text-muted mb-4">
                                            Deixe a data em branco para disparar imediatamente ao clicar em &ldquo;Iniciar&rdquo;.
                                            Se preencher uma data futura, o disparo será agendado automaticamente para aquele momento.
                                        </p>

                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-semibold">Data e Hora do Disparo</Form.Label>
                                            <Form.Control
                                                type="datetime-local"
                                                value={triggerDate}
                                                onChange={(e) => setTriggerDate(e.target.value)}
                                            />
                                            <Form.Text className="text-muted">Deixe em branco para disparar imediatamente ao clicar em &ldquo;Iniciar&rdquo;.</Form.Text>
                                        </Form.Group>

                                    </Card.Body>
                                </Card>

                            </>
                        )}

                        {step === 4 && (
                            <>
                                <Card className="voice-create-card mb-4">
                                    <Card.Body className="p-4">
                                        <h5 className="d-flex align-items-center gap-2 mb-3">
                                            <Tag size={16} style={{ color: '#15a085' }} />
                                            Tags da Campanha
                                        </h5>
                                        <p className="text-muted mb-3">Adicione tags para organizar e filtrar suas campanhas.</p>

                                        <div className="d-flex flex-wrap gap-2 mb-3">
                                            <Form.Control
                                                type="text"
                                                style={{ maxWidth: 320 }}
                                                placeholder="Nome da tag..."
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleCreateTag();
                                                    }
                                                }}
                                            />
                                            <Button variant="outline-secondary" className="voice-create-soft-btn d-inline-flex align-items-center gap-2" onClick={handleCreateTag}>
                                                <Plus size={14} />
                                                Criar
                                            </Button>
                                        </div>

                                        <div className="d-flex flex-wrap gap-2 mb-3">
                                            {tagOptions.map((tag) => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    className={`voice-create-tag-chip ${selectedTags.includes(tag) ? 'selected' : ''}`}
                                                    onClick={() => toggleTag(tag)}
                                                >
                                                    <Tag size={12} />
                                                    {tag}
                                                </button>
                                            ))}
                                        </div>

                                        <small className="text-muted">{selectedTags.length} tag(s) selecionada(s)</small>
                                    </Card.Body>
                                </Card>

                                <Card className="voice-create-card mb-4">
                                    <Card.Body className="p-4">
                                        <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                                            <div>
                                                <h5 className="mb-1">Leads Vinculados</h5>
                                                <p className="text-muted mb-0">Escolha quais contatos receberão as mensagens.</p>
                                            </div>
                                            <Button variant="success" className="d-inline-flex align-items-center gap-2" onClick={handleOpenLeadsModal}>
                                                <Plus size={14} />
                                                Adicionar Leads
                                            </Button>
                                        </div>

                                        {linkedLeads.length === 0 ? (
                                            <div className="voice-create-empty-box">
                                                <div>
                                                    <Users size={42} className="text-muted mb-2" />
                                                    <div className="h5 fw-normal mb-1">Nenhum lead adicionado</div>
                                                    <div className="small text-muted">Clique em &quot;Adicionar Leads&quot; para selecionar contatos</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="table-responsive">
                                                <table className="table table-sm align-middle mb-0 voice-create-lead-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Nome</th>
                                                            <th>Email</th>
                                                            <th>Telefone</th>
                                                            <th>Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {linkedLeads.map((lead) => (
                                                            <tr key={lead.id}>
                                                                <td>{lead.name}</td>
                                                                <td>{lead.email}</td>
                                                                <td>{lead.phone}</td>
                                                                <td>
                                                                    <span className={`badge rounded-pill ${getLeadStatusClass(lead.status)}`}>{lead.status}</span>
                                                                </td>
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

                        {step === 5 && (
                            <>
                                <p className="text-muted mb-4">Revise os dados antes de salvar. Você pode voltar a qualquer etapa clicando no menu lateral.</p>
                                {saveError && (
                                    <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" role="alert">
                                        <span>{saveError}</span>
                                    </div>
                                )}

                                <Card className="voice-create-card mb-4">
                                    <Card.Body className="p-4">
                                        <div className="voice-create-review-title">Dados Básicos</div>
                                        <Row className="g-3">
                                            <Col md={6}><span className="text-muted">Nome:</span> {campaignName || '-'}</Col>
                                            <Col md={6}><span className="text-muted">Tipo:</span> {campaignKind}</Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                                                <Card className="voice-create-card mb-4">
                                    <Card.Body className="p-4">
                                        <div className="voice-create-review-title">Template</div>
                                        <Row className="g-3">
                                            <Col md={12}>
                                                <span className="text-muted">Template selecionado:</span>{' '}
                                                {(() => {
                                                    const t = WHATSAPP_TEMPLATE_OPTIONS.find(o => o.id === whatsAppTemplate);
                                                    if (!t) return '-';
                                                    return (
                                                        <span className="d-inline-flex align-items-center gap-2">
                                                            {t.label}
                                                            {t.approved ? (
                                                                <span style={{ fontSize: 11, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 999, padding: '1px 8px', fontWeight: 600 }}>✓ Aprovado</span>
                                                            ) : (
                                                                <span style={{ fontSize: 11, background: '#fefce8', color: '#92400e', border: '1px solid #fde68a', borderRadius: 999, padding: '1px 8px', fontWeight: 600 }}>⚠️ Em análise</span>
                                                            )}
                                                        </span>
                                                    );
                                                })()}
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                <Card className="voice-create-card mb-4">
                                    <Card.Body className="p-4">
                                        <div className="voice-create-review-title">Configurações</div>
                                        <Row className="g-3">
                                            <Col md={12}>
                                                <span className="text-muted">Disparo:</span>{' '}
                                                {triggerDate ? (
                                                    <span className="d-inline-flex align-items-center gap-2">
                                                        <strong>{reviewDateLabel}</strong>
                                                        <span style={{ fontSize: 11, background: '#fef9c3', color: '#92400e', border: '1px solid #fde68a', borderRadius: 999, padding: '2px 8px', fontWeight: 600 }}>
                                                            ⏰ Agendado
                                                        </span>
                                                    </span>
                                                ) : (
                                                    <span className="d-inline-flex align-items-center gap-2">
                                                        <strong>Imediato</strong>
                                                        <span style={{ fontSize: 11, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 999, padding: '2px 8px', fontWeight: 600 }}>
                                                            ⚡ Ao iniciar
                                                        </span>
                                                    </span>
                                                )}
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                <Card className="voice-create-card mb-4">
                                    <Card.Body className="p-4">
                                        <div className="voice-create-review-title">Público</div>
                                        <Row className="g-3">
                                            <Col md={6}><span className="text-muted">Tags:</span> {selectedTags.length ? selectedTags.join(', ') : '-'}</Col>
                                            <Col md={6}><span className="text-muted">Leads:</span> {linkedLeads.length} lead(s)</Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            </>
                        )}
                        <hr className="my-4" />

                        <div className="d-flex justify-content-between align-items-center">
                            <Button variant="outline-secondary" className="voice-create-soft-btn d-inline-flex align-items-center gap-2" onClick={goBack}>
                                <ArrowLeft size={15} />
                                {step === 1 ? 'Cancelar' : 'Voltar'}
                            </Button>
                            {step < 5 ? (
                                <Button variant="success" className="px-4 d-inline-flex align-items-center gap-2" onClick={goNext}>
                                    Próximo passo
                                    <ChevronRight size={16} />
                                </Button>
                            ) : (
                                <Button variant="success" className="px-4 d-inline-flex align-items-center gap-2" onClick={handleSaveCampaign} disabled={saving}>
                                    {saving ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={15} />
                                            Salvar Campanha
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </Col>
            </Row>

            <Modal show={showLeadsModal} onHide={() => setShowLeadsModal(false)} centered size="lg">
                <Modal.Header className="border-0 pb-4">
                    <Modal.Title>Adicionar Leads à Campanha</Modal.Title>
                    <Button variant="link" className="p-3 text-muted" onClick={() => setShowLeadsModal(false)}>
                        <X size={20} className="position-absolute top-0 end-0 m-4" />
                    </Button>
                </Modal.Header>
                <Modal.Body className="pt-1">
                    <div className="d-flex gap-2 mb-3 voice-create-modal-segmented">
                        <Button
                            type="button"
                            className={`voice-create-modal-tab flex-grow-1 d-inline-flex align-items-center justify-content-center gap-2 ${leadModalTab === 'list' ? 'active' : ''}`}
                            onClick={() => setLeadModalTab('list')}
                        >
                            <Search size={14} />
                            Selecionar da Lista
                        </Button>
                        <Button
                            type="button"
                            className={`voice-create-modal-tab flex-grow-1 d-inline-flex align-items-center justify-content-center gap-2 ${leadModalTab === 'import' ? 'active' : ''}`}
                            onClick={() => setLeadModalTab('import')}
                        >
                            <Upload size={14} />
                            Importar CSV/Excel
                        </Button>
                    </div>

                    {leadModalTab === 'list' && (
                        <>
                            <div className="position-relative mb-3">
                                <Form.Control
                                    type="text"
                                    placeholder="Buscar por nome, telefone ou email..."
                                    value={leadSearch}
                                    onChange={(e) => setLeadSearch(e.target.value)}
                                    className="ps-5"
                                />
                                <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                            </div>

                            <p className="text-muted mb-2">Selecione os leads que deseja adicionar à campanha:</p>
                            <div className="table-responsive border rounded-3">
                                <table className="table align-middle mb-0 voice-create-lead-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 44 }} />
                                            <th>NOME</th>
                                            <th>EMAIL</th>
                                            <th>TELEFONE</th>
                                            <th>STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingLeads && (
                                            <tr>
                                                <td colSpan={5} className="text-center py-4 text-muted">Carregando leads...</td>
                                            </tr>
                                        )}
                                        {!loadingLeads && filteredLeads.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="text-center py-4 text-muted">Nenhum lead encontrado.</td>
                                            </tr>
                                        )}
                                        {!loadingLeads && paginatedLeads.map((lead) => (
                                            <tr key={lead.id}>
                                                <td>
                                                    <Form.Check
                                                        type="checkbox"
                                                        checked={selectedLeadIds.includes(lead.id)}
                                                        onChange={() => toggleLead(lead.id)}
                                                    />
                                                </td>
                                                <td>{lead.name}</td>
                                                <td>{lead.email}</td>
                                                <td>{lead.phone}</td>
                                                <td>
                                                    <span className={`badge rounded-pill ${getLeadStatusClass(lead.status)}`}>{lead.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {!loadingLeads && filteredLeads.length > LEADS_PAGE_SIZE && (
                                <div className="d-flex justify-content-end align-items-center gap-2 mt-3">
                                    <Button
                                        variant="outline-secondary"
                                        className="voice-create-soft-btn px-2 py-1"
                                        onClick={() => setLeadModalPage((prev) => Math.max(1, prev - 1))}
                                        disabled={leadModalPage === 1}
                                    >
                                        ‹
                                    </Button>
                                    <small className="text-muted">
                                        Página {leadModalPage} de {totalLeadPages}
                                    </small>
                                    <Button
                                        variant="outline-secondary"
                                        className="voice-create-soft-btn px-2 py-1"
                                        onClick={() => setLeadModalPage((prev) => Math.min(totalLeadPages, prev + 1))}
                                        disabled={leadModalPage === totalLeadPages}
                                    >
                                        ›
                                    </Button>
                                </div>
                            )}
                        </>
                    )}

                    {leadModalTab === 'import' && (
                        <>
                            <div className="voice-create-import-dropzone mb-3">
                                <div>
                                    <Upload size={40} className="text-muted mb-2" />
                                    <div className="h5 fw-normal mb-1">Arraste seu arquivo aqui</div>
                                    <div className="text-muted mb-3">ou clique para selecionar (CSV, XLS, XLSX)</div>
                                    <Form.Control
                                        id="campaign-leads-import-file"
                                        type="file"
                                        accept=".csv,.xls,.xlsx"
                                        className="d-none"
                                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                    />
                                    <Button
                                        variant="outline-secondary"
                                        className="voice-create-soft-btn d-inline-flex align-items-center gap-2"
                                        onClick={() => document.getElementById('campaign-leads-import-file')?.click()}
                                    >
                                        <Upload size={14} />
                                        Selecionar Arquivo
                                    </Button>
                                    {importFile && <div className="small text-muted mt-2">{importFile.name}</div>}
                                </div>
                            </div>

                            <div className="fw-semibold mb-2">Formato esperado:</div>
                            <div className="voice-create-file-sample">
                                nome,email,telefone,status{'\n'}
                                João Silva,joao@email.com,+5521999887766,New
                            </div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 pt-2">
                    <Button variant="outline-secondary" className="voice-create-soft-btn" onClick={() => setShowLeadsModal(false)}>
                        Cancelar
                    </Button>
                    {leadModalTab === 'list' ? (
                        <Button variant="success" className="d-inline-flex align-items-center gap-2" onClick={() => setShowLeadsModal(false)}>
                            <Plus size={14} />
                            Adicionar
                        </Button>
                    ) : (
                        <Button variant="success" className="voice-create-import-btn d-inline-flex align-items-center gap-2" disabled={!importFile}>
                            <Upload size={14} />
                            Importar
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default CreateCampaignWhatsAppBody;
