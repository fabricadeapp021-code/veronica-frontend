'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Alert, Badge, Button, Card, Col, Form, InputGroup, Modal, Row, Spinner } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import {
  BookOpen,
  Briefcase,
  Image as ImageIcon,
  Link as LinkIcon,
  Lock,
  MessageSquare,
  Edit3,
  PauseCircle,
  Phone,
  PlayCircle,
  RefreshCw,
  Send,
  Shield,
  Trash2,
  UserX,
  X,
} from 'react-feather';
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

  const loadFiles = useCallback(async () => {
    try {
      setLoadingFiles(true);
      const res = await apiRequest(`/agents/${agent.id}/knowledge`);
      setFiles(res?.files || []);
    } catch {
      setFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  }, [agent.id]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadErr('');
    if (file.size > 20 * 1024 * 1024) {
      setUploadErr('Arquivo muito grande. Maximo 20MB.');
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
      await loadFiles();
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
      PENDING: { bg: '#fef3c7', color: '#92400e', label: 'Pendente' },
      FAILED:  { bg: '#fee2e2', color: '#991b1b', label: 'Falhou' },
    };
    const s = map[status] || { bg: '#e5e7eb', color: '#374151', label: status };
    return (
      <span style={{
        fontSize: '0.70rem', fontWeight: 600, borderRadius: '4px',
        padding: '1px 6px', background: s.bg, color: s.color,
      }}>
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
            <div style={{ fontSize: '0.76rem' }}>PDF, DOCX, JPEG, PNG, TXT — max 20MB</div>
          </>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.jpeg,.jpg,.png,.txt"
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
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingImage, setPendingImage] = useState(null); // { previewUrl, file }
  const [uploadingImage, setUploadingImage] = useState(false);
  const [sessionKey, setSessionKey] = useState(() => `pg-${Date.now()}`);
  const bottomRef = useRef(null);
  const imageInputRef = useRef(null);

  const clearChat = () => {
    setMessages([]);
    setSessionKey(`pg-${Date.now()}`);
    setInput('');
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
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: text, ts: Date.now(), imagePreview: pendingImage?.previewUrl },
      { role: 'assistant', content: '', ts: Date.now() + 1, loading: true },
    ]);
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
      if (sessionKey) body.sessionId = sessionKey;
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
              if (event.sessionKey) setSessionKey(event.sessionKey);
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: 'assistant', content: event.content, ts: Date.now() };
                return copy;
              });
            } else if (event.type === 'error') {
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = {
                  role: 'assistant',
                  content: `Erro: ${event.error || 'Nao foi possivel obter resposta.'}`,
                  ts: Date.now(),
                  error: true,
                };
                return copy;
              });
            }
          } catch {
            /* linha SSE inválida — ignora */
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: 'assistant',
          content: `Erro: ${err?.message || 'Nao foi possivel obter resposta.'}`,
          ts: Date.now(),
          error: true,
        };
        return copy;
      });
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
          width: '440px',
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

        {/* Skills bar */}
        <div
          style={{
            padding: '0.5rem 1.25rem',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            gap: '0.4rem',
            flexWrap: 'wrap',
          }}
        >
          {(agent.skills || []).slice(0, 5).map((s) => (
            <Badge key={s} bg="light" text="dark" style={{ fontWeight: 400, fontSize: '0.76rem' }}>
              {s.replaceAll('_', ' ')}
            </Badge>
          ))}
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
                          {msg.content}
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
              Enter para enviar · Shift+Enter para nova linha · historico nao e salvo
            </div>
          </>
        )}

        <style>{`
          @keyframes bounce {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.6; }
            30% { transform: translateY(-6px); opacity: 1; }
          }
        `}</style>
      </div>
    </>
  );
};

/* ─── Access Modal ─── */
const AgentAccessModal = ({ agent, onClose }) => {
  const [contacts, setContacts] = useState([]);
  const [accessMode, setAccessMode] = useState(agent.accessMode || 'PUBLIC');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [err, setErr] = useState('');

  const loadContacts = useCallback(async () => {
    try {
      setLoadingContacts(true);
      const res = await apiRequest(`/agents/${agent.id}/access/contacts`);
      setContacts(res?.contacts || []);
    } catch {
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  }, [agent.id]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const saveMode = async (mode) => {
    try {
      setSaving(true);
      setErr('');
      await apiRequest(`/agents/${agent.id}/access`, {
        method: 'PATCH',
        body: { accessMode: mode },
      });
      setAccessMode(mode);
    } catch (e) {
      setErr(e?.message || 'Erro ao salvar modo de acesso.');
    } finally {
      setSaving(false);
    }
  };

  const addContact = async (e) => {
    e.preventDefault();
    if (!phone.trim() || !name.trim()) return;
    try {
      setSaving(true);
      setErr('');
      await apiRequest(`/agents/${agent.id}/access/contacts`, {
        method: 'POST',
        body: { phone: phone.trim(), name: name.trim() },
      });
      setPhone('');
      setName('');
      await loadContacts();
    } catch (e) {
      setErr(e?.message || 'Erro ao adicionar contato.');
    } finally {
      setSaving(false);
    }
  };

  const removeContact = async (contactPhone) => {
    try {
      setErr('');
      await apiRequest(`/agents/${agent.id}/access/contacts/${encodeURIComponent(contactPhone)}`, {
        method: 'DELETE',
      });
      await loadContacts();
    } catch (e) {
      setErr(e?.message || 'Erro ao remover contato.');
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

        <div className="mb-4">
          <p className="fw-semibold mb-2">Modo de acesso</p>
          <div className="d-flex gap-2">
            <Button
              variant={accessMode === 'PUBLIC' ? 'primary' : 'outline-secondary'}
              size="sm"
              disabled={saving}
              onClick={() => saveMode('PUBLIC')}
            >
              <Shield size={14} className="me-1" />
              Público — qualquer número pode conversar
            </Button>
            <Button
              variant={accessMode === 'WHITELIST' ? 'warning' : 'outline-secondary'}
              size="sm"
              disabled={saving}
              onClick={() => saveMode('WHITELIST')}
            >
              <Lock size={14} className="me-1" />
              Whitelist — somente contatos autorizados
            </Button>
          </div>
        </div>

        {accessMode === 'WHITELIST' && (
          <>
            <hr />
            <p className="fw-semibold mb-2">Contatos autorizados</p>
            <Form onSubmit={addContact} className="mb-3">
              <Row className="g-2">
                <Col sm={4}>
                  <Form.Control
                    size="sm"
                    placeholder="Nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Col>
                <Col sm={5}>
                  <InputGroup size="sm">
                    <InputGroup.Text><Phone size={13} /></InputGroup.Text>
                    <Form.Control
                      placeholder="+55 21 99999-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </InputGroup>
                </Col>
                <Col sm={3}>
                  <Button type="submit" size="sm" variant="success" className="w-100" disabled={saving}>
                    Adicionar
                  </Button>
                </Col>
              </Row>
            </Form>

            {loadingContacts ? (
              <div className="text-center py-3"><Spinner size="sm" /></div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-3 text-muted small">
                <UserX size={28} className="mb-2 opacity-25 d-block mx-auto" />
                Nenhum contato autorizado. Adicione acima.
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {contacts.map((c) => (
                  <div
                    key={c.phone}
                    className="d-flex align-items-center justify-content-between px-3 py-2 rounded border"
                  >
                    <div>
                      <span className="fw-semibold me-2">{c.name}</span>
                      <span className="text-muted small">{c.phone}</span>
                    </div>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeContact(c.phone)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                ))}
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

/* ─── Main Body ─── */
const AgentsBody = ({ searchValue }) => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playgroundAgent, setPlaygroundAgent] = useState(null);
  const [accessAgent, setAccessAgent] = useState(null);
  const [knowledgeAgent, setKnowledgeAgent] = useState(null);
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
      setError(err?.message || 'Erro ao carregar funcionarios IA.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredAgents = useMemo(() => {
    const term = (searchValue || '').trim().toLowerCase();
    if (!term) return agents;
    return agents.filter((agent) =>
      [agent.name, agent.roleTitle, agent.description, agent.templateKey]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [agents, searchValue]);

  const setAgentStatus = async (agent, action) => {
    try {
      setError('');
      await apiRequest(`/agents/${agent.id}/${action}`, { method: 'POST' });
      await load();
    } catch (err) {
      setError(err?.message || 'Erro ao atualizar funcionario IA.');
    }
  };

  const archiveAgent = async (agent) => {
    try {
      setError('');
      await apiRequest(`/agents/${agent.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err?.message || 'Erro ao arquivar funcionario IA.');
    }
  };

  if (loading) {
    return (
      <div className="integrations-body">
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Carregando funcionarios IA...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {playgroundAgent && (
        <AgentPlaygroundPanel
          agent={playgroundAgent}
          onClose={() => setPlaygroundAgent(null)}
        />
      )}
      {accessAgent && (
        <AgentAccessModal
          agent={accessAgent}
          onClose={() => setAccessAgent(null)}
        />
      )}
      {knowledgeAgent && (
        <AgentKnowledgeModal
          agent={knowledgeAgent}
          onClose={() => setKnowledgeAgent(null)}
        />
      )}

      <div className="integrations-body">
        <SimpleBar className="nicescroll-bar">
          <div className="p-4">
            {error && (
              <Alert variant="danger" dismissible onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="mb-1">Funcionarios IA contratados</h5>
                <span className="text-muted">
                  {filteredAgents.length} funcionario{filteredAgents.length !== 1 ? 's' : ''} ativo
                  {filteredAgents.length !== 1 ? 's' : ''} no painel.
                </span>
              </div>
              <Button variant="light" size="sm" onClick={load}>
                <RefreshCw size={16} className="me-1" />
                Atualizar
              </Button>
            </div>

            {filteredAgents.length === 0 ? (
              <Card className="card-border mb-4">
                <Card.Body className="text-center py-5">
                  <Briefcase size={42} className="text-muted mb-3" />
                  <h5>Nenhum funcionario IA contratado</h5>
                  <p className="text-muted mb-0">
                    Contrate o primeiro funcionario IA pelo botao no topo da pagina.
                  </p>
                </Card.Body>
              </Card>
            ) : (
              <Row className="g-3 mb-5">
                {filteredAgents.map((agent) => (
                  <Col xl={4} md={6} key={agent.id}>
                    <Card className="card-border h-100">
                      <Card.Body>
                        <div className="d-flex align-items-start justify-content-between gap-3">
                          <div>
                            <h6 className="mb-1">{agent.name}</h6>
                            <p className="text-muted small mb-2">{agent.roleTitle}</p>
                          </div>
                          <Badge bg={agent.status === 'active' ? 'success' : 'secondary'}>
                            {statusLabels[agent.status] || agent.status}
                          </Badge>
                        </div>
                        <p className="text-muted mb-3">{agent.description}</p>
                        <div className="d-flex align-items-center flex-wrap gap-2 mb-3">
                          <Badge bg="light" text="dark">
                            {autonomyLabels[agent.autonomyLevel] || agent.autonomyLevel}
                          </Badge>
                          <AgentProviderIcons
                            providerKeys={agentProviders[agent.id] || []}
                            size={20}
                            max={6}
                          />
                        </div>
                        {agent.skills?.length > 0 && (
                          <div className="d-flex flex-wrap gap-2 mb-3">
                            {agent.skills.slice(0, 4).map((skill) => (
                              <Badge key={skill} bg="light" text="dark">
                                {skill.replaceAll('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="d-flex gap-2 flex-wrap">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setPlaygroundAgent(agent)}
                          >
                            <MessageSquare size={15} className="me-1" />
                            Testar
                          </Button>
                          <Button
                            as={Link}
                            href={`/apps/agents/connectors?agentId=${agent.id}`}
                            variant="outline-primary"
                            size="sm"
                          >
                            <LinkIcon size={15} className="me-1" />
                            Conectores
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => setKnowledgeAgent(agent)}
                          >
                            <BookOpen size={15} className="me-1" />
                            Conhecimento
                          </Button>
                          <Button
                            as={Link}
                            href={`/apps/agents/${agent.id}/prompts`}
                            variant="outline-primary"
                            size="sm"
                          >
                            <Edit3 size={15} className="me-1" />
                            Personalidade
                          </Button>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => setAccessAgent(agent)}
                          >
                            <Shield size={15} className="me-1" />
                            Acesso
                          </Button>
                          {agent.status === 'paused' ? (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => setAgentStatus(agent, 'resume')}
                            >
                              <PlayCircle size={15} className="me-1" />
                              Retomar
                            </Button>
                          ) : (
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => setAgentStatus(agent, 'pause')}
                            >
                              <PauseCircle size={15} className="me-1" />
                              Pausar
                            </Button>
                          )}
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => archiveAgent(agent)}
                          >
                            <Trash2 size={15} className="me-1" />
                            Arquivar
                          </Button>
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
