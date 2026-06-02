'use client';
import React, { useState, useEffect, useCallback } from 'react';
import SimpleBar from 'simplebar-react';
import classNames from 'classnames';
import { Card, Col, Row, Badge, Button, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import { Activity, RefreshCw, CheckCircle, Clock, AlertCircle, PauseCircle, BarChart2 } from 'react-feather';
import AdminSidebar from '../../users/AdminSidebar';
import { getMonitorCampaigns, getMonitorQueueStatus, getMonitorStats } from '@/lib/api/services/monitor';

const STATUS_CONFIG = {
  active:    { label: 'Ativa',      bg: 'success', icon: <CheckCircle size={14} /> },
  paused:    { label: 'Pausada',    bg: 'warning', icon: <PauseCircle  size={14} /> },
  completed: { label: 'Concluída', bg: 'primary', icon: <CheckCircle  size={14} /> },
  draft:     { label: 'Rascunho',  bg: 'secondary', icon: <Clock       size={14} /> },
  failed:    { label: 'Falha',     bg: 'danger',  icon: <AlertCircle  size={14} /> },
};

const StatCard = ({ label, value, sub, color = 'primary', icon }) => (
  <Card className="card-border h-100">
    <Card.Body>
      <div className="d-flex align-items-center">
        <div className={`avatar avatar-icon avatar-lg avatar-${color} avatar-rounded me-3`}>
          {icon}
        </div>
        <div className="flex-grow-1">
          <div className="text-muted small">{label}</div>
          <div className="h3 mb-0">{value ?? '—'}</div>
          {sub && <small className="text-muted">{sub}</small>}
        </div>
      </div>
    </Card.Body>
  </Card>
);

const AdminMonitorPage = () => {
  const [showSidebar, setShowSidebar]   = useState(true);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [stats, setStats]               = useState(null);
  const [queue, setQueue]               = useState(null);
  const [campaigns, setCampaigns]       = useState([]);
  const [lastRefresh, setLastRefresh]   = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, queueRes, campaignsRes] = await Promise.all([
        getMonitorStats(),
        getMonitorQueueStatus(),
        getMonitorCampaigns(),
      ]);
      setStats(statsRes);
      setQueue(queueRes);
      // A API retorna { list: [], total: N } ou um array direto
      const list = Array.isArray(campaignsRes)
        ? campaignsRes
        : (campaignsRes?.list ?? []);
      setCampaigns(list);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err?.message || 'Erro ao carregar dados do monitor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // auto-refresh a cada 30s
    return () => clearInterval(interval);
  }, [loadData]);

  const queueTotal = queue
    ? (queue.waiting ?? 0) + (queue.active ?? 0) + (queue.delayed ?? 0)
    : 0;

  return (
    <div className="hk-pg-body py-0">
      <div className={classNames('fmapp-wrap', { 'fmapp-sidebar-toggle': !showSidebar })}>
        <AdminSidebar />
        <div className="fmapp-content">
          <div className="fmapp-detail-wrap">

            {/* Header */}
            <header className="contact-header">
              <div className="d-flex align-items-center">
                <Button
                  variant="flush-dark"
                  className="btn-icon btn-rounded flush-soft-hover flex-shrink-0 me-3"
                  onClick={() => setShowSidebar(!showSidebar)}
                >
                  <span className="icon">
                    <span className="feather-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
                      </svg>
                    </span>
                  </span>
                </Button>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item"><a href="/dashboard">TMS</a></li>
                    <li className="breadcrumb-item"><a href="#">Admin</a></li>
                    <li className="breadcrumb-item active">Monitor</li>
                  </ol>
                </nav>
              </div>
              <div className="contact-options-wrap d-flex align-items-center gap-2">
                {lastRefresh && (
                  <small className="text-muted">
                    Atualizado às {lastRefresh.toLocaleTimeString('pt-BR')}
                  </small>
                )}
                <Button variant="outline-primary" size="sm" onClick={loadData} disabled={loading}>
                  <RefreshCw size={14} className={classNames('me-1', { 'spin': loading })} />
                  Atualizar
                </Button>
              </div>
            </header>

            <div className="fm-body">
              <SimpleBar className="nicescroll-bar">
                <div className="contact-list-view">
                  <div className="p-4">

                    {/* Título */}
                    <Row className="mb-4">
                      <Col>
                        <h3 className="mb-1">
                          <Activity size={22} className="me-2" />
                          Monitor de Campanhas
                        </h3>
                        <p className="text-muted mb-0">
                          Acompanhamento em tempo real das campanhas e da fila de disparo
                        </p>
                      </Col>
                    </Row>

                    {/* Erro */}
                    {error && (
                      <Alert variant="danger" className="d-flex align-items-center mb-4">
                        <AlertCircle size={18} className="me-2 flex-shrink-0" />
                        {error}
                      </Alert>
                    )}

                    {/* Loading inicial */}
                    {loading && !stats && (
                      <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="text-muted mt-3 mb-0">Carregando dados...</p>
                      </div>
                    )}

                    {/* Conteúdo */}
                    {(stats || queue) && (
                      <>
                        {/* Cards de Stats de Campanhas */}
                        <Row className="mb-4">
                          <Col lg={2} sm={4} className="mb-3">
                            <StatCard label="Total" value={stats?.total ?? 0} color="dark" icon={<BarChart2 size={20} />} />
                          </Col>
                          <Col lg={2} sm={4} className="mb-3">
                            <StatCard label="Ativas" value={stats?.active ?? 0} color="success" icon={<CheckCircle size={20} />} />
                          </Col>
                          <Col lg={2} sm={4} className="mb-3">
                            <StatCard label="Pausadas" value={stats?.paused ?? 0} color="warning" icon={<PauseCircle size={20} />} />
                          </Col>
                          <Col lg={2} sm={4} className="mb-3">
                            <StatCard label="Concluídas" value={stats?.completed ?? 0} color="primary" icon={<CheckCircle size={20} />} />
                          </Col>
                          <Col lg={2} sm={4} className="mb-3">
                            <StatCard label="Rascunhos" value={stats?.draft ?? 0} color="secondary" icon={<Clock size={20} />} />
                          </Col>
                          <Col lg={2} sm={4} className="mb-3">
                            <StatCard label="Na Fila" value={queueTotal} sub="waiting + active + delayed" color="info" icon={<Activity size={20} />} />
                          </Col>
                        </Row>

                        {/* Status da Fila */}
                        {queue && (
                          <Row className="mb-4">
                            <Col>
                              <Card className="card-border">
                                <Card.Header className="d-flex justify-content-between align-items-center">
                                  <h5 className="mb-0">Status da Fila de Disparo</h5>
                                  {loading && <Spinner animation="border" size="sm" variant="secondary" />}
                                </Card.Header>
                                <Card.Body>
                                  <Row className="text-center">
                                    {[
                                      { label: 'Aguardando',  value: queue.waiting,   color: '#0d6efd' },
                                      { label: 'Processando', value: queue.active,    color: '#198754' },
                                      { label: 'Atrasados',   value: queue.delayed,   color: '#fd7e14' },
                                      { label: 'Concluídos',  value: queue.completed, color: '#6c757d' },
                                      { label: 'Falhas',      value: queue.failed,    color: '#dc3545' },
                                    ].map(({ label, value, color }) => (
                                      <Col key={label} sm className="mb-3">
                                        <div className="h2 mb-0 fw-bold" style={{ color }}>{value ?? 0}</div>
                                        <small className="text-muted">{label}</small>
                                        {queueTotal > 0 && (
                                          <ProgressBar
                                            now={Math.round(((value ?? 0) / queueTotal) * 100)}
                                            style={{ height: 4, marginTop: 6 }}
                                            variant={color === '#198754' ? 'success' : color === '#dc3545' ? 'danger' : color === '#fd7e14' ? 'warning' : 'primary'}
                                          />
                                        )}
                                      </Col>
                                    ))}
                                  </Row>
                                </Card.Body>
                              </Card>
                            </Col>
                          </Row>
                        )}

                        {/* Tabela de Campanhas */}
                        <Row>
                          <Col>
                            <Card className="card-border">
                              <Card.Header className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">Campanhas do Tenant</h5>
                                <Badge bg="secondary">{campaigns.length} campanhas</Badge>
                              </Card.Header>
                              <Card.Body className="p-0">
                                {campaigns.length === 0 ? (
                                  <div className="text-center py-5 text-muted">
                                    <Activity size={40} className="mb-3 opacity-25" />
                                    <p className="mb-0">Nenhuma campanha encontrada</p>
                                  </div>
                                ) : (
                                  <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                      <thead className="table-light">
                                        <tr>
                                          <th>Nome</th>
                                          <th>Tipo</th>
                                          <th>Status</th>
                                          <th className="text-end">Leads</th>
                                          <th className="text-end">Enviados</th>
                                          <th className="text-end">Falhas</th>
                                          <th>Criada em</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {campaigns.map((c) => {
                                          const st = STATUS_CONFIG[c.status] ?? { label: c.status, bg: 'secondary', icon: null };
                                          return (
                                            <tr key={c._id ?? c.id}>
                                              <td>
                                                <div className="fw-medium">{c.name}</div>
                                                {c.description && <small className="text-muted">{c.description}</small>}
                                              </td>
                                              <td>
                                                <Badge bg="light" text="dark" className="text-uppercase" style={{ fontSize: '0.7rem' }}>
                                                  {c.kind ?? c.type ?? 'whatsapp'}
                                                </Badge>
                                              </td>
                                              <td>
                                                <Badge bg={st.bg} className="d-inline-flex align-items-center gap-1">
                                                  {st.icon}
                                                  {st.label}
                                                </Badge>
                                              </td>
                                              <td className="text-end fw-medium">{(c.leadIds?.length ?? c.totalLeads ?? 0).toLocaleString('pt-BR')}</td>
                                              <td className="text-end text-success fw-medium">{(c.sentCount ?? 0).toLocaleString('pt-BR')}</td>
                                              <td className="text-end text-danger fw-medium">{(c.failedCount ?? 0).toLocaleString('pt-BR')}</td>
                                              <td>
                                                <small className="text-muted">
                                                  {c.createdAt ? new Date(c.createdAt).toLocaleDateString('pt-BR') : '—'}
                                                </small>
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
                          </Col>
                        </Row>
                      </>
                    )}

                  </div>
                </div>
              </SimpleBar>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMonitorPage;
