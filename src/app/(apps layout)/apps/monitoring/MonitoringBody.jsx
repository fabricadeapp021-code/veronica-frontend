'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Button,
  Card,
  Col,
  Container,
  Row,
  Form,
  InputGroup,
  Badge,
  Alert,
  Spinner,
  Modal,
  Pagination,
} from 'react-bootstrap';
import {
  Activity,
  Search,
  RefreshCw,
  Filter,
  AlertCircle,
  Info,
  AlertTriangle,
  XCircle,
  Download,
} from 'react-feather';
import SimpleBar from 'simplebar-react';
import HkDataTable from '@/components/@hk-data-table';
import { listAuditLogs, getAuditStats, getAuditLogById } from '@/lib/api/services/audit';
import { listUsers } from '@/lib/api/services/users';
import { useAuth } from '@/lib/auth/AuthProvider';

const DEFAULT_FILTERS = {
  searchTerm: '',
  level: '',
  context: '',
  userId: '',
  startDate: '',
  endDate: '',
};

const MonitoringBody = ({ bindActions }) => {
  const { user } = useAuth();
  const isEmployee = user?.role === 'employee';

  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState(DEFAULT_FILTERS.searchTerm);
  const [levelFilter, setLevelFilter] = useState(DEFAULT_FILTERS.level);
  const [contextFilter, setContextFilter] = useState(DEFAULT_FILTERS.context);
  const [userIdFilter, setUserIdFilter] = useState(DEFAULT_FILTERS.userId);
  const [startDate, setStartDate] = useState(DEFAULT_FILTERS.startDate);
  const [endDate, setEndDate] = useState(DEFAULT_FILTERS.endDate);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalLogs: 0,
    totalPages: 1,
  });

  const [showModal, setShowModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadUsers = useCallback(async () => {
    if (isEmployee) return;
    try {
      const raw = await listUsers();
      const list = Array.isArray(raw) ? raw : (raw?.users ?? raw?.data ?? []);
      setUsers(list);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    }
  }, [isEmployee]);

  const loadLogs = useCallback(
    async (showRefreshSpinner = false) => {
      try {
        if (showRefreshSpinner) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError('');

        const response = await listAuditLogs({
          page: pagination.page,
          limit: pagination.limit,
          search: appliedFilters.searchTerm || undefined,
          level: appliedFilters.level || undefined,
          context: appliedFilters.context || undefined,
          userId: appliedFilters.userId || undefined,
          startDate: appliedFilters.startDate || undefined,
          endDate: appliedFilters.endDate || undefined,
        });

        if (response.success && response.data) {
          setLogs(response.data.logs || []);
          setPagination((prev) => ({
            ...prev,
            totalLogs: response.data.pagination?.totalLogs || 0,
            totalPages: response.data.pagination?.totalPages || 1,
          }));
        } else {
          setError(response.message || 'Erro ao carregar logs');
          setLogs([]);
        }
      } catch (err) {
        setError(err?.body?.message || err?.message || 'Erro ao carregar logs');
        setLogs([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [appliedFilters, pagination.page, pagination.limit],
  );

  const loadStats = useCallback(async () => {
    try {
      const response = await getAuditStats({
        startDate: appliedFilters.startDate || undefined,
        endDate: appliedFilters.endDate || undefined,
      });

      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  }, [appliedFilters.startDate, appliedFilters.endDate]);

  const loadLogDetail = async (logId) => {
    try {
      setLoadingDetail(true);
      const response = await getAuditLogById(logId);
      if (response.success && response.data) {
        setSelectedLog(response.data);
        setShowModal(true);
      }
    } catch (err) {
      setError(err?.body?.message || err?.message || 'Erro ao carregar detalhes do log');
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [loadLogs, loadStats]);

  const handleRefresh = useCallback(() => {
    loadLogs(true);
    loadStats();
  }, [loadLogs, loadStats]);

  const handleExportLogs = useCallback(() => {
    if (!logs.length) return;

    const headers = ['Timestamp', 'Nivel', 'Mensagem', 'Contexto', 'Usuario', 'Acao'];
    const rows = logs.map((log) => [
      log.timestamp || '',
      log.level || '',
      log.message || '',
      log.context || '',
      log.userEmail || '',
      log.action || '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';'))
      .join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-page-${pagination.page}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [logs, pagination.page]);

  useEffect(() => {
    if (!bindActions) return undefined;
    bindActions({
      refresh: handleRefresh,
      exportLogs: handleExportLogs,
    });
    return () => bindActions({});
  }, [bindActions, handleRefresh, handleExportLogs]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const getLevelBadge = (level) => {
    const variants = {
      debug: 'secondary',
      info: 'primary',
      warn: 'warning',
      error: 'danger',
    };
    const icons = {
      debug: <Filter size={12} />,
      info: <Info size={12} />,
      warn: <AlertTriangle size={12} />,
      error: <XCircle size={12} />,
    };
    return (
      <Badge bg={variants[level] || 'secondary'} className="d-inline-flex align-items-center gap-1">
        {icons[level]}
        {level?.toUpperCase() || 'N/A'}
      </Badge>
    );
  };

  const columns = [
    {
      title: 'Timestamp',
      accessor: 'timestamp',
      sort: true,
      cellFormatter: (value) => <span className="text-nowrap">{formatTimestamp(value)}</span>,
    },
    {
      title: 'Nível',
      accessor: 'level',
      sort: true,
      cellFormatter: (value) => getLevelBadge(value),
    },
    {
      title: 'Mensagem',
      accessor: 'message',
      sort: false,
      cellFormatter: (value) => (
        <div className="text-truncate" style={{ maxWidth: '300px' }} title={value}>
          {value}
        </div>
      ),
    },
    {
      title: 'Contexto',
      accessor: 'context',
      sort: true,
      cellFormatter: (value) => (
        <Badge bg="light" text="dark">
          {value || '-'}
        </Badge>
      ),
    },
    {
      title: 'Usuário',
      accessor: 'userEmail',
      sort: true,
      cellFormatter: (value, row) => (
        <div>
          <div className="text-truncate" style={{ maxWidth: '150px' }} title={value}>
            {value || '-'}
          </div>
          {row.userName && <small className="text-muted d-block">{row.userName}</small>}
        </div>
      ),
    },
    {
      title: 'Ações',
      accessor: '_id',
      sort: false,
      cellFormatter: (value) => (
        <Button variant="light" size="sm" onClick={() => loadLogDetail(value)} disabled={loadingDetail}>
          Detalhes
        </Button>
      ),
    },
  ];

  const handleApplyFilters = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setAppliedFilters({
      searchTerm: searchTerm.trim(),
      level: levelFilter,
      context: contextFilter,
      userId: userIdFilter,
      startDate,
      endDate,
    });
  };

  const handleClearFilters = () => {
    setSearchTerm(DEFAULT_FILTERS.searchTerm);
    setLevelFilter(DEFAULT_FILTERS.level);
    setContextFilter(DEFAULT_FILTERS.context);
    setUserIdFilter(DEFAULT_FILTERS.userId);
    setStartDate(DEFAULT_FILTERS.startDate);
    setEndDate(DEFAULT_FILTERS.endDate);
    setPagination((prev) => ({ ...prev, page: 1 }));
    setAppliedFilters(DEFAULT_FILTERS);
  };

  const uniqueContexts = useMemo(() => {
    const contexts = logs.map((log) => log.context).filter(Boolean);
    return [...new Set(contexts)];
  }, [logs]);

  const visiblePages = useMemo(() => {
    const pages = [];
    const start = Math.max(1, pagination.page - 2);
    const end = Math.min(pagination.totalPages, pagination.page + 2);
    for (let p = start; p <= end; p += 1) pages.push(p);
    return pages;
  }, [pagination.page, pagination.totalPages]);

  if (loading && !logs.length) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Carregando...</span>
        </Spinner>
        <p className="mt-3">Carregando logs...</p>
      </Container>
    );
  }

  return (
    <div className="fm-body">
      <SimpleBar className="nicescroll-bar">
        <div className="container-fluid px-4 py-4">
          <div className="mb-4 d-flex gap-2">
            <Button
              variant="primary"
              onClick={handleRefresh}
              disabled={refreshing}
              className="d-flex align-items-center gap-2"
            >
              <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Atualizando...' : 'Atualizar'}
            </Button>
            <Button
              variant="outline-secondary"
              onClick={handleExportLogs}
              disabled={!logs.length}
              className="d-flex align-items-center gap-2"
            >
              <Download size={16} />
              Exportar Página
            </Button>
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {stats && (
            <Row className="mb-4">
              <Col lg={3} md={6} className="mb-3">
                <Card className="card-border">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="text-muted d-block mb-1">Total</span>
                        <h3 className="mb-0">{stats.total || 0}</h3>
                      </div>
                      <div className="avatar avatar-icon avatar-lg avatar-soft-primary avatar-rounded">
                        <Activity />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={3} md={6} className="mb-3">
                <Card className="card-border">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="text-muted d-block mb-1">Info</span>
                        <h3 className="mb-0">{stats.byLevel?.info || 0}</h3>
                      </div>
                      <div className="avatar avatar-icon avatar-lg avatar-soft-primary avatar-rounded">
                        <Info />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={3} md={6} className="mb-3">
                <Card className="card-border">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="text-muted d-block mb-1">Avisos</span>
                        <h3 className="mb-0">{stats.byLevel?.warn || 0}</h3>
                      </div>
                      <div className="avatar avatar-icon avatar-lg avatar-soft-warning avatar-rounded">
                        <AlertTriangle />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={3} md={6} className="mb-3">
                <Card className="card-border">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="text-muted d-block mb-1">Erros</span>
                        <h3 className="mb-0">{stats.byLevel?.error || 0}</h3>
                      </div>
                      <div className="avatar avatar-icon avatar-lg avatar-soft-danger avatar-rounded">
                        <AlertCircle />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          <Card className="card-border mb-4">
            <Card.Body>
              <Row className="gx-3">
                <Col lg={4} className="mb-3">
                  <Form.Label>Buscar</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <Search size={16} />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Buscar na mensagem..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Col>

                <Col lg={2} className="mb-3">
                  <Form.Label>Nível</Form.Label>
                  <Form.Select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
                    <option value="">Todos</option>
                    <option value="debug">Debug</option>
                    <option value="info">Info</option>
                    <option value="warn">Warn</option>
                    <option value="error">Error</option>
                  </Form.Select>
                </Col>

                <Col lg={2} className="mb-3">
                  <Form.Label>Contexto</Form.Label>
                  <Form.Select value={contextFilter} onChange={(e) => setContextFilter(e.target.value)}>
                    <option value="">Todos</option>
                    {uniqueContexts.map((ctx) => (
                      <option key={ctx} value={ctx}>
                        {ctx}
                      </option>
                    ))}
                  </Form.Select>
                </Col>

                {!isEmployee && (
                  <Col lg={2} className="mb-3">
                    <Form.Label>Usuário</Form.Label>
                    <Form.Select value={userIdFilter} onChange={(e) => setUserIdFilter(e.target.value)}>
                      <option value="">Todos</option>
                      {users.map((u) => {
                        const userId = u._id || u.id;
                        return (
                          <option key={userId} value={userId}>
                            {u.name || u.email}
                          </option>
                        );
                      })}
                    </Form.Select>
                  </Col>
                )}

                <Col lg={2} className="mb-3 d-flex align-items-end gap-2">
                  <Button variant="primary" onClick={handleApplyFilters} className="flex-fill">
                    Filtrar
                  </Button>
                  <Button variant="light" onClick={handleClearFilters}>
                    Limpar
                  </Button>
                </Col>
              </Row>

              <Row className="gx-3">
                <Col lg={3} className="mb-3">
                  <Form.Label>Data Início</Form.Label>
                  <Form.Control type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </Col>
                <Col lg={3} className="mb-3">
                  <Form.Label>Data Fim</Form.Label>
                  <Form.Control type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="card-border">
            <Card.Header className="card-header-action">
              <h6 className="mb-0">
                Logs de Auditoria
                <Badge bg="light" text="dark" className="ms-2">
                  {pagination.totalLogs} {pagination.totalLogs === 1 ? 'log' : 'logs'}
                </Badge>
              </h6>
            </Card.Header>
            <Card.Body className="p-0">
              {logs.length === 0 ? (
                <div className="text-center py-5">
                  <AlertCircle size={48} className="text-muted mb-3" />
                  <p className="text-muted">Nenhum log encontrado</p>
                </div>
              ) : (
                <HkDataTable
                  column={columns}
                  rowData={logs}
                  rowSelection={false}
                  classes="nowrap w-100 mb-5"
                  responsive
                />
              )}
            </Card.Body>
            {pagination.totalPages > 1 && (
              <Card.Footer className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  Página {pagination.page} de {pagination.totalPages}
                </small>
                <Pagination className="mb-0">
                  <Pagination.Prev
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  />
                  {visiblePages.map((p) => (
                    <Pagination.Item
                      key={p}
                      active={p === pagination.page}
                      onClick={() => setPagination((prev) => ({ ...prev, page: p }))}
                    >
                      {p}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  />
                </Pagination>
              </Card.Footer>
            )}
          </Card>
        </div>
      </SimpleBar>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Detalhes do Log</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedLog && (
            <SimpleBar style={{ maxHeight: '500px' }}>
              <div className="mb-3">
                <strong>Timestamp:</strong> {formatTimestamp(selectedLog.timestamp)}
              </div>
              <div className="mb-3">
                <strong>Nível:</strong> {getLevelBadge(selectedLog.level)}
              </div>
              <div className="mb-3">
                <strong>Mensagem:</strong>
                <div className="mt-2 p-3 bg-light rounded">{selectedLog.message}</div>
              </div>
              <div className="mb-3">
                <strong>Contexto:</strong>{' '}
                <Badge bg="light" text="dark">
                  {selectedLog.context || '-'}
                </Badge>
              </div>
              <div className="mb-3">
                <strong>Usuário:</strong>
                <div className="mt-2">
                  <div>
                    <strong>Email:</strong> {selectedLog.userEmail || '-'}
                  </div>
                  <div>
                    <strong>Nome:</strong> {selectedLog.userName || '-'}
                  </div>
                  <div>
                    <strong>ID:</strong> <code>{selectedLog.userId || '-'}</code>
                  </div>
                </div>
              </div>
              {selectedLog.http && (
                <div className="mb-3">
                  <strong>HTTP:</strong>
                  <div className="mt-2 p-3 bg-light rounded">
                    <div>
                      <strong>Método:</strong> {selectedLog.http.method || '-'}
                    </div>
                    <div>
                      <strong>URL:</strong> {selectedLog.http.url || '-'}
                    </div>
                    <div>
                      <strong>Status:</strong> {selectedLog.http.statusCode || '-'}
                    </div>
                    <div>
                      <strong>IP:</strong> {selectedLog.http.ip || '-'}
                    </div>
                  </div>
                </div>
              )}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div className="mb-3">
                  <strong>Metadados:</strong>
                  <pre className="mt-2 p-3 bg-light rounded" style={{ fontSize: '12px' }}>
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
              {selectedLog.error && (
                <div className="mb-3">
                  <strong>Erro:</strong>
                  <div className="mt-2 p-3 bg-danger bg-opacity-10 rounded text-danger">
                    <div>
                      <strong>Mensagem:</strong> {selectedLog.error.message || '-'}
                    </div>
                    {selectedLog.error.stack && (
                      <pre className="mt-2" style={{ fontSize: '11px' }}>
                        {selectedLog.error.stack}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </SimpleBar>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowModal(false)}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MonitoringBody;
