'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Alert, Badge, Button, Card, Col, Dropdown, Form, InputGroup, Modal, Row, Spinner } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BookOpen,
  Briefcase,
  Check,
  Edit3,
  Eye,
  Image as ImageIcon,
  Link as LinkIcon,
  Lock,
  MessageCircle,
  MessageSquare,
  MoreVertical,
  PauseCircle,
  Phone,
  PlayCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
  Zap,
} from 'react-feather';
import { toast } from 'react-toastify';
import { apiRequest, fetchStream } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/session';
import { useColorMode } from '@/hooks/useColorMode';
import { AgentProviderIcons } from '@/lib/integrations/providerMeta';

const autonomyLabels = {
  learning: 'Aprendendo',
  assisted: 'Assistido',
  supervised: 'Supervisionado',
  monitored: 'Monitorado',
  trusted: 'Confiavel',
  autonomous: 'Autonomo',
};

const statusLabels = {
  active: 'Ativo',
  paused: 'Pausado',
  draft: 'Rascunho',
  archived: 'Arquivado',
};

/* ─── Knowledge Base Tab ─── */
const KnowledgeTab = ({ agent, colors, isDark }) => {
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const fileInputRef = useRef(null);
  const pollRef = useRef(null);

  const loadFiles = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoadingFiles(true);
      const res = await apiRequest(`/agents/${agent.id}/knowledge`);
      const list = res?.files || [];
      setFiles(list);
      return list;
    } catch {
      setFiles([]);
      return [];
    } finally {
      if (!silent) setLoadingFiles(false);
    }
  }, [agent.id]);

  // Polling: enquanto existir arquivo PENDING, recarrega a cada 3s.
  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      const list = await loadFiles({ silent: true });
      const hasPending = list.some(f => f.status === 'PENDING');
      if (!hasPending) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, 3000);
  }, [loadFiles]);

  useEffect(() => {
    loadFiles().then(list => {
      if (list.some(f => f.status === 'PENDING')) startPolling();
    });
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [loadFiles, startPolling]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadErr('');
    if (file.size > 50 * 1024 * 1024) {
      setUploadErr('Arquivo muito grande. Máximo 50MB.');
      e.target.value = '';
      return;
    }
    try {
      setUploading(true);
      const token = getAccessToken();
      const formData = new FormData();
      formData.append('file', file);
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const resp = await fetch(`${apiBase}/agents/${agent.id}/knowledge/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData?.message || `Erro ${resp.status}`);
      }
      // Recarrega lista e inicia polling — indexação é async, pode demorar alguns segundos.
      await loadFiles();
      startPolling();
    } catch (err) {
      setUploadErr(err?.message || 'Falha no upload.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (fileId) => {
    try {
      await apiRequest(`/agents/${agent.id}/knowledge/${fileId}`, { method: 'DELETE' });
      await loadFiles();
    } catch {
      /* ignore */
    }
  };

  const statusBadge = (status) => {
    const map = {
      INDEXED: { bg: '#d1fae5', color: '#065f46', label: 'Indexado' },
      PENDING: { bg: '#fef3c7', color: '#92400e', label: 'Indexando…' },
      FAILED:  { bg: '#fee2e2', color: '#991b1b', label: 'Falhou' },
    };
    const s = map[status] || { bg: '#e5e7eb', color: '#374151', label: status };
    return (
      <span style={{
        fontSize: '0.70rem', fontWeight: 600, borderRadius: '4px',
        padding: '1px 6px', background: s.bg, color: s.color,
        display: 'inline-flex', alignItems: 'center', gap: 4,
      }}>
        {status === 'PENDING' && (
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            border: `1.5px solid ${s.color}`,
            borderTopColor: 'transparent',
            display: 'inline-block',
            animation: 'spin 0.8s linear infinite',
          }} />
        )}
        {s.label}
      </span>
    );
  };

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1rem 1.25rem', background: colors.panelBg }}>
      {/* Upload area */}
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${colors.border}`,
          borderRadius: '10px',
          padding: '1rem',
          textAlign: 'center',
          cursor: uploading ? 'default' : 'pointer',
          marginBottom: '1rem',
          color: colors.textMuted,
          background: isDark ? '#1c2748' : '#f8f9fa',
        }}
      >
        {uploading ? (
          <div>
            <Spinner animation="border" size="sm" className="me-2" />
            <span style={{ fontSize: '0.875rem' }}>Enviando...</span>
          </div>
        ) : (
          <>
            <BookOpen size={22} style={{ marginBottom: '0.4rem', opacity: 0.5 }} />
            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: colors.textPrimary }}>Upload de documento</div>
            <div style={{ fontSize: '0.76rem' }}>PDF, DOCX, XLSX, JPEG, PNG, TXT, JSON — max 50MB</div>
          </>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.xlsx,.jpeg,.jpg,.png,.txt,.json,application/json"
        style={{ display: 'none' }}
        onChange={handleUpload}
      />
      {uploadErr && (
        <div style={{ fontSize: '0.82rem', color: colors.errorText, marginBottom: '0.75rem' }}>{uploadErr}</div>
      )}

      {/* File list */}
      {loadingFiles ? (
        <div className="text-center py-3">
          <Spinner animation="border" size="sm" />
        </div>
      ) : files.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '2rem', color: colors.textMuted }}>
          <BookOpen size={32} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
          <div style={{ fontSize: '0.875rem' }}>Nenhum documento indexado</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {files.map((f) => (
            <div
              key={f._id || f.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 0.75rem',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                background: isDark ? '#1c2748' : '#f8f9fa',
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontSize: '0.875rem', fontWeight: 500, color: colors.textPrimary,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  marginBottom: '0.2rem',
                }}>
                  {f.originalName || f.name || f.fileName || 'Documento'}
                </div>
                {statusBadge(f.status)}
              </div>
              <Button
                variant="link"
                className="p-1 ms-2"
                style={{ color: colors.errorText, flexShrink: 0 }}
                onClick={() => handleDelete(f._id || f.id)}
              >
                <Trash2 size={15} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Knowledge Modal ─── */
const AgentKnowledgeModal = ({ agent, onClose }) => {
  const { isDark } = useColorMode();
  const colors = {
    panelBg:     isDark ? '#141d35' : '#ffffff',
    border:      isDark ? '#2a2f3d' : '#e7eaf0',
    textPrimary: isDark ? '#dde3ef' : '#212529',
    textMuted:   isDark ? '#8d97b0' : '#6c757d',
    errorText:   isDark ? '#ff7b7b' : '#dc3545',
  };

  return (
    <Modal show onHide={onClose} centered size="md">
      <Modal.Header closeButton style={{ background: colors.panelBg, borderColor: colors.border }}>
        <Modal.Title style={{ color: colors.textPrimary, fontSize: '1rem' }}>
          <BookOpen size={16} className="me-2" />
          Base de Conhecimento — {agent.name}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: 0, background: colors.panelBg, minHeight: '320px' }}>
        <KnowledgeTab agent={agent} colors={colors} isDark={isDark} />
      </Modal.Body>
    </Modal>
  );
};

/* ─── Playground Panel ─── */
const AgentPlaygroundPanel = ({ agent, onClose }) => {
  const { isDark } = useColorMode();
  const [activeTab, setActiveTab] = useState('chat');

  // ── Multi-session state ──────────────────────────────────────────────
  const pgKey = `pg_sessions_${agent._id}`;
  const pgActiveKey = `pg_active_${agent._id}`;

  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem(pgKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Restaura metadados; mensagens não são salvas (podem ser grandes)
          return parsed.map(s => ({ ...s, messages: [] }));
        }
      }
    } catch { /* ignore */ }
    const id = `pg-${Date.now()}`;
    return [{ id, label: 'Sessão 1', sessionKey: id, messages: [] }];
  });

  const [activeSessionId, setActiveSessionId] = useState(() => {
    try {
      const saved = localStorage.getItem(pgActiveKey);
      if (saved) return saved;
    } catch { /* ignore */ }
    return sessions[0].id;
  });

  // Persiste metadados das sessões (sem mensagens) sempre que mudam
  useEffect(() => {
    try {
      const meta = sessions.map(({ id, label, sessionKey }) => ({ id, label, sessionKey }));
      localStorage.setItem(pgKey, JSON.stringify(meta));
    } catch { /* ignore */ }
  }, [sessions, pgKey]);

  useEffect(() => {
    try { localStorage.setItem(pgActiveKey, activeSessionId); } catch { /* ignore */ }
  }, [activeSessionId, pgActiveKey]);

  // Carrega histórico do backend quando a sessão ativa não tem mensagens em memória
  useEffect(() => {
    const session = sessions.find(s => s.id === activeSessionId);
    if (!session || session.messages.length > 0 || !session.sessionKey) return;

    let cancelled = false;
    (async () => {
      try {
        const data = await apiRequest(`/agents/${agent._id}/sessions/${encodeURIComponent(session.sessionKey)}`);
        if (cancelled || !Array.isArray(data?.messages) || data.messages.length === 0) return;

        const mapped = data.messages.map((m) => {
          let content = m.content;
          if (Array.isArray(content)) {
            const textBlock = content.find((b) => b.type === 'text');
            content = textBlock?.text ?? '';
          }
          content = content ?? '';
          // OpenClaw injeta contexto de remetente no início das mensagens user:
          // "Sender (untrusted metadata): ```json {...} ``` [timestamp] mensagem real"
          // Strip tudo até o final do bloco de timestamp [...]
          if (m.role === 'user' && content.startsWith('Sender (untrusted metadata):')) {
            const match = content.match(/\[[^\]]+\]\s*([\s\S]*)$/);
            if (match) content = match[1].trimStart();
          }
          return { role: m.role, content, ts: m.timestamp ? new Date(m.timestamp).getTime() : Date.now() };
        });

        setSessions(prev => prev.map(s => s.id === activeSessionId && s.messages.length === 0
          ? { ...s, messages: mapped }
          : s,
        ));
      } catch {
        /* histórico indisponível — ignora */
      }
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId]);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const bottomRef = useRef(null);
  const imageInputRef = useRef(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) ?? sessions[0];
  const messages = activeSession.messages;

  const patchSession = (sessionId, patch) =>
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, ...patch } : s));

  const addSession = () => {
    const id = `pg-${Date.now()}`;
    const num = sessions.length + 1;
    setSessions(prev => [...prev, { id, label: `Sessão ${num}`, sessionKey: id, messages: [] }]);
    setActiveSessionId(id);
    setInput('');
    if (pendingImage?.previewUrl) URL.revokeObjectURL(pendingImage.previewUrl);
    setPendingImage(null);
  };

  const removeSession = (sessionId) => {
    if (sessions.length === 1) return;
    setSessions(prev => {
      const next = prev.filter(s => s.id !== sessionId);
      if (activeSessionId === sessionId) setActiveSessionId(next[next.length - 1].id);
      return next;
    });
  };

  const clearChat = () => {
    const newKey = `pg-${Date.now()}`;
    patchSession(activeSessionId, { messages: [], sessionKey: newKey });
    setInput('');
    if (pendingImage?.previewUrl) URL.revokeObjectURL(pendingImage.previewUrl);
    setPendingImage(null);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const colors = {
    panelBg:      isDark ? '#141d35'              : '#ffffff',
    border:       isDark ? '#2a2f3d'              : '#e7eaf0',
    textPrimary:  isDark ? '#dde3ef'              : '#212529',
    textMuted:    isDark ? '#8d97b0'              : '#6c757d',
    aiBubbleBg:   isDark ? '#1c2748'              : '#f0f4ff',
    aiBubbleText: isDark ? '#c9d1e0'              : '#212529',
    errorBg:      isDark ? '#2a1515'              : '#fff3f3',
    errorText:    isDark ? '#ff7b7b'              : '#dc3545',
    dotColor:     isDark ? '#8d97b0'              : '#6c757d',
    footerText:   isDark ? '#5a6480'              : '#adb5bd',
    badgeBg:      isDark ? 'rgba(245,158,11,0.14)': '#fff3cd',
    badgeText:    isDark ? '#ffd86b'              : '#856404',
    badgeBorder:  isDark ? 'rgba(245,158,11,0.3)' : '#ffc107',
    panelShadow:  isDark ? '-4px 0 32px rgba(0,0,0,0.55)' : '-4px 0 24px rgba(0,0,0,0.12)',
    overlay:      isDark ? 'rgba(0,0,0,0.55)'     : 'rgba(0,0,0,0.25)',
    tabActiveBg:  isDark ? '#1c2748'              : '#e8f0fe',
    tabActiveText:isDark ? '#93bbfc'              : '#1a56db',
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setPendingImage({ previewUrl, file });
    e.target.value = '';
  };

  const removePendingImage = () => {
    if (pendingImage?.previewUrl) URL.revokeObjectURL(pendingImage.previewUrl);
    setPendingImage(null);
  };

  const send = async () => {
    const sid = activeSessionId;
    const capturedSessionKey = sessions.find(s => s.id === sid)?.sessionKey ?? '';
    const text = input.trim();
    if (!text || sending) return;

    setSessions(prev => prev.map(s => s.id === sid ? {
      ...s,
      messages: [
        ...s.messages,
        { role: 'user', content: text, ts: Date.now(), imagePreview: pendingImage?.previewUrl },
        { role: 'assistant', content: '', ts: Date.now() + 1, loading: true },
      ],
    } : s));
    setInput('');
    setSending(true);

    let attachments = [];

    if (pendingImage) {
      try {
        setUploadingImage(true);
        const token = getAccessToken();
        const formData = new FormData();
        formData.append('file', pendingImage.file);
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const resp = await fetch(`${apiBase}/agents/${agent.id}/chat/attachment`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        if (resp.ok) {
          const data = await resp.json();
          attachments = [{ url: data.url, mimeType: data.mimeType }];
        }
      } catch {
        /* attachment upload failed — send text-only */
      } finally {
        setUploadingImage(false);
        removePendingImage();
      }
    }

    try {
      const body = { message: text };
      if (capturedSessionKey) body.sessionId = capturedSessionKey;
      if (attachments.length) body.attachments = attachments;

      const streamRes = await fetchStream(`/agents/${agent.id}/chat-stream`, { body });
      const reader = streamRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'complete') {
              setSessions(prev => prev.map(s => {
                if (s.id !== sid) return s;
                const msgs = [...s.messages];
                msgs[msgs.length - 1] = { role: 'assistant', content: event.content, ts: Date.now() };
                return { ...s, sessionKey: event.sessionKey || s.sessionKey, messages: msgs };
              }));
            } else if (event.type === 'error') {
              setSessions(prev => prev.map(s => {
                if (s.id !== sid) return s;
                const msgs = [...s.messages];
                msgs[msgs.length - 1] = {
                  role: 'assistant',
                  content: `Erro: ${event.error || 'Nao foi possivel obter resposta.'}`,
                  ts: Date.now(),
                  error: true,
                };
                return { ...s, messages: msgs };
              }));
            }
          } catch {
            /* linha SSE inválida — ignora */
          }
        }
      }
    } catch (err) {
      setSessions(prev => prev.map(s => {
        if (s.id !== sid) return s;
        const msgs = [...s.messages];
        msgs[msgs.length - 1] = {
          role: 'assistant',
          content: `Erro: ${err?.message || 'Nao foi possivel obter resposta.'}`,
          ts: Date.now(),
          error: true,
        };
        return { ...s, messages: msgs };
      }));
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const tabButtonStyle = (tab) => ({
    flex: 1,
    padding: '0.45rem 0',
    fontSize: '0.82rem',
    fontWeight: 600,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    background: activeTab === tab ? colors.tabActiveBg : 'transparent',
    color: activeTab === tab ? colors.tabActiveText : colors.textMuted,
    transition: 'all 0.15s',
  });

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: colors.overlay,
          zIndex: 1040,
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '640px',
          maxWidth: '100vw',
          background: colors.panelBg,
          zIndex: 1050,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: colors.panelShadow,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span
                style={{
                  fontSize: '0.70rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  background: colors.badgeBg,
                  color: colors.badgeText,
                  border: `1px solid ${colors.badgeBorder}`,
                  borderRadius: '4px',
                  padding: '1px 6px',
                }}
              >
                Testando funcionário IA
              </span>
            </div>
            <h5 className="mb-0 text-truncate fw-bold" style={{ color: colors.textPrimary }}>{agent.name}</h5>
            <small style={{ color: colors.textMuted }}>{agent.roleTitle}</small>
          </div>
          <Button
            variant="link"
            className="p-1"
            style={{ color: colors.textMuted, fontSize: '0.78rem', fontWeight: 600 }}
            onClick={clearChat}
            title="Nova conversa"
          >
            <RefreshCw size={16} />
          </Button>
          <Button variant="link" className="p-1" style={{ color: colors.textMuted }} onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        {/* Autonomy badge */}
        <div
          style={{
            padding: '0.5rem 1.25rem',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            gap: '0.4rem',
            flexWrap: 'wrap',
          }}
        >
          <Badge bg="light" text="dark" style={{ fontWeight: 400, fontSize: '0.76rem' }}>
            {autonomyLabels[agent.autonomyLevel] || agent.autonomyLevel}
          </Badge>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            padding: '0.5rem 1.25rem',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            gap: '0.25rem',
            background: colors.panelBg,
          }}
        >
          <button style={tabButtonStyle('chat')} onClick={() => setActiveTab('chat')}>
            <MessageSquare size={13} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />
            Chat
          </button>
          <button style={tabButtonStyle('knowledge')} onClick={() => setActiveTab('knowledge')}>
            <BookOpen size={13} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />
            Base de Conhecimento
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'knowledge' ? (
          <KnowledgeTab agent={agent} colors={colors} isDark={isDark} />
        ) : (
          <>
            {/* Session tabs */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.4rem 1rem', borderBottom: `1px solid ${colors.border}`,
              overflowX: 'auto', background: colors.panelBg, scrollbarWidth: 'none',
            }}>
              {sessions.map(sess => {
                const isActive = sess.id === activeSessionId;
                return (
                  <div key={sess.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.2rem',
                    padding: '0.18rem 0.5rem 0.18rem 0.65rem', borderRadius: '6px', flexShrink: 0,
                    background: isActive
                      ? (isDark ? 'rgba(147,187,252,0.15)' : 'rgba(26,86,219,0.1)')
                      : 'transparent',
                    border: `1px solid ${isActive
                      ? (isDark ? 'rgba(147,187,252,0.35)' : 'rgba(26,86,219,0.25)')
                      : colors.border}`,
                    color: isActive ? colors.tabActiveText : colors.textMuted,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    <span
                      onClick={() => { setActiveSessionId(sess.id); setInput(''); }}
                      style={{ fontSize: '0.775rem', fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap', userSelect: 'none' }}
                    >
                      {sess.label}
                    </span>
                    {sessions.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeSession(sess.id); }}
                        style={{
                          background: 'none', border: 'none', padding: '0 1px', cursor: 'pointer',
                          color: 'inherit', opacity: 0.55, display: 'flex', alignItems: 'center', lineHeight: 1,
                        }}
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                );
              })}
              <button
                onClick={addSession}
                title="Nova sessão"
                style={{
                  background: 'none', border: `1px dashed ${colors.border}`, borderRadius: '6px',
                  padding: '0.18rem 0.45rem', cursor: 'pointer', color: colors.textMuted,
                  flexShrink: 0, display: 'flex', alignItems: 'center', transition: 'all 0.15s',
                }}
              >
                <Plus size={12} />
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1rem 1.25rem', background: colors.panelBg }}>
              {messages.length === 0 ? (
                <div style={{ marginTop: '3rem', textAlign: 'center', color: colors.textMuted }}>
                  <MessageSquare size={36} style={{ marginBottom: '0.75rem', opacity: 0.45, color: colors.textMuted }} />
                  <p className="mb-1" style={{ fontWeight: 500, color: colors.textPrimary }}>Playground do agente</p>
                  <small style={{ color: colors.textMuted }}>Envie uma mensagem para testar como ele responde.</small>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`d-flex mb-3 ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                  >
                    <div
                      style={{
                        maxWidth: '85%',
                        padding: '0.65rem 0.95rem',
                        borderRadius: msg.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        background: msg.role === 'user'
                          ? '#3b82f6'
                          : msg.error
                            ? colors.errorBg
                            : colors.aiBubbleBg,
                        color: msg.role === 'user'
                          ? '#fff'
                          : msg.error
                            ? colors.errorText
                            : colors.aiBubbleText,
                        fontSize: '0.945rem',
                        lineHeight: 1.55,
                        boxShadow: isDark
                          ? '0 2px 8px rgba(0,0,0,0.35)'
                          : '0 1px 3px rgba(0,0,0,0.06)',
                      }}
                    >
                      {msg.loading ? (
                        <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                          {[0, 150, 300].map((d) => (
                            <span
                              key={d}
                              style={{
                                width: 7, height: 7, borderRadius: '50%',
                                background: colors.dotColor,
                                display: 'inline-block',
                                animation: 'bounce 1.2s infinite',
                                animationDelay: `${d}ms`,
                              }}
                            />
                          ))}
                        </span>
                      ) : (
                        <>
                          {msg.imagePreview && (
                            <img
                              src={msg.imagePreview}
                              alt="imagem"
                              style={{
                                maxWidth: '100%', maxHeight: '160px', borderRadius: '8px',
                                display: 'block', marginBottom: msg.content ? '0.5rem' : 0,
                              }}
                            />
                          )}
                          {msg.content && (
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                img: ({ node, alt, ...props }) => (
                                  <img
                                    {...props}
                                    alt={alt || ''}
                                    style={{ maxWidth: '100%', borderRadius: '8px', display: 'block', margin: '0.4rem 0' }}
                                  />
                                ),
                                p: ({ node, ...props }) => <p style={{ marginBottom: '0.5rem' }} {...props} />,
                                a: ({ node, ...props }) => (
                                  <a {...props} target="_blank" rel="noopener noreferrer" />
                                ),
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Pending image preview */}
            {pendingImage && (
              <div
                style={{
                  padding: '0.5rem 1.25rem 0',
                  background: colors.panelBg,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    src={pendingImage.previewUrl}
                    alt="preview"
                    style={{ height: '56px', width: '56px', objectFit: 'cover', borderRadius: '8px', border: `1px solid ${colors.border}` }}
                  />
                  <button
                    onClick={removePendingImage}
                    style={{
                      position: 'absolute', top: '-6px', right: '-6px',
                      background: '#ef4444', border: 'none', borderRadius: '50%',
                      width: '18px', height: '18px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: 0,
                    }}
                  >
                    <X size={10} color="#fff" />
                  </button>
                </div>
              </div>
            )}

            {/* Input */}
            <div
              style={{
                padding: '0.875rem 1.25rem',
                borderTop: `1px solid ${colors.border}`,
                background: colors.panelBg,
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'flex-end',
              }}
            >
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageSelect}
              />
              <Button
                variant="link"
                className="p-1"
                style={{ color: colors.textMuted, flexShrink: 0 }}
                disabled={uploadingImage || sending}
                onClick={() => imageInputRef.current?.click()}
                title="Anexar imagem"
              >
                {uploadingImage ? <Spinner animation="border" size="sm" /> : <ImageIcon size={19} />}
              </Button>
              <Form.Control
                as="textarea"
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Digite uma mensagem de teste..."
                disabled={sending}
                style={{
                  resize: 'none',
                  borderRadius: '10px',
                  fontSize: '0.945rem',
                  maxHeight: '120px',
                  overflow: 'auto',
                  background: isDark ? '#1c2748' : undefined,
                  borderColor: isDark ? '#2a2f3d' : undefined,
                  color: isDark ? '#c9d1e0' : undefined,
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
              <Button
                variant="primary"
                onClick={send}
                disabled={sending || !input.trim()}
                style={{ borderRadius: '10px', width: '42px', height: '42px', padding: 0, flexShrink: 0 }}
              >
                {sending ? <Spinner animation="border" size="sm" /> : <Send size={17} />}
              </Button>
            </div>

            <div className="text-center pb-2" style={{ fontSize: '0.76rem', color: colors.footerText, background: colors.panelBg }}>
              Enter para enviar · Shift+Enter para nova linha · sessoes nao sao salvas
            </div>
          </>
        )}

        <style>{`
          @keyframes bounce {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.6; }
            30% { transform: translateY(-6px); opacity: 1; }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          .session-tabs-bar::-webkit-scrollbar { display: none; }
        `}</style>
      </div>
    </>
  );
};

/* ─── Access Modal ─── */
const CHANNEL_LABEL = { whatsapp: 'WhatsApp', telegram: 'Telegram', playground: 'Playground' };
const CHANNEL_VARIANT = { whatsapp: 'success', telegram: 'primary', playground: 'info' };

const ACCESS_MODE_LABELS = { PUBLIC: 'Público', WHITELIST: 'Whitelist', PRIVATE: 'Privado' };

const AgentAccessModal = ({ agent, onClose, onModeChange }) => {
  const [accessMode, setAccessMode]       = useState(agent.accessMode || 'PUBLIC');
  const [contacts, setContacts]           = useState([]);
  const [total, setTotal]                 = useState(0);
  const [page, setPage]                   = useState(1);
  const [search, setSearch]               = useState('');
  const [pending, setPending]             = useState([]);
  const [platformUsers, setPlatformUsers] = useState([]);
  const [employeeContacts, setEmployeeContacts] = useState([]);
  const [loading, setLoading]             = useState(false);
  const [saving, setSaving]               = useState(false);
  const [err, setErr]                     = useState('');
  const [grantTarget, setGrantTarget]     = useState(null); // userId being granted manually
  const [manualChannelId, setManualChannelId] = useState('');
  const [manualChannel, setManualChannel] = useState('whatsapp');
  const LIMIT = 10;

  // add-contact form (WHITELIST)
  const [name, setName]           = useState('');
  const [channelId, setChannelId] = useState('');
  const [channel, setChannel]     = useState('whatsapp');

  const loadAll = useCallback(async (p = page, s = search) => {
    setLoading(true);
    const params = new URLSearchParams({ status: 'approved', page: p, limit: LIMIT });
    if (s) params.set('search', s);

    const [approvedRes, pendingRes, employeeRes, usersRes] = await Promise.allSettled([
      apiRequest(`/agents/${agent.id}/access/contacts?${params}`),
      apiRequest(`/agents/${agent.id}/access/contacts/pending`),
      apiRequest(`/agents/${agent.id}/access/contacts?type=EMPLOYEE&limit=200`),
      apiRequest(`/admin/users`),
    ]);

    if (approvedRes.status === 'fulfilled') {
      setContacts(approvedRes.value?.contacts || []);
      setTotal(approvedRes.value?.total ?? 0);
    } else {
      setContacts([]);
      setTotal(0);
    }
    setPending(pendingRes.status === 'fulfilled' ? pendingRes.value?.contacts || [] : []);
    setEmployeeContacts(employeeRes.status === 'fulfilled' ? employeeRes.value?.contacts || [] : []);
    setPlatformUsers(usersRes.status === 'fulfilled' ? (usersRes.value?.users || usersRes.value?.data || []) : []);
    setLoading(false);
  }, [agent.id, page, search]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
    loadAll(1, val);
  };

  const handlePage = (p) => {
    setPage(p);
    loadAll(p, search);
  };

  const saveMode = async (mode) => {
    try {
      setSaving(true);
      setErr('');
      await apiRequest(`/agents/${agent.id}/access`, {
        method: 'PATCH',
        body: { accessMode: mode },
      });
      setAccessMode(mode);
      onModeChange?.(mode);
      toast.success(`Visibilidade alterada para ${ACCESS_MODE_LABELS[mode] || mode}`);
    } catch (e) {
      setErr(e?.message || 'Erro ao salvar modo de acesso.');
    } finally {
      setSaving(false);
    }
  };

  const addContact = async (e) => {
    e.preventDefault();
    if (!channelId.trim() || !name.trim()) return;
    try {
      setSaving(true);
      setErr('');
      await apiRequest(`/agents/${agent.id}/access/contacts`, {
        method: 'POST',
        body: { channel, channelId: channelId.trim(), name: name.trim() },
      });
      setName('');
      setChannelId('');
      await loadAll();
    } catch (e) {
      setErr(e?.message || 'Erro ao adicionar contato.');
    } finally {
      setSaving(false);
    }
  };

  const approveContact = async (contactId) => {
    try {
      setErr('');
      await apiRequest(`/agents/${agent.id}/access/contacts/${contactId}/approve`, { method: 'PATCH' });
      await loadAll();
    } catch (e) {
      setErr(e?.message || 'Erro ao aprovar contato.');
    }
  };

  const blockContact = async (contactId) => {
    try {
      setErr('');
      await apiRequest(`/agents/${agent.id}/access/contacts/${contactId}/block`, { method: 'PATCH' });
      await loadAll();
    } catch (e) {
      setErr(e?.message || 'Erro ao bloquear contato.');
    }
  };

  const removeContact = async (contactId) => {
    try {
      setErr('');
      await apiRequest(`/agents/${agent.id}/access/contacts/${contactId}`, { method: 'DELETE' });
      await loadAll();
    } catch (e) {
      setErr(e?.message || 'Erro ao remover contato.');
    }
  };

  const grantUser = async (user, chId, ch) => {
    try {
      setErr('');
      setSaving(true);
      await apiRequest(`/agents/${agent.id}/access/contacts`, {
        method: 'POST',
        body: {
          channel: ch || 'whatsapp',
          channelId: chId,
          name: user.name || user.email,
          type: 'EMPLOYEE',
          linkedUserId: user._id,
        },
      });
      setGrantTarget(null);
      setManualChannelId('');
      await loadAll();
    } catch (e) {
      setErr(e?.message || 'Erro ao conceder acesso.');
    } finally {
      setSaving(false);
    }
  };

  const revokeUser = async (contactId) => {
    try {
      setErr('');
      await apiRequest(`/agents/${agent.id}/access/contacts/${contactId}`, { method: 'DELETE' });
      await loadAll();
    } catch (e) {
      setErr(e?.message || 'Erro ao revogar acesso.');
    }
  };

  return (
    <Modal show onHide={onClose} centered size="lg">
      <Modal.Header closeButton className="border-bottom">
        <Modal.Title className="fs-6 fw-bold d-flex align-items-center gap-2">
          <Shield size={16} className="text-primary" />
          Controle de Acesso — {agent.name}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {err && (
          <Alert variant="danger" dismissible onClose={() => setErr('')} className="py-2 small mb-3">
            {err}
          </Alert>
        )}

        {/* ── Mode selector ── */}
        <div className="mb-4">
          <p className="fw-semibold mb-2">Modo de acesso</p>
          <div className="d-flex gap-2 flex-wrap">
            <Button
              variant={accessMode === 'PUBLIC' ? 'primary' : 'outline-secondary'}
              size="sm"
              disabled={saving}
              onClick={() => saveMode('PUBLIC')}
            >
              <Shield size={13} className="me-1" />
              Público — Qualquer Número Pode Conversar
            </Button>
            <Button
              variant={accessMode === 'WHITELIST' ? 'warning' : 'outline-secondary'}
              size="sm"
              disabled={saving}
              onClick={() => saveMode('WHITELIST')}
            >
              <Lock size={13} className="me-1" />
              Whitelist — Somente Contatos Autorizados
            </Button>
            <Button
              variant={accessMode === 'PRIVATE' ? 'danger' : 'outline-secondary'}
              size="sm"
              disabled={saving}
              onClick={() => saveMode('PRIVATE')}
            >
              <UserCheck size={13} className="me-1" />
              Privado — Somente Funcionários
            </Button>
          </div>
        </div>

        {/* ── PUBLIC info ── */}
        {accessMode === 'PUBLIC' && (
          <div className="text-muted small px-1">
            <Shield size={13} className="me-1 opacity-50" />
            Qualquer pessoa que encontrar este agente pode iniciar uma conversa.
          </div>
        )}

        {/* ── WHITELIST section ── */}
        {accessMode === 'WHITELIST' && (
          <>
            <hr />

            {/* Pending requests */}
            {pending.length > 0 && (
              <div className="mb-4">
                <p className="fw-semibold mb-2 d-flex align-items-center gap-2">
                  Solicitações pendentes
                  <Badge bg="warning" text="dark" pill>{pending.length}</Badge>
                </p>
                <div className="d-flex flex-column gap-2">
                  {pending.map((c) => (
                    <div
                      key={c._id}
                      className="d-flex align-items-center justify-content-between px-3 py-2 rounded border border-warning bg-warning bg-opacity-10"
                    >
                      <div>
                        <span className="fw-semibold me-2">{c.name}</span>
                        <Badge bg={CHANNEL_VARIANT[c.channel] || 'secondary'} className="me-2 small">
                          {CHANNEL_LABEL[c.channel] || c.channel}
                        </Badge>
                        <span className="text-muted small">{c.channelId}</span>
                        {c.accessReason && (
                          <div className="text-muted small mt-1 fst-italic">"{c.accessReason}"</div>
                        )}
                      </div>
                      <div className="d-flex gap-1">
                        <Button variant="success" size="sm" onClick={() => approveContact(c._id)}>
                          <Check size={13} />
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => blockContact(c._id)}>
                          <X size={13} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add contact manually */}
            <p className="fw-semibold mb-2">Adicionar contato</p>
            <Form onSubmit={addContact} className="mb-3">
              <Row className="g-2">
                <Col sm={3}>
                  <Form.Select
                    size="sm"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="telegram">Telegram</option>
                    <option value="playground">Playground</option>
                  </Form.Select>
                </Col>
                <Col sm={3}>
                  <Form.Control
                    size="sm"
                    placeholder="Nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Col>
                <Col sm={4}>
                  <InputGroup size="sm">
                    <InputGroup.Text><Phone size={13} /></InputGroup.Text>
                    <Form.Control
                      placeholder="+55 21 99999-0000"
                      value={channelId}
                      onChange={(e) => setChannelId(e.target.value)}
                      required
                    />
                  </InputGroup>
                </Col>
                <Col sm={2}>
                  <Button type="submit" size="sm" variant="success" className="w-100" disabled={saving}>
                    Adicionar
                  </Button>
                </Col>
              </Row>
            </Form>

            {/* Approved contacts — search + list + pagination */}
            <div className="d-flex align-items-center justify-content-between mb-2">
              <p className="fw-semibold mb-0">
                Contatos autorizados
                {total > 0 && <span className="text-muted fw-normal ms-2 small">({total})</span>}
              </p>
              <InputGroup size="sm" style={{ maxWidth: 220 }}>
                <InputGroup.Text><Search size={12} /></InputGroup.Text>
                <Form.Control
                  placeholder="Buscar nome ou número..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                {search && (
                  <Button variant="outline-secondary" size="sm" onClick={() => handleSearch('')}>
                    <X size={12} />
                  </Button>
                )}
              </InputGroup>
            </div>

            {loading ? (
              <div className="text-center py-3"><Spinner size="sm" /></div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-3 text-muted small">
                <UserX size={28} className="mb-2 opacity-25 d-block mx-auto" />
                {search ? 'Nenhum contato encontrado para esta busca.' : 'Nenhum contato autorizado. Adicione acima.'}
              </div>
            ) : (
              <>
                <div className="d-flex flex-column gap-2 mb-3">
                  {contacts.map((c) => (
                    <div
                      key={c._id}
                      className="d-flex align-items-center justify-content-between px-3 py-2 rounded border"
                    >
                      <div>
                        <span className="fw-semibold me-2">{c.name}</span>
                        <Badge bg={CHANNEL_VARIANT[c.channel] || 'secondary'} className="me-2 small">
                          {CHANNEL_LABEL[c.channel] || c.channel}
                        </Badge>
                        <span className="text-muted small">{c.channelId}</span>
                      </div>
                      <Button variant="outline-danger" size="sm" onClick={() => removeContact(c._id)}>
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {total > LIMIT && (
                  <div className="d-flex align-items-center justify-content-between small text-muted">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => handlePage(page - 1)}
                    >
                      ← Anterior
                    </Button>
                    <span>Página {page} de {Math.ceil(total / LIMIT)}</span>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      disabled={page >= Math.ceil(total / LIMIT)}
                      onClick={() => handlePage(page + 1)}
                    >
                      Próxima →
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── PRIVATE section ── */}
        {accessMode === 'PRIVATE' && (
          <>
            <hr />
            <p className="fw-semibold mb-1">Funcionários com acesso</p>
            <p className="text-muted small mb-3">
              Somente funcionários abaixo podem interagir com este agente via WhatsApp ou Telegram.
            </p>

            {loading ? (
              <div className="text-center py-3"><Spinner size="sm" /></div>
            ) : platformUsers.length === 0 ? (
              <div className="text-center py-3 text-muted small">
                <Users size={28} className="mb-2 opacity-25 d-block mx-auto" />
                Nenhum usuário cadastrado na plataforma.
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {platformUsers.map((u) => {
                  const linked = employeeContacts.find(c => c.linkedUserId === u._id);
                  const isExpanded = grantTarget === u._id;
                  const defaultPhone = u.whatsAppNumbers?.[0] || '';

                  return (
                    <div key={u._id} className="rounded border overflow-hidden">
                      <div className="d-flex align-items-center justify-content-between px-3 py-2">
                        <div className="d-flex align-items-center gap-2">
                          <div>
                            <span className="fw-semibold me-2">{u.name || u.email}</span>
                            <Badge bg="secondary" className="me-1 small text-capitalize">{u.role}</Badge>
                            {linked && (
                              <Badge bg={CHANNEL_VARIANT[linked.channel] || 'secondary'} className="small">
                                {CHANNEL_LABEL[linked.channel]} · {linked.channelId}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {linked ? (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => revokeUser(linked._id)}
                          >
                            <X size={13} className="me-1" />
                            Revogar
                          </Button>
                        ) : (
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => {
                              if (defaultPhone) {
                                grantUser(u, defaultPhone, 'whatsapp');
                              } else {
                                setGrantTarget(isExpanded ? null : u._id);
                                setManualChannelId('');
                              }
                            }}
                            disabled={saving}
                          >
                            <UserPlus size={13} className="me-1" />
                            Conceder
                          </Button>
                        )}
                      </div>

                      {/* Inline form when user has no WhatsApp pre-registered */}
                      {isExpanded && !linked && (
                        <div className="px-3 pb-3 pt-1 border-top bg-light bg-opacity-10">
                          <p className="small text-muted mb-2">
                            Nenhum número WhatsApp cadastrado para este usuário. Informe o canal de acesso:
                          </p>
                          <Row className="g-2">
                            <Col sm={4}>
                              <Form.Select
                                size="sm"
                                value={manualChannel}
                                onChange={e => setManualChannel(e.target.value)}
                              >
                                <option value="whatsapp">WhatsApp</option>
                                <option value="telegram">Telegram</option>
                              </Form.Select>
                            </Col>
                            <Col sm={5}>
                              <InputGroup size="sm">
                                <InputGroup.Text><Phone size={13} /></InputGroup.Text>
                                <Form.Control
                                  placeholder="+55 21 99999-0000"
                                  value={manualChannelId}
                                  onChange={e => setManualChannelId(e.target.value)}
                                />
                              </InputGroup>
                            </Col>
                            <Col sm={3}>
                              <Button
                                size="sm"
                                variant="success"
                                className="w-100"
                                disabled={!manualChannelId.trim() || saving}
                                onClick={() => grantUser(u, manualChannelId.trim(), manualChannel)}
                              >
                                <Check size={13} className="me-1" />
                                Salvar
                              </Button>
                            </Col>
                          </Row>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" size="sm" onClick={onClose}>Fechar</Button>
      </Modal.Footer>
    </Modal>
  );
};

/* ─── Skills Modal ─── */
const CATEGORY_LABELS = {
  communication: 'Comunicação',
  productivity:  'Produtividade',
  development:   'Desenvolvimento',
  ai:            'Inteligência Artificial',
  media:         'Mídia',
  utility:       'Utilitários',
  home:          'Casa Inteligente',
};

const SKILL_STATUS_META = {
  ready:         { label: 'Disponível',      color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
  needs_config:  { label: 'Precisa de config', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  needs_binary:  { label: 'Não instalado',   color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
  needs_canvas:  { label: 'Precisa de canvas', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
};

const AgentSkillsModal = ({ agent, onClose }) => {
  const [catalog, setCatalog]     = useState([]);
  const [active, setActive]       = useState({});
  const [loading, setLoading]     = useState(true);
  const [toggling, setToggling]   = useState({});
  const [filter, setFilter]       = useState('');
  const [showAll, setShowAll]     = useState(false);
  const [err, setErr]             = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErr('');
      const [catalogRes, agentRes] = await Promise.all([
        apiRequest('/skills/catalog'),
        apiRequest(`/agents/${agent.id}/skills`),
      ]);
      setCatalog(catalogRes?.skills || []);
      const activeMap = {};
      for (const item of agentRes?.skills || []) {
        if (item.enabled) activeMap[item.skill.key] = true;
      }
      setActive(activeMap);
    } catch (e) {
      setErr(e?.message || 'Erro ao carregar habilidades.');
    } finally {
      setLoading(false);
    }
  }, [agent.id]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (skill, currentlyEnabled) => {
    if (!currentlyEnabled && skill.status !== 'ready' && skill.status !== 'needs_config') return;
    setToggling((prev) => ({ ...prev, [skill.key]: true }));
    setErr('');
    try {
      if (currentlyEnabled) {
        await apiRequest(`/agents/${agent.id}/skills/${skill.key}`, { method: 'DELETE' });
        setActive((prev) => { const next = { ...prev }; delete next[skill.key]; return next; });
      } else {
        await apiRequest(`/agents/${agent.id}/skills/${skill.key}`, { method: 'POST', body: {} });
        setActive((prev) => ({ ...prev, [skill.key]: true }));
      }
    } catch (e) {
      setErr(e?.message || 'Erro ao atualizar habilidade.');
    } finally {
      setToggling((prev) => { const next = { ...prev }; delete next[skill.key]; return next; });
    }
  };

  const term = filter.trim().toLowerCase();
  const visibleCatalog = showAll ? catalog : catalog.filter((s) => s.status === 'ready' || s.status === 'needs_config' || !!active[s.key]);
  const filtered = visibleCatalog.filter((s) =>
    !term || s.name.toLowerCase().includes(term) || s.key.includes(term) || s.description.toLowerCase().includes(term)
  );
  const grouped = filtered.reduce((acc, s) => {
    (acc[s.category] = acc[s.category] || []).push(s);
    return acc;
  }, {});

  const readyCount = catalog.filter((s) => s.status === 'ready').length;
  const configCount = catalog.filter((s) => s.status === 'needs_config').length;

  return (
    <Modal show onHide={onClose} centered size="lg" scrollable>
      <Modal.Header closeButton className="border-bottom">
        <Modal.Title className="fs-6 fw-bold d-flex align-items-center gap-2">
          <Zap size={16} className="text-warning" />
          Habilidades OpenClaw — {agent.name}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: '1rem 1.25rem' }}>
        {err && (
          <Alert variant="danger" dismissible onClose={() => setErr('')} className="py-2 small mb-3">
            {err}
          </Alert>
        )}

        {/* Legenda de status */}
        <div className="d-flex gap-3 mb-3 flex-wrap">
          {Object.entries(SKILL_STATUS_META).map(([key, meta]) => (
            <span key={key} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, display: 'inline-block' }} />
              {meta.label}
            </span>
          ))}
        </div>

        <div className="d-flex gap-2 mb-3 align-items-center">
          <Form.Control
            size="sm"
            placeholder="Buscar habilidade..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ flex: 1 }}
          />
          <Button
            variant={showAll ? 'secondary' : 'outline-secondary'}
            size="sm"
            onClick={() => setShowAll((v) => !v)}
            style={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}
          >
            {showAll ? `Só disponíveis (${readyCount + configCount})` : `Ver todas (${catalog.length})`}
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-5"><Spinner animation="border" size="sm" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-4 text-muted small">Nenhuma habilidade encontrada.</div>
        ) : (
          Object.entries(grouped).map(([category, skills]) => (
            <div key={category} className="mb-4">
              <p className="fw-semibold text-muted small text-uppercase mb-2" style={{ letterSpacing: '0.06em' }}>
                {CATEGORY_LABELS[category] || category}
              </p>
              <div className="d-flex flex-column gap-2">
                {skills.map((skill) => {
                  const enabled    = !!active[skill.key];
                  const busy       = !!toggling[skill.key];
                  const statusMeta = SKILL_STATUS_META[skill.status] || SKILL_STATUS_META.needs_binary;
                  const canToggle  = skill.status === 'ready' || skill.status === 'needs_config' || enabled;
                  return (
                    <div
                      key={skill.key}
                      className="d-flex align-items-center justify-content-between px-3 py-2 rounded border"
                      style={{
                        opacity: busy ? 0.7 : 1,
                        borderLeft: `3px solid ${statusMeta.color}`,
                        background: enabled ? statusMeta.bg : undefined,
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <span style={{ fontSize: '1rem' }}>{skill.icon}</span>
                          <span className="fw-semibold small">{skill.name}</span>
                          <span style={{
                            fontSize: '0.68rem', fontWeight: 600, borderRadius: '4px',
                            padding: '1px 6px', background: statusMeta.bg, color: statusMeta.color,
                          }}>
                            {statusMeta.label}
                          </span>
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.78rem', marginTop: '0.15rem' }}>
                          {skill.description}
                        </div>
                        {!canToggle && skill.requires && (
                          <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.1rem' }}>
                            ⚠️ {skill.requires}
                          </div>
                        )}
                      </div>
                      <Button
                        variant={enabled ? 'success' : canToggle ? 'outline-secondary' : 'light'}
                        size="sm"
                        className="ms-3 flex-shrink-0"
                        disabled={busy || !canToggle}
                        onClick={() => toggle(skill, enabled)}
                        style={{ minWidth: '80px', fontSize: '0.78rem' }}
                        title={!canToggle ? skill.requires : undefined}
                      >
                        {busy ? (
                          <Spinner animation="border" size="sm" />
                        ) : enabled ? (
                          'Ativo'
                        ) : canToggle ? (
                          'Ativar'
                        ) : (
                          'Indisponível'
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" size="sm" onClick={onClose}>Fechar</Button>
      </Modal.Footer>
    </Modal>
  );
};

const TEMPLATE_DEFAULT_GREETINGS = {
  venorica_clara_247: [
    'Olá! Sou a Veronica, sua assistente comercial. Em que posso te ajudar hoje?',
    'Oi! Aqui é a Veronica. Posso te ajudar a encontrar a solução certa para o seu negócio!',
    'Olá! Veronica aqui. Me conta um pouco sobre o que você está buscando.',
    'Oi, seja bem-vindo(a)! Sou a Veronica. Como posso ajudar você hoje?',
    'Olá! Que bom ter você aqui. Sou a Veronica e estou à disposição. Por onde começamos?',
  ],
  real_estate_broker: [
    'Olá! Sou a Ranny, consultora imobiliária. Está buscando imóvel para comprar, alugar ou investir?',
    'Oi, tudo bem? Aqui é a Ranny. Me conta o que você procura: casa, apartamento, terreno?',
    'Olá! Seja bem-vindo(a)! Sou a Ranny e estou aqui para te ajudar a encontrar o imóvel ideal.',
    'Oi! Sou a Ranny, sua consultora de imóveis. Qual é o seu perfil de imóvel ideal?',
    'Olá! Que bom falar com você! Sou a Ranny. Vamos encontrar juntos o imóvel perfeito para você?',
  ],
  timesheet_manager: [
    'Olá! Sou o Max, assistente de timesheet. Vamos registrar suas horas de hoje?',
    'Oi! Aqui é o Max. Pronto para lançar as horas trabalhadas no projeto de hoje?',
    'Olá! Max aqui. Me informe o projeto e o período para registrar seu timesheet.',
    'Oi! Sou o Max, seu assistente de controle de horas. Por qual projeto você quer começar?',
    'Olá! Que bom ter você aqui. Sou o Max e vou te ajudar a manter seu timesheet em dia.',
  ],
  hospital_triage: [
    'Olá! Sou a Sofia, assistente de triagem. Me conte o que está sentindo para eu te orientar.',
    'Oi! Aqui é a Sofia. Estou aqui para te ajudar. Qual é o principal sintoma que você está sentindo?',
    'Olá! Seja bem-vindo(a). Sou a Sofia. Me descreva o que está acontecendo e vamos verificar juntos.',
    'Oi! Sou a Sofia, assistente de saúde. Para começar, há quanto tempo você está com esses sintomas?',
    'Olá! Sofia aqui. Pode falar com tranquilidade — estou aqui para te orientar da melhor forma.',
  ],
  hospital_procurement: [
    'Olá! Sou a Petra, agente de compras de OPME. Qual material você precisa cotar hoje?',
    'Oi! Aqui é a Petra. Me informe o procedimento cirúrgico e vou iniciar a cotação de OPME.',
    'Olá! Petra aqui. Para iniciar a cotação, preciso saber o material, quantidade e data prevista.',
    'Oi! Sou a Petra, responsável por OPME. Pode enviar a solicitação que inicio o processo agora.',
    'Olá! Que bom ter você por aqui. Sou a Petra e vou te ajudar a otimizar a cotação de materiais.',
  ],
  hospital_supply: [
    'Olá! Sou o Vital, agente de supply chain. Qual é a necessidade de estoque hoje?',
    'Oi! Aqui é o Vital. Me informe o medicamento ou material para verificar a disponibilidade.',
    'Olá! Vital aqui. Pode enviar a solicitação de dispensação ou reposição que processo agora.',
    'Oi! Sou o Vital, controle de suprimentos. Qual ala ou paciente precisa de atendimento?',
    'Olá! Vital aqui para garantir que o estoque esteja sempre em dia. Como posso ajudar?',
  ],
  hospital_family_comm: [
    'Olá! Sou a Clara, assistente de comunicação familiar. Como posso ajudar você hoje?',
    'Oi! Aqui é a Clara. Estou aqui para manter você informado(a) sobre o seu familiar. O que precisa saber?',
    'Olá! Clara aqui. Me informe o nome do paciente para eu te ajudar com as últimas atualizações.',
    'Oi! Sou a Clara. Sei que momentos assim são difíceis. Estou aqui para ajudar com o que precisar.',
    'Olá! Bem-vindo(a). Sou a Clara e vou te manter atualizado(a) sobre o estado do seu familiar.',
  ],
  hospital_glosa_guard: [
    'Olá! Sou o Glosa Guard, agente de revisão de faturamento. Qual conta deseja revisar hoje?',
    'Oi! Aqui é o Glosa Guard. Me envie a conta ou o número do procedimento para iniciar a revisão.',
    'Olá! Glosa Guard aqui. Pronto para identificar glosas e recuperar receitas antes do fechamento.',
    'Oi! Sou o Glosa Guard. Qual período de faturamento vamos auditar agora?',
    'Olá! Bem-vindo(a). Glosa Guard aqui para garantir que nenhuma receita seja perdida no faturamento.',
  ],
};

/* ─── Greeting Messages Modal ─── */
const GreetingMessagesModal = ({ agent, onClose, onSave }) => {
  const [messages, setMessages] = useState(agent.greetingMessages || []);
  const [saving, setSaving] = useState(false);
  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const [err, setErr] = useState('');

  // Auto-load defaults when agent has no messages configured yet.
  // Uses the local map first (instant), then tries the templates API as a secondary source.
  useEffect(() => {
    if ((agent.greetingMessages?.length ?? 0) > 0) return;
    if (!agent.templateKey) return;

    // 1. Instant: use hardcoded defaults if available
    const localDefaults = TEMPLATE_DEFAULT_GREETINGS[agent.templateKey];
    if (localDefaults?.length > 0) {
      setMessages(localDefaults);
      return;
    }

    // 2. Fallback: fetch from API (for custom templates seeded after deploy)
    setLoadingDefaults(true);
    apiRequest('/agents/templates')
      .then((res) => {
        const tpl = (res?.templates || []).find((t) => t.key === agent.templateKey);
        if (tpl?.greetingMessages?.length > 0) {
          setMessages(tpl.greetingMessages);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoadingDefaults(false));
  }, []);

  const handleChange = (idx, value) => {
    setMessages((prev) => prev.map((m, i) => (i === idx ? value : m)));
  };

  const handleAdd = () => {
    if (messages.length >= 10) return;
    setMessages((prev) => [...prev, '']);
  };

  const handleRemove = (idx) => {
    setMessages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    setErr('');
    try {
      const cleaned = messages.map((m) => m.trim()).filter(Boolean);
      const updated = await apiRequest(`/agents/${agent.id}/greeting-messages`, {
        method: 'PATCH',
        body: { messages: cleaned },
      });
      onSave(updated);
      toast.success('Saudações salvas!');
    } catch (e) {
      setErr(e?.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show onHide={onClose} centered size="md">
      <Modal.Header closeButton>
        <Modal.Title className="fs-6 fw-semibold">
          <MessageCircle size={16} className="me-2" />
          Saudações — {agent.name}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted small mb-3">
          Uma dessas frases será enviada automaticamente quando um cliente iniciar uma conversa nova.
        </p>
        {err && <div className="alert alert-danger py-2 small">{err}</div>}
        {loadingDefaults ? (
          <div className="text-center py-3">
            <Spinner animation="border" size="sm" className="me-2" />
            <span className="text-muted small">Carregando sugestões...</span>
          </div>
        ) : (
          <>
            <div className="d-flex flex-column gap-2">
              {messages.map((msg, idx) => (
                <div key={idx} className="d-flex gap-2 align-items-start">
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={msg}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    placeholder={`Frase ${idx + 1}`}
                    style={{ fontSize: 13, resize: 'vertical' }}
                  />
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="flex-shrink-0 mt-1"
                    onClick={() => handleRemove(idx)}
                    title="Remover"
                  >
                    <X size={13} />
                  </Button>
                </div>
              ))}
            </div>
            {messages.length < 10 && (
              <Button variant="outline-secondary" size="sm" className="mt-3" onClick={handleAdd}>
                <Plus size={13} className="me-1" />Adicionar frase
              </Button>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Spinner animation="border" size="sm" /> : 'Salvar'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

/* ─── Main Body ─── */
const AgentsBody = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [playgroundAgent, setPlaygroundAgent] = useState(null);
  const [accessAgent, setAccessAgent] = useState(null);
  const [knowledgeAgent, setKnowledgeAgent] = useState(null);
  const [greetingAgent, setGreetingAgent] = useState(null);
  const [agentProviders, setAgentProviders] = useState({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const agentsResponse = await apiRequest('/agents');
      const list = agentsResponse?.agents || [];
      setAgents(list);

      const integrationResults = await Promise.allSettled(
        list.map((a) => apiRequest(`/agents/${a.id}/integrations`))
      );
      const map = {};
      list.forEach((a, i) => {
        const r = integrationResults[i];
        if (r.status === 'fulfilled') {
          const items = r.value?.integrations || r.value || [];
          map[a.id] = items
            .filter((it) => it.enabled !== false)
            .map((it) => it.providerKey)
            .filter(Boolean);
        } else {
          map[a.id] = [];
        }
      });
      setAgentProviders(map);
    } catch (err) {
      setError(err?.message || 'Erro ao carregar funcionários IA.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => ({
    total:  agents.length,
    active: agents.filter((a) => a.status === 'active').length,
    paused: agents.filter((a) => a.status === 'paused').length,
  }), [agents]);

  const filteredAgents = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return agents;
    return agents.filter((agent) =>
      [agent.name, agent.roleTitle, agent.description, agent.templateKey]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }, [agents, search]);

  const setAgentStatus = async (agent, action) => {
    try {
      setError('');
      await apiRequest(`/agents/${agent.id}/${action}`, { method: 'POST' });
      await load();
    } catch (err) {
      setError(err?.message || 'Erro ao atualizar funcionário IA.');
    }
  };

  const archiveAgent = async (agent) => {
    if (!confirm(`Arquivar "${agent.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      setError('');
      await apiRequest(`/agents/${agent.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err?.message || 'Erro ao arquivar funcionário IA.');
    }
  };

  const toggleWebSearch = async (agent) => {
    const next = !agent.webSearchEnabled;
    setAgents((prev) => prev.map((a) => a.id === agent.id ? { ...a, webSearchEnabled: next } : a));
    try {
      await apiRequest(`/agents/${agent.id}`, { method: 'PATCH', body: { webSearchEnabled: next } });
    } catch {
      setAgents((prev) => prev.map((a) => a.id === agent.id ? { ...a, webSearchEnabled: !next } : a));
    }
  };

  return (
    <>
      {playgroundAgent && (
        <AgentPlaygroundPanel agent={playgroundAgent} onClose={() => setPlaygroundAgent(null)} />
      )}
      {accessAgent && (
        <AgentAccessModal
          agent={accessAgent}
          onClose={() => setAccessAgent(null)}
          onModeChange={(mode) =>
            setAgents((prev) => prev.map((a) => a.id === accessAgent.id ? { ...a, accessMode: mode } : a))
          }
        />
      )}
      {knowledgeAgent && (
        <AgentKnowledgeModal agent={knowledgeAgent} onClose={() => setKnowledgeAgent(null)} />
      )}
      {greetingAgent && (
        <GreetingMessagesModal
          agent={greetingAgent}
          onClose={() => setGreetingAgent(null)}
          onSave={(updated) => {
            setAgents((prev) => prev.map((a) => a.id === greetingAgent.id ? { ...a, greetingMessages: updated.greetingMessages } : a));
            setGreetingAgent(null);
          }}
        />
      )}

      <div className="fm-body">
        <SimpleBar className="nicescroll-bar">
          <div className="container-fluid px-4 py-4">

            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div>
                <h4 className="fw-bold mb-0 d-flex align-items-center gap-2">
                  <Users size={20} className="text-primary" /> Funcionários IA
                </h4>
                <small className="text-muted">Gerencie a sua força de trabalho inteligente</small>
              </div>
              <Button as={Link} href="/apps/agents/new" variant="primary" className="d-flex align-items-center gap-2">
                <UserPlus size={16} /> Contratar Funcionário IA
              </Button>
            </div>

            {error && (
              <Alert variant="danger" className="py-2 small mb-3" dismissible onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {/* KPIs */}
            <Row className="g-3 mb-4">
              {[
                { label: 'Total',    value: stats.total,  color: 'primary', icon: <Users     size={18} /> },
                { label: 'Ativos',   value: stats.active, color: 'success', icon: <PlayCircle size={18} /> },
                { label: 'Pausados', value: stats.paused, color: 'warning', icon: <PauseCircle size={18} /> },
              ].map((k) => (
                <Col key={k.label} xs={6} md={4}>
                  <Card className="card-border text-center">
                    <Card.Body className="py-3">
                      <div className={`text-${k.color} mb-1`}>{k.icon}</div>
                      <h3 className={`fw-bold text-${k.color} mb-0`}>{loading ? '…' : k.value}</h3>
                      <small className="text-muted">{k.label}</small>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Busca */}
            <Card className="card-border mb-4">
              <Card.Body className="py-2">
                <InputGroup>
                  <InputGroup.Text><Search size={15} /></InputGroup.Text>
                  <Form.Control
                    placeholder="Buscar por nome, cargo ou template…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </InputGroup>
              </Card.Body>
            </Card>

            {/* Cards */}
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Carregando funcionários IA...</p>
              </div>
            ) : filteredAgents.length === 0 ? (
              <Card className="card-border">
                <Card.Body className="text-center py-5">
                  <Briefcase size={42} className="text-muted mb-3 opacity-25" />
                  <h5>Nenhum funcionário IA encontrado</h5>
                  <p className="text-muted mb-3">
                    {search ? 'Tente outro termo de busca.' : 'Contrate o primeiro funcionário IA.'}
                  </p>
                  {!search && (
                    <Button as={Link} href="/apps/agents/new" variant="primary" size="sm">
                      <UserPlus size={14} className="me-1" /> Contratar primeiro funcionário IA
                    </Button>
                  )}
                </Card.Body>
              </Card>
            ) : (
              <Row className="g-3 mb-5">
                {filteredAgents.map((agent) => (
                  <Col xl={4} md={6} key={agent.id}>
                    <Card className="card-border h-100">
                      <Card.Body>
                        {/* Cabeçalho do card */}
                        <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
                          <div className="min-w-0">
                            <Link href={`/apps/agents/${agent.id}`} className="text-decoration-none text-reset">
                              <h6 className="fw-semibold mb-0">{agent.name}</h6>
                            </Link>
                            <small className="text-muted">{agent.roleTitle}</small>
                          </div>
                          <div className="d-flex align-items-center gap-2 flex-shrink-0">
                            {agent.accessMode === 'PRIVATE' ? (
                              <UserCheck size={13} className="text-danger" title="Privado — Somente Funcionários" />
                            ) : agent.accessMode === 'WHITELIST' ? (
                              <Lock size={13} className="text-warning" title="Whitelist — Somente Contatos Autorizados" />
                            ) : (
                              <Shield size={13} className="text-success" title="Público — Qualquer Número Pode Conversar" />
                            )}
                            <Badge bg={agent.status === 'active' ? 'success' : agent.status === 'paused' ? 'warning' : 'secondary'}>
                              {statusLabels[agent.status] || agent.status}
                            </Badge>
                          </div>
                        </div>

                        {/* Integrações ativas */}
                        {(agentProviders[agent.id] || []).length > 0 && (
                          <div className="mb-3">
                            <AgentProviderIcons
                              providerKeys={agentProviders[agent.id]}
                              size={20}
                              max={8}
                            />
                          </div>
                        )}

                        {/* Linha 1: ações primárias */}
                        <div className="d-flex gap-2 mb-2">
                          <Button variant="primary" size="sm" onClick={() => setPlaygroundAgent(agent)}>
                            <MessageSquare size={14} className="me-1" />Testar
                          </Button>
                          <Button as={Link} href={`/apps/agents/${agent.id}`} variant="outline-secondary" size="sm">
                            <Eye size={14} className="me-1" />Perfil
                          </Button>
                          <Button as={Link} href={`/apps/agents/${agent.id}/prompts`} variant="outline-primary" size="sm">
                            <Edit3 size={14} className="me-1" />Personalidade
                          </Button>
                        </div>

                        {/* Linha 2: ações de gestão + menu destrutivo */}
                        <div className="d-flex gap-2 align-items-center flex-wrap">
                          <Button as={Link} href={`/apps/agents/connectors?agentId=${agent.id}`} variant="outline-secondary" size="sm">
                            <LinkIcon size={13} className="me-1" />Conectores
                          </Button>
                          <Button variant="outline-secondary" size="sm" onClick={() => setKnowledgeAgent(agent)}>
                            <BookOpen size={13} className="me-1" />Conhecimento
                          </Button>
                          <Button
                            variant={agent.accessMode === 'PRIVATE' ? 'outline-danger' : agent.accessMode === 'WHITELIST' ? 'outline-warning' : 'outline-secondary'}
                            size="sm"
                            onClick={() => setAccessAgent(agent)}
                          >
                            <Shield size={13} className="me-1" />Acesso
                          </Button>
                          <Button
                            variant={(agent.greetingMessages?.length ?? 0) > 0 ? 'outline-primary' : 'outline-secondary'}
                            size="sm"
                            onClick={() => setGreetingAgent(agent)}
                            title={`Saudações (${agent.greetingMessages?.length ?? 0} configuradas)`}
                          >
                            <MessageCircle size={13} className="me-1" />Saudação
                          </Button>

                          {/* Toggle busca web */}
                          <div
                            className="d-flex align-items-center gap-1 ms-auto"
                            title={agent.webSearchEnabled ? 'Busca web ativa' : 'Busca web desativada'}
                            style={{ cursor: 'pointer' }}
                            onClick={() => toggleWebSearch(agent)}
                          >
                            <span style={{ fontSize: 11, color: agent.webSearchEnabled ? '#3b82f6' : '#9ca3af' }}>
                              🔍
                            </span>
                            <div style={{
                              width: 32, height: 18, borderRadius: 9, border: 'none',
                              background: agent.webSearchEnabled ? '#3b82f6' : '#d1d5db',
                              position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                            }}>
                              <span style={{
                                position: 'absolute', top: 2, left: agent.webSearchEnabled ? 16 : 2,
                                width: 14, height: 14, borderRadius: '50%', background: '#fff',
                                transition: 'left 0.2s', display: 'block',
                              }} />
                            </div>
                          </div>

                          {/* Pausar/Retomar + Arquivar */}
                          <Dropdown className="ms-auto">
                            <Dropdown.Toggle
                              variant="flush-dark"
                              className="btn-icon btn-rounded flush-soft-hover no-caret"
                              size="sm"
                            >
                              <MoreVertical size={16} />
                            </Dropdown.Toggle>
                            <Dropdown.Menu align="end">
                              {agent.status === 'paused' ? (
                                <Dropdown.Item onClick={() => setAgentStatus(agent, 'resume')}>
                                  <PlayCircle size={14} className="me-2 text-success" />Retomar
                                </Dropdown.Item>
                              ) : (
                                <Dropdown.Item onClick={() => setAgentStatus(agent, 'pause')}>
                                  <PauseCircle size={14} className="me-2" />Pausar
                                </Dropdown.Item>
                              )}
                              <Dropdown.Divider />
                              <Dropdown.Item className="text-danger" onClick={() => archiveAgent(agent)}>
                                <Trash2 size={14} className="me-2" />Arquivar
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </div>
        </SimpleBar>
      </div>
    </>
  );
};

export default AgentsBody;
