'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, Badge, Table, Button, Form, InputGroup, Row, Col, Modal, Spinner, Alert } from 'react-bootstrap';
import { Search, AlertTriangle, AlertCircle, Info, CheckCircle, Eye, XCircle, RefreshCw } from 'react-feather';
import SimpleBar from 'simplebar-react';
import { getIncidents, updateIncidentStatus, todayRange } from '@/lib/api/services/fleet';

// ─── helpers ─────────────────────────────────────────────────────────────────

const severityConfig = {
  high:   { bg: 'danger',  label: 'Alta',  icon: <XCircle size={12} /> },
  medium: { bg: 'warning', label: 'Média', icon: <AlertCircle size={12} /> },
  low:    { bg: 'success', label: 'Baixa', icon: <Info size={12} /> },
};

const statusConfig = {
  open:         { bg: 'danger',    label: 'Aberta' },
  acknowledged: { bg: 'warning',   label: 'Em análise' },
  closed:       { bg: 'success',   label: 'Fechada' },
};

const typeLabels = {
  speedLimit:       '🚀 Excesso de velocidade',
  geofenceExit:     '📍 Saída de geofence',
  geofenceEnter:    '📍 Entrada em geofence',
  ignitionOff:      '🔒 Ignição desligada',
  ignitionOn:       '🔑 Ignição ligada',
  deviceOffline:    '📵 Dispositivo offline',
  hardBraking:      '🛑 Freada brusca',
  hardAcceleration: '⚡ Aceleração brusca',
  hardCornering:    '🔄 Curva brusca',
  alarm:            '🚨 Alarme',
};

// ─── componente ──────────────────────────────────────────────────────────────

export default function IncidentsBody() {
  const [incidents,      setIncidents]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [search,         setSearch]         = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus,   setFilterStatus]   = useState('');
  const [selected,       setSelected]       = useState(null);
  const [noteInput,      setNoteInput]      = useState('');
  const [updating,       setUpdating]       = useState(null); // id em atualização
  const [lastRefresh,    setLastRefresh]    = useState(null);
  const [refreshing,     setRefreshing]     = useState(false);

  // Range padrão: hoje
  const [range, setRange] = useState(() => {
    const { from, to } = todayRange();
    return { from: from.slice(0, 16), to: to.slice(0, 16) };
  });

  const load = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const data = await getIncidents({
        from: new Date(range.from).toISOString(),
        to:   new Date(range.to).toISOString(),
      });
      setIncidents(Array.isArray(data) ? data : []);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err?.message ?? 'Erro ao carregar ocorrências.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  // ─── filtros locais ──────────────────────────────────────────────────────────
  const filtered = incidents.filter(i => {
    const name = (i.vehicleName ?? '').toLowerCase();
    const type = (typeLabels[i.type] ?? i.type ?? '').toLowerCase();
    if (search && !name.includes(search.toLowerCase()) && !type.includes(search.toLowerCase())) return false;
    if (filterSeverity && i.severity !== filterSeverity) return false;
    if (filterStatus   && i.status   !== filterStatus)   return false;
    return true;
  });

  // ─── ações persistidas ───────────────────────────────────────────────────────
  const updateStatus = async (id, status, notes = '') => {
    setUpdating(id);
    try {
      const updated = await updateIncidentStatus(id, { status, notes });
      setIncidents(prev =>
        prev.map(i => (i._id ?? i.id) === id ? { ...i, ...updated } : i)
      );
      if (selected && (selected._id ?? selected.id) === id) {
        setSelected(s => ({ ...s, ...updated }));
      }
    } catch {
      alert('Erro ao atualizar ocorrência.');
    } finally {
      setUpdating(null);
    }
  };

  const handleAcknowledge = (id) => updateStatus(id, 'acknowledged');
  const handleClose = async (id) => {
    await updateStatus(id, 'closed', noteInput);
    setNoteInput('');
  };

  // ─── KPIs ────────────────────────────────────────────────────────────────────
  const open    = incidents.filter(i => i.status === 'open').length;
  const ack     = incidents.filter(i => i.status === 'acknowledged').length;
  const closed  = incidents.filter(i => i.status === 'closed').length;
  const highSev = incidents.filter(i => i.severity === 'high').length;

  return (
    <div className="fm-body">
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <SimpleBar className="nicescroll-bar">
        <div className="container-fluid px-4 py-4">

          {/* Header */}
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h4 className="fw-bold mb-0">Ocorrências</h4>
              <small className="text-muted">Alertas e eventos da frota — status persistido</small>
            </div>
            <div className="d-flex align-items-center gap-2">
              {open > 0 && (
                <span className="d-flex align-items-center gap-1 text-danger fw-bold small">
                  <AlertTriangle size={16} />
                  {open} aberta{open > 1 ? 's' : ''}
                </span>
              )}
              {lastRefresh && (
                <small className="text-muted">
                  atualizado às {lastRefresh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </small>
              )}
              <Button
                variant="soft-secondary"
                size="sm"
                className="d-flex align-items-center gap-1"
                disabled={refreshing || loading}
                onClick={() => load(false)}
              >
                <RefreshCw size={13} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
                {refreshing ? 'Atualizando…' : 'Atualizar'}
              </Button>
            </div>
          </div>

          {error && <Alert variant="danger" className="py-2 small mb-3">{error}</Alert>}

          {/* KPIs */}
          <Row className="g-3 mb-4">
            {[
              { label: 'Abertas',         value: open,    color: 'danger' },
              { label: 'Em análise',      value: ack,     color: 'warning' },
              { label: 'Fechadas',        value: closed,  color: 'success' },
              { label: 'Severidade Alta', value: highSev, color: 'danger' },
            ].map(k => (
              <Col key={k.label} xs={6} md={3}>
                <Card className="card-border text-center">
                  <Card.Body className="py-3">
                    <h3 className={`fw-bold text-${k.color} mb-0`}>{loading ? '…' : k.value}</h3>
                    <small className="text-muted">{k.label}</small>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Filtro de período */}
          <Card className="card-border mb-3">
            <Card.Body>
              <Row className="g-2 align-items-end">
                <Col md={3}>
                  <Form.Label className="small fw-semibold mb-1">Data inicial</Form.Label>
                  <Form.Control
                    type="datetime-local" value={range.from}
                    onChange={e => setRange(r => ({ ...r, from: e.target.value }))}
                  />
                </Col>
                <Col md={3}>
                  <Form.Label className="small fw-semibold mb-1">Data final</Form.Label>
                  <Form.Control
                    type="datetime-local" value={range.to}
                    onChange={e => setRange(r => ({ ...r, to: e.target.value }))}
                  />
                </Col>
                <Col md={2}>
                  <Button variant="primary" className="w-100" disabled={loading} onClick={() => load()}>
                    {loading ? <Spinner size="sm" /> : 'Filtrar'}
                  </Button>
                </Col>
                <Col md={2}>
                  <InputGroup>
                    <InputGroup.Text><Search size={14} /></InputGroup.Text>
                    <Form.Control
                      placeholder="Buscar..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col md={1}>
                  <Form.Select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
                    <option value="">Sev.</option>
                    <option value="high">Alta</option>
                    <option value="medium">Média</option>
                    <option value="low">Baixa</option>
                  </Form.Select>
                </Col>
                <Col md={1}>
                  <Form.Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">Status</option>
                    <option value="open">Aberta</option>
                    <option value="acknowledged">Análise</option>
                    <option value="closed">Fechada</option>
                  </Form.Select>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Tabela */}
          <Card className="card-border">
            <Card.Body className="p-0">
              {loading
                ? <div className="text-center py-5"><Spinner /></div>
                : filtered.length === 0
                  ? (
                    <div className="text-center py-5 text-muted">
                      <AlertTriangle size={36} className="mb-3 opacity-25" />
                      <p className="mb-0">Nenhuma ocorrência no período.</p>
                    </div>
                  )
                  : (
                  <SimpleBar>
                    <Table hover className="mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th>Tipo</th>
                          <th>Veículo</th>
                          <th>Severidade</th>
                          <th>Status</th>
                          <th>Local</th>
                          <th>Horário</th>
                          <th className="text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(inc => {
                          const sev  = severityConfig[inc.severity] || severityConfig.low;
                          const sts  = statusConfig[inc.status]     || statusConfig.open;
                          const iid  = inc._id ?? inc.id;
                          const busy = updating === iid;
                          return (
                            <tr
                              key={iid}
                              className={inc.status === 'open' && inc.severity === 'high' ? 'table-danger' : ''}
                            >
                              <td>
                                <span className="small fw-semibold">
                                  {typeLabels[inc.type] || inc.type}
                                </span>
                              </td>
                              <td>
                                <small className="fw-semibold">{inc.vehicleName ?? `Device #${inc.deviceId}`}</small>
                                {inc.vehiclePlate && <small className="text-muted d-block">{inc.vehiclePlate}</small>}
                              </td>
                              <td>
                                <Badge bg={sev.bg} className="d-inline-flex align-items-center gap-1 text-white">
                                  {sev.icon} {sev.label}
                                </Badge>
                              </td>
                              <td>
                                <Badge bg={sts.bg} className="text-white">{sts.label}</Badge>
                              </td>
                              <td>
                                <small className="text-muted text-truncate d-block" style={{ maxWidth: 180 }}>
                                  {inc.address || (inc.lat && inc.lng ? `${inc.lat?.toFixed(4)}, ${inc.lng?.toFixed(4)}` : '–')}
                                </small>
                              </td>
                              <td>
                                <small className="text-muted">
                                  {new Date(inc.eventTime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </small>
                              </td>
                              <td className="text-center">
                                <div className="d-flex justify-content-center gap-1">
                                  <Button variant="soft-primary" size="sm" onClick={() => { setSelected(inc); setNoteInput(''); }}>
                                    <Eye size={13} />
                                  </Button>
                                  {inc.status === 'open' && (
                                    <Button variant="soft-warning" size="sm" disabled={busy} title="Reconhecer"
                                      onClick={() => handleAcknowledge(iid)}>
                                      {busy ? <Spinner size="sm" /> : <AlertCircle size={13} />}
                                    </Button>
                                  )}
                                  {inc.status !== 'closed' && (
                                    <Button variant="soft-success" size="sm" disabled={busy} title="Fechar"
                                      onClick={() => setSelected({ ...inc, _closingMode: true })}>
                                      <CheckCircle size={13} />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </SimpleBar>
                )}
            </Card.Body>
          </Card>
        </div>
      </SimpleBar>

      {/* Modal detalhe / fechar */}
      <Modal show={!!selected} onHide={() => setSelected(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6">
            {typeLabels[selected?.type] || selected?.type}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selected && (
            <Row className="g-3">
              {[
                { label: 'Veículo',    value: selected.vehicleName ?? `Device #${selected.deviceId}` },
                { label: 'Placa',      value: selected.vehiclePlate ?? '–' },
                { label: 'Severidade', value: severityConfig[selected.severity]?.label ?? '–' },
                { label: 'Status',     value: statusConfig[selected.status]?.label ?? '–' },
                { label: 'Endereço',   value: selected.address || '–' },
                { label: 'Data/Hora',  value: new Date(selected.eventTime).toLocaleString('pt-BR') },
                ...(selected.acknowledgedAt ? [{ label: 'Reconhecida em', value: new Date(selected.acknowledgedAt).toLocaleString('pt-BR') }] : []),
                ...(selected.closedAt       ? [{ label: 'Fechada em',     value: new Date(selected.closedAt).toLocaleString('pt-BR') }] : []),
                ...(selected.notes          ? [{ label: 'Observações',    value: selected.notes }] : []),
              ].map(item => (
                <Col xs={6} key={item.label}>
                  <small className="text-muted d-block">{item.label}</small>
                  <strong className="small">{item.value}</strong>
                </Col>
              ))}

              {/* Campo de nota ao fechar */}
              {selected._closingMode && (
                <Col xs={12}>
                  <Form.Label className="small fw-semibold">Observações ao fechar (opcional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={noteInput}
                    onChange={e => setNoteInput(e.target.value)}
                    placeholder="Descreva a resolução..."
                  />
                </Col>
              )}
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          {selected?.status === 'open' && !selected?._closingMode && (
            <Button variant="warning" size="sm" disabled={updating === (selected._id ?? selected.id)}
              onClick={() => { handleAcknowledge(selected._id ?? selected.id); }}>
              {updating === (selected._id ?? selected.id) ? <Spinner size="sm" /> : 'Reconhecer'}
            </Button>
          )}
          {selected?.status !== 'closed' && !selected?._closingMode && (
            <Button variant="soft-success" size="sm"
              onClick={() => setSelected(s => ({ ...s, _closingMode: true }))}>
              Fechar Ocorrência
            </Button>
          )}
          {selected?._closingMode && (
            <Button variant="success" size="sm" disabled={updating === (selected._id ?? selected.id)}
              onClick={() => handleClose(selected._id ?? selected.id)}>
              {updating === (selected._id ?? selected.id) ? <Spinner size="sm" /> : 'Confirmar Fechamento'}
            </Button>
          )}
          <Button variant="light" size="sm" onClick={() => setSelected(null)}>Fechar</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
