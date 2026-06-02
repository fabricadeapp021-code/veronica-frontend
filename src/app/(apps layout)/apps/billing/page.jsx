'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import SimpleBar from 'simplebar-react';
import {
  Alert, Badge, Button, Card, Col, Modal, Row, Spinner, Table,
} from 'react-bootstrap';
import {
  AlertTriangle, CheckCircle, RefreshCw, Zap, X, MessageCircle,
  Phone, Cpu, GitBranch, Shield, Users, BarChart2, Headphones,
} from 'react-feather';
import {
  getBillingBalance,
  getBillingPlans,
  getBillingSubscription,
  cancelBillingSubscription,
  subscribePlan,
  createCreditsCheckout,
  getCreditsHistory,
  getOrderStatus,
} from '@/lib/api/services/billing';
import { getAuthUser } from '@/lib/auth/session';

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmtBrl  = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const fmtN    = (v) => (v ?? 0).toLocaleString('pt-BR');
const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '-';

const OP_LABELS = {
  agent_chat:         { label: 'Conversa com Agente IA',      color: '#6366f1' },
  whatsapp_message:   { label: 'Mensagem WhatsApp',            color: '#25d366' },
  voice_call:         { label: 'Chamada de Voz (Retell)',      color: '#0ea5e9' },
  voice_call_per_minute: { label: 'Voz — por minuto',         color: '#0ea5e9' },
  tool_execution:     { label: 'Execução de Ferramenta',       color: '#f59e0b' },
  memory_reflection:  { label: 'Reflexão de Memória',          color: '#8b5cf6' },
  campaign_dispatch:  { label: 'Disparo de Campanha',          color: '#ec4899' },
  image_generate:     { label: 'Geração de Imagem',            color: '#14b8a6' },
  document_parse:     { label: 'Análise de Documento',         color: '#f97316' },
  purchase:           { label: 'Compra de créditos',           color: '#22c55e' },
  plan_grant:         { label: 'Créditos do plano adicionados',color: '#22c55e' },
  admin_add:          { label: 'Créditos adicionados',         color: '#22c55e' },
  refund:             { label: 'Estorno',                      color: '#22c55e' },
};

// ─── Planos estáticos (fallback) ─────────────────────────────────────────────

const STATIC_PLANS = [
  {
    slug: 'starter',
    name: 'Starter',
    priceMonthly: 497,
    creditsPerMonth: 2000,
    description: 'Para empresas que querem começar com 1 agente focado.',
    highlight: false,
    ctaLabel: 'Começar agora',
    features: [
      { icon: Users,         text: '1 agente de IA ativo' },
      { icon: MessageCircle, text: '1 número de WhatsApp dedicado' },
      { icon: Zap,           text: 'Até 2.000 conversas/mês' },
      { icon: GitBranch,     text: '3 workflows configuráveis' },
      { icon: Cpu,         text: 'Memória de clientes (90 dias)' },
      { icon: CheckCircle,   text: '2 integrações via API' },
      { icon: BarChart2,     text: 'Painel de monitoramento' },
      { icon: Headphones,    text: 'Suporte por e-mail' },
    ],
    active: true,
  },
  {
    slug: 'growth',
    name: 'Growth',
    priceMonthly: 2497,
    creditsPerMonth: 15000,
    description: 'Para empresas crescendo com equipes de IA multifuncionais.',
    highlight: true,
    ctaLabel: 'Começar agora',
    features: [
      { icon: Users,         text: 'Até 5 agentes de IA ativos' },
      { icon: MessageCircle, text: '5 números de WhatsApp dedicados' },
      { icon: Zap,           text: 'Até 15.000 conversas/mês' },
      { icon: GitBranch,     text: 'Workflows ilimitados' },
      { icon: Cpu,         text: 'Memória persistente (365 dias)' },
      { icon: CheckCircle,   text: 'Integrações ilimitadas' },
      { icon: Phone,         text: 'Voz e áudio no WhatsApp' },
      { icon: Users,         text: 'Escalada inteligente para humanos' },
      { icon: BarChart2,     text: 'Dashboard de analytics avançado' },
      { icon: Headphones,    text: 'Suporte prioritário (chat + vídeo)' },
    ],
    active: true,
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    priceMonthly: null,
    creditsPerMonth: null,
    description: 'Para operações que exigem escala, conformidade e controle total.',
    highlight: false,
    ctaLabel: 'Falar com especialista',
    ctaHref: 'mailto:comercial@venorica.ai',
    features: [
      { icon: Users,         text: 'Agentes ilimitados' },
      { icon: Shield,        text: 'Infraestrutura dedicada' },
      { icon: Zap,           text: 'Conversas ilimitadas' },
      { icon: CheckCircle,   text: 'SLA de uptime 99.9%' },
      { icon: Shield,        text: 'Isolamento total de tenant' },
      { icon: BarChart2,     text: 'Auditoria e logs exportáveis' },
      { icon: Shield,        text: 'Integração com SSO e RBAC' },
      { icon: Headphones,    text: 'Treinamento personalizado' },
      { icon: Users,         text: 'Gerente de conta dedicado' },
      { icon: Headphones,    text: 'Suporte 24/7' },
    ],
    active: true,
  },
];

// ─── Countdown ────────────────────────────────────────────────────────────────

const Countdown = ({ seconds: init }) => {
  const [s, setS] = useState(init);
  useEffect(() => {
    if (s <= 0) return;
    const t = setTimeout(() => setS(s - 1), 1000);
    return () => clearTimeout(t);
  }, [s]);
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return <span className={s < 60 ? 'text-danger fw-semibold' : 'fw-semibold'}>{mm}:{ss}</span>;
};

// ─── Modal de pagamento (PIX) ─────────────────────────────────────────────────

function SubscribeModal({ show, onHide, plan, onSuccess }) {
  const user = getAuthUser();
  const [step,      setStep]      = useState('form');
  const [cpfCnpj,   setCpfCnpj]   = useState('');
  const [errMsg,    setErrMsg]    = useState(null);
  const [pixData,   setPixData]   = useState(null);
  const [pixCopied, setPixCopied] = useState(false);
  const pollRef = useRef(null);

  const stopPoll = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const handleClose = useCallback(() => {
    stopPoll();
    setStep('form'); setPixData(null); setCpfCnpj(''); setErrMsg(null);
    onHide();
  }, [onHide]);

  useEffect(() => () => stopPoll(), []);

  const startPoll = (orderId) => {
    stopPoll();
    pollRef.current = setInterval(async () => {
      try {
        const res = await getOrderStatus(orderId);
        const st  = res?.data?.status ?? res?.status;
        if (st === 'CREDITS_ADDED') { stopPoll(); setStep('success'); onSuccess(); }
      } catch (_) {}
    }, 5000);
  };

  const handlePixGenerate = async () => {
    const cpf = cpfCnpj.replace(/\D/g, '');
    if (cpf.length < 11) { setErrMsg('Informe um CPF ou CNPJ válido.'); return; }
    setErrMsg(null); setStep('waiting');
    try {
      const res = await createCreditsCheckout({
        credits: plan.creditsPerMonth,
        amountBrl: plan.priceMonthly,
        planName: plan.name,
        planSlug: plan.slug,
        paymentMethod: 'pix',
        provider: 'asaas',
        customerName:    user?.name  || 'Cliente',
        customerEmail:   user?.email || 'cliente@venorica.ai',
        customerCpfCnpj: cpf,
      });
      if (!res?.success) throw new Error(res?.message || 'Erro ao gerar PIX.');
      setPixData(res.data);
      startPoll(res.data.orderId);
    } catch (err) {
      setStep('form');
      setErrMsg(err?.message || 'Erro ao gerar QR Code PIX.');
    }
  };

  const copyPix = () => {
    if (!pixData?.pixCopyPaste) return;
    navigator.clipboard.writeText(pixData.pixCopyPaste);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 3000);
  };

  if (!plan) return null;

  return (
    <Modal show={show} onHide={handleClose} centered size="md">
      <Modal.Header closeButton={step !== 'waiting'} className="border-0 pb-0">
        <Modal.Title className="fs-6 fw-bold">
          {step === 'success' ? 'Assinatura ativada!' : `Assinar plano ${plan.name}`}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="px-4 pb-4 pt-2">

        {step === 'success' && (
          <div className="text-center py-4">
            <div style={{ fontSize: 52, marginBottom: 8 }}>🎉</div>
            <h5 className="fw-bold mb-1" style={{ color: '#10b981' }}>
              Plano {plan.name} ativado!
            </h5>
            <p className="text-muted small mb-4">
              Sua assinatura está ativa. Os créditos mensais já foram adicionados.
            </p>
            <Button variant="success" onClick={handleClose}>Fechar</Button>
          </div>
        )}

        {step === 'waiting' && !pixData && (
          <div className="text-center py-5">
            <Spinner style={{ width: 44, height: 44, color: '#6366f1' }} />
            <p className="mt-3 text-muted small">Gerando cobrança PIX…</p>
          </div>
        )}

        {step === 'waiting' && pixData && (
          <div className="text-center py-2">
            <div className="d-flex align-items-center gap-2 rounded px-3 py-2 mb-3"
              style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 12, color: '#166534' }}>
              <Spinner size="sm" style={{ color: '#16a34a', flexShrink: 0 }} />
              <span>Aguardando pagamento — a página confirma automaticamente.</span>
            </div>
            {pixData.pixQrCodeImage && (
              <div className="d-inline-block p-2 mb-3 rounded-3"
                style={{ background: '#fff', border: '2px solid #e2e8f0' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`data:image/png;base64,${pixData.pixQrCodeImage}`}
                  alt="QR Code PIX" width={180} height={180} />
              </div>
            )}
            <p className="text-muted small mb-2">
              Abra seu banco, escolha <strong>Pagar com PIX</strong> e escaneie o QR Code.
            </p>
            {pixData.pixCopyPaste && (
              <div className="d-flex gap-2 mb-3">
                <input readOnly value={pixData.pixCopyPaste}
                  className="form-control form-control-sm"
                  style={{ fontSize: 10, fontFamily: 'monospace' }} />
                <Button variant={pixCopied ? 'success' : 'outline-secondary'} size="sm"
                  onClick={copyPix} style={{ whiteSpace: 'nowrap' }}>
                  {pixCopied ? 'Copiado!' : 'Copiar'}
                </Button>
              </div>
            )}
            {pixData.pixExpiresAt && (
              <div className="text-muted" style={{ fontSize: 11 }}>
                Expira em:{' '}
                <Countdown seconds={Math.max(0, Math.round((new Date(pixData.pixExpiresAt) - Date.now()) / 1000))} />
              </div>
            )}
          </div>
        )}

        {step === 'form' && (
          <>
            <div className="d-flex justify-content-between align-items-center rounded-3 px-3 py-2 mb-4"
              style={{ background: 'var(--bs-tertiary-bg)', border: '1px solid var(--bs-border-color)' }}>
              <div>
                <div className="fw-semibold small">{plan.name}</div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  {plan.creditsPerMonth ? `${fmtN(plan.creditsPerMonth)} créditos/mês` : 'Créditos customizados'}
                </div>
              </div>
              <div className="fw-bold fs-5">{fmtBrl(plan.priceMonthly)}<span className="text-muted fw-normal" style={{ fontSize: 13 }}>/mês</span></div>
            </div>

            {errMsg && <Alert variant="danger" className="py-2 small mb-3">{errMsg}</Alert>}

            <div className="mb-4">
              <label className="form-label small fw-semibold">CPF ou CNPJ</label>
              <input type="text" className="form-control" maxLength={18}
                placeholder="000.000.000-00 ou 00.000.000/0001-00"
                value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} />
            </div>

            <Button variant="success" className="w-100 fw-semibold mb-2" onClick={handlePixGenerate}>
              ⚡ Pagar com PIX — {fmtBrl(plan.priceMonthly)}
            </Button>

            <div className="text-muted text-center mt-2" style={{ fontSize: 11 }}>
              🔒 Pagamento seguro via Asaas · SSL 256-bit · Renovação automática mensal
            </div>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
}

// ─── Card de plano ────────────────────────────────────────────────────────────

function PlanCard({ plan, isCurrentPlan, onSubscribe }) {
  const isEnterprise = plan.slug === 'enterprise';

  const cardStyle = plan.highlight ? {
    background: 'linear-gradient(160deg, #1e1b4b 0%, #2d2a5e 100%)',
    border: '2px solid #6366f1',
    boxShadow: '0 0 40px rgba(99,102,241,0.25)',
  } : {
    background: 'var(--bs-card-bg)',
    border: '1px solid var(--bs-border-color)',
  };

  const textColor = plan.highlight ? '#e2e8f0' : undefined;
  const subColor  = plan.highlight ? '#94a3b8' : '#6b7280';

  return (
    <Card className="h-100" style={{ borderRadius: 16, position: 'relative', ...cardStyle }}>
      {plan.highlight && (
        <div style={{
          position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(90deg, #6366f1, #818cf8)',
          color: '#fff', borderRadius: 20, padding: '4px 16px',
          fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
        }}>
          ⚡ Mais popular
        </div>
      )}

      <Card.Body className="p-4 d-flex flex-column">
        <div className="mb-3">
          <div className="fw-bold" style={{ fontSize: 18, color: textColor }}>{plan.name}</div>

          {isEnterprise ? (
            <div className="fw-bold mt-2" style={{ fontSize: 28, color: textColor }}>
              Sob consulta
            </div>
          ) : (
            <div className="d-flex align-items-baseline gap-1 mt-2">
              <span style={{ fontSize: 11, color: subColor, marginTop: 2 }}>R$</span>
              <span className="fw-bold" style={{ fontSize: 32, lineHeight: 1, color: textColor }}>
                {plan.priceMonthly.toLocaleString('pt-BR')}
              </span>
              <span style={{ fontSize: 13, color: subColor }}>/mês</span>
            </div>
          )}

          <p style={{ fontSize: 13, color: subColor, marginTop: 8, marginBottom: 0 }}>
            {plan.description}
          </p>
        </div>

        <div className="mb-4" style={{ flex: 1 }}>
          {plan.features.map(({ icon: Icon, text }, i) => (
            <div key={i} className="d-flex align-items-start gap-2 mb-2">
              <div style={{ marginTop: 2, flexShrink: 0 }}>
                <CheckCircle size={14} color={plan.highlight ? '#818cf8' : '#6366f1'} />
              </div>
              <span style={{ fontSize: 13, color: plan.highlight ? '#cbd5e1' : '#475569' }}>
                {text}
              </span>
            </div>
          ))}
        </div>

        {isCurrentPlan ? (
          <Button variant="outline-success" className="w-100 fw-semibold" disabled style={{ borderRadius: 10 }}>
            <CheckCircle size={13} className="me-1" /> Plano atual
          </Button>
        ) : isEnterprise ? (
          <Button
            className="w-100 fw-semibold"
            style={{
              borderRadius: 10,
              background: 'transparent',
              border: '1px solid #6366f1',
              color: '#6366f1',
            }}
            href={plan.ctaHref}
            as="a"
          >
            {plan.ctaLabel}
          </Button>
        ) : (
          <Button
            className="w-100 fw-semibold"
            style={{
              borderRadius: 10,
              background: plan.highlight ? 'linear-gradient(90deg,#6366f1,#818cf8)' : '#6366f1',
              borderColor: '#6366f1',
            }}
            onClick={() => onSubscribe(plan)}
          >
            {plan.ctaLabel}
          </Button>
        )}
      </Card.Body>
    </Card>
  );
}

// ─── Comparativo de funcionalidades do OpenClaw ───────────────────────────────

const FEATURE_ROWS = [
  { label: 'Agentes de IA ativos',         starter: '1',            growth: 'Até 5',         enterprise: 'Ilimitados'    },
  { label: 'Números de WhatsApp',           starter: '1',            growth: '5',              enterprise: 'Ilimitados'    },
  { label: 'Conversas/mês',                 starter: '2.000',        growth: '15.000',         enterprise: 'Ilimitadas'    },
  { label: 'Workflows configuráveis',       starter: '3',            growth: 'Ilimitados',     enterprise: 'Ilimitados'    },
  { label: 'Memória de clientes',           starter: '90 dias',      growth: '365 dias',       enterprise: 'Permanente'    },
  { label: 'Integrações via API',           starter: '2',            growth: 'Ilimitadas',     enterprise: 'Ilimitadas'    },
  { label: 'Voz e áudio (Retell AI)',       starter: false,          growth: true,             enterprise: true            },
  { label: 'Escalada para humanos',         starter: false,          growth: true,             enterprise: true            },
  { label: 'Dashboard analytics avançado', starter: false,          growth: true,             enterprise: true            },
  { label: 'Isolamento total de tenant',    starter: false,          growth: false,            enterprise: true            },
  { label: 'Auditoria e logs exportáveis', starter: false,          growth: false,            enterprise: true            },
  { label: 'SSO e RBAC',                   starter: false,          growth: false,            enterprise: true            },
  { label: 'Infraestrutura dedicada',       starter: false,          growth: false,            enterprise: true            },
  { label: 'SLA de uptime 99.9%',           starter: false,          growth: false,            enterprise: true            },
  { label: 'Gerente de conta dedicado',    starter: false,          growth: false,            enterprise: true            },
  { label: 'Suporte',                       starter: 'E-mail',       growth: 'Chat + vídeo',   enterprise: '24/7'          },
];

function FeatureCell({ value }) {
  if (value === true)  return <CheckCircle size={16} color="#10b981" />;
  if (value === false) return <X size={16} color="#94a3b8" />;
  return <span style={{ fontSize: 13 }}>{value}</span>;
}

function ComparisonTable() {
  return (
    <Card className="mb-4" style={{ borderRadius: 12, overflow: 'hidden' }}>
      <Card.Header style={{ background: 'var(--bs-tertiary-bg)' }}>
        <h6 className="mb-0 fw-semibold">Comparativo completo de funcionalidades</h6>
      </Card.Header>
      <div style={{ overflowX: 'auto' }}>
        <Table className="mb-0" style={{ minWidth: 560 }}>
          <thead style={{ background: 'var(--bs-tertiary-bg)', fontSize: 12 }}>
            <tr>
              <th className="ps-3 py-2" style={{ width: '40%' }}>Funcionalidade</th>
              <th className="text-center py-2">Starter</th>
              <th className="text-center py-2" style={{ color: '#818cf8', fontWeight: 700 }}>Growth</th>
              <th className="text-center py-2">Enterprise</th>
            </tr>
          </thead>
          <tbody>
            {FEATURE_ROWS.map(({ label, starter, growth, enterprise }) => (
              <tr key={label}>
                <td className="ps-3 py-2 small">{label}</td>
                <td className="text-center py-2"><FeatureCell value={starter} /></td>
                <td className="text-center py-2" style={{ background: 'rgba(99,102,241,0.04)' }}><FeatureCell value={growth} /></td>
                <td className="text-center py-2"><FeatureCell value={enterprise} /></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </Card>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

const BillingPage = () => {
  const [balance,      setBalance]      = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [history,      setHistory]      = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [histLoading,  setHistLoading]  = useState(true);
  const [feedback,     setFeedback]     = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showModal,    setShowModal]    = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [balRes, subRes] = await Promise.allSettled([
        getBillingBalance(),
        getBillingSubscription(),
      ]);
      if (balRes.status === 'fulfilled') {
        const d = balRes.value?.data;
        setBalance(d?.availableBalance ?? d?.balance ?? 0);
        setSubscription((prev) => subRes.status === 'fulfilled' ? (subRes.value?.data ?? null) : (d?.subscription ?? prev));
      }
      if (subRes.status === 'fulfilled') setSubscription(subRes.value?.data ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const r = await getCreditsHistory({ limit: 20 });
      setHistory(r?.data?.transactions ?? []);
      setHistoryTotal(r?.data?.total ?? 0);
    } catch (_) {}
    finally { setHistLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); fetchHistory(); }, [fetchAll, fetchHistory]);

  const handleSuccess = async () => {
    setShowModal(false);
    setFeedback({ v: 'success', m: `Plano ${selectedPlan?.name} ativado com sucesso!` });
    await fetchAll();
    await fetchHistory();
  };

  const currentSlug = subscription?.planSlug ?? subscription?.plan?.slug ?? null;
  const isActive    = subscription?.status === 'active';

  const statusColor = {
    active:    '#10b981',
    cancelled: '#ef4444',
    suspended: '#f59e0b',
    expired:   '#94a3b8',
  }[subscription?.status] ?? '#94a3b8';

  return (
    <div className="fm-body">
      <SimpleBar className="nicescroll-bar">
        <div className="container-fluid px-4 py-4" style={{ maxWidth: 1080 }}>

          {feedback && (
            <Alert variant={feedback.v} dismissible onClose={() => setFeedback(null)} className="mb-3">
              {feedback.m}
            </Alert>
          )}

          {/* Header */}
          <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
            <div>
              <h4 className="mb-1 fw-bold">Planos Venorica AI</h4>
              <p className="text-muted mb-0 small">
                Contrate uma equipe de colaboradores de IA para o seu negócio.
              </p>
            </div>
            <Button variant="outline-secondary" size="sm"
              onClick={() => { fetchAll(); fetchHistory(); }}
              className="d-inline-flex align-items-center gap-1">
              <RefreshCw size={13} /> Atualizar
            </Button>
          </div>

          {/* Status da assinatura atual */}
          {!loading && subscription && (
            <div className="d-flex align-items-center gap-3 mb-4 p-3 rounded-3"
              style={{ background: 'var(--bs-tertiary-bg)', border: '1px solid var(--bs-border-color)', fontSize: 13 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
              <div>
                <span className="fw-semibold">Assinatura {subscription.planSlug || subscription.plan?.name || '—'}</span>
                <span className="text-muted ms-2">·</span>
                <span className="text-muted ms-2">
                  Status: <strong style={{ color: statusColor }}>{subscription.status}</strong>
                </span>
                {subscription.currentPeriodEnd && (
                  <>
                    <span className="text-muted ms-2">·</span>
                    <span className="text-muted ms-2">
                      Renova em: <strong>{fmtDate(subscription.currentPeriodEnd)}</strong>
                    </span>
                  </>
                )}
              </div>
              {balance !== null && (
                <div className="ms-auto d-flex align-items-center gap-1 text-muted">
                  <Zap size={13} />
                  <span>{fmtN(balance)} créditos disponíveis</span>
                </div>
              )}
            </div>
          )}

          {!loading && !subscription && balance !== null && (
            <div className="d-flex align-items-center gap-2 mb-4 p-3 rounded-3"
              style={{ background: 'var(--bs-tertiary-bg)', border: '1px solid var(--bs-border-color)', fontSize: 13 }}>
              <AlertTriangle size={14} color="#f59e0b" />
              <span className="text-muted">Sem assinatura ativa.</span>
              <span className="ms-2 text-muted">Saldo disponível: <strong>{fmtN(balance)} créditos</strong></span>
            </div>
          )}

          {/* Cards de plano */}
          {loading ? (
            <div className="text-center py-5 text-muted small">
              <Spinner size="sm" className="me-2" />Carregando planos...
            </div>
          ) : (
            <Row className="g-4 mb-5 align-items-stretch">
              {STATIC_PLANS.map((plan) => (
                <Col md={4} key={plan.slug}>
                  <PlanCard
                    plan={plan}
                    isCurrentPlan={isActive && currentSlug === plan.slug}
                    onSubscribe={(p) => { setSelectedPlan(p); setShowModal(true); }}
                  />
                </Col>
              ))}
            </Row>
          )}

          {/* Tabela comparativa */}
          <ComparisonTable />

          {/* Custo por operação OpenClaw */}
          <Card className="mb-4" style={{ borderRadius: 12 }}>
            <Card.Body className="p-4">
              <h6 className="mb-3 fw-semibold d-flex align-items-center gap-2">
                <Zap size={14} /> Consumo de créditos por operação
              </h6>
              <Row className="g-0">
                {[
                  { label: 'Conversa com Agente IA (por mensagem)', cost: '1 cr',  color: '#6366f1' },
                  { label: 'Mensagem WhatsApp enviada',             cost: '1 cr',  color: '#25d366' },
                  { label: 'Voz — por minuto (Retell AI)',          cost: '3 cr',  color: '#0ea5e9' },
                  { label: 'Execução de ferramenta (tool call)',     cost: '2 cr',  color: '#f59e0b' },
                  { label: 'Reflexão de memória (pós-conversa)',    cost: '2 cr',  color: '#8b5cf6' },
                  { label: 'Análise de documento (RAG)',            cost: '2 cr',  color: '#f97316' },
                  { label: 'Geração de imagem',                     cost: '5 cr',  color: '#14b8a6' },
                  { label: 'Disparo de campanha (por lead)',        cost: 'Grátis', color: '#10b981' },
                ].map(({ label, cost, color }) => (
                  <Col md={6} key={label}>
                    <div className="d-flex align-items-center justify-content-between py-2 border-bottom">
                      <div className="d-flex align-items-center gap-2">
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                        <span className="small">{label}</span>
                      </div>
                      <span className="small fw-semibold" style={{ color }}>{cost}</span>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>

          {/* Histórico de transações */}
          <Card className="card-border">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-0 fw-semibold">Histórico de consumo</h6>
                {historyTotal > 0 && <small className="text-muted">{historyTotal} transações</small>}
              </div>
              <Button variant="link" size="sm" className="p-0 text-muted" onClick={fetchHistory}>
                <RefreshCw size={13} />
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              {histLoading ? (
                <div className="text-center py-4 text-muted small">
                  <Spinner size="sm" className="me-2" />Carregando...
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-4 text-muted small">Nenhuma transação ainda.</div>
              ) : (
                <Table hover size="sm" className="mb-0">
                  <thead style={{ backgroundColor: 'var(--bs-tertiary-bg)' }}>
                    <tr>
                      <th className="ps-3">Operação</th>
                      <th>Data</th>
                      <th className="text-end pe-3">Créditos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((tx, i) => {
                      const isCredit = ['credit', 'refund', 'reserve_expire', 'plan_grant', 'admin_add', 'purchase'].includes(tx.type);
                      const op = OP_LABELS[tx.operation] ?? OP_LABELS[tx.type] ?? { label: tx.operation || tx.type, color: '#6b7280' };
                      return (
                        <tr key={tx._id || i}>
                          <td className="ps-3">
                            <div className="d-flex align-items-center gap-2">
                              <div style={{
                                width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: `${op.color}18`, color: op.color,
                              }}>
                                <Zap size={12} />
                              </div>
                              <div>
                                <div className="fw-medium small">{op.label}</div>
                                {tx.description && <div className="text-muted" style={{ fontSize: 11 }}>{tx.description}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="small text-muted align-middle">{fmtDate(tx.createdAt)}</td>
                          <td className="text-end pe-3 align-middle">
                            <span className={`fw-semibold ${isCredit ? 'text-success' : 'text-danger'}`}>
                              {isCredit ? '+' : '-'}{Math.abs(tx.amount).toLocaleString('pt-BR')}
                            </span>
                            <div className="text-muted" style={{ fontSize: 10 }}>
                              saldo: {(tx.balanceAfter ?? 0).toLocaleString('pt-BR')}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>

        </div>
      </SimpleBar>

      <SubscribeModal
        show={showModal}
        onHide={() => setShowModal(false)}
        plan={selectedPlan}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default BillingPage;
