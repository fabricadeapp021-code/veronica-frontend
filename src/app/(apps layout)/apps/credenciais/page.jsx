'use client';
import { useCallback, useEffect, useState } from 'react';
import { Key, RefreshCw, Trash2, CheckCircle, AlertCircle, Clock, Search, Plus } from 'react-feather';
import Link from 'next/link';
import { apiRequest } from '@/lib/api/client';
import { useColorMode } from '@/hooks/useColorMode';
import AgentsSidebar from '../agents/AgentsSidebar';
import AgentsDarkStyles from '../agents/AgentsDarkStyles';

// ─── Provider meta ────────────────────────────────────────────────────────────

const PROVIDER_COLORS = {
  whatsapp:        '#25D366',
  telegram:        '#229ED9',
  google_gmail:    '#EA4335',
  google_calendar: '#4285F4',
  google_drive:    '#FBBC04',
  google_sheets:   '#34A853',
  slack:           '#E01E5A',
  hubspot:         '#FF7A59',
  clickup:         '#7B68EE',
  notion:          '#000000',
  pipedrive:       '#1A73E8',
  email:           '#6b7280',
  documents:       '#6366f1',
  crm:             '#3b82f6',
  helpdesk:        '#f59e0b',
  webhook:         '#6b7280',
};

const STATUS_MAP = {
  connected:    { label: 'Conectado',    color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  pending:      { label: 'Pendente',     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  error:        { label: 'Erro',         color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  disconnected: { label: 'Desconectado', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
};

function ProviderAvatar({ providerKey, size = 40 }) {
  const color = PROVIDER_COLORS[providerKey] || '#6b7280';
  const initials = providerKey.replace('google_', 'G·').replace('_', ' ').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: 10, flexShrink: 0,
      background: `${color}1a`, border: `1px solid ${color}33`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color,
    }}>
      {initials}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CredenciaisPage() {
  const { isDark } = useColorMode();

  const colors = {
    bg:          isDark ? '#13151a' : '#f8f9fa',
    panelBg:     isDark ? '#1a1d27' : '#ffffff',
    cardBg:      isDark ? '#1e2130' : '#ffffff',
    border:      isDark ? '#2a2f3d' : '#e7eaf0',
    textPrimary: isDark ? '#dde3ef' : '#212529',
    textMuted:   isDark ? '#8d97b0' : '#6c757d',
    inputBg:     isDark ? '#252a3a' : '#ffffff',
  };

  const [credentials, setCredentials]   = useState([]);
  const [agents, setAgents]             = useState([]);
  const [agentLinks, setAgentLinks]     = useState({});
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [onlyActive, setOnlyActive]     = useState(false);
  const [disconnecting, setDisconnecting] = useState('');
  const [error, setError]               = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [credsRes, agentsRes] = await Promise.all([
        apiRequest('/integrations'),
        apiRequest('/agents'),
      ]);
      const creds = credsRes?.integrations || [];
      const agentList = agentsRes?.agents || [];
      setCredentials(creds);
      setAgents(agentList);

      // For each agent, fetch which integrations they have linked
      const links = {};
      await Promise.allSettled(
        agentList.map(async (agent) => {
          try {
            const res = await apiRequest(`/agents/${agent.id}/integrations`);
            const linked = res?.integrations || [];
            linked.forEach(l => {
              const integId = l.integrationId || l.id;
              if (!links[integId]) links[integId] = [];
              links[integId].push(agent.name);
            });
          } catch { /* skip */ }
        })
      );
      setAgentLinks(links);
    } catch (e) {
      setError(e?.message || 'Erro ao carregar credenciais.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const disconnect = async (cred) => {
    if (!confirm(`Desconectar "${cred.name}"? Todos os agentes perderão acesso a esta integração.`)) return;
    setDisconnecting(cred.id);
    try {
      await apiRequest(`/integrations/${cred.id}`, { method: 'DELETE' });
      setCredentials(prev => prev.filter(c => c.id !== cred.id));
    } catch (e) {
      setError(e?.message || 'Erro ao desconectar.');
    } finally {
      setDisconnecting('');
    }
  };

  const filtered = credentials.filter(c => {
    if (onlyActive && c.status !== 'connected') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return c.name?.toLowerCase().includes(q) || c.providerKey?.toLowerCase().includes(q);
    }
    return true;
  });

  const inputStyle = {
    background: colors.inputBg, border: `1px solid ${colors.border}`,
    color: colors.textPrimary, borderRadius: 8, padding: '6px 12px', fontSize: 13,
  };

  return (
    <div className="hk-pg-body py-0">
      <AgentsDarkStyles />
      <div className="integrationsapp-wrap agents-page-dark">
        <AgentsSidebar />
        <div className="integrationsapp-content">
          <div className="integrationsapp-detail-wrap" style={{ background: colors.bg, minHeight: '100vh' }}>
            <div style={{ padding: '28px 28px 0' }}>

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <h4 style={{ margin: 0, color: colors.textPrimary, fontWeight: 700 }}>Credenciais</h4>
                  <p style={{ margin: '4px 0 0', color: colors.textMuted, fontSize: 14 }}>
                    Chaves de API e tokens de acesso conectados ao seu tenant.
                  </p>
                </div>
                <Link href="/apps/agents/connectors"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: colors.textPrimary === '#dde3ef' ? '#ffffff18' : '#000000', color: colors.textPrimary, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', border: `1px solid ${colors.border}` }}>
                  <Plus size={14} /> Adicionar integração
                </Link>
              </div>

              {/* Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
                  <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: colors.textMuted }} />
                  <input style={{ ...inputStyle, paddingLeft: 32, width: '100%' }}
                    placeholder="Buscar credenciais..."
                    value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: colors.textMuted, cursor: 'pointer' }}>
                  <input type="checkbox" checked={onlyActive} onChange={e => setOnlyActive(e.target.checked)} />
                  Somente ativas
                </label>
                <span style={{ fontSize: 13, color: colors.textMuted }}>{filtered.length} credencial{filtered.length !== 1 ? 'is' : ''}</span>
                <button onClick={load} style={{ background: 'none', border: `1px solid ${colors.border}`, color: colors.textMuted, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  <RefreshCw size={13} /> Atualizar
                </button>
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#ef4444', marginBottom: 16 }}>
                  {error}
                </div>
              )}

              {/* Grid */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: colors.textMuted, fontSize: 14 }}>Carregando credenciais…</div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <Key size={36} color={colors.textMuted} style={{ marginBottom: 12, opacity: 0.5 }} />
                  <div style={{ color: colors.textPrimary, fontWeight: 600, marginBottom: 6 }}>Nenhuma credencial encontrada</div>
                  <div style={{ color: colors.textMuted, fontSize: 13, marginBottom: 16 }}>
                    {credentials.length === 0 ? 'Conecte uma integração para criar sua primeira credencial.' : 'Nenhuma credencial corresponde ao filtro.'}
                  </div>
                  <Link href="/apps/agents/connectors"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#3b82f6', color: '#fff', padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                    <Plus size={14} /> Conectar integração
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14, paddingBottom: 32 }}>
                  {/* Add new card */}
                  <Link href="/apps/agents/connectors" style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: colors.cardBg, border: `2px dashed ${colors.border}`,
                      borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 120,
                      cursor: 'pointer', transition: 'border-color 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = colors.border}>
                      <Plus size={22} color={colors.textMuted} />
                      <span style={{ fontSize: 13, color: colors.textMuted }}>Adicionar credencial</span>
                    </div>
                  </Link>

                  {filtered.map(cred => {
                    const statusInfo = STATUS_MAP[cred.status] || STATUS_MAP.disconnected;
                    const usedBy = agentLinks[cred.id] || [];
                    const color = PROVIDER_COLORS[cred.providerKey] || '#6b7280';

                    return (
                      <div key={cred.id} style={{
                        background: colors.cardBg, border: `1px solid ${colors.border}`,
                        borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 14,
                      }}>
                        {/* Card header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <ProviderAvatar providerKey={cred.providerKey} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, color: colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {cred.name || cred.providerKey}
                            </div>
                            <div style={{ fontSize: 11, color: colors.textMuted, fontFamily: 'monospace' }}>{cred.providerKey}</div>
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 10, background: statusInfo.bg, color: statusInfo.color, flexShrink: 0 }}>
                            {statusInfo.label}
                          </span>
                        </div>

                        {/* Field count + connected date */}
                        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: colors.textMuted }}>
                          <span>
                            {Object.keys(cred.credentials || {}).length} campo{Object.keys(cred.credentials || {}).length !== 1 ? 's' : ''}
                          </span>
                          {cred.lastSyncAt && (
                            <span>Sincronizado {new Date(cred.lastSyncAt).toLocaleDateString('pt-BR')}</span>
                          )}
                        </div>

                        {/* Agents using */}
                        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 12 }}>
                          <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 6 }}>
                            {usedBy.length > 0 ? `${usedBy.length} agente${usedBy.length > 1 ? 's' : ''} usando` : 'Nenhum agente vinculado'}
                          </div>
                          {usedBy.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {usedBy.slice(0, 3).map(name => (
                                <span key={name} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: `${color}15`, color }}>
                                  {name}
                                </span>
                              ))}
                              {usedBy.length > 3 && (
                                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: colors.bg, color: colors.textMuted }}>
                                  +{usedBy.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Link href={`/apps/agents/connectors`}
                            style={{ flex: 1, textAlign: 'center', padding: '7px 0', borderRadius: 8, background: colors.bg, color: colors.textMuted, fontSize: 12, fontWeight: 600, textDecoration: 'none', border: `1px solid ${colors.border}` }}>
                            Detalhes
                          </Link>
                          <button onClick={() => disconnect(cred)} disabled={disconnecting === cred.id}
                            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, opacity: disconnecting === cred.id ? 0.6 : 1 }}>
                            <Trash2 size={12} />
                            {disconnecting === cred.id ? '…' : 'Desconectar'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
