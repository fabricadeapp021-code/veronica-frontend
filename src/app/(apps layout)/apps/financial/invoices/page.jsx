'use client';
import React, { useState, useEffect } from 'react';
import SimpleBar from 'simplebar-react';
import { Card, Col, Row, Badge, Button, Form, Alert, Modal, Spinner, ProgressBar } from 'react-bootstrap';
import { Upload, FileText, Check, X, Eye, Trash2, AlertCircle, Link, Paperclip, Image } from 'react-feather';
import FinancialHeader from '../FinancialHeader';
import FinancialSidebar from '../FinancialSidebar';
import {
    uploadInvoiceNF,
    extractPreviewInvoiceNF,
    uploadAndExtractInvoiceNF,
    listInvoicesNF,
    getInvoiceNFStats,
    validateInvoiceNF,
    rejectInvoiceNF,
    deleteInvoiceNF,
    updateInvoiceNF,
    listExpenses,
    linkExpenseToInvoiceNF,
    getFinancialSummary,
} from '@/lib/api/services/financial';

const EXPENSE_CATEGORIES = [
    { name: 'Combustível',         code: '01' },
    { name: 'Manutenção',          code: '02' },
    { name: 'Pedágios / Viagens',  code: '03' },
    { name: 'Pneus / Acessórios',  code: '04' },
    { name: 'Serviços Terceiros',  code: '05' },
    { name: 'Seguros',             code: '06' },
    { name: 'Salários / RH',       code: '07' },
    { name: 'Outras Despesas',     code: '08' },
];

const EMPTY_UPLOAD_FORM = {
    number:       '',
    supplier:     '',
    supplierCnpj: '',
    amount:       '',
    issueDate:    new Date().toISOString().split('T')[0],
    categoryCode: '',
    categoryName: '',
    description:  '',
    notes:        '',
};

const STATUS_MAP = {
    pending:   { bg: 'warning',   text: 'Pendente'  },
    validated: { bg: 'success',   text: 'Validada'  },
    rejected:  { bg: 'danger',    text: 'Rejeitada' },
    linked:    { bg: 'primary',   text: 'Vinculada' },
};

const InvoicesBody = () => {
    const [loading,   setLoading]   = useState(true);
    const [error,     setError]     = useState(null);
    const [success,   setSuccess]   = useState(null);
    const [invoices,  setInvoices]  = useState([]);
    const [stats,     setStats]     = useState({ total: 0, pending: 0, validated: 0, rejected: 0, linked: 0 });
    const [budgetId,  setBudgetId]  = useState(null);

    // Modal upload
    const [showUpload,       setShowUpload]       = useState(false);
    const [uploading,        setUploading]        = useState(false);
    const [uploadFile,       setUploadFile]       = useState(null);
    const [uploadForm,       setUploadForm]       = useState(EMPTY_UPLOAD_FORM);
    // 0=seleção, 1=IA analisando, 2=revisão campos, 3=salvando
    const [uploadStep,       setUploadStep]       = useState(0);
    const [useAI,            setUseAI]            = useState(true);
    const [aiPreview,        setAiPreview]        = useState(null);   // { fields, confidence, camposNaoLidos, warnings }
    const [reviewForm,       setReviewForm]       = useState(EMPTY_UPLOAD_FORM);

    const REQUIRED_FIELDS = ['supplier', 'amount', 'issueDate', 'categoryCode'];
    const FIELD_LABELS = { supplier: 'Fornecedor', amount: 'Valor', issueDate: 'Data de Emissão', categoryCode: 'Categoria' };

    const reviewIsValid = REQUIRED_FIELDS.every(f => reviewForm[f] !== '' && reviewForm[f] != null);

    const resetUploadModal = () => {
        setShowUpload(false);
        setUploadFile(null);
        setUploadForm(EMPTY_UPLOAD_FORM);
        setReviewForm(EMPTY_UPLOAD_FORM);
        setAiPreview(null);
        setUploadStep(0);
        setUploading(false);
    };

    // Modal detalhe / edição
    const [showDetail,    setShowDetail]    = useState(false);
    const [detailInvoice, setDetailInvoice] = useState(null);
    const [editMode,      setEditMode]      = useState(false);
    const [editForm,      setEditForm]      = useState({});
    const [saving,        setSaving]        = useState(false);

    // Modal rejeitar
    const [showReject,    setShowReject]    = useState(false);
    const [rejectingId,   setRejectingId]   = useState(null);
    const [rejectReason,  setRejectReason]  = useState('');

    // Modal vincular despesa
    const [showLink,      setShowLink]      = useState(false);
    const [linkingId,     setLinkingId]     = useState(null);
    const [expenses,      setExpenses]      = useState([]);
    const [selectedExpId, setSelectedExpId] = useState('');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [listRes, statsRes, summaryRes] = await Promise.all([
                listInvoicesNF({ limit: 100 }),
                getInvoiceNFStats().catch(() => ({ total: 0, pending: 0, validated: 0, rejected: 0, linked: 0 })),
                getFinancialSummary().catch(() => null),
            ]);
            setInvoices(listRes.data || []);
            setStats(statsRes || {});
            if (summaryRes?.budgetId) setBudgetId(summaryRes.budgetId);
        } catch (err) {
            setError(err.message || 'Erro ao carregar notas fiscais');
        } finally {
            setLoading(false);
        }
    };

    // Etapa 0→1→2: seleciona arquivo, IA analisa, formulário de revisão
    const handleExtractWithAI = async (e) => {
        e.preventDefault();
        if (!uploadFile) { setError('Selecione um arquivo'); return; }
        try {
            setUploadStep(1);
            const preview = await extractPreviewInvoiceNF(uploadFile);
            setAiPreview(preview);
            // Pré-preenche o form de revisão com o que a IA conseguiu ler
            setReviewForm({
                number:       preview.fields.number       || '',
                supplier:     preview.fields.supplier     || '',
                supplierCnpj: preview.fields.supplierCnpj || '',
                amount:       preview.fields.amount != null ? String(preview.fields.amount) : '',
                issueDate:    preview.fields.issueDate    || new Date().toISOString().split('T')[0],
                categoryCode: preview.fields.categoryCode || '',
                categoryName: '',
                description:  preview.fields.description  || '',
                notes:        '',
            });
            setUploadStep(2);
        } catch (err) {
            setError(err.message || 'Erro na extração com IA');
            setUploadStep(0);
        }
    };

    // Etapa 2→3: usuário confirmou, salvar de vez
    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!reviewIsValid) return;
        try {
            setUploadStep(3);
            setUploading(true);
            const cat = EXPENSE_CATEGORIES.find(c => c.code === reviewForm.categoryCode);
            await uploadInvoiceNF(uploadFile, {
                budgetId:     budgetId || undefined,
                number:       reviewForm.number       || undefined,
                supplier:     reviewForm.supplier,
                supplierCnpj: reviewForm.supplierCnpj || undefined,
                amount:       parseFloat(reviewForm.amount),
                issueDate:    reviewForm.issueDate,
                categoryCode: reviewForm.categoryCode,
                categoryName: cat?.name || undefined,
                description:  reviewForm.description  || undefined,
                notes:        reviewForm.notes        || undefined,
            });
            resetUploadModal();
            setSuccess('✅ Nota fiscal salva com sucesso!');
            await loadData();
        } catch (err) {
            setError(err.message || 'Erro ao salvar');
            setUploadStep(2);
        } finally {
            setUploading(false);
        }
    };

    // Fluxo manual (sem IA)
    const handleUploadManual = async (e) => {
        e.preventDefault();
        if (!uploadFile) { setError('Selecione um arquivo'); return; }
        try {
            setUploadStep(3);
            setUploading(true);
            const cat = EXPENSE_CATEGORIES.find(c => c.code === uploadForm.categoryCode);
            await uploadInvoiceNF(uploadFile, {
                budgetId:     budgetId || undefined,
                number:       uploadForm.number       || undefined,
                supplier:     uploadForm.supplier     || undefined,
                supplierCnpj: uploadForm.supplierCnpj || undefined,
                amount:       uploadForm.amount ? parseFloat(uploadForm.amount) : undefined,
                issueDate:    uploadForm.issueDate    || undefined,
                categoryCode: uploadForm.categoryCode || undefined,
                categoryName: cat?.name || undefined,
                description:  uploadForm.description  || undefined,
                notes:        uploadForm.notes        || undefined,
            });
            resetUploadModal();
            setSuccess('Nota fiscal enviada com sucesso!');
            await loadData();
        } catch (err) {
            setError(err.message || 'Erro ao fazer upload');
            setUploadStep(0);
        } finally {
            setUploading(false);
        }
    };

    const handleValidate = async (id) => {
        try {
            await validateInvoiceNF(id, {});
            setSuccess('Nota fiscal validada!');
            if (detailInvoice?._id === id) setShowDetail(false);
            await loadData();
        } catch (err) { setError(err.message || 'Erro ao validar'); }
    };

    const handleRejectConfirm = async () => {
        if (!rejectReason.trim()) { setError('Informe o motivo'); return; }
        try {
            await rejectInvoiceNF(rejectingId, { rejectionReason: rejectReason });
            setShowReject(false);
            setRejectReason('');
            setRejectingId(null);
            setSuccess('Nota fiscal rejeitada.');
            if (detailInvoice?._id === rejectingId) setShowDetail(false);
            await loadData();
        } catch (err) { setError(err.message || 'Erro ao rejeitar'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Excluir esta nota fiscal?')) return;
        try {
            await deleteInvoiceNF(id);
            setSuccess('Nota fiscal excluída.');
            if (detailInvoice?._id === id) setShowDetail(false);
            await loadData();
        } catch (err) { setError(err.message || 'Erro ao excluir'); }
    };

    const handleSaveEdit = async () => {
        try {
            setSaving(true);
            const cat = EXPENSE_CATEGORIES.find(c => c.code === editForm.categoryCode);
            await updateInvoiceNF(detailInvoice._id, {
                ...editForm,
                categoryName: cat?.name || editForm.categoryName,
                amount: editForm.amount ? parseFloat(editForm.amount) : undefined,
            });
            setEditMode(false);
            setSuccess('Dados atualizados!');
            await loadData();
            // Atualiza o detalhe com os novos dados
            const updated = await listInvoicesNF({ limit: 100 });
            const fresh = (updated.data || []).find(i => i._id === detailInvoice._id);
            if (fresh) setDetailInvoice(fresh);
        } catch (err) { setError(err.message || 'Erro ao salvar'); }
        finally { setSaving(false); }
    };

    const openDetail = (invoice) => {
        setDetailInvoice(invoice);
        setEditForm({
            number:       invoice.number       || '',
            supplier:     invoice.supplier     || '',
            supplierCnpj: invoice.supplierCnpj || '',
            amount:       invoice.amount       || '',
            issueDate:    invoice.issueDate    ? invoice.issueDate.split('T')[0] : '',
            categoryCode: invoice.categoryCode || '',
            description:  invoice.description  || '',
            notes:        invoice.notes         || '',
        });
        setEditMode(false);
        setShowDetail(true);
    };

    const openLink = async (id) => {
        setLinkingId(id);
        setSelectedExpId('');
        try {
            const res = await listExpenses({ budgetId: budgetId || undefined, limit: 100 });
            setExpenses(res.data || []);
        } catch { setExpenses([]); }
        setShowLink(true);
    };

    const handleLinkConfirm = async () => {
        if (!selectedExpId) { setError('Selecione uma despesa'); return; }
        try {
            await linkExpenseToInvoiceNF(linkingId, selectedExpId);
            setShowLink(false);
            setSuccess('NF vinculada à despesa!');
            await loadData();
        } catch (err) { setError(err.message || 'Erro ao vincular'); }
    };

    const formatCurrency = (v) => {
        const n = (typeof v === 'number' && !isNaN(v)) ? v : (parseFloat(v) || 0);
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
    };

    const isImage = (mime) => mime?.startsWith('image/');

    if (loading) return (
        <div className="fm-body"><SimpleBar className="nicescroll-bar">
            <div className="container-fluid px-4 py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Carregando notas fiscais...</p>
            </div>
        </SimpleBar></div>
    );

    return (
        <div className="fm-body">
            <SimpleBar className="nicescroll-bar">
                <div className="container-fluid px-4 py-4">

                    {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}
                    {error   && <Alert variant="danger"  dismissible onClose={() => setError(null)}><AlertCircle size={16} className="me-2" />{error}</Alert>}

                    {/* KPIs */}
                    <Row className="mb-4 gx-3">
                        {[
                            { label: 'Total de NFs',  value: stats.total,     color: '',        sub: 'registradas'   },
                            { label: 'Pendentes',     value: stats.pending,   color: 'warning', sub: 'aguardando'    },
                            { label: 'Validadas',     value: stats.validated, color: 'success', sub: 'aprovadas'     },
                            { label: 'Vinculadas',    value: stats.linked,    color: 'primary', sub: 'com despesa'   },
                        ].map((kpi) => (
                            <Col md={3} sm={6} key={kpi.label} className="mb-3">
                                <Card className="card-border">
                                    <Card.Body>
                                        <div className="text-muted small">{kpi.label}</div>
                                        <div className={`h3 mb-0${kpi.color ? ` text-${kpi.color}` : ''}`}>{kpi.value ?? 0}</div>
                                        <small className="text-muted">{kpi.sub}</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    {/* Alerta pendentes */}
                    {stats.pending > 0 && (
                        <Alert variant="warning" className="mb-4">
                            <AlertCircle size={16} className="me-2" />
                            <strong>Atenção!</strong> {stats.pending} nota(s) fiscal(is) aguardando validação.
                        </Alert>
                    )}

                    {/* Tabela */}
                    <Card className="card-border">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <h5 className="mb-0"><FileText size={18} className="me-2" />Notas Fiscais</h5>
                            <Button variant="primary" size="sm" onClick={() => { setUploadForm(EMPTY_UPLOAD_FORM); setUploadFile(null); setUploadStep(0); setShowUpload(true); }}>
                                <Upload size={14} className="me-1" />Upload de NF
                            </Button>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {invoices.length === 0 ? (
                                <div className="text-center py-5">
                                    <FileText size={40} className="text-muted mb-3" />
                                    <p className="text-muted mb-3">Nenhuma nota fiscal registrada ainda.</p>
                                    <Button variant="primary" onClick={() => setShowUpload(true)}>
                                        <Upload size={14} className="me-1" />Fazer Primeiro Upload
                                    </Button>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead>
                                            <tr>
                                                <th>Arquivo</th>
                                                <th>Número</th>
                                                <th>Fornecedor</th>
                                                <th>Categoria</th>
                                                <th className="text-end">Valor</th>
                                                <th>Status</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoices.map((inv) => {
                                                const sb = STATUS_MAP[inv.status] || STATUS_MAP.pending;
                                                return (
                                                    <tr key={inv._id}>
                                                        <td>
                                                            <a href={inv.fileUrl} target="_blank" rel="noopener noreferrer" title="Ver arquivo">
                                                                {isImage(inv.fileMimeType)
                                                                    ? <Image size={18} className="text-primary" />
                                                                    : <FileText size={18} className="text-danger" />}
                                                            </a>
                                                        </td>
                                                        <td>
                                                            <strong>{inv.number || <span className="text-muted">—</span>}</strong>
                                                            {inv.issueDate && <div><small className="text-muted">{new Date(inv.issueDate).toLocaleDateString('pt-BR')}</small></div>}
                                                        </td>
                                                        <td>
                                                            <div>{inv.supplier || <span className="text-muted">Não informado</span>}</div>
                                                            {inv.supplierCnpj && <small className="text-muted">{inv.supplierCnpj}</small>}
                                                        </td>
                                                        <td>
                                                            {inv.categoryName
                                                                ? <Badge bg="info">{inv.categoryName}</Badge>
                                                                : <span className="text-muted small">—</span>}
                                                        </td>
                                                        <td className="text-end">
                                                            {inv.amount
                                                                ? <strong>{formatCurrency(inv.amount)}</strong>
                                                                : <span className="text-muted">—</span>}
                                                        </td>
                                                        <td><Badge bg={sb.bg}>{sb.text}</Badge></td>
                                                        <td>
                                                            <div className="d-flex gap-1 flex-nowrap">
                                                                <Button size="sm" variant="outline-secondary" title="Ver detalhes" onClick={() => openDetail(inv)}>
                                                                    <Eye size={13} />
                                                                </Button>
                                                                {inv.status === 'pending' && (
                                                                    <>
                                                                        <Button size="sm" variant="outline-success" title="Validar" onClick={() => handleValidate(inv._id)}>
                                                                            <Check size={13} />
                                                                        </Button>
                                                                        <Button size="sm" variant="outline-danger" title="Rejeitar" onClick={() => { setRejectingId(inv._id); setRejectReason(''); setShowReject(true); }}>
                                                                            <X size={13} />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                                {inv.status === 'validated' && (
                                                                    <Button size="sm" variant="outline-primary" title="Vincular à Despesa" onClick={() => openLink(inv._id)}>
                                                                        <Link size={13} />
                                                                    </Button>
                                                                )}
                                                                {!['linked'].includes(inv.status) && (
                                                                    <Button size="sm" variant="outline-secondary" title="Excluir" onClick={() => handleDelete(inv._id)}>
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

            {/* ── Modal Upload ── */}
            <Modal show={showUpload} onHide={() => { if (uploadStep !== 1 && uploadStep !== 3) resetUploadModal(); }} size="lg" centered>
                <Modal.Header closeButton={uploadStep !== 1 && uploadStep !== 3}>
                    <Modal.Title>
                        <Upload size={18} className="me-2" />
                        {uploadStep === 0 && 'Upload de Nota Fiscal'}
                        {uploadStep === 1 && '🤖 Analisando com IA...'}
                        {uploadStep === 2 && 'Revisar e Confirmar Campos'}
                        {uploadStep === 3 && 'Salvando...'}
                    </Modal.Title>
                </Modal.Header>

                {/* ETAPA 0 — Seleção de arquivo */}
                {uploadStep === 0 && (
                    <Form onSubmit={useAI ? handleExtractWithAI : handleUploadManual}>
                        <Modal.Body>
                            {/* Toggle IA */}
                            <div className="d-flex align-items-center justify-content-between mb-3 p-3 rounded"
                                style={{ background: useAI ? '#eff6ff' : '#f8f9fa', border: `1px solid ${useAI ? '#bfdbfe' : '#dee2e6'}` }}>
                                <div>
                                    <span className="fw-semibold small">🤖 Upload de Nota Fiscal</span>
                                    <p className="text-muted small mb-0">
                                        {useAI
                                            ? 'Preencha os campos manualmente ou use o upload direto.'
                                            : 'Preencha os campos manualmente abaixo.'}
                                    </p>
                                </div>
                                <Form.Check type="switch" checked={useAI} onChange={e => setUseAI(e.target.checked)} className="ms-3" />
                            </div>

                            {/* Arquivo */}
                            <Form.Group className="mb-3">
                                <Form.Label><Paperclip size={14} className="me-1" />Arquivo <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="file" accept=".pdf,.jpg,.jpeg,.png,.xml" required
                                    onChange={e => setUploadFile(e.target.files?.[0] || null)} />
                                <Form.Text className="text-muted">PDF, imagem ou XML (NF-e)</Form.Text>
                                {uploadFile && (
                                    <div className="d-flex align-items-center gap-2 mt-2 p-2 rounded border bg-light">
                                        {uploadFile.type?.startsWith('image/') ? <Image size={16} className="text-primary" /> : <FileText size={16} className="text-danger" />}
                                        <span className="small text-truncate flex-grow-1">{uploadFile.name}</span>
                                        <span className="small text-muted">({(uploadFile.size / 1024).toFixed(0)} KB)</span>
                                    </div>
                                )}
                            </Form.Group>

                            {/* Campos manuais (só quando IA desligada) */}
                            {!useAI && <>
                                <hr className="my-3" />
                                <p className="fw-semibold small mb-3 text-muted">Dados da Nota Fiscal</p>
                                <Row className="gx-3">
                                    <Col md={6}><Form.Group className="mb-3"><Form.Label>Número da NF</Form.Label><Form.Control placeholder="NF-001234" value={uploadForm.number} onChange={e => setUploadForm(p => ({ ...p, number: e.target.value }))} /></Form.Group></Col>
                                    <Col md={6}><Form.Group className="mb-3"><Form.Label>Data de Emissão</Form.Label><Form.Control type="date" value={uploadForm.issueDate} onChange={e => setUploadForm(p => ({ ...p, issueDate: e.target.value }))} /></Form.Group></Col>
                                    <Col md={6}><Form.Group className="mb-3"><Form.Label>Fornecedor</Form.Label><Form.Control placeholder="Razão social" value={uploadForm.supplier} onChange={e => setUploadForm(p => ({ ...p, supplier: e.target.value }))} /></Form.Group></Col>
                                    <Col md={6}><Form.Group className="mb-3"><Form.Label>CNPJ</Form.Label><Form.Control placeholder="00.000.000/0001-00" value={uploadForm.supplierCnpj} onChange={e => setUploadForm(p => ({ ...p, supplierCnpj: e.target.value }))} /></Form.Group></Col>
                                    <Col md={6}><Form.Group className="mb-3"><Form.Label>Valor (R$)</Form.Label><Form.Control type="number" min="0.01" step="0.01" placeholder="0,00" value={uploadForm.amount} onChange={e => setUploadForm(p => ({ ...p, amount: e.target.value }))} /></Form.Group></Col>
                                    <Col md={6}><Form.Group className="mb-3"><Form.Label>Categoria</Form.Label><Form.Select value={uploadForm.categoryCode} onChange={e => setUploadForm(p => ({ ...p, categoryCode: e.target.value }))}><option value="">Selecione...</option>{EXPENSE_CATEGORIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}</Form.Select></Form.Group></Col>
                                    <Col md={12}><Form.Group className="mb-3"><Form.Label>Descrição</Form.Label><Form.Control placeholder="Ex: Gasolina" value={uploadForm.description} onChange={e => setUploadForm(p => ({ ...p, description: e.target.value }))} /></Form.Group></Col>
                                </Row>
                            </>}
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={resetUploadModal}>Cancelar</Button>
                            <Button variant="primary" type="submit" disabled={!uploadFile}>
                                {useAI ? <><span className="me-1">🤖</span>Analisar com IA</> : <><Upload size={14} className="me-1" />Enviar NF</>}
                            </Button>
                        </Modal.Footer>
                    </Form>
                )}

                {/* ETAPA 1 — Loading IA */}
                {uploadStep === 1 && (
                    <Modal.Body>
                        <div className="text-center py-4">
                            <Spinner animation="border" variant="primary" style={{ width: 48, height: 48 }} className="mb-3" />
                            <p className="fw-semibold mb-1">Analisando arquivo...</p>
                            <p className="text-muted small">Isso leva alguns segundos. Identificando campos automaticamente.</p>
                        </div>
                        <ProgressBar animated now={65} label="Extraindo campos..." />
                    </Modal.Body>
                )}

                {/* ETAPA 2 — Revisão dos campos extraídos */}
                {uploadStep === 2 && aiPreview && (
                    <Form onSubmit={handleReviewSubmit}>
                        <Modal.Body>
                            {/* Resumo da extração */}
                            <div className="mb-3 p-3 rounded" style={{ background: aiPreview.confidence >= 0.7 ? '#f0fdf4' : '#fffbeb', border: `1px solid ${aiPreview.confidence >= 0.7 ? '#86efac' : '#fde68a'}` }}>
                                <div className="d-flex align-items-center gap-2 mb-1">
                                    <span className="fw-semibold small">🤖 Extração concluída</span>
                                    <Badge bg={aiPreview.confidence >= 0.7 ? 'success' : 'warning'}>
                                        Confiança {Math.round(aiPreview.confidence * 100)}%
                                    </Badge>
                                </div>
                                {aiPreview.warnings?.length > 0 && (
                                    <ul className="mb-0 ps-3 small text-warning-emphasis">
                                        {aiPreview.warnings.map((w, i) => <li key={i}>{w}</li>)}
                                    </ul>
                                )}
                                {aiPreview.camposNaoLidos?.length > 0 && (
                                    <p className="mb-0 small text-muted mt-1">
                                        Campos não lidos pela IA (preencha abaixo): <strong>{aiPreview.camposNaoLidos.join(', ')}</strong>
                                    </p>
                                )}
                            </div>

                            <p className="small text-muted mb-3">
                                Revise os campos abaixo. Os <span className="text-danger fw-semibold">campos obrigatórios *</span> precisam estar preenchidos para salvar.
                            </p>

                            <Row className="gx-3">
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Número da NF</Form.Label>
                                        <Form.Control placeholder="NF-001234" value={reviewForm.number}
                                            onChange={e => setReviewForm(p => ({ ...p, number: e.target.value }))} />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Data de Emissão <span className="text-danger">*</span></Form.Label>
                                        <Form.Control type="date" required value={reviewForm.issueDate}
                                            onChange={e => setReviewForm(p => ({ ...p, issueDate: e.target.value }))}
                                            isInvalid={!reviewForm.issueDate} />
                                        <Form.Control.Feedback type="invalid">Obrigatório</Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Fornecedor <span className="text-danger">*</span></Form.Label>
                                        <Form.Control placeholder="Razão social" required value={reviewForm.supplier}
                                            onChange={e => setReviewForm(p => ({ ...p, supplier: e.target.value }))}
                                            isInvalid={!reviewForm.supplier}
                                            isValid={!!reviewForm.supplier && !!aiPreview.fields.supplier} />
                                        <Form.Control.Feedback type="invalid">Obrigatório</Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>CNPJ do Fornecedor</Form.Label>
                                        <Form.Control placeholder="00.000.000/0001-00" value={reviewForm.supplierCnpj}
                                            onChange={e => setReviewForm(p => ({ ...p, supplierCnpj: e.target.value }))}
                                            isValid={!!reviewForm.supplierCnpj && !!aiPreview.fields.supplierCnpj} />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Valor (R$) <span className="text-danger">*</span></Form.Label>
                                        <Form.Control type="number" min="0.01" step="0.01" placeholder="0,00" required
                                            value={reviewForm.amount}
                                            onChange={e => setReviewForm(p => ({ ...p, amount: e.target.value }))}
                                            isInvalid={!reviewForm.amount}
                                            isValid={!!reviewForm.amount && !!aiPreview.fields.amount} />
                                        <Form.Control.Feedback type="invalid">Obrigatório</Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Categoria <span className="text-danger">*</span></Form.Label>
                                        <Form.Select required value={reviewForm.categoryCode}
                                            onChange={e => setReviewForm(p => ({ ...p, categoryCode: e.target.value }))}
                                            isInvalid={!reviewForm.categoryCode}
                                            isValid={!!reviewForm.categoryCode && !!aiPreview.fields.categoryCode}>
                                            <option value="">Selecione...</option>
                                            {EXPENSE_CATEGORIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                                        </Form.Select>
                                        <Form.Control.Feedback type="invalid">Obrigatório</Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={12}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Descrição</Form.Label>
                                        <Form.Control placeholder="Ex: Gasolina"
                                            value={reviewForm.description}
                                            onChange={e => setReviewForm(p => ({ ...p, description: e.target.value }))} />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="outline-secondary" onClick={() => setUploadStep(0)}>← Voltar</Button>
                            <Button variant="success" type="submit" disabled={!reviewIsValid}>
                                <Check size={15} className="me-1" />
                                {reviewIsValid ? 'Salvar Nota Fiscal' : `Preencha: ${REQUIRED_FIELDS.filter(f => !reviewForm[f]).map(f => FIELD_LABELS[f]).join(', ')}`}
                            </Button>
                        </Modal.Footer>
                    </Form>
                )}

                {/* ETAPA 3 — Salvando */}
                {uploadStep === 3 && (
                    <Modal.Body>
                        <div className="text-center py-4">
                            <Spinner animation="border" variant="success" style={{ width: 48, height: 48 }} className="mb-3" />
                            <p className="fw-semibold mb-1">Salvando nota fiscal...</p>
                        </div>
                        <ProgressBar animated now={80} variant="success" label="Salvando..." />
                    </Modal.Body>
                )}
            </Modal>

            {/* ── Modal Detalhes / Edição ── */}
            <Modal show={showDetail} onHide={() => { setShowDetail(false); setEditMode(false); }} size="lg" centered>
                {detailInvoice && (
                    <>
                        <Modal.Header closeButton>
                            <Modal.Title>
                                <FileText size={18} className="me-2" />
                                NF {detailInvoice.number || 'Sem número'}
                                <Badge bg={STATUS_MAP[detailInvoice.status]?.bg || 'secondary'} className="ms-2 small">{STATUS_MAP[detailInvoice.status]?.text}</Badge>
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            {/* Preview do arquivo */}
                            <div className="d-flex align-items-center gap-3 mb-4 p-3 bg-light rounded border">
                                {isImage(detailInvoice.fileMimeType)
                                    ? <Image size={28} className="text-primary flex-shrink-0" />
                                    : <FileText size={28} className="text-danger flex-shrink-0" />}
                                <div className="flex-grow-1 min-w-0">
                                    <div className="fw-semibold text-truncate">{detailInvoice.fileName || 'Arquivo'}</div>
                                    <small className="text-muted">{detailInvoice.fileMimeType}</small>
                                </div>
                                <a href={detailInvoice.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary flex-shrink-0">
                                    <Eye size={14} className="me-1" />Abrir
                                </a>
                            </div>

                            {!editMode ? (
                                // ── Modo visualização ──
                                <Row className="gx-4">
                                    {[
                                        ['Número',     detailInvoice.number],
                                        ['Data Emissão', detailInvoice.issueDate ? new Date(detailInvoice.issueDate).toLocaleDateString('pt-BR') : null],
                                        ['Fornecedor', detailInvoice.supplier],
                                        ['CNPJ',       detailInvoice.supplierCnpj],
                                        ['Valor',      detailInvoice.amount ? formatCurrency(detailInvoice.amount) : null],
                                        ['Categoria',  detailInvoice.categoryName],
                                    ].map(([label, val]) => (
                                        <Col md={6} key={label} className="mb-3">
                                            <small className="text-muted d-block">{label}</small>
                                            <strong>{val || <span className="text-muted">Não informado</span>}</strong>
                                        </Col>
                                    ))}
                                    {detailInvoice.description && (
                                        <Col md={12} className="mb-3">
                                            <small className="text-muted d-block">Descrição</small>
                                            <span>{detailInvoice.description}</span>
                                        </Col>
                                    )}
                                    {detailInvoice.rejectionReason && (
                                        <Col md={12}>
                                            <Alert variant="danger" className="mb-0">
                                                <strong>Motivo da rejeição:</strong> {detailInvoice.rejectionReason}
                                            </Alert>
                                        </Col>
                                    )}
                                </Row>
                            ) : (
                                // ── Modo edição ──
                                <Row className="gx-3">
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Número da NF</Form.Label>
                                            <Form.Control value={editForm.number} onChange={e => setEditForm(p => ({ ...p, number: e.target.value }))} />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Data de Emissão</Form.Label>
                                            <Form.Control type="date" value={editForm.issueDate} onChange={e => setEditForm(p => ({ ...p, issueDate: e.target.value }))} />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Fornecedor</Form.Label>
                                            <Form.Control value={editForm.supplier} onChange={e => setEditForm(p => ({ ...p, supplier: e.target.value }))} />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>CNPJ</Form.Label>
                                            <Form.Control value={editForm.supplierCnpj} onChange={e => setEditForm(p => ({ ...p, supplierCnpj: e.target.value }))} />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Valor (R$)</Form.Label>
                                            <Form.Control type="number" step="0.01" value={editForm.amount} onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))} />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Categoria</Form.Label>
                                            <Form.Select value={editForm.categoryCode} onChange={e => setEditForm(p => ({ ...p, categoryCode: e.target.value }))}>
                                                <option value="">Selecione...</option>
                                                {EXPENSE_CATEGORIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={12}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Descrição</Form.Label>
                                            <Form.Control as="textarea" rows={2} value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            )}
                        </Modal.Body>
                        <Modal.Footer>
                            {!editMode ? (
                                <>
                                    <Button variant="secondary" onClick={() => setShowDetail(false)}>Fechar</Button>
                                    {detailInvoice.status !== 'linked' && (
                                        <Button variant="outline-primary" onClick={() => setEditMode(true)}>Editar Dados</Button>
                                    )}
                                    {detailInvoice.status === 'pending' && (
                                        <>
                                            <Button variant="danger" onClick={() => { setRejectingId(detailInvoice._id); setRejectReason(''); setShowReject(true); }}>
                                                <X size={14} className="me-1" />Rejeitar
                                            </Button>
                                            <Button variant="success" onClick={() => handleValidate(detailInvoice._id)}>
                                                <Check size={14} className="me-1" />Validar
                                            </Button>
                                        </>
                                    )}
                                    {detailInvoice.status === 'validated' && (
                                        <Button variant="primary" onClick={() => { setShowDetail(false); openLink(detailInvoice._id); }}>
                                            <Link size={14} className="me-1" />Vincular à Despesa
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <>
                                    <Button variant="secondary" onClick={() => setEditMode(false)} disabled={saving}>Cancelar</Button>
                                    <Button variant="primary" onClick={handleSaveEdit} disabled={saving}>
                                        {saving ? <><Spinner size="sm" className="me-1" />Salvando...</> : 'Salvar'}
                                    </Button>
                                </>
                            )}
                        </Modal.Footer>
                    </>
                )}
            </Modal>

            {/* ── Modal Rejeitar ── */}
            <Modal show={showReject} onHide={() => setShowReject(false)} centered>
                <Modal.Header closeButton><Modal.Title>Rejeitar Nota Fiscal</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Motivo <span className="text-danger">*</span></Form.Label>
                        <Form.Control as="textarea" rows={3} placeholder="Ex: Nota duplicada, dados incorretos..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowReject(false)}>Cancelar</Button>
                    <Button variant="danger" onClick={handleRejectConfirm}>Rejeitar</Button>
                </Modal.Footer>
            </Modal>

            {/* ── Modal Vincular Despesa ── */}
            <Modal show={showLink} onHide={() => setShowLink(false)} centered>
                <Modal.Header closeButton><Modal.Title><Link size={16} className="me-2" />Vincular à Despesa</Modal.Title></Modal.Header>
                <Modal.Body>
                    {expenses.length === 0 ? (
                        <Alert variant="info">Nenhuma despesa encontrada no orçamento ativo.</Alert>
                    ) : (
                        <Form.Group>
                            <Form.Label>Selecione a despesa <span className="text-danger">*</span></Form.Label>
                            <Form.Select value={selectedExpId} onChange={e => setSelectedExpId(e.target.value)}>
                                <option value="">Escolha uma despesa...</option>
                                {expenses.map(exp => (
                                    <option key={exp._id} value={exp._id}>
                                        {new Date(exp.date).toLocaleDateString('pt-BR')} — {exp.description} — {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(exp.amount)}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowLink(false)}>Cancelar</Button>
                    <Button variant="primary" onClick={handleLinkConfirm} disabled={!selectedExpId}>Vincular</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

const Invoices = () => {
    const [showSidebar, setShowSidebar] = React.useState(true);
    return (
        <div className="hk-pg-body py-0">
            <div className={`fmapp-wrap ${!showSidebar ? 'fmapp-sidebar-toggle' : ''}`}>
                <FinancialSidebar />
                <div className="fmapp-content">
                    <div className="fmapp-detail-wrap">
                        <FinancialHeader showSidebar={showSidebar} toggleSidebar={() => setShowSidebar(!showSidebar)} />
                        <InvoicesBody />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Invoices;
