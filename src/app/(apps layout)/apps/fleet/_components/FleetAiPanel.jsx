'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';
import { MessageCircle, Send, X, Trash2, ChevronRight, Truck, BarChart2, AlertTriangle, DollarSign, FileText, ChevronDown, Zap, CheckCircle, XCircle } from 'react-feather';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SimpleBar from 'simplebar-react';
import classNames from 'classnames';
import { fleetAiChatStream, fleetAiGetPendingActions, fleetAiApproveAction, fleetAiRejectAction } from '@/lib/api/services/fleet-ai';

const IS_REPORT = /Relat\u00f3rio Executivo de Frota/;

const SUGGESTIONS = [
  { icon: Truck,         label: 'Status da frota',       text: 'Qual o status atual da frota? Quantos veículos estão online?' },
  { icon: BarChart2,     label: 'Km rodados (7 dias)',    text: 'Qual foi o total de km rodado pela frota nos últimos 7 dias?' },
  { icon: AlertTriangle, label: 'Alertas recentes',       text: 'Houve algum alerta de excesso de velocidade nas últimas 24h?' },
  { icon: DollarSign,    label: 'Resumo financeiro',      text: 'Me dê um resumo financeiro da frota do último mês.' },
  { icon: FileText,      label: 'Relatório completo',     text: 'Gere um relatório completo da frota dos últimos 7 dias' },
];

const SEVERITY_COLOR = { low: 'success', medium: 'warning', high: 'danger', critical: 'danger', info: 'info' };
const SEVERITY_LABEL = { low: 'Baixa', medium: 'Média', high: 'Alta', critical: 'Crítica', info: 'Info' };
const SYSTEM_ICONS  = { webhook: '🔗', whatsapp: '💬', email: '📧', sms: '📱', erp: '🏭' };

function ActionCard({ action, onApprove, onReject, loadingId }) {
  const isLoading = loadingId === action._id;
  const done      = action._resolved;
  const sysIcon   = SYSTEM_ICONS[action.targetSystem?.toLowerCase()] ?? '🔔';

  return (
    <div className="d-flex mb-3 justify-content-start">
      <div className="avatar avatar-xs avatar-soft-warning avatar-icon avatar-rounded me-2 flex-shrink-0 mt-1">
        <span className="initial-wrap"><AlertTriangle size={12} /></span>
      </div>
      <div style={{ maxWidth: '92%', minWidth: 260 }}>
        <div
          className="rounded-3 border"
          style={{
            background: done ? 'var(--bs-body-bg)' : 'rgba(255,193,7,.06)',
            borderColor: done ? 'var(--bs-border-color)' : 'rgba(255,193,7,.35)',
            overflow: 'hidden',
          }}
        >
          {/* Header strip */}
          <div
            className="px-3 py-2 d-flex align-items-center justify-content-between gap-2"
            style={{ borderBottom: '1px solid rgba(0,0,0,.06)', background: done ? 'transparent' : 'rgba(255,193,7,.08)' }}
          >
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: '0.9rem' }}>{sysIcon}</span>
              <span className="fw-semibold text-warning-emphasis" style={{ fontSize: '0.8rem' }}>
                Ação pendente de aprovação
              </span>
            </div>
            <span
              className={`badge bg-${SEVERITY_COLOR[action.severity] ?? 'secondary'} text-white flex-shrink-0`}
              style={{ fontSize: '0.62rem' }}
            >
              {SEVERITY_LABEL[action.severity] ?? action.severity ?? 'Info'}
            </span>
          </div>

          <div className="px-3 py-2">
            <div className="fw-semibold mb-1" style={{ fontSize: '0.83rem' }}>
              {action.targetLabel} · <span className="text-muted fw-normal">{action.eventType?.replace(/_/g, ' ')}</span>
            </div>
            {action.vehicleName && (
              <div className="text-muted mb-1" style={{ fontSize: '0.78rem' }}>🚛 {action.vehicleName}</div>
            )}
            <div className="text-muted mb-2" style={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
              {action.description}
            </div>

            {done ? (
              <div
                className={classNames('d-flex align-items-center gap-1 small fw-semibold', {
                  'text-success': action._resolved === 'approved',
                  'text-danger':  action._resolved === 'rejected',
                })}
                style={{ fontSize: '0.78rem' }}
              >
                {action._resolved === 'approved'
                  ? <><CheckCircle size={12} /> Aprovado e enviado</>
                  : <><XCircle size={12} /> Rejeitado</>
                }
              </div>
            ) : (
              <div className="d-flex gap-2">
                <button
                  className="btn btn-xs btn-success d-flex align-items-center gap-1 flex-fill justify-content-center"
                  onClick={() => onApprove(action._id)}
                  disabled={isLoading}
                >
                  {isLoading ? <Spinner size="sm" /> : <CheckCircle size={11} />} Aprovar e enviar
                </button>
                <button
                  className="btn btn-xs btn-outline-danger d-flex align-items-center gap-1"
                  onClick={() => onReject(action._id)}
                  disabled={isLoading}
                >
                  <XCircle size={11} /> Rejeitar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg, onExportPdf }) {
  const isUser = msg.role === 'user';
  const isReport = !isUser && IS_REPORT.test(msg.content);
  return (
    <div className={classNames('d-flex mb-3', isUser ? 'justify-content-end' : 'justify-content-start')}>
      {!isUser && (
        <div className="avatar avatar-xs avatar-soft-primary avatar-icon avatar-rounded me-2 flex-shrink-0 mt-1">
          <span className="initial-wrap"><MessageCircle size={12} /></span>
        </div>
      )}
      <div style={{ maxWidth: '92%' }}>
        <div
          className={classNames('px-3 py-2 rounded-3', {
            'bg-primary text-white': isUser,
            'bg-light text-dark fleet-ai-markdown': !isUser,
          })}
          style={{ lineHeight: 1.6, fontSize: '0.92rem' }}
        >
          {isUser
            ? <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
            : <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
          }
          {msg.streaming && (
            <span className="ms-1 opacity-75" style={{ display: 'inline-block', animation: 'blink 1s step-start infinite' }}>○▮</span>
          )}
        </div>
        {isReport && !msg.streaming && (
          <button
            className="btn btn-xs btn-soft-primary mt-1 d-flex align-items-center gap-1"
            style={{ fontSize: '0.76rem' }}
            onClick={() => onExportPdf(msg.content)}
          >
            <FileText size={11} /> Exportar PDF
          </button>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="d-flex mb-3 justify-content-start">
      <div className="avatar avatar-xs avatar-soft-primary avatar-icon avatar-rounded me-2 flex-shrink-0 mt-1">
        <span className="initial-wrap"><MessageCircle size={12} /></span>
      </div>
      <div className="px-3 py-2 rounded-3 bg-light">
        <div className="d-flex gap-1 align-items-center" style={{ height: 20 }}>
          {[0, 1, 2].map(i => (
            <span
              key={i}
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#6c757d',
                animation: `bounce 1.2s ${i * 0.2}s infinite ease-in-out`,
                display: 'inline-block',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FleetAiPanel({ open, onClose, initialMessage, actionKey = 0 }) {
  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState('');
  const [streaming, setStreaming]       = useState(false);
  const [printContent, setPrintContent] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const abortRef         = useRef(null);
  const bottomRef        = useRef(null);
  const sendingRef       = useRef(false);
  const reportRef        = useRef(null);
  const sendMessageRef   = useRef(null);
  const prevActionKey    = useRef(-1);
  const textareaRef      = useRef(null);
  // Track action IDs already injected so we don't duplicate cards
  const shownActionIds   = useRef(new Set());

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!open || !initialMessage) return;
    if (actionKey === prevActionKey.current) return;
    prevActionKey.current = actionKey;
    // Each chip action starts a fresh conversation so history never bleeds across
    setMessages([]);
    shownActionIds.current.clear();
    const t = setTimeout(() => sendMessageRef.current?.(initialMessage), 220);
    return () => clearTimeout(t);
  }, [open, initialMessage, actionKey]);

  // On panel open, load any existing pending actions into the chat as cards
  useEffect(() => {
    if (!open) return;
    fleetAiGetPendingActions().then(data => {
      if (!Array.isArray(data) || data.length === 0) return;
      const fresh = data.filter(a => !shownActionIds.current.has(a._id));
      if (fresh.length === 0) return;
      fresh.forEach(a => shownActionIds.current.add(a._id));
      setPendingCount(data.length);
      setMessages(prev => [
        ...prev,
        ...fresh.map(a => ({ role: 'action', action: a, id: `action-${a._id}` })),
      ]);
    }).catch(() => {});
  }, [open]);

  const injectNewPendingActions = useCallback(async () => {
    try {
      const data = await fleetAiGetPendingActions();
      if (!Array.isArray(data)) return;
      setPendingCount(data.filter(a => !a._resolved).length);
      const fresh = data.filter(a => !shownActionIds.current.has(a._id));
      if (fresh.length === 0) return;
      fresh.forEach(a => shownActionIds.current.add(a._id));
      setMessages(prev => [
        ...prev,
        ...fresh.map(a => ({ role: 'action', action: a, id: `action-${a._id}` })),
      ]);
    } catch { /* silent */ }
  }, []);

  const handleExportPdf = useCallback((content) => {
    setPrintContent(content);
    setTimeout(() => {
      const html = reportRef.current?.innerHTML ?? '';
      const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
      const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const win = window.open('', '_blank');
      if (!win) { setPrintContent(null); return; }
      win.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório Executivo de Frota — TMS-Fácil</title>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;font-size:11pt;line-height:1.65;color:#1a202c;background:#fff;padding:40px 56px}
    h1{font-size:17pt;color:#1e3a8a;border-bottom:3px solid #2563eb;padding-bottom:10px;margin-bottom:4px;font-weight:700}
    .doc-meta{font-size:9pt;color:#6b7280;margin-bottom:24px;padding-top:4px}
    h2{font-size:12pt;font-weight:700;color:#1e3a8a;border-left:4px solid #2563eb;padding-left:10px;margin:22px 0 8px}
    h3{font-size:10.5pt;font-weight:700;margin:14px 0 6px;color:#374151}
    p{margin-bottom:6px}
    strong,b{font-weight:700}
    hr{border:none;border-top:1px solid #e5e7eb;margin:14px 0}
    table{border-collapse:collapse;width:100%;margin:8px 0 16px;font-size:9.5pt}
    thead th{background:#eff6ff;color:#1e3a8a;font-weight:600;padding:7px 10px;border:1px solid #bfdbfe;text-align:left}
    tbody td{padding:6px 10px;border:1px solid #e5e7eb;vertical-align:top}
    tbody tr:nth-child(even){background:#f9fafb}
    ul,ol{padding-left:18px;margin-bottom:8px}
    li{margin-bottom:3px}
    pre{background:#f3f4f6;border:1px solid #e5e7eb;color:#111827;padding:12px 16px;border-radius:6px;font-family:'Courier New',monospace;font-size:8.5pt;white-space:pre-wrap;margin:8px 0;overflow-wrap:break-word}
    code:not(pre code){background:#eff6ff;color:#1d4ed8;padding:1px 5px;border-radius:3px;font-family:'Courier New',monospace;font-size:9pt}
    blockquote{border-left:4px solid #2563eb;padding-left:14px;margin:10px 0;color:#4b5563;font-style:italic}
    .doc-footer{margin-top:40px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:8.5pt;color:#9ca3af;display:flex;justify-content:space-between}
    @media print{
      @page{margin:1.5cm 2cm;size:A4}
      body{padding:0;font-size:10pt}
      h2{page-break-after:avoid}
      table{page-break-inside:avoid}
      tr{page-break-inside:avoid}
    }
  </style>
</head>
<body>
  ${html}
  <div class="doc-meta">TMS-F\u00e1cil \u00b7 Intelig\u00eancia de Frota \u00b7 Gerado em ${date} \u00e0s ${time}</div>
  <div class="doc-footer"><span>TMS-F\u00e1cil \u00b7 Relat\u00f3rio gerado por Assistente de IA</span><span>${date}</span></div>
  <script>window.onload=function(){window.print()}<\/script>
</body>
</html>`);
      win.document.close();
      setPrintContent(null);
    }, 300);
  }, []);

  const sendMessage = useCallback(async (text) => {
    const userText = (text ?? input).trim();
    if (!userText || sendingRef.current) return;
    sendingRef.current = true;

    setInput('');

    const history = messages
      .filter(m => !m.streaming && m.role !== 'error' && m.role !== 'action')
      .map(m => ({ role: m.role, content: m.content }));

    const userMsgId   = `u-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const assistantId = `a-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setMessages(prev => [...prev, { role: 'user', content: userText, id: userMsgId }]);
    setMessages(prev => [...prev, { role: 'assistant', content: '', id: assistantId, streaming: true }]);
    setStreaming(true);

    abortRef.current = new AbortController();

    try {
      await fleetAiChatStream(
        userText,
        history,
        (chunk) => {
          setMessages(prev =>
            prev.map(m => m.id === assistantId
              ? { ...m, content: m.content + chunk }
              : m,
            ),
          );
        },
        abortRef.current.signal,
      );
      setMessages(prev =>
        prev.map(m => m.id === assistantId ? { ...m, streaming: false } : m),
      );
      // Check for new pending actions after each assistant reply
      await injectNewPendingActions();
    } catch (err) {
      if (err?.name === 'AbortError') {
        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, streaming: false } : m),
        );
      } else {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: '❌ Erro ao conectar com o assistente. Tente novamente.', streaming: false, role: 'error' }
              : m,
          ),
        );
      }
    } finally {
      setStreaming(false);
      sendingRef.current = false;
    }
  }, [input, messages, injectNewPendingActions]);

  sendMessageRef.current = sendMessage;

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  };

  const clearChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    shownActionIds.current.clear();
    setStreaming(false);
    setShowSuggestions(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleSuggestionClick = (text) => {
    setShowSuggestions(false);
    sendMessage(text);
  };

  const handleApprove = useCallback(async (id) => {
    setActionLoadingId(id);
    try {
      await fleetAiApproveAction(id);
      setMessages(prev => prev.map(m =>
        m.role === 'action' && m.action._id === id
          ? { ...m, action: { ...m.action, _resolved: 'approved' } }
          : m,
      ));
      setPendingCount(c => Math.max(0, c - 1));
    } finally { setActionLoadingId(null); }
  }, []);

  const handleReject = useCallback(async (id) => {
    setActionLoadingId(id);
    try {
      await fleetAiRejectAction(id);
      setMessages(prev => prev.map(m =>
        m.role === 'action' && m.action._id === id
          ? { ...m, action: { ...m.action, _resolved: 'rejected' } }
          : m,
      ));
      setPendingCount(c => Math.max(0, c - 1));
    } finally { setActionLoadingId(null); }
  }, []);

  return (
    <>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1;   }
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        .fleet-ai-panel {
          position: fixed;
          top: 0;
          right: 0;
          width: 672px;
          height: 100vh;
          background: var(--bs-body-bg, #fff);
          border-left: 1px solid var(--bs-border-color, #dee2e6);
          box-shadow: -6px 0 32px rgba(0,0,0,.12);
          display: flex;
          flex-direction: column;
          z-index: 1050;
          transition: transform .28s cubic-bezier(.4,0,.2,1);
          transform: translateX(100%);
        }
        .fleet-ai-panel.open {
          transform: translateX(0);
        }
        .fleet-ai-panel .panel-header {
          padding: 14px 20px;
          border-bottom: 1px solid var(--bs-border-color, #dee2e6);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
          background: linear-gradient(135deg, rgba(13,110,253,.04) 0%, transparent 100%);
        }
        .fleet-ai-panel .panel-messages {
          flex: 1;
          overflow: hidden;
        }
        .fleet-ai-panel .panel-suggestions-bar {
          border-top: 1px solid var(--bs-border-color, #dee2e6);
          flex-shrink: 0;
          overflow: hidden;
        }
        .fleet-ai-panel .panel-suggestions-bar .suggestions-scroll {
          display: flex;
          gap: 6px;
          padding: 8px 14px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .fleet-ai-panel .panel-suggestions-bar .suggestions-scroll::-webkit-scrollbar { display: none; }
        .fleet-ai-panel .panel-input {
          padding: 12px 16px;
          border-top: 1px solid var(--bs-border-color, #dee2e6);
          flex-shrink: 0;
        }
        .fleet-ai-live-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #198754;
          animation: pulse-dot 2s ease-in-out infinite;
          display: inline-block;
        }
        .fleet-ai-markdown p { margin-bottom: 0.35rem; }
        .fleet-ai-markdown p:last-child { margin-bottom: 0; }
        .fleet-ai-markdown h1, .fleet-ai-markdown h2, .fleet-ai-markdown h3 { font-weight: 700; margin: 0.75rem 0 0.35rem; }
        .fleet-ai-markdown h1 { font-size: 1.1em; }
        .fleet-ai-markdown h2 { font-size: 1.05em; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 3px; }
        .fleet-ai-markdown h3 { font-size: 1em; }
        .fleet-ai-markdown table { border-collapse: collapse; width: 100%; margin: 0.5rem 0; font-size: 0.87rem; }
        .fleet-ai-markdown th, .fleet-ai-markdown td { border: 1px solid rgba(0,0,0,0.15); padding: 5px 10px; text-align: left; }
        .fleet-ai-markdown th { background: rgba(13,110,253,.07); font-weight: 600; color: #1e3a8a; }
        .fleet-ai-markdown tr:nth-child(even) td { background: rgba(0,0,0,.025); }
        .fleet-ai-markdown ul, .fleet-ai-markdown ol { padding-left: 1.2rem; margin-bottom: 0.35rem; }
        .fleet-ai-markdown li { margin-bottom: 0.15rem; }
        .fleet-ai-markdown pre { background: #1a1a2e; color: #00ff41; padding: 10px 14px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 0.78rem; white-space: pre; overflow-x: auto; margin: 0.5rem 0; }
        .fleet-ai-markdown code:not(pre code) { background: rgba(13,110,253,.1); color: #0d4dbf; padding: 1px 5px; border-radius: 3px; font-size: 0.88em; }
        .fleet-ai-markdown strong { font-weight: 700; }
        .fleet-ai-markdown blockquote { border-left: 3px solid #0d6efd; margin: 0.35rem 0; padding-left: 0.8rem; opacity: 0.85; }
        .fleet-ai-textarea {
          resize: none;
          line-height: 1.5;
          padding-top: 8px;
          padding-bottom: 8px;
          min-height: 38px;
          max-height: 120px;
          overflow-y: auto;
          transition: height .1s ease;
        }
        @media (max-width: 768px) {
          .fleet-ai-panel { width: 100vw; }
        }
      `}</style>

      <div className={classNames('fleet-ai-panel', { open })}>

        {/* Header */}
        <div className="panel-header">
          <div className="d-flex align-items-center gap-2">
            <div className="avatar avatar-sm avatar-soft-primary avatar-icon avatar-rounded">
              <span className="initial-wrap"><Zap size={14} /></span>
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <span className="fw-semibold" style={{ fontSize: '0.95rem', lineHeight: 1.2 }}>IA de Frota</span>
                <span className="fleet-ai-live-dot" title="Online" />
                {pendingCount > 0 && (
                  <span
                    className="badge bg-warning text-dark"
                    style={{ fontSize: '0.62rem', borderRadius: 20, padding: '2px 6px' }}
                    title={`${pendingCount} ação${pendingCount !== 1 ? 'ões' : ''} aguardando aprovação`}
                  >
                    {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>8 agentes especializados · dados em tempo real</small>
            </div>
          </div>
          <div className="d-flex align-items-center gap-1">
            <button
              className="btn btn-xs btn-soft-secondary d-flex align-items-center gap-1 me-1"
              style={{ fontSize: '0.72rem' }}
              onClick={() => setShowSuggestions(s => !s)}
            >
              <ChevronDown size={11} />
              Sugestões
            </button>
            {messages.length > 0 && (
              <Button variant="flush-dark" size="sm" className="btn-icon btn-rounded flush-soft-hover" title="Limpar conversa" onClick={clearChat}>
                <Trash2 size={14} />
              </Button>
            )}
            <Button variant="flush-dark" size="sm" className="btn-icon btn-rounded flush-soft-hover" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="panel-messages">
          <SimpleBar className="nicescroll-bar h-100">
            <div className="px-4 pt-4 pb-2">
              {messages.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <div className="avatar avatar-xl avatar-soft-primary avatar-icon avatar-rounded mx-auto mb-3">
                    <span className="initial-wrap"><Zap size={28} /></span>
                  </div>
                  <p className="fw-semibold mb-1" style={{ fontSize: '0.95rem' }}>IA de Inteligência de Frota</p>
                  <p className="small mb-3 opacity-75 mx-auto" style={{ maxWidth: 320 }}>
                    Pergunte sobre veículos, motoristas, alertas, custos e anomalias — com dados em tempo real do Traccar.
                  </p>
                  <div className="d-flex flex-wrap gap-2 justify-content-center">
                    {SUGGESTIONS.map(({ icon: Icon, label, text }) => (
                      <button
                        key={label}
                        className="btn btn-xs btn-soft-primary d-flex align-items-center gap-1"
                        style={{ fontSize: '0.76rem' }}
                        onClick={() => sendMessage(text)}
                        disabled={streaming}
                      >
                        <Icon size={11} />{label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map(m =>
                  m.role === 'action'
                    ? <ActionCard
                        key={m.id}
                        action={m.action}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        loadingId={actionLoadingId}
                      />
                    : (m.streaming && m.content === '')
                      ? null
                      : <MessageBubble key={m.id} msg={m} onExportPdf={handleExportPdf} />
                )
              )}
              {streaming && messages[messages.length - 1]?.content === '' && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>
          </SimpleBar>
        </div>

        {/* Quick suggestions (collapsible) */}
        {showSuggestions && (
          <div className="panel-suggestions-bar">
            <div className="suggestions-scroll">
              {SUGGESTIONS.map(({ icon: Icon, label, text }) => (
                <button
                  key={label}
                  className="btn btn-xs btn-soft-secondary d-flex align-items-center gap-1 flex-shrink-0"
                  style={{ fontSize: '0.75rem' }}
                  onClick={() => handleSuggestionClick(text)}
                  disabled={streaming}
                >
                  <Icon size={11} />{label}<ChevronRight size={10} className="opacity-50" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="panel-input">
          <div className="input-group input-group-sm">
            <Form.Control
              ref={textareaRef}
              as="textarea"
              rows={1}
              placeholder="Pergunte sobre sua frota…"
              value={input}
              onChange={handleInputChange}
              onKeyDown={onKeyDown}
              disabled={streaming}
              className="fleet-ai-textarea"
            />
            <Button
              variant="primary"
              onClick={() => sendMessage()}
              disabled={streaming || !input.trim()}
            >
              {streaming ? <Spinner size="sm" /> : <Send size={14} />}
            </Button>
          </div>
          <small className="text-muted d-block mt-1" style={{ fontSize: '0.71rem' }}>
            Enter para enviar · Shift+Enter para nova linha
          </small>
        </div>
      </div>

      {printContent && (
        <div
          ref={reportRef}
          style={{ position: 'fixed', left: '-9999px', top: 0, width: 820, pointerEvents: 'none', overflow: 'hidden' }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{printContent}</ReactMarkdown>
        </div>
      )}
    </>
  );
}
