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
    Mic,
    PenTool,
    ShoppingCart,
    Star,
    User,
    RefreshCw,
    Zap,
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
import { useColorMode } from '@/hooks/useColorMode';

const RECOMMENDED_VOICES = [
    {
        voice_id: '11labs-Cimo',
        voice_name: 'Cimo',
        accent: 'American',
        gender: 'female',
        age: 'Middle Aged',
        preview_audio_url: 'https://retell-utils-public.s3.us-west-2.amazonaws.com/cimo.mp3',
        badge: 'Recomendada',
        badgeColor: '#15a085',
    },
    {
        voice_id: 'cartesia-Hailey-Portugese-Brazilian',
        voice_name: 'Hailey',
        accent: 'Português Brasileiro',
        gender: 'female',
        age: 'Young',
        preview_audio_url: 'https://retell-utils-public.s3.us-west-2.amazonaws.com/hailey.mp3',
        badge: 'Sotaque BR',
        badgeColor: '#2563eb',
    },
    {
        voice_id: '11labs-Nia',
        voice_name: 'Nia',
        accent: 'American',
        gender: 'female',
        age: 'Young',
        preview_audio_url: 'https://retell-utils-public.s3.us-west-2.amazonaws.com/nia.mp3',
        badge: null,
        badgeColor: null,
    },
    {
        voice_id: '11labs-Brian',
        voice_name: 'Brian',
        accent: 'American',
        gender: 'male',
        age: 'Young',
        preview_audio_url: 'https://retell-utils-public.s3.us-west-2.amazonaws.com/brian.mp3',
        badge: 'Masculino',
        badgeColor: '#7c3aed',
    },
    {
        voice_id: 'retell-Rita',
        voice_name: 'Rita',
        accent: 'American',
        gender: 'female',
        age: 'Young',
        preview_audio_url: 'https://retell-utils-public.s3.us-west-2.amazonaws.com/rita.mp3',
        badge: null,
        badgeColor: null,
    },
];

const CAMPAIGN_KIND_OPTIONS = [
    'Informativa',
    'Mobilização',
    'Convite para Evento',
    'Lembrete',
    'Captação de Apoio',
    'Data Comemorativa',
    'Pesquisa',
    'Outro',
];

/** Mapeia label do wizard para valor aceito pelo backend (create-campaign.dto) */
const CAMPAIGN_KIND_TO_API = {
    'Informativa': 'informativa',
    'Mobilização': 'mobilizacao',
    'Convite para Evento': 'evento',
    'Lembrete': 'lembrete',
    'Captação de Apoio': 'outro',
    'Data Comemorativa': 'outro',
    'Pesquisa': 'pesquisa',
    'Outro': 'outro',
};

/** Subtipos de pesquisa eleitoral */
const PESQUISA_KIND_OPTIONS = [
    { value: 'intencao_voto',          label: 'Intenção de Voto',            icon: '🗳️' },
    { value: 'tracking',               label: 'Tracking (Acompanhamento)',    icon: '📈' },
    { value: 'imagem_candidato',       label: 'Imagem do Candidato',          icon: '🪞' },
    { value: 'problemas_prioritarios', label: 'Problemas Prioritários',       icon: '🏚️' },
    { value: 'teste_mensagem',         label: 'Teste de Mensagem',            icon: '💬' },
    { value: 'recall_campanha',        label: 'Recall de Campanha',           icon: '📣' },
    { value: 'rejeicao',               label: 'Rejeição Eleitoral',           icon: '🚫' },
    { value: 'pos_evento',             label: 'Pós-Evento',                   icon: '🎤' },
    { value: 'qualitativa',            label: 'Pesquisa Qualitativa',         icon: '🧠' },
];

/** Templates de prompt por subtipo de pesquisa */
const PESQUISA_KIND_PROMPTS = {
    intencao_voto: `Realizar pesquisa de intenção de voto. Pergunte ao eleitor: "Se a eleição para vereador fosse hoje, em quem você votaria?" Anote a resposta. Em seguida pergunte: "Você está decidido ou ainda pode mudar de ideia?" Aguarde a resposta completa antes de avançar. Seja neutro, não mencione nomes de candidatos.`,

    tracking: `Realizar acompanhamento contínuo de intenção de voto. Pergunte: "Comparando com há uma semana, sua opinião sobre os candidatos mudou?" Aguarde. Em seguida: "Se a eleição fosse hoje, você votaria no mesmo candidato de antes ou em outro?" Ouça com atenção. Uma pergunta por vez.`,

    imagem_candidato: `Realizar pesquisa de imagem do candidato João Silva. Pergunte: "Quando você pensa no vereador João Silva, qual palavra vem primeiro na sua cabeça?" Aguarde. Depois: "Você considera João Silva honesto e competente para o cargo?" Opções: muito, um pouco, ou nada. Uma pergunta por vez, sem induzir resposta.`,

    problemas_prioritarios: `Realizar pesquisa sobre os principais problemas da cidade. Pergunte: "Na sua opinião, qual é o maior problema da sua rua ou bairro hoje?" Aguarde a resposta. Depois: "Entre segurança, saúde, transporte e emprego — qual desses o governo deveria resolver primeiro?" Ouça completamente antes de continuar.`,

    teste_mensagem: `Realizar teste de reação a proposta política. Apresente: "O candidato João Silva propõe criar 3 novas UPAs no bairro com atendimento 24h. O que você acha dessa proposta?" Aguarde. Em seguida: "Essa proposta mudaria sua intenção de voto? Por quê?" Uma pergunta por vez.`,

    recall_campanha: `Realizar pesquisa de recall de campanha. Pergunte: "Você viu ou ouviu alguma propaganda do candidato João Silva nos últimos dias?" Aguarde. Se sim: "Onde você viu? TV, Instagram, WhatsApp ou na rua?" Se não: "Você conhece o nome João Silva como candidato a vereador?" Uma pergunta por vez.`,

    rejeicao: `Realizar pesquisa de rejeição eleitoral. Pergunte com naturalidade: "Existe algum candidato a vereador em quem você não votaria de jeito nenhum?" Aguarde a resposta. Se mencionar nomes, pergunte: "O que te faz rejeitar esse candidato?" Seja neutro e não demonstre surpresa com nenhuma resposta.`,

    pos_evento: `Realizar pesquisa pós-debate eleitoral. Pergunte: "Você assistiu ao debate dos candidatos a vereador ontem?" Aguarde. Se sim: "Depois do debate, sua opinião sobre algum candidato mudou?" Se não: "Mesmo sem assistir, você já tem um candidato favorito?" Uma pergunta por vez, ouça a resposta completa.`,

    qualitativa: `Realizar pesquisa qualitativa de percepção eleitoral. Pergunte de forma aberta: "O que você sente quando ouve o nome do candidato João Silva?" Aguarde sem interromper. Depois: "Em uma palavra, como você descreveria a campanha dele até agora?" Deixe o eleitor falar livremente. Não ofereça opções, apenas ouça.`,
};

/** Prompts de exemplo para cada tipo de campanha (contexto injetado em {{prompt}} no agente Retell) */
const CAMPAIGN_KIND_PROMPTS = {
    'Informativa': `Informar os eleitores sobre a aprovação do projeto de lei de iluminação pública nos bairros da Zona Oeste. O vereador João Silva garantiu a verba de R$ 2 milhões para instalar 500 novos postes em Realengo, Campo Grande e Bangu. As obras começam em abril.`,

    'Mobilização': `Mobilizar eleitores para participar do mutirão de limpeza e revitalização da Praça da Paz em Realengo, sábado dia 29 de março, às 8h. Levar luvas e entusiasmo. A iniciativa é do gabinete do vereador João Silva em parceria com a Associação de Moradores.`,

    'Convite para Evento': `Convidar para o Encontro Comunitário do Zé do Gás, sábado dia 22 de março, às 10h, no Centro Comunitário de Realengo (Rua das Flores, 100). Evento gratuito com café da manhã, palestras e sorteio de brindes. Vagas limitadas.`,

    'Lembrete': `Lembrar que o prazo para regularização do título de eleitor termina em 9 de maio. Eleitores com título cancelado ou em situação irregular devem comparecer ao cartório eleitoral com documento de identidade e comprovante de residência. Serviço gratuito.`,

    'Captação de Apoio': `Apresentar a pré-candidatura do vereador João Silva à reeleição e pedir apoio. João é morador de Realengo, tem 8 anos de mandato e foi responsável pela creche do bairro e pela ciclovia da Estrada do Mendanha. Queremos saber se o eleitor apoia a candidatura.`,

    'Data Comemorativa': `Desejar um feliz Dia das Mães em nome do vereador João Silva e de toda a equipe. Mensagem de carinho e reconhecimento para todas as mães da comunidade, agradecendo a força e dedicação que constroem o bairro todos os dias.`,

    'Pesquisa': PESQUISA_KIND_PROMPTS.intencao_voto,

    'Outro': `Descreva aqui o contexto da ligação: qual é o assunto, qual é o objetivo, quais informações a Ana deve transmitir e o que esperar como resposta do eleitor.`,
};

const STEPS = [
    { key: 'basic', title: 'Dados Básicos', subtitle: 'Nome e tipo da campanha', icon: PenTool },
    { key: 'voice', title: 'Voz', subtitle: 'Selecione a voz do agente', icon: Mic },
    { key: 'script', title: 'Script', subtitle: 'Objetivo e prompt da ligação', icon: PenTool },
    { key: 'config', title: 'Configurações', subtitle: 'Horários e automações', icon: Clock },
    { key: 'audience', title: 'Público', subtitle: 'Tags, segmentação e leads', icon: User },
    { key: 'review', title: 'Revisar', subtitle: 'Confirmar e salvar', icon: Check },
];

const INITIAL_TAG_OPTIONS = ['Zona Sul', 'Zona Norte', 'Zona Oeste', 'Prioridade', 'WhatsApp', 'Voz'];
const INITIAL_SELECTED_TAGS = ['Voz'];
const LEADS_PAGE_SIZE = 5;
const CreateCampaignVoiceBody = () => {
    const router = useRouter();
    const { status } = useAuth();
    const { isDark } = useColorMode();

    const [step, setStep] = useState(1);
    const [campaignName, setCampaignName] = useState('');
    const [campaignKind, setCampaignKind] = useState('Informativa');
    const [pesquisaKind, setPesquisaKind] = useState('intencao_voto');
    const [voiceId, setVoiceId] = useState('11labs-Cimo');
    const [agentName, setAgentName] = useState('Ana');
    const [scriptObjective, setScriptObjective] = useState('');
    const [generatedScript, setGeneratedScript] = useState('');
    const [triggerDate, setTriggerDate] = useState('');
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('18:00');
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
        const d = new Date(triggerDate);
        if (isNaN(d.getTime())) return triggerDate;
        return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }, [triggerDate]);
    const reviewScriptText = useMemo(() => {
        if (generatedScript?.trim()) return generatedScript;
        return 'Nenhum script definido.';
    }, [generatedScript]);

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
        if (step < 6) setStep((prev) => prev + 1);
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
        const script = (generatedScript || '').trim();
        if (!script) {
            setStep(3);
            setSaveError('Escreva o script da campanha antes de salvar.');
            return;
        }

        setSaving(true);
        setSaveError(null);
        let createdId = null;

        try {
            const payload = {
                name: campaignName.trim(),
                prompt: script,
                campaignType: 'voice',
                campaignKind: CAMPAIGN_KIND_TO_API[campaignKind] ?? 'outro',
                metadata: {
                    voiceId,
                    agentName: agentName.trim() || 'Ana',
                    pesquisaKind: campaignKind === 'Pesquisa' ? pesquisaKind : undefined,
                    triggerDate: triggerDate ? new Date(triggerDate).toISOString() : null,
                    startTime,
                    endTime,
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
            console.error('Erro ao salvar campanha de voz:', err);
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
                    background: rgba(21,160,133,0.15);
                    border-color: rgba(21,160,133,0.45);
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
                    background: var(--bs-body-bg);
                    border: 1px solid var(--bs-border-color);
                    flex-shrink: 0;
                }
                .voice-create-step-item.active .voice-create-step-icon {
                    background: #15a085;
                    border-color: #15a085;
                    color: #ffffff;
                }
                .voice-create-step-item.completed .voice-create-step-icon {
                    background: rgba(21,160,133,0.15);
                    border-color: rgba(21,160,133,0.45);
                    color: #15a085;
                }
                .voice-create-card {
                    border: 1px solid var(--bs-border-color);
                    border-radius: 14px;
                    box-shadow: 0 2px 10px rgba(0,0,0,.06);
                }
                .voice-create-soft-btn {
                    background: var(--bs-body-bg) !important;
                    border: 1px solid var(--bs-border-color) !important;
                    color: var(--bs-body-color) !important;
                    box-shadow: none !important;
                }
                .voice-create-soft-btn:hover,
                .voice-create-soft-btn:focus,
                .voice-create-soft-btn:active,
                .voice-create-soft-btn.show {
                    background: var(--bs-tertiary-bg, var(--bs-body-bg)) !important;
                    border-color: var(--bs-border-color-translucent) !important;
                    color: var(--bs-body-color) !important;
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
                    background: var(--bs-body-bg) !important;
                    border: 1px solid var(--bs-border-color) !important;
                    color: var(--bs-body-color) !important;
                    box-shadow: none !important;
                }
                .voice-create-back-btn:hover,
                .voice-create-back-btn:focus,
                .voice-create-back-btn:active {
                    background: var(--bs-tertiary-bg, var(--bs-body-bg)) !important;
                    border-color: var(--bs-border-color-translucent) !important;
                    color: var(--bs-body-color) !important;
                    box-shadow: none !important;
                }
                .voice-create-title-badge {
                    background: rgba(63,63,216,0.12);
                    color: var(--bs-primary);
                    border: 1px solid rgba(63,63,216,0.25);
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
                    border: 1px solid var(--bs-border-color);
                    background: var(--bs-tertiary-bg, transparent);
                    color: var(--bs-body-color);
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
                    color: var(--bs-secondary-color);
                }
                .voice-create-lead-table td,
                .voice-create-lead-table th {
                    vertical-align: middle;
                }
                .voice-create-modal-tab {
                    border: 1px solid transparent !important;
                    background: transparent !important;
                    color: var(--bs-secondary-color) !important;
                    min-height: 42px;
                    border-radius: 10px !important;
                }
                .voice-create-modal-tab.active {
                    background: var(--bs-body-bg) !important;
                    border-color: #15a085 !important;
                    color: var(--bs-body-color) !important;
                    box-shadow: none !important;
                }
                .voice-create-modal-segmented {
                    border: 1px solid var(--bs-border-color);
                    background: var(--bs-tertiary-bg, transparent);
                    border-radius: 12px;
                    padding: 6px;
                }
                .voice-create-import-dropzone {
                    border: 2px dashed var(--bs-border-color);
                    border-radius: 14px;
                    min-height: 210px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 16px;
                    background: var(--bs-tertiary-bg, transparent);
                }
                .voice-create-file-sample {
                    background: var(--bs-tertiary-bg, transparent);
                    border: 1px solid var(--bs-border-color);
                    border-radius: 10px;
                    padding: 14px;
                    color: var(--bs-secondary-color);
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
                    background: var(--bs-tertiary-bg, transparent);
                    border: 1px solid var(--bs-border-color);
                    border-radius: 10px;
                    padding: 12px;
                    max-height: 160px;
                    overflow: auto;
                    white-space: pre-wrap;
                }
                .voice-create-rule-chip {
                    background: var(--bs-tertiary-bg, transparent);
                    border: 1px solid var(--bs-border-color);
                    color: var(--bs-body-color);
                    border-radius: 999px;
                    padding: 4px 10px;
                    font-size: 12px;
                    font-weight: 600;
                }
                /* ── Dark mode overrides ── */
                [data-bs-theme="dark"] .voice-create-step-item.active {
                    background: #0a2e22 !important;
                    border-color: #0d4a35 !important;
                }
                [data-bs-theme="dark"] .voice-create-step-icon {
                    background: #252a3a !important;
                    border-color: #2a2f3d !important;
                }
                [data-bs-theme="dark"] .voice-create-step-item.active .voice-create-step-icon {
                    background: #15a085 !important;
                    border-color: #15a085 !important;
                }
                [data-bs-theme="dark"] .voice-create-step-item.completed .voice-create-step-icon {
                    background: #0a2e22 !important;
                    border-color: #0d4a35 !important;
                }
                [data-bs-theme="dark"] .voice-create-card {
                    border-color: #2a2f3d !important;
                    background: #1e2130 !important;
                }
                [data-bs-theme="dark"] .voice-create-soft-btn {
                    background: #252a3a !important;
                    border-color: #2a2f3d !important;
                    color: #c9d1e0 !important;
                }
                [data-bs-theme="dark"] .voice-create-soft-btn:hover,
                [data-bs-theme="dark"] .voice-create-soft-btn:focus,
                [data-bs-theme="dark"] .voice-create-soft-btn:active,
                [data-bs-theme="dark"] .voice-create-soft-btn.show {
                    background: #2d3348 !important;
                    border-color: #3a4054 !important;
                    color: #dde3ef !important;
                }
                [data-bs-theme="dark"] .voice-create-back-btn {
                    background: #252a3a !important;
                    border-color: #2a2f3d !important;
                    color: #c9d1e0 !important;
                }
                [data-bs-theme="dark"] .voice-create-back-btn:hover,
                [data-bs-theme="dark"] .voice-create-back-btn:focus,
                [data-bs-theme="dark"] .voice-create-back-btn:active {
                    background: #2d3348 !important;
                    border-color: #3a4054 !important;
                    color: #dde3ef !important;
                }
                [data-bs-theme="dark"] .voice-create-title-badge {
                    background: #1a1a40 !important;
                    color: #a5a8f8 !important;
                    border-color: #2a2d6e !important;
                }
                [data-bs-theme="dark"] .voice-create-tag-chip {
                    border-color: #2a2f3d !important;
                    background: #252a3a !important;
                    color: #8d97b0 !important;
                }
                [data-bs-theme="dark"] .voice-create-modal-tab {
                    color: #8d97b0 !important;
                }
                [data-bs-theme="dark"] .voice-create-modal-tab.active {
                    background: #252a3a !important;
                    border-color: #15a085 !important;
                    color: #dde3ef !important;
                }
                [data-bs-theme="dark"] .voice-create-modal-segmented {
                    border-color: #2a2f3d !important;
                    background: #1e2130 !important;
                }
                [data-bs-theme="dark"] .voice-create-import-dropzone {
                    border-color: #2a2f3d !important;
                    background: #1a1d27 !important;
                }
                [data-bs-theme="dark"] .voice-create-file-sample {
                    background: #1e2130 !important;
                    border-color: #2a2f3d !important;
                    color: #8d97b0 !important;
                }
                [data-bs-theme="dark"] .voice-create-review-script {
                    background: #1e2130 !important;
                    border-color: #2a2f3d !important;
                }
                [data-bs-theme="dark"] .voice-create-rule-chip {
                    background: #252a3a !important;
                    border-color: #2a2f3d !important;
                    color: #c9d1e0 !important;
                }
                [data-bs-theme="dark"] .voice-create-review-title {
                    color: #5a6480 !important;
                }
                [data-bs-theme="dark"] .voice-create-empty-box {
                    color: #5a6480 !important;
                }
            `}</style>

            <Row className="g-0 voice-create-layout">
                <Col xl={2} lg={3} className={`border-end px-3 py-3${isDark ? '' : ' bg-white'}`}>
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
                            <h1 className="h3 mb-0">Nova Campanha de Voz</h1>
                            <span className="voice-create-title-badge">
                                <Mic size={14} />
                                Campanha de Voz
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
                        <div className="rounded-pill" style={{ width: 56, height: 6, background: isDark ? '#2a2f3d' : '#eceff3' }}>
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
                            {step === 1 ? 'Dados Básicos' : step === 2 ? 'Voz do Agente' : step === 3 ? 'Script' : step === 4 ? 'Configurações' : step === 5 ? 'Público' : 'Revisar'}
                        </h2>
                        <p className="text-muted mb-4">
                            {step === 1 ? 'Nome e tipo da campanha' : step === 2 ? 'Selecione a voz que será usada nas ligações' : step === 3 ? 'Objetivo e prompt da ligação' : step === 4 ? 'Horários e data do disparo' : step === 5 ? 'Tags, segmentação e leads' : 'Confirmação final'}
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
                                                        onClick={() => {
                                                            setCampaignKind(item);
                                                            if (item === 'Pesquisa') {
                                                                setGeneratedScript(PESQUISA_KIND_PROMPTS.intencao_voto);
                                                                setPesquisaKind('intencao_voto');
                                                            } else {
                                                                setGeneratedScript(CAMPAIGN_KIND_PROMPTS[item] || '');
                                                            }
                                                        }}
                                                        className="d-flex align-items-center gap-2"
                                                    >
                                                        {campaignKind === item ? <Check size={14} /> : <span style={{ width: 14 }} />}
                                                        {item}
                                                    </Dropdown.Item>
                                                ))}
                                            </Dropdown.Menu>
                                        </Dropdown>
                                        <Form.Text className="text-muted">
                                            O tipo influencia como a IA gerará o script da ligação.
                                        </Form.Text>
                                    </Form.Group>

                                    {/* Campo de subtipo — só aparece quando Pesquisa for selecionada */}
                                    {campaignKind === 'Pesquisa' && (
                                        <Form.Group className="mt-4">
                                            <Form.Label className="fw-semibold d-flex align-items-center gap-2">
                                                <span>🔬</span> Tipo de Pesquisa
                                            </Form.Label>
                                            <p className="text-muted mb-3" style={{ fontSize: 13 }}>
                                                Selecione o objetivo da pesquisa. O script será preenchido automaticamente com um template.
                                            </p>
                                            <div className="d-flex flex-column gap-2">
                                                {PESQUISA_KIND_OPTIONS.map((opt) => {
                                                    const isSelected = pesquisaKind === opt.value;
                                                    return (
                                                        <button
                                                            key={opt.value}
                                                            type="button"
                                                            onClick={() => {
                                                                setPesquisaKind(opt.value);
                                                                setGeneratedScript(PESQUISA_KIND_PROMPTS[opt.value] || '');
                                                            }}
                                                            className="text-start w-100 d-flex align-items-center gap-3"
                                                            style={{
                                                                background: isSelected ? (isDark ? '#0a2e22' : '#f0fdf9') : 'var(--bs-body-bg)',
                                                                border: `1.5px solid ${isSelected ? '#15a085' : 'var(--bs-border-color)'}`,
                                                                borderRadius: 10,
                                                                padding: '10px 14px',
                                                                cursor: 'pointer',
                                                                transition: 'border-color .15s, background .15s',
                                                            }}
                                                        >
                                                            <span style={{ fontSize: 20, flexShrink: 0 }}>{opt.icon}</span>
                                                            <div className="flex-grow-1">
                                                                <div className="fw-semibold" style={{ fontSize: 14, color: 'var(--bs-body-color)' }}>
                                                                    {opt.label}
                                                                </div>
                                                            </div>
                                                            {isSelected && <CheckCircle size={16} style={{ color: '#15a085', flexShrink: 0 }} />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </Form.Group>
                                    )}
                                </Card.Body>
                            </Card>
                        )}

                        {step === 2 && (
                            <>
                                <Card className="voice-create-card mb-4">
                                    <Card.Body className="p-4">
                                        <h5 className="d-flex align-items-center gap-2 mb-2">
                                            <Mic size={16} style={{ color: '#15a085' }} />
                                            Voz do Agente
                                        </h5>
                                        <p className="text-muted mb-4">
                                            Selecione a voz que será usada nas ligações. Clique em ▶ para ouvir uma prévia.
                                        </p>

                                        <div className="d-flex flex-column gap-2">
                                            {RECOMMENDED_VOICES.map((voice) => {
                                                const isSelected = voiceId === voice.voice_id;
                                                const meta = [voice.accent, voice.age].filter(Boolean).join(' · ');
                                                const genderLabel = voice.gender === 'female' ? 'Feminina' : 'Masculina';
                                                return (
                                                    <button
                                                        key={voice.voice_id}
                                                        type="button"
                                                        onClick={() => setVoiceId(voice.voice_id)}
                                                        className="text-start w-100"
                                                        style={{
                                                            background: isSelected
                                                                ? (isDark ? '#0a2e22' : '#dff4ef')
                                                                : (isDark ? '#252a3a' : '#fff'),
                                                            border: `1.5px solid ${isSelected ? '#15a085' : (isDark ? '#2a2f3d' : '#e2e8f0')}`,
                                                            borderRadius: 14,
                                                            padding: '14px 16px',
                                                            cursor: 'pointer',
                                                            transition: 'border-color .15s, background .15s',
                                                        }}
                                                    >
                                                        <div className="d-flex align-items-center justify-content-between gap-3">
                                                            <div className="d-flex align-items-center gap-3">
                                                                {/* Avatar inicial */}
                                                                <div style={{
                                                                    width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                                                                    background: isSelected ? '#15a085' : (isDark ? '#2a2f3d' : '#e2e8f0'),
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    fontWeight: 700, fontSize: 16,
                                                                    color: isSelected ? '#fff' : (isDark ? '#8d97b0' : '#475467'),
                                                                }}>
                                                                    {voice.voice_name[0]}
                                                                </div>
                                                                <div>
                                                                    <div className="d-flex align-items-center gap-2 mb-1">
                                                                        <span className="fw-semibold" style={{ color: isDark ? '#dde3ef' : '#0f172a', fontSize: 15 }}>
                                                                            {voice.voice_name}
                                                                        </span>
                                                                        <span className="small" style={{ color: isDark ? '#8d97b0' : '#64748b' }}>
                                                                            · {genderLabel}
                                                                        </span>
                                                                        {voice.badge && (
                                                                            <span style={{
                                                                                background: voice.badgeColor + '22',
                                                                                color: voice.badgeColor,
                                                                                border: `1px solid ${voice.badgeColor}44`,
                                                                                borderRadius: 999, padding: '1px 8px',
                                                                                fontSize: 11, fontWeight: 600,
                                                                            }}>
                                                                                {voice.badge}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="small" style={{ color: isDark ? '#5a6480' : '#94a3b8' }}>
                                                                        {meta}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="d-flex align-items-center gap-2">
                                                                {voice.preview_audio_url && (
                                                                    <button
                                                                        type="button"
                                                                        title="Ouvir prévia"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            new Audio(voice.preview_audio_url).play().catch(() => {});
                                                                        }}
                                                                        style={{
                                                                            width: 32, height: 32, borderRadius: '50%',
                                                                            background: isDark ? '#1e2130' : '#f1f5f9',
                                                                            border: `1px solid ${isDark ? '#2a2f3d' : '#e2e8f0'}`,
                                                                            color: '#15a085', cursor: 'pointer',
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                            fontSize: 12, flexShrink: 0,
                                                                        }}
                                                                    >
                                                                        ▶
                                                                    </button>
                                                                )}
                                                                {isSelected && (
                                                                    <CheckCircle size={20} style={{ color: '#15a085', flexShrink: 0 }} />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {voiceId && (
                                            <div className="mt-3 p-3 rounded-3" style={{
                                                background: isDark ? '#0a2e22' : '#f0fdf9',
                                                border: `1px solid ${isDark ? '#0d4a35' : '#a7f3d0'}`,
                                            }}>
                                                <small style={{ color: isDark ? '#6ee7b7' : '#059669' }}>
                                                    Voz selecionada: <strong>
                                                        {RECOMMENDED_VOICES.find(v => v.voice_id === voiceId)?.voice_name || voiceId}
                                                    </strong>
                                                    <span className="ms-1 opacity-75">({voiceId})</span>
                                                </small>
                                            </div>
                                        )}

                                        {/* Nome do assistente */}
                                        <div className="mt-4">
                                            <label className="form-label fw-semibold d-flex align-items-center gap-2 mb-1" style={{ fontSize: 14 }}>
                                                <User size={14} style={{ color: '#15a085' }} />
                                                Nome do Assistente
                                            </label>
                                            <p className="text-muted mb-2" style={{ fontSize: 13 }}>
                                                Como a assistente vai se apresentar na ligação. Esse nome é enviado ao agente Retell e aparece no <code>{'{{'+'agent_name'+'}}'}</code> do prompt.
                                            </p>
                                            <Form.Control
                                                type="text"
                                                placeholder="Ex: Ana, Maria, Carlos..."
                                                value={agentName}
                                                onChange={e => setAgentName(e.target.value)}
                                                maxLength={40}
                                                style={{ maxWidth: 320 }}
                                            />
                                        </div>
                                    </Card.Body>
                                </Card>
                            </>
                        )}

                        {step === 3 && (
                            <>
                                <Card className="voice-create-card mb-4">
                                    <Card.Body className="p-4">
                                        <div className="d-flex align-items-center justify-content-between gap-3 mb-2">
                                            <h5 className="d-flex align-items-center gap-2 mb-0">
                                                <PenTool size={16} style={{ color: '#15a085' }} />
                                                Script da Campanha
                                            </h5>
                                            {CAMPAIGN_KIND_PROMPTS[campaignKind] && (
                                                <button
                                                    type="button"
                                                    onClick={() => setGeneratedScript(CAMPAIGN_KIND_PROMPTS[campaignKind])}
                                                    style={{
                                                        background: isDark ? '#0a2e22' : '#f0fdf9',
                                                        border: `1px solid ${isDark ? '#0d4a35' : '#a7f3d0'}`,
                                                        borderRadius: 8,
                                                        color: isDark ? '#6ee7b7' : '#059669',
                                                        fontSize: 13,
                                                        fontWeight: 600,
                                                        padding: '5px 12px',
                                                        cursor: 'pointer',
                                                        whiteSpace: 'nowrap',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                    }}
                                                >
                                                    <Zap size={13} />
                                                    Usar exemplo de &quot;{campaignKind}&quot;
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-muted mb-3">
                                            Descreva o contexto da ligação: assunto, data, local e objetivo. A Ana usará isso para conduzir a conversa.
                                        </p>
                                        <Form.Control
                                            as="textarea"
                                            className="voice-create-script-box"
                                            value={generatedScript}
                                            onChange={(e) => setGeneratedScript(e.target.value)}
                                            placeholder="Ex: Convidar para o Encontro Comunitário do Zé do Gás, sábado dia 22 de março, às 10h, no Centro Comunitário de Realengo. Evento gratuito com café da manhã e sorteio de brindes."
                                        />
                                    </Card.Body>
                                </Card>
                            </>
                        )}

                        {step === 4 && (
                            <>
                                <Card className="voice-create-card mb-4">
                                    <Card.Body className="p-4">
                                        <h5 className="d-flex align-items-center gap-2 mb-2">
                                            <Clock size={16} style={{ color: '#15a085' }} />
                                            Horários e automações
                                        </h5>
                                        <p className="text-muted mb-4">
                                            Deixe a data em branco para disparar imediatamente ao clicar em &quot;Iniciar&quot;. Se preencher uma data futura, o disparo será agendado automaticamente para aquele momento.
                                        </p>

                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-semibold">Data e Hora do Disparo</Form.Label>
                                            <Form.Control
                                                type="datetime-local"
                                                value={triggerDate}
                                                onChange={(e) => setTriggerDate(e.target.value)}
                                                min={new Date().toISOString().slice(0, 16)}
                                            />
                                            <Form.Text className="text-muted">
                                                Deixe em branco para disparar imediatamente ao clicar em &quot;Iniciar&quot;.
                                            </Form.Text>
                                        </Form.Group>

                                    </Card.Body>
                                </Card>
                            </>
                        )}

                        {step === 5 && (
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
                                                <p className="text-muted mb-0">Escolha quais contatos receberão as ligações.</p>
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

                        {step === 6 && (
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
                                            {campaignKind === 'Pesquisa' && (
                                                <Col md={12}>
                                                    <span className="text-muted">Tipo de Pesquisa:</span>{' '}
                                                    <strong>{PESQUISA_KIND_OPTIONS.find(o => o.value === pesquisaKind)?.icon} {PESQUISA_KIND_OPTIONS.find(o => o.value === pesquisaKind)?.label || pesquisaKind}</strong>
                                                </Col>
                                            )}
                                        </Row>
                                    </Card.Body>
                                </Card>

                                <Card className="voice-create-card mb-4">
                                    <Card.Body className="p-4">
                                        <div className="voice-create-review-title">Voz do Agente</div>
                                        <Row className="g-3">
                                            <Col md={6}>
                                                <span className="text-muted">Voz selecionada:</span>{' '}
                                                {RECOMMENDED_VOICES.find((v) => v.voice_id === voiceId)?.voice_name || voiceId || '-'}
                                                {voiceId && (
                                                    <span className="ms-2 small text-muted">({voiceId})</span>
                                                )}
                                            </Col>
                                            <Col md={6}>
                                                <span className="text-muted">Nome do Assistente:</span>{' '}
                                                <strong>{agentName || 'Ana'}</strong>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                <Card className="voice-create-card mb-4">
                                    <Card.Body className="p-4">
                                        <div className="voice-create-review-title">Script</div>
                                        <div className="voice-create-review-script">{reviewScriptText}</div>
                                    </Card.Body>
                                </Card>

                                <Card className="voice-create-card mb-4">
                                    <Card.Body className="p-4">
                                        <div className="voice-create-review-title">Configurações</div>
                                        <Row className="g-3">
                                            <Col md={6}><span className="text-muted">Data:</span> {reviewDateLabel}</Col>
                                            <Col md={6}><span className="text-muted">Horário:</span> {startTime} - {endTime}</Col>
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
                            {step < 6 ? (
                                <Button variant="success" className="px-4 d-inline-flex align-items-center gap-2" onClick={goNext} disabled={saving}>
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

export default CreateCampaignVoiceBody;
