import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SimpleBar from 'simplebar-react';
import { Button, Card, Col, Dropdown, Form, Modal, ProgressBar, Row, Table } from 'react-bootstrap';
import {
    Activity,
    BarChart2,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Copy,
    Edit,
    MessageSquare,
    Pause,
    Phone,
    Play,
    Plus,
    RefreshCw,
    RotateCw,
    Search,
    ShoppingCart,
    Square,
    Tag,
    Trash,
    X,
} from 'react-feather';
import { listCampaigns, deleteCampaign, startCampaign, pauseCampaign, resumeCampaign, stopCampaign, getCampaignProgress, getCampaignStats, getDispatchPreview, createCampaign, addLeadsToCampaign, getCampaign } from '@/lib/api/services/campaigns';
import { useAuth } from '@/lib/auth/AuthProvider';
import { showCustomAlert } from '@/components/CustomAlert';

const STATUS_OPTIONS = [
    { key: '', label: 'Todos os Status' },
    { key: 'novo', label: 'Novo' },
    { key: 'abordado', label: 'Abordado' },
    { key: 'engajado', label: 'Engajado' },
    { key: 'prioritario', label: 'Prioritário' },
    { key: 'fora_perfil', label: 'Fora do Perfil' },
    { key: 'convertido', label: 'Convertido' },
    { key: 'encerrado', label: 'Encerrado' },
];

const STATUS_META = {
    novo: { label: 'Novo', className: 'campaign-badge--novo' },
    abordado: { label: 'Abordado', className: 'campaign-badge--abordado' },
    engajado: { label: 'Engajado', className: 'campaign-badge--engajado' },
    prioritario: { label: 'Prioritário', className: 'campaign-badge--prioritario' },
    fora_perfil: { label: 'Fora do Perfil', className: 'campaign-badge--fora' },
    convertido: { label: 'Convertido', className: 'campaign-badge--convertido' },
    encerrado: { label: 'Encerrado', className: 'campaign-badge--encerrado' },
};

const TAG_SEED = ['Pesquisa', 'Mobilização', 'Prioridade Alta', 'Zona Norte', 'Zona Sul'];

const mapRawStatus = (rawStatus) => {
    const normalized = String(rawStatus || '').trim().toLowerCase();

    const map = {
        draft: 'novo',
        active: 'engajado',
        paused: 'abordado',
        completed: 'convertido',
        cancelled: 'encerrado',
        cancelada: 'encerrado',
        rascunho: 'novo',
        novo: 'novo',
        abordado: 'abordado',
        engajado: 'engajado',
        prioritario: 'prioritario',
        'fora do perfil': 'fora_perfil',
        fora_perfil: 'fora_perfil',
        convertido: 'convertido',
        encerrado: 'encerrado',
    };

    return map[normalized] || 'novo';
};

const getStatusMeta = (statusKey) => STATUS_META[statusKey] || STATUS_META.novo;

const getTypeMeta = (campaign) => {
    const typeSource = String(
        campaign?.type || campaign?.channel || campaign?.campaignType || campaign?.instanceType || ''
    ).toLowerCase();

    if (typeSource.includes('voice') || typeSource.includes('voz')) {
        return {
            label: 'Voz',
            icon: Phone,
            className: 'campaign-badge--voz',
        };
    }

    return {
        label: 'WhatsApp',
        icon: MessageSquare,
        className: 'campaign-badge--wa',
    };
};

const buildResultData = (campaign) => {
    const leads = Number(campaign?.leadCount || 0);
    const sent = Number(campaign?.sentCount || 0);
    const answered = Math.min(leads, Math.floor(sent * 0.72));

    const candidate = Math.floor(answered * 0.4);
    const indeciso = Math.floor(answered * 0.22);
    const outro = Math.floor(answered * 0.18);
    const recusou = Math.floor(answered * 0.2);
    const semResposta = Math.max(0, leads - answered);

    const entregues = sent;
    const atendidas = Math.max(0, Math.floor(sent * 0.73));
    const responderam = answered;
    const falharam = Math.max(0, sent - entregues);

    return {
        objective: campaign?.objective || 'Apresentar candidato e levantar intenção de voto para as próximas eleições.',
        categories: [
            { label: 'Vota no candidato', value: candidate, color: 'success' },
            { label: 'Indeciso', value: indeciso, color: 'warning' },
            { label: 'Vota em outro', value: outro, color: 'danger' },
            { label: 'Recusou responder', value: recusou, color: 'secondary' },
            { label: 'Sem resposta', value: semResposta, color: 'dark' },
        ],
        delivery: [
            { label: 'Entregues', value: entregues, color: 'success' },
            { label: 'Atendidas', value: atendidas, color: 'primary' },
            { label: 'Responderam', value: responderam, color: 'info' },
            { label: 'Falharam', value: falharam, color: 'danger' },
        ],
    };
};

const PAGE_SIZE = 10;

const CampaignListBody = () => {
    const router = useRouter();
    const { status } = useAuth();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const [showTagsMenu, setShowTagsMenu] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [availableTags, setAvailableTags] = useState(TAG_SEED);
    const [activeTags, setActiveTags] = useState([]);

    const [showResultsModal, setShowResultsModal] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [progressData, setProgressData] = useState(null);
    const [progressLoading, setProgressLoading] = useState(false);
    const [statsData, setStatsData] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [pendingStartId, setPendingStartId] = useState(null);
    const pollingRef = useRef(null);

    // Duplicar campanha
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [duplicateSource, setDuplicateSource] = useState(null); // { id, name }
    const [duplicateCopyLeads, setDuplicateCopyLeads] = useState(true);
    const [duplicating, setDuplicating] = useState(false);

    const loadCampaigns = async (showRefreshing = false) => {
        try {
            if (showRefreshing) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const response = await listCampaigns();
            const rawList = Array.isArray(response?.list)
                ? response.list
                : Array.isArray(response?.data)
                ? response.data
                : Array.isArray(response)
                ? response
                : [];
            if (rawList.length >= 0) {
                const formattedData = rawList.map((campaign) => {
                    const createdAtDate = campaign?.createdAt ? new Date(campaign.createdAt) : null;
                    const createdAt = createdAtDate
                        ? createdAtDate.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })
                        : '-';

                    const businessStatus = mapRawStatus(campaign?.status);
                    const campaignTags = Array.isArray(campaign?.tags)
                        ? campaign.tags.map((t) => String(t).trim()).filter(Boolean)
                        : [];

                    const totalLeads = campaign.totalLeads ?? campaign.leadIds?.length ?? campaign.leadCount ?? 0;
                    const processedLeads = campaign.processedLeads ?? 0;

                    return {
                        id: campaign.id,
                        name: campaign.name || '-',
                        statusRaw: campaign.status || '',
                        statusBusiness: businessStatus,
                        instanceName: campaign.instanceName || '-',
                        type: campaign?.type || campaign?.channel || campaign?.campaignType || 'whatsapp',
                        campaignType: campaign.campaignType || '',
                        leadCount: totalLeads,
                        totalLeads,
                        processedLeads,
                        sentCount: processedLeads,
                        processingStartedAt: campaign.processingStartedAt || null,
                        processingCompletedAt: campaign.processingCompletedAt || null,
                        credits: campaign.credits || 0,
                        createdAt,
                        createdAtDate,
                        scheduledFor: (() => {
                            // Lê scheduledFor (campo dedicado) ou cai em metadata.triggerDate (campanhas antigas)
                            const raw = campaign.scheduledFor || campaign.metadata?.triggerDate || null;
                            if (!raw) return null;
                            try {
                                return new Date(raw).toLocaleString('pt-BR', {
                                    day: '2-digit', month: '2-digit', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit',
                                });
                            } catch { return null; }
                        })(),
                        tags: campaignTags,
                    };
                });

                setCampaigns(formattedData);
            }
        } catch (error) {
            console.error('Erro ao carregar campanhas:', error);
            setCampaigns([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        loadCampaigns(true);
    };

    // Polling: atualiza processedLeads nas campanhas ativas a cada 3s
    const startPolling = useCallback(() => {
        if (pollingRef.current) return;
        pollingRef.current = setInterval(async () => {
            setCampaigns(prev => {
                const activeOnes = prev.filter(
                    c => c.statusRaw === 'active' && c.processedLeads < c.totalLeads
                );
                if (activeOnes.length === 0) {
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                }
                return prev;
            });

            setCampaigns(prev => {
                const activeOnes = prev.filter(
                    c => c.statusRaw === 'active' && c.processedLeads < c.totalLeads
                );
                if (activeOnes.length === 0) return prev;

                // Busca progresso de todas ativas em paralelo
                Promise.allSettled(activeOnes.map(c => getCampaignProgress(c.id)))
                    .then(results => {
                        setCampaigns(current =>
                            current.map(campaign => {
                                const idx = activeOnes.findIndex(a => a.id === campaign.id);
                                if (idx === -1) return campaign;
                                const result = results[idx];
                                if (result.status !== 'fulfilled' || !result.value?.success) return campaign;
                                const d = result.value.data;
                                const newStatusRaw = d.status ?? campaign.statusRaw;
                                return {
                                    ...campaign,
                                    processedLeads: d.processedLeads ?? campaign.processedLeads,
                                    totalLeads: d.totalLeads ?? campaign.totalLeads,
                                    sentCount: d.processedLeads ?? campaign.processedLeads,
                                    processingCompletedAt: d.processingCompletedAt || campaign.processingCompletedAt,
                                    statusRaw: newStatusRaw,
                                    statusBusiness: mapRawStatus(newStatusRaw),
                                };
                            })
                        );
                    });
                return prev;
            });
        }, 3000);
    }, []);

    const stopPolling = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    const resolveCampaignName = (campaignId, campaignNameFromRow = '') => {
        const rowName = String(campaignNameFromRow || '').trim();
        if (rowName) return rowName;

        const matchedCampaign = campaigns.find((c) => String(c?.id) === String(campaignId));
        const matchedName = String(matchedCampaign?.name || '').trim();
        if (matchedName) return matchedName;

        return `ID ${campaignId}`;
    };

    const handleDelete = async (campaignId, campaignNameFromRow = '') => {
        const campaignName = resolveCampaignName(campaignId, campaignNameFromRow);

        const confirmation = await showCustomAlert({
            variant: 'warning',
            title: 'Confirmar exclusão',
            text: `Tem certeza que quer excluir a campanha "${campaignName}"?\n\nEsta ação não pode ser desfeita.`,
            confirmButtonText: 'Deletar',
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
        });

        if (!confirmation.isConfirmed) return;

        try {
            setDeletingId(campaignId);
            const response = await deleteCampaign(campaignId);

            if (!response || response.success !== false) {
                await loadCampaigns();
                await showCustomAlert({
                    variant: 'success',
                    title: 'Sucesso',
                    text: 'Campanha deletada com sucesso!',
                });
            } else {
                await showCustomAlert({
                    variant: 'danger',
                    title: 'Erro',
                    text: response?.message || 'Erro ao deletar campanha',
                });
            }
        } catch (error) {
            console.error('Erro ao deletar campanha:', error);
            await showCustomAlert({
                variant: 'danger',
                title: 'Erro',
                text: error?.message || 'Erro ao deletar campanha. Tente novamente.',
            });
        } finally {
            setDeletingId(null);
        }
    };

    const handleStart = async (campaignId, campaignNameFromRow = '') => {
        // Busca o preview de throttle antes de confirmar o disparo
        setPendingStartId(campaignId);
        setPreviewData(null);
        setPreviewLoading(true);
        setShowPreviewModal(true);
        try {
            const res = await getDispatchPreview(campaignId);
            if (res && typeof res.total === 'number') setPreviewData(res);
        } catch (e) {
            console.error('Erro ao buscar preview:', e);
        } finally {
            setPreviewLoading(false);
        }
    };

    const confirmStart = async () => {
        const campaignId = pendingStartId;
        setShowPreviewModal(false);
        setPendingStartId(null);
        setPreviewData(null);
        if (!campaignId) return;
        try {
            setProcessingId(campaignId);
            await startCampaign(campaignId);
            await loadCampaigns();
            await showCustomAlert({ variant: 'success', title: 'Sucesso', text: 'Campanha iniciada com sucesso!' });
        } catch (error) {
            console.error('Erro ao iniciar campanha:', error);
            let text = error?.message || 'Erro ao iniciar campanha.';
            if (text.includes('Config. de Disparo') || text.includes('não configurado') || text.includes('não configurada')) {
                text += ' Acesse o menu ADMIN > Config. de Disparo para configurar os números de voz e WhatsApp.';
            }
            await showCustomAlert({ variant: 'danger', title: 'Erro ao iniciar', text });
        } finally {
            setProcessingId(null);
        }
    };

    const handlePause = async (campaignId, campaignNameFromRow = '') => {
        const campaignName = resolveCampaignName(campaignId, campaignNameFromRow);

        const confirmation = await showCustomAlert({
            variant: 'warning',
            title: 'Pausar campanha',
            text: `Deseja pausar a campanha "${campaignName}"?`,
            confirmButtonText: 'Pausar',
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
        });

        if (!confirmation.isConfirmed) return;

        try {
            setProcessingId(campaignId);
            await pauseCampaign(campaignId);
            await loadCampaigns();
            await showCustomAlert({ variant: 'success', title: 'Sucesso', text: 'Campanha pausada com sucesso!' });
        } catch (error) {
            console.error('Erro ao pausar campanha:', error);
            await showCustomAlert({ variant: 'danger', title: 'Erro', text: error?.message || 'Erro ao pausar campanha.' });
        } finally {
            setProcessingId(null);
        }
    };

    const handleResume = async (campaignId, campaignNameFromRow = '') => {
        const campaignName = resolveCampaignName(campaignId, campaignNameFromRow);

        const confirmation = await showCustomAlert({
            variant: 'warning',
            title: 'Retomar campanha',
            text: `Deseja retomar a campanha "${campaignName}"?`,
            confirmButtonText: 'Retomar',
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
        });

        if (!confirmation.isConfirmed) return;

        try {
            setProcessingId(campaignId);
            await resumeCampaign(campaignId);
            await loadCampaigns();
            await showCustomAlert({ variant: 'success', title: 'Sucesso', text: 'Campanha retomada com sucesso!' });
        } catch (error) {
            console.error('Erro ao retomar campanha:', error);
            await showCustomAlert({ variant: 'danger', title: 'Erro', text: error?.message || 'Erro ao retomar campanha.' });
        } finally {
            setProcessingId(null);
        }
    };

    const handleStop = async (campaignId, campaignNameFromRow = '') => {
        const campaignName = resolveCampaignName(campaignId, campaignNameFromRow);

        const confirmation = await showCustomAlert({
            variant: 'warning',
            title: 'Parar campanha',
            text: `Deseja parar a campanha "${campaignName}"?\n\nEsta ação não pode ser desfeita.`,
            confirmButtonText: 'Parar',
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
        });

        if (!confirmation.isConfirmed) return;

        try {
            setProcessingId(campaignId);
            await stopCampaign(campaignId);
            await loadCampaigns();
            await showCustomAlert({ variant: 'success', title: 'Sucesso', text: 'Campanha parada com sucesso!' });
        } catch (error) {
            console.error('Erro ao parar campanha:', error);
            await showCustomAlert({ variant: 'danger', title: 'Erro', text: error?.message || 'Erro ao parar campanha.' });
        } finally {
            setProcessingId(null);
        }
    };

    const toggleTag = (tag) => {
        setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
    };

    const handleAddTag = () => {
        const cleanTag = String(tagInput || '').trim();
        if (!cleanTag) return;

        if (!availableTags.includes(cleanTag)) {
            setAvailableTags((prev) => [...prev, cleanTag]);
        }

        if (!activeTags.includes(cleanTag)) {
            setActiveTags((prev) => [...prev, cleanTag]);
        }

        setTagInput('');
    };

    const openResultsModal = async (campaign) => {
        setSelectedCampaign(campaign);
        setProgressData(null);
        setStatsData(null);
        setProgressLoading(true);
        setShowResultsModal(true);
        try {
            const [progressRes, statsRes] = await Promise.all([
                getCampaignProgress(campaign.id),
                getCampaignStats(campaign.id),
            ]);
            if (progressRes?.success) setProgressData(progressRes.data);
            if (statsRes?.success) setStatsData(statsRes.data);
        } catch (e) {
            console.error('Erro ao buscar dados da campanha:', e);
        } finally {
            setProgressLoading(false);
        }
    };

    useEffect(() => {
        if (status === 'authenticated') {
            loadCampaigns();
        } else if (status === 'guest') {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.reloadCampaigns = loadCampaigns;
        }
    }, []);

    // Inicia polling quando há campanhas ativas em disparo
    useEffect(() => {
        const hasActive = campaigns.some(
            c => c.statusRaw === 'active' && c.processedLeads < c.totalLeads
        );
        if (hasActive) {
            startPolling();
        } else {
            stopPolling();
        }
        return () => stopPolling();
    }, [campaigns, startPolling, stopPolling]);

    // Reseta para página 1 quando filtros mudam
    useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, dateFrom, dateTo, activeTags]);

    const filteredCampaigns = useMemo(() => {
        return campaigns.filter((campaign) => {
            const search = searchTerm.trim().toLowerCase();
            const matchesSearch =
                !search ||
                String(campaign?.name || '').toLowerCase().includes(search) ||
                String(campaign?.id || '').toLowerCase().includes(search);

            const matchesStatus = !statusFilter || campaign.statusBusiness === statusFilter;

            const createdAtDate = campaign?.createdAtDate instanceof Date ? campaign.createdAtDate : null;
            const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
            const toDate = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

            const matchesDateFrom = !fromDate || (createdAtDate && createdAtDate >= fromDate);
            const matchesDateTo = !toDate || (createdAtDate && createdAtDate <= toDate);

            const tags = Array.isArray(campaign.tags) ? campaign.tags : [];
            const matchesTags = activeTags.length === 0 || activeTags.every((tag) => tags.includes(tag));

            return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo && matchesTags;
        });
    }, [campaigns, searchTerm, statusFilter, dateFrom, dateTo, activeTags]);

    const totalPages = Math.max(1, Math.ceil(filteredCampaigns.length / PAGE_SIZE));
    const paginatedCampaigns = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredCampaigns.slice(start, start + PAGE_SIZE);
    }, [filteredCampaigns, currentPage]);

    const stats = useMemo(() => {
        const total = campaigns.length;
        const active = campaigns.filter((c) => c.statusBusiness === 'engajado').length;
        const totalLeads = campaigns.reduce((sum, c) => sum + Number(c.leadCount || 0), 0);
        const totalSent = campaigns.reduce((sum, c) => sum + Number(c.sentCount || 0), 0);
        const totalCredits = 5000;
        const creditsRemaining = 1000;
        const usedCredits = Math.max(0, totalCredits - creditsRemaining);
        const creditUsagePercent = totalCredits > 0 ? Math.min(100, Math.round((usedCredits / totalCredits) * 100)) : 0;

        return { total, active, totalLeads, totalSent, totalCredits, creditsRemaining, creditUsagePercent };
    }, [campaigns]);

    const openDuplicateModal = (campaign) => {
        setDuplicateSource({ id: campaign.id, name: campaign.name });
        setDuplicateCopyLeads(true);
        setShowDuplicateModal(true);
    };

    const handleDuplicate = async () => {
        if (!duplicateSource) return;
        setDuplicating(true);
        try {
            const res = await getCampaign(duplicateSource.id);
            if (!res?.success || !res?.data) throw new Error('Campanha não encontrada');
            const src = res.data;
            const metadata = src.metadata || {};

            // Detecta o tipo de forma robusta: campo direto > webhook URL > fallback whatsapp
            const webhookUrl = metadata.webhookUrl || metadata.n8nWebhookUrl || '';
            const campaignType =
                metadata.campaignType ||
                (webhookUrl.includes('ce0328f9-175e-4512-826f-979e5d592841') ? 'voice' :
                 webhookUrl.includes('outbound-whatsapp-campanha') ? 'whatsapp' : 'whatsapp');

            const webhooks = {
                voice: 'https://nexus-n8n.captain.nexusbr.ai/webhook/ce0328f9-175e-4512-826f-979e5d592841',
                whatsapp: 'https://nexus-n8n.captain.nexusbr.ai/webhook/outbound-whatsapp-campanha',
            };
            const selectedWebhook = webhooks[campaignType] || webhooks.whatsapp;

            const { triggerDate: _drop, ...restMeta } = metadata;

            // Valores válidos aceitos pelo backend DTO
            const VALID_KINDS = ['pesquisa', 'informativa', 'mobilizacao', 'evento', 'lembrete', 'outro'];
            const rawKind = (src.campaignKind || metadata.campaignKind || '').toLowerCase();
            const safeKind = VALID_KINDS.includes(rawKind) ? rawKind : 'informativa';

            const payload = {
                name: `${src.name} (cópia)`,
                prompt: src.prompt || ' ',
                campaignType,
                campaignKind: safeKind,
                metadata: {
                    ...restMeta,
                    campaignType,
                    webhookUrl: selectedWebhook,
                    n8nWebhookUrl: selectedWebhook,
                },
            };

            const createRes = await createCampaign(payload);
            if (!createRes?.success || !createRes?.data?.id) {
                console.error('[Duplicate] createCampaign falhou:', JSON.stringify(createRes));
                throw new Error(createRes?.message || JSON.stringify(createRes) || 'Erro ao criar cópia');
            }
            const newId = createRes.data.id;

            if (duplicateCopyLeads && src.leadIds?.length > 0) {
                await addLeadsToCampaign(newId, src.leadIds);
            }

            setShowDuplicateModal(false);
            setDuplicateSource(null);
            await loadCampaigns();
            await showCustomAlert({
                variant: 'success',
                title: 'Campanha duplicada!',
                text: `"${payload.name}" criada como rascunho. Defina a data e inicie quando quiser.`,
            });
            router.push(`/apps/campaigns/${newId}`);
        } catch (err) {
            console.error('Erro ao duplicar campanha:', err);
            await showCustomAlert({
                variant: 'danger',
                title: 'Erro ao duplicar',
                text: err?.message || 'Não foi possível duplicar a campanha.',
            });
        } finally {
            setDuplicating(false);
        }
    };

    return (
        <>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .campaign-soft-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    border-radius: 999px;
                    font-size: 11px;
                    line-height: 1;
                    padding: 6px 11px;
                    border-width: 1px;
                    border-style: solid;
                    font-weight: 600;
                    white-space: nowrap;
                }
                .campaign-badge--wa { background: #d1fae5; border-color: #a7f3d0; color: #047857 !important; }
                .campaign-badge--voz { background: #e0e7ff; border-color: #c7d2fe; color: #3730a3 !important; }
                .campaign-badge--novo { background: #dbeafe; border-color: #bfdbfe; color: #0369a1 !important; }
                .campaign-badge--abordado { background: #fef3c7; border-color: #fde68a; color: #b45309 !important; }
                .campaign-badge--engajado { background: #d1fae5; border-color: #a7f3d0; color: #047857 !important; }
                .campaign-badge--prioritario { background: #ede9fe; border-color: #ddd6fe; color: #6d28d9 !important; }
                .campaign-badge--fora { background: #f3f4f6; border-color: #e5e7eb; color: #4b5563 !important; }
                .campaign-badge--convertido { background: #e0f2fe; border-color: #bae6fd; color: #0c4a6e !important; }
                .campaign-badge--encerrado { background: #f1f5f9; border-color: #e2e8f0; color: #475569 !important; }
                .campaign-filter-btn {
                    background: var(--bs-body-bg) !important;
                    border: 1px solid var(--bs-border-color) !important;
                    color: var(--bs-body-color) !important;
                }
                .campaign-filter-btn:hover,
                .campaign-filter-btn:focus,
                .campaign-filter-btn:active,
                .campaign-filter-btn.show {
                    background: var(--bs-tertiary-bg, var(--bs-body-bg)) !important;
                    border-color: var(--bs-border-color-translucent) !important;
                    color: var(--bs-body-color) !important;
                    box-shadow: none !important;
                }
                .campaign-action-btn {
                    background: transparent !important;
                    border: 1px solid transparent !important;
                    color: var(--bs-secondary-color) !important;
                    box-shadow: none !important;
                    padding: 5px 8px !important;
                }
                .campaign-action-btn svg {
                    width: 16px !important;
                    height: 16px !important;
                }
                .campaign-action-btn:hover,
                .campaign-action-btn:focus,
                .campaign-action-btn:active {
                    background: var(--bs-tertiary-bg) !important;
                    border-color: var(--bs-border-color) !important;
                    color: var(--bs-body-color) !important;
                }
                /* ── Dark mode overrides ── */
                [data-bs-theme="dark"] .campaign-badge--wa { background: #0a2e1e !important; border-color: #0d4a2a !important; color: #4ade80 !important; }
                [data-bs-theme="dark"] .campaign-badge--voz { background: #1a1640 !important; border-color: #2d2880 !important; color: #a5b4fc !important; }
                [data-bs-theme="dark"] .campaign-badge--novo { background: #0c1e3a !important; border-color: #1e3a6e !important; color: #60a5fa !important; }
                [data-bs-theme="dark"] .campaign-badge--abordado { background: #2a1e00 !important; border-color: #4a3500 !important; color: #fbbf24 !important; }
                [data-bs-theme="dark"] .campaign-badge--engajado { background: #0a2e1e !important; border-color: #0d4a2a !important; color: #4ade80 !important; }
                [data-bs-theme="dark"] .campaign-badge--prioritario { background: #1e1040 !important; border-color: #3b1f8c !important; color: #c4b5fd !important; }
                [data-bs-theme="dark"] .campaign-badge--fora { background: #252a3a !important; border-color: #2a2f3d !important; color: #9ca3af !important; }
                [data-bs-theme="dark"] .campaign-badge--convertido { background: #0a1e30 !important; border-color: #0e3a5a !important; color: #38bdf8 !important; }
                [data-bs-theme="dark"] .campaign-badge--encerrado { background: #1e2130 !important; border-color: #2a2f3d !important; color: #94a3b8 !important; }
                [data-bs-theme="dark"] .campaign-filter-btn {
                    background: #252a3a !important;
                    border-color: #2a2f3d !important;
                    color: #c9d1e0 !important;
                }
                [data-bs-theme="dark"] .campaign-filter-btn:hover,
                [data-bs-theme="dark"] .campaign-filter-btn:focus,
                [data-bs-theme="dark"] .campaign-filter-btn:active,
                [data-bs-theme="dark"] .campaign-filter-btn.show {
                    background: #2d3348 !important;
                    border-color: #3a4054 !important;
                    color: #dde3ef !important;
                    box-shadow: none !important;
                }
                [data-bs-theme="dark"] .campaign-action-btn {
                    color: #8d97b0 !important;
                }
                [data-bs-theme="dark"] .campaign-action-btn:hover,
                [data-bs-theme="dark"] .campaign-action-btn:focus,
                [data-bs-theme="dark"] .campaign-action-btn:active {
                    background: #252a3a !important;
                    border-color: #2a2f3d !important;
                    color: #dde3ef !important;
                }
                .campaign-table {
                    min-width: 1220px;
                }
                .campaign-actions {
                    display: flex;
                    align-items: center;
                    gap: 3px;
                    flex-wrap: nowrap;
                    white-space: nowrap;
                }
            `}</style>
            <div className="contact-body">
                <SimpleBar className="nicescroll-bar">
                    <div className="contact-list-view">
                        <Row className="mb-4">
                            <Col md={3} sm={6} className="mb-3">
                                <Card className="border-0 shadow-sm">
                                    <Card.Body className="d-flex align-items-center justify-content-between">
                                        <div>
                                            <div className="text-muted fs-8">Total de Campanhas</div>
                                            <div className="fs-3 fw-bold">{stats.total}</div>
                                        </div>
                                        <div className="avatar avatar-sm bg-primary text-white"><span className="initial-wrap">C</span></div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3} sm={6} className="mb-3">
                                <Card className="border-0 shadow-sm">
                                    <Card.Body className="d-flex align-items-center justify-content-between">
                                        <div>
                                            <div className="text-muted fs-8">Campanhas Ativas</div>
                                            <div className="fs-3 fw-bold">{stats.active}</div>
                                        </div>
                                        <div className="avatar avatar-sm bg-success text-white"><span className="initial-wrap">A</span></div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3} sm={6} className="mb-3">
                                <Card className="border-0 shadow-sm">
                                    <Card.Body className="d-flex align-items-center justify-content-between">
                                        <div>
                                            <div className="text-muted fs-8">Total de Leads</div>
                                            <div className="fs-3 fw-bold">{stats.totalLeads}</div>
                                        </div>
                                        <div className="avatar avatar-sm bg-info text-white"><span className="initial-wrap">L</span></div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3} sm={6} className="mb-3">
                                <Card className="border-0 shadow-sm">
                                    <Card.Body className="d-flex align-items-center justify-content-between">
                                        <div>
                                            <div className="text-muted fs-8">Mensagens Enviadas</div>
                                            <div className="fs-3 fw-bold">{stats.totalSent}</div>
                                        </div>
                                        <div className="avatar avatar-sm bg-warning text-white"><span className="initial-wrap">M</span></div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        <div className="d-flex align-items-center justify-content-end gap-3 mb-3">
                            <div className="d-flex align-items-center gap-3">
                                <div className="d-flex align-items-center gap-1 small text-muted">
                                    <Activity size={13} style={{ color: '#f59e0b' }} />
                                    <span>Créditos Restantes:</span>
                                    <strong>{stats.creditsRemaining.toLocaleString('pt-BR')}</strong>
                                </div>
                                <div className="small text-muted">
                                    Totais:
                                    <strong className="ms-1">{stats.totalCredits.toLocaleString('pt-BR')}</strong>
                                </div>
                                <div
                                    className="rounded-pill"
                                    style={{ width: 56, height: 6, backgroundColor: 'var(--bs-tertiary-bg)', overflow: 'hidden' }}
                                >
                                    <div
                                        style={{
                                            width: `${stats.creditUsagePercent}%`,
                                            height: '100%',
                                            backgroundColor: '#f59e0b',
                                            borderRadius: 999,
                                        }}
                                    />
                                </div>
                            </div>
                            <Button variant="outline-secondary" size="sm" className="d-inline-flex align-items-center gap-1 px-3 fw-semibold">
                                <ShoppingCart size={14} />
                                Comprar Créditos
                            </Button>
                        </div>

                        <Card className="border-0 shadow-sm">
                            <Card.Body>
                                <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
                                    <div className="d-flex flex-wrap align-items-end gap-2">
                                        <div style={{ width: 145 }}>
                                            <Form.Label className="mb-1">Status</Form.Label>
                                            <Dropdown>
                                                <Dropdown.Toggle
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    className="w-100 d-flex justify-content-between align-items-center campaign-filter-btn no-caret"
                                                >
                                                    <span>{STATUS_OPTIONS.find((s) => s.key === statusFilter)?.label || 'Todos os Status'}</span>
                                                    <ChevronDown size={14} />
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu className="w-100">
                                                    {STATUS_OPTIONS.map((option) => (
                                                        <Dropdown.Item
                                                            key={option.key || 'all'}
                                                            active={statusFilter === option.key}
                                                            onClick={() => setStatusFilter(option.key)}
                                                        >
                                                            {option.label}
                                                        </Dropdown.Item>
                                                    ))}
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </div>

                                        <div style={{ width: 145 }}>
                                            <Form.Label className="mb-1">Data De</Form.Label>
                                            <Form.Control size="sm" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                                        </div>

                                        <div style={{ width: 145 }}>
                                            <Form.Label className="mb-1">Data Até</Form.Label>
                                            <Form.Control size="sm" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                                        </div>

                                        <div style={{ width: 98 }}>
                                            <Button
                                                size="sm"
                                                variant="outline-secondary"
                                                onClick={handleRefresh}
                                                disabled={refreshing || loading}
                                                className="w-100 campaign-filter-btn"
                                            >
                                                <RefreshCw
                                                    size={14}
                                                    style={refreshing ? { animation: 'spin 1s linear infinite', display: 'inline-block' } : {}}
                                                />
                                                <span className="ms-1">Atualizar</span>
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="d-flex flex-wrap align-items-end gap-2">
                                        <div style={{ width: 110 }}>
                                            <Dropdown show={showTagsMenu} onToggle={(isOpen) => setShowTagsMenu(isOpen)} autoClose="outside">
                                                <Dropdown.Toggle size="sm" variant="outline-secondary" className="w-100 campaign-filter-btn">
                                                    <Tag size={14} className="me-1" />
                                                    Tags
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu style={{ minWidth: 280 }} className="p-2">
                                                    <div className="d-flex gap-2 mb-2">
                                                        <Form.Control
                                                            size="sm"
                                                            placeholder="Criar nova tag..."
                                                            value={tagInput}
                                                            onChange={(e) => setTagInput(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    handleAddTag();
                                                                }
                                                            }}
                                                        />
                                                        <Button size="sm" onClick={handleAddTag}>
                                                            <Plus size={14} />
                                                        </Button>
                                                    </div>
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {availableTags.map((tag) => (
                                                            <Button
                                                                key={tag}
                                                                size="sm"
                                                                variant={activeTags.includes(tag) ? 'primary' : 'light'}
                                                                className="rounded-pill"
                                                                onClick={() => toggleTag(tag)}
                                                            >
                                                                <Tag size={12} className="me-1" />
                                                                {tag}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </div>

                                        <div style={{ width: 270 }}>
                                            <div className="position-relative">
                                                <Search size={14} className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted" />
                                                <Form.Control
                                                    size="sm"
                                                    type="search"
                                                    className="ps-4"
                                                    placeholder="Buscar por nome ou ID..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Legenda dos botões de ação */}
                                <div className="d-flex flex-wrap align-items-center gap-3 mb-2 pb-2" style={{ borderBottom: '1px solid var(--bs-border-color)', fontSize: 11, color: 'var(--bs-secondary-color)' }}>
                                    <span style={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: 10 }}>Ações:</span>
                                    <span className="d-flex align-items-center gap-1"><Edit size={12} /> Editar</span>
                                    <span className="d-flex align-items-center gap-1"><Play size={12} /> Iniciar</span>
                                    <span className="d-flex align-items-center gap-1"><Pause size={12} /> Pausar</span>
                                    <span className="d-flex align-items-center gap-1"><RotateCw size={12} /> Retomar</span>
                                    <span className="d-flex align-items-center gap-1"><Square size={12} /> Encerrar</span>
                                    <span className="d-flex align-items-center gap-1"><Copy size={12} /> Reaproveitar</span>
                                    <span className="d-flex align-items-center gap-1"><Trash size={12} /> Excluir</span>
                                    <span className="d-flex align-items-center gap-1" style={{ background: 'var(--bs-tertiary-bg)', borderRadius: 4, padding: '1px 6px', border: '1px solid var(--bs-border-color)' }}>Resultados</span>
                                    <span>→ ver estatísticas</span>
                                </div>

                                <div className="table-responsive">
                                    <Table hover className="align-middle mb-0 campaign-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: 36 }}><Form.Check /></th>
                                                <th>TIPO</th>
                                                <th>NOME</th>
                                                <th>STATUS</th>
                                                <th>LEADS</th>
                                                <th>ENVIADOS</th>
                                                <th>PROGRESSO</th>
                                                <th>DATA DE CRIAÇÃO</th>
                                                <th>AGENDADO PARA</th>
                                                <th style={{ minWidth: 320 }}>AÇÕES</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading && (
                                                <tr>
                                                    <td colSpan={10} className="text-center py-5">Carregando campanhas...</td>
                                                </tr>
                                            )}

                                            {!loading && filteredCampaigns.length === 0 && (
                                                <tr>
                                                    <td colSpan={10} className="text-center py-5">Nenhuma campanha encontrada</td>
                                                </tr>
                                            )}

                                            {!loading && paginatedCampaigns.map((campaign) => {
                                                const statusMeta = getStatusMeta(campaign.statusBusiness);
                                                const typeMeta = getTypeMeta(campaign);
                                const isProcessing = processingId === campaign.id;
                                const progress = campaign.totalLeads > 0
                                    ? Math.min(100, Math.round((campaign.processedLeads / campaign.totalLeads) * 100))
                                    : 0;
                                // Só anima se o disparo foi iniciado e ainda não concluído
                                const isDispatching = campaign.statusRaw === 'active'
                                    && !!campaign.processingStartedAt
                                    && !campaign.processingCompletedAt
                                    && campaign.processedLeads < campaign.totalLeads
                                    && campaign.totalLeads > 0;

                                                const canStart = campaign.statusRaw === 'draft' || campaign.statusBusiness === 'novo';
                                                const canPause = campaign.statusRaw === 'active' || campaign.statusBusiness === 'engajado';
                                                const canResume = campaign.statusRaw === 'paused' || campaign.statusBusiness === 'abordado';
                                                const canStop = canPause || canResume;

                                                const TypeIcon = typeMeta.icon;

                                                return (
                                                    <tr key={campaign.id}>
                                                        <td><Form.Check /></td>
                                                        <td>
                                                            <span className={`campaign-soft-badge ${typeMeta.className}`}>
                                                                <TypeIcon size={12} className="me-1" />
                                                                {typeMeta.label}
                                                            </span>
                                                        </td>
                                                        <td className="fw-semibold">{campaign.name}</td>
                                                        <td>
                                                            <span className={`campaign-soft-badge ${statusMeta.className}`}>{statusMeta.label}</span>
                                                        </td>
                                                        <td>{campaign.leadCount}</td>
                                                        <td>{campaign.sentCount}</td>
                                        <td style={{ minWidth: 170 }}>
                                            <div className="d-flex align-items-center gap-2">
                                                <small className="text-nowrap text-muted">{progress}%</small>
                                                <ProgressBar
                                                    now={progress}
                                                    animated={isDispatching}
                                                    striped={isDispatching}
                                                    variant={isDispatching ? 'primary' : progress === 100 ? 'success' : 'secondary'}
                                                    className="w-100"
                                                    style={{ height: 6 }}
                                                />
                                            </div>
                                            {isDispatching && (
                                                <small className="text-primary" style={{ fontSize: 10 }}>
                                                    {campaign.processedLeads}/{campaign.totalLeads} enviados...
                                                </small>
                                            )}
                                        </td>
                                                        <td>{campaign.createdAt}</td>
                                                        <td style={{ whiteSpace: 'nowrap' }}>
                                                            {campaign.scheduledFor ? (
                                                                <span style={{ fontSize: 12, background: 'rgba(251,191,36,0.12)', color: '#b45309', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 999, padding: '2px 8px', fontWeight: 600 }}>
                                                                    ⏰ {campaign.scheduledFor}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted" style={{ fontSize: 12 }}>—</span>
                                                            )}
                                                        </td>
                                                        <td style={{ whiteSpace: 'nowrap' }}>
                                                            <div className="campaign-actions">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline-primary"
                                                                    onClick={() => router.push(`/apps/campaigns/${campaign.id}/monitor`)}
                                                                    disabled={isProcessing}
                                                                    className="campaign-action-btn"
                                                                    title="Monitorar disparo"
                                                                >
                                                                    📊
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline-secondary"
                                                                    onClick={() => router.push(`/apps/campaigns/${campaign.id}`)}
                                                                    disabled={isProcessing}
                                                                    className="campaign-action-btn"
                                                                >
                                                                    <Edit size={14} />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline-secondary"
                                                                    onClick={() => handleStart(campaign.id, campaign.name)}
                                                                    disabled={isProcessing || !canStart}
                                                                    className="campaign-action-btn"
                                                                >
                                                                    <Play size={14} />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline-secondary"
                                                                    onClick={() => handlePause(campaign.id, campaign.name)}
                                                                    disabled={isProcessing || !canPause}
                                                                    className="campaign-action-btn"
                                                                >
                                                                    <Pause size={14} />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline-secondary"
                                                                    onClick={() => handleResume(campaign.id, campaign.name)}
                                                                    disabled={isProcessing || !canResume}
                                                                    className="campaign-action-btn"
                                                                >
                                                                    <RotateCw size={14} />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline-secondary"
                                                                    onClick={() => handleStop(campaign.id, campaign.name)}
                                                                    disabled={isProcessing || !canStop}
                                                                    className="campaign-action-btn"
                                                                >
                                                                    <Square size={14} />
                                                                </Button>
                                                                <Button size="sm" variant="outline-secondary" disabled={isProcessing} onClick={() => openDuplicateModal(campaign)} className="campaign-action-btn" title="Duplicar campanha">
                                                                    <Copy size={14} />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline-secondary"
                                                                    onClick={() => handleDelete(campaign.id, campaign.name)}
                                                                    disabled={deletingId === campaign.id || isProcessing}
                                                                    className="campaign-action-btn"
                                                                >
                                                                    <Trash size={14} />
                                                                </Button>
                                                                <Button size="sm" variant="outline-dark" className="text-nowrap" style={{ padding: '5px 10px', fontSize: '0.8rem' }} onClick={() => openResultsModal(campaign)}>
                                                                    Resultados
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </Table>
                                </div>

                                <div className="d-flex justify-content-between align-items-center mt-3 text-muted small">
                                    <span>
                                        {filteredCampaigns.length === 0 ? '0' : `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filteredCampaigns.length)}`}
                                        {' '}de {filteredCampaigns.length}
                                        {filteredCampaigns.length !== campaigns.length && ` (filtrado de ${campaigns.length})`}
                                    </span>
                                    <div className="d-flex align-items-center gap-1">
                                        <Button
                                            size="sm"
                                            variant="flush-dark"
                                            className="btn-icon p-0 text-muted"
                                            disabled={currentPage <= 1}
                                            onClick={() => setCurrentPage(1)}
                                            title="Primeira página"
                                        >
                                            <ChevronLeft size={14} />
                                            <ChevronLeft size={14} style={{ marginLeft: -8 }} />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="flush-dark"
                                            className="btn-icon p-0 text-muted"
                                            disabled={currentPage <= 1}
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            title="Página anterior"
                                        >
                                            <ChevronLeft size={16} />
                                        </Button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                            .reduce((acc, p, idx, arr) => {
                                                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                                                acc.push(p);
                                                return acc;
                                            }, [])
                                            .map((item, idx) =>
                                                item === '...'
                                                    ? <span key={`ellipsis-${idx}`} className="px-1 text-muted">…</span>
                                                    : <Button
                                                        key={item}
                                                        size="sm"
                                                        variant={currentPage === item ? 'success' : 'flush-dark'}
                                                        className={`rounded-pill px-2 ${currentPage !== item ? 'text-muted' : ''}`}
                                                        style={{ minWidth: 28 }}
                                                        onClick={() => setCurrentPage(item)}
                                                    >
                                                        {item}
                                                    </Button>
                                            )
                                        }
                                        <Button
                                            size="sm"
                                            variant="flush-dark"
                                            className="btn-icon p-0 text-muted"
                                            disabled={currentPage >= totalPages}
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            title="Próxima página"
                                        >
                                            <ChevronRight size={16} />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="flush-dark"
                                            className="btn-icon p-0 text-muted"
                                            disabled={currentPage >= totalPages}
                                            onClick={() => setCurrentPage(totalPages)}
                                            title="Última página"
                                        >
                                            <ChevronRight size={14} />
                                            <ChevronRight size={14} style={{ marginLeft: -8 }} />
                                        </Button>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                </SimpleBar>
            </div>

            <Modal show={showResultsModal} onHide={() => setShowResultsModal(false)} centered size="lg">
                <Modal.Header className="border-0 pb-0">
                    <div className="d-flex align-items-center gap-2">
                        <BarChart2 size={18} />
                        <Modal.Title as="h5">Resultados — {selectedCampaign?.name || 'Campanha'}</Modal.Title>
                    </div>
                    <Button size="sm" variant="light" className="btn-icon" onClick={() => setShowResultsModal(false)}>
                        <X size={16} />
                    </Button>
                </Modal.Header>
                <Modal.Body>
                    {selectedCampaign && (() => {
                        const typeMeta = getTypeMeta(selectedCampaign);
                        const p = progressData;
                        const total = p?.totalLeads ?? selectedCampaign.totalLeads ?? 0;
                        const processed = p?.processedLeads ?? selectedCampaign.processedLeads ?? 0;
                        const pct = p?.percentComplete ?? (total > 0 ? Math.round((processed / total) * 100) : 0);
                        const failed = p?.queueFailed ?? 0;
                        const waiting = p?.queueWaiting ?? 0;
                        const active = p?.queueActive ?? 0;
                        // isDispatching = fila tem jobs reais em execução (source of truth)
                        const isDispatching = waiting > 0 || active > 0;
                        const isComplete = !isDispatching && (!!p?.processingCompletedAt || pct === 100);

                        const fmtDate = (iso) => {
                            if (!iso) return null;
                            return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
                        };

                        return (
                            <>
                                {/* Badge tipo + status */}
                                <div className="d-flex align-items-center gap-2 mb-4">
                                    <span className={`campaign-soft-badge ${typeMeta.className}`}>{typeMeta.label}</span>
                                    {isDispatching && (
                                        <span className="campaign-soft-badge campaign-badge--novo">
                                            <RefreshCw size={10} style={{ animation: 'spin 1s linear infinite' }} className="me-1" />
                                            Disparando...
                                        </span>
                                    )}
                                    {isComplete && (
                                        <span className="campaign-soft-badge campaign-badge--convertido">Concluído</span>
                                    )}
                                    {!isDispatching && !isComplete && total === 0 && (
                                        <span className="campaign-soft-badge campaign-badge--abordado">Aguardando disparo</span>
                                    )}
                                </div>

                                {/* Progresso de disparo */}
                                <div className="mb-4">
                                    <div className="text-uppercase fw-semibold text-muted small mb-2">Progresso de Disparo</div>
                                    {progressLoading ? (
                                        <div className="text-muted small">Carregando...</div>
                                    ) : (
                                        <>
                                            <div className="d-flex justify-content-between align-items-center small mb-1">
                                                <span className="text-muted">
                                                    {processed.toLocaleString('pt-BR')} de {total.toLocaleString('pt-BR')} leads processados
                                                </span>
                                                <strong>{pct}%</strong>
                                            </div>
                                            <ProgressBar
                                                now={pct}
                                                animated={isDispatching}
                                                striped={isDispatching}
                                                variant={isDispatching ? 'primary' : pct === 100 ? 'success' : 'secondary'}
                                                style={{ height: 10, borderRadius: 6 }}
                                            />
                                        </>
                                    )}
                                </div>

                                {/* Detalhes da fila */}
                                <div className="mb-4">
                                    <div className="text-uppercase fw-semibold text-muted small mb-2">Detalhes da Fila</div>
                                    {progressLoading ? (
                                        <div className="text-muted small">Carregando...</div>
                                    ) : (
                                        <Row className="g-2">
                                            <Col xs={6} md={3}>
                                                <Card className="border-0" style={{ background: 'var(--bs-tertiary-bg)' }}>
                                                    <Card.Body className="text-center py-2 px-1">
                                                        <div className="small text-muted text-uppercase" style={{ fontSize: 10 }}>Na fila</div>
                                                        <div className="fw-bold text-warning fs-5">{waiting}</div>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col xs={6} md={3}>
                                                <Card className="border-0" style={{ background: 'var(--bs-tertiary-bg)' }}>
                                                    <Card.Body className="text-center py-2 px-1">
                                                        <div className="small text-muted text-uppercase" style={{ fontSize: 10 }}>Ativos</div>
                                                        <div className="fw-bold text-primary fs-5">{active}</div>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col xs={6} md={3}>
                                                <Card className="border-0" style={{ background: 'var(--bs-tertiary-bg)' }}>
                                                    <Card.Body className="text-center py-2 px-1">
                                                        <div className="small text-muted text-uppercase" style={{ fontSize: 10 }}>Processados</div>
                                                        <div className="fw-bold text-success fs-5">{processed}</div>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col xs={6} md={3}>
                                                <Card className="border-0" style={{ background: 'var(--bs-tertiary-bg)' }}>
                                                    <Card.Body className="text-center py-2 px-1">
                                                        <div className="small text-muted text-uppercase" style={{ fontSize: 10 }}>Falharam</div>
                                                        <div className={`fw-bold fs-5 ${failed > 0 ? 'text-danger' : 'text-success'}`}>{failed}</div>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        </Row>
                                    )}
                                </div>

                                {/* Estatísticas de Entrega */}
                                <div className="mb-4">
                                    <div className="text-uppercase fw-semibold text-muted small mb-2">Estatísticas de Entrega</div>
                                    {progressLoading ? (
                                        <div className="text-muted small">Carregando...</div>
                                    ) : statsData ? (
                                        <>
                                            <Row className="g-2 mb-2">
                                                <Col xs={6} md={3}>
                                                    <Card className="border-0" style={{ background: 'var(--bs-tertiary-bg)' }}>
                                                        <Card.Body className="text-center py-2 px-1">
                                                            <div className="small text-muted text-uppercase" style={{ fontSize: 10 }}>Enviados</div>
                                                            <div className="fw-bold text-success fs-5">{statsData.sentCount ?? 0}</div>
                                                        </Card.Body>
                                                    </Card>
                                                </Col>
                                                <Col xs={6} md={3}>
                                                    <Card className="border-0" style={{ background: 'var(--bs-tertiary-bg)' }}>
                                                        <Card.Body className="text-center py-2 px-1">
                                                            <div className="small text-muted text-uppercase" style={{ fontSize: 10 }}>Entregues</div>
                                                            <div className="fw-bold text-primary fs-5">{statsData.deliveredCount ?? 0}</div>
                                                        </Card.Body>
                                                    </Card>
                                                </Col>
                                                <Col xs={6} md={3}>
                                                    <Card className="border-0" style={{ background: 'var(--bs-tertiary-bg)' }}>
                                                        <Card.Body className="text-center py-2 px-1">
                                                            <div className="small text-muted text-uppercase" style={{ fontSize: 10 }}>Bloqueados</div>
                                                            <div className={`fw-bold fs-5 ${(statsData.skippedCount ?? 0) > 0 ? 'text-warning' : 'text-success'}`}>
                                                                {statsData.skippedCount ?? 0}
                                                            </div>
                                                        </Card.Body>
                                                    </Card>
                                                </Col>
                                                <Col xs={6} md={3}>
                                                    <Card className="border-0" style={{ background: 'var(--bs-tertiary-bg)' }}>
                                                        <Card.Body className="text-center py-2 px-1">
                                                            <div className="small text-muted text-uppercase" style={{ fontSize: 10 }}>Erros</div>
                                                            <div className={`fw-bold fs-5 ${(statsData.errorCount ?? 0) > 0 ? 'text-danger' : 'text-success'}`}>
                                                                {statsData.errorCount ?? 0}
                                                            </div>
                                                        </Card.Body>
                                                    </Card>
                                                </Col>
                                            </Row>
                                            {(statsData.skippedCount ?? 0) > 0 && (
                                                <div className="d-flex align-items-center gap-2 p-2 rounded small" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)' }}>
                                                    <span style={{ fontSize: 16 }}>⚠️</span>
                                                    <span className="text-warning-emphasis">
                                                        <strong>{statsData.skippedCount}</strong> lead(s) bloqueados pelo limite diário de mensagens.
                                                        Taxa de bloqueio: <strong>{(statsData.skipRate ?? 0).toFixed(1)}%</strong>
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-muted small">Sem dados de entrega disponíveis.</div>
                                    )}
                                </div>

                                {/* Timeline */}
                                {(p?.processingStartedAt || p?.processingCompletedAt) && (
                                    <div className="mb-3">
                                        <div className="text-uppercase fw-semibold text-muted small mb-2">Timeline</div>
                                        <div className="d-flex flex-column gap-1 small">
                                            {p?.processingStartedAt && (
                                                <div className="d-flex gap-2 align-items-center text-muted">
                                                    <Play size={12} className="text-primary flex-shrink-0" />
                                                    <span>Iniciado em <strong>{fmtDate(p.processingStartedAt)}</strong></span>
                                                </div>
                                            )}
                                            {p?.processingCompletedAt && (
                                                <div className="d-flex gap-2 align-items-center text-muted">
                                                    <Square size={12} className="text-success flex-shrink-0" />
                                                    <span>Concluído em <strong>{fmtDate(p.processingCompletedAt)}</strong></span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Rodapé */}
                                <div className="mt-3 pt-2 border-top d-flex justify-content-between small text-muted">
                                    <span>Criada em {selectedCampaign.createdAt}</span>
                                    <span>{total.toLocaleString('pt-BR')} leads</span>
                                </div>
                            </>
                        );
                    })()}
                </Modal.Body>
            </Modal>

            {/* Modal de Preview de Disparo */}
            <Modal show={showPreviewModal} onHide={() => { setShowPreviewModal(false); setPendingStartId(null); }} centered size="md">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fs-5 fw-bold">Confirmar Disparo</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-2 pb-3 px-4">
                    {previewLoading ? (
                        <div className="text-center py-4 text-muted">
                            <div className="spinner-border spinner-border-sm me-2" />
                            Verificando leads...
                        </div>
                    ) : previewData ? (
                        <>
                            {/* Resumo */}
                            <Row className="g-2 mb-3">
                                <Col xs={4}>
                                    <Card className="border-0 text-center" style={{ background: 'var(--bs-tertiary-bg)' }}>
                                        <Card.Body className="py-2 px-1">
                                            <div className="small text-muted" style={{ fontSize: 10 }}>TOTAL</div>
                                            <div className="fw-bold fs-4">{previewData.total}</div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col xs={4}>
                                    <Card className="border-0 text-center" style={{ background: 'var(--bs-tertiary-bg)' }}>
                                        <Card.Body className="py-2 px-1">
                                            <div className="small text-muted" style={{ fontSize: 10 }}>SERÃO ENVIADOS</div>
                                            <div className="fw-bold fs-4 text-success">{previewData.allowed}</div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col xs={4}>
                                    <Card className="border-0 text-center" style={{ background: previewData.skipped > 0 ? 'rgba(251,191,36,0.1)' : 'var(--bs-tertiary-bg)' }}>
                                        <Card.Body className="py-2 px-1">
                                            <div className="small text-muted" style={{ fontSize: 10 }}>BLOQUEADOS</div>
                                            <div className={`fw-bold fs-4 ${previewData.skipped > 0 ? 'text-warning' : 'text-success'}`}>{previewData.skipped}</div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {/* Alerta de bloqueio */}
                            {previewData.skipped > 0 && (
                                <div className="rounded p-3 mb-3 small" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.35)' }}>
                                    <div className="fw-semibold text-warning-emphasis mb-1">⚠️ Limite diário atingido</div>
                                    <div className="text-muted">
                                        <strong>{previewData.skipped}</strong> lead(s) já receberam o número máximo de mensagens hoje e serão ignorados.
                                        Apenas <strong>{previewData.allowed}</strong> lead(s) receberão esta mensagem.
                                    </div>
                                    {previewData.skippedLeads?.length > 0 && (
                                        <div className="mt-2">
                                            <div className="text-muted mb-1" style={{ fontSize: 11 }}>BLOQUEADOS:</div>
                                            <div className="d-flex flex-wrap gap-1">
                                                {previewData.skippedLeads.slice(0, 8).map((l, i) => (
                                                    <span key={i} className="badge bg-warning text-dark" style={{ fontSize: 11 }}>{l.name}</span>
                                                ))}
                                                {previewData.skippedLeads.length > 8 && (
                                                    <span className="badge bg-secondary" style={{ fontSize: 11 }}>+{previewData.skippedLeads.length - 8} mais</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {previewData.allowed === 0 ? (
                                <div className="text-center text-muted small py-2">
                                    Todos os leads estão bloqueados hoje. Tente novamente amanhã.
                                </div>
                            ) : (
                                <div className="small text-muted mb-1">
                                    Deseja iniciar o disparo para <strong>{previewData.allowed}</strong> lead(s)?
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-muted small text-center py-3">Erro ao carregar dados. Tente novamente.</div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="light" size="sm" onClick={() => { setShowPreviewModal(false); setPendingStartId(null); }}>
                        Cancelar
                    </Button>
                    <Button
                        variant="success"
                        size="sm"
                        disabled={previewLoading || !previewData || previewData.allowed === 0}
                        onClick={confirmStart}
                    >
                        <Play size={13} className="me-1" />
                        {previewData?.allowed === 0 ? 'Sem leads disponíveis' : `Disparar para ${previewData?.allowed ?? '...'} leads`}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de Duplicar Campanha */}
            <Modal
                show={showDuplicateModal}
                onHide={() => { if (!duplicating) { setShowDuplicateModal(false); setDuplicateSource(null); } }}
                centered
                size="sm"
            >
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fs-5 fw-bold d-flex align-items-center gap-2">
                        <Copy size={16} />
                        Duplicar Campanha
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4 py-3">
                    <p className="text-muted mb-3" style={{ fontSize: 14 }}>
                        Uma cópia de <strong>&quot;{duplicateSource?.name}&quot;</strong> será criada como rascunho, sem data de disparo.
                    </p>

                    <div
                        onClick={() => !duplicating && setDuplicateCopyLeads(!duplicateCopyLeads)}
                        style={{
                            cursor: duplicating ? 'default' : 'pointer',
                            border: `2px solid ${duplicateCopyLeads ? '#0d6efd' : 'var(--bs-border-color)'}`,
                            borderRadius: 10,
                            padding: '12px 14px',
                            background: duplicateCopyLeads ? 'rgba(13,110,253,0.08)' : 'var(--bs-body-bg)',
                            transition: 'all 0.15s',
                        }}
                    >
                        <div className="d-flex align-items-start gap-3">
                            <div style={{
                                width: 20, height: 20, borderRadius: 4, marginTop: 2, flexShrink: 0,
                                border: `2px solid ${duplicateCopyLeads ? '#0d6efd' : 'var(--bs-border-color)'}`,
                                background: duplicateCopyLeads ? '#0d6efd' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                {duplicateCopyLeads && (
                                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                                        <path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <div className="fw-semibold" style={{ fontSize: 14 }}>Copiar leads existentes</div>
                                <div className="text-muted" style={{ fontSize: 12 }}>Os mesmos leads da campanha original serão adicionados à cópia</div>
                            </div>
                        </div>
                    </div>

                    {!duplicateCopyLeads && (
                        <p className="text-muted mt-2 mb-0" style={{ fontSize: 12 }}>
                            A campanha será criada sem leads — você poderá adicionar novos na tela de edição.
                        </p>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0 px-4">
                    <Button
                        variant="light"
                        size="sm"
                        onClick={() => { setShowDuplicateModal(false); setDuplicateSource(null); }}
                        disabled={duplicating}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleDuplicate}
                        disabled={duplicating}
                    >
                        {duplicating ? (
                            <><span className="spinner-border spinner-border-sm me-2" />Duplicando...</>
                        ) : (
                            <><Copy size={13} className="me-1" />Duplicar</>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default CampaignListBody;
