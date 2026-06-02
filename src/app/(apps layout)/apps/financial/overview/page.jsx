'use client';
import React, { useState, useEffect, useCallback } from 'react';
import SimpleBar from 'simplebar-react';
import { Card, Col, Row, ProgressBar, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, DollarSign, FileText, Truck, RefreshCw } from 'react-feather';
import FinancialHeader from '../FinancialHeader';
import FinancialSidebar from '../FinancialSidebar';
import RevenueExpenseChart from '@/components/shared-charts/RevenueExpenseChart';
import { getFinancialSummary } from '@/lib/api/services/financial';
import { useAuth } from '@/lib/auth/AuthProvider';

const TMS_CATEGORIES = {
    'Combustível': '⛽',
    'Manutenção': '🔧',
    'Pedágios': '🛣️',
    'Pneus': '🚗',
    'Seguros': '🛡️',
    'Salários': '👷',
    'Frete / Receita': '📦',
    'Multas': '⚠️',
    'Outros': '📋',
};

const FinancialOverviewBody = () => {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [financialData, setFinancialData] = useState(null);

    const loadFinancialData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getFinancialSummary();

            setFinancialData({
                budgetId: data.budgetId || null,
                periodName: data.campaignName || data.periodName || `Período ${new Date().getFullYear()}`,
                totalBudget: data.budget?.totalBudget || 0,
                totalSpent: data.budget?.totalSpent || 0,
                totalRevenue: data.budget?.totalRevenue || 0,
                available: data.budget?.available || 0,
                percentUsed: data.budget?.percentUsed || 0,
                categories: data.categories || [],
                recentTransactions: data.recentTransactions || [],
                alerts: data.alerts || [],
            });
        } catch (err) {
            console.error('Erro ao carregar dados financeiros:', err);
            setError(err.message || 'Erro ao carregar dados financeiros');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadFinancialData();
    }, [loadFinancialData]);

    const formatCurrency = (value) => {
        const num = (typeof value === 'number' && !isNaN(value)) ? value : (parseFloat(value) || 0);
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(num);
    };

    const getStatusBadge = (status) => {
        const map = {
            approved:  { bg: 'success',   text: 'Aprovado' },
            pending:   { bg: 'warning',   text: 'Pendente' },
            rejected:  { bg: 'danger',    text: 'Rejeitado' },
            confirmed: { bg: 'success',   text: 'Confirmado' },
            paid:      { bg: 'success',   text: 'Pago' },
            cancelled: { bg: 'secondary', text: 'Cancelado' },
        };
        return map[status] || map.pending;
    };

    const renderBody = () => {
        if (loading) {
            return (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3 text-muted">Carregando dados financeiros...</p>
                </div>
            );
        }

        if (error) {
            return (
                <Alert variant="danger">
                    <AlertTriangle size={18} className="me-2" />
                    <strong>Erro:</strong> {error}
                    <Button variant="outline-danger" size="sm" className="ms-3" onClick={loadFinancialData}>
                        Tentar Novamente
                    </Button>
                </Alert>
            );
        }

        if (!financialData) return null;

        return (
            <>
                {/* Barra de ações */}
                <div className="d-flex align-items-center justify-content-between mb-3 gap-2 flex-wrap">
                    <div className="d-flex align-items-center gap-2">
                        <Truck size={16} className="text-muted flex-shrink-0" />
                        <span className="text-muted small fw-medium">{financialData.periodName}</span>
                    </div>
                    <Button variant="outline-secondary" size="sm" onClick={loadFinancialData}>
                        <RefreshCw size={14} className="me-1" />
                        Atualizar
                    </Button>
                </div>

                {/* KPIs principais */}
                <Row className="mb-4">
                    <Col xxl={9} lg={8}>
                        <Row>
                            <Col lg={4} sm={6} className="mb-3">
                                <Card className="card-border">
                                    <Card.Body>
                                        <div className="d-flex align-items-center">
                                            <div className="avatar avatar-icon avatar-lg avatar-success avatar-rounded me-3">
                                                <DollarSign size={24} />
                                            </div>
                                            <div className="flex-grow-1">
                                                <div className="text-muted small">Orçamento Total</div>
                                                <div className="h4 mb-0">{formatCurrency(financialData.totalBudget)}</div>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col lg={4} sm={6} className="mb-3">
                                <Card className="card-border">
                                    <Card.Body>
                                        <div className="d-flex align-items-center">
                                            <div className="avatar avatar-icon avatar-lg avatar-danger avatar-rounded me-3">
                                                <TrendingDown size={24} />
                                            </div>
                                            <div className="flex-grow-1">
                                                <div className="text-muted small">Total de Despesas</div>
                                                <div className="h4 mb-0">{formatCurrency(financialData.totalSpent)}</div>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col lg={4} sm={6} className="mb-3">
                                <Card className="card-border">
                                    <Card.Body>
                                        <div className="d-flex align-items-center">
                                            <div className="avatar avatar-icon avatar-lg avatar-primary avatar-rounded me-3">
                                                <CheckCircle size={24} />
                                            </div>
                                            <div className="flex-grow-1">
                                                <div className="text-muted small">Saldo Disponível</div>
                                                <div className="h4 mb-0">{formatCurrency(financialData.available)}</div>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Col>

                    <Col xxl={3} lg={4} className="mb-3">
                        <Card className="card-border">
                            <Card.Header>
                                <h6 className="mb-0 fs-7">Receitas vs Despesas</h6>
                            </Card.Header>
                            <Card.Body className="text-center py-3">
                                <div style={{ maxWidth: '160px', margin: '0 auto' }}>
                                    <RevenueExpenseChart
                                        revenue={financialData.totalRevenue}
                                        expense={financialData.totalSpent}
                                    />
                                </div>
                                <div className="mt-3">
                                    <div className="d-flex align-items-center justify-content-between mb-2 px-3">
                                        <div className="d-flex align-items-center">
                                            <Badge bg="success" className="badge-indicator badge-indicator-nobdr me-2" />
                                            <span className="fs-8 text-muted">Receitas</span>
                                        </div>
                                        <span className="fw-medium fs-7">{formatCurrency(financialData.totalRevenue)}</span>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between px-3">
                                        <div className="d-flex align-items-center">
                                            <Badge bg="danger" className="badge-indicator badge-indicator-nobdr me-2" />
                                            <span className="fs-8 text-muted">Despesas</span>
                                        </div>
                                        <span className="fw-medium fs-7">{formatCurrency(financialData.totalSpent)}</span>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Painel de saúde financeira da frota */}
                <Row className="mb-4">
                    <Col>
                        <Card className="card-border border-primary finance-health-card">
                            <Card.Header className="d-flex justify-content-between align-items-center bg-primary-subtle">
                                <div className="d-flex align-items-center gap-2">
                                    <Truck size={18} className="text-primary" />
                                    <h6 className="mb-0 text-primary fw-semibold">Saúde Financeira da Frota</h6>
                                </div>
                                <Badge bg={financialData.percentUsed > 90 ? 'danger' : financialData.percentUsed > 70 ? 'warning' : 'success'}>
                                    {financialData.percentUsed?.toFixed(1) || 0}% utilizado
                                </Badge>
                            </Card.Header>
                            <Card.Body className="py-3">
                                <Row className="g-3">
                                    <Col md={3} sm={6}>
                                        <div className="d-flex align-items-center gap-2 p-2 rounded border border-success bg-success-subtle finance-health-stat">
                                            <CheckCircle size={20} className="text-success flex-shrink-0" />
                                            <div>
                                                <div className="fw-semibold small">Receitas Confirmadas</div>
                                                <small className="text-muted">{formatCurrency(financialData.totalRevenue)}</small>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={3} sm={6}>
                                        <div className="d-flex align-items-center gap-2 p-2 rounded border border-info bg-info-subtle finance-health-stat">
                                            <FileText size={20} className="text-info flex-shrink-0" />
                                            <div>
                                                <div className="fw-semibold small">Período</div>
                                                <small className="text-muted">{financialData.periodName}</small>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={3} sm={6}>
                                        <div className={`d-flex align-items-center gap-2 p-2 rounded border finance-health-stat ${financialData.percentUsed > 90 ? 'border-danger bg-danger-subtle' : financialData.percentUsed > 70 ? 'border-warning bg-warning-subtle' : 'border-success bg-success-subtle'}`}>
                                            {financialData.percentUsed > 90
                                                ? <AlertTriangle size={20} className="text-danger flex-shrink-0" />
                                                : <CheckCircle size={20} className="text-success flex-shrink-0" />}
                                            <div>
                                                <div className="fw-semibold small">Utilização do Orçamento</div>
                                                <small className="text-muted">{financialData.percentUsed?.toFixed(1) || 0}% comprometido</small>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={3} sm={6}>
                                        <div className="d-flex align-items-center gap-2 p-2 rounded border border-primary bg-primary-subtle finance-health-stat">
                                            <TrendingUp size={20} className="text-primary flex-shrink-0" />
                                            <div>
                                                <div className="fw-semibold small">Saldo Disponível</div>
                                                <small className="text-muted">{formatCurrency(financialData.available)}</small>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                                {financialData.percentUsed > 70 && (
                                    <div className="mt-3 pt-2 border-top">
                                        <small className="text-muted">
                                            <strong>Atenção:</strong> O orçamento está {financialData.percentUsed > 90 ? 'criticamente alto' : 'acima de 70%'}.
                                            Revise as despesas operacionais da frota — combustível, manutenção e pedágios são os maiores custos variáveis.
                                        </small>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Alertas */}
                {financialData.alerts.length > 0 && (
                    <Row className="mb-4">
                        <Col>
                            <Card className="card-border">
                                <Card.Header>
                                    <h5 className="mb-0">
                                        <AlertTriangle size={18} className="me-2" />
                                        Alertas Financeiros
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    {financialData.alerts.map((alert, idx) => (
                                        <Alert key={alert.id || idx} variant={alert.type || 'warning'} className="mb-2">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <strong>{alert.title}</strong>
                                                    <p className="mb-0 small">{alert.message}</p>
                                                </div>
                                                <small className="text-muted">{alert.date}</small>
                                            </div>
                                        </Alert>
                                    ))}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                )}

                {/* Gastos por Categoria */}
                {financialData.categories.length > 0 && (
                    <Row className="mb-4">
                        <Col>
                            <Card className="card-border">
                                <Card.Header className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">Despesas por Categoria</h5>
                                    <Badge bg="secondary">{financialData.categories.length} categorias</Badge>
                                </Card.Header>
                                <Card.Body>
                                    {financialData.categories.map((category) => {
                                        const icon = category.icon || TMS_CATEGORIES[category.name] || '📋';
                                        return (
                                            <div key={category.code || category.id} className="mb-4">
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <div>
                                                        <span className="me-2">{icon}</span>
                                                        <strong>{category.name}</strong>
                                                        <Badge bg={category.status || 'secondary'} className="ms-2">
                                                            {category.percent || 0}%
                                                        </Badge>
                                                    </div>
                                                    <div className="text-end">
                                                        <strong>{formatCurrency(category.spent || 0)}</strong>
                                                        <span className="text-muted"> / {formatCurrency(category.limit || 0)}</span>
                                                    </div>
                                                </div>
                                                <ProgressBar
                                                    now={category.percent || 0}
                                                    variant={category.status || 'secondary'}
                                                    style={{ height: '8px' }}
                                                />
                                                {(category.percent || 0) >= 95 && (
                                                    <small className="text-danger d-block mt-1">
                                                        ⚠️ Limite crítico — novas despesas nesta categoria podem ser bloqueadas
                                                    </small>
                                                )}
                                                {(category.percent || 0) >= 80 && (category.percent || 0) < 95 && (
                                                    <small className="text-warning d-block mt-1">
                                                        ⚠️ Atenção — monitorar próximos lançamentos nesta categoria
                                                    </small>
                                                )}
                                            </div>
                                        );
                                    })}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                )}

                {/* Movimentações Recentes */}
                <Row>
                    <Col>
                        <Card className="card-border">
                            <Card.Header className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">
                                    <FileText size={18} className="me-2" />
                                    Movimentações Recentes
                                </h5>
                                <Button variant="outline-primary" size="sm" href="/apps/financial/expenses">
                                    Ver Despesas
                                </Button>
                            </Card.Header>
                            <Card.Body className="p-0">
                                {financialData.recentTransactions.length === 0 ? (
                                    <div className="text-center py-4 text-muted">
                                        <FileText size={32} className="mb-2 opacity-50" />
                                        <p className="mb-0">Nenhuma movimentação recente</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover mb-0">
                                            <thead>
                                                <tr>
                                                    <th>Data</th>
                                                    <th>Tipo</th>
                                                    <th>Descrição</th>
                                                    <th>Categoria</th>
                                                    <th className="text-end">Valor</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {financialData.recentTransactions.map((transaction) => (
                                                    <tr key={transaction._id || transaction.id}>
                                                        <td>{new Date(transaction.date || transaction.createdAt).toLocaleDateString('pt-BR')}</td>
                                                        <td>
                                                            <Badge bg={transaction.type === 'expense' ? 'danger' : 'success'}>
                                                                {transaction.type === 'expense' ? 'Despesa' : 'Receita'}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            <div>
                                                                {transaction.description}
                                                                {transaction.invoice?.number && (
                                                                    <div className="small text-muted">NF: {transaction.invoice.number}</div>
                                                                )}
                                                                {transaction.supplier && (
                                                                    <div className="small text-muted">{transaction.supplier}</div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>{transaction.category || transaction.categoryName || '—'}</td>
                                                        <td className="text-end">
                                                            <strong className={transaction.type === 'expense' ? 'text-danger' : 'text-success'}>
                                                                {transaction.type === 'expense' ? '- ' : '+ '}
                                                                {formatCurrency(transaction.amount)}
                                                            </strong>
                                                        </td>
                                                        <td>
                                                            <Badge bg={getStatusBadge(transaction.status).bg}>
                                                                {getStatusBadge(transaction.status).text}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </>
        );
    };

    return (
        <div className="fm-body">
            <SimpleBar className="nicescroll-bar">
                <div className="container-fluid px-4 py-4 financial-overview-darkfix">
                    <style>{`
                        [data-bs-theme="dark"] .financial-overview-darkfix .finance-health-card {
                            background-color: #1e2130 !important;
                            border-color: #2a2f3d !important;
                        }
                        [data-bs-theme="dark"] .financial-overview-darkfix .finance-health-card .card-header {
                            background: #252a3a !important;
                            border-bottom-color: #2a2f3d !important;
                        }
                        [data-bs-theme="dark"] .financial-overview-darkfix .finance-health-card .bg-primary-subtle,
                        [data-bs-theme="dark"] .financial-overview-darkfix .finance-health-stat.bg-primary-subtle {
                            background-color: rgba(13, 110, 253, 0.18) !important;
                        }
                        [data-bs-theme="dark"] .financial-overview-darkfix .finance-health-stat.bg-success-subtle {
                            background-color: rgba(25, 135, 84, 0.18) !important;
                        }
                        [data-bs-theme="dark"] .financial-overview-darkfix .finance-health-stat.bg-info-subtle {
                            background-color: rgba(13, 202, 240, 0.18) !important;
                        }
                        [data-bs-theme="dark"] .financial-overview-darkfix .finance-health-stat.bg-warning-subtle {
                            background-color: rgba(255, 193, 7, 0.18) !important;
                        }
                        [data-bs-theme="dark"] .financial-overview-darkfix .finance-health-stat.bg-danger-subtle {
                            background-color: rgba(220, 53, 69, 0.18) !important;
                        }
                        [data-bs-theme="dark"] .financial-overview-darkfix .finance-health-stat {
                            border-color: #3a4054 !important;
                        }
                        [data-bs-theme="dark"] .financial-overview-darkfix .finance-health-stat > div,
                        [data-bs-theme="dark"] .financial-overview-darkfix .finance-health-stat > div > div,
                        [data-bs-theme="dark"] .financial-overview-darkfix .finance-health-stat > div > small {
                            background: transparent !important;
                            box-shadow: none !important;
                        }
                        [data-bs-theme="dark"] .financial-overview-darkfix .finance-health-stat svg,
                        [data-bs-theme="dark"] .financial-overview-darkfix .finance-health-stat .text-primary,
                        [data-bs-theme="dark"] .financial-overview-darkfix .finance-health-stat .text-success,
                        [data-bs-theme="dark"] .financial-overview-darkfix .finance-health-stat .text-info,
                        [data-bs-theme="dark"] .financial-overview-darkfix .finance-health-stat .text-danger {
                            background: transparent !important;
                            box-shadow: none !important;
                        }
                        [data-bs-theme="dark"] .financial-overview-darkfix .finance-health-card .fw-semibold,
                        [data-bs-theme="dark"] .financial-overview-darkfix .finance-health-card .small:not(.text-muted) {
                            color: #dde3ef !important;
                        }
                        [data-bs-theme="dark"] .financial-overview-darkfix .finance-health-card small.text-muted {
                            color: #b7c0d8 !important;
                        }
                        [data-bs-theme="dark"] .financial-overview-darkfix .finance-health-card .text-primary,
                        [data-bs-theme="dark"] .financial-overview-darkfix .finance-health-card .text-success,
                        [data-bs-theme="dark"] .financial-overview-darkfix .finance-health-card .text-info,
                        [data-bs-theme="dark"] .financial-overview-darkfix .finance-health-card .text-danger {
                            filter: brightness(1.15);
                        }
                        [data-bs-theme="dark"] .financial-overview-darkfix .finance-health-card .border-top {
                            border-top-color: #2a2f3d !important;
                        }
                    `}</style>
                    {renderBody()}
                </div>
            </SimpleBar>
        </div>
    );
};

const FinancialOverview = () => {
    const [showSidebar, setShowSidebar] = React.useState(true);

    return (
        <div className="hk-pg-body py-0">
            <div className={`fmapp-wrap ${!showSidebar ? 'fmapp-sidebar-toggle' : ''}`}>
                <FinancialSidebar />
                <div className="fmapp-content">
                    <div className="fmapp-detail-wrap">
                        <FinancialHeader showSidebar={showSidebar} toggleSidebar={() => setShowSidebar(!showSidebar)} />
                        <FinancialOverviewBody />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancialOverview;
