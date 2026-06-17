'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import SimpleBar from 'simplebar-react';
import {
  Alert, Badge, Button, Card, Col, Modal, Row, Spinner, Table,
} from 'react-bootstrap';
import {
  AlertTriangle, RefreshCw, Layers, Minus, Plus, Mail,
} from 'react-feather';
import {
  getAgentBillingSummary,
  getAgentBillingPlans,
  createAgentCheckout,
  cancelAgentSubscription,
  listAgentBillingOrders,
  getOrderStatus,
} from '@/lib/api/services/billing';
import { getAuthUser } from '@/lib/auth/session';

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmtBrl  = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '-';

const STATUS_LABELS = {
  ACTIVE:    { label: 'Ativa',              color: '#10b981' },
  PAST_DUE:  { label: 'Pagamento pendente', color: '#f59e0b' },
  CANCELLED: { label: 'Cancelada',          color: '#ef4444' },
};

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

function SubscribeModal({ show, onHide, agentSlots, amountBrl, onSuccess }) {
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
        const order = await getOrderStatus(orderId);
        if (order?.status === 'CREDITS_ADDED') { stopPoll(); setStep('success'); onSuccess(); }
      } catch (_) {}
    }, 5000);
  };

  const handlePixGenerate = async () => {
    const cpf = cpfCnpj.replace(/\D/g, '');
    if (cpf.length < 11) { setErrMsg('Informe um CPF ou CNPJ válido.'); return; }
    setErrMsg(null); setStep('waiting');
    try {
      const order = await createAgentCheckout({
        agentSlots,
        paymentMethod: 'pix',
        customerName:    user?.name  || 'Cliente',
        customerEmail:   user?.email || 'cliente@venorica.ai',
        customerCpfCnpj: cpf,
      });
      setPixData(order);
      startPoll(order.orderId);
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

  if (!agentSlots) return null;

  return (
    <Modal show={show} onHide={handleClose} centered size="md">
      <Modal.Header closeButton={step !== 'waiting'} className="border-0 pb-0">
        <Modal.Title className="fs-6 fw-bold">
          {step === 'success' ? 'Assinatura ativada!' : `Contratar ${agentSlots} agente(s)`}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="px-4 pb-4 pt-2">

        {step === 'success' && (
          <div className="text-center py-4">
            <div style={{ fontSize: 52, marginBottom: 8 }}>🎉</div>
            <h5 className="fw-bold mb-1" style={{ color: '#10b981' }}>
              {agentSlots} vaga(s) de agente ativada(s)!
            </h5>
            <p className="text-muted small mb-4">
              Sua assinatura está ativa. Já pode criar seus agentes em /apps/agents.
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
                <div className="fw-semibold small">{agentSlots} agente(s) de IA</div>
                <div className="text-muted" style={{ fontSize: 12 }}>Cobrança recorrente mensal</div>
              </div>
              <div className="fw-bold fs-5">{fmtBrl(amountBrl)}<span className="text-muted fw-normal" style={{ fontSize: 13 }}>/mês</span></div>
            </div>

            {errMsg && <Alert variant="danger" className="py-2 small mb-3">{errMsg}</Alert>}

            <div className="mb-4">
              <label className="form-label small fw-semibold">CPF ou CNPJ</label>
              <input type="text" className="form-control" maxLength={18}
                placeholder="000.000.000-00 ou 00.000.000/0001-00"
                value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} />
            </div>

            <Button variant="success" className="w-100 fw-semibold mb-2" onClick={handlePixGenerate}>
              ⚡ Pagar com PIX — {fmtBrl(amountBrl)}
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

// ─── Página principal ─────────────────────────────────────────────────────────

const PRICE_PER_SLOT = 876;
const MAX_SELF_SERVE_SLOTS = 4;

const BillingPage = () => {
  const [summary,      setSummary]      = useState(null);
  const [orders,       setOrders]       = useState([]);
  const [ordersTotal,  setOrdersTotal]  = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [feedback,     setFeedback]     = useState(null);
  const [quantity,     setQuantity]     = useState(1);
  const [showModal,    setShowModal]    = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAgentBillingSummary();
      setSummary(res?.data ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await listAgentBillingOrders({ limit: 20 });
      setOrders(res?.items ?? []);
      setOrdersTotal(res?.total ?? 0);
    } catch (_) {}
    finally { setOrdersLoading(false); }
  }, []);

  useEffect(() => { fetchSummary(); fetchOrders(); }, [fetchSummary, fetchOrders]);

  const handleSuccess = async () => {
    setShowModal(false);
    setFeedback({ v: 'success', m: `${quantity} agente(s) ativado(s) com sucesso!` });
    await fetchSummary();
    await fetchOrders();
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancelar a assinatura de vagas de agente? Seus agentes atuais não são apagados, mas você não poderá renovar.')) return;
    try {
      await cancelAgentSubscription('Cancelado pelo usuário via /apps/billing');
      setFeedback({ v: 'success', m: 'Assinatura cancelada.' });
      await fetchSummary();
    } catch (err) {
      setFeedback({ v: 'danger', m: err?.message ?? 'Erro ao cancelar assinatura.' });
    }
  };

  const status = summary?.status ? STATUS_LABELS[summary.status] : null;
  const amountForQuantity = quantity * PRICE_PER_SLOT;

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
              <h4 className="mb-1 fw-bold">Vagas de Agentes — Venorica AI</h4>
              <p className="text-muted mb-0 small">
                Contrate uma equipe de colaboradores de IA para o seu negócio. Sem créditos, sem limite de uso.
              </p>
            </div>
            <Button variant="outline-secondary" size="sm"
              onClick={() => { fetchSummary(); fetchOrders(); }}
              className="d-inline-flex align-items-center gap-1">
              <RefreshCw size={13} /> Atualizar
            </Button>
          </div>

          {/* Status da assinatura atual */}
          {!loading && summary && summary.agentSlots > 0 && (
            <div className="d-flex align-items-center gap-3 mb-4 p-3 rounded-3 flex-wrap"
              style={{ background: 'var(--bs-tertiary-bg)', border: '1px solid var(--bs-border-color)', fontSize: 13 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: status?.color ?? '#94a3b8', flexShrink: 0 }} />
              <div>
                <span className="fw-semibold">{summary.activeAgentsCount} de {summary.agentSlots} agentes em uso</span>
                <span className="text-muted ms-2">·</span>
                <span className="text-muted ms-2">
                  Status: <strong style={{ color: status?.color }}>{status?.label ?? '—'}</strong>
                </span>
                {summary.currentPeriodEnd && (
                  <>
                    <span className="text-muted ms-2">·</span>
                    <span className="text-muted ms-2">
                      Renova em: <strong>{fmtDate(summary.currentPeriodEnd)}</strong>
                    </span>
                  </>
                )}
              </div>
              <div className="ms-auto d-flex align-items-center gap-3">
                <span className="fw-bold fs-6">{fmtBrl(summary.monthlyAmount)}<span className="text-muted fw-normal" style={{ fontSize: 12 }}>/mês</span></span>
                <Button variant="link" size="sm" className="p-0 text-danger" onClick={handleCancel}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {!loading && summary?.status === 'PAST_DUE' && (
            <Alert variant="warning" className="d-flex align-items-center gap-2 mb-4">
              <AlertTriangle size={16} /> Pagamento pendente — finalize a renovação para continuar criando agentes.
            </Alert>
          )}

          {!loading && (!summary || summary.agentSlots === 0) && (
            <div className="d-flex align-items-center gap-2 mb-4 p-3 rounded-3"
              style={{ background: 'var(--bs-tertiary-bg)', border: '1px solid var(--bs-border-color)', fontSize: 13 }}>
              <AlertTriangle size={14} color="#f59e0b" />
              <span className="text-muted">Sem vagas contratadas — contrate abaixo para criar seu primeiro agente.</span>
            </div>
          )}

          {/* Seletor de quantidade + card 5+ */}
          {loading ? (
            <div className="text-center py-5 text-muted small">
              <Spinner size="sm" className="me-2" />Carregando...
            </div>
          ) : (
            <Row className="g-4 mb-5 align-items-stretch">
              <Col md={6}>
                <Card className="h-100" style={{ borderRadius: 16 }}>
                  <Card.Body className="p-4 d-flex flex-column">
                    <div className="fw-bold mb-1" style={{ fontSize: 18 }}>1 a 4 agentes</div>
                    <p className="text-muted small mb-4">R$ {PRICE_PER_SLOT}/mês por agente. Contrate agora.</p>

                    <div className="d-flex align-items-center gap-3 mb-4">
                      <Button variant="outline-secondary" className="btn-icon" style={{ borderRadius: 10 }}
                        disabled={quantity <= 1} onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                        <Minus size={14} />
                      </Button>
                      <span className="fw-bold fs-4" style={{ minWidth: 40, textAlign: 'center' }}>{quantity}</span>
                      <Button variant="outline-secondary" className="btn-icon" style={{ borderRadius: 10 }}
                        disabled={quantity >= MAX_SELF_SERVE_SLOTS} onClick={() => setQuantity(q => Math.min(MAX_SELF_SERVE_SLOTS, q + 1))}>
                        <Plus size={14} />
                      </Button>
                      <span className="ms-auto fw-bold fs-5">{fmtBrl(amountForQuantity)}<span className="text-muted fw-normal" style={{ fontSize: 13 }}>/mês</span></span>
                    </div>

                    <Button
                      className="w-100 fw-semibold mt-auto"
                      style={{ borderRadius: 10, background: '#6366f1', borderColor: '#6366f1' }}
                      onClick={() => setShowModal(true)}
                    >
                      Assinar {quantity} agente(s)
                    </Button>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6}>
                <Card className="h-100" style={{ borderRadius: 16, border: '1px solid var(--bs-border-color)' }}>
                  <Card.Body className="p-4 d-flex flex-column">
                    <div className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ fontSize: 18 }}>
                      <Layers size={18} className="text-primary" /> 5 ou mais agentes
                    </div>
                    <p className="text-muted small mb-4">
                      Para operações maiores, o preço é negociado com o nosso time conforme escala e necessidades.
                    </p>
                    <Button
                      className="w-100 fw-semibold mt-auto"
                      style={{ borderRadius: 10, background: 'transparent', border: '1px solid #6366f1', color: '#6366f1' }}
                      href="mailto:comercial@venorica.ai?subject=Quero%20contratar%205%2B%20agentes"
                      as="a"
                    >
                      <Mail size={14} className="me-2" /> Falar com vendas
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Histórico de pagamentos */}
          <Card className="card-border">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-0 fw-semibold">Histórico de pagamentos</h6>
                {ordersTotal > 0 && <small className="text-muted">{ordersTotal} pedido(s)</small>}
              </div>
              <Button variant="link" size="sm" className="p-0 text-muted" onClick={fetchOrders}>
                <RefreshCw size={13} />
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              {ordersLoading ? (
                <div className="text-center py-4 text-muted small">
                  <Spinner size="sm" className="me-2" />Carregando...
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-4 text-muted small">Nenhum pagamento ainda.</div>
              ) : (
                <Table hover size="sm" className="mb-0">
                  <thead style={{ backgroundColor: 'var(--bs-tertiary-bg)' }}>
                    <tr>
                      <th className="ps-3">Pedido</th>
                      <th>Data</th>
                      <th>Status</th>
                      <th className="text-end pe-3">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.orderId}>
                        <td className="ps-3">
                          <div className="fw-medium small">{order.metadata?.agentSlots ?? order.credits} agente(s)</div>
                          <div className="text-muted" style={{ fontSize: 11 }}>{order.orderId}</div>
                        </td>
                        <td className="small text-muted align-middle">{fmtDate(order.createdAt)}</td>
                        <td className="align-middle">
                          <Badge bg="light" text="dark" className="border">{order.status}</Badge>
                        </td>
                        <td className="text-end pe-3 align-middle fw-semibold">{fmtBrl(order.amountBrl)}</td>
                      </tr>
                    ))}
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
        agentSlots={quantity}
        amountBrl={amountForQuantity}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default BillingPage;
