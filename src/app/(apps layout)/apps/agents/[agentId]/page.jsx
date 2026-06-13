'use client';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, MessageSquare, Phone, Globe, Zap, BookOpen, BarChart2,
  Clock, Users, Activity, Settings, Trash2, RefreshCw, CheckCircle,
  XCircle, AlertCircle, ChevronRight, Eye, Send,
} from 'react-feather';
import { apiRequest } from '@/lib/api/client';
import AgentsSidebar from '../AgentsSidebar';
import { useColorMode } from '@/hooks/useColorMode';

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'geral',        label: 'Geral' },
  { key: 'comunicacao',  label: 'Comunicação' },
  { key: 'uso',          label: 'Uso' },
  { key: 'rotinas',      label: 'Rotinas' },
  { key: 'memoria',      label: 'Memória' },
  { key: 'evals',        label: 'Evals' },
  { key: 'auditoria',    label: 'Auditoria' },
];

const STATUS_COLORS = {
  active:    { bg: 'rgba(16,185,129,0.15)', text: '#10b981', dot: '#10b981' },
  paused:    { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', dot: '#f59e0b' },
  draft:     { bg: 'rgba(107,114,128,0.15)', text: '#6b7280', dot: '#6b7280' },
  archived:  { bg: 'rgba(239,68,68,0.15)', text: '#ef4444', dot: '#ef4444' },
};

const STATUS_LABELS = { active: 'Online', paused: 'Pausado', draft: 'Rascunho', archived: 'Arquivado' };

const WORKSPACE_SECTIONS = [
  { key: 'SOUL',      label: 'SOUL.md',      icon: '✦', desc: 'Personalidade e valores' },
  { key: 'IDENTITY',  label: 'IDENTITY.md',  icon: '👤', desc: 'Nome, branding e tom' },
  { key: 'AGENTS',    label: 'AGENTS.md',    icon: '⚙️', desc: 'Fluxos e comportamento' },
  { key: 'TOOLS',     label: 'TOOLS.md',     icon: '🔧', desc: 'Ferramentas disponíveis' },
  { key: 'MEMORY',    label: 'MEMORY.md',    icon: '💾', desc: 'Memória persistente' },
  { key: 'USER',      label: 'USER.md',      icon: '👥', desc: 'Perfil do usuário' },
];

const JUDGE_MODELS = [
  { value: 'claude-sonnet-4-6',  label: 'Claude Sonnet 4.6 (padrão)' },
  { value: 'gpt-4o',             label: 'GPT-4o' },
  { value: 'gpt-4o-mini',        label: 'GPT-4o Mini' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useColors() {
  const { isDark } = useColorMode();
  return {
    isDark,
    bg:           isDark ? '#13151a' : '#f8f9fa',
    panelBg:      isDark ? '#1a1d27' : '#ffffff',
    cardBg:       isDark ? '#1e2130' : '#ffffff',
    border:       isDark ? '#2a2f3d' : '#e7eaf0',
    textPrimary:  isDark ? '#dde3ef' : '#212529',
    textMuted:    isDark ? '#8d97b0' : '#6c757d',
    tabActiveBg:  isDark ? '#1c2748' : '#e8f0fe',
    tabActiveText:isDark ? '#93bbfc' : '#1a56db',
    inputBg:      isDark ? '#252a3a' : '#ffffff',
    successBg:    isDark ? 'rgba(16,185,129,0.12)' : '#d1fae5',
    warningBg:    isDark ? 'rgba(245,158,11,0.12)' : '#fef3c7',
    dangerBg:     isDark ? 'rgba(239,68,68,0.08)'  : '#fef2f2',
  };
}

function ScoreBar({ score, size = 'md' }) {
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  const h = size === 'sm' ? 4 : 6;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: h, borderRadius: h, background: 'rgba(128,128,128,0.2)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: h, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: size === 'sm' ? 11 : 13, fontWeight: 600, color, minWidth: 36, textAlign: 'right' }}>
        {score}%
      </span>
    </div>
  );
}

function VerdictBadge({ verdict }) {
  const map = {
    passed:  { label: 'Passou',   bg: 'rgba(16,185,129,0.15)',  color: '#10b981' },
    failed:  { label: 'Falhou',   bg: 'rgba(239,68,68,0.15)',   color: '#ef4444' },
    partial: { label: 'Parcial',  bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
  };
  const m = map[verdict] || map.partial;
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: m.bg, color: m.color }}>
      {m.label}
    </span>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function GeralTab({ agent, colors, onUpdate }) {
  const [form, setForm] = useState({ name: agent?.name || '', roleTitle: agent?.roleTitle || '', responsibleName: agent?.responsibleName || '', phone: agent?.phone || '' });
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [webSearch, setWebSearch] = useState(!!agent?.webSearchEnabled);
  const [togglingWebSearch, setTogglingWebSearch] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await apiRequest(`/agents/${agent.id}`, { method: 'PATCH', body: form });
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2500);
      if (onUpdate) onUpdate({ ...agent, ...form });
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const toggleWebSearch = async () => {
    setTogglingWebSearch(true);
    const next = !webSearch;
    try {
      await apiRequest(`/agents/${agent.id}`, { method: 'PATCH', body: { webSearchEnabled: next } });
      setWebSearch(next);
      if (onUpdate) onUpdate({ ...agent, webSearchEnabled: next });
    } catch { /* ignore */ } finally { setTogglingWebSearch(false); }
  };

  const inputStyle = { background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.textPrimary, borderRadius: 8, padding: '0.45rem 0.75rem', width: '100%', fontSize: 14 };

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Conversas',   value: agent?.metrics?.runs || '—',     icon: <MessageSquare size={16} /> },
          { label: 'Rotinas',     value: '—',                              icon: <Clock size={16} /> },
          { label: 'Uso diário',  value: '0%',                             icon: <Activity size={16} /> },
        ].map(s => (
          <div key={s.label} style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ color: colors.textMuted, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              {s.icon} {s.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: colors.textPrimary }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Dados do colaborador */}
      <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: colors.textPrimary }}>Dados do Colaborador</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            { label: 'Nome', key: 'name' },
            { label: 'Cargo', key: 'roleTitle' },
            { label: 'Responsável', key: 'responsibleName' },
            { label: 'Telefone', key: 'phone' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4, display: 'block' }}>{f.label}</label>
              <input style={inputStyle} value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }}>
          {saveOk && <span style={{ fontSize: 12, color: '#10b981' }}>✓ Salvo</span>}
          <button onClick={save} disabled={saving}
            style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Salvando…' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      {/* Atalhos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Integrações', desc: 'Ferramentas e credenciais conectadas a este agente', href: `/apps/agents/connectors?agentId=${agent.id}` },
          { label: 'Personalidade', desc: 'Prompts, fluxos e memória deste agente', href: `/apps/agents/${agent.id}/prompts` },
        ].map(s => (
          <Link key={s.label} href={s.href} style={{ textDecoration: 'none' }}>
            <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 16, transition: 'border-color 0.12s', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
              onMouseLeave={e => e.currentTarget.style.borderColor = colors.border}>
              <div style={{ fontWeight: 600, fontSize: 13, color: colors.textPrimary, marginBottom: 2 }}>{s.label} →</div>
              <div style={{ fontSize: 12, color: colors.textMuted }}>{s.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Capacidades da plataforma */}
      <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: colors.textPrimary, marginBottom: 14 }}>Capacidades da Plataforma</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>
              🔍 Busca Web
            </div>
            <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
              Permite que o agente pesquise informações atuais na internet durante conversas.
            </div>
          </div>
          <button
            onClick={toggleWebSearch}
            disabled={togglingWebSearch}
            style={{
              width: 44, height: 24, borderRadius: 12, border: 'none', cursor: togglingWebSearch ? 'not-allowed' : 'pointer',
              background: webSearch ? '#3b82f6' : (colors.isDark ? '#374151' : '#d1d5db'),
              position: 'relative', transition: 'background 0.2s', flexShrink: 0, opacity: togglingWebSearch ? 0.7 : 1,
            }}
          >
            <span style={{
              position: 'absolute', top: 2, left: webSearch ? 22 : 2,
              width: 20, height: 20, borderRadius: '50%', background: '#fff',
              transition: 'left 0.2s', display: 'block',
            }} />
          </button>
        </div>
      </div>

      {/* Zona de perigo */}
      <div style={{ background: colors.dangerBg, border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: '#ef4444', marginBottom: 8 }}>Zona de Perigo</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, color: colors.textPrimary }}>Excluir colaborador digital</div>
            <div style={{ fontSize: 12, color: colors.textMuted }}>Esta ação não pode ser desfeita.</div>
          </div>
          <button style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

function ComunicacaoTab({ agent, colors }) {
  const channels = [
    {
      key: 'whatsapp', label: 'WhatsApp', icon: '📱',
      color: '#25D366', desc: 'Canal principal de atendimento',
      connected: !!(agent?.wabaPhoneNumberId || agent?.phone),
      detail: agent?.phone || agent?.wabaPhoneNumberId || null,
    },
    {
      key: 'telegram', label: 'Telegram', icon: '✈️',
      color: '#229ED9', desc: 'Atendimento via Telegram Bot',
      connected: !!agent?.telegramBotUsername,
      detail: agent?.telegramBotUsername || null,
    },
    {
      key: 'discord', label: 'Discord', icon: '🎮',
      color: '#5865F2', desc: 'Indisponível',
      connected: false, unavailable: true,
    },
    {
      key: 'slack', label: 'Slack', icon: '💬',
      color: '#E01E5A', desc: 'Em breve',
      connected: false, comingSoon: true,
    },
  ];

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ fontWeight: 600, fontSize: 14, color: colors.textPrimary, marginBottom: 14 }}>Canais de Comunicação</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        {channels.map(ch => (
          <div key={ch.key} style={{
            background: colors.cardBg,
            border: `1px solid ${ch.connected ? ch.color + '40' : colors.border}`,
            borderRadius: 12, padding: 16,
            opacity: ch.unavailable ? 0.5 : 1,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>{ch.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: colors.textPrimary }}>{ch.label}</div>
                  <div style={{ fontSize: 12, color: colors.textMuted }}>{ch.desc}</div>
                </div>
              </div>
              {ch.connected && (
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                  Ativo
                </span>
              )}
              {ch.comingSoon && (
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                  Em breve
                </span>
              )}
            </div>
            {ch.connected && ch.detail && (
              <div style={{ marginTop: 10, fontSize: 12, color: colors.textMuted, fontFamily: 'monospace' }}>{ch.detail}</div>
            )}
            {!ch.connected && !ch.unavailable && !ch.comingSoon && (
              <Link href={`/apps/agents/connectors?agentId=${agent.id}`}
                style={{ display: 'inline-block', marginTop: 10, fontSize: 12, color: '#3b82f6', textDecoration: 'none' }}>
                Conectar →
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


function UsoTab({ colors }) {
  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24, textAlign: 'center' }}>
        <BarChart2 size={32} color={colors.textMuted} style={{ marginBottom: 12 }} />
        <div style={{ fontWeight: 600, fontSize: 15, color: colors.textPrimary, marginBottom: 6 }}>Métricas de uso</div>
        <div style={{ fontSize: 13, color: colors.textMuted }}>Relatórios detalhados de conversas, latência e custo por agente em breve.</div>
      </div>
    </div>
  );
}

const SCHEDULE_PRESETS = [
  { label: 'Todo minuto (teste)',        value: '* * * * *' },
  { label: 'Todo dia às 09:00',         value: '0 9 * * *' },
  { label: 'Todo dia às 18:00',         value: '0 18 * * *' },
  { label: 'Toda segunda às 08:00',     value: '0 8 * * 1' },
  { label: 'Toda sexta às 17:00',       value: '0 17 * * 5' },
  { label: 'A cada hora (comercial)',   value: '0 8-18 * * 1-5' },
  { label: 'Personalizado…',            value: 'custom' },
];

function isValidCron(expr) {
  if (!expr) return false;
  const parts = expr.trim().split(/\s+/);
  return parts.length === 5;
}

function friendlySchedule(expr) {
  const found = SCHEDULE_PRESETS.find(p => p.value === expr);
  return found && found.value !== 'custom' ? found.label : expr;
}

const HEARTBEAT_INTERVALS = [
  { label: 'A cada 15 minutos', value: '15m' },
  { label: 'A cada 30 minutos', value: '30m' },
  { label: 'A cada 1 hora',     value: '1h'  },
  { label: 'A cada 2 horas',    value: '2h'  },
  { label: 'A cada 4 horas',    value: '4h'  },
  { label: 'A cada 8 horas',    value: '8h'  },
  { label: 'Uma vez ao dia',    value: '24h' },
];

function HeartbeatSection({ agent, colors }) {
  const hb = agent.heartbeat || {};
  const [enabled, setEnabled]     = useState(!!hb.enabled);
  const [every, setEvery]         = useState(hb.every || '30m');
  const [start, setStart]         = useState(hb.activeHours?.start || '08:00');
  const [end, setEnd]             = useState(hb.activeHours?.end   || '22:00');
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [err, setErr]             = useState('');

  const save = async () => {
    setSaving(true);
    setErr('');
    setSaved(false);
    try {
      await apiRequest(`/agents/${agent.id}`, {
        method: 'PATCH',
        body: {
          heartbeat: {
            enabled,
            every,
            activeHours: { start, end, timezone: 'America/Sao_Paulo' },
          },
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setErr(e?.message || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    background: colors.inputBg, border: `1px solid ${colors.border}`,
    color: colors.textPrimary, borderRadius: 8, padding: '0.4rem 0.7rem',
    fontSize: 13,
  };

  return (
    <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20, marginBottom: 28 }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: enabled ? 18 : 0 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={15} color="#8b5cf6" />
            Heartbeat
          </div>
          <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 3 }}>
            O agente acorda periodicamente, lê o <code style={{ fontFamily: 'monospace', background: 'rgba(139,92,246,0.1)', padding: '1px 5px', borderRadius: 4 }}>HEARTBEAT.md</code> e executa as tarefas definidas.
          </div>
        </div>
        {/* Toggle */}
        <div
          onClick={() => setEnabled(v => !v)}
          style={{
            width: 42, height: 24, borderRadius: 12, flexShrink: 0, cursor: 'pointer', position: 'relative',
            background: enabled ? '#8b5cf6' : colors.border, transition: 'background 0.2s',
          }}>
          <div style={{
            position: 'absolute', top: 3, left: enabled ? 21 : 3,
            width: 18, height: 18, borderRadius: '50%', background: '#fff',
            transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }} />
        </div>
      </div>

      {/* Config fields — only when enabled */}
      {enabled && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: colors.textMuted, display: 'block', marginBottom: 4 }}>Frequência</label>
              <select style={{ ...inputStyle, width: '100%', height: 36 }} value={every} onChange={e => setEvery(e.target.value)}>
                {HEARTBEAT_INTERVALS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: colors.textMuted, display: 'block', marginBottom: 4 }}>Início do horário ativo</label>
              <input type="time" style={{ ...inputStyle, width: '100%', height: 36 }} value={start} onChange={e => setStart(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: colors.textMuted, display: 'block', marginBottom: 4 }}>Fim do horário ativo</label>
              <input type="time" style={{ ...inputStyle, width: '100%', height: 36 }} value={end} onChange={e => setEnd(e.target.value)} />
            </div>
          </div>

          <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 14 }}>
            Fora do horário ativo o agente responde <code style={{ fontFamily: 'monospace' }}>HEARTBEAT_OK</code> sem executar tarefas. Edite as tarefas na aba <strong>Prompts → Heartbeat</strong>.
          </div>

          {err && <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 10 }}>{err}</div>}

          <button
            onClick={save} disabled={saving}
            style={{ background: saved ? '#10b981' : '#8b5cf6', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1, transition: 'background 0.3s' }}>
            {saving ? 'Salvando…' : saved ? 'Salvo!' : 'Salvar heartbeat'}
          </button>
        </>
      )}

      {!enabled && (
        <div style={{ marginTop: 10, fontSize: 12, color: colors.textMuted }}>
          Heartbeat desativado — o agente não faz verificações periódicas automáticas.
        </div>
      )}
    </div>
  );
}

function RotinasTab({ agent, colors }) {
  const [jobs, setJobs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [gatewayErr, setGatewayErr] = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [preset, setPreset]       = useState(SCHEDULE_PRESETS[0].value);
  const [customExpr, setCustomExpr] = useState('');
  const [message, setMessage]     = useState('');
  const [saving, setSaving]       = useState(false);
  const [formErr, setFormErr]     = useState('');
  const [deleting, setDeleting]   = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setGatewayErr('');
    apiRequest(`/agents/${agent.id}/cron`)
      .then(r => setJobs(r?.jobs || []))
      .catch(e => {
        const msg = e?.message || '';
        if (msg.includes('503') || msg.toLowerCase().includes('unavailable') || msg.toLowerCase().includes('not supported')) {
          setGatewayErr('O gateway OpenClaw ainda não suporta cron jobs nesta versão.');
        } else {
          setGatewayErr('Não foi possível carregar as rotinas.');
        }
      })
      .finally(() => setLoading(false));
  }, [agent.id]);

  useEffect(() => { load(); }, [load]);

  const schedule = preset === 'custom' ? customExpr.trim() : preset;

  const create = async () => {
    if (!schedule) { setFormErr('Selecione ou informe um agendamento.'); return; }
    if (preset === 'custom' && !isValidCron(schedule)) {
      setFormErr('Expressão cron inválida — precisa ter exatamente 5 campos. Ex: * * * * *');
      return;
    }
    if (!message.trim()) { setFormErr('Informe a mensagem que o agente vai receber.'); return; }
    setFormErr('');
    setSaving(true);
    try {
      await apiRequest(`/agents/${agent.id}/cron`, {
        method: 'POST',
        body: { schedule, message: message.trim() },
      });
      setShowForm(false);
      setMessage('');
      setPreset(SCHEDULE_PRESETS[0].value);
      setCustomExpr('');
      load();
    } catch (e) {
      setFormErr(e?.message || 'Erro ao criar rotina.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (jobId) => {
    setDeleting(jobId);
    try {
      await apiRequest(`/agents/${agent.id}/cron/${jobId}`, { method: 'DELETE' });
      setJobs(prev => prev.filter(j => j.id !== jobId));
    } catch { /* silent */ } finally {
      setDeleting(null);
    }
  };

  const inputStyle = {
    background: colors.inputBg, border: `1px solid ${colors.border}`,
    color: colors.textPrimary, borderRadius: 8, padding: '0.45rem 0.75rem',
    width: '100%', fontSize: 13,
  };

  return (
    <div style={{ maxWidth: 760 }}>

      <HeartbeatSection agent={agent} colors={colors} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: colors.textPrimary }}>Rotinas agendadas</div>
          <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
            O agente recebe uma mensagem automaticamente no horário configurado e age por conta própria.
          </div>
        </div>
        {!gatewayErr && (
          <button
            onClick={() => { setShowForm(v => !v); setFormErr(''); }}
            style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
            {showForm ? 'Cancelar' : '+ Nova rotina'}
          </button>
        )}
      </div>

      {/* Gateway error */}
      {gatewayErr && (
        <div style={{ background: colors.warningBg, border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '14px 16px', fontSize: 13, color: '#f59e0b' }}>
          ⚠ {gatewayErr}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: colors.textPrimary, marginBottom: 14 }}>Nova rotina</div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: colors.textMuted, display: 'block', marginBottom: 4 }}>Frequência</label>
            <select style={{ ...inputStyle, height: 36 }} value={preset} onChange={e => setPreset(e.target.value)}>
              {SCHEDULE_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>

          {preset === 'custom' && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: colors.textMuted, display: 'block', marginBottom: 4 }}>
                Expressão cron&nbsp;
                <span style={{ color: colors.textMuted, fontFamily: 'monospace', fontSize: 11 }}>
                  (min hora dia mês diasemana)
                </span>
              </label>
              <input
                style={inputStyle}
                placeholder="Ex: 0 9 * * 1-5"
                value={customExpr}
                onChange={e => setCustomExpr(e.target.value)}
              />
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: colors.textMuted, display: 'block', marginBottom: 4 }}>
              Mensagem que o agente vai receber
            </label>
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              placeholder="Ex: Verifique os leads sem resposta nas últimas 24h e envie um follow-up."
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
            <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
              Escreva como se fosse uma instrução para o agente. Ele vai executar essa tarefa no horário configurado.
            </div>
          </div>

          {formErr && (
            <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 10 }}>{formErr}</div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={create} disabled={saving}
              style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Salvando…' : 'Criar rotina'}
            </button>
            <button onClick={() => { setShowForm(false); setFormErr(''); }}
              style={{ background: 'none', border: `1px solid ${colors.border}`, color: colors.textMuted, borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Jobs list */}
      {loading ? (
        <div style={{ color: colors.textMuted, fontSize: 13, padding: '20px 0' }}>Carregando rotinas…</div>
      ) : !gatewayErr && jobs.length === 0 ? (
        <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 32, textAlign: 'center' }}>
          <Clock size={28} color={colors.textMuted} style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 4 }}>Nenhuma rotina configurada</div>
          <div style={{ fontSize: 12, color: colors.textMuted }}>
            Crie uma rotina para o agente executar tarefas automaticamente em horários programados.
          </div>
        </div>
      ) : (
        jobs.map(job => (
          <div key={job.id}
            style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 16, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Clock size={13} color="#3b82f6" />
                <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>
                  {friendlySchedule(job.schedule)}
                </span>
                {job.schedule !== friendlySchedule(job.schedule) && (
                  <span style={{ fontSize: 11, color: colors.textMuted, fontFamily: 'monospace' }}>
                    ({job.schedule})
                  </span>
                )}
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                  background: job.enabled ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)',
                  color: job.enabled ? '#10b981' : '#6b7280',
                }}>
                  {job.enabled ? 'Ativa' : 'Pausada'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: colors.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4 }}>
                "{job.message}"
              </div>
              <div style={{ fontSize: 11, color: colors.textMuted, display: 'flex', gap: 14 }}>
                {job.lastRunAt && <span>Última execução: {new Date(job.lastRunAt).toLocaleString('pt-BR')}</span>}
                {job.nextRunAt && <span>Próxima: {new Date(job.nextRunAt).toLocaleString('pt-BR')}</span>}
              </div>
            </div>
            <button
              onClick={() => remove(job.id)}
              disabled={deleting === job.id}
              style={{ background: 'none', border: `1px solid ${colors.border}`, color: '#ef4444', borderRadius: 8, padding: '5px 12px', fontSize: 12, cursor: 'pointer', flexShrink: 0, opacity: deleting === job.id ? 0.5 : 1 }}>
              {deleting === job.id ? '…' : 'Remover'}
            </button>
          </div>
        ))
      )}

    </div>
  );
}

function MemoriaTab({ agent, colors }) {
  const [selected, setSelected] = useState(WORKSPACE_SECTIONS[0]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setContent('');
    apiRequest(`/agents/${agent.id}/workspace/${selected.key}`)
      .then(r => setContent(r?.content || r?.data || r?.text || JSON.stringify(r, null, 2) || '(vazio)'))
      .catch(() => setContent('Não foi possível carregar este arquivo.'))
      .finally(() => setLoading(false));
  }, [agent.id, selected.key]);

  return (
    <div style={{ display: 'flex', gap: 16, height: 520 }}>
      {/* File tree */}
      <div style={{ width: 220, background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'auto', flexShrink: 0 }}>
        <div style={{ padding: '12px 14px', borderBottom: `1px solid ${colors.border}`, fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Workspace
        </div>
        {WORKSPACE_SECTIONS.map(s => (
          <div key={s.key}
            onClick={() => setSelected(s)}
            style={{
              padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              background: selected.key === s.key ? colors.tabActiveBg : 'transparent',
              borderLeft: selected.key === s.key ? `3px solid #3b82f6` : '3px solid transparent',
              transition: 'all 0.12s',
            }}>
            <span style={{ fontSize: 14 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: selected.key === s.key ? colors.tabActiveText : colors.textPrimary }}>{s.label}</div>
              <div style={{ fontSize: 10, color: colors.textMuted }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview */}
      <div style={{ flex: 1, background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.border}`, fontWeight: 600, fontSize: 13, color: colors.textPrimary }}>
          {selected.label}
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {loading ? (
            <div style={{ color: colors.textMuted, fontSize: 13 }}>Carregando…</div>
          ) : (
            <pre style={{ fontFamily: 'monospace', fontSize: 12, color: colors.textPrimary, whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.7 }}>
              {content}
            </pre>
          )}
        </div>
        <div style={{ padding: '10px 16px', borderTop: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'flex-end' }}>
          <Link href={`/apps/agents/${agent.id}/prompts`}
            style={{ fontSize: 12, color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>
            Editar no editor de prompts →
          </Link>
        </div>
      </div>
    </div>
  );
}

function EvalsTab({ agent, colors }) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const [judgePrompt, setJudgePrompt]   = useState('');
  const [dateFrom, setDateFrom]         = useState(yesterday.toISOString().slice(0, 10));
  const [dateTo, setDateTo]             = useState(today.toISOString().slice(0, 10));
  const [model, setModel]               = useState(JUDGE_MODELS[0].value);
  const [launching, setLaunching]       = useState(false);
  const [evals, setEvals]               = useState([]);
  const [evalsLoading, setEvalsLoading] = useState(true);
  const [selectedEval, setSelectedEval] = useState(null);
  const [launchError, setLaunchError]   = useState('');

  const loadEvals = useCallback(() => {
    setEvalsLoading(true);
    apiRequest(`/agents/${agent.id}/evals`)
      .then(r => setEvals(r?.evals || []))
      .catch(() => {})
      .finally(() => setEvalsLoading(false));
  }, [agent.id]);

  useEffect(() => { loadEvals(); }, [loadEvals]);

  const launch = async () => {
    if (!judgePrompt.trim() || judgePrompt.trim().length < 10) {
      setLaunchError('Descreva o critério com pelo menos 10 caracteres.');
      return;
    }
    setLaunchError('');
    setLaunching(true);
    try {
      await apiRequest(`/agents/${agent.id}/evals`, {
        method: 'POST',
        body: {
          judgePrompt: judgePrompt.trim(),
          dateFrom: new Date(dateFrom).toISOString(),
          dateTo: new Date(dateTo + 'T23:59:59').toISOString(),
          model,
        },
      });
      setJudgePrompt('');
      loadEvals();
    } catch (e) {
      setLaunchError(e?.message || 'Erro ao lançar eval.');
    } finally {
      setLaunching(false);
    }
  };

  const loadEvalDetail = (ev) => {
    setSelectedEval(ev);
    apiRequest(`/agents/${agent.id}/evals/${ev._id || ev.id}`)
      .then(r => setSelectedEval(r))
      .catch(() => {});
  };

  const inputStyle = { background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.textPrimary, borderRadius: 8, padding: '0.45rem 0.75rem', width: '100%', fontSize: 13 };

  if (selectedEval && selectedEval.results) {
    return (
      <div style={{ maxWidth: 760 }}>
        <button onClick={() => setSelectedEval(null)} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: 13 }}>
          <ArrowLeft size={14} /> Voltar
        </button>
        <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: colors.textPrimary, marginBottom: 4 }}>{selectedEval.judgePrompt}</div>
              <div style={{ fontSize: 12, color: colors.textMuted }}>{selectedEval.totalConversations} conversas avaliadas</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: colors.textPrimary }}>{selectedEval.score}%</div>
              <div style={{ fontSize: 11, color: colors.textMuted }}>score geral</div>
            </div>
          </div>
          <ScoreBar score={selectedEval.score} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 14 }}>
            {[
              { label: 'Passou', value: selectedEval.passed, color: '#10b981' },
              { label: 'Parcial', value: selectedEval.partial, color: '#f59e0b' },
              { label: 'Falhou', value: selectedEval.failed, color: '#ef4444' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', padding: 10, borderRadius: 8, background: colors.bg }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: colors.textMuted }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {selectedEval.results?.length > 0 && (
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: colors.textPrimary, marginBottom: 10 }}>Resultados por conversa</div>
            {selectedEval.results.map((r, i) => (
              <div key={i} style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 14, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <VerdictBadge verdict={r.verdict} />
                    <span style={{ fontSize: 11, color: colors.textMuted, fontFamily: 'monospace' }}>{r.sessionKey || 'sessão'}</span>
                  </div>
                  <ScoreBar score={r.score} size="sm" />
                </div>
                <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 6 }}>{r.reasoning}</div>
                {r.excerpt && (
                  <div style={{ fontSize: 12, color: colors.textPrimary, background: colors.bg, borderRadius: 6, padding: '6px 10px', fontStyle: 'italic', borderLeft: '3px solid rgba(59,130,246,0.4)' }}>
                    {r.excerpt}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Launch form */}
      <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: colors.textPrimary, marginBottom: 4 }}>Lançar eval</div>
        <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 16 }}>O agente juiz vai avaliar as conversas do período com o critério que você definir.</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4, display: 'block' }}>De</label>
            <input type="date" style={inputStyle} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Até</label>
            <input type="date" style={inputStyle} value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Modelo do juiz</label>
          <select style={{ ...inputStyle, height: 36 }} value={model} onChange={e => setModel(e.target.value)}>
            {JUDGE_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4, display: 'block' }}>Pedido do juiz</label>
          <textarea
            style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }}
            placeholder="Ex: O agente coletou nome, e-mail e empresa do lead antes de oferecer a reunião?"
            value={judgePrompt}
            onChange={e => setJudgePrompt(e.target.value)}
          />
        </div>

        {launchError && <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 10 }}>{launchError}</div>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={launch} disabled={launching}
            style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: launching ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            {launching ? <><RefreshCw size={13} className="spin" />Lançando…</> : <>▶ Lançar eval</>}
          </button>
          <button onClick={loadEvals} style={{ background: 'none', border: `1px solid ${colors.border}`, color: colors.textMuted, borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={13} /> Atualizar
          </button>
        </div>
      </div>

      {/* Evals history */}
      <div style={{ fontWeight: 600, fontSize: 13, color: colors.textPrimary, marginBottom: 10 }}>Avaliações salvas</div>
      {evalsLoading ? (
        <div style={{ color: colors.textMuted, fontSize: 13 }}>Buscando evals…</div>
      ) : evals.length === 0 ? (
        <div style={{ color: colors.textMuted, fontSize: 13, padding: '20px 0', textAlign: 'center' }}>Nenhuma avaliação ainda.</div>
      ) : (
        evals.map(ev => {
          const statusColor = ev.status === 'completed' ? '#10b981' : ev.status === 'failed' ? '#ef4444' : '#f59e0b';
          return (
            <div key={ev._id || ev.id}
              onClick={() => loadEvalDetail(ev)}
              style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 14, marginBottom: 10, cursor: 'pointer', transition: 'border-color 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
              onMouseLeave={e => e.currentTarget.style.borderColor = colors.border}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1, paddingRight: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: colors.textPrimary, marginBottom: 2 }}>{ev.judgePrompt}</div>
                  <div style={{ fontSize: 11, color: colors.textMuted }}>
                    {new Date(ev.createdAt).toLocaleString('pt-BR')} · {ev.totalConversations} conversas
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: `${statusColor}20`, color: statusColor }}>
                    {ev.status === 'completed' ? 'Concluído' : ev.status === 'running' ? 'Executando' : ev.status === 'failed' ? 'Falhou' : 'Pendente'}
                  </span>
                </div>
              </div>
              {ev.status === 'completed' && ev.totalConversations > 0 && (
                <ScoreBar score={ev.score} size="sm" />
              )}
              {ev.status === 'completed' && ev.totalConversations === 0 && (
                <div style={{ fontSize: 11, color: colors.textMuted }}>Nenhuma conversa no período avaliado.</div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

function AuditoriaTab({ agent, colors }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest(`/audit/logs?agentId=${agent.id}&limit=50`)
      .then(r => setLogs(r?.data?.logs || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [agent.id]);

  const levelColor = { error: '#ef4444', warn: '#f59e0b', info: '#3b82f6' };
  const levelLabel = { error: 'erro', warn: 'aviso', info: 'info' };

  return (
    <div style={{ maxWidth: 860 }}>
      {loading ? (
        <div style={{ color: colors.textMuted, fontSize: 13 }}>Carregando logs…</div>
      ) : logs.length === 0 ? (
        <div style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', padding: '32px 0' }}>Nenhum log encontrado para este agente.</div>
      ) : (
        logs.map((log, i) => {
          const lv = log.level || 'info';
          const lc = levelColor[lv] || levelColor.info;
          const date = log.createdAt || log.timestamp;
          const meta = log.metadata || {};
          return (
            <div key={i} style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: `${lc}18`, color: lc }}>
                    {levelLabel[lv] || lv}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{log.message || log.action || '—'}</span>
                </div>
                <span style={{ fontSize: 11, color: colors.textMuted, flexShrink: 0 }}>
                  {date ? new Date(date).toLocaleString('pt-BR') : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {meta.latencyMs != null && (
                  <span style={{ fontSize: 11, color: colors.textMuted }}>⏱ {meta.latencyMs}ms</span>
                )}
                {meta.model && (
                  <span style={{ fontSize: 11, color: colors.textMuted }}>🤖 {meta.model}</span>
                )}
                {meta.channel && (
                  <span style={{ fontSize: 11, color: colors.textMuted }}>📡 {meta.channel}</span>
                )}
                {log.userEmail && (
                  <span style={{ fontSize: 11, color: colors.textMuted }}>👤 {log.userEmail}</span>
                )}
                {log.error?.message && (
                  <span style={{ fontSize: 11, color: '#ef4444' }}>⚠ {log.error.message}</span>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AgentDetailPage() {
  const { agentId } = useParams();
  const router = useRouter();
  const colors = useColors();

  const [agent, setAgent]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('geral');

  useEffect(() => {
    if (!agentId) return;
    setLoading(true);
    apiRequest(`/agents/${agentId}`)
      .then(r => setAgent(r?.agent || r))
      .catch(() => router.push('/apps/agents'))
      .finally(() => setLoading(false));
  }, [agentId, router]);

  const tabBtn = (key) => ({
    background: activeTab === key ? colors.tabActiveBg : 'transparent',
    color: activeTab === key ? colors.tabActiveText : colors.textMuted,
    border: 'none',
    padding: '6px 14px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: activeTab === key ? 600 : 400,
    cursor: 'pointer',
    transition: 'all 0.12s',
    whiteSpace: 'nowrap',
  });

  const statusInfo = agent ? (STATUS_COLORS[agent.status] || STATUS_COLORS.draft) : null;

  return (
    <div className="hk-pg-body py-0">
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      <div className="fmapp-wrap">
        <AgentsSidebar />
        <div className="fmapp-content">
          <div className="fmapp-detail-wrap" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: colors.bg }}>

            {loading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textMuted }}>
                Carregando…
              </div>
            ) : !agent ? null : (
              <>
                {/* Header */}
                <div style={{ background: colors.panelBg, borderBottom: `1px solid ${colors.border}`, padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <Link href="/apps/agents" style={{ color: colors.textMuted, display: 'flex', alignItems: 'center' }}>
                      <ArrowLeft size={18} />
                    </Link>
                    <span style={{ fontSize: 13, color: colors.textMuted }}>Colaboradores Digitais</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      {/* Avatar */}
                      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 26, fontWeight: 700, color: '#fff', position: 'relative' }}>
                        {agent.name?.[0]?.toUpperCase() || '?'}
                        {statusInfo && (
                          <span style={{ position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: '50%', background: statusInfo.dot, border: `2px solid ${colors.panelBg}` }} />
                        )}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <h4 style={{ margin: 0, color: colors.textPrimary, fontSize: 20, fontWeight: 700 }}>{agent.name}</h4>
                          {statusInfo && (
                            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: statusInfo.bg, color: statusInfo.text }}>
                              {STATUS_LABELS[agent.status] || agent.status}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>{agent.roleTitle}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {agent.phone && (
                        <a href={`https://wa.me/${agent.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: '#25D366', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                          <Phone size={14} /> Enviar no WhatsApp
                        </a>
                      )}
                      <Link href={`/apps/agents?playground=${agent.id}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: colors.tabActiveBg, color: colors.tabActiveText, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                        <MessageSquare size={14} /> Conversar no chat
                      </Link>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div style={{ display: 'flex', gap: 4, marginTop: 18, overflowX: 'auto', paddingBottom: 2 }}>
                    {TABS.map(t => (
                      <button key={t.key} style={tabBtn(t.key)} onClick={() => setActiveTab(t.key)}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                  {activeTab === 'geral'       && <GeralTab agent={agent} colors={colors} onUpdate={setAgent} />}
                  {activeTab === 'comunicacao' && <ComunicacaoTab agent={agent} colors={colors} />}
{activeTab === 'uso'         && <UsoTab colors={colors} />}
                  {activeTab === 'rotinas'     && <RotinasTab agent={agent} colors={colors} />}
                  {activeTab === 'memoria'     && <MemoriaTab agent={agent} colors={colors} />}
                  {activeTab === 'evals'       && <EvalsTab agent={agent} colors={colors} />}
                  {activeTab === 'auditoria'   && <AuditoriaTab agent={agent} colors={colors} />}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
