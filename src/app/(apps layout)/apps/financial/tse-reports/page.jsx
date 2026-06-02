'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import SimpleBar from 'simplebar-react';
import {
    Card, Col, Row, Badge, Button, Alert, Table,
    ProgressBar, Spinner,
} from 'react-bootstrap';
import {
    Download, FileText, CheckCircle, AlertTriangle,
    RefreshCw, XCircle, Info, Truck, TrendingDown, TrendingUp,
} from 'react-feather';
import FinancialHeader from '../FinancialHeader';
import FinancialSidebar from '../FinancialSidebar';
import { getFinancialSummary, listExpenses, listRevenues } from '@/lib/api/services/financial';

const EXPENSE_CATEGORY_LABELS = {
    fuel:        'Combustível',
    maintenance: 'Manutenção',
    tolls:       'Pedágios',
    insurance:   'Seguro',
    tires:       'Pneus',
    washing:     'Lavagem / Higienização',
    parts:       'Peças e Acessórios',
    driver:      'Diárias / Motoristas',
    fine:        'Multas e Infrações',
    other:       'Outros',
};

const REVENUE_TYPE_LABELS = {
    freight:     'Frete',
    service:     'Serviço de Transporte',
    rental:      'Locação de Veículo',
    insurance:   'Reembolso de Seguro',
    transfer:    'Transferência',
    other:       'Outras Receitas',
};

const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const statusBg = (pct) => pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : 'success';

const StatusIcon = ({ status }) => {
    if (status === 'success') return <CheckCircle size={18} className="text-success" />;
    if (status === 'danger')  return <XCircle     size={18} className="text-danger"  />;
    return <AlertTriangle size={18} className="text-warning" />;
};

// ─── Corpo da página ──────────────────────────────────────────────────────────

const FleetReportsBody = () => {
    const [loading,   setLoading]   = useState(true);
    const [error,     setError]     = useState(null);
    const [summary,   setSummary]   = useState(null);
    const [expenses,  setExpenses]  = useState([]);
    const [revenues,  setRevenues]  = useState([]);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [sumRes, expRes, revRes] = await Promise.allSettled([
                getFinancialSummary(),
                listExpenses({ limit: 500 }),
                listRevenues({ limit: 500 }),
            ]);
            if (sumRes.status === 'fulfilled') setSummary(sumRes.value);
            if (expRes.status === 'fulfilled') {
                const ed = expRes.value;
                setExpenses(ed?.data || ed?.expenses || (Array.isArray(ed) ? ed : []));
            }
            if (revRes.status === 'fulfilled') {
                const rd = revRes.value;
                setRevenues(rd?.data || rd?.revenues || (Array.isArray(rd) ? rd : []));
            }
        } catch {
            setError('Não foi possível carregar os dados financeiros.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // ── Agrupamentos ─────────────────────────────────────────────────────────

    const expenseByCategory = useMemo(() => {
        const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
        const grouped = {};
        expenses.forEach(e => {
            const key = e.category || e.categoryCode || 'other';
            grouped[key] = (grouped[key] || 0) + (e.amount || 0);
        });
        return Object.entries(grouped)
            .map(([key, amount]) => ({
                key,
                label: EXPENSE_CATEGORY_LABELS[key] || key,
                amount,
                percent: total > 0 ? Math.round((amount / total) * 100) : 0,
            }))
            .sort((a, b) => b.amount - a.amount);
    }, [expenses]);

    const revenueByType = useMemo(() => {
        const total = revenues.reduce((s, r) => s + (r.amount || 0), 0);
        const grouped = {};
        revenues.forEach(r => {
            const key = r.type || 'other';
            grouped[key] = (grouped[key] || 0) + (r.amount || 0);
        });
        return Object.entries(grouped)
            .map(([key, amount]) => ({
                key,
                label: REVENUE_TYPE_LABELS[key] || key,
                amount,
                percent: total > 0 ? Math.round((amount / total) * 100) : 0,
            }))
            .sort((a, b) => b.amount - a.amount);
    }, [revenues]);

    // ── Checklist de saúde financeira da frota ────────────────────────────────

    const healthChecks = useMemo(() => {
        if (!summary) return [];
        const checks = [];
        const fin = summary.budget || summary;

        // 1. Saldo disponível
        const available = fin.available ?? (fin.totalBudget - fin.totalSpent);
        const pctUsed   = fin.percentUsed ?? (fin.totalBudget > 0 ? (fin.totalSpent / fin.totalBudget) * 100 : 0);
        checks.push({
            item: 'Saldo disponível',
            status: pctUsed < 80 ? 'success' : pctUsed < 100 ? 'warning' : 'danger',
            message: pctUsed < 80
                ? `${formatCurrency(available)} disponível (${(100 - pctUsed).toFixed(0)}% do orçamento)`
                : pctUsed < 100
                    ? `Atenção: ${(100 - pctUsed).toFixed(0)}% restante — próximo do limite`
                    : 'Orçamento esgotado',
        });

        // 2. Despesas com NF vinculada
        const paidExpenses = expenses.filter(e => e.status === 'paid');
        const missingNF    = paidExpenses.filter(e => !e.invoiceNumber && !e.invoiceNFId);
        checks.push({
            item: 'Comprovação fiscal das despesas pagas',
            status: missingNF.length === 0 ? 'success' : 'warning',
            message: missingNF.length === 0
                ? `Todas as ${paidExpenses.length} despesas pagas têm NF registrada`
                : `${missingNF.length} despesa(s) paga(s) sem Nota Fiscal vinculada`,
        });

        // 3. Despesas pendentes de aprovação
        const pendingExp = expenses.filter(e => e.status === 'pending');
        checks.push({
            item: 'Despesas pendentes de aprovação',
            status: pendingExp.length === 0 ? 'success' : pendingExp.length <= 5 ? 'warning' : 'danger',
            message: pendingExp.length === 0
                ? 'Nenhuma despesa aguardando aprovação'
                : `${pendingExp.length} despesa(s) aguardando aprovação`,
        });

        // 4. Receitas confirmadas vs pendentes
        const confirmedRev = revenues.filter(r => r.status === 'confirmed');
        const pendingRev   = revenues.filter(r => r.status === 'pending');
        checks.push({
            item: 'Receitas confirmadas',
            status: pendingRev.length === 0 ? 'success' : 'warning',
            message: pendingRev.length === 0
                ? `${confirmedRev.length} receita(s) confirmada(s)`
                : `${pendingRev.length} receita(s) ainda pendente(s) de confirmação`,
        });

        // 5. Categoria com maior gasto
        if (expenseByCategory.length > 0) {
            const top = expenseByCategory[0];
            checks.push({
                item: 'Categoria de maior custo',
                status: top.percent > 50 ? 'warning' : 'success',
                message: `${top.label}: ${formatCurrency(top.amount)} (${top.percent}% do total de despesas)`,
            });
        }

        return checks;
    }, [summary, expenses, revenues, expenseByCategory]);

    const overallStatus = useMemo(() => {
        if (healthChecks.some(c => c.status === 'danger'))  return 'danger';
        if (healthChecks.some(c => c.status === 'warning')) return 'warning';
        if (healthChecks.length > 0)                        return 'success';
        return 'warning';
    }, [healthChecks]);

    const healthScore = useMemo(() => {
        if (!healthChecks.length) return 0;
        return Math.round(healthChecks.filter(c => c.status === 'success').length / healthChecks.length * 100);
    }, [healthChecks]);

    // ── Download CSV simples ──────────────────────────────────────────────────

    const downloadCsv = (type) => {
        const rows   = type === 'expenses' ? expenses : revenues;
        const header = type === 'expenses'
            ? ['Data', 'Descrição', 'Categoria', 'Fornecedor', 'Status', 'Valor']
            : ['Data', 'Descrição', 'Tipo', 'Status', 'Valor'];

        const lines = rows.map(r => {
            const date = r.date || r.createdAt || '';
            if (type === 'expenses') {
                const cat = EXPENSE_CATEGORY_LABELS[r.category || r.categoryCode] || r.category || '';
                return [date, r.description || '', cat, r.supplierName || '', r.status || '', r.amount || 0];
            }
            const t = REVENUE_TYPE_LABELS[r.type] || r.type || '';
            return [date, r.description || '', t, r.status || '', r.amount || 0];
        });

        const csv    = [header, ...lines].map(l => l.map(v => `"${v}"`).join(',')).join('\n');
        const blob   = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const anchor = document.createElement('a');
        anchor.href  = URL.createObjectURL(blob);
        anchor.download = `${type}_frota_${new Date().getFullYear()}.csv`;
        anchor.click();
        URL.revokeObjectURL(anchor.href);
    };

    // ── Render ────────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="fm-body d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
                <div className="text-center">
                    <Spinner animation="border" variant="primary" className="mb-3" />
                    <div className="text-muted">Carregando relatórios da frota...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fm-body">
                <SimpleBar className="nicescroll-bar">
                    <div className="container-fluid px-4 py-4">
                        <Alert variant="warning" className="d-flex align-items-start gap-3">
                            <Info size={20} className="mt-1 flex-shrink-0" />
                            <div>
                                <strong>Erro ao carregar dados</strong>
                                <div className="mt-1">{error}</div>
                            </div>
                        </Alert>
                        <Button variant="outline-primary" size="sm" onClick={loadData}>
                            <RefreshCw size={14} className="me-2" />Tentar novamente
                        </Button>
                    </div>
                </SimpleBar>
            </div>
        );
    }

    const fin       = summary?.budget || summary || {};
    const totalExp  = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const totalRev  = revenues.reduce((s, r) => s + (r.amount || 0), 0);
    const balance   = totalRev - totalExp;
    const year      = new Date().getFullYear();

    return (
        <div className="fm-body">
            <SimpleBar className="nicescroll-bar">
                <div className="container-fluid px-4 py-4">

                    {/* Header */}
                    <Row className="mb-4">
                        <Col>
                            <Card className="card-border">
                                <Card.Body>
                                    <Row className="align-items-center">
                                        <Col md={8}>
                                            <h4 className="mb-2 d-flex align-items-center gap-2">
                                                <FileText size={22} className="text-primary" />
                                                Relatórios Financeiros da Frota — {year}
                                            </h4>
                                            <div className="text-muted small">
                                                Visão consolidada de despesas, receitas e saúde financeira da frota.
                                                Exporte os dados em CSV para análise externa.
                                            </div>
                                        </Col>
                                        <Col md={4} className="text-end d-flex flex-column align-items-end gap-2">
                                            <Badge
                                                bg={overallStatus === 'success' ? 'success' : overallStatus === 'warning' ? 'warning' : 'danger'}
                                                className="p-2 fs-6"
                                            >
                                                {overallStatus === 'success' && '✅ Frota Saudável'}
                                                {overallStatus === 'warning' && '⚠️ Atenção Necessária'}
                                                {overallStatus === 'danger'  && '🚨 Pendências Críticas'}
                                            </Badge>
                                            <Button variant="outline-secondary" size="sm" onClick={loadData}>
                                                <RefreshCw size={14} className="me-1" />Atualizar
                                            </Button>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* KPIs */}
                    <Row className="mb-4">
                        <Col lg={3} sm={6} className="mb-3">
                            <Card className="card-border text-center">
                                <Card.Body>
                                    <div className="text-muted small mb-1">Total de Despesas</div>
                                    <div className="h4 fw-bold text-danger mb-0">{formatCurrency(totalExp)}</div>
                                    <div className="text-muted" style={{ fontSize: 11 }}>{expenses.length} lançamentos</div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={3} sm={6} className="mb-3">
                            <Card className="card-border text-center">
                                <Card.Body>
                                    <div className="text-muted small mb-1">Total de Receitas</div>
                                    <div className="h4 fw-bold text-success mb-0">{formatCurrency(totalRev)}</div>
                                    <div className="text-muted" style={{ fontSize: 11 }}>{revenues.length} lançamentos</div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={3} sm={6} className="mb-3">
                            <Card className="card-border text-center">
                                <Card.Body>
                                    <div className="text-muted small mb-1">Saldo</div>
                                    <div className={`h4 fw-bold mb-0 ${balance >= 0 ? 'text-success' : 'text-danger'}`}>
                                        {formatCurrency(balance)}
                                    </div>
                                    <div className="text-muted" style={{ fontSize: 11 }}>receitas − despesas</div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={3} sm={6} className="mb-3">
                            <Card className="card-border text-center">
                                <Card.Body>
                                    <div className="text-muted small mb-1">Saúde Financeira</div>
                                    <div className="h4 fw-bold mb-1">{healthScore}%</div>
                                    <ProgressBar
                                        now={healthScore}
                                        variant={healthScore >= 80 ? 'success' : healthScore >= 50 ? 'warning' : 'danger'}
                                        style={{ height: '4px' }}
                                    />
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Checklist + Receitas por tipo */}
                    <Row className="mb-4">
                        <Col md={6} className="mb-4">
                            <Card className="card-border h-100">
                                <Card.Header className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">
                                        <CheckCircle size={16} className="me-2" />
                                        Saúde Financeira da Frota
                                    </h5>
                                    <Badge bg={healthScore >= 80 ? 'success' : healthScore >= 50 ? 'warning' : 'danger'}>
                                        {healthScore}% OK
                                    </Badge>
                                </Card.Header>
                                <Card.Body className="p-0">
                                    {healthChecks.length === 0 ? (
                                        <div className="text-muted text-center py-4">
                                            <Info size={24} className="mb-2" />
                                            <div>Nenhum dado para análise</div>
                                        </div>
                                    ) : healthChecks.map((check, i) => (
                                        <div
                                            key={i}
                                            className={`d-flex align-items-start px-3 py-3 ${i < healthChecks.length - 1 ? 'border-bottom' : ''}`}
                                        >
                                            <div className="me-3 mt-1 flex-shrink-0">
                                                <StatusIcon status={check.status} />
                                            </div>
                                            <div>
                                                <div className="fw-semibold small">{check.item}</div>
                                                <small className="text-muted">{check.message}</small>
                                            </div>
                                        </div>
                                    ))}
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={6} className="mb-4">
                            <Card className="card-border h-100">
                                <Card.Header>
                                    <h5 className="mb-0">
                                        <TrendingUp size={16} className="me-2" />
                                        Receitas por Tipo
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    {revenueByType.length === 0 ? (
                                        <div className="text-muted text-center py-4">
                                            <Info size={24} className="mb-2" />
                                            <div>Nenhuma receita registrada</div>
                                        </div>
                                    ) : revenueByType.map((rev, i) => (
                                        <div key={i} className="mb-3">
                                            <div className="d-flex justify-content-between mb-1">
                                                <span className="small">{rev.label}</span>
                                                <strong className="small">
                                                    {formatCurrency(rev.amount)}{' '}
                                                    <span className="text-muted">({rev.percent}%)</span>
                                                </strong>
                                            </div>
                                            <ProgressBar now={rev.percent} variant="success" style={{ height: '5px' }} />
                                        </div>
                                    ))}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Despesas por categoria */}
                    <Row className="mb-4">
                        <Col>
                            <Card className="card-border">
                                <Card.Header>
                                    <h5 className="mb-0">
                                        <TrendingDown size={16} className="me-2" />
                                        Despesas por Categoria
                                    </h5>
                                </Card.Header>
                                <Card.Body className="p-0">
                                    {expenseByCategory.length === 0 ? (
                                        <div className="text-muted text-center py-4">
                                            Nenhuma despesa registrada
                                        </div>
                                    ) : (
                                        <Table className="mb-0" hover>
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Categoria</th>
                                                    <th className="text-end">Valor</th>
                                                    <th className="text-center" style={{ width: 180 }}>Participação</th>
                                                    <th className="text-center">%</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {expenseByCategory.map((cat, i) => (
                                                    <tr key={i}>
                                                        <td className="fw-semibold">{cat.label}</td>
                                                        <td className="text-end">{formatCurrency(cat.amount)}</td>
                                                        <td>
                                                            <ProgressBar
                                                                now={cat.percent}
                                                                variant={cat.percent > 50 ? 'warning' : 'primary'}
                                                                style={{ height: '6px' }}
                                                                className="mx-2"
                                                            />
                                                        </td>
                                                        <td className="text-center">
                                                            <Badge bg={cat.percent > 50 ? 'warning' : 'primary'}>
                                                                {cat.percent}%
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="table-light">
                                                <tr>
                                                    <td className="fw-bold">Total</td>
                                                    <td className="text-end fw-bold text-danger">{formatCurrency(totalExp)}</td>
                                                    <td colSpan={2} />
                                                </tr>
                                            </tfoot>
                                        </Table>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Exportação */}
                    <Row>
                        <Col>
                            <Card className="card-border">
                                <Card.Header>
                                    <h5 className="mb-0">
                                        <FileText size={16} className="me-2" />
                                        Exportar Dados
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={6}>
                                            <h6 className="mb-3">O que está incluído:</h6>
                                            <ul className="small">
                                                <li>Data, descrição, categoria, fornecedor e valor de cada despesa</li>
                                                <li>Data, descrição, tipo e valor de cada receita</li>
                                                <li>Formato CSV com BOM UTF-8 (compatível com Excel)</li>
                                            </ul>
                                        </Col>
                                        <Col md={6}>
                                            <h6 className="mb-3">Totais do período:</h6>
                                            <ul className="small list-unstyled">
                                                <li>
                                                    <Badge bg="danger" className="me-2">{expenses.length}</Badge>
                                                    despesas registradas
                                                </li>
                                                <li className="mt-1">
                                                    <Badge bg="success" className="me-2">{revenues.length}</Badge>
                                                    receitas registradas
                                                </li>
                                                <li className="mt-1">
                                                    <Badge bg={balance >= 0 ? 'success' : 'danger'} className="me-2">
                                                        {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
                                                    </Badge>
                                                    saldo do período
                                                </li>
                                            </ul>
                                        </Col>
                                    </Row>
                                    <hr />
                                    <div className="d-flex justify-content-end gap-3">
                                        <Button variant="outline-danger" size="lg" onClick={() => downloadCsv('expenses')}>
                                            <Download size={16} className="me-2" />Baixar despesas.csv
                                        </Button>
                                        <Button variant="outline-success" size="lg" onClick={() => downloadCsv('revenues')}>
                                            <Download size={16} className="me-2" />Baixar receitas.csv
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                </div>
            </SimpleBar>
        </div>
    );
};

// ─── Wrapper com layout ───────────────────────────────────────────────────────

const FleetReports = () => {
    const [showSidebar, setShowSidebar] = React.useState(true);
    return (
        <div className="hk-pg-body py-0">
            <div className={`fmapp-wrap ${!showSidebar ? 'fmapp-sidebar-toggle' : ''}`}>
                <FinancialSidebar />
                <div className="fmapp-content">
                    <div className="fmapp-detail-wrap">
                        <FinancialHeader
                            showSidebar={showSidebar}
                            toggleSidebar={() => setShowSidebar(!showSidebar)}
                        />
                        <FleetReportsBody />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FleetReports;
