'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Alert, Badge, Button, Card, Col, Modal, ProgressBar, Row, Spinner, Table } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import { getCampaign, getCampaignProgress, pauseCampaign, resumeCampaign, stopCampaign, startCampaign } from '@/lib/api/services/campaigns';

const POLLING_INTERVAL = 5000;
const PAGE_SIZE = 25;

const STATUS_BADGE = {
    sent: { bg: 'warning', label: 'Enviado' },
    delivered: { bg: 'info', label: 'Entregue' },
    read: { bg: 'success', label: 'Lido' },
    failed: { bg: 'danger', label: 'Falhou' },
    skipped: { bg: 'secondary', label: 'Pulado' },
};

const CAMPAIGN_STATUS_BADGE = {
    draft: { bg: 'secondary', label: 'Rascunho' },
    active: { bg: 'success', label: 'Ativo' },
    paused: { bg: 'warning', label: 'Pausado' },
    completed: { bg: 'primary', label: 'Completo' },
    cancelled: { bg: 'danger', label: 'Cancelado' },
};

const CampaignMonitorBody = () => {
    const { id } = useParams();

    const [campaign, setCampaign] = useState(null);
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [actioning, setActioning] = useState(false);
    const [showStopModal, setShowStopModal] = useState(false);
    const [page, setPage] = useState(1);

    const intervalRef = useRef(null);

    const fetchProgress = useCallback(async () => {
        if (!id) return;
        try {
            const res = await getCampaignProgress(id);
            const data = res?.data ?? res;
            setProgress(data);
            if (data?.status === 'completed' || data?.status === 'cancelled') {
                clearInterval(intervalRef.current);
            }
        } catch {
            // silent — don't interrupt polling on transient errors
        }
    }, [id]);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        getCampaign(id)
            .then((res) => { setCampaign(res?.campaign ?? res?.data ?? res); })
            .catch((err) => setError(err?.message || 'Erro ao carregar campanha'))
            .finally(() => setLoading(false));

        fetchProgress();
        intervalRef.current = setInterval(fetchProgress, POLLING_INTERVAL);
        return () => clearInterval(intervalRef.current);
    }, [id, fetchProgress]);

    const handleAction = async (fn, errorMsg) => {
        setActioning(true);
        setActionError(null);
        try {
            await fn();
            await fetchProgress();
            const res = await getCampaign(id);
            setCampaign(res?.campaign ?? res?.data ?? res);
        } catch (err) {
            const detail = err?.body?.detail ?? err?.body?.message ?? err?.message ?? errorMsg;
            setActionError(detail);
        } finally {
            setActioning(false);
        }
    };

    const handleStart = () => handleAction(() => startCampaign(id), 'Erro ao iniciar campanha');
    const handlePause = () => handleAction(() => pauseCampaign(id), 'Erro ao pausar campanha');
    const handleResume = () => handleAction(() => resumeCampaign(id), 'Erro ao retomar campanha');
    const handleStop = async () => {
        setShowStopModal(false);
        await handleAction(() => stopCampaign(id), 'Erro ao parar campanha');
    };

    if (loading) return <div className="p-4 text-center"><Spinner /><p className="mt-2">Carregando campanha...</p></div>;
    if (error) return <div className="p-4"><Alert variant="danger">{error}</Alert></div>;

    const status = progress?.status ?? campaign?.status ?? 'draft';
    const totalLeads = progress?.totalLeads ?? campaign?.leadIds?.length ?? 0;
    const processedLeads = progress?.processedLeads ?? 0;
    const sentCount = progress?.sentCount ?? 0;
    const deliveredCount = progress?.deliveredCount ?? 0;
    const readCount = progress?.readCount ?? 0;
    const errorCount = progress?.errorCount ?? 0;
    const skippedCount = progress?.skippedCount ?? 0;
    const deliveryResults = progress?.deliveryResults ?? [];
    const progressPct = totalLeads > 0 ? Math.round((processedLeads / totalLeads) * 100) : 0;

    const isActive = status === 'active';
    const isPaused = status === 'paused';
    const isDraft = status === 'draft';
    const isFinished = status === 'completed' || status === 'cancelled';

    const totalPages = Math.ceil(deliveryResults.length / PAGE_SIZE);
    const pagedResults = deliveryResults.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const statusBadge = CAMPAIGN_STATUS_BADGE[status] ?? { bg: 'secondary', label: status };

    return (
        <div className="contact-body contact-detail-body">
            <SimpleBar className="nicescroll-bar">
                <div className="contactapp-detail-wrap">
                    {actionError && (
                        <Alert variant="danger" dismissible className="mx-3 mt-3" onClose={() => setActionError(null)}>
                            {actionError}
                        </Alert>
                    )}

                    {/* Header */}
                    <Card className="mb-3">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                                <div>
                                    <h5 className="mb-1">{campaign?.name ?? '—'}</h5>
                                    <Badge bg={statusBadge.bg}>{statusBadge.label}</Badge>
                                    {campaign?.campaignType && (
                                        <Badge bg="light" text="dark" className="ms-2">
                                            {campaign.campaignType === 'whatsapp' ? '📱 WhatsApp' : '📞 Voz'}
                                        </Badge>
                                    )}
                                </div>
                                <div className="d-flex gap-2">
                                    {isDraft && (
                                        <Button variant="success" size="sm" onClick={handleStart} disabled={actioning}>
                                            {actioning ? <Spinner size="sm" /> : '▶ Iniciar'}
                                        </Button>
                                    )}
                                    {isActive && (
                                        <Button variant="warning" size="sm" onClick={handlePause} disabled={actioning}>
                                            {actioning ? <Spinner size="sm" /> : '⏸ Pausar'}
                                        </Button>
                                    )}
                                    {isPaused && (
                                        <Button variant="success" size="sm" onClick={handleResume} disabled={actioning}>
                                            {actioning ? <Spinner size="sm" /> : '▶ Retomar'}
                                        </Button>
                                    )}
                                    {(isActive || isPaused) && (
                                        <Button variant="danger" size="sm" onClick={() => setShowStopModal(true)} disabled={actioning}>
                                            ⏹ Parar
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {totalLeads > 0 && (
                                <div className="mt-3">
                                    <div className="d-flex justify-content-between mb-1">
                                        <small className="text-muted">Progresso do disparo</small>
                                        <small className="text-muted">{processedLeads}/{totalLeads} leads ({progressPct}%)</small>
                                    </div>
                                    <ProgressBar now={progressPct} variant={isActive ? 'success' : isPaused ? 'warning' : 'primary'} />
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Stats cards */}
                    <Row className="g-3 mb-3 px-3">
                        {[
                            { label: 'Total', value: totalLeads, color: 'primary' },
                            { label: 'Enviado', value: sentCount, color: 'warning' },
                            { label: 'Entregue', value: deliveredCount, color: 'info' },
                            { label: 'Lido', value: readCount, color: 'success' },
                            { label: 'Erro', value: errorCount, color: 'danger' },
                            { label: 'Pulado', value: skippedCount, color: 'secondary' },
                        ].map(({ label, value, color }) => (
                            <Col key={label} xs={6} md={4} lg={2}>
                                <Card className="text-center h-100">
                                    <Card.Body className="py-3">
                                        <h3 className={`mb-0 text-${color}`}>{value}</h3>
                                        <small className="text-muted">{label}</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    {/* Delivery results table */}
                    {deliveryResults.length > 0 && (
                        <Card className="mx-3 mb-3">
                            <Card.Header className="d-flex justify-content-between align-items-center">
                                <strong>Resultados por Lead</strong>
                                <small className="text-muted">{deliveryResults.length} registros</small>
                            </Card.Header>
                            <Card.Body className="p-0">
                                <div style={{ overflowX: 'auto' }}>
                                    <Table hover className="mb-0">
                                        <thead>
                                            <tr>
                                                <th>Lead</th>
                                                <th>Telefone</th>
                                                <th>Status</th>
                                                <th>Enviado em</th>
                                                <th>Entregue em</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pagedResults.map((r, i) => {
                                                const badge = STATUS_BADGE[r.status] ?? { bg: 'secondary', label: r.status };
                                                return (
                                                    <tr key={r.leadId ?? i}>
                                                        <td>{r.leadId?.substring(0, 8) ?? '—'}...</td>
                                                        <td>{r.phone ?? '—'}</td>
                                                        <td><Badge bg={badge.bg}>{badge.label}</Badge></td>
                                                        <td>{r.sentAt ? new Date(r.sentAt).toLocaleString('pt-BR') : '—'}</td>
                                                        <td>{r.deliveredAt ? new Date(r.deliveredAt).toLocaleString('pt-BR') : '—'}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </Table>
                                </div>
                                {totalPages > 1 && (
                                    <div className="d-flex justify-content-center gap-2 p-3">
                                        <Button size="sm" variant="light" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                                        <span className="align-self-center text-muted small">Página {page} de {totalPages}</span>
                                        <Button size="sm" variant="light" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    )}

                    {deliveryResults.length === 0 && !isDraft && (
                        <div className="text-center text-muted py-4">
                            <p>Nenhum resultado de entrega ainda. {isActive ? 'O disparo está em andamento...' : ''}</p>
                        </div>
                    )}
                </div>
            </SimpleBar>

            <Modal show={showStopModal} onHide={() => setShowStopModal(false)} centered>
                <Modal.Header>
                    <Modal.Title>Parar Campanha</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Tem certeza que deseja <strong>parar definitivamente</strong> esta campanha? Esta ação não pode ser desfeita e os leads restantes não serão contatados.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => setShowStopModal(false)}>Cancelar</Button>
                    <Button variant="danger" onClick={handleStop}>Parar Campanha</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default CampaignMonitorBody;
