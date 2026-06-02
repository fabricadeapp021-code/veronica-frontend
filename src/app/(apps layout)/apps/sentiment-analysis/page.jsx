'use client'
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Card, Col, Form, Row } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faInstagram, faTiktok, faXTwitter, faYoutube } from '@fortawesome/free-brands-svg-icons';
import * as Icons from 'react-feather';
import classNames from 'classnames';
import SimpleBar from 'simplebar-react';
import { toast } from 'react-toastify';
import SentimentHeader from './SentimentHeader';
import SentimentSidebar from './SentimentSidebar';
import { supabase } from '@/lib/supabase';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const WEBHOOK_URL = process.env.NEXT_PUBLIC_SENTIMENT_WEBHOOK_URL || 'https://nexus-n8n.captain.nexusbr.ai/webhook/analise-de-sentimento';
const PEOPLE_STORAGE_KEY = 'sentiment_people_profiles';

function loadPeopleFromStorage() {
  try {
    const raw = localStorage.getItem(PEOPLE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  try {
    const old = localStorage.getItem('sentiment_social_accounts');
    if (old) {
      const a = JSON.parse(old);
      if (a.person_name) {
        const migrated = [{ id: crypto.randomUUID?.() || 'id-1', ...a, twitter_url: a.twitter_url || '' }];
        localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
    }
  } catch {}
  return [];
}

function savePeopleToStorage(people) {
  localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(people));
}

function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function parseSupabaseResult(row) {
  return {
    person_name: row.person_name,
    totals: row.totals || { messages: 0, positive: 0, neutral: 0, negative: 0 },
    percent: row.percent || { positive: 0, neutral: 0, negative: 0 },
    platforms: row.platforms || [],
    categories: row.categories || [],
    trending_topics: row.trending_topics || [],
    highlights: row.highlights || [],
    source_breakdown: row.source_breakdown || {},
    meta: row.meta || {},
  };
}

const PLATFORM_CONFIG = {
  Instagram: { icon: Icons.Instagram, tone: 'tone-instagram', iconTone: 'icon-instagram' },
  Facebook: { icon: Icons.Facebook, tone: 'tone-facebook', iconTone: 'icon-facebook' },
  TikTok: { icon: Icons.Music, tone: 'tone-tiktok', iconTone: 'icon-tiktok' },
  'X (Twitter)': { icon: Icons.Twitter, tone: 'tone-twitter', iconTone: 'icon-twitter' },
  YouTube: { icon: Icons.Youtube, tone: 'tone-youtube', iconTone: 'icon-youtube' },
  Web: { icon: Icons.Globe, tone: 'tone-twitter', iconTone: 'icon-twitter' },
};

const CATEGORY_CONFIG = {
  Saúde: { icon: Icons.Activity, iconTone: 'category-pink' },
  Educação: { icon: Icons.BookOpen, iconTone: 'category-purple' },
  Segurança: { icon: Icons.Shield, iconTone: 'category-blue' },
  Infraestrutura: { icon: Icons.Tool, iconTone: 'category-orange' },
  Economia: { icon: Icons.DollarSign, iconTone: 'category-orange' },
  'Meio Ambiente': { icon: Icons.Globe, iconTone: 'category-purple' },
};

const mock = {
    total: 1247,
    cards: [
        { label: 'Positivo', mentions: 498, percent: 39.9, delta: '+2.3%', tone: 'success', icon: Icons.Smile },
        { label: 'Neutro', mentions: 312, percent: 25.0, delta: '-0.8%', tone: 'warning', icon: Icons.Meh },
        { label: 'Negativo', mentions: 437, percent: 35.1, delta: '+1.5%', tone: 'danger', icon: Icons.Frown },
    ],
    evolution: {
        labels: ['25/Jan', '02/Fev', '09/Fev', '16/Fev'],
        series: [
            { name: 'Positivo', data: [36, 33, 35, 38] },
            { name: 'Neutro', data: [28, 25, 27, 24] },
            { name: 'Negativo', data: [34, 41, 36, 35] },
        ],
    },
    history: {
        labels: ['24/Nov', '08/Dez', '22/Dez', '05/Jan', '19/Jan', '02/Fev', '16/Fev'],
        series: [
            { name: 'Total', data: [192, 214, 222, 255, 290, 278, 302] },
            { name: 'Positivo', data: [88, 93, 105, 112, 138, 149, 144] },
            { name: 'Neutro', data: [70, 76, 73, 80, 85, 72, 79] },
            { name: 'Negativo', data: [80, 87, 79, 91, 121, 88, 104] },
        ],
    },
    platforms: [
        { name: 'Instagram', mentions: 423, p: 45, n: 30, ng: 25, icon: Icons.Instagram, tone: 'tone-instagram', iconTone: 'icon-instagram' },
        { name: 'Facebook', mentions: 356, p: 35, n: 25, ng: 40, icon: Icons.Facebook, tone: 'tone-facebook', iconTone: 'icon-facebook' },
        { name: 'TikTok', mentions: 234, p: 50, n: 20, ng: 30, icon: Icons.Music, tone: 'tone-tiktok', iconTone: 'icon-tiktok' },
        { name: 'X (Twitter)', mentions: 178, p: 28, n: 22, ng: 50, icon: Icons.Twitter, tone: 'tone-twitter', iconTone: 'icon-twitter' },
        { name: 'YouTube', mentions: 56, p: 42, n: 28, ng: 30, icon: Icons.Youtube, tone: 'tone-youtube', iconTone: 'icon-youtube' },
    ],
    categories: [
        { name: 'Saúde', mentions: 312, p: 32, n: 18, ng: 50, icon: Icons.Activity, iconTone: 'category-pink' },
        { name: 'Educação', mentions: 278, p: 50, n: 25, ng: 25, icon: Icons.BookOpen, iconTone: 'category-purple' },
        { name: 'Segurança', mentions: 245, p: 20, n: 15, ng: 65, icon: Icons.Shield, iconTone: 'category-blue' },
        { name: 'Infraestrutura', mentions: 198, p: 50, n: 28, ng: 22, icon: Icons.Tool, iconTone: 'category-orange' },
    ],
    topics: [
        { tag: '#SaúdePública', sentiment: 'Negativo', mentions: 234, delta: '+12%' },
        { tag: '#EducaçãoParaTodos', sentiment: 'Positivo', mentions: 189, delta: '+8%' },
        { tag: '#TransporteUrbano', sentiment: 'Negativo', mentions: 156, delta: '-3%' },
    ],
    mentions: [
        { id: 1, name: 'Maria Silva', handle: '@mariasilva', ago: '12 min atrás', text: 'Excelente iniciativa do candidato na área de educação! Finalmente alguém que pensa no futuro das crianças.', category: 'Educação', sentiment: 'Positivo', platform: 'instagram', likes: 234, comments: 45, shares: 67 },
        { id: 2, name: 'João Santos', handle: '@joao.santos', ago: '28 min atrás', text: 'Cadê o plano de saúde que foi prometido? Minha mãe está na fila há 3 meses esperando cirurgia. Cobrem!', category: 'Saúde', sentiment: 'Negativo', platform: 'facebook', likes: 567, comments: 123, shares: 234 },
        { id: 3, name: 'Ana Pereira', handle: '@anapereira', ago: '45 min atrás', text: 'Visitei a obra do novo parque e está ficando bonito sim, gente! Não é propaganda, fui lá ver pessoalmente.', category: 'Meio Ambiente', sentiment: 'Positivo', platform: 'tiktok', likes: 1234, comments: 89, shares: 345 },
        { id: 4, name: 'Carlos Mendes', handle: '@cmendes', ago: '1h atrás', text: 'Mais um assalto no centro da cidade. A segurança pública está um caos. Quando vão resolver isso?', category: 'Segurança', sentiment: 'Negativo', platform: 'twitter', likes: 432, comments: 98, shares: 187 },
        { id: 5, name: 'Fernanda Lima', handle: '@fernandalima', ago: '1h30 atrás', text: 'A proposta de transporte gratuito para estudantes é interessante. Vamos acompanhar se vai sair do papel.', category: 'Infraestrutura', sentiment: 'Neutro', platform: 'instagram', likes: 156, comments: 34, shares: 23 },
        { id: 6, name: 'Roberto Alves', handle: '@roberto.alves', ago: '2h atrás', text: 'As escolas municipais melhoraram muito esse ano. Parabéns pela gestão na educação!', category: 'Educação', sentiment: 'Positivo', platform: 'facebook', likes: 321, comments: 56, shares: 89 },
        { id: 7, name: 'Canal Cidade Viva', handle: '@cidadeviva', ago: '3h atrás', text: 'Análise completa: O que mudou na infraestrutura da cidade nos últimos 6 meses? Resultado surpreendente!', category: 'Infraestrutura', sentiment: 'Neutro', platform: 'youtube', likes: 876, comments: 234, shares: 123 },
        { id: 8, name: 'Lucas Oliveira', handle: '@lucasoliv', ago: '3h30 atrás', text: 'URGENTE: posto de saúde do meu bairro fechou sem aviso. Pessoas doentes sem atendimento. Isso é um absurdo!', category: 'Saúde', sentiment: 'Negativo', platform: 'tiktok', likes: 2345, comments: 456, shares: 789 },
    ],
};

function buildDisplayMock(analysisData) {
  const totals = analysisData.totals || {};
  const percent = analysisData.percent || {};
  const t = totals.messages ?? 0;
  const pos = totals.positive ?? 0;
  const neu = totals.neutral ?? 0;
  const neg = totals.negative ?? 0;
  const pPos = percent.positive ?? 0;
  const pNeu = percent.neutral ?? 0;
  const pNeg = percent.negative ?? 0;

  const cards = [
    { label: 'Positivo', mentions: pos, percent: pPos, delta: '+0%', tone: 'success', icon: Icons.Smile },
    { label: 'Neutro', mentions: neu, percent: pNeu, delta: '0%', tone: 'warning', icon: Icons.Meh },
    { label: 'Negativo', mentions: neg, percent: pNeg, delta: '+0%', tone: 'danger', icon: Icons.Frown },
  ];

  const platforms = (analysisData.platforms || []).map((p) => {
    const cfg = PLATFORM_CONFIG[p.name] || PLATFORM_CONFIG.Web;
    const total = p.total ?? 0;
    const pP = total ? Math.round((p.positive / total) * 100) : 0;
    const pN = total ? Math.round((p.neutral / total) * 100) : 0;
    const pNg = total ? Math.round((p.negative / total) * 100) : 0;
    return {
      name: p.name,
      mentions: total,
      p: pP,
      n: pN,
      ng: pNg,
      icon: cfg.icon,
      tone: cfg.tone,
      iconTone: cfg.iconTone,
    };
  });

  if (platforms.length === 0) {
    Object.entries(PLATFORM_CONFIG).forEach(([name, cfg]) => {
      platforms.push({ name, mentions: 0, p: 0, n: 0, ng: 0, ...cfg });
    });
  }

  const categories = (analysisData.categories || []).map((c) => {
    const cfg = CATEGORY_CONFIG[c.name] || { icon: Icons.Grid, iconTone: 'category-orange' };
    const total = c.total ?? 0;
    const pP = total ? Math.round((c.positive / total) * 100) : 0;
    const pN = total ? Math.round((c.neutral / total) * 100) : 0;
    const pNg = total ? Math.round((c.negative / total) * 100) : 0;
    return {
      name: c.name,
      mentions: total,
      p: pP,
      n: pN,
      ng: pNg,
      icon: cfg.icon,
      iconTone: cfg.iconTone,
    };
  });

  const sourceToPlatform = {
    instagram: 'instagram',
    facebook: 'facebook',
    tiktok: 'tiktok',
    twitter: 'twitter',
    youtube: 'youtube',
  };

  const sentimentLabel = (s) => (s === 'positive' ? 'Positivo' : s === 'negative' ? 'Negativo' : 'Neutro');

  const topics = (analysisData.trending_topics || []).map((t) => ({
    tag: t.topic.startsWith('#') ? t.topic : `#${t.topic}`,
    sentiment: sentimentLabel(t.sentiment),
    mentions: t.count ?? 0,
    delta: '+0%',
  }));

  function buildHighlightUrl(h) {
    if (h.url && String(h.url).startsWith('http')) return h.url;
    const source = (h.source || '').toLowerCase();
    const author = (h.author || h.meta?.username || '').toString().trim().replace(/^@/, '');
    if (source === 'tiktok' && author) {
      const videoId = h.meta?.video_id || h.video_id || h.meta?.id;
      if (videoId) return `https://www.tiktok.com/@${author}/video/${videoId}`;
      return `https://www.tiktok.com/@${author}`;
    }
    if (source === 'instagram' && author) return `https://www.instagram.com/${author}`;
    if (source === 'facebook' && author) return `https://www.facebook.com/${author}`;
    if ((source === 'twitter' || source === 'x') && author) return `https://x.com/${author}`;
    return '';
  }

  const mentions = (analysisData.highlights || [])
    .filter((h) => h.text || h.title)
    .map((h, i) => {
      let ago = '';
      if (h.date) {
        try {
          const d = new Date(h.date);
          if (!isNaN(d.getTime())) {
            const now = new Date();
            const diffMin = Math.floor((now - d) / 60000);
            if (diffMin < 60) ago = `${diffMin} min atrás`;
            else if (diffMin < 1440) ago = `${Math.floor(diffMin / 60)}h atrás`;
            else ago = `${Math.floor(diffMin / 1440)} dia(s) atrás`;
          }
        } catch {}
      }
      const handleUrl = buildHighlightUrl(h);
      return {
        id: h.id || `h-${i}`,
        name: h.author || sourceToPlatform[h.source] || 'Anônimo',
        handle: handleUrl || h.url || '',
        ago,
        text: h.text || h.title || '',
        category: h.category || 'geral',
        sentiment: sentimentLabel(h.sentiment),
        platform: (h.source && sourceToPlatform[h.source]) || 'web',
        likes: h.likes ?? 0,
        comments: h.comments ?? 0,
        shares: h.shares ?? 0,
      };
    });

  return {
    total: t,
    cards,
    evolution: mock.evolution,
    history: mock.history,
    platforms,
    categories,
    topics: topics.length ? topics : mock.topics,
    mentions: mentions.length ? mentions : mock.mentions,
  };
}

const evolutionByRange = {
    '7': {
        labels: ['16/Fev'],
        max: 40,
        series: [
            { name: 'Positivo', data: [40] },
            { name: 'Neutro', data: [25] },
            { name: 'Negativo', data: [35] },
        ],
    },
    '15': {
        labels: ['09/Fev', '16/Fev'],
        max: 40,
        series: [
            { name: 'Positivo', data: [36, 40] },
            { name: 'Neutro', data: [27, 25] },
            { name: 'Negativo', data: [37, 35] },
        ],
    },
    '30': {
        labels: ['26/Jan', '02/Fev', '09/Fev', '16/Fev'],
        max: 60,
        series: [
            { name: 'Positivo', data: [37, 33, 36, 39] },
            { name: 'Neutro', data: [28, 25, 27, 25] },
            { name: 'Negativo', data: [34, 42, 37, 35] },
        ],
    },
    '90': {
        labels: ['05/Jan', '12/Jan', '19/Jan', '26/Jan', '02/Fev', '09/Fev', '16/Fev'],
        max: 60,
        series: [
            { name: 'Positivo', data: [32, 35, 37, 38, 33, 36, 40] },
            { name: 'Neutro', data: [30, 30, 28, 28, 25, 27, 25] },
            { name: 'Negativo', data: [38, 35, 35, 34, 42, 37, 35] },
        ],
    },
};

const historyByRange = {
    '7': {
        labels: ['16/Fev'],
        max: 380,
        series: [
            { name: 'Total', data: [370] },
            { name: 'Positivo', data: [180] },
            { name: 'Neutro', data: [80] },
            { name: 'Negativo', data: [115] },
        ],
    },
    '15': {
        labels: ['09/Fev', '16/Fev'],
        max: 380,
        series: [
            { name: 'Total', data: [350, 370] },
            { name: 'Positivo', data: [150, 175] },
            { name: 'Neutro', data: [95, 82] },
            { name: 'Negativo', data: [105, 115] },
        ],
    },
    '30': {
        labels: ['26/Jan', '02/Fev', '09/Fev', '16/Fev'],
        max: 380,
        series: [
            { name: 'Total', data: [330, 320, 350, 370] },
            { name: 'Positivo', data: [145, 160, 150, 175] },
            { name: 'Neutro', data: [88, 72, 96, 82] },
            { name: 'Negativo', data: [102, 92, 106, 116] },
        ],
    },
    '90': {
        labels: ['24/Nov', '01/Dez', '08/Dez', '15/Dez', '22/Dez', '29/Dez', '05/Jan', '12/Jan', '19/Jan', '26/Jan', '02/Fev', '09/Fev', '16/Fev'],
        max: 380,
        series: [
            { name: 'Total', data: [210, 235, 240, 246, 249, 280, 295, 320, 330, 320, 320, 350, 370] },
            { name: 'Positivo', data: [92, 100, 95, 105, 110, 115, 120, 135, 110, 145, 160, 150, 175] },
            { name: 'Neutro', data: [60, 65, 72, 70, 73, 78, 82, 75, 90, 85, 72, 96, 82] },
            { name: 'Negativo', data: [83, 86, 90, 88, 82, 90, 95, 110, 130, 100, 90, 105, 115] },
        ],
    },
    custom: {
        labels: ['02/Fev', '09/Fev', '16/Fev', '22/Fev'],
        max: 400,
        series: [
            { name: 'Total', data: [320, 350, 370, 400] },
            { name: 'Positivo', data: [160, 150, 175, 198] },
            { name: 'Neutro', data: [70, 95, 80, 90] },
            { name: 'Negativo', data: [90, 105, 115, 112] },
        ],
    },
};

const lineOptions = (labels, max) => ({
    chart: { type: 'line', toolbar: { show: false }, zoom: { enabled: false }, foreColor: '#646A71', fontFamily: 'DM Sans' },
    stroke: { curve: 'smooth', width: 2.5 },
    markers: { size: 3.5, strokeWidth: 0 },
    grid: { borderColor: '#eceff3' },
    dataLabels: { enabled: false },
    legend: { position: 'bottom', fontSize: '12px' },
    xaxis: { categories: labels, axisBorder: { show: false } },
    yaxis: { min: 0, max },
    colors: ['#0ea46d', '#f59e0b', '#ef4444', '#10b981'],
});

const toneMap = { Positivo: 'success', Neutro: 'warning', Negativo: 'danger' };
const sentimentBadgeMap = {
    Positivo: { cls: 'sentiment-pill-positive', icon: Icons.ThumbsUp },
    Neutro: { cls: 'sentiment-pill-neutral', icon: Icons.Minus },
    Negativo: { cls: 'sentiment-pill-negative', icon: Icons.ThumbsDown },
};
const platformIconMap = {
    instagram: Icons.Instagram,
    facebook: Icons.Facebook,
    tiktok: null,
    twitter: null,
    youtube: null,
};

const SentimentDashboard = () => {
    const [showSidebar, setShowSidebar] = useState(true);
    const [query, setQuery] = useState('');
    const [mentionSentimentFilter, setMentionSentimentFilter] = useState('all');
    const [mentionPlatformFilter, setMentionPlatformFilter] = useState('all');
    const [evolutionRange, setEvolutionRange] = useState('30');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [historyRange, setHistoryRange] = useState('90');
    const [historyCustomStartDate, setHistoryCustomStartDate] = useState('2026-02-01');
    const [historyCustomEndDate, setHistoryCustomEndDate] = useState('2026-02-23');
    const [mentionPage, setMentionPage] = useState(1);

    const MENTIONS_PAGE_SIZE = 10;
    const [people, setPeople] = useState(loadPeopleFromStorage);
    const [selectedPersonId, setSelectedPersonId] = useState(() => {
        const p = loadPeopleFromStorage();
        return p.length > 0 ? p[0].id : null;
    });
    const [analysisData, setAnalysisData] = useState(null);
    const [loadingPersonId, setLoadingPersonId] = useState(null);
    const [lastAnalyzed, setLastAnalyzed] = useState(null);
    const [countdown, setCountdown] = useState(0);
    const [windowDays, setWindowDays] = useState(15);
    const [maxResults, setMaxResults] = useState(50);
    const [showAddCandidate, setShowAddCandidate] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [draft, setDraft] = useState({ person_name: '', instagram_url: '', facebook_url: '', tiktok_url: '', twitter_url: '' });
    const countdownRef = useRef(null);

    const selectedPerson = useMemo(() => people.find((p) => p.id === selectedPersonId) || null, [people, selectedPersonId]);

    useEffect(() => {
        if (!supabase || !selectedPerson) {
            setAnalysisData(null);
            setLastAnalyzed(null);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const { data, error } = await supabase
                    .from('sentiment_analyses')
                    .select('*')
                    .eq('person_name', selectedPerson.person_name)
                    .eq('status', 'completed')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                if (!cancelled && !error && data) {
                    setAnalysisData(parseSupabaseResult(data));
                    setLastAnalyzed(new Date(data.updated_at || data.created_at).toLocaleString('pt-BR'));
                } else if (!cancelled) {
                    setAnalysisData(null);
                    setLastAnalyzed(null);
                }
            } catch {
                if (!cancelled) {
                    setAnalysisData(null);
                    setLastAnalyzed(null);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [selectedPerson?.person_name]);

    useEffect(() => {
        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, []);

    const pollAnalysis = useCallback(async (analysisId) => {
        const MAX_POLLS = 60;
        for (let i = 0; i < MAX_POLLS; i++) {
            await new Promise((r) => setTimeout(r, 5000));
            if (!supabase) continue;
            try {
                const { data, error } = await supabase
                    .from('sentiment_analyses')
                    .select('*')
                    .eq('id', analysisId)
                    .single();
                if (error) continue;
                if (data.status === 'completed') {
                    setAnalysisData(parseSupabaseResult(data));
                    setLastAnalyzed(new Date(data.updated_at || data.created_at).toLocaleString('pt-BR'));
                    setLoadingPersonId(null);
                    setCountdown(0);
                    if (countdownRef.current) clearInterval(countdownRef.current);
                    toast.success(`Análise concluída. ${data.totals?.messages || 0} menções analisadas.`);
                    return;
                }
                if (data.status === 'error') {
                    setLoadingPersonId(null);
                    setCountdown(0);
                    if (countdownRef.current) clearInterval(countdownRef.current);
                    toast.error(data.error_message || 'Erro na análise.');
                    return;
                }
            } catch {}
        }
        setLoadingPersonId(null);
        setCountdown(0);
        if (countdownRef.current) clearInterval(countdownRef.current);
        toast.error('Tempo esgotado. A análise pode ainda estar em andamento. Atualize a página em alguns minutos.');
    }, []);

    const handleAnalyze = useCallback(
        async (person) => {
            if (!person?.person_name?.trim()) return;
            setSelectedPersonId(person.id);
            setLoadingPersonId(person.id);
            setCountdown(300);
            if (countdownRef.current) clearInterval(countdownRef.current);
            countdownRef.current = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        if (countdownRef.current) clearInterval(countdownRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            try {
                const res = await fetch(WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        person_name: person.person_name,
                        instagram_url: person.instagram_url || '',
                        facebook_url: person.facebook_url || '',
                        tiktok_url: person.tiktok_url || '',
                        twitter_url: person.twitter_url || '',
                        max_results: maxResults,
                        window_days: windowDays,
                    }),
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                const analysisId = json.analysis_id;
                if (!analysisId) throw new Error('analysis_id não retornado');
                toast.info('Análise iniciada. Coletando dados das redes sociais...');
                pollAnalysis(analysisId);
            } catch (err) {
                setLoadingPersonId(null);
                setCountdown(0);
                if (countdownRef.current) clearInterval(countdownRef.current);
                toast.error(err?.message || 'Erro ao iniciar análise.');
            }
        },
        [pollAnalysis, maxResults, windowDays]
    );

    const displayMock = useMemo(() => (analysisData ? buildDisplayMock(analysisData) : mock), [analysisData]);

    const currentEvolution = useMemo(() => {
        if (evolutionRange === 'custom') {
            return evolutionByRange['30'];
        }
        return evolutionByRange[evolutionRange];
    }, [evolutionRange]);

    const evolutionOptions = useMemo(() => lineOptions(currentEvolution.labels, currentEvolution.max), [currentEvolution]);
    const currentHistory = useMemo(() => {
        if (historyRange === 'custom') {
            return historyByRange.custom;
        }
        return historyByRange[historyRange];
    }, [historyRange]);
    const historyOptions = useMemo(() => lineOptions(currentHistory.labels, currentHistory.max), [currentHistory]);
    const filtered = displayMock.mentions.filter((m) => {
        const matchQuery = `${m.name} ${m.text} ${m.category}`.toLowerCase().includes(query.toLowerCase());
        const matchSentiment = mentionSentimentFilter === 'all' || m.sentiment.toLowerCase() === mentionSentimentFilter;
        const matchPlatform = mentionPlatformFilter === 'all' || m.platform === mentionPlatformFilter;
        return matchQuery && matchSentiment && matchPlatform;
    });

    const totalMentionPages = Math.max(1, Math.ceil(filtered.length / MENTIONS_PAGE_SIZE));
    const safeMentionPage = Math.min(mentionPage, totalMentionPages);
    const pagedMentions = filtered.slice((safeMentionPage - 1) * MENTIONS_PAGE_SIZE, safeMentionPage * MENTIONS_PAGE_SIZE);

    useEffect(() => {
        setMentionPage(1);
    }, [query, mentionSentimentFilter, mentionPlatformFilter]);

    const handleSaveCandidate = () => {
        if (!draft.person_name.trim()) return;
        if (editingId) {
            const updated = people.map((p) => (p.id === editingId ? { ...p, ...draft } : p));
            setPeople(updated);
            savePeopleToStorage(updated);
        } else {
            const newPerson = { id: crypto.randomUUID?.() || `p-${Date.now()}`, ...draft };
            const updated = [...people, newPerson];
            setPeople(updated);
            savePeopleToStorage(updated);
            setSelectedPersonId(newPerson.id);
        }
        setShowAddCandidate(false);
        setEditingId(null);
        setDraft({ person_name: '', instagram_url: '', facebook_url: '', tiktok_url: '', twitter_url: '' });
        toast.success('Perfil salvo.');
    };

    const handleDeleteCandidate = (id) => {
        const updated = people.filter((p) => p.id !== id);
        setPeople(updated);
        savePeopleToStorage(updated);
        if (selectedPersonId === id) setSelectedPersonId(updated[0]?.id || null);
    };

    const handleEditCandidate = (p) => {
        setEditingId(p.id);
        setDraft({ person_name: p.person_name, instagram_url: p.instagram_url || '', facebook_url: p.facebook_url || '', tiktok_url: p.tiktok_url || '', twitter_url: p.twitter_url || '' });
        setShowAddCandidate(true);
    };

    return (
        <div className="hk-pg-body py-0 sentiment-analysis-page">
            <div className={classNames('fmapp-wrap', { 'fmapp-sidebar-toggle': !showSidebar })}>
                <SentimentSidebar />
                <div className="fmapp-content">
                    <div className="fmapp-detail-wrap">
                        <SentimentHeader toggleSidebar={() => setShowSidebar(!showSidebar)} />
                        <div className="fm-body">
                            <SimpleBar className="nicescroll-bar">
                                <div className="container-fluid px-4 py-4">
                                    <Card className="mb-3 border-2 border-success border-opacity-25 bg-success bg-opacity-10">
                                        <Card.Body className="p-4">
                                            <h6 className="mb-3 d-flex align-items-center gap-2">
                                                <Icons.User size={14} className="text-success" />
                                                Candidatos Monitorados
                                            </h6>
                                            <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                                                <span className="small text-muted">Parâmetros:</span>
                                                <Form.Select size="sm" style={{ width: 100 }} value={windowDays} onChange={(e) => setWindowDays(Number(e.target.value))}>
                                                    <option value={7}>7 dias</option>
                                                    <option value={15}>15 dias</option>
                                                    <option value={30}>30 dias</option>
                                                </Form.Select>
                                                <Form.Select size="sm" style={{ width: 120 }} value={maxResults} onChange={(e) => setMaxResults(Number(e.target.value))}>
                                                    <option value={50}>50 resultados</option>
                                                    <option value={75}>75 resultados</option>
                                                    <option value={100}>100 resultados</option>
                                                </Form.Select>
                                            </div>
                                            {people.length > 0 && !showAddCandidate && (
                                                <div className="d-flex flex-column gap-2 mb-3">
                                                    {people.map((p) => {
                                                        const isSelected = selectedPersonId === p.id;
                                                        const isLoading = loadingPersonId === p.id;
                                                        return (
                                                            <div
                                                                key={p.id}
                                                                className={classNames('d-flex align-items-center justify-content-between p-3 rounded border cursor-pointer', isSelected ? 'border-success bg-success bg-opacity-10' : 'border-secondary border-opacity-25')}
                                                                style={{ cursor: 'pointer' }}
                                                                onClick={() => setSelectedPersonId(p.id)}
                                                            >
                                                                <div>
                                                                    <div className="fw-semibold">{p.person_name}</div>
                                                                    <div className="small text-muted d-flex align-items-center gap-2 flex-wrap">
                                                                        {p.instagram_url && <span className="d-inline-flex align-items-center" title="Instagram"><Icons.Instagram size={14} /></span>}
                                                                        {p.facebook_url && <span className="d-inline-flex align-items-center" title="Facebook"><Icons.Facebook size={14} /></span>}
                                                                        {p.tiktok_url && <span className="d-inline-flex align-items-center" title="TikTok"><FontAwesomeIcon icon={faTiktok} style={{ fontSize: 14 }} /></span>}
                                                                        {p.twitter_url && <span className="d-inline-flex align-items-center" title="X (Twitter)"><FontAwesomeIcon icon={faXTwitter} style={{ fontSize: 14 }} /></span>}
                                                                    </div>
                                                                </div>
                                                                <div className="d-flex align-items-center gap-1">
                                                                    <Button variant="light" size="sm" className="p-2" onClick={(e) => { e.stopPropagation(); handleEditCandidate(p); }}>
                                                                        <Icons.Edit2 size={12} />
                                                                    </Button>
                                                                    <Button variant="light" size="sm" className="p-2 text-danger" onClick={(e) => { e.stopPropagation(); handleDeleteCandidate(p.id); }}>
                                                                        <Icons.Trash2 size={12} />
                                                                    </Button>
                                                                    <Button
                                                                        variant="success"
                                                                        size="sm"
                                                                        disabled={!!loadingPersonId || !supabase}
                                                                        onClick={(e) => { e.stopPropagation(); handleAnalyze(p); }}
                                                                    >
                                                                        {isLoading ? (
                                                                            <><Icons.Clock size={12} className="me-1" />{formatCountdown(countdown)}</>
                                                                        ) : (
                                                                            <><Icons.Globe size={12} className="me-1" />Analisar</>
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            {showAddCandidate && (
                                                <div className="p-3 rounded border border-success border-opacity-50 bg-white bg-opacity-50 mb-3">
                                                    <Form.Group className="mb-2">
                                                        <Form.Label className="small">Nome do Candidato *</Form.Label>
                                                        <Form.Control size="sm" placeholder="Nome completo" value={draft.person_name} onChange={(e) => setDraft((d) => ({ ...d, person_name: e.target.value }))} />
                                                    </Form.Group>
                                                    <p className="small text-muted mb-2">Informe os perfis para buscar menções sobre o candidato.</p>
                                                    <Row className="g-2 mb-2">
                                                        <Col md={6}><Form.Label className="small">Instagram</Form.Label><Form.Control size="sm" placeholder="https://instagram.com/..." value={draft.instagram_url} onChange={(e) => setDraft((d) => ({ ...d, instagram_url: e.target.value }))} /></Col>
                                                        <Col md={6}><Form.Label className="small">Facebook</Form.Label><Form.Control size="sm" placeholder="https://facebook.com/..." value={draft.facebook_url} onChange={(e) => setDraft((d) => ({ ...d, facebook_url: e.target.value }))} /></Col>
                                                        <Col md={6}><Form.Label className="small">TikTok</Form.Label><Form.Control size="sm" placeholder="https://tiktok.com/@..." value={draft.tiktok_url} onChange={(e) => setDraft((d) => ({ ...d, tiktok_url: e.target.value }))} /></Col>
                                                        <Col md={6}><Form.Label className="small">X (Twitter)</Form.Label><Form.Control size="sm" placeholder="https://x.com/..." value={draft.twitter_url} onChange={(e) => setDraft((d) => ({ ...d, twitter_url: e.target.value }))} /></Col>
                                                    </Row>
                                                    <div className="d-flex gap-2">
                                                        <Button variant="success" size="sm" onClick={handleSaveCandidate} disabled={!draft.person_name.trim()}>
                                                            <Icons.Save size={12} className="me-1" />Salvar
                                                        </Button>
                                                        <Button variant="outline-secondary" size="sm" onClick={() => { setShowAddCandidate(false); setEditingId(null); }}>Cancelar</Button>
                                                    </div>
                                                </div>
                                            )}
                                            {!showAddCandidate && (
                                                <Button variant="outline-success" size="sm" className="mb-0" onClick={() => { setEditingId(null); setDraft({ person_name: '', instagram_url: '', facebook_url: '', tiktok_url: '', twitter_url: '' }); setShowAddCandidate(true); }}>
                                                    <Icons.Plus size={12} className="me-1" />Adicionar candidato
                                                </Button>
                                            )}
                                            {people.length === 0 && !showAddCandidate && <p className="small text-muted mb-0">Nenhum candidato cadastrado. Clique em Adicionar candidato para começar.</p>}
                                        </Card.Body>
                                    </Card>

                                    {loadingPersonId && (
                                        <Card className="mb-3">
                                            <Card.Body className="text-center py-5">
                                                <Icons.Clock size={32} className="text-success mb-2 animate-pulse" />
                                                <h5 className="text-success">{formatCountdown(countdown)}</h5>
                                                <p className="small text-muted mb-0">Coletando e analisando menções nas redes sociais. A página atualizará automaticamente quando concluir.</p>
                                            </Card.Body>
                                        </Card>
                                    )}

                                    {!loadingPersonId && selectedPerson && !analysisData && (
                                        <Card className="mb-3 border border-dashed">
                                            <Card.Body className="text-center py-4">
                                                <Icons.Globe size={28} className="text-muted mb-2" />
                                                <p className="mb-0 small">Clique em <strong>Analisar</strong> ao lado de <strong>{selectedPerson.person_name}</strong> para iniciar a coleta.</p>
                                            </Card.Body>
                                        </Card>
                                    )}

                                    {!analysisData && !loadingPersonId && (
                                        <div className="alert alert-light border mb-3 small">Os cards e gráficos abaixo usam dados de demonstração até que uma análise seja concluída.</div>
                                    )}

                                    <div className="sent-grid mb-3">
                                        {displayMock.cards.map((c) => (
                                            <Card key={c.label} className={`sent-kpi sent-kpi-${c.tone}`}>
                                                <Card.Body>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div className={`sent-icon sent-icon-${c.tone}`}><c.icon size={15} /></div>
                                                            <div><div className="fs-8 text-muted">{c.label}</div><h3 className={`mb-0 text-${c.tone}`}>{c.percent}%</h3></div>
                                                        </div>
                                                        <small className={c.delta.startsWith('-') ? 'text-danger' : 'text-success'}>{c.delta}</small>
                                                    </div>
                                                    <small className="text-muted">{c.mentions} menções</small>
                                                </Card.Body>
                                            </Card>
                                        ))}
                                    </div>

                                    <Card className="mb-3"><Card.Body>
                                        <h6 className="mb-3"><Icons.BarChart2 size={14} className="me-2 text-success" />Resumo de Sentimento</h6>
                                        <Row className="mb-2"><Col md={4}><div className="text-muted fs-8">Total de menções</div><h3>{displayMock.total}</h3></Col><Col md={8}><div className="d-flex justify-content-between"><h4 className="text-success">{displayMock.cards[0].mentions}</h4><h4 className="text-warning">{displayMock.cards[1].mentions}</h4><h4 className="text-danger">{displayMock.cards[2].mentions}</h4></div></Col></Row>
                                        <div className="sent-bar mb-2"><div className="p" style={{ width: `${displayMock.cards[0].percent}%` }} /><div className="n" style={{ width: `${displayMock.cards[1].percent}%` }} /><div className="ng" style={{ width: `${displayMock.cards[2].percent}%` }} /></div>
                                        <div className="d-flex justify-content-between fs-8 text-muted"><span>Positivo {displayMock.cards[0].percent}%</span><span>Neutro {displayMock.cards[1].percent}%</span><span>Negativo {displayMock.cards[2].percent}%</span></div>
                                    </Card.Body></Card>

                                    <Card className="mb-3"><Card.Body>
                                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                                            <h6 className="mb-0"><Icons.TrendingUp size={14} className="me-2 text-success" />Evolução do Sentimento</h6>
                                            <div className="d-flex align-items-center gap-2">
                                                <Form.Select
                                                    size="sm"
                                                    style={{ width: 180 }}
                                                    value={evolutionRange}
                                                    onChange={(e) => setEvolutionRange(e.target.value)}
                                                >
                                                    <option value="7">Últimos 7 dias</option>
                                                    <option value="15">Últimos 15 dias</option>
                                                    <option value="30">Últimos 30 dias</option>
                                                    <option value="90">Últimos 90 dias</option>
                                                    <option value="custom">Personalizado</option>
                                                </Form.Select>
                                                {evolutionRange === 'custom' && (
                                                    <>
                                                        <Form.Control
                                                            size="sm"
                                                            type="date"
                                                            style={{ width: 150 }}
                                                            value={customStartDate}
                                                            onChange={(e) => setCustomStartDate(e.target.value)}
                                                            aria-label="Data início"
                                                        />
                                                        <span className="text-muted fs-8">até</span>
                                                        <Form.Control
                                                            size="sm"
                                                            type="date"
                                                            style={{ width: 150 }}
                                                            value={customEndDate}
                                                            onChange={(e) => setCustomEndDate(e.target.value)}
                                                            aria-label="Data fim"
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <ReactApexChart options={evolutionOptions} series={currentEvolution.series} type="line" height={320} width="100%" />
                                    </Card.Body></Card>

                                    <Card className="mb-3"><Card.Body>
                                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                                            <div>
                                                <h6 className="mb-0"><Icons.Activity size={14} className="me-2 text-success" />Histórico de Menções</h6>
                                                <small className="text-muted">Volume de menções por sentimento ao longo do tempo</small>
                                            </div>
                                            <div className="d-flex align-items-center gap-2">
                                                <Form.Select
                                                    size="sm"
                                                    style={{ width: 180 }}
                                                    value={historyRange}
                                                    onChange={(e) => setHistoryRange(e.target.value)}
                                                >
                                                    <option value="7">Últimos 7 dias</option>
                                                    <option value="15">Últimos 15 dias</option>
                                                    <option value="30">Últimos 30 dias</option>
                                                    <option value="90">Últimos 90 dias</option>
                                                    <option value="custom">Personalizado</option>
                                                </Form.Select>
                                                {historyRange === 'custom' && (
                                                    <>
                                                        <Form.Control
                                                            size="sm"
                                                            type="date"
                                                            style={{ width: 150 }}
                                                            value={historyCustomStartDate}
                                                            onChange={(e) => setHistoryCustomStartDate(e.target.value)}
                                                            aria-label="Data início histórico"
                                                        />
                                                        <span className="text-muted fs-8">até</span>
                                                        <Form.Control
                                                            size="sm"
                                                            type="date"
                                                            style={{ width: 150 }}
                                                            value={historyCustomEndDate}
                                                            onChange={(e) => setHistoryCustomEndDate(e.target.value)}
                                                            aria-label="Data fim histórico"
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <ReactApexChart options={historyOptions} series={currentHistory.series} type="line" height={320} width="100%" />
                                    </Card.Body></Card>

                                    <Card className="mb-3"><Card.Body>
                                        <h6 className="mb-3"><Icons.Grid size={14} className="me-2 text-success" />Sentimento por Plataforma</h6>
                                        <div className="platform-grid">
                                            {displayMock.platforms.map((p) => (
                                                <Card key={p.name} className={`platform-card ${p.tone}`}><Card.Body className="py-3">
                                                    <div className="d-flex align-items-center gap-2 mb-2">
                                                        <div className={`platform-icon ${p.iconTone}`} style={{ color: '#fff' }}>
                                                            {p.name === 'Instagram' && <FontAwesomeIcon icon={faInstagram} style={{ fontSize: 16 }} />}
                                                            {p.name === 'Facebook' && <FontAwesomeIcon icon={faFacebook} style={{ fontSize: 16 }} />}
                                                            {p.name === 'TikTok' && <FontAwesomeIcon icon={faTiktok} style={{ fontSize: 16 }} />}
                                                            {p.name === 'X (Twitter)' && <FontAwesomeIcon icon={faXTwitter} style={{ fontSize: 16 }} />}
                                                            {p.name === 'YouTube' && <FontAwesomeIcon icon={faYoutube} style={{ fontSize: 16 }} />}
                                                            {!['Instagram', 'Facebook', 'TikTok', 'X (Twitter)', 'YouTube'].includes(p.name) && <p.icon size={13} />}
                                                        </div>
                                                        <div><div className="fw-semibold">{p.name}</div><small className="text-muted">{p.mentions} menções</small></div>
                                                    </div>
                                                    <div className="sent-bar mb-2"><div className="p" style={{ width: `${p.p}%` }} /><div className="n" style={{ width: `${p.n}%` }} /><div className="ng" style={{ width: `${p.ng}%` }} /></div>
                                                    <div className="d-flex justify-content-between align-items-center fs-8">
                                                        <span className="text-success"><Icons.ThumbsUp size={11} className="me-1" />{p.p}%</span>
                                                        <span className="text-warning"><Icons.Minus size={11} className="me-1" />{p.n}%</span>
                                                        <span className="text-danger"><Icons.ThumbsDown size={11} className="me-1" />{p.ng}%</span>
                                                    </div>
                                                </Card.Body></Card>
                                            ))}
                                        </div>
                                    </Card.Body></Card>

                                    {/* Sentimento por Categoria — comentado para não exibir na tela
                                    <Card className="mb-3"><Card.Body>
                                        <h6 className="mb-3"><Icons.Filter size={14} className="me-2 text-success" />Sentimento por Categoria</h6>
                                        {displayMock.categories.map((c) => (
                                            <div key={c.name} className="mb-2">
                                                <div className="d-flex justify-content-between fs-8 mb-1">
                                                    <span className="fw-medium d-flex align-items-center gap-2">
                                                        <span className={`category-icon ${c.iconTone}`}><c.icon size={12} /></span>
                                                        {c.name} <Badge bg="light" text="dark">{c.mentions}</Badge>
                                                    </span>
                                                    <span><span className="text-success me-2">{c.p}%</span><span className="text-warning me-2">{c.n}%</span><span className="text-danger">{c.ng}%</span></span>
                                                </div>
                                                <div className="sent-bar"><div className="p" style={{ width: `${c.p}%` }} /><div className="n" style={{ width: `${c.n}%` }} /><div className="ng" style={{ width: `${c.ng}%` }} /></div>
                                            </div>
                                        ))}
                                    </Card.Body></Card>
                                    */}

                                    <Card className="mb-3"><Card.Body>
                                        <h6 className="mb-3"><Icons.Zap size={14} className="me-2 text-success" />Tópicos em Alta</h6>
                                        {displayMock.topics.map((t) => {
                                            const badgeMeta = sentimentBadgeMap[t.sentiment];
                                            const BadgeIcon = badgeMeta?.icon || Icons.Circle;
                                            return (
                                                <div key={t.tag} className="d-flex justify-content-between align-items-center mb-2">
                                                    <div>
                                                        <span className="fw-semibold me-2">{t.tag}</span>
                                                        <span className={`sentiment-pill ${badgeMeta?.cls || ''}`}>
                                                            <BadgeIcon size={10} className="me-1" />
                                                            {t.sentiment}
                                                        </span>
                                                    </div>
                                                    <div className="fs-8"><span className="text-muted me-2">{t.mentions} menções</span><span className={t.delta.startsWith('-') ? 'text-danger' : 'text-success'}>{t.delta}</span></div>
                                                </div>
                                            );
                                        })}
                                    </Card.Body></Card>

                                    <Card><Card.Body>
                                        <h6 className="mb-3"><Icons.MessageSquare size={14} className="me-2 text-success" />Menções Recentes</h6>
                                        <Row className="g-2 mb-3">
                                            <Col lg={6}>
                                                <Form.Control value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar menções..." />
                                            </Col>
                                            <Col sm={6} lg={3}>
                                                <Form.Select value={mentionSentimentFilter} onChange={(e) => setMentionSentimentFilter(e.target.value)}>
                                                    <option value="all">Todos</option>
                                                    <option value="positivo">Positivo</option>
                                                    <option value="neutro">Neutro</option>
                                                    <option value="negativo">Negativo</option>
                                                </Form.Select>
                                            </Col>
                                            <Col sm={6} lg={3}>
                                                <Form.Select value={mentionPlatformFilter} onChange={(e) => setMentionPlatformFilter(e.target.value)}>
                                                    <option value="all">Todas</option>
                                                    <option value="instagram">Instagram</option>
                                                    <option value="facebook">Facebook</option>
                                                    <option value="tiktok">TikTok</option>
                                                    <option value="twitter">X (Twitter)</option>
                                                    <option value="youtube">YouTube</option>
                                                </Form.Select>
                                            </Col>
                                        </Row>
                                        <div className="mentions-grid">
                                            {pagedMentions.map((m) => (
                                                <Card key={m.id} className="mention-card"><Card.Body>
                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div className="mention-avatar d-flex align-items-center justify-content-center">
                                                                {m.platform === 'tiktok' ? (
                                                                    <FontAwesomeIcon icon={faTiktok} style={{ fontSize: 14 }} />
                                                                ) : m.platform === 'twitter' ? (
                                                                    <FontAwesomeIcon icon={faXTwitter} style={{ fontSize: 14 }} />
                                                                ) : m.platform === 'youtube' ? (
                                                                    <FontAwesomeIcon icon={faYoutube} style={{ fontSize: 14 }} />
                                                                ) : m.platform === 'instagram' ? (
                                                                    <FontAwesomeIcon icon={faInstagram} style={{ fontSize: 14 }} />
                                                                ) : m.platform === 'facebook' ? (
                                                                    <FontAwesomeIcon icon={faFacebook} style={{ fontSize: 14 }} />
                                                                ) : (
                                                                    (() => {
                                                                        const PlatformIcon = platformIconMap[m.platform];
                                                                        return PlatformIcon ? <PlatformIcon size={14} /> : <span className="fw-bold" style={{ fontSize: 12 }}>{m.name.charAt(0)}</span>;
                                                                    })()
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="fw-semibold">{m.name}</div>
                                                                <small className="text-muted">{m.handle && !String(m.handle).startsWith('http') ? `${m.handle} - ` : ''}{m.ago}</small>
                                                            </div>
                                                        </div>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <span className={`sentiment-pill ${sentimentBadgeMap[m.sentiment]?.cls || ''}`}>
                                                                {(() => {
                                                                    const SentimentIcon = sentimentBadgeMap[m.sentiment]?.icon || Icons.Circle;
                                                                    return <SentimentIcon size={10} className="me-1" />;
                                                                })()}
                                                                {m.sentiment}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className="mb-2 mention-text">{m.text}</p>
                                                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                                        <Badge bg="light" text="dark">{m.category}</Badge>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <small className="text-muted d-flex align-items-center gap-2 mb-0">
                                                                <span><Icons.Heart size={11} className="me-1" />{m.likes}</span>
                                                                <span><Icons.MessageCircle size={11} className="me-1" />{m.comments}</span>
                                                                <span><Icons.Share2 size={11} className="me-1" />{m.shares}</span>
                                                            </small>
                                                            {m.handle && String(m.handle).startsWith('http') && (
                                                                <Button
                                                                    variant="outline-secondary"
                                                                    size="sm"
                                                                    as="a"
                                                                    href={m.handle}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="d-inline-flex align-items-center"
                                                                >
                                                                    <Icons.ExternalLink size={12} className="me-1" />
                                                                    Ver post
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Card.Body></Card>
                                            ))}
                                        </div>
                                        {totalMentionPages > 1 && (
                                            <div className="d-flex justify-content-center align-items-center gap-2 mt-3">
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    disabled={safeMentionPage <= 1}
                                                    onClick={() => setMentionPage((p) => Math.max(1, p - 1))}
                                                >
                                                    Anterior
                                                </Button>
                                                <span className="text-muted small">
                                                    Página {safeMentionPage} de {totalMentionPages}
                                                </span>
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    disabled={safeMentionPage >= totalMentionPages}
                                                    onClick={() => setMentionPage((p) => Math.min(totalMentionPages, p + 1))}
                                                >
                                                    Próxima
                                                </Button>
                                            </div>
                                        )}
                                    </Card.Body></Card>

                                    <div className="alert alert-info mt-3 mb-0"><Icons.Info size={16} className="me-2" />{analysisData ? `Dados da análise de ${analysisData.person_name}${lastAnalyzed ? ` (${lastAnalyzed})` : ''}.` : 'Cadastre candidatos acima e clique em Analisar para coletar menções nas redes. Os dados abaixo são de demonstração até concluir uma análise.'}</div>
                                </div>
                            </SimpleBar>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .sentiment-analysis-page .sent-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
                .sentiment-analysis-page .sent-kpi { border-radius: 12px; }
                .sentiment-analysis-page .sent-kpi-success { border: 1px solid rgba(14, 164, 109, .35); }
                .sentiment-analysis-page .sent-kpi-warning { border: 1px solid rgba(245, 158, 11, .35); }
                .sentiment-analysis-page .sent-kpi-danger { border: 1px solid rgba(239, 68, 68, .35); }
                .sentiment-analysis-page .sent-icon { width: 30px; height: 30px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; }
                .sentiment-analysis-page .sent-icon-success { color: #0ea46d; background: rgba(14, 164, 109, .12); }
                .sentiment-analysis-page .sent-icon-warning { color: #f59e0b; background: rgba(245, 158, 11, .12); }
                .sentiment-analysis-page .sent-icon-danger { color: #ef4444; background: rgba(239, 68, 68, .12); }
                .sentiment-analysis-page .sent-bar { height: 10px; border-radius: 999px; overflow: hidden; display: flex; background: #edf0f3; }
                .sentiment-analysis-page .sent-bar .p { background: #0ea46d; }
                .sentiment-analysis-page .sent-bar .n { background: #f59e0b; }
                .sentiment-analysis-page .sent-bar .ng { background: #ef4444; }
                .sentiment-analysis-page .platform-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
                .sentiment-analysis-page .platform-card { border-radius: 12px; border: 1px solid rgba(15, 23, 42, .14); }
                .sentiment-analysis-page .platform-icon { width: 34px; height: 34px; border-radius: 10px; color: #fff; display: inline-flex; align-items: center; justify-content: center; }
                .sentiment-analysis-page .icon-instagram { background: linear-gradient(135deg, #c13584, #833ab4); }
                .sentiment-analysis-page .icon-facebook { background: #1877f2; }
                .sentiment-analysis-page .icon-tiktok { background: #1f2937; }
                .sentiment-analysis-page .icon-twitter { background: #111827; }
                .sentiment-analysis-page .icon-youtube { background: #ff3b30; }
                .sentiment-analysis-page .tone-instagram { background: rgba(193, 53, 132, .06); border: 1px solid rgba(193, 53, 132, .2); }
                .sentiment-analysis-page .tone-facebook { background: rgba(37, 99, 235, .05); border: 1px solid rgba(37, 99, 235, .2); }
                .sentiment-analysis-page .tone-tiktok { background: rgba(17, 24, 39, .03); border: 1px solid rgba(17, 24, 39, .12); }
                .sentiment-analysis-page .tone-twitter { background: rgba(17, 24, 39, .02); border: 1px solid rgba(17, 24, 39, .12); }
                .sentiment-analysis-page .tone-youtube { background: rgba(255, 59, 48, .05); border: 1px solid rgba(255, 59, 48, .2); }
                .sentiment-analysis-page .category-icon { width: 18px; height: 18px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; }
                .sentiment-analysis-page .category-pink { color: #c026d3; background: rgba(192, 38, 211, .12); }
                .sentiment-analysis-page .category-purple { color: #7c3aed; background: rgba(124, 58, 237, .12); }
                .sentiment-analysis-page .category-blue { color: #2563eb; background: rgba(37, 99, 235, .12); }
                .sentiment-analysis-page .category-orange { color: #d97706; background: rgba(217, 119, 6, .12); }
                .sentiment-analysis-page .mentions-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
                .sentiment-analysis-page .mention-card { border-radius: 12px; border: 1px solid rgba(15, 23, 42, .12); }
                .sentiment-analysis-page .mention-avatar { width: 30px; height: 30px; border-radius: 999px; background: #f1f5f9; color: #0f172a; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; }
                .sentiment-analysis-page .mention-text { min-height: 56px; }
                .sentiment-analysis-page .sentiment-pill { display: inline-flex; align-items: center; border-radius: 999px; padding: 3px 9px; font-size: 11px; font-weight: 600; line-height: 1; border: 1px solid transparent; }
                .sentiment-analysis-page .sentiment-pill-positive { color: #0ea46d; background: rgba(14, 164, 109, .12); border-color: rgba(14, 164, 109, .35); }
                .sentiment-analysis-page .sentiment-pill-neutral { color: #d97706; background: rgba(217, 119, 6, .12); border-color: rgba(217, 119, 6, .35); }
                .sentiment-analysis-page .sentiment-pill-negative { color: #ef4444; background: rgba(239, 68, 68, .12); border-color: rgba(239, 68, 68, .35); }
                @media (max-width: 991px) { .sentiment-analysis-page .sent-grid, .sentiment-analysis-page .platform-grid, .sentiment-analysis-page .mentions-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
                @media (max-width: 767px) { .sentiment-analysis-page .sent-grid, .sentiment-analysis-page .platform-grid, .sentiment-analysis-page .mentions-grid { grid-template-columns: 1fr; } }
            `}</style>
        </div>
    );
};

export default SentimentDashboard;
