'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import classNames from 'classnames';
import SimpleBar from 'simplebar-react';
import { Badge, Button, Card, Col, Form, Modal, Row } from 'react-bootstrap';
import {
    Users, UserPlus, TrendingUp, Eye, RefreshCw, Plus, MessageSquare,
    Heart, Send, ChevronLeft, ChevronRight, ExternalLink, Trash2, Edit2,
    Shield, Clock, CheckCircle, AlertCircle, Activity, Zap, Calendar, Filter,
} from 'react-feather';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faFacebook, faTiktok, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import { toast } from 'react-toastify';
import { supabase } from '@/lib/supabase';
import SocialMonitoringHeader from './SocialMonitoringHeader';
import SocialMonitoringSidebar from './SocialMonitoringSidebar';

const WEBHOOK_URL =
    process.env.NEXT_PUBLIC_SOCIAL_WEBHOOK_URL ||
    'https://nexus-n8n.captain.nexusbr.ai/webhook/citizen-monitoramento-redes-sociais';
const POLL_INTERVAL_MS = 10_000;
const MAX_POLL_COUNT = 60;
const COUNTDOWN_INIT = 420;
const STORAGE_KEY = 'social_searchState';
const EMPTY_LINKS = { instagram_url: '', facebook_url: '', tiktok_url: '', twitter_url: '' };

const PLATFORM_FIELDS = [
    { key: 'instagram_url', label: 'Instagram', platform: 'instagram', placeholder: 'https://instagram.com/perfil' },
    { key: 'facebook_url', label: 'Facebook', platform: 'facebook', placeholder: 'https://facebook.com/pagina' },
    { key: 'tiktok_url', label: 'TikTok', platform: 'tiktok', placeholder: 'https://tiktok.com/@perfil' },
    { key: 'twitter_url', label: 'X', platform: 'twitter', placeholder: 'https://x.com/perfil' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTimeAgo(dateStr) {
    if (!dateStr) return '';
    const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diffMin < 1) return 'agora';
    if (diffMin < 60) return `${diffMin} min atrás`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h atrás`;
    const diffD = Math.floor(diffH / 24);
    return diffD === 1 ? 'ontem' : `${diffD} dias atrás`;
}

function formatNumber(n) {
    if (!n) return '0';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return String(n);
}

function extractHandle(url) {
    if (!url) return '';
    try {
        const parts = new URL(url).pathname.replace(/^\//, '').replace(/\/$/, '').split('/').filter(Boolean);
        const prefixes = ['c', 'user', 'channel'];
        if (parts.length >= 2 && prefixes.includes(parts[0].toLowerCase())) return '@' + parts[1].replace('@', '');
        return '@' + (parts[0] || '').replace('@', '');
    } catch {
        return '@' + url.replace(/.*\//, '').replace('@', '').trim();
    }
}

function detectPlatform(url) {
    const u = url.toLowerCase();
    if (u.includes('instagram.com')) return 'instagram';
    if (u.includes('facebook.com')) return 'facebook';
    if (u.includes('tiktok.com')) return 'tiktok';
    if (u.includes('twitter.com') || u.includes('x.com')) return 'twitter';
    return 'unknown';
}

function groupByName(profiles) {
    const map = new Map();
    for (const p of profiles) {
        if (!map.has(p.name)) map.set(p.name, []);
        map.get(p.name).push(p);
    }
    return Array.from(map.entries());
}

function linksFromGroup(group) {
    const links = { ...EMPTY_LINKS };
    for (const p of group) {
        const key = `${p.platform}_url`;
        if (key in links) links[key] = p.profile_url || '';
    }
    return links;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function XLogo({ size = 14, style = {} }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

function PlatformIcon({ platform, size = 14 }) {
    if (platform === 'instagram') return <FontAwesomeIcon icon={faInstagram} style={{ width: size, height: size }} />;
    if (platform === 'facebook') return <FontAwesomeIcon icon={faFacebook} style={{ width: size, height: size }} />;
    if (platform === 'tiktok') return <FontAwesomeIcon icon={faTiktok} style={{ width: size, height: size }} />;
    if (platform === 'twitter') return <XLogo size={size} />;
    return null;
}

const PLATFORM_COLORS = {
    instagram: { bg: 'rgba(193,53,132,0.08)', color: '#c13584', border: 'rgba(193,53,132,0.25)' },
    facebook: { bg: 'rgba(37,99,235,0.08)', color: '#2563eb', border: 'rgba(37,99,235,0.25)' },
    tiktok: { bg: 'rgba(31,41,55,0.08)', color: '#1f2937', border: 'rgba(31,41,55,0.25)' },
    twitter: { bg: 'rgba(55,65,81,0.08)', color: '#374151', border: 'rgba(55,65,81,0.25)' },
};

function PlatformBadge({ platform, handle, url }) {
    const c = PLATFORM_COLORS[platform] || { bg: '#f0f0f0', color: '#666', border: '#ccc' };
    const style = { background: c.bg, color: c.color, border: `1px solid ${c.border}`, borderRadius: 999, fontSize: 10, padding: '2px 7px', display: 'inline-flex', alignItems: 'center', gap: 3, textDecoration: 'none', transition: 'opacity 0.15s' };
    if (url) {
        return (
            <a href={url} target="_blank" rel="noopener noreferrer" style={style} onMouseEnter={e => e.currentTarget.style.opacity = '0.75'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                <PlatformIcon platform={platform} size={10} />
                {handle || platform}
            </a>
        );
    }
    return (
        <span style={style}>
            <PlatformIcon platform={platform} size={10} />
            {handle || platform}
        </span>
    );
}

const PLATFORM_BG = {
    instagram: 'linear-gradient(135deg,#c13584,#833ab4)',
    facebook: '#2563eb',
    tiktok: '#1f2937',
    twitter: '#374151',
};

function PostCard({ post }) {
    const [imgError, setImgError] = useState(false);
    const isAdv = post.profile_type === 'adversario';
    const bg = PLATFORM_BG[post.platform] || '#6c757d';

    return (
        <Card className="sm-post-card mb-2">
            <div className="d-flex">
                <div className="sm-post-thumb">
                    {post.image_url && !imgError ? (
                        <img src={post.image_url} alt="" onError={() => setImgError(true)} />
                    ) : (
                        <div style={{ background: bg, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                            <PlatformIcon platform={post.platform} size={22} />
                        </div>
                    )}
                </div>
                <div className="sm-post-body">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                        <div className="d-flex align-items-center gap-1">
                            <span className="fw-bold fs-7">{post.profile_name}</span>
                            <span style={{ color: isAdv ? '#ef4444' : '#0ea46d', fontSize: 12 }}>{isAdv ? '⚔' : '🛡'}</span>
                        </div>
                        {post.post_url && (
                            <a href={post.post_url} target="_blank" rel="noopener noreferrer" className="text-muted">
                                <ExternalLink size={13} />
                            </a>
                        )}
                    </div>
                    <div className="text-muted d-flex align-items-center gap-1 mb-1" style={{ fontSize: 11 }}>
                        <PlatformIcon platform={post.platform} size={11} />
                        <span>{post.profile_handle}</span>
                        <span>·</span>
                        <span>{formatTimeAgo(post.posted_at)}</span>
                    </div>
                    {post.content && (
                        <p className="mb-1 sm-post-content">{post.content}</p>
                    )}
                    <div className="d-flex align-items-center gap-3 text-muted" style={{ fontSize: 11 }}>
                        <span className="d-flex align-items-center gap-1"><Heart size={12} />{formatNumber(post.likes)}</span>
                        <span className="d-flex align-items-center gap-1"><MessageSquare size={12} />{formatNumber(post.comments)}</span>
                        <span className="d-flex align-items-center gap-1"><Send size={12} />{formatNumber(post.shares)}</span>
                        {post.views > 0 && <span className="d-flex align-items-center gap-1"><Eye size={12} />{formatNumber(post.views)}</span>}
                    </div>
                </div>
            </div>
        </Card>
    );
}

// ─── Profile Form Modal ───────────────────────────────────────────────────────

function ProfileModal({ show, onHide, mode, initialName, initialType, initialLinks, loading, onSubmitCreate, onSubmitEdit, editGroupIds }) {
    const [name, setName] = useState(initialName);
    const [type, setType] = useState(initialType);
    const [links, setLinks] = useState(initialLinks);

    useEffect(() => {
        if (show) {
            setName(initialName);
            setType(initialType);
            setLinks(initialLinks);
        }
    }, [show, initialName, initialType, initialLinks]);

    const filledCount = Object.values(links).filter((v) => v.trim()).length;

    const handleSubmit = () => {
        if (!name.trim() || filledCount === 0) return;
        if (mode === 'create') {
            onSubmitCreate(name.trim(), type, links);
        } else {
            onSubmitEdit(editGroupIds, name.trim(), type, links);
        }
        onHide();
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title className="fs-6 d-flex align-items-center gap-2">
                    <UserPlus size={16} className="text-primary" />
                    {mode === 'create' ? 'Cadastrar Perfil Político' : 'Editar Perfil Político'}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Control
                    size="sm"
                    placeholder="Nome do político *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mb-3"
                    autoFocus
                />

                <div className="d-flex gap-2 mb-3">
                    <Button
                        size="sm"
                        variant={type === 'adversario' ? 'danger' : 'outline-danger'}
                        onClick={() => setType('adversario')}
                        className="flex-1 d-flex align-items-center justify-content-center gap-1"
                    >
                        <Zap size={13} /> Adversário
                    </Button>
                    <Button
                        size="sm"
                        variant={type === 'aliado' ? 'success' : 'outline-success'}
                        onClick={() => setType('aliado')}
                        className="flex-1 d-flex align-items-center justify-content-center gap-1"
                    >
                        <Shield size={13} /> Aliado
                    </Button>
                </div>

                <p className="text-muted fs-8 mb-2">Informe os links dos perfis nas redes sociais (pelo menos um):</p>
                {PLATFORM_FIELDS.map((pf) => (
                    <Form.Group key={pf.key} className="mb-2">
                        <Form.Label className="fs-8 text-muted mb-1 d-flex align-items-center gap-1">
                            <PlatformIcon platform={pf.platform} size={12} /> {pf.label}
                        </Form.Label>
                        <Form.Control
                            size="sm"
                            placeholder={pf.placeholder}
                            value={links[pf.key]}
                            onChange={(e) => setLinks((prev) => ({ ...prev, [pf.key]: e.target.value }))}
                        />
                    </Form.Group>
                ))}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" size="sm" onClick={onHide}>Cancelar</Button>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSubmit}
                    disabled={!name.trim() || filledCount === 0 || loading}
                    className="d-flex align-items-center gap-1"
                >
                    <Plus size={14} />
                    {mode === 'create' ? `Cadastrar${filledCount > 1 ? ` em ${filledCount} redes` : ''}` : 'Salvar Alterações'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const SocialMonitoringPage = () => {
    const [showSidebar, setShowSidebar] = useState(true);

    // Data
    const [profiles, setProfiles] = useState([]);
    const [posts, setPosts] = useState([]);
    const [loadingProfiles, setLoadingProfiles] = useState(true);
    const [loadingPosts, setLoadingPosts] = useState(true);

    // Search state
    const [scraping, setScraping] = useState(false);
    const [searchStatus, setSearchStatus] = useState('idle');
    const [searchTargetName, setSearchTargetName] = useState(null);
    const [countdownSeconds, setCountdownSeconds] = useState(0);
    const [lastSearchAt, setLastSearchAt] = useState(null);
    const [dbLastScraped, setDbLastScraped] = useState(null);

    // Filters & pagination
    const [filterType, setFilterType] = useState('todos');
    const [filterPlatform, setFilterPlatform] = useState('todas');
    const [filterProfileIds, setFilterProfileIds] = useState(null);
    const [windowDays, setWindowDays] = useState(7);
    const [maxResults, setMaxResults] = useState(50);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [modalName, setModalName] = useState('');
    const [modalType, setModalType] = useState('adversario');
    const [modalLinks, setModalLinks] = useState({ ...EMPTY_LINKS });
    const [editGroupIds, setEditGroupIds] = useState([]);

    const pollRef = useRef(null);
    const countdownRef = useRef(null);
    const pollCountRef = useRef(0);

    // ── Supabase fetches ──────────────────────────────────────────────────────

    const fetchProfiles = useCallback(async () => {
        setLoadingProfiles(true);
        try {
            const { data, error } = await supabase
                .from('social_profiles')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setProfiles(data || []);
        } catch (e) {
            console.error('fetchProfiles:', e);
        } finally {
            setLoadingProfiles(false);
        }
    }, []);

    const fetchPosts = useCallback(async () => {
        setLoadingPosts(true);
        try {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - windowDays);
            const { data, error } = await supabase
                .from('social_posts')
                .select('*')
                .gte('posted_at', cutoff.toISOString())
                .order('posted_at', { ascending: false });
            if (error) throw error;
            setPosts(data || []);
        } catch (e) {
            console.error('fetchPosts:', e);
        } finally {
            setLoadingPosts(false);
        }
    }, [windowDays]);

    const fetchDbLastScraped = useCallback(async () => {
        try {
            const { data } = await supabase
                .from('social_posts')
                .select('scraped_at')
                .order('scraped_at', { ascending: false })
                .limit(1);
            if (data?.[0]?.scraped_at) setDbLastScraped(data[0].scraped_at);
        } catch {}
    }, []);

    useEffect(() => { fetchProfiles(); }, [fetchProfiles]);
    useEffect(() => { fetchPosts(); }, [fetchPosts]);
    useEffect(() => { fetchDbLastScraped(); }, [fetchDbLastScraped]);

    // ── Polling ───────────────────────────────────────────────────────────────

    const stopAll = useCallback(() => {
        clearInterval(pollRef.current);
        clearInterval(countdownRef.current);
        pollRef.current = null;
        countdownRef.current = null;
        pollCountRef.current = 0;
    }, []);

    const finishScraping = useCallback((message, status = 'completed') => {
        stopAll();
        setScraping(false);
        setCountdownSeconds(0);
        setSearchStatus(status);
        const now = new Date().toISOString();
        setLastSearchAt(now);
        try {
            const prev = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, status, completedAt: now }));
        } catch {}
        fetchPosts();
        fetchDbLastScraped();
        if (message) toast.success(message);
    }, [stopAll, fetchPosts, fetchDbLastScraped]);

    const startPolling = useCallback((startedAt, initialCount = 0) => {
        clearInterval(pollRef.current);
        pollCountRef.current = initialCount;
        pollRef.current = setInterval(async () => {
            pollCountRef.current += 1;
            try {
                const { data } = await supabase
                    .from('social_posts')
                    .select('id')
                    .gte('scraped_at', startedAt)
                    .limit(1);
                if (data?.length > 0) {
                    finishScraping('Postagens atualizadas! Feed carregado com novos dados.');
                } else if (pollCountRef.current >= MAX_POLL_COUNT) {
                    finishScraping('Tempo esgotado. Verifique se os perfis estão corretos.', 'timeout');
                }
            } catch (e) {
                console.error('Poll error:', e);
            }
        }, POLL_INTERVAL_MS);
    }, [finishScraping]);

    const startCountdown = useCallback((initial = COUNTDOWN_INIT) => {
        clearInterval(countdownRef.current);
        setCountdownSeconds(initial);
        countdownRef.current = setInterval(() => {
            setCountdownSeconds((prev) => {
                if (prev <= 1) { clearInterval(countdownRef.current); return 0; }
                return prev - 1;
            });
        }, 1000);
    }, []);

    // ── Restore search state on mount ─────────────────────────────────────────

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const state = JSON.parse(raw);
            if (state.status === 'running' && state.startedAt) {
                const elapsed = Date.now() - new Date(state.startedAt).getTime();
                if (elapsed > 600_000) { localStorage.removeItem(STORAGE_KEY); return; }
                supabase.from('social_posts').select('id').gte('scraped_at', state.startedAt).limit(1).then(({ data }) => {
                    if (data?.length > 0) {
                        setSearchStatus('completed');
                        setLastSearchAt(new Date().toISOString());
                        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, status: 'completed' }));
                        fetchPosts();
                        fetchDbLastScraped();
                        toast.success('Busca concluída! Novos resultados encontrados.');
                    } else {
                        setScraping(true);
                        setSearchStatus('running');
                        const remaining = Math.max(0, Math.ceil((600_000 - elapsed) / 1000));
                        startCountdown(remaining);
                        startPolling(state.startedAt, Math.floor(elapsed / POLL_INTERVAL_MS));
                        toast.info('Retomando busca anterior...');
                    }
                });
            } else if (state.status === 'completed') {
                setLastSearchAt(state.completedAt || null);
                setSearchStatus('completed');
            }
        } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => () => stopAll(), [stopAll]);

    // ── Trigger search ────────────────────────────────────────────────────────

    const triggerSearch = useCallback((body, message, targetName = null) => {
        const startedAt = new Date().toISOString();
        setScraping(true);
        setSearchStatus('running');
        setSearchTargetName(targetName);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ startedAt, status: 'running' })); } catch {}
        startCountdown();
        fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ window_days: windowDays, max_results: maxResults, ...body }),
        }).catch(() => {});
        toast.info(message);
        startPolling(startedAt);
    }, [windowDays, maxResults, startCountdown, startPolling]);

    const handleScrape = () => {
        if (profiles.length === 0) { toast.error('Cadastre pelo menos um perfil antes de buscar.'); return; }
        setFilterProfileIds(null);
        triggerSearch({}, `Buscando posts dos últimos ${windowDays} dias...`, 'Todos os perfis');
    };

    const handleScrapeProfile = (profileIds) => {
        const names = profiles.filter((p) => profileIds.includes(p.id)).map((p) => p.name);
        const uniqueName = [...new Set(names)][0] || 'perfil';
        setFilterProfileIds(profileIds);
        triggerSearch({ profile_ids: profileIds }, `Buscando posts de "${uniqueName}"...`, uniqueName);
    };

    // ── Profile CRUD ──────────────────────────────────────────────────────────

    const handleAddProfile = async (name, type, links) => {
        try {
            const rows = [];
            for (const [, url] of Object.entries(links)) {
                const t = url.trim();
                if (!t) continue;
                const platform = detectPlatform(t);
                if (platform === 'unknown') continue;
                rows.push({ name, handle: extractHandle(t), profile_type: type, platform, profile_url: t });
            }
            if (rows.length === 0) return;
            const { data, error } = await supabase.from('social_profiles').insert(rows).select();
            if (error) throw error;
            setProfiles((prev) => [...(data || []), ...prev]);
            toast.success(`${name} cadastrado em ${rows.length} rede(s).`);
        } catch (e) { toast.error(e.message || 'Erro ao cadastrar perfil.'); }
    };

    const handleRemoveProfile = async (id) => {
        try {
            const { error } = await supabase.from('social_profiles').delete().eq('id', id);
            if (error) throw error;
            setProfiles((prev) => prev.filter((p) => p.id !== id));
            toast.success('Perfil removido.');
        } catch (e) { toast.error(e.message || 'Erro ao remover perfil.'); }
    };

    const handleReplaceGroup = async (oldIds, newName, newType, links) => {
        try {
            for (const id of oldIds) await supabase.from('social_profiles').delete().eq('id', id);
            const rows = [];
            for (const [, url] of Object.entries(links)) {
                const t = url.trim();
                if (!t) continue;
                const platform = detectPlatform(t);
                if (platform === 'unknown') continue;
                rows.push({ name: newName, handle: extractHandle(t), profile_type: newType, platform, profile_url: t });
            }
            if (rows.length > 0) {
                const { data, error } = await supabase.from('social_profiles').insert(rows).select();
                if (error) throw error;
                setProfiles((prev) => [...(data || []), ...prev.filter((p) => !oldIds.includes(p.id))]);
            } else {
                setProfiles((prev) => prev.filter((p) => !oldIds.includes(p.id)));
            }
            toast.success(`${newName} atualizado.`);
        } catch (e) { toast.error(e.message || 'Erro ao atualizar perfil.'); }
    };

    // ── Modal helpers ─────────────────────────────────────────────────────────

    const openCreate = () => {
        setModalMode('create'); setModalName(''); setModalType('adversario');
        setModalLinks({ ...EMPTY_LINKS }); setEditGroupIds([]); setModalOpen(true);
    };

    const openEdit = (group) => {
        setModalMode('edit'); setModalName(group[0].name); setModalType(group[0].profile_type);
        setModalLinks(linksFromGroup(group)); setEditGroupIds(group.map((p) => p.id)); setModalOpen(true);
    };

    // ── Computed ──────────────────────────────────────────────────────────────

    const adversarioGroups = groupByName(profiles.filter((p) => p.profile_type === 'adversario'));
    const aliadoGroups = groupByName(profiles.filter((p) => p.profile_type === 'aliado'));

    const totalEngagement = posts.reduce((acc, p) => acc + (p.likes || 0) + (p.comments || 0) + (p.shares || 0), 0);
    const platformCount = [...new Set(profiles.map((p) => p.platform))].length;

    const platformStats = ['instagram', 'facebook', 'tiktok', 'twitter'].map((name) => {
        const filtered = filterProfileIds?.length
            ? posts.filter((p) => filterProfileIds.includes(p.profile_id) && p.platform === name)
            : posts.filter((p) => p.platform === name);
        const engagement = filtered.reduce((a, p) => a + (p.likes || 0) + (p.comments || 0) + (p.shares || 0), 0);
        return { name, count: filtered.length, engagement };
    });

    const filteredPosts = posts.filter((p) => {
        if (filterProfileIds?.length && !filterProfileIds.includes(p.profile_id)) return false;
        if (filterType !== 'todos' && p.profile_type !== filterType) return false;
        if (filterPlatform !== 'todas' && p.platform !== filterPlatform) return false;
        return true;
    });
    const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const pagedPosts = filteredPosts.slice((safePage - 1) * pageSize, safePage * pageSize);

    useEffect(() => setPage(1), [filterType, filterPlatform, filterProfileIds, pageSize]);

    const countdownLabel = `${Math.floor(countdownSeconds / 60)}:${String(countdownSeconds % 60).padStart(2, '0')}`;

    // ── Render ────────────────────────────────────────────────────────────────

    const renderProfileGroup = (name, group, variant) => {
        const isAdv = variant === 'adversario';
        return (
            <div key={name} className={`sm-profile-chip sm-profile-chip-${variant} mb-2`}>
                <div className="d-flex align-items-start gap-2">
                    <div className={`sm-profile-avatar sm-profile-avatar-${variant}`}>{name.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                        <div className="fw-semibold fs-8 text-truncate">{name}</div>
                        <div className="d-flex flex-wrap gap-1 mt-1">
                            {group.map((p) => <PlatformBadge key={p.id} platform={p.platform} handle={p.handle} url={p.profile_url} />)}
                        </div>
                        <button
                            className={`sm-scrape-btn sm-scrape-btn-${variant} mt-2`}
                            onClick={() => handleScrapeProfile(group.map((p) => p.id))}
                            disabled={scraping}
                        >
                            <RefreshCw size={11} /> Buscar
                        </button>
                    </div>
                    <div className="d-flex gap-1 flex-shrink-0">
                        <button className="sm-icon-btn" onClick={() => openEdit(group)} title="Editar">
                            <Edit2 size={13} />
                        </button>
                        <button className="sm-icon-btn text-danger" onClick={() => group.forEach((p) => handleRemoveProfile(p.id))} title="Remover">
                            <Trash2 size={13} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="hk-pg-body py-0 social-monitoring-page">
            <div className={classNames('fmapp-wrap', { 'fmapp-sidebar-toggle': !showSidebar })}>
                <SocialMonitoringSidebar />
                <div className="fmapp-content">
                    <div className="fmapp-detail-wrap">
                        <SocialMonitoringHeader toggleSidebar={() => setShowSidebar(!showSidebar)} />
                        <div className="fm-body">
                            <SimpleBar className="nicescroll-bar">
                                <div className="container-fluid px-4 py-4">

                                    {/* Title */}
                                    <div className="mb-4">
                                        <h4 className="mb-0">Monitoramento de Redes Sociais</h4>
                                        <p className="text-muted mb-0">Acompanhe adversários e aliados em tempo real</p>
                                    </div>

                                    {/* Stats */}
                                    <div className="stats-grid mb-3">
                                        {[
                                            { label: 'Perfis Monitorados', value: profiles.length, icon: Users, cls: 'metric-icon-success' },
                                            { label: 'Postagens', value: posts.length, icon: MessageSquare, cls: 'metric-icon-warning' },
                                            { label: 'Engajamento Total', value: formatNumber(totalEngagement), icon: TrendingUp, cls: 'metric-icon-danger' },
                                            { label: 'Plataformas', value: platformCount, icon: Activity, cls: 'metric-icon-danger' },
                                        ].map((s) => (
                                            <Card key={s.label} className="metric-card h-100">
                                                <Card.Body className="text-center py-3">
                                                    <div className={classNames('metric-icon mb-2', s.cls)}><s.icon size={16} /></div>
                                                    <h2 className="mb-1 metric-value">{s.value}</h2>
                                                    <div className="text-muted fs-8">{s.label}</div>
                                                </Card.Body>
                                            </Card>
                                        ))}
                                    </div>

                                    {/* Platform summary */}
                                    <div className="platform-grid mb-4">
                                        {platformStats.map((p) => (
                                            <Card key={p.name} className={`h-100 text-center platform-card social-tone-${p.name === 'instagram' ? 'pink' : p.name === 'facebook' ? 'blue' : 'dark'}`}>
                                                <Card.Body className="py-3">
                                                    <div className={`platform-badge mx-auto mb-2 platform-brand-${p.name}`}>
                                                        <PlatformIcon platform={p.name} size={16} />
                                                    </div>
                                                    <h3 className="mb-1 metric-value">{p.count}</h3>
                                                    <small className="text-muted">{p.name === 'twitter' ? 'X (Twitter)' : p.name.charAt(0).toUpperCase() + p.name.slice(1)}</small>
                                                    {p.engagement > 0 && <div className="text-muted" style={{ fontSize: 9 }}>{formatNumber(p.engagement)} eng.</div>}
                                                </Card.Body>
                                            </Card>
                                        ))}
                                    </div>

                                    {/* Profiles section */}
                                    <Card className="mb-4 border-primary" style={{ borderColor: 'rgba(var(--bs-primary-rgb),0.3)!important', background: 'rgba(var(--bs-primary-rgb),0.02)' }}>
                                        <Card.Body className="p-3">
                                            {/* Action bar */}
                                            <div className="d-flex align-items-center flex-wrap gap-3 mb-3">
                                                <Button size="sm" variant="outline-primary" onClick={openCreate} className="d-flex align-items-center gap-1">
                                                    <UserPlus size={14} /> Cadastrar Perfil
                                                </Button>
                                                <div className="d-flex align-items-center gap-2">
                                                    <Calendar size={14} className="text-primary" />
                                                    <span className="fw-semibold fs-8">Período:</span>
                                                    <div className="d-flex gap-1">
                                                        {[7, 15, 30].map((d) => (
                                                            <button key={d} onClick={() => setWindowDays(d)} className={`sm-chip-btn ${windowDays === d ? 'sm-chip-btn-active' : ''}`}>
                                                                {d} dias
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="d-flex align-items-center gap-2 ms-auto flex-shrink-0">
                                                    <Form.Select size="sm" style={{ width: 120 }} value={maxResults} onChange={(e) => setMaxResults(Number(e.target.value))}>
                                                        <option value={25}>25 resultados</option>
                                                        <option value={50}>50 resultados</option>
                                                        <option value={100}>100 resultados</option>
                                                    </Form.Select>
                                                    <Button
                                                        size="sm"
                                                        variant="primary"
                                                        onClick={scraping ? undefined : handleScrape}
                                                        disabled={scraping || profiles.length === 0}
                                                        style={{ minWidth: 145, whiteSpace: 'nowrap' }}
                                                        className="d-flex align-items-center justify-content-center gap-2"
                                                    >
                                                        {scraping
                                                            ? <><span style={{ width: 10, height: 10, borderWidth: 2, flexShrink: 0 }} className="spinner-border" />{countdownSeconds > 0 ? countdownLabel : 'Buscando...'}</>
                                                            : <><RefreshCw size={14} /> Buscar Agora</>}
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Profile lists */}
                                            <Row className="g-3">
                                                <Col lg={6}>
                                                    <div className="d-flex align-items-center gap-2 mb-2 pb-1" style={{ borderBottom: '1px solid rgba(220,53,69,0.15)' }}>
                                                        <Zap size={14} className="text-danger" />
                                                        <span className="fs-8 fw-bold text-uppercase tracking-wide">Adversários</span>
                                                        <Badge bg="danger" className="fs-8 ms-auto">{adversarioGroups.length}</Badge>
                                                    </div>
                                                    {adversarioGroups.length === 0
                                                        ? <p className="text-muted fs-8 fst-italic">Nenhum adversário cadastrado.</p>
                                                        : adversarioGroups.map(([name, group]) => renderProfileGroup(name, group, 'adversario'))}
                                                </Col>
                                                <Col lg={6}>
                                                    <div className="d-flex align-items-center gap-2 mb-2 pb-1" style={{ borderBottom: '1px solid rgba(25,135,84,0.15)' }}>
                                                        <Shield size={14} className="text-success" />
                                                        <span className="fs-8 fw-bold text-uppercase">Aliados</span>
                                                        <Badge bg="success" className="fs-8 ms-auto">{aliadoGroups.length}</Badge>
                                                    </div>
                                                    {aliadoGroups.length === 0
                                                        ? <p className="text-muted fs-8 fst-italic">Nenhum aliado cadastrado.</p>
                                                        : aliadoGroups.map(([name, group]) => renderProfileGroup(name, group, 'aliado'))}
                                                </Col>
                                            </Row>
                                        </Card.Body>
                                    </Card>

                                    {/* Search status card */}
                                    <Card className={`mb-4 sm-status-card sm-status-card-${searchStatus}`}>
                                        <Card.Body className="p-3">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className={`sm-status-icon sm-status-icon-${searchStatus}`}>
                                                    {searchStatus === 'running' && <span className="spinner-border spinner-border-sm" />}
                                                    {searchStatus === 'completed' && <CheckCircle size={16} />}
                                                    {searchStatus === 'timeout' && <AlertCircle size={16} />}
                                                    {searchStatus === 'idle' && <Clock size={16} />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="fw-semibold fs-7 mb-0">
                                                        {searchStatus === 'running' && `Busca em andamento${searchTargetName ? ` — ${searchTargetName}` : ''}${countdownSeconds > 0 ? ` — ${countdownLabel} restantes` : '...'}`}
                                                        {searchStatus === 'completed' && `Última busca concluída${searchTargetName ? ` — ${searchTargetName}` : ''}`}
                                                        {searchStatus === 'timeout' && 'Busca expirou sem resultados'}
                                                        {searchStatus === 'idle' && 'Nenhuma busca realizada'}
                                                    </p>
                                                    <p className="text-muted fs-8 mb-0">
                                                        {searchStatus === 'running'
                                                            ? 'Você pode sair da página. Ao voltar, os resultados aparecerão automaticamente.'
                                                            : dbLastScraped
                                                            ? `Dados atualizados em: ${new Date(dbLastScraped).toLocaleString('pt-BR')}`
                                                            : 'Clique em "Buscar Agora" para iniciar a coleta de postagens.'}
                                                    </p>
                                                </div>
                                                <Button variant="outline-secondary" size="sm" disabled={scraping} onClick={() => { fetchPosts(); fetchDbLastScraped(); toast.info('Feed atualizado.'); }} className="d-flex align-items-center gap-1 flex-shrink-0">
                                                    <RefreshCw size={13} /> Atualizar
                                                </Button>
                                            </div>
                                            {scraping && (
                                                <div className="mt-2 sm-progress-bar">
                                                    <div style={{ width: `${Math.max(5, ((COUNTDOWN_INIT - countdownSeconds) / COUNTDOWN_INIT) * 100)}%`, transition: 'width 1s linear' }} />
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>

                                    {/* Feed */}
                                    <Card>
                                        <Card.Body>
                                            <div className="d-flex align-items-center flex-wrap gap-2 mb-3">
                                                <h6 className="mb-0 d-flex align-items-center gap-2 flex-1">
                                                    <Eye size={15} className="text-primary" />
                                                    Feed de Postagens
                                                    {(scraping || loadingPosts) && <span className="spinner-border spinner-border-sm ms-1" />}
                                                    <Badge bg="secondary" className="fs-8">{filteredPosts.length} posts</Badge>
                                                    {filterProfileIds?.length > 0 && (
                                                        <button onClick={() => setFilterProfileIds(null)} className="sm-clear-filter">
                                                            ✕ Filtro de perfil ativo — Mostrar todos
                                                        </button>
                                                    )}
                                                </h6>
                                                <div className="d-flex gap-2 flex-wrap">
                                                    <Form.Select size="sm" style={{ width: 140 }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                                                        <option value="todos">Todos</option>
                                                        <option value="adversario">Adversários</option>
                                                        <option value="aliado">Aliados</option>
                                                    </Form.Select>
                                                    <Form.Select size="sm" style={{ width: 140 }} value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)}>
                                                        <option value="todas">Todas Redes</option>
                                                        <option value="instagram">Instagram</option>
                                                        <option value="facebook">Facebook</option>
                                                        <option value="tiktok">TikTok</option>
                                                        <option value="twitter">X</option>
                                                    </Form.Select>
                                                    <Form.Select size="sm" style={{ width: 100 }} value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                                                        <option value={10}>10 / pág</option>
                                                        <option value={25}>25 / pág</option>
                                                        <option value={50}>50 / pág</option>
                                                    </Form.Select>
                                                </div>
                                            </div>

                                            {filteredPosts.length === 0 ? (
                                                <div className="text-center py-5 text-muted">
                                                    <Eye size={48} className="opacity-25 mb-3" />
                                                    <p className="mb-0">
                                                        {posts.length === 0
                                                            ? 'Nenhuma postagem encontrada. Cadastre perfis e clique em Buscar Agora.'
                                                            : 'Nenhuma postagem com os filtros selecionados.'}
                                                    </p>
                                                </div>
                                            ) : (
                                                <>
                                                    {pagedPosts.map((post) => <PostCard key={post.id} post={post} />)}
                                                    {totalPages > 1 && (
                                                        <div className="d-flex align-items-center justify-content-center gap-3 mt-3">
                                                            <Button variant="outline-secondary" size="sm" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="d-flex align-items-center gap-1">
                                                                <ChevronLeft size={14} /> Anterior
                                                            </Button>
                                                            <span className="text-muted fs-7">Página {safePage} de {totalPages}</span>
                                                            <Button variant="outline-secondary" size="sm" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="d-flex align-items-center gap-1">
                                                                Próxima <ChevronRight size={14} />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </Card.Body>
                                    </Card>

                                </div>
                            </SimpleBar>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Modal */}
            <ProfileModal
                show={modalOpen}
                onHide={() => setModalOpen(false)}
                mode={modalMode}
                initialName={modalName}
                initialType={modalType}
                initialLinks={modalLinks}
                loading={loadingProfiles}
                onSubmitCreate={handleAddProfile}
                onSubmitEdit={handleReplaceGroup}
                editGroupIds={editGroupIds}
            />

            <style jsx global>{`
                /* ── Layout ── */
                .social-monitoring-page .stats-grid {
                    display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
                }
                .social-monitoring-page .platform-grid {
                    display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
                }
                .social-monitoring-page .metric-card,
                .social-monitoring-page .platform-card { border-radius: 12px; }
                .social-monitoring-page .metric-value { font-size: 2rem; line-height: 1; font-weight: 700; }
                .social-monitoring-page .metric-icon { display: inline-flex; align-items: center; justify-content: center; }
                .social-monitoring-page .metric-icon-success { color: #0ea46d; }
                .social-monitoring-page .metric-icon-warning { color: #f59e0b; }
                .social-monitoring-page .metric-icon-danger { color: #ef4444; }

                /* ── Platform ── */
                .social-monitoring-page .platform-badge {
                    width: 36px; height: 36px; border-radius: 12px;
                    display: inline-flex; align-items: center; justify-content: center; color: #fff;
                }
                .social-monitoring-page .platform-brand-instagram { background: linear-gradient(135deg,#c13584,#833ab4); }
                .social-monitoring-page .platform-brand-facebook { background: #2563eb; }
                .social-monitoring-page .platform-brand-tiktok { background: #1f2937; }
                .social-monitoring-page .platform-brand-twitter { background: #374151; }
                .social-monitoring-page .social-tone-pink { background: rgba(214,41,118,0.05); }
                .social-monitoring-page .social-tone-blue { background: rgba(24,119,242,0.05); }
                .social-monitoring-page .social-tone-dark { background: rgba(15,23,42,0.04); }

                /* ── Profile chips ── */
                .social-monitoring-page .sm-profile-chip {
                    border-radius: 10px; border: 1px solid var(--bs-border-color); padding: 10px 12px;
                }
                .social-monitoring-page .sm-profile-chip-adversario {
                    background: rgba(220,53,69,0.04); border-color: rgba(220,53,69,0.2);
                }
                .social-monitoring-page .sm-profile-chip-aliado {
                    background: rgba(25,135,84,0.04); border-color: rgba(25,135,84,0.2);
                }
                .social-monitoring-page .sm-profile-avatar {
                    width: 32px; height: 32px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 12px; font-weight: 700; flex-shrink: 0;
                }
                .social-monitoring-page .sm-profile-avatar-adversario { background: rgba(220,53,69,0.15); color: #dc3545; }
                .social-monitoring-page .sm-profile-avatar-aliado { background: rgba(25,135,84,0.15); color: #198754; }
                .social-monitoring-page .sm-icon-btn {
                    background: none; border: none; padding: 2px 4px; cursor: pointer;
                    color: #6c757d; display: inline-flex; align-items: center;
                    transition: color 0.15s;
                }
                .social-monitoring-page .sm-icon-btn:hover { color: #212529; }

                /* ── Scrape button ── */
                .social-monitoring-page .sm-scrape-btn {
                    display: inline-flex; align-items: center; gap: 5px;
                    font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 6px;
                    border: 1px solid; cursor: pointer; transition: all 0.15s; background: none;
                }
                .social-monitoring-page .sm-scrape-btn:disabled { opacity: 0.4; }
                .social-monitoring-page .sm-scrape-btn-adversario {
                    color: #dc3545; border-color: rgba(220,53,69,0.3);
                }
                .social-monitoring-page .sm-scrape-btn-adversario:hover:not(:disabled) {
                    background: rgba(220,53,69,0.08);
                }
                .social-monitoring-page .sm-scrape-btn-aliado {
                    color: #198754; border-color: rgba(25,135,84,0.3);
                }
                .social-monitoring-page .sm-scrape-btn-aliado:hover:not(:disabled) {
                    background: rgba(25,135,84,0.08);
                }

                /* ── Period chips ── */
                .social-monitoring-page .sm-chip-btn {
                    padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 500;
                    border: 1px solid var(--bs-border-color); background: transparent;
                    cursor: pointer; color: #6c757d; transition: all 0.15s;
                }
                .social-monitoring-page .sm-chip-btn:hover { border-color: var(--bs-primary); }
                .social-monitoring-page .sm-chip-btn-active {
                    background: var(--bs-primary); color: #fff; border-color: var(--bs-primary);
                }

                /* ── Search status card ── */
                .social-monitoring-page .sm-status-card { transition: border-color 0.3s; }
                .social-monitoring-page .sm-status-card-idle { border-color: var(--bs-border-color) !important; }
                .social-monitoring-page .sm-status-card-running { border-color: rgba(245,158,11,0.4) !important; background: rgba(245,158,11,0.03); }
                .social-monitoring-page .sm-status-card-completed { border-color: rgba(25,135,84,0.4) !important; background: rgba(25,135,84,0.03); }
                .social-monitoring-page .sm-status-card-timeout { border-color: rgba(220,53,69,0.4) !important; background: rgba(220,53,69,0.03); }
                .social-monitoring-page .sm-status-icon {
                    width: 36px; height: 36px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
                }
                .social-monitoring-page .sm-status-icon-idle { background: rgba(108,117,125,0.1); color: #6c757d; }
                .social-monitoring-page .sm-status-icon-running { background: rgba(245,158,11,0.15); color: #f59e0b; }
                .social-monitoring-page .sm-status-icon-completed { background: rgba(25,135,84,0.15); color: #198754; }
                .social-monitoring-page .sm-status-icon-timeout { background: rgba(220,53,69,0.15); color: #dc3545; }
                .social-monitoring-page .sm-progress-bar {
                    height: 4px; background: rgba(245,158,11,0.1); border-radius: 99px; overflow: hidden;
                }
                .social-monitoring-page .sm-progress-bar > div {
                    height: 100%; background: rgba(245,158,11,0.6); border-radius: 99px;
                }

                /* ── Post cards ── */
                .social-monitoring-page .sm-post-card {
                    border-radius: 10px; border: 1px solid rgba(15,23,42,0.1);
                    transition: box-shadow 0.15s;
                }
                .social-monitoring-page .sm-post-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
                .social-monitoring-page .sm-post-thumb {
                    width: 80px; height: 80px; flex-shrink: 0; overflow: hidden;
                    border-radius: 10px 0 0 10px; background: #f0f0f0;
                }
                .social-monitoring-page .sm-post-thumb img {
                    width: 100%; height: 100%; object-fit: cover;
                }
                .social-monitoring-page .sm-post-body {
                    flex: 1; min-width: 0; padding: 10px 12px;
                }
                .social-monitoring-page .sm-post-content {
                    font-size: 12px; line-height: 1.5; color: rgba(0,0,0,0.75);
                    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
                }

                /* ── Clear filter ── */
                .social-monitoring-page .sm-clear-filter {
                    display: inline-flex; align-items: center; gap: 4px;
                    font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 999px;
                    background: rgba(var(--bs-primary-rgb),0.08); color: var(--bs-primary);
                    border: 1px solid rgba(var(--bs-primary-rgb),0.2); cursor: pointer;
                    transition: background 0.15s;
                }
                .social-monitoring-page .sm-clear-filter:hover { background: rgba(var(--bs-primary-rgb),0.15); }

                @media (max-width: 991px) {
                    .social-monitoring-page .stats-grid { grid-template-columns: repeat(2, 1fr); }
                    .social-monitoring-page .platform-grid { grid-template-columns: repeat(2, 1fr); }
                }
            `}</style>
        </div>
    );
};

export default SocialMonitoringPage;
