'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Button, Card, Col, Form, Row } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faInstagram, faTiktok, faXTwitter, faYoutube } from '@fortawesome/free-brands-svg-icons';
import * as Icons from 'react-feather';
import classNames from 'classnames';
import SimpleBar from 'simplebar-react';
import { toast } from 'react-toastify';
import CrisisHeader from './CrisisHeader';
import CrisisSidebar from './CrisisSidebar';
import { supabase } from '@/lib/supabase';

const WEBHOOK_URL =
    process.env.NEXT_PUBLIC_CRISIS_WEBHOOK_URL ||
    'https://nexus-n8n.captain.nexusbr.ai/webhook/monitoramento-crise';
const TOPICS_KEY = 'crisis_monitoring_topics';

function loadTopics() {
    try {
        const raw = localStorage.getItem(TOPICS_KEY);
        if (raw) return JSON.parse(raw);
    } catch {}
    return [];
}

function saveTopics(topics) {
    localStorage.setItem(TOPICS_KEY, JSON.stringify(topics));
}

function formatCountdown(seconds) {
    const m = Math.floor(seconds / 60);
    return `${m}:${(seconds % 60).toString().padStart(2, '0')}`;
}

function formatBRDate(dateStr) {
    if (!dateStr) return null;
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;
        return d.toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return null;
    }
}

function parseRow(data) {
    return {
        profile: data.profile || {},
        thresholds: data.thresholds || {},
        summary: data.summary || {
            total_itens: 0,
            crise_direta: 0,
            tema_quente: 0,
            fora_de_escopo: 0,
            prioridade: { alta: 0, media: 0, baixa: 0 },
            sentimento: { negative: 0, neutral: 0, positive: 0 },
        },
        alerts: data.alerts || { crise: [], oportunidade: [] },
        highlights: data.highlights || [],
        monitorar: data.monitorar || [],
        items: data.items || [],
        meta: data.meta || {},
    };
}

const PORTAL_NAMES = {
    'g1.globo.com': 'G1',
    'oglobo.globo.com': 'O Globo',
    'globo.com': 'O Globo',
    'cnnbrasil.com.br': 'CNN Brasil',
    'folha.uol.com.br': 'Folha',
    'estadao.com.br': 'Estadão',
    'uol.com.br': 'UOL',
    'metropoles.com': 'Metrópoles',
    'terra.com.br': 'Terra',
    'r7.com': 'R7',
    'agenciabrasil': 'Agência Brasil',
    'bandnews': 'Band News',
    'ndmais.com.br': 'ND Mais',
    'instagram.com': 'Instagram',
    'facebook.com': 'Facebook',
    'twitter.com': 'X',
    'x.com': 'X',
    'tiktok.com': 'TikTok',
    'youtube.com': 'YouTube',
    'reddit.com': 'Reddit',
};

function getPortalName(url) {
    try {
        const hostname = new URL(url).hostname.replace('www.', '');
        for (const [key, name] of Object.entries(PORTAL_NAMES)) {
            if (hostname.includes(key)) return name;
        }
        const parts = hostname.split('.');
        return parts.length >= 2 ? parts[parts.length - 2] : hostname;
    } catch {
        return 'web';
    }
}

const SOCIAL_SOURCE_KEYS = ['instagram', 'facebook', 'tiktok', 'twitter', 'youtube', 'reddit', 'x.com', 'x_twitter'];
const SOCIAL_URL_DOMAINS = ['instagram.com', 'facebook.com', 'tiktok.com', 'twitter.com', 'x.com', 'youtube.com', 'reddit.com'];

function isSocialSource(source, url = '') {
    const s = (source || '').toLowerCase();
    const u = (url || '').toLowerCase();
    if (SOCIAL_SOURCE_KEYS.some((k) => s.includes(k))) return true;
    if (SOCIAL_URL_DOMAINS.some((d) => u.includes(d))) return true;
    return false;
}

function getFaviconUrl(url) {
    try {
        const origin = new URL(url).origin;
        return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(origin)}&size=128`;
    } catch {
        return null;
    }
}

function priorityTone(p) {
    return p === 'alta' ? 'danger' : p === 'media' ? 'warning' : 'success';
}

function priorityDotColor(p) {
    return p === 'alta' ? '#ef4444' : p === 'media' ? '#eab308' : '#0d9488';
}

const TONE_BG = { danger: '#fff7f8', warning: '#fffdf4', success: '#f5fbfa' };
const TONE_BORDER = { danger: '1px solid #fecdd3', warning: '1px solid #fde68a', success: '1px solid #99f6e4' };
const TONE_DOT = { danger: '#ef4444', warning: '#eab308', success: '#0d9488' };

const CRISIS_MOCK = {
    status: { label: 'ALERTA', variant: 'danger', subtitle: 'Status do Sistema' },
    stats: [
        { icon: 'Activity', value: '158', label: 'Incidentes Ativos', iconClass: 'text-danger' },
        { icon: 'Clock', value: '2h 34m', label: 'Tempo Médio', iconClass: 'text-success' },
        { icon: 'TrendingUp', value: '100', label: 'Últimas 24h', iconClass: 'text-warning' },
    ],
    crisisTypes: [
        { name: 'Manifestação', dotColor: '#ff8a00' },
        { name: 'Escândalo', dotColor: '#9b5de5' },
        { name: 'Desastre', dotColor: '#3b82f6' },
        { name: 'Violência', dotColor: '#ef4444' },
    ],
    recentTabs: [
        { key: '24h', label: 'Últimas 24 horas', total: 12 },
        { key: '7d', label: 'Últimos 7 dias', total: 47 },
        { key: '30d', label: 'Últimos 30 dias', total: 158 },
    ],
    recentByPeriod: {
        '24h': [
            { title: 'Novo protesto em frente à Câmara de Florianópolis', source: 'G1', age: '2h atrás', tone: 'danger' },
            { title: 'Porteiro divulga áudios sobre agressão ao cão', source: 'CNN Brasil', age: '5h atrás', tone: 'danger' },
            { title: 'Vereadores debatem projeto de lei sobre maus-tratos', source: 'Folha', age: '8h atrás', tone: 'warning' },
            { title: 'ONG protocola pedido de investigação ao MP', source: 'Agência Brasil', age: '12h atrás', tone: 'warning' },
        ],
        '7d': [
            { title: 'Manifestação reúne centenas em São Paulo', source: 'Agência Brasil', age: '2 dias atrás', tone: 'danger' },
            { title: 'Adolescente descartado como suspeito vira testemunha', source: 'G1', age: '3 dias atrás', tone: 'danger' },
            { title: 'Petição online atinge 500 mil assinaturas', source: 'O Globo', age: '4 dias atrás', tone: 'warning' },
            { title: 'Delegacia conclui inquérito parcial do caso', source: 'CNN Brasil', age: '5 dias atrás', tone: 'warning' },
            { title: 'Celebridades se manifestam nas redes sociais', source: 'Band News', age: '6 dias atrás', tone: 'success' },
        ],
        '30d': [
            { title: 'Caso Orelha: cão comunitário é encontrado agonizando', source: 'G1', age: '3 semanas atrás', tone: 'danger' },
            { title: 'Polícia Civil abre inquérito e identifica suspeitos', source: 'CNN Brasil', age: '3 semanas atrás', tone: 'danger' },
            { title: 'Eutanásia é realizada devido à gravidade das lesões', source: 'Agência Brasil', age: '3 semanas atrás', tone: 'danger' },
            { title: 'Primeiros protestos espontâneos em Florianópolis', source: 'Folha', age: '2 semanas atrás', tone: 'warning' },
            { title: 'Caso ganha repercussão nacional na mídia', source: 'O Globo', age: '2 semanas atrás', tone: 'warning' },
            { title: 'Redes sociais viralizam vídeos e depoimentos', source: 'Band News', age: '10 dias atrás', tone: 'success' },
        ],
    },
    monitoringCards: [
        { image: '/img/crisis/crisis-news-1.jpg', source: 'G1', title: 'Caso Orelha: veja linha do tempo com os acontecimentos e o que se sabe', age: '1 dia atrás', sourceClass: 'danger' },
        { image: '/img/crisis/crisis-news-2.jpg', source: 'G1', title: 'Caso Orelha: "Se eu tivesse visto batendo no cachorro, eu diria", diz porteiro', age: '1 dia atrás', sourceClass: 'danger' },
        { image: '/img/crisis/crisis-news-3.jpg', source: 'G1', title: 'Caso Orelha: veja linha do tempo com os acontecimentos e o que se sabe', age: '1 dia atrás', sourceClass: 'danger' },
        { image: '/img/crisis/crisis-news-4.jpg', source: 'Agência Brasil', title: 'Centenas de pessoas em São Paulo pedem justiça pelo cão Orelha', age: '1 dia atrás', sourceClass: 'success' },
        { image: '/img/crisis/crisis-news-5.jpg', source: 'CNN Brasil', title: 'Caso Orelha: porteiro divulga áudios sobre agressão em grupo de vigilantes', age: 'há 24 horas', sourceClass: 'danger' },
        { image: '/img/crisis/crisis-news-6.jpg', source: 'Agência Brasil', title: 'Centenas de pessoas em São Paulo pedem justiça pelo cão Orelha', age: '1 dia atrás', sourceClass: 'success' },
    ],
    sources: ['O Globo', 'Band News', 'CNN Brasil', 'G1', 'Agência Brasil', 'Folha de S.Paulo'],
    socials: [
        { image: '/img/crisis/crisis-social-1.jpg', platform: 'Facebook', text: 'DE QUE LADO VOCÊ ESTÁ?', author: 'Tânia Político' },
        { image: '/img/crisis/crisis-social-2.jpg', platform: 'Instagram', text: 'Adolescentes e pai são alvos da polícia após morte de cão em SC', author: '@jornal_local' },
        { image: '/img/crisis/crisis-social-3.jpg', platform: 'TikTok', text: 'ADRIANA ARAÚJO - CASO ORELHA: SE A IMPUNIDADE IMPERA...', author: '@portalnoticias' },
    ],
    summary: [
        'O caso do cachorro Orelha, um cão comunitário dócil que vivia há 10 anos na Praia Brava, em Florianópolis, gerou enorme comoção nacional e está sob intensa investigação policial neste início de 2026.',
        'A Notícia: O crime. No início de janeiro de 2026, Orelha foi brutalmente espancado na cabeça com instrumentos contundentes. Ele foi encontrado agonizando sob um carro e, devido à gravidade irreversível das lesões, precisou ser submetido à eutanásia.',
        'Suspeitos: A Polícia Civil identificou um grupo de adolescentes como os principais suspeitos das agressões. Recentemente, um dos jovens teve seu envolvimento descartado e passou a colaborar como testemunha.',
        'Repercussão: O caso mobilizou manifestações em diversas cidades, como São Paulo, pedindo justiça e leis mais rígidas contra maus-tratos. Há também alertas sobre redes online que podem estar lucrando com a divulgação de vídeos de tortura animal.',
    ],
    suggestion: {
        title: 'POST INSTAGRAM',
        intro: 'JUSTICA POR ORELHA',
        paragraph1: 'O caso do cãozinho Orelha nos comoveu profundamente. Um animal dócil, amado por toda a comunidade da Praia Brava, teve sua vida tirada de forma brutal e covarde.',
        paragraph2: 'Como pré-candidato a prefeito, eu, Marcos Almeida, me comprometo:',
        commitments: [
            'Fortalecer a fiscalização contra maus-tratos animais',
            'Criar o Programa Municipal de Proteção Animal',
            'Ampliar o atendimento veterinário público gratuito',
            'Apoiar ONGs e protetores independentes',
            'Endurecer as penalidades para crimes contra animais',
        ],
        paragraph3: 'Orelha não será esquecido. Sua história nos impulsiona a lutar por uma cidade mais justa e compassiva para TODOS os seres vivos.',
        paragraph4: 'A causa animal é uma causa de todos nós. Quem maltrata um animal, maltrata a sociedade.',
        hashtags: '#JusticaPorOrelha #CausaAnimal #MarcosAlmeida #Prefeito #ProtejaNossosAnimais #Florianópolis #PraiaBrava #NaoAosMausTratos #DireitosAnimais #OrelhaVive',
        artImage: '/img/crisis/crisis-response-post.jpg',
    },
};

const CrisisDashboard = () => {
    const [showSidebar, setShowSidebar] = useState(true);
    const [activeTab, setActiveTab] = useState('24h');
    const [subjectInput, setSubjectInput] = useState('');
    const [monitoredSubjects, setMonitoredSubjects] = useState(loadTopics);
    const [analysisData, setAnalysisData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [lastAnalyzed, setLastAnalyzed] = useState(null);
    const [windowDays, setWindowDays] = useState(7);
    const [maxResults, setMaxResults] = useState(50);
    const [typeFilter, setTypeFilter] = useState('all');
    const [newsPage, setNewsPage] = useState(1);
    const [socialPage, setSocialPage] = useState(1);
    const NEWS_PAGE_SIZE = 9;
    const countdownRef = useRef(null);
    const pollingRef = useRef(null);

    const firstTopic = monitoredSubjects[0];

    // Load latest completed analysis from Supabase on mount / when first topic changes
    useEffect(() => {
        if (!supabase || !firstTopic) return;
        let cancelled = false;
        (async () => {
            try {
                const { data, error } = await supabase
                    .from('crisis_analyses')
                    .select('*')
                    .ilike('person_name', `%${firstTopic.trim()}%`)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                if (!cancelled && data && !error) {
                    setAnalysisData(parseRow(data));
                    setLastAnalyzed(data.updated_at || data.meta?.analyzed_at || data.created_at);
                }
            } catch {}
        })();
        return () => { cancelled = true; };
    }, [firstTopic]); // eslint-disable-line react-hooks/exhaustive-deps

    // Countdown timer while loading
    useEffect(() => {
        if (loading) {
            setCountdown(360);
            countdownRef.current = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        if (countdownRef.current) clearInterval(countdownRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (countdownRef.current) clearInterval(countdownRef.current);
        }
        return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
    }, [loading]);

    // Reset pages when filter or data changes
    useEffect(() => { setNewsPage(1); setSocialPage(1); }, [typeFilter, analysisData]);

    const stopPolling = useCallback(() => {
        if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    }, []);

    useEffect(() => () => stopPolling(), [stopPolling]);

    const handleAnalyze = useCallback(async () => {
        if (monitoredSubjects.length === 0 || !supabase) return;
        setLoading(true);
        stopPolling();

        const payload = {
            person_name: monitoredSubjects[0],
            aliases: monitoredSubjects.slice(1),
            pautas_prioritarias: monitoredSubjects,
            temas_sensiveis: monitoredSubjects,
            max_results: maxResults,
            window_days: windowDays,
            partido_nome: '', partido_sigla: '', cargo_atual: '', estado_base: '', cidade_base: '',
            projetos_keywords: [], campanha_keywords: [],
            aliados_relevantes: [], opositores_relevantes: [],
            fontes_prioritarias: [], fontes_bloqueadas: [],
        };

        const startedAt = new Date().toISOString();
        const searchKey = `%${monitoredSubjects[0].trim()}%`;

        // Fire-and-forget: some n8n flows return the result directly
        fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then((res) => {
                if (!res.ok) return;
                res.json().then((raw) => {
                    const result = Array.isArray(raw) ? raw[0] : raw;
                    if (result?.summary) {
                        stopPolling();
                        setAnalysisData(parseRow(result));
                        setLastAnalyzed(result.meta?.analyzed_at || result.updated_at || new Date().toISOString());
                        setLoading(false);
                        toast.success(`Análise concluída. ${result.summary.total_itens} itens classificados.`);
                    }
                }).catch(() => {});
            })
            .catch(() => {});

        // Parallel polling of Supabase for rows created after this request
        let pollCount = 0;
        pollingRef.current = setInterval(async () => {
            pollCount++;
            try {
                const { data, error } = await supabase
                    .from('crisis_analyses')
                    .select('*')
                    .ilike('person_name', searchKey)
                    .gt('created_at', startedAt)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                if (data && !error && data.summary) {
                    stopPolling();
                    setAnalysisData(parseRow(data));
                    setLastAnalyzed(data.updated_at || data.meta?.analyzed_at || data.created_at);
                    setLoading(false);
                    toast.success(`Análise concluída. ${data.summary?.total_itens || 0} itens classificados.`);
                }
            } catch {}
            if (pollCount >= 72) {
                stopPolling();
                setLoading(false);
                toast.error('A análise demorou mais de 6 minutos. Verifique novamente em breve.');
            }
        }, 5000);
    }, [monitoredSubjects, maxResults, windowDays, stopPolling]);

    const handleAddSubject = () => {
        const next = subjectInput.trim();
        if (!next || monitoredSubjects.includes(next)) return;
        const updated = [...monitoredSubjects, next];
        setMonitoredSubjects(updated);
        saveTopics(updated);
        setSubjectInput('');
    };

    const handleRemoveSubject = (idx) => {
        const updated = monitoredSubjects.filter((_, i) => i !== idx);
        setMonitoredSubjects(updated);
        saveTopics(updated);
    };

    // Derived display data from real analysis result
    const display = useMemo(() => {
        if (!analysisData) return null;
        const s = analysisData.summary;
        const items = analysisData.items || [];
        const filtered = typeFilter === 'all' ? items : items.filter((i) => i.tipo === typeFilter);
        const newsItems = filtered.filter((i) => !isSocialSource(i.source, i.url)).sort((a, b) => b.risk_score - a.risk_score);
        const socialItems = filtered.filter((i) => isSocialSource(i.source, i.url)).sort((a, b) => b.risk_score - a.risk_score);
        const allByScore = [...items].sort((a, b) => b.risk_score - a.risk_score);
        const recentItems = allByScore.slice(0, 10).map((item) => ({
            title: item.resumo_curto,
            source: getPortalName(item.url),
            tone: priorityTone(item.prioridade),
            url: item.url,
        }));
        const sourcePortals = {};
        for (const it of items.filter((i) => !isSocialSource(i.source, i.url))) {
            const n = getPortalName(it.url);
            sourcePortals[n] = (sourcePortals[n] || 0) + 1;
        }
        const crises = s.crise_direta || 0;
        const alta = s.prioridade?.alta || 0;
        const statusLabel = crises > 5 && alta > 3 ? 'CRÍTICO' : crises > 0 ? 'ALERTA' : 'ESTÁVEL';
        return {
            statusLabel,
            statusVariant: statusLabel === 'ESTÁVEL' ? 'success' : 'danger',
            statusSubtitle: `${crises} crise(s) direta(s) · ${alta} prioridade alta`,
            stats: [
                { icon: 'Activity', value: String(s.total_itens || 0), label: 'Incidentes Ativos', iconClass: 'text-danger' },
                { icon: 'Globe', value: String(items.filter((i) => !isSocialSource(i.source, i.url)).length), label: 'Notícias / Portais', iconClass: 'text-primary' },
                { icon: 'TrendingUp', value: String(items.filter((i) => isSocialSource(i.source, i.url)).length), label: 'Redes Sociais', iconClass: 'text-warning' },
                { icon: 'Shield', value: String(alta), label: 'Prioridade Alta', iconClass: 'text-danger' },
            ],
            crisisTypes: [
                { key: 'all', name: 'Todos', dotColor: '#64748b', count: items.length },
                ...(s.crise_direta > 0 ? [{ key: 'crise_direta', name: 'Crise Direta', dotColor: '#ef4444', count: s.crise_direta }] : []),
                ...(s.tema_quente > 0 ? [{ key: 'tema_quente', name: 'Tema Quente', dotColor: '#eab308', count: s.tema_quente }] : []),
                ...(s.fora_de_escopo > 0 ? [{ key: 'fora_de_escopo', name: 'Fora de Escopo', dotColor: '#94a3b8', count: s.fora_de_escopo }] : []),
            ],
            recentItems,
            newsItems,
            socialItems,
            sources: Object.entries(sourcePortals).sort((a, b) => b[1] - a[1]).map(([n]) => n),
            summaryItems: (analysisData.highlights || []).map((h) => ({
                title: h.resumo_curto,
                detail: h.justificativa,
                prioridade: h.prioridade,
            })),
            meta: analysisData.meta,
        };
    }, [analysisData, typeFilter]);

    const renderSocialIcon = (source, size = 12) => {
        const s = (source || '').toLowerCase();
        if (s === 'tiktok') return <FontAwesomeIcon icon={faTiktok} style={{ fontSize: size }} />;
        if (s === 'instagram') return <FontAwesomeIcon icon={faInstagram} style={{ fontSize: size }} />;
        if (s === 'facebook') return <FontAwesomeIcon icon={faFacebook} style={{ fontSize: size }} />;
        if (s === 'twitter') return <FontAwesomeIcon icon={faXTwitter} style={{ fontSize: size }} />;
        if (s === 'youtube') return <FontAwesomeIcon icon={faYoutube} style={{ fontSize: size }} />;
        return <Icons.Globe size={size} />;
    };

    const progressPct = loading ? Math.max(5, Math.round(((360 - countdown) / 360) * 100)) : 0;

    return (
        <>
        <div className="hk-pg-body py-0">
            <div className={classNames('fmapp-wrap', { 'fmapp-sidebar-toggle': !showSidebar })}>
                <CrisisSidebar />
                <div className="fmapp-content">
                    <div className="fmapp-detail-wrap">
                        <CrisisHeader showSidebar={showSidebar} toggleSidebar={() => setShowSidebar(!showSidebar)} />
                        <div className="fm-body">
                            <SimpleBar className="nicescroll-bar">
                                <div className="container-fluid px-4 py-4">

                                    {/* Page title */}
                                    <Row className="mb-3">
                                        <Col xs={12} className="d-flex align-items-start justify-content-between">
                                            <div>
                                                <h4 className="mb-0">Monitoramento de Crise</h4>
                                                <small className="text-muted">
                                                    {lastAnalyzed && formatBRDate(lastAnalyzed)
                                                        ? `Última análise: ${formatBRDate(lastAnalyzed)}`
                                                        : '24/7 em tempo real'}
                                                </small>
                                            </div>
                                            {loading && (
                                                <div className="d-flex align-items-center gap-2 text-primary">
                                                    <Icons.RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                                    <small>Analisando... {formatCountdown(countdown)}</small>
                                                </div>
                                            )}
                                        </Col>
                                    </Row>

                                    {/* Status Banner */}
                                    <Row>
                                        <Col lg={12} className="mb-3">
                                            {(() => {
                                                const variant = display ? display.statusVariant : CRISIS_MOCK.status.variant;
                                                const label = display ? display.statusLabel : CRISIS_MOCK.status.label;
                                                const subtitle = display ? display.statusSubtitle : CRISIS_MOCK.status.subtitle;
                                                const bgColor = variant === 'danger' ? '#dc3545' : variant === 'warning' ? '#ffc107' : '#198754';
                                                const textColor = variant === 'warning' ? '#212529' : '#ffffff';
                                                return (
                                                    <div
                                                        className="rounded-3 px-4 py-4 d-flex align-items-center justify-content-between"
                                                        style={{ backgroundColor: bgColor, color: textColor }}
                                                    >
                                                        <div>
                                                            <small style={{ opacity: 0.85, color: textColor }}>Status do Sistema</small>
                                                            <h2 className="mb-0 fw-bold" style={{ color: textColor }}>{label}</h2>
                                                            <small style={{ opacity: 0.85, color: textColor }}>{subtitle}</small>
                                                        </div>
                                                        <Icons.AlertTriangle size={40} style={{ color: textColor, opacity: 0.7 }} />
                                                    </div>
                                                );
                                            })()}
                                        </Col>
                                    </Row>

                                    {/* Assuntos Monitorados + Parâmetros + Analisar */}
                                    <Row>
                                        <Col lg={12} className="mb-3">
                                            <Card className="card-border">
                                                <Card.Body>
                                                    <div className="d-flex align-items-center mb-2">
                                                        <Icons.Search size={14} className="text-success me-2" />
                                                        <h6 className="mb-0">Assuntos Monitorados</h6>
                                                    </div>
                                                    <div className="d-flex gap-2 flex-wrap mb-2">
                                                        <Form.Control
                                                            type="text"
                                                            placeholder="Adicionar tema ou nome para monitorar..."
                                                            value={subjectInput}
                                                            onChange={(e) => setSubjectInput(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') { e.preventDefault(); handleAddSubject(); }
                                                            }}
                                                            style={{ maxWidth: '480px' }}
                                                        />
                                                        <Button size="sm" variant="primary" onClick={handleAddSubject}>
                                                            <Icons.Plus size={14} className="me-1" /> Adicionar
                                                        </Button>
                                                    </div>
                                                    <div className="d-flex gap-2 flex-wrap mb-3">
                                                        {monitoredSubjects.map((subject, index) => (
                                                            <span key={`${subject}-${index}`} className="badge badge-soft-light border text-dark">
                                                                {subject}
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-link text-muted p-0 ms-2 align-baseline"
                                                                    onClick={() => handleRemoveSubject(index)}
                                                                    aria-label={`Excluir assunto ${subject}`}
                                                                >
                                                                    <Icons.X size={12} />
                                                                </button>
                                                            </span>
                                                        ))}
                                                        {monitoredSubjects.length === 0 && (
                                                            <small className="text-muted fst-italic">
                                                                Nenhum assunto cadastrado. Adicione temas para monitorar.
                                                            </small>
                                                        )}
                                                    </div>
                                                    <hr className="my-2" />
                                                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2">
                                                        <div className="d-flex flex-wrap align-items-center gap-2">
                                                            <small className="text-muted fw-medium">Parâmetros:</small>
                                                            <Form.Select
                                                                size="sm"
                                                                style={{ width: 100 }}
                                                                value={windowDays}
                                                                onChange={(e) => setWindowDays(Number(e.target.value))}
                                                            >
                                                                <option value={7}>7 dias</option>
                                                                <option value={15}>15 dias</option>
                                                                <option value={30}>30 dias</option>
                                                            </Form.Select>
                                                            <Form.Select
                                                                size="sm"
                                                                style={{ width: 130 }}
                                                                value={maxResults}
                                                                onChange={(e) => setMaxResults(Number(e.target.value))}
                                                            >
                                                                <option value={30}>30 resultados</option>
                                                                <option value={50}>50 resultados</option>
                                                                <option value={100}>100 resultados</option>
                                                            </Form.Select>
                                                        </div>
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            disabled={loading || monitoredSubjects.length === 0 || !supabase}
                                                            onClick={handleAnalyze}
                                                        >
                                                            {loading ? (
                                                                <><Icons.Clock size={14} className="me-1" />{formatCountdown(countdown)}</>
                                                            ) : (
                                                                <><Icons.Globe size={14} className="me-1" />Analisar</>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>

                                    {/* Loading progress */}
                                    {loading && (
                                        <Row>
                                            <Col lg={12} className="mb-3">
                                                <Card className="card-border text-center">
                                                    <Card.Body className="py-5">
                                                        <Icons.RefreshCw
                                                            size={32}
                                                            className="text-primary mb-3"
                                                            style={{ animation: 'spin 1s linear infinite' }}
                                                        />
                                                        <p className="fw-medium mb-1">
                                                            Analisando menções e classificando riscos...
                                                        </p>
                                                        <small className="text-muted">
                                                            Buscando na web, normalizando e classificando com IA. Tempo estimado: 3-6 minutos.
                                                        </small>
                                                        <div className="mt-3 mx-auto" style={{ maxWidth: 320 }}>
                                                            <div className="progress" style={{ height: 6 }}>
                                                                <div
                                                                    className="progress-bar bg-primary"
                                                                    style={{ width: `${progressPct}%`, transition: 'width 1s' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        </Row>
                                    )}

                                    {/* Stats */}
                                    <Row>
                                        {(display ? display.stats : CRISIS_MOCK.stats).map((stat) => {
                                            const Icon = Icons[stat.icon];
                                            const colSize = display ? 3 : 4;
                                            return (
                                                <Col lg={colSize} md={6} key={stat.label} className="mb-3">
                                                    <Card className="card-border">
                                                        <Card.Body>
                                                            <div className="text-center">
                                                                {Icon && <Icon size={20} className={`mb-2 ${stat.iconClass}`} />}
                                                                <h2 className="mb-0">{stat.value}</h2>
                                                                <small className="text-muted">{stat.label}</small>
                                                            </div>
                                                        </Card.Body>
                                                    </Card>
                                                </Col>
                                            );
                                        })}
                                    </Row>

                                    {/* Crisis type filters */}
                                    <Row>
                                        <Col xs={12} className="mb-3">
                                            <div className="d-flex align-items-center flex-wrap gap-2">
                                                <small className="text-muted fw-medium">TIPOS DE CRISE:</small>
                                                {display ? (
                                                    display.crisisTypes.map((type) => (
                                                        <button
                                                            key={type.key}
                                                            type="button"
                                                            className="btn px-3 py-1 rounded-pill"
                                                            onClick={() => setTypeFilter(type.key)}
                                                            style={{
                                                                backgroundColor: typeFilter === type.key ? '#e0f2fe' : '#f3f4f6',
                                                                color: typeFilter === type.key ? '#0369a1' : '#111827',
                                                                border: typeFilter === type.key ? '1px solid #7dd3fc' : '1px solid #d1d5db',
                                                                fontWeight: 600,
                                                                fontSize: '0.875rem',
                                                            }}
                                                        >
                                                            <span
                                                                className="rounded-circle me-2 d-inline-block"
                                                                style={{ width: 8, height: 8, backgroundColor: type.dotColor, verticalAlign: 'middle' }}
                                                            />
                                                            {type.name}
                                                            <span className="ms-1 text-muted" style={{ fontSize: '0.75rem' }}>
                                                                ({type.count})
                                                            </span>
                                                        </button>
                                                    ))
                                                ) : (
                                                    CRISIS_MOCK.crisisTypes.map((type) => (
                                                        <span
                                                            key={type.name}
                                                            className="d-inline-flex align-items-center px-3 py-1 rounded-pill"
                                                            style={{
                                                                backgroundColor: '#f3f4f6',
                                                                color: '#111827',
                                                                border: '1px solid #d1d5db',
                                                                fontWeight: 600,
                                                                fontSize: '0.875rem',
                                                            }}
                                                        >
                                                            <span
                                                                className="rounded-circle me-2"
                                                                style={{ width: 8, height: 8, backgroundColor: type.dotColor }}
                                                            />
                                                            {type.name}
                                                        </span>
                                                    ))
                                                )}
                                            </div>
                                        </Col>
                                    </Row>

                                    {/* Crises Recentes */}
                                    <Row>
                                        <Col lg={12} className="mb-4">
                                            <Card className="card-border">
                                                <Card.Body>
                                                    <div className="d-flex align-items-center mb-3">
                                                        <Icons.Clock size={14} className="text-success me-2" />
                                                        <h6 className="mb-0">Crises Recentes</h6>
                                                        {display && (
                                                            <span className="ms-2 badge rounded-pill bg-primary text-white">
                                                                {display.recentItems.length}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {display ? (
                                                        <div className="d-flex flex-column gap-2">
                                                            {display.recentItems.map((item, idx) => (
                                                                <a
                                                                    key={idx}
                                                                    href={item.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-decoration-none"
                                                                >
                                                                    <div
                                                                        className="rounded p-3"
                                                                        style={{
                                                                            backgroundColor: TONE_BG[item.tone] || '#f8f9fa',
                                                                            border: TONE_BORDER[item.tone] || '1px solid #dee2e6',
                                                                        }}
                                                                    >
                                                                        <div className="d-flex align-items-start">
                                                                            <span
                                                                                className="rounded-circle me-3 mt-1 flex-shrink-0"
                                                                                style={{
                                                                                    width: 11,
                                                                                    height: 11,
                                                                                    display: 'inline-block',
                                                                                    backgroundColor: TONE_DOT[item.tone] || '#64748b',
                                                                                }}
                                                                            />
                                                                            <div className="flex-grow-1">
                                                                                <div className="fw-medium mb-1 text-dark">{item.title}</div>
                                                                                <span className="badge badge-soft-light text-dark border">{item.source}</span>
                                                                            </div>
                                                                            <Icons.ExternalLink size={12} className="text-muted ms-2 mt-1 flex-shrink-0" />
                                                                        </div>
                                                                    </div>
                                                                </a>
                                                            ))}
                                                            {display.recentItems.length === 0 && (
                                                                <p className="text-muted small mb-0">Nenhum item encontrado com o filtro selecionado.</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="border rounded mb-3 overflow-hidden">
                                                                <div className="row g-0">
                                                                    {CRISIS_MOCK.recentTabs.map((tab) => (
                                                                        <div key={tab.key} className="col-4">
                                                                            <button
                                                                                type="button"
                                                                                className="btn w-100 rounded-0 py-3"
                                                                                onClick={() => setActiveTab(tab.key)}
                                                                                style={{
                                                                                    borderBottom: activeTab === tab.key ? '2px solid var(--bs-primary)' : '2px solid transparent',
                                                                                    color: activeTab === tab.key ? 'var(--bs-primary)' : '#475569',
                                                                                    backgroundColor: '#ffffff',
                                                                                    fontWeight: 500,
                                                                                }}
                                                                            >
                                                                                {tab.label}
                                                                                <span
                                                                                    className="ms-2 badge rounded-pill"
                                                                                    style={{
                                                                                        backgroundColor: activeTab === tab.key ? 'var(--bs-primary)' : '#e2e8f0',
                                                                                        color: activeTab === tab.key ? '#ffffff' : '#334155',
                                                                                        fontSize: '0.75rem',
                                                                                    }}
                                                                                >
                                                                                    {tab.total}
                                                                                </span>
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="d-flex flex-column gap-2">
                                                                {CRISIS_MOCK.recentByPeriod[activeTab].map((item) => (
                                                                    <div
                                                                        key={`${item.title}-${item.source}`}
                                                                        className="rounded p-3"
                                                                        style={{
                                                                            backgroundColor: TONE_BG[item.tone] || '#f8f9fa',
                                                                            border: TONE_BORDER[item.tone] || '1px solid #dee2e6',
                                                                        }}
                                                                    >
                                                                        <div className="d-flex align-items-start">
                                                                            <span
                                                                                className="rounded-circle me-3 mt-1"
                                                                                style={{
                                                                                    width: 11,
                                                                                    height: 11,
                                                                                    display: 'inline-block',
                                                                                    backgroundColor: TONE_DOT[item.tone] || '#64748b',
                                                                                }}
                                                                            />
                                                                            <div>
                                                                                <div className="fw-medium mb-1">{item.title}</div>
                                                                                <div className="d-flex align-items-center">
                                                                                    <span className="badge badge-soft-light text-dark border me-2">{item.source}</span>
                                                                                    <small className="text-muted">{item.age}</small>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>

                                    {/* Monitoramento (news cards) */}
                                    <Row>
                                        <Col lg={12} className="mb-3">
                                            <div className="d-flex align-items-center justify-content-between mb-2">
                                                <div className="d-flex align-items-center">
                                                    <Icons.Zap size={14} className="text-success me-2" />
                                                    <h6 className="mb-0">Monitoramento</h6>
                                                </div>
                                                <span
                                                    className="d-inline-flex align-items-center px-3 py-1 rounded-pill"
                                                    style={{
                                                        backgroundColor: '#f8fafc',
                                                        border: '1px solid #d1d5db',
                                                        color: '#111827',
                                                        fontWeight: 600,
                                                        fontSize: '0.875rem',
                                                        lineHeight: 1.2,
                                                    }}
                                                >
                                                    {display ? `${display.newsItems.length} notícias` : 'Automático'}
                                                </span>
                                            </div>
                                            <Row>
                                                {display ? (() => {
                                                    const totalNewsPages = Math.max(1, Math.ceil(display.newsItems.length / NEWS_PAGE_SIZE));
                                                    const safeNewsPage = Math.min(newsPage, totalNewsPages);
                                                    const pagedNews = display.newsItems.slice((safeNewsPage - 1) * NEWS_PAGE_SIZE, safeNewsPage * NEWS_PAGE_SIZE);
                                                    return (
                                                        <>
                                                            {pagedNews.map((item, idx) => {
                                                                const portal = getPortalName(item.url);
                                                                const favicon = getFaviconUrl(item.url);
                                                                const dotColor = priorityDotColor(item.prioridade);
                                                                return (
                                                                    <Col xl={4} md={6} key={item.id || idx} className="mb-3">
                                                                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                                                                            <Card className="card-border h-100 overflow-hidden monitoring-card">
                                                                                <div
                                                                                    className="monitoring-card-media d-flex align-items-center justify-content-center bg-light position-relative"
                                                                                    style={{ height: 190, overflow: 'hidden' }}
                                                                                >
                                                                                    {item.image ? (
                                                                                        <img
                                                                                            src={item.image}
                                                                                            alt=""
                                                                                            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
                                                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                                                        />
                                                                                    ) : favicon ? (
                                                                                        <img
                                                                                            src={favicon}
                                                                                            alt={portal}
                                                                                            style={{ width: 64, height: 64, objectFit: 'contain', opacity: 0.75 }}
                                                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                                                        />
                                                                                    ) : (
                                                                                        <span style={{ fontSize: 48, fontWeight: 900, color: 'rgba(0,0,0,0.08)', userSelect: 'none' }}>
                                                                                            {portal.slice(0, 2).toUpperCase()}
                                                                                        </span>
                                                                                    )}
                                                                                    <span
                                                                                        className="badge rounded-pill position-absolute"
                                                                                        style={{ top: 8, left: 8, backgroundColor: dotColor, color: '#fff', fontSize: '0.75rem' }}
                                                                                    >
                                                                                        {portal}
                                                                                    </span>
                                                                                    <span
                                                                                        className="rounded-circle position-absolute"
                                                                                        style={{ top: 8, right: 8, width: 12, height: 12, backgroundColor: dotColor, display: 'inline-block' }}
                                                                                    />
                                                                                </div>
                                                                                <Card.Body className="pt-3">
                                                                                    <div
                                                                                        className="fw-medium text-dark mb-1"
                                                                                        style={{
                                                                                            display: '-webkit-box',
                                                                                            WebkitLineClamp: 2,
                                                                                            WebkitBoxOrient: 'vertical',
                                                                                            overflow: 'hidden',
                                                                                            minHeight: 48,
                                                                                        }}
                                                                                    >
                                                                                        {item.resumo_curto}
                                                                                    </div>
                                                                                    <div className="d-flex align-items-center justify-content-between mt-2">
                                                                                        <small className="text-muted">{item.source}</small>
                                                                                        <span
                                                                                            className={`badge bg-${item.sentimento_publico === 'negative' ? 'danger' : item.sentimento_publico === 'positive' ? 'success' : 'warning'}-subtle text-${item.sentimento_publico === 'negative' ? 'danger' : item.sentimento_publico === 'positive' ? 'success' : 'warning'}`}
                                                                                            style={{ fontSize: '0.7rem' }}
                                                                                        >
                                                                                            {item.sentimento_publico === 'negative' ? 'Negativo' : item.sentimento_publico === 'positive' ? 'Positivo' : 'Neutro'}
                                                                                        </span>
                                                                                    </div>
                                                                                </Card.Body>
                                                                            </Card>
                                                                        </a>
                                                                    </Col>
                                                                );
                                                            })}
                                                            {totalNewsPages > 1 && (
                                                                <Col xs={12} className="d-flex align-items-center justify-content-center gap-2 mt-1 mb-2">
                                                                    <Button
                                                                        variant="outline-secondary"
                                                                        size="sm"
                                                                        disabled={safeNewsPage <= 1}
                                                                        onClick={() => setNewsPage(safeNewsPage - 1)}
                                                                    >
                                                                        Anterior
                                                                    </Button>
                                                                    <small className="text-muted">
                                                                        Página {safeNewsPage} de {totalNewsPages}
                                                                    </small>
                                                                    <Button
                                                                        variant="outline-secondary"
                                                                        size="sm"
                                                                        disabled={safeNewsPage >= totalNewsPages}
                                                                        onClick={() => setNewsPage(safeNewsPage + 1)}
                                                                    >
                                                                        Próxima
                                                                    </Button>
                                                                </Col>
                                                            )}
                                                        </>
                                                    );
                                                })() : (
                                                    CRISIS_MOCK.monitoringCards.map((card, idx) => {
                                                        const sourceBg = card.sourceClass === 'danger' ? '#ef4444' : '#10b981';
                                                        return (
                                                            <Col xl={4} md={6} key={`${card.title}-${idx}`} className="mb-3">
                                                                <Card className="card-border h-100 overflow-hidden monitoring-card">
                                                                    <div
                                                                        className="monitoring-card-media"
                                                                        style={{
                                                                            height: 190,
                                                                            backgroundImage: `url(${card.image})`,
                                                                            backgroundPosition: 'center',
                                                                            backgroundSize: 'cover',
                                                                        }}
                                                                    />
                                                                    <Card.Body className="pt-3">
                                                                        <span
                                                                            className="badge rounded-pill mb-2"
                                                                            style={{ backgroundColor: sourceBg, color: '#fff', fontSize: '0.75rem' }}
                                                                        >
                                                                            {card.source}
                                                                        </span>
                                                                        <div
                                                                            className="fw-medium"
                                                                            style={{
                                                                                display: '-webkit-box',
                                                                                WebkitLineClamp: 2,
                                                                                WebkitBoxOrient: 'vertical',
                                                                                overflow: 'hidden',
                                                                                minHeight: 48,
                                                                            }}
                                                                        >
                                                                            {card.title}
                                                                        </div>
                                                                        <small className="text-muted">{card.age}</small>
                                                                    </Card.Body>
                                                                </Card>
                                                            </Col>
                                                        );
                                                    })
                                                )}
                                            </Row>
                                        </Col>
                                    </Row>

                                    {/* Fontes */}
                                    <Row>
                                        <Col xs={12} className="mb-4">
                                            <h6 className="mb-2 d-flex align-items-center gap-2">
                                                <Icons.Globe size={14} className="text-success" />
                                                Fontes
                                            </h6>
                                            <div className="d-flex flex-wrap gap-2">
                                                {(display ? display.sources : CRISIS_MOCK.sources).map((source) => (
                                                    <span
                                                        key={source}
                                                        className="d-inline-flex align-items-center px-3 py-1 rounded-pill"
                                                        style={{
                                                            backgroundColor: '#f8fafc',
                                                            border: '1px solid #d1d5db',
                                                            color: '#111827',
                                                            fontWeight: 600,
                                                            fontSize: '0.875rem',
                                                            lineHeight: 1.2,
                                                        }}
                                                    >
                                                        {source}
                                                    </span>
                                                ))}
                                                {display && display.sources.length === 0 && (
                                                    <small className="text-muted fst-italic">Nenhuma fonte de notícias identificada.</small>
                                                )}
                                            </div>
                                        </Col>
                                    </Row>

                                    {/* Redes Sociais */}
                                    <Row>
                                        <Col lg={12} className="mb-4">
                                            <div className="d-flex align-items-center justify-content-between mb-3">
                                                <h6 className="mb-0 d-flex align-items-center gap-2">
                                                    <Icons.TrendingUp size={14} className="text-success" />
                                                    Redes Sociais
                                                    {display && (
                                                        <span
                                                            className="badge rounded-pill bg-primary text-white"
                                                            style={{ fontSize: '0.7rem' }}
                                                        >
                                                            {display.socialItems.length}
                                                        </span>
                                                    )}
                                                </h6>
                                            </div>
                                            <Row>
                                                {display ? (() => {
                                                    const totalSocialPages = Math.max(1, Math.ceil(display.socialItems.length / NEWS_PAGE_SIZE));
                                                    const safeSocialPage = Math.min(socialPage, totalSocialPages);
                                                    const pagedSocial = display.socialItems.slice((safeSocialPage - 1) * NEWS_PAGE_SIZE, safeSocialPage * NEWS_PAGE_SIZE);
                                                    return (
                                                        <>
                                                            {pagedSocial.map((item, idx) => {
                                                                const portal = getPortalName(item.url);
                                                                const sentClass = item.sentimento_publico === 'negative' ? 'negative' : item.sentimento_publico === 'positive' ? 'positive' : 'neutral';
                                                                const SentIcon = item.sentimento_publico === 'negative' ? Icons.ThumbsDown : item.sentimento_publico === 'positive' ? Icons.ThumbsUp : Icons.Minus;
                                                                const sentLabel = item.sentimento_publico === 'negative' ? 'Negativo' : item.sentimento_publico === 'positive' ? 'Positivo' : 'Neutro';
                                                                return (
                                                                    <Col md={6} key={item.id || idx} className="mb-3">
                                                                        <Card className="cm-mention-card h-100">
                                                                            <Card.Body>
                                                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                                                    <div className="d-flex align-items-center gap-2">
                                                                                        <div className="cm-mention-avatar d-flex align-items-center justify-content-center">
                                                                                            {renderSocialIcon(item.source, 14)}
                                                                                        </div>
                                                                                        <div>
                                                                                            <div className="fw-semibold">{portal}</div>
                                                                                            <small className="text-muted text-capitalize">{item.source}</small>
                                                                                        </div>
                                                                                    </div>
                                                                                    <span className={`cm-sentiment-pill cm-sentiment-pill-${sentClass}`}>
                                                                                        <SentIcon size={10} className="me-1" />
                                                                                        {sentLabel}
                                                                                    </span>
                                                                                </div>
                                                                                <p className="mb-2 cm-mention-text">{item.resumo_curto}</p>
                                                                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                                                                    <span
                                                                                        className="badge rounded-pill"
                                                                                        style={{ backgroundColor: priorityDotColor(item.prioridade), color: '#fff', fontSize: '0.7rem' }}
                                                                                    >
                                                                                        {item.prioridade === 'alta' ? 'Alta' : item.prioridade === 'media' ? 'Média' : 'Baixa'}
                                                                                    </span>
                                                                                    {item.url && (
                                                                                        <Button
                                                                                            variant="outline-secondary"
                                                                                            size="sm"
                                                                                            as="a"
                                                                                            href={item.url}
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            className="d-inline-flex align-items-center"
                                                                                        >
                                                                                            <Icons.ExternalLink size={12} className="me-1" />
                                                                                            Ver post
                                                                                        </Button>
                                                                                    )}
                                                                                </div>
                                                                            </Card.Body>
                                                                        </Card>
                                                                    </Col>
                                                                );
                                                            })}
                                                            {totalSocialPages > 1 && (
                                                                <Col xs={12} className="d-flex align-items-center justify-content-center gap-2 mt-1 mb-2">
                                                                    <Button
                                                                        variant="outline-secondary"
                                                                        size="sm"
                                                                        disabled={safeSocialPage <= 1}
                                                                        onClick={() => setSocialPage(safeSocialPage - 1)}
                                                                    >
                                                                        Anterior
                                                                    </Button>
                                                                    <small className="text-muted">
                                                                        Página {safeSocialPage} de {totalSocialPages}
                                                                    </small>
                                                                    <Button
                                                                        variant="outline-secondary"
                                                                        size="sm"
                                                                        disabled={safeSocialPage >= totalSocialPages}
                                                                        onClick={() => setSocialPage(safeSocialPage + 1)}
                                                                    >
                                                                        Próxima
                                                                    </Button>
                                                                </Col>
                                                            )}
                                                            {pagedSocial.length === 0 && (
                                                                <Col xs={12}>
                                                                    <p className="text-muted small fst-italic">Nenhuma menção em redes sociais encontrada.</p>
                                                                </Col>
                                                            )}
                                                        </>
                                                    );
                                                })() : (
                                                    CRISIS_MOCK.socials.map((post, idx) => (
                                                        <Col md={6} key={`${post.platform}-${idx}`} className="mb-3">
                                                            <Card className="cm-mention-card h-100">
                                                                <Card.Body>
                                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                                        <div className="d-flex align-items-center gap-2">
                                                                            <div className="cm-mention-avatar d-flex align-items-center justify-content-center">
                                                                                {renderSocialIcon(post.platform, 14)}
                                                                            </div>
                                                                            <div>
                                                                                <div className="fw-semibold">{post.platform}</div>
                                                                                <small className="text-muted">{post.author}</small>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <p className="mb-2 cm-mention-text">{post.text}</p>
                                                                </Card.Body>
                                                            </Card>
                                                        </Col>
                                                    ))
                                                )}
                                            </Row>
                                        </Col>
                                    </Row>

                                    {/* Resumo dos fatos */}
                                    <Row>
                                        <Col xs={12} className="mb-4">
                                            <h6 className="mb-2 d-flex align-items-center gap-2">
                                                <Icons.FileText size={14} className="text-success" />
                                                Resumo dos fatos
                                            </h6>
                                            <Card className="card-border">
                                                <Card.Body className="p-0">
                                                    {display ? (
                                                        display.summaryItems.length === 0 ? (
                                                            <div className="p-4">
                                                                <p className="mb-0 text-muted fst-italic">Resumo não disponível para esta análise.</p>
                                                            </div>
                                                        ) : (
                                                            display.summaryItems.map((item, idx, arr) => (
                                                                <div
                                                                    key={idx}
                                                                    className="px-4 py-3"
                                                                    style={{
                                                                        borderBottom: idx < arr.length - 1 ? '1px solid rgba(15,23,42,.07)' : 'none',
                                                                    }}
                                                                >
                                                                    <span className="fw-semibold" style={{ color: '#0f172a' }}>
                                                                        {item.title}..{' '}
                                                                    </span>
                                                                    <span style={{ color: '#4f7aae', fontSize: '0.9rem' }}>
                                                                        {item.detail}
                                                                    </span>
                                                                </div>
                                                            ))
                                                        )
                                                    ) : (
                                                        CRISIS_MOCK.summary.map((line, idx, arr) => (
                                                            <div
                                                                key={idx}
                                                                className="px-4 py-3"
                                                                style={{
                                                                    borderBottom: idx < arr.length - 1 ? '1px solid rgba(15,23,42,.07)' : 'none',
                                                                }}
                                                            >
                                                                <p className="mb-0" style={{ fontSize: '0.9rem' }}>{line}</p>
                                                            </div>
                                                        ))
                                                    )}
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>

                                    {/* Sugestão de Resposta — comentado temporariamente
                                    <Row>
                                        <Col xs={12}>
                                            ...
                                        </Col>
                                    </Row>
                                    */}

                                    {/* Rodapé de metadados (apenas quando há dados reais) */}
                                    {display?.meta && (
                                        <Row className="mt-2">
                                            <Col xs={12}>
                                                <p className="text-center text-muted mb-0" style={{ fontSize: '0.7rem' }}>
                                                    Janela: {display.meta.window_days} dias · Itens analisados: {analysisData?.summary?.total_itens}
                                                    {lastAnalyzed && formatBRDate(lastAnalyzed) && ` · Atualizado em ${formatBRDate(lastAnalyzed)}`}
                                                </p>
                                            </Col>
                                        </Row>
                                    )}

                                </div>
                            </SimpleBar>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <style jsx global>{`
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            .monitoring-card .monitoring-card-media {
                transform: scale(1);
                transition: transform 0.35s ease;
                transform-origin: center center;
            }
            .monitoring-card:hover .monitoring-card-media {
                transform: scale(1.06);
            }
            .cm-mention-card {
                border-radius: 12px;
                border: 1px solid rgba(15, 23, 42, .12);
                transition: box-shadow 0.2s;
            }
            .cm-mention-card:hover {
                box-shadow: 0 2px 12px rgba(15, 23, 42, .08);
            }
            .cm-mention-avatar {
                width: 32px;
                height: 32px;
                border-radius: 999px;
                background: #f1f5f9;
                color: #0f172a;
                flex-shrink: 0;
            }
            .cm-mention-text {
                font-size: 0.9rem;
                line-height: 1.5;
                color: #1e293b;
            }
            .cm-sentiment-pill {
                display: inline-flex;
                align-items: center;
                border-radius: 999px;
                padding: 3px 9px;
                font-size: 11px;
                font-weight: 600;
                line-height: 1;
                border: 1px solid transparent;
                white-space: nowrap;
            }
            .cm-sentiment-pill-positive { color: #0ea46d; background: rgba(14,164,109,.12); border-color: rgba(14,164,109,.35); }
            .cm-sentiment-pill-neutral  { color: #d97706; background: rgba(217,119,6,.12);  border-color: rgba(217,119,6,.35);  }
            .cm-sentiment-pill-negative { color: #ef4444; background: rgba(239,68,68,.12);  border-color: rgba(239,68,68,.35);  }
        `}</style>
        </>
    );
};

export default CrisisDashboard;
