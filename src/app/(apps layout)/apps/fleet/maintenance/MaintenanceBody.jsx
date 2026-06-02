'use client';
import { useState, useEffect } from 'react';
import {
  Card, Table, Badge, Button, Modal, Form, Row, Col, Nav,
  Spinner, Alert, ProgressBar,
} from 'react-bootstrap';
import { Plus, Tool, Trash2, AlertTriangle, CheckCircle, Clock, Edit2, RefreshCw, FileText } from 'react-feather';
import SimpleBar from 'simplebar-react';
import {
  getMaintenances, createMaintenance, deleteMaintenance, updateMaintenance,
  createMaintenanceRecord, getMaintenanceRecords, getDevices,
} from '@/lib/api/services/fleet';

// ─── helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABELS = { totalDistance: 'Odômetro (km)', hours: 'Horas de uso' };

const STATUS_CFG = {
  overdue:  { bg: 'danger',  icon: <AlertTriangle size={13} />, label: 'Vencida' },
  due_soon: { bg: 'warning', icon: <Clock size={13} />,         label: 'Próxima' },
  ok:       { bg: 'success', icon: <CheckCircle size={13} />,   label: 'Em dia' },
};

function formatValue(type, value) {
  if (type === 'totalDistance') return `${(value / 1000).toFixed(0)} km`;
  return `${(value / 3600).toFixed(1)} h`;
}

const EMPTY_NEW = { name: '', type: 'totalDistance', startKm: '', periodKm: '', vehicleIds: [] };
const EMPTY_RECORD = { vehicleId: '', completedAt: '', odometerKm: '', hoursAtService: '', technician: '', costBRL: '', notes: '' };

// ─── componente ───────────────────────────────────────────────────────────────

export default function MaintenanceBody() {
  const [maints,   setMaints]   = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'history'

  // add modal
  const [showAdd,  setShowAdd]  = useState(false);
  const [form,     setForm]     = useState(EMPTY_NEW);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  // edit modal
  const [editTarget,   setEditTarget]   = useState(null);
  const [editForm,     setEditForm]     = useState({});
  const [editSaving,   setEditSaving]   = useState(false);
  const [editError,    setEditError]    = useState('');

  // service record modal
  const [recordTarget, setRecordTarget] = useState(null); // maintenance object
  const [recordForm,   setRecordForm]   = useState(EMPTY_RECORD);
  const [recordSaving, setRecordSaving] = useState(false);
  const [recordError,  setRecordError]  = useState('');

  // history tab
  const [records,       setRecords]       = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [filterMaint,   setFilterMaint]   = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [m, v] = await Promise.allSettled([
        getMaintenances(),
        getDevices(),
      ]);
      if (m.status === 'fulfilled' && m.value?.length) setMaints(m.value);
      if (v.status === 'fulfilled' && v.value?.length) setVehicles(v.value);
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async () => {
    setRecordsLoading(true);
    try {
      const data = await getMaintenanceRecords();
      setRecords(Array.isArray(data) ? data : []);
    } finally {
      setRecordsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (activeTab === 'history') loadRecords(); }, [activeTab]);

  // ─── handlers add ────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, options, multiple } = e.target;
    if (multiple) {
      setForm(f => ({ ...f, [name]: [...options].filter(o => o.selected).map(o => o.value) }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.periodKm) { setError('Nome e período são obrigatórios.'); return; }
    setSaving(true); setError('');
    try {
      const isDistance = form.type === 'totalDistance';
      const multiplier = isDistance ? 1000 : 3600;
      await createMaintenance({
        name:       form.name,
        type:       form.type,
        start:      Number(form.startKm)  * multiplier,
        period:     Number(form.periodKm) * multiplier,
        vehicleIds: form.vehicleIds,
      });
      await load();
      setShowAdd(false);
      setForm(EMPTY_NEW);
    } catch (err) {
      setError(err?.message ?? 'Erro ao criar manutenção.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover esta manutenção preventiva?')) return;
    try { await deleteMaintenance(id); await load(); } catch { alert('Erro ao remover.'); }
  };

  // ─── handlers edit ────────────────────────────────────────────────────────────
  const openEdit = (m) => {
    setEditTarget(m);
    const isDistance = m.type === 'totalDistance';
    const div = isDistance ? 1000 : 3600;
    setEditForm({
      name:   m.name,
      type:   m.type,
      startKm:  (m.start  / div).toFixed(0),
      periodKm: (m.period / div).toFixed(0),
    });
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name || !editForm.periodKm) { setEditError('Nome e período são obrigatórios.'); return; }
    setEditSaving(true); setEditError('');
    try {
      const isDistance = editForm.type === 'totalDistance';
      const multiplier = isDistance ? 1000 : 3600;
      await updateMaintenance(editTarget.id, {
        name:   editForm.name,
        type:   editForm.type,
        start:  Number(editForm.startKm)  * multiplier,
        period: Number(editForm.periodKm) * multiplier,
      });
      await load();
      setEditTarget(null);
    } catch (err) {
      setEditError(err?.message ?? 'Erro ao atualizar manutenção.');
    } finally {
      setEditSaving(false);
    }
  };

  // ─── handlers service record ─────────────────────────────────────────────────
  const openRecord = (m) => {
    setRecordTarget(m);
    const today = new Date().toISOString().slice(0, 16);
    setRecordForm({ ...EMPTY_RECORD, completedAt: today });
    setRecordError('');
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    if (!recordForm.vehicleId || !recordForm.completedAt) {
      setRecordError('Veículo e data são obrigatórios.');
      return;
    }
    setRecordSaving(true); setRecordError('');
    try {
      await createMaintenanceRecord(recordTarget.id, {
        vehicleId:      recordForm.vehicleId,
        completedAt:    new Date(recordForm.completedAt).toISOString(),
        odometerKm:     recordForm.odometerKm     ? Number(recordForm.odometerKm)     : undefined,
        hoursAtService: recordForm.hoursAtService  ? Number(recordForm.hoursAtService) : undefined,
        technician:     recordForm.technician      || undefined,
        costBRL:        recordForm.costBRL         ? Number(recordForm.costBRL)        : undefined,
        notes:          recordForm.notes           || undefined,
      });
      setRecordTarget(null);
      if (activeTab === 'history') loadRecords();
    } catch (err) {
      setRecordError(err?.message ?? 'Erro ao registrar serviço.');
    } finally {
      setRecordSaving(false);
    }
  };

  // KPIs
  const overdue  = maints.reduce((a, m) => a + (m.overdue  ?? 0), 0);
  const due_soon = maints.reduce((a, m) => a + (m.due_soon ?? 0), 0);

  // filtered history
  const filteredRecords = filterMaint
    ? records.filter(r => String(r.maintenanceId) === String(filterMaint))
    : records;

  return (
    <div className="fm-body">
      <SimpleBar className="nicescroll-bar">
        <div className="container-fluid px-4 py-4">

          {/* Header */}
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h4 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <Tool size={20} className="text-primary" /> Manutenção Preventiva
              </h4>
              <small className="text-muted">Controle de revisões e serviços periódicos</small>
            </div>
            <div className="d-flex gap-2">
              <Button variant="soft-secondary" size="sm" className="d-flex align-items-center gap-1" onClick={load} disabled={loading}>
                {loading ? <Spinner size="sm" /> : <RefreshCw size={14} />} Atualizar
              </Button>
              <Button variant="primary" size="sm" className="d-flex align-items-center gap-2"
                onClick={() => { setForm(EMPTY_NEW); setError(''); setShowAdd(true); }}>
                <Plus size={15} /> Nova Manutenção
              </Button>
            </div>
          </div>

          {/* KPIs */}
          <Row className="g-3 mb-4">
            {[
              { label: 'Tipos cadastrados', value: maints.length,    color: 'primary' },
              { label: 'Vencidas',          value: overdue,          color: 'danger' },
              { label: 'Próximas (alerta)', value: due_soon,         color: 'warning' },
              { label: 'Serviços registrados', value: records.length, color: 'success' },
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

          {/* Tabs */}
          <Nav variant="tabs" className="mb-3" activeKey={activeTab} onSelect={setActiveTab}>
            <Nav.Item><Nav.Link eventKey="list"><Tool size={14} className="me-1" />Manutenções</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="history"><FileText size={14} className="me-1" />Histórico de Serviços</Nav.Link></Nav.Item>
          </Nav>

          {/* ── Tab: lista ─────────────────────────────────────────────────────── */}
          {activeTab === 'list' && (
            <>
              <Card className="card-border">
                <Card.Header className="d-flex align-items-center justify-content-between">
                  <h6 className="mb-0">Manutenções Cadastradas</h6>
                  {loading && <Spinner size="sm" />}
                </Card.Header>
                <Card.Body className="p-0">
                  {maints.length === 0
                    ? (
                    <div className="text-center py-5 text-muted">
                      <Tool size={40} className="mb-3 opacity-50" />
                      <p className="mb-0">Nenhuma manutenção cadastrada.</p>
                    </div>
                    )
                    : (
                    <Table hover className="mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th>Manutenção</th>
                          <th>Tipo</th>
                          <th>Intervalo</th>
                          <th>Início</th>
                          <th>Vencidas</th>
                          <th>Próximas</th>
                          <th className="text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {maints.map(m => (
                          <tr key={m.id}>
                            <td><strong className="small">{m.name}</strong></td>
                            <td><Badge bg="light" text="dark">{TYPE_LABELS[m.type] ?? m.type}</Badge></td>
                            <td><small>{formatValue(m.type, m.period)}</small></td>
                            <td><small className="text-muted">{formatValue(m.type, m.start)}</small></td>
                            <td>
                              {m.overdue > 0
                                ? <Badge bg="danger" className="text-white">{m.overdue} veículo{m.overdue !== 1 ? 's' : ''}</Badge>
                                : <span className="text-muted small">–</span>}
                            </td>
                            <td>
                              {m.due_soon > 0
                                ? <Badge bg="warning" text="dark">{m.due_soon} veículo{m.due_soon !== 1 ? 's' : ''}</Badge>
                                : <span className="text-muted small">–</span>}
                            </td>
                            <td className="text-center">
                              <div className="d-flex justify-content-center gap-1">
                                <Button variant="soft-success" size="sm" title="Registrar serviço realizado" onClick={() => openRecord(m)}>
                                  <CheckCircle size={13} />
                                </Button>
                                <Button variant="soft-warning" size="sm" title="Editar" onClick={() => openEdit(m)}>
                                  <Edit2 size={13} />
                                </Button>
                                <Button variant="soft-danger" size="sm" title="Remover" onClick={() => handleDelete(m.id)}>
                                  <Trash2 size={13} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                    )}
                </Card.Body>
              </Card>

              {/* Status por veículo */}
              {maints.some(m => m.deviceStatuses?.length > 0) && (
                <Card className="card-border mt-4">
                  <Card.Header><h6 className="mb-0">Status por Veículo</h6></Card.Header>
                  <Card.Body className="p-0">
                    <Table hover className="mb-0">
                      <thead className="bg-light">
                        <tr><th>Veículo</th><th>Manutenção</th><th>Atual</th><th>Próxima em</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {maints.flatMap(m =>
                          (m.deviceStatuses ?? []).map(ds => {
                            const v = vehicles.find(v => (v.traccarId ?? v.id) === ds.deviceId);
                            const cfg = STATUS_CFG[ds.status] ?? STATUS_CFG.ok;
                            return (
                              <tr key={`${m.id}-${ds.deviceId}`}>
                                <td><small className="fw-semibold">{v?.name ?? `Device #${ds.deviceId}`}</small></td>
                                <td><small>{m.name}</small></td>
                                <td><small className="text-muted">{formatValue(m.type, ds.current)}</small></td>
                                <td><small>{ds.remaining > 0 ? formatValue(m.type, ds.remaining) : '—'}</small></td>
                                <td>
                                  <Badge bg={cfg.bg} className="d-inline-flex align-items-center gap-1 text-white">
                                    {cfg.icon} {cfg.label}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              )}
            </>
          )}

          {/* ── Tab: histórico ────────────────────────────────────────────────── */}
          {activeTab === 'history' && (
            <Card className="card-border">
              <Card.Header className="d-flex align-items-center justify-content-between">
                <h6 className="mb-0">Serviços Realizados</h6>
                <div className="d-flex gap-2 align-items-center">
                  {recordsLoading && <Spinner size="sm" />}
                  <Form.Select size="sm" style={{ width: 200 }} value={filterMaint} onChange={e => setFilterMaint(e.target.value)}>
                    <option value="">Todas as manutenções</option>
                    {maints.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </Form.Select>
                  <Button variant="soft-secondary" size="sm" onClick={loadRecords}><RefreshCw size={13} /></Button>
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                {filteredRecords.length === 0
                  ? (
                  <div className="text-center py-5 text-muted">
                    <FileText size={36} className="mb-3 opacity-25" />
                    <p className="mb-0">Nenhum serviço registrado.</p>
                  </div>
                  )
                  : (
                  <SimpleBar>
                    <Table hover className="mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th>Manutenção</th>
                          <th>Veículo</th>
                          <th>Data</th>
                          <th>Odômetro</th>
                          <th>Técnico</th>
                          <th>Custo</th>
                          <th>Notas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRecords.map(r => {
                          const maint   = maints.find(m => String(m.id) === String(r.maintenanceId));
                          const vehicle = vehicles.find(v => (v._id ?? v.id) === r.vehicleId);
                          return (
                            <tr key={r._id ?? r.id}>
                              <td><small className="fw-semibold">{maint?.name ?? `#${r.maintenanceId}`}</small></td>
                              <td><small>{vehicle?.name ?? r.vehicleId ?? '–'}</small></td>
                              <td>
                                <small className="text-muted">
                                  {new Date(r.completedAt).toLocaleDateString('pt-BR')}
                                </small>
                              </td>
                              <td><small>{r.odometerKm != null ? `${r.odometerKm} km` : '–'}</small></td>
                              <td><small>{r.technician || '–'}</small></td>
                              <td>
                                <small>{r.costBRL != null
                                  ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.costBRL)
                                  : '–'}
                                </small>
                              </td>
                              <td>
                                <small className="text-muted text-truncate d-block" style={{ maxWidth: 180 }}>
                                  {r.notes || '–'}
                                </small>
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
          )}

        </div>
      </SimpleBar>

      {/* ── Modal nova manutenção ──────────────────────────────────────────────── */}
      <Modal show={showAdd} onHide={() => setShowAdd(false)} centered>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold">Nova Manutenção Preventiva</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
            <Row className="g-3">
              <Col xs={12}>
                <Form.Label className="small fw-semibold">Nome *</Form.Label>
                <Form.Control name="name" value={form.name} onChange={handleChange} placeholder="Ex: Troca de Óleo" required />
              </Col>
              <Col xs={12}>
                <Form.Label className="small fw-semibold">Tipo de controle</Form.Label>
                <Form.Select name="type" value={form.type} onChange={handleChange}>
                  <option value="totalDistance">Por odômetro (km)</option>
                  <option value="hours">Por horas de uso</option>
                </Form.Select>
              </Col>
              <Col xs={6}>
                <Form.Label className="small fw-semibold">
                  {form.type === 'totalDistance' ? 'Início (km)' : 'Início (horas)'}
                </Form.Label>
                <Form.Control
                  type="number" name="startKm" value={form.startKm} onChange={handleChange}
                  placeholder={form.type === 'totalDistance' ? 'Ex: 10000' : 'Ex: 500'}
                  min={0}
                />
                <Form.Text className="text-muted">Odômetro inicial do primeiro aviso</Form.Text>
              </Col>
              <Col xs={6}>
                <Form.Label className="small fw-semibold">
                  {form.type === 'totalDistance' ? 'Intervalo (km) *' : 'Intervalo (horas) *'}
                </Form.Label>
                <Form.Control
                  type="number" name="periodKm" value={form.periodKm} onChange={handleChange}
                  placeholder={form.type === 'totalDistance' ? 'Ex: 10000' : 'Ex: 500'}
                  min={1} required
                />
              </Col>
              {vehicles.length > 0 && (
                <Col xs={12}>
                  <Form.Label className="small fw-semibold">Vincular a veículos (opcional)</Form.Label>
                  <Form.Select name="vehicleIds" multiple value={form.vehicleIds} onChange={handleChange} style={{ height: 100 }}>
                    {vehicles.map(v => (
                      <option key={v._id ?? v.id} value={v._id ?? v.id}>{v.name}</option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">Ctrl+click para selecionar múltiplos</Form.Text>
                </Col>
              )}
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" size="sm" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button type="submit" variant="primary" size="sm" disabled={saving}>
              {saving && <Spinner size="sm" className="me-1" />}
              {saving ? 'Salvando…' : 'Criar Manutenção'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Modal editar manutenção ───────────────────────────────────────────── */}
      <Modal show={!!editTarget} onHide={() => setEditTarget(null)} centered>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold">Editar Manutenção</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {editError && <Alert variant="danger" className="py-2 small">{editError}</Alert>}
            <Row className="g-3">
              <Col xs={12}>
                <Form.Label className="small fw-semibold">Nome *</Form.Label>
                <Form.Control
                  value={editForm.name ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Troca de Óleo" required
                />
              </Col>
              <Col xs={12}>
                <Form.Label className="small fw-semibold">Tipo de controle</Form.Label>
                <Form.Select
                  value={editForm.type ?? 'totalDistance'}
                  onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}
                >
                  <option value="totalDistance">Por odômetro (km)</option>
                  <option value="hours">Por horas de uso</option>
                </Form.Select>
              </Col>
              <Col xs={6}>
                <Form.Label className="small fw-semibold">
                  {editForm.type === 'totalDistance' ? 'Início (km)' : 'Início (horas)'}
                </Form.Label>
                <Form.Control
                  type="number"
                  value={editForm.startKm ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, startKm: e.target.value }))}
                  min={0}
                />
              </Col>
              <Col xs={6}>
                <Form.Label className="small fw-semibold">
                  {editForm.type === 'totalDistance' ? 'Intervalo (km) *' : 'Intervalo (horas) *'}
                </Form.Label>
                <Form.Control
                  type="number"
                  value={editForm.periodKm ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, periodKm: e.target.value }))}
                  min={1} required
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" size="sm" onClick={() => setEditTarget(null)}>Cancelar</Button>
            <Button type="submit" variant="warning" size="sm" disabled={editSaving}>
              {editSaving && <Spinner size="sm" className="me-1" />}
              {editSaving ? 'Salvando…' : 'Salvar alterações'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Modal registrar serviço ───────────────────────────────────────────── */}
      <Modal show={!!recordTarget} onHide={() => setRecordTarget(null)} centered>
        <Form onSubmit={handleRecordSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold">
              <CheckCircle size={15} className="me-1 text-success" />
              Registrar Serviço — {recordTarget?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {recordError && <Alert variant="danger" className="py-2 small">{recordError}</Alert>}
            <Row className="g-3">
              <Col xs={12}>
                <Form.Label className="small fw-semibold">Veículo *</Form.Label>
                <Form.Select
                  value={recordForm.vehicleId}
                  onChange={e => setRecordForm(f => ({ ...f, vehicleId: e.target.value }))}
                  required
                >
                  <option value="">— Selecione —</option>
                  {vehicles.map(v => (
                    <option key={v._id ?? v.id} value={v._id ?? v.id}>
                      {v.name}{v.plate ? ` (${v.plate})` : ''}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col xs={12}>
                <Form.Label className="small fw-semibold">Data/Hora do Serviço *</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={recordForm.completedAt}
                  onChange={e => setRecordForm(f => ({ ...f, completedAt: e.target.value }))}
                  required
                />
              </Col>
              <Col xs={6}>
                <Form.Label className="small fw-semibold">Odômetro (km)</Form.Label>
                <Form.Control
                  type="number" min={0}
                  value={recordForm.odometerKm}
                  onChange={e => setRecordForm(f => ({ ...f, odometerKm: e.target.value }))}
                  placeholder="Ex: 52300"
                />
              </Col>
              <Col xs={6}>
                <Form.Label className="small fw-semibold">Custo (R$)</Form.Label>
                <Form.Control
                  type="number" min={0} step="0.01"
                  value={recordForm.costBRL}
                  onChange={e => setRecordForm(f => ({ ...f, costBRL: e.target.value }))}
                  placeholder="Ex: 350.00"
                />
              </Col>
              <Col xs={12}>
                <Form.Label className="small fw-semibold">Técnico / Oficina</Form.Label>
                <Form.Control
                  value={recordForm.technician}
                  onChange={e => setRecordForm(f => ({ ...f, technician: e.target.value }))}
                  placeholder="Ex: Auto Centro Silva"
                />
              </Col>
              <Col xs={12}>
                <Form.Label className="small fw-semibold">Observações</Form.Label>
                <Form.Control
                  as="textarea" rows={2}
                  value={recordForm.notes}
                  onChange={e => setRecordForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Peças trocadas, próxima revisão, etc."
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" size="sm" onClick={() => setRecordTarget(null)}>Cancelar</Button>
            <Button type="submit" variant="success" size="sm" disabled={recordSaving}>
              {recordSaving && <Spinner size="sm" className="me-1" />}
              {recordSaving ? 'Registrando…' : 'Confirmar Serviço'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
