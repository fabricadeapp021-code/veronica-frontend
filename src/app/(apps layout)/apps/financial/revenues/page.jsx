'use client';
import React, { useState, useEffect } from 'react';
import SimpleBar from 'simplebar-react';
import { Card, Col, Row, Badge, Alert, Spinner, Button, Modal, Form, InputGroup } from 'react-bootstrap';
import { TrendingUp, AlertTriangle, PlusCircle, Check, X, Trash2, Paperclip, FileText, Image, Zap } from 'react-feather';
import FinancialHeader from '../FinancialHeader';
import FinancialSidebar from '../FinancialSidebar';
import { listRevenues, createRevenue, confirmRevenue, cancelRevenue, deleteRevenue, getFinancialSummary, uploadFinancialFile, extractPreviewInvoiceNF } from '@/lib/api/services/financial';
import { TSEComplianceBadge, checkRevenueCompliance, REVENUE_TYPE_LABELS } from '@/components/tse-compliance/TSEComplianceBadge';

/** CPF (000.000.000-00) ou CNPJ (00.000.000/0001-00) conforme dígitos */
function maskCpfCnpj(value) {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 11) {
        return digits
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return digits
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

/** Formata valor monetário BR enquanto digita (ex: "1500" -> "1.500,00") */
function maskCurrency(value) {
    const digits = String(value).replace(/\D/g, '');
    if (!digits) return '';
    const num = parseInt(digits, 10);
    return (num / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Converte valor mascarado de volta para número (ex: "1.500,00" -> 1500) */
function parseCurrency(value) {
    return parseFloat(String(value).replace(/\./g, '').replace(',', '.')) || 0;
}

/** Valida formato de e-mail */
function isValidEmail(v) {
    return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// Tipos alinhados ao SPCE/TSE - Res. 23.607/2019 + 23.731/2024
const REVENUE_TYPES = [
    { value: 'donation', label: 'Doação - Pessoa Física', tseRequired: ['donor.cpfCnpj'] },
    { value: 'donation_pj', label: 'Doação - Pessoa Jurídica (Partido)', tseRequired: ['donor.cpfCnpj'] },
    { value: 'fefc', label: 'FEFC - Fundo Especial de Financiamento', tseRequired: [] },
    { value: 'fundo_partidario', label: 'Fundo Partidário', tseRequired: [] },
    { value: 'recursos_proprios', label: 'Recursos Próprios do Candidato', tseRequired: [] },
    { value: 'transfer', label: 'Transferência entre Contas', tseRequired: [] },
    { value: 'estimable', label: 'Doação Estimável (Bem ou Serviço)', tseRequired: [] },
    { value: 'event', label: 'Evento de Arrecadação', tseRequired: [] },
    { value: 'funding', label: 'Financiamento Coletivo', tseRequired: [] },
    { value: 'other', label: 'Outros', tseRequired: [] },
];

const PAYMENT_METHODS = [
    { value: 'pix', label: 'PIX' },
    { value: 'bank_transfer', label: 'Transferência Bancária' },
    { value: 'cash', label: 'Dinheiro' },
    { value: 'boleto', label: 'Boleto' },
    { value: 'check', label: 'Cheque' },
    { value: 'other', label: 'Outros' },
];

const TODAY = new Date().toISOString().split('T')[0];

const EMPTY_FORM = {
    type: 'donation',
    description: '',
    amount: '',
    date: TODAY,
    paymentMethod: 'pix',
    donorName: '',
    donorCpfCnpj: '',
    donorEmail: '',
    donorPhone: '',
    receiptNumber: '',
    notes: '',
};

const RevenuesBody = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [revenues, setRevenues] = useState([]);
    const [budgetId, setBudgetId] = useState(null);

    // Modal nova receita
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [receiptFile, setReceiptFile] = useState(null);
    const [extracting, setExtracting] = useState(false);
    const [extractConfidence, setExtractConfidence] = useState(null);

    // Modal cancelar
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancellingId, setCancellingId] = useState(null);
    const [cancelReason, setCancelReason] = useState('');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const summaryRes = await getFinancialSummary().catch(() => null);
            const activeBudgetId = (!summaryRes?.noBudget && summaryRes?.budgetId) ? summaryRes.budgetId : null;
            setBudgetId(activeBudgetId);
            const revRes = await listRevenues({
                ...(activeBudgetId ? { budgetId: activeBudgetId } : {}),
                limit: 100,
                sortBy: 'date',
                sortOrder: 'desc',
            });
            setRevenues(revRes.data || []);
        } catch (err) {
            setError(err.message || 'Erro ao carregar receitas');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!budgetId) { setError('Nenhum orçamento ativo. Crie um orçamento primeiro no overview.'); return; }
        try {
            setSaving(true);

            // Upload do comprovante se houver
            let receiptFileUrl = null;
            if (receiptFile) {
                const uploaded = await uploadFinancialFile(receiptFile, 'financial-receipts');
                receiptFileUrl = uploaded?.url || null;
            }

            await createRevenue({
                budgetId,
                type: form.type,
                description: form.description,
                amount: parseCurrency(form.amount),
                date: form.date,
                paymentMethod: form.paymentMethod,
                donor: form.donorName ? {
                    name: form.donorName,
                    cpfCnpj: form.donorCpfCnpj || undefined,
                    email: form.donorEmail || undefined,
                    phone: form.donorPhone || undefined,
                } : undefined,
                receiptNumber: form.receiptNumber || undefined,
                receiptFileUrl: receiptFileUrl || undefined,
                notes: form.notes || undefined,
            });
            setShowModal(false);
            setForm(EMPTY_FORM);
            setReceiptFile(null);
            setSuccess('Receita registrada com sucesso!');
            await loadData();
        } catch (err) {
            setError(err.message || 'Erro ao registrar receita');
        } finally {
            setSaving(false);
        }
    };

    const handleConfirm = async (id) => {
        try {
            await confirmRevenue(id, {});
            setSuccess('Receita confirmada!');
            await loadData();
        } catch (err) { setError(err.message || 'Erro ao confirmar'); }
    };

    const handleCancelConfirm = async () => {
        if (!cancelReason.trim()) { setError('Informe o motivo do cancelamento'); return; }
        try {
            await cancelRevenue(cancellingId, { cancellationReason: cancelReason });
            setShowCancelModal(false);
            setCancelReason('');
            setCancellingId(null);
            setSuccess('Receita cancelada.');
            await loadData();
        } catch (err) { setError(err.message || 'Erro ao cancelar'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja excluir esta receita?')) return;
        try {
            await deleteRevenue(id);
            setSuccess('Receita excluída.');
            await loadData();
        } catch (err) { setError(err.message || 'Erro ao excluir'); }
    };

    const handleExtract = async () => {
        if (!receiptFile) { setError('Selecione um arquivo antes de extrair.'); return; }
        try {
            setExtracting(true);
            setExtractConfidence(null);
            setError(null);
            const result = await extractPreviewInvoiceNF(receiptFile);
            const f = result?.fields || {};
            setForm(p => ({
                ...p,
                amount:      f.amount != null ? maskCurrency(String(Math.round(f.amount * 100))) : p.amount,
                date:        f.issueDate ? f.issueDate.split('T')[0] : p.date,
                description: f.description || p.description,
            }));
            setExtractConfidence(result?.confidence ?? null);
        } catch (err) {
            setError(err.message || 'Erro na extração com IA. Verifique o arquivo.');
        } finally {
            setExtracting(false);
        }
    };

    const formatCurrency = (v) => {
        const num = (typeof v === 'number' && !isNaN(v)) ? v : (parseFloat(v) || 0);
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
    };

    const statusBadge = { pending: { bg: 'warning', text: 'Pendente' }, confirmed: { bg: 'success', text: 'Confirmado' }, cancelled: { bg: 'danger', text: 'Cancelado' } };
    const typeLabel = { donation: 'Doação', transfer: 'Transferência', event: 'Evento', funding: 'Financiamento', other: 'Outros' };

    const totalRevenues = revenues.reduce((s, r) => s + (r.amount || 0), 0);
    const pending = revenues.filter(r => r.status === 'pending').length;
    const confirmed = revenues.filter(r => r.status === 'confirmed').length;

    if (loading) return (
        <div className="fm-body"><SimpleBar className="nicescroll-bar">
            <div className="container-fluid px-4 py-5 text-center">
                <Spinner animation="border" variant="success" />
                <p className="mt-3 text-muted">Carregando receitas...</p>
            </div>
        </SimpleBar></div>
    );

    return (
        <div className="fm-body">
            <SimpleBar className="nicescroll-bar">
                <div className="container-fluid px-4 py-4 financial-revenues-darkfix">
                    <style>{`
                        [data-bs-theme="dark"] .financial-revenues-modal .modal-content {
                            background-color: #1e2130 !important;
                            border-color: #2a2f3d !important;
                            color: #dde3ef !important;
                        }
                        [data-bs-theme="dark"] .financial-revenues-modal .modal-header,
                        [data-bs-theme="dark"] .financial-revenues-modal .modal-footer {
                            background-color: #252a3a !important;
                            border-color: #2a2f3d !important;
                        }
                        [data-bs-theme="dark"] .financial-revenues-modal .modal-header .modal-title,
                        [data-bs-theme="dark"] .financial-revenues-modal .modal-header .modal-title * {
                            color: #f3f6fd !important;
                            opacity: 1 !important;
                            text-shadow: none !important;
                        }
                        [data-bs-theme="dark"] .financial-revenues-modal .modal-body,
                        [data-bs-theme="dark"] .financial-revenues-modal .modal-body .form-label {
                            color: #dde3ef !important;
                        }
                        [data-bs-theme="dark"] .financial-revenues-modal .modal-body .form-control,
                        [data-bs-theme="dark"] .financial-revenues-modal .modal-body .form-select,
                        [data-bs-theme="dark"] .financial-revenues-modal .modal-body .input-group-text {
                            background-color: #2a3042 !important;
                            border-color: #3a4054 !important;
                            color: #dde3ef !important;
                        }
                        [data-bs-theme="dark"] .financial-revenues-modal .modal-body .form-control::placeholder {
                            color: #8f98b2 !important;
                            opacity: 1 !important;
                        }
                        [data-bs-theme="dark"] .financial-revenues-modal .modal-body .text-muted,
                        [data-bs-theme="dark"] .financial-revenues-modal .modal-body small.text-muted,
                        [data-bs-theme="dark"] .financial-revenues-modal .modal-body .form-text {
                            color: #aeb7cf !important;
                        }
                        [data-bs-theme="dark"] .financial-revenues-modal .modal-body .bg-light {
                            background-color: #252a3a !important;
                            border-color: #3a4054 !important;
                            color: #dde3ef !important;
                        }
                        [data-bs-theme="dark"] .financial-revenues-modal .modal-body input[type="file"]::file-selector-button {
                            background: #f8f9fa;
                            color: #212529;
                            border: 0;
                            margin-right: 12px;
                            padding: 0.375rem 0.75rem;
                        }
                    `}</style>

                    {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}
                    {error && <Alert variant="danger" dismissible onClose={() => setError(null)}><AlertTriangle size={16} className="me-2" />{error}</Alert>}

                    {/* KPIs */}
                    <Row className="mb-4 gx-3">
                        <Col md={3} sm={6} className="mb-3">
                            <Card className="card-border">
                                <Card.Body>
                                    <div className="text-muted small">Total de Receitas</div>
                                    <div className="h4 text-success mb-0">{formatCurrency(totalRevenues)}</div>
                                    <small className="text-muted">{revenues.length} registrada(s)</small>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3} sm={6} className="mb-3">
                            <Card className="card-border">
                                <Card.Body>
                                    <div className="text-muted small">Pendentes de Confirmação</div>
                                    <div className="h4 text-warning mb-0">{pending}</div>
                                    <small className="text-muted">pendente(s)</small>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3} sm={6} className="mb-3">
                            <Card className="card-border">
                                <Card.Body>
                                    <div className="text-muted small">Confirmadas</div>
                                    <div className="h4 text-success mb-0">{confirmed}</div>
                                    <small className="text-muted">confirmada(s)</small>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Tabela */}
                    <Card className="card-border">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <h5 className="mb-0"><TrendingUp size={18} className="me-2" />Receitas</h5>
                            <Button variant="primary" size="sm" onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }}>
                                <PlusCircle size={14} className="me-1" />Nova Receita
                            </Button>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {revenues.length === 0 ? (
                                <div className="text-center py-5">
                                    <TrendingUp size={40} className="text-muted mb-3" />
                                    <p className="text-muted mb-3">Nenhuma receita registrada ainda.</p>
                                    <Button variant="primary" onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }}>
                                        <PlusCircle size={14} className="me-1" />Registrar Primeira Receita
                                    </Button>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead>
                                            <tr>
                                                <th>Data</th>
                                                <th>Tipo TSE</th>
                                                <th>Doador / Origem</th>
                                                <th>CPF/CNPJ</th>
                                                <th className="text-end">Valor</th>
                                                <th>Status</th>
                                                <th title="Conformidade com Res. TSE 23.607/2019">TSE</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {revenues.map((rev) => {
                                                const sb = statusBadge[rev.status] || statusBadge.pending;
                                                const tseResult = checkRevenueCompliance({ ...rev, date: rev.date });
                                                return (
                                                    <tr key={rev._id}>
                                                        <td className="text-nowrap">{new Date(rev.date).toLocaleDateString('pt-BR')}</td>
                                                        <td>
                                                            <Badge bg="primary">{REVENUE_TYPE_LABELS[rev.type] || typeLabel[rev.type] || rev.type}</Badge>
                                                        </td>
                                                        <td>
                                                            <div>{rev.donor?.name || rev.description}</div>
                                                            <div className="d-flex align-items-center gap-2 mt-1">
                                                                {rev.receiptNumber && <small className="text-muted">Recibo: {rev.receiptNumber}</small>}
                                                                {rev.electoralReceiptNumber && <small className="text-success">REC: {rev.electoralReceiptNumber}</small>}
                                                                {rev.receiptFileUrl && (
                                                                    <a href={rev.receiptFileUrl} target="_blank" rel="noopener noreferrer" className="text-success" title="Ver comprovante">
                                                                        <Paperclip size={13} />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td><small className="text-muted">{rev.donor?.cpfCnpj || '-'}</small></td>
                                                        <td className="text-end"><strong className="text-success">{formatCurrency(rev.amount)}</strong></td>
                                                        <td><Badge bg={sb.bg}>{sb.text}</Badge></td>
                                                        <td><TSEComplianceBadge result={tseResult} /></td>
                                                        <td>
                                                            <div className="d-flex gap-1 flex-nowrap">
                                                                {rev.status === 'pending' && (
                                                                    <>
                                                                        <Button size="sm" variant="outline-success" title="Confirmar" onClick={() => handleConfirm(rev._id)}>
                                                                            <Check size={13} />
                                                                        </Button>
                                                                        <Button size="sm" variant="outline-danger" title="Cancelar" onClick={() => { setCancellingId(rev._id); setCancelReason(''); setShowCancelModal(true); }}>
                                                                            <X size={13} />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                                {['pending', 'cancelled'].includes(rev.status) && (
                                                                    <Button size="sm" variant="outline-secondary" title="Excluir" onClick={() => handleDelete(rev._id)}>
                                                                        <Trash2 size={13} />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </div>
            </SimpleBar>

            {/* Modal Nova Receita */}
            <Modal className="financial-revenues-modal" show={showModal} onHide={() => { setShowModal(false); setReceiptFile(null); }} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title><TrendingUp size={18} className="me-2" />Nova Receita</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        {error && (
                            <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3">
                                <AlertTriangle size={15} className="me-2" />{error}
                            </Alert>
                        )}
                        <Row className="gx-3">
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Tipo <span className="text-danger">*</span></Form.Label>
                                    <Form.Select required value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                                        {REVENUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Data <span className="text-danger">*</span></Form.Label>
                                    <Form.Control required type="date" max={TODAY} value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Descrição <span className="text-danger">*</span></Form.Label>
                                    <Form.Control required placeholder="Ex: Receita de frete referente a março" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Valor (R$) <span className="text-danger">*</span></Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text>R$</InputGroup.Text>
                                        <Form.Control
                                            required
                                            placeholder="0,00"
                                            value={form.amount}
                                            onChange={e => setForm(p => ({ ...p, amount: maskCurrency(e.target.value) }))}
                                            inputMode="numeric"
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Forma de Pagamento <span className="text-danger">*</span></Form.Label>
                                    <Form.Select required value={form.paymentMethod} onChange={e => setForm(p => ({ ...p, paymentMethod: e.target.value }))}>
                                        {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={12}>
                                <hr className="my-2" />
                                <p className="fw-semibold small mb-2">Dados da origem da receita</p>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        Nome
                                    </Form.Label>
                                    <Form.Control
                                        required={false}
                                        placeholder="Nome completo"
                                        value={form.donorName}
                                        onChange={e => setForm(p => ({ ...p, donorName: e.target.value }))}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        CPF / CNPJ
                                    </Form.Label>
                                    <Form.Control
                                        required={false}
                                        placeholder={form.type === 'donation_pj' ? '00.000.000/0001-00' : '000.000.000-00'}
                                        value={form.donorCpfCnpj}
                                        onChange={e => setForm(p => ({ ...p, donorCpfCnpj: maskCpfCnpj(e.target.value) }))}
                                        maxLength={18}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>E-mail</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="email@exemplo.com"
                                        value={form.donorEmail}
                                        onChange={e => setForm(p => ({ ...p, donorEmail: e.target.value }))}
                                        isInvalid={form.donorEmail !== '' && !isValidEmail(form.donorEmail)}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Formato inválido - ex: nome@dominio.com
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Número do Recibo</Form.Label>
                                    <Form.Control placeholder="REC-001" value={form.receiptNumber} onChange={e => setForm(p => ({ ...p, receiptNumber: e.target.value }))} />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <div className="d-flex align-items-center justify-content-between mb-1">
                                        <Form.Label className="mb-0">
                                            <Paperclip size={14} className="me-1" />
                                            Anexo do Comprovante
                                            <small className="text-muted ms-2">(PDF, imagem - opcional)</small>
                                        </Form.Label>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline-primary"
                                            disabled={!receiptFile || extracting}
                                            onClick={handleExtract}
                                            title="Extrair campos automaticamente com IA"
                                        >
                                            {extracting
                                                ? <><Spinner size="sm" className="me-1" />Extraindo...</>
                                                : <><Zap size={13} className="me-1" />Extrair com IA</>
                                            }
                                        </Button>
                                    </div>
                                    <Form.Control
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                                        onChange={e => { setReceiptFile(e.target.files?.[0] || null); setExtractConfidence(null); }}
                                    />
                                    {receiptFile && (
                                        <div className="d-flex align-items-center gap-2 mt-2 p-2 rounded border bg-light">
                                            {receiptFile.type.startsWith('image/') ? <Image size={16} className="text-primary" /> : <FileText size={16} className="text-danger" />}
                                            <span className="small text-truncate flex-grow-1">{receiptFile.name}</span>
                                            <span className="small text-muted text-nowrap">({(receiptFile.size / 1024).toFixed(0)} KB)</span>
                                            <button type="button" className="btn-close btn-sm" style={{ fontSize: '0.6rem' }} onClick={() => { setReceiptFile(null); setExtractConfidence(null); }} />
                                        </div>
                                    )}
                                    {extractConfidence != null && (
                                        <div className="mt-2">
                                            <Badge bg={extractConfidence >= 0.8 ? 'success' : extractConfidence >= 0.5 ? 'warning' : 'danger'}>
                                                <Zap size={11} className="me-1" />
                                                IA - confiança {Math.round(extractConfidence * 100)}%
                                            </Badge>
                                            <small className="text-muted ms-2">Campos preenchidos automaticamente. Revise antes de salvar.</small>
                                        </div>
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Observações</Form.Label>
                                    <Form.Control as="textarea" rows={2} placeholder="Informações adicionais..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancelar</Button>
                        <Button variant="primary" type="submit" disabled={saving}>
                            {saving ? <><Spinner size="sm" className="me-2" />Salvando...</> : 'Registrar Receita'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Modal Cancelar */}
            <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
                <Modal.Header closeButton><Modal.Title>Cancelar Receita</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Motivo do cancelamento <span className="text-danger">*</span></Form.Label>
                        <Form.Control as="textarea" rows={3} placeholder="Descreva o motivo..." value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCancelModal(false)}>Voltar</Button>
                    <Button variant="danger" onClick={handleCancelConfirm}>Cancelar Receita</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

const Revenues = () => {
    const [showSidebar, setShowSidebar] = React.useState(true);
    return (
        <div className="hk-pg-body py-0">
            <div className={`fmapp-wrap ${!showSidebar ? 'fmapp-sidebar-toggle' : ''}`}>
                <FinancialSidebar />
                <div className="fmapp-content">
                    <div className="fmapp-detail-wrap">
                        <FinancialHeader showSidebar={showSidebar} toggleSidebar={() => setShowSidebar(!showSidebar)} />
                        <RevenuesBody />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Revenues;


