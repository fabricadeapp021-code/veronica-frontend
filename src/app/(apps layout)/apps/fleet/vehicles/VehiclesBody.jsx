'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, Badge, Table, Button, Form, InputGroup, Modal, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { Search, Plus, Truck, Wifi, WifiOff, MapPin, Eye, Layers, Sliders, Edit2, Trash2, Check, X, UserCheck, Link2, Slash, Cpu } from 'react-feather';
import SimpleBar from 'simplebar-react';
import Link from 'next/link';
import { getDevices, getPositions, getGroups, getDrivers, updateAccumulator, updateGroup, assignDriver, getTraccarDevices, linkTraccarDevice, unlinkTraccarDevice } from '@/lib/api/services/fleet';
import { apiRequest } from '@/lib/api/client';

const EMPTY_VEHICLE = { name: '', plate: '', model: '', brand: '', year: '', color: '', category: 'truck', fuelType: 'diesel', notes: '' };
const EMPTY_GROUP   = { name: '', description: '' };

const statusConfig = {
  online:  { bg: 'success',   label: 'Online',  icon: <Wifi size={12} /> },
  offline: { bg: 'danger',    label: 'Offline', icon: <WifiOff size={12} /> },
  unknown: { bg: 'secondary', label: 'Inativo', icon: <WifiOff size={12} /> },
};

const categoryLabel = { truck: 'Caminhão', van: 'Van', car: 'Carro', motorcycle: 'Moto', bus: 'Ônibus' };

export default function VehiclesBody() {
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilter]       = useState('');
  const [selected,     setSelected]     = useState(null);
  const [vehicles,     setVehicles]     = useState([]);
  const [positions,    setPositions]    = useState([]);
  const [loading,      setLoading]      = useState(true);

  // modal adicionar / editar veículo
  const [showAdd,   setShowAdd]   = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = novo, object = editar
  const [form,      setForm]      = useState(EMPTY_VEHICLE);
  const [saving,    setSaving]    = useState(false);
  const [addError,  setAddError]  = useState('');

  // modal grupos
  const [showGroup,   setShowGroup]   = useState(false);
  const [groups,      setGroups]      = useState([]);
  const [groupForm,   setGroupForm]   = useState(EMPTY_GROUP);
  const [groupSaving, setGroupSaving] = useState(false);
  const [groupError,  setGroupError]  = useState('');
  const [renamingId,  setRenamingId]  = useState(null);
  const [renameVal,   setRenameVal]   = useState('');
  const [renameSaving, setRenameSaving] = useState(false);

  // modal odômetro
  const [showOdo,    setShowOdo]    = useState(false);
  const [odoVehicle, setOdoVehicle] = useState(null);
  const [odoKm,      setOdoKm]      = useState('');
  const [odoHours,   setOdoHours]   = useState('');
  const [odoSaving,  setOdoSaving]  = useState(false);
  const [odoError,   setOdoError]   = useState('');
  const [odoSuccess, setOdoSuccess] = useState('');

  // assign driver modal
  const [showAssign,    setShowAssign]    = useState(false);
  const [assignVehicle, setAssignVehicle] = useState(null);
  const [allDrivers,    setAllDrivers]    = useState([]);
  const [assignDriver_,  setAssignDriver_]  = useState('');
  const [assignSaving,  setAssignSaving]  = useState(false);
  const [assignError,   setAssignError]   = useState('');

  // vincular device GPS ao veículo
  const [showLinkDevice,   setShowLinkDevice]   = useState(false);
  const [linkDeviceTarget, setLinkDeviceTarget] = useState(null); // vehicle
  const [traccarDevices,   setTraccarDevices]   = useState([]);
  const [linkDeviceId,     setLinkDeviceId]     = useState('');
  const [linkDeviceSaving, setLinkDeviceSaving] = useState(false);
  const [linkDeviceError,  setLinkDeviceError]  = useState('');

  // ── carrega dados ────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [vehs, pos, grps, drvs, tracDev] = await Promise.all([
        getDevices({ all: true }),
        getPositions(),
        getGroups(),
        getDrivers(),
        getTraccarDevices(),
      ]);
      setVehicles(Array.isArray(vehs)     ? vehs     : []);
      setPositions(Array.isArray(pos)     ? pos      : []);
      setGroups(Array.isArray(grps)       ? grps     : []);
      setAllDrivers(Array.isArray(drvs)   ? drvs     : []);
      setTraccarDevices(Array.isArray(tracDev) ? tracDev : []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── helpers ──────────────────────────────────────────────────────────────────
  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_VEHICLE);
    setAddError('');
    setShowAdd(true);
  };

  const openEdit = (v) => {
    setEditTarget(v);
    setForm({
      name:     v.name     ?? '',
      plate:    v.plate    ?? '',
      model:    v.model    ?? '',
      brand:    v.brand    ?? '',
      year:     v.year     ?? '',
      color:    v.color    ?? '',
      category: v.category ?? 'truck',
      fuelType: v.fuelType ?? 'diesel',
      notes:    v.notes    ?? '',
    });
    setAddError('');
    setShowAdd(true);
  };

  // ── criar / editar veículo ───────────────────────────────────────────────────
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.plate) { setAddError('Nome e placa são obrigatórios.'); return; }
    setSaving(true); setAddError('');
    try {
      const body = { ...form, year: form.year ? Number(form.year) : undefined };
      if (editTarget) {
        const id = editTarget._id ?? editTarget.id;
        const updated = await apiRequest(`/fleet/vehicles/${id}`, { method: 'PUT', body });
        setVehicles(prev => prev.map(v => (v._id ?? v.id) === id ? (updated?.data ?? updated) : v));
      } else {
        const created = await apiRequest('/fleet/vehicles', { method: 'POST', body });
        setVehicles(prev => [created?.data ?? created, ...prev]);
      }
      setShowAdd(false);
    } catch (err) {
      setAddError(err?.body?.message || err?.message || 'Erro ao salvar veículo.');
    } finally {
      setSaving(false);
    }
  };

  // ── deletar veículo ──────────────────────────────────────────────────────────
  const handleDelete = async (v) => {
    if (!confirm(`Remover permanentemente "${v.name}"?\n\nO device Traccar vinculado NÃO será removido.`)) return;
    try {
      await apiRequest(`/fleet/vehicles/${v._id ?? v.id}`, { method: 'DELETE' });
      setVehicles(prev => prev.filter(x => (x._id ?? x.id) !== (v._id ?? v.id)));
    } catch (err) {
      alert(err?.body?.message || err?.message || 'Erro ao remover veículo.');
    }
  };

  // ── vincular motorista ────────────────────────────────────────────────────────
  const openAssign = (v) => {
    setAssignVehicle(v);
    setAssignDriver_(v.defaultDriverId ?? '');
    setAssignError('');
    setShowAssign(true);
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setAssignSaving(true); setAssignError('');
    try {
      const updated = await assignDriver(assignVehicle._id ?? assignVehicle.id, assignDriver_ || null);
      setVehicles(prev => prev.map(x => (x._id ?? x.id) === (assignVehicle._id ?? assignVehicle.id) ? { ...x, ...(updated?.data ?? updated) } : x));
      setShowAssign(false);
    } catch (err) {
      setAssignError(err?.message ?? 'Erro ao vincular motorista.');
    } finally {
      setAssignSaving(false);
    }
  };

  // ── grupos ───────────────────────────────────────────────────────────────────
  const handleGroupSubmit = async (e) => {
    e.preventDefault();
    if (!groupForm.name) { setGroupError('Nome é obrigatório.'); return; }
    setGroupSaving(true); setGroupError('');
    try {
      const created = await apiRequest('/fleet/groups', { method: 'POST', body: groupForm });
      setGroups(prev => [created?.data ?? created, ...prev]);
      setGroupForm(EMPTY_GROUP);
    } catch (err) {
      setGroupError(err?.body?.message || err?.message || 'Erro ao criar grupo.');
    } finally {
      setGroupSaving(false);
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!confirm('Remover este grupo?')) return;
    try {
      await apiRequest(`/fleet/groups/${id}`, { method: 'DELETE' });
      setGroups(prev => prev.filter(g => (g._id ?? g.id) !== id));
    } catch { alert('Erro ao remover grupo.'); }
  };

  const startRename = (g) => {
    setRenamingId(g._id ?? g.id);
    setRenameVal(g.name);
  };

  const cancelRename = () => { setRenamingId(null); setRenameVal(''); };

  const handleRename = async (g) => {
    if (!renameVal.trim()) return cancelRename();
    setRenameSaving(true);
    try {
      const id = g._id ?? g.id;
      const updated = await updateGroup(id, { name: renameVal.trim() });
      setGroups(prev => prev.map(x => (x._id ?? x.id) === id ? { ...x, name: renameVal.trim() } : x));
      setRenamingId(null);
    } catch { alert('Erro ao renomear grupo.'); }
    setRenameSaving(false);
  };

  // ── vincular device GPS ──────────────────────────────────────────────────────
  const openLinkDevice = (vehicle) => {
    setLinkDeviceTarget(vehicle);
    setLinkDeviceId('');
    setLinkDeviceError('');
    setShowLinkDevice(true);
  };

  const handleLinkDevice = async (e) => {
    e.preventDefault();
    if (!linkDeviceId) { setLinkDeviceError('Selecione um dispositivo GPS.'); return; }
    setLinkDeviceSaving(true); setLinkDeviceError('');
    try {
      await linkTraccarDevice(Number(linkDeviceId), linkDeviceTarget._id ?? linkDeviceTarget.id);
      await load();
      setShowLinkDevice(false);
    } catch (err) {
      setLinkDeviceError(err?.body?.message || err?.message || 'Erro ao vincular device.');
    } finally {
      setLinkDeviceSaving(false);
    }
  };

  const handleUnlinkDevice = async (v) => {
    if (!confirm(`Desvincular o device GPS #${v.traccarId} do veículo "${v.name}"?\n\nO device continuará no Traccar, mas não terá mais telemetria associada a este veículo.`)) return;
    try {
      await unlinkTraccarDevice(v.traccarId);
      await load();
    } catch (err) {
      alert(err?.body?.message || err?.message || 'Erro ao desvincular device.');
    }
  };

  // ── odômetro ─────────────────────────────────────────────────────────────────
  const openOdo = (vehicle) => {
    setOdoVehicle(vehicle);
    setOdoKm(vehicle.currentOdometerKm ?? '');
    setOdoHours('');
    setOdoError('');
    setOdoSuccess('');
    setShowOdo(true);
  };

  const handleOdoSubmit = async (e) => {
    e.preventDefault();
    const traccarId = odoVehicle?.traccarId ?? odoVehicle?.telemetry?.id;
    if (!traccarId) { setOdoError('Este veículo não tem rastreador Traccar vinculado.'); return; }
    if (!odoKm && !odoHours) { setOdoError('Informe ao menos o odômetro (km) ou as horas.'); return; }
    setOdoSaving(true); setOdoError(''); setOdoSuccess('');
    try {
      await updateAccumulator(traccarId, Number(odoKm) || 0, Number(odoHours) || 0);
      setOdoSuccess(`Odômetro atualizado: ${odoKm} km`);
      setVehicles(prev => prev.map(v =>
        (v._id ?? v.id) === (odoVehicle._id ?? odoVehicle.id)
          ? { ...v, currentOdometerKm: Number(odoKm) }
          : v,
      ));
    } catch (err) {
      setOdoError(err?.message ?? 'Erro ao atualizar odômetro.');
    } finally {
      setOdoSaving(false);
    }
  };

  // ── detect dark mode ──────────────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.getAttribute('data-bs-theme') === 'dark');
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] });
    return () => observer.disconnect();
  }, []);

  // ── filtros ───────────────────────────────────────────────────────────────────
  const filtered = vehicles
    .filter(v => !search || v.name?.toLowerCase().includes(search.toLowerCase()) || (v.plate ?? '').toLowerCase().includes(search.toLowerCase()))
    .filter(v => !filterStatus || v.status === filterStatus || v.telemetry?.status === filterStatus)
    .map(v => ({ ...v, position: positions.find(p => p.id === v.positionId) }));

  const online  = vehicles.filter(v => (v.telemetry?.status ?? v.status) === 'online').length;
  const offline = vehicles.filter(v => (v.telemetry?.status ?? v.status) === 'offline').length;
  const inactive = vehicles.length - online - offline;

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <div className="fm-body">
      <SimpleBar className="nicescroll-bar">
        <div className="container-fluid px-4 py-4">

          {/* Header */}
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h4 className="fw-bold mb-0">Frota</h4>
              <small className="text-muted">{vehicles.length} veículos · {online} online</small>
            </div>
            <div className="d-flex gap-2">
              <Link href="/apps/fleet/control-tower" className="btn btn-soft-primary d-flex align-items-center gap-2">
                <MapPin size={16} /> Torre de Controle
              </Link>
              <Button variant="soft-secondary" className="d-flex align-items-center gap-2" onClick={() => setShowGroup(true)}>
                <Layers size={16} /> Grupos
              </Button>
              <Button variant="primary" className="d-flex align-items-center gap-2" onClick={openAdd}>
                <Plus size={16} /> Adicionar Veículo
              </Button>
            </div>
          </div>

          {/* KPIs */}
          <Row className="g-3 mb-4">
            {[
              { label: 'Total',    value: vehicles.length, color: 'primary' },
              { label: 'Online',   value: online,          color: 'success' },
              { label: 'Offline',  value: offline,         color: 'danger' },
              { label: 'Inativos', value: inactive,        color: 'secondary' },
            ].map(k => (
              <Col key={k.label} xs={6} md={3}>
                <Card className="card-border text-center">
                  <Card.Body className="py-3">
                    <h3 className={`fw-bold text-${k.color} mb-0`}>{k.value}</h3>
                    <small className="text-muted">{k.label}</small>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Filtros */}
          <Card className="card-border mb-4">
            <Card.Body>
              <Row className="g-2">
                <Col md={6}>
                  <InputGroup>
                    <InputGroup.Text><Search size={16} /></InputGroup.Text>
                    <Form.Control placeholder="Buscar por nome ou placa..." value={search} onChange={e => setSearch(e.target.value)} />
                  </InputGroup>
                </Col>
                <Col md={3}>
                  <Form.Select value={filterStatus} onChange={e => setFilter(e.target.value)}>
                    <option value="">Todos os status</option>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="unknown">Inativo</option>
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
                      <Truck size={40} className="mb-3 opacity-50" />
                      <p className="mb-1">Nenhum veículo cadastrado.</p>
                      <small>Clique em "Adicionar Veículo" para começar.</small>
                    </div>
                  ) : (
                  <SimpleBar>
                    <Table hover className="mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th>Veículo</th>
                          <th>Placa</th>
                          <th>Status</th>
                          <th>Odômetro</th>
                          <th>Combustível</th>
                          <th>Última atualização</th>
                          <th className="text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(v => {
                          const status = v.telemetry?.status ?? v.status;
                          const cfg    = statusConfig[status] || statusConfig.unknown;
                          const odoKmVal = v.currentOdometerKm ?? Math.round((v.position?.attributes?.totalDistance ?? 0) / 1000);
                          const fuel     = v.position?.attributes?.fuel;
                          const lastUpdate = v.telemetry?.lastUpdate ?? v.lastUpdate;
                          return (
                            <tr key={v._id ?? v.id}>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <div className="avatar avatar-icon avatar-sm avatar-soft-primary avatar-rounded"><Truck size={14} /></div>
                                  <div>
                                    <div className="fw-semibold small">{v.name}</div>
                                    <small className="text-muted">{categoryLabel[v.category] || v.category}</small>
                                  </div>
                                </div>
                              </td>
                              <td><small className="fw-mono">{v.plate}</small></td>
                              <td>
                                <Badge bg={cfg.bg} className="d-inline-flex align-items-center gap-1 text-white">
                                  {cfg.icon} {cfg.label}
                                </Badge>
                              </td>
                              <td>
                                <small>{odoKmVal ? `${odoKmVal.toLocaleString('pt-BR')} km` : '–'}</small>
                              </td>
                              <td>
                                {fuel !== undefined
                                  ? (
                                    <div className="d-flex align-items-center gap-1">
                                      <div className="progress flex-fill" style={{ height: 6, width: 60 }}>
                                        <div className={`progress-bar bg-${fuel > 50 ? 'success' : fuel > 20 ? 'warning' : 'danger'}`} style={{ width: `${fuel}%` }} />
                                      </div>
                                      <small>{fuel}%</small>
                                    </div>
                                  )
                                  : <small className="text-muted">–</small>
                                }
                              </td>
                              <td>
                                <small className="text-muted">
                                  {lastUpdate ? new Date(lastUpdate).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '–'}
                                </small>
                              </td>
                              <td className="text-center">
                                <div className="d-flex justify-content-center gap-1">
                                  <Button variant={isDark ? "outline-primary" : "primary"} size="sm" title="Ver detalhes" onClick={() => setSelected(v)} className={!isDark ? "text-white" : ""}><Eye size={13} /></Button>
                                  <Button variant={isDark ? "outline-secondary" : "secondary"} size="sm" title="Editar veículo" onClick={() => openEdit(v)} className={!isDark ? "text-white" : ""}><Edit2 size={13} /></Button>
                                  <Button variant={isDark ? "outline-info" : "info"} size="sm" title="Vincular motorista" onClick={() => openAssign(v)} className={!isDark ? "text-white" : ""}><UserCheck size={13} /></Button>
                                  {v.traccarId
                                    ? <Button variant={isDark ? "outline-warning" : "warning"} size="sm" title={`Desvincular Device GPS #${v.traccarId}`} onClick={() => handleUnlinkDevice(v)} className={isDark ? "" : "text-dark"}><Slash size={13} /></Button>
                                    : <Button variant={isDark ? "outline-success" : "success"} size="sm" title="Vincular Device GPS" onClick={() => openLinkDevice(v)} className={!isDark ? "text-white" : ""}><Link2 size={13} /></Button>
                                  }
                                  <Button variant={isDark ? "outline-warning" : "warning"} size="sm" title="Corrigir odômetro" onClick={() => openOdo(v)} className={isDark ? "" : "text-dark"}><Sliders size={13} /></Button>
                                  <Link href="/apps/fleet/control-tower" className={isDark ? "btn btn-outline-success btn-sm" : "btn btn-success btn-sm"} title="Ver no mapa"><MapPin size={13} /></Link>
                                  <Button variant={isDark ? "outline-danger" : "danger"} size="sm" title="Remover veículo" onClick={() => handleDelete(v)} className={!isDark ? "text-white" : ""}><Trash2 size={13} /></Button>
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

      {/* ── Modal detalhe veículo ─────────────────────────────────────────────── */}
      <Modal show={!!selected} onHide={() => setSelected(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6">{selected?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selected && (
            <Row className="g-3">
              {[
                { label: 'Placa',       value: selected.plate },
                { label: 'Marca/Modelo', value: [selected.brand, selected.model].filter(Boolean).join(' ') || '–' },
                { label: 'Ano',         value: selected.year ?? '–' },
                { label: 'Categoria',   value: categoryLabel[selected.category] ?? selected.category },
                { label: 'Combustível', value: selected.fuelType ?? '–' },
                { label: 'Status',      value: statusConfig[selected.telemetry?.status ?? selected.status]?.label },
                { label: 'Odômetro',    value: selected.currentOdometerKm ? `${selected.currentOdometerKm.toLocaleString('pt-BR')} km` : '–' },
                { label: 'Device GPS',  value: selected.traccarId ? `Vinculado (#${selected.traccarId})` : 'Não vinculado' },
              ].map(item => (
                <Col xs={6} key={item.label}>
                  <small className="text-muted d-block">{item.label}</small>
                  <strong className="small">{item.value ?? '–'}</strong>
                </Col>
              ))}
              {selected.notes && (
                <Col xs={12}>
                  <small className="text-muted d-block">Observações</small>
                  <small>{selected.notes}</small>
                </Col>
              )}
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="soft-secondary" size="sm" onClick={() => { const v = selected; setSelected(null); openEdit(v); }}>
            <Edit2 size={13} className="me-1" /> Editar
          </Button>
          <Button variant="soft-warning" size="sm" onClick={() => { const v = selected; setSelected(null); openOdo(v); }}>
            <Sliders size={13} className="me-1" /> Odômetro
          </Button>
          {selected?.traccarId
            ? (
              <Button variant="soft-warning" size="sm" onClick={() => { const v = selected; setSelected(null); handleUnlinkDevice(v); }}>
                <Slash size={13} className="me-1" /> Desvincular GPS
              </Button>
            ) : (
              <Button variant="soft-success" size="sm" onClick={() => { const v = selected; setSelected(null); openLinkDevice(v); }}>
                <Link2 size={13} className="me-1" /> Vincular GPS
              </Button>
            )
          }
          <Link href="/apps/fleet/control-tower" className="btn btn-primary btn-sm">
            <MapPin size={13} className="me-1" /> Ver no mapa
          </Link>
          <Button variant="light" size="sm" onClick={() => setSelected(null)}>Fechar</Button>
        </Modal.Footer>
      </Modal>

      {/* ── Modal adicionar / editar veículo ──────────────────────────────────── */}
      <Modal show={showAdd} onHide={() => setShowAdd(false)} centered size="lg">
        <Form onSubmit={handleAddSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold text-dark">
              {editTarget ? `Editar Veículo — ${editTarget.name}` : 'Adicionar Veículo'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {addError && <Alert variant="danger" className="py-2 small">{addError}</Alert>}
            <Row className="g-3">
              <Col md={8}>
                <Form.Label className="small fw-semibold">Nome do Veículo *</Form.Label>
                <Form.Control name="name" value={form.name} onChange={handleChange} placeholder="Ex: VW Delivery 9.170 – ABC-1234" required />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-semibold">Placa *</Form.Label>
                <Form.Control name="plate" value={form.plate} onChange={handleChange} placeholder="ABC1234" required />
              </Col>
              <Col md={6}>
                <Form.Label className="small fw-semibold">Marca</Form.Label>
                <Form.Control name="brand" value={form.brand} onChange={handleChange} placeholder="Ex: Volkswagen" />
              </Col>
              <Col md={6}>
                <Form.Label className="small fw-semibold">Modelo</Form.Label>
                <Form.Control name="model" value={form.model} onChange={handleChange} placeholder="Ex: Delivery 9.170" />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-semibold">Ano</Form.Label>
                <Form.Control type="number" name="year" value={form.year} onChange={handleChange} placeholder="2023" min={1990} max={2030} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-semibold">Cor</Form.Label>
                <Form.Control name="color" value={form.color} onChange={handleChange} placeholder="Branco" />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-semibold">Categoria</Form.Label>
                <Form.Select name="category" value={form.category} onChange={handleChange}>
                  <option value="truck">Caminhão</option>
                  <option value="van">Van</option>
                  <option value="car">Carro</option>
                  <option value="motorcycle">Moto</option>
                  <option value="bus">Ônibus</option>
                </Form.Select>
              </Col>
              <Col md={6}>
                <Form.Label className="small fw-semibold">Combustível</Form.Label>
                <Form.Select name="fuelType" value={form.fuelType} onChange={handleChange}>
                  <option value="diesel">Diesel</option>
                  <option value="gasoline">Gasolina</option>
                  <option value="flex">Flex</option>
                  <option value="electric">Elétrico</option>
                  <option value="gnv">GNV</option>
                </Form.Select>
              </Col>
              <Col md={12}>
                <Form.Label className="small fw-semibold">Observações</Form.Label>
                <Form.Control as="textarea" rows={2} name="notes" value={form.notes} onChange={handleChange} placeholder="Informações adicionais..." />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" size="sm" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button type="submit" variant="primary" size="sm" disabled={saving}>
              {saving && <Spinner size="sm" className="me-1" />}
              {saving ? 'Salvando…' : editTarget ? 'Salvar Alterações' : 'Cadastrar Veículo'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Modal corrigir odômetro ───────────────────────────────────────────── */}
      <Modal show={showOdo} onHide={() => setShowOdo(false)} centered>
        <Form onSubmit={handleOdoSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold">
              <Sliders size={16} className="me-2 text-warning" />
              Corrigir Odômetro — {odoVehicle?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant="info" className="py-2 small mb-3">
              Use após <strong>troca de rastreador</strong> para restaurar o histórico correto. Os valores são gravados diretamente no Traccar.
            </Alert>
            {odoError   && <Alert variant="danger"  className="py-2 small">{odoError}</Alert>}
            {odoSuccess && <Alert variant="success" className="py-2 small">{odoSuccess}</Alert>}
            <Row className="g-3">
              <Col md={6}>
                <Form.Label className="small fw-semibold">Odômetro total (km)</Form.Label>
                <InputGroup>
                  <Form.Control type="number" min={0} step={1} placeholder={odoVehicle?.currentOdometerKm ?? '0'} value={odoKm} onChange={e => setOdoKm(e.target.value)} />
                  <InputGroup.Text>km</InputGroup.Text>
                </InputGroup>
              </Col>
              <Col md={6}>
                <Form.Label className="small fw-semibold">Horas de motor</Form.Label>
                <InputGroup>
                  <Form.Control type="number" min={0} step={0.1} placeholder="0" value={odoHours} onChange={e => setOdoHours(e.target.value)} />
                  <InputGroup.Text>h</InputGroup.Text>
                </InputGroup>
              </Col>
            </Row>
            {!odoVehicle?.traccarId && (
              <Alert variant="warning" className="py-2 small mt-3">
                Veículo sem rastreador Traccar vinculado. Vincule um dispositivo na tela <strong>Dispositivos GPS</strong>.
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" size="sm" onClick={() => setShowOdo(false)}>Cancelar</Button>
            <Button type="submit" variant="warning" size="sm" disabled={odoSaving || !odoVehicle?.traccarId}>
              {odoSaving && <Spinner size="sm" className="me-1" />}
              {odoSaving ? 'Salvando…' : 'Atualizar Odômetro'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Modal grupos ─────────────────────────────────────────────────────── */}
      <Modal show={showGroup} onHide={() => setShowGroup(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">Grupos de Frota</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleGroupSubmit} className="mb-3">
            {groupError && <Alert variant="danger" className="py-2 small">{groupError}</Alert>}
            <Row className="g-2">
              <Col xs={5}>
                <Form.Control size="sm" placeholder="Nome do grupo *" value={groupForm.name} onChange={e => setGroupForm(p => ({ ...p, name: e.target.value }))} required />
              </Col>
              <Col xs={5}>
                <Form.Control size="sm" placeholder="Descrição" value={groupForm.description} onChange={e => setGroupForm(p => ({ ...p, description: e.target.value }))} />
              </Col>
              <Col xs={2}>
                <Button type="submit" variant="primary" size="sm" className="w-100" disabled={groupSaving}>
                  {groupSaving ? <Spinner size="sm" /> : <Plus size={14} />}
                </Button>
              </Col>
            </Row>
          </Form>
          {groups.length === 0
            ? <p className="text-muted small text-center mb-0">Nenhum grupo cadastrado.</p>
            : (
              <Table size="sm" hover className="mb-0">
                <thead className="bg-light">
                  <tr><th>Nome</th><th>Descrição</th><th className="text-end">Ações</th></tr>
                </thead>
                <tbody>
                  {groups.map(g => {
                    const id = g._id ?? g.id;
                    return (
                      <tr key={id}>
                        <td>
                          {renamingId === id
                            ? (
                              <InputGroup size="sm">
                                <Form.Control
                                  value={renameVal}
                                  onChange={e => setRenameVal(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') handleRename(g); if (e.key === 'Escape') cancelRename(); }}
                                  autoFocus
                                />
                                <Button variant="success" size="sm" disabled={renameSaving} onClick={() => handleRename(g)}>
                                  {renameSaving ? <Spinner size="sm" /> : <Check size={12} />}
                                </Button>
                                <Button variant="light" size="sm" onClick={cancelRename}><X size={12} /></Button>
                              </InputGroup>
                            )
                            : <strong className="small">{g.name}</strong>
                          }
                        </td>
                        <td><small className="text-muted">{g.description || '–'}</small></td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-1">
                            <Button variant="soft-secondary" size="sm" title="Renomear" onClick={() => startRename(g)}>
                              <Edit2 size={11} />
                            </Button>
                            <Button variant="soft-danger" size="sm" title="Remover" onClick={() => handleDeleteGroup(id)}>
                              <Trash2 size={11} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" size="sm" onClick={() => setShowGroup(false)}>Fechar</Button>
        </Modal.Footer>
      </Modal>

      {/* ── Modal: vincular device GPS ─────────────────────────────────────── */}
      <Modal show={showLinkDevice} onHide={() => setShowLinkDevice(false)} centered>
        <Form onSubmit={handleLinkDevice}>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold">
              <Cpu size={16} className="me-2 text-success" />
              Vincular Device GPS — {linkDeviceTarget?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {linkDeviceError && <Alert variant="danger" className="py-2 small">{linkDeviceError}</Alert>}
            <Alert variant="info" className="py-2 small mb-3">
              Selecione o rastreador físico (Traccar) que está instalado neste veículo.
              O device passará a enviar telemetria vinculada a <strong>{linkDeviceTarget?.plate}</strong>.
            </Alert>
            <Form.Label className="small fw-semibold">Dispositivo GPS disponível *</Form.Label>
            <Form.Select
              value={linkDeviceId}
              onChange={e => setLinkDeviceId(e.target.value)}
              required
            >
              <option value="">— selecione um dispositivo —</option>
              {traccarDevices
                .filter(d => !d.linked || d.linkedVehicle?._id === (linkDeviceTarget?._id ?? linkDeviceTarget?.id))
                .map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.uniqueId}
                    {d.linked ? ' (já vinculado — mover)' : ` (${d.status ?? 'desconhecido'})`}
                  </option>
                ))
              }
            </Form.Select>
            {traccarDevices.filter(d => !d.linked).length === 0 && (
              <Form.Text className="text-warning d-block mt-1">
                Todos os devices já estão vinculados. Cadastre um novo em{' '}
                <a href="/apps/fleet/devices">Dispositivos GPS</a>.
              </Form.Text>
            )}
            {linkDeviceId && (
              <div className="mt-3 p-2 bg-light rounded small">
                {(() => {
                  const dev = traccarDevices.find(d => String(d.id) === String(linkDeviceId));
                  return dev ? (
                    <>
                      <strong>UniqueID:</strong> <code>{dev.uniqueId}</code> &nbsp;|&nbsp;
                      <strong>Status:</strong> {dev.status ?? '–'} &nbsp;|&nbsp;
                      <strong>Modelo:</strong> {dev.model || '–'}
                    </>
                  ) : null;
                })()}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" size="sm" onClick={() => setShowLinkDevice(false)}>Cancelar</Button>
            <Button type="submit" variant="success" size="sm" disabled={linkDeviceSaving}>
              {linkDeviceSaving && <Spinner size="sm" className="me-1" />}
              {linkDeviceSaving ? 'Vinculando…' : 'Confirmar vinculação'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Modal: vincular motorista ───────────────────────────────────────── */}
      <Modal show={showAssign} onHide={() => setShowAssign(false)} centered>
        <Form onSubmit={handleAssign}>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold">
              <UserCheck size={16} className="me-2 text-info" />
              Vincular Motorista — {assignVehicle?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {assignError && <Alert variant="danger" className="py-2 small">{assignError}</Alert>}
            <Form.Label className="small fw-semibold">Motorista responsável</Form.Label>
            <Form.Select
              value={assignDriver_}
              onChange={e => setAssignDriver_(e.target.value)}
            >
              <option value="">— Nenhum (remover vinculação) —</option>
              {allDrivers
                .filter(d => (d.status ?? d.attributes?.status) !== 'inactive')
                .map(d => {
                  const isAssigned = d.currentVehicleId && d.currentVehicleId !== (assignVehicle?._id ?? assignVehicle?.id);
                  return (
                    <option key={d._id ?? d.id} value={d._id ?? d.id} disabled={!!isAssigned}>
                      {d.name}{isAssigned ? ' (em outro veículo)' : ''}
                    </option>
                  );
                })}
            </Form.Select>
            <Form.Text className="text-muted">
              O motorista vinculado aparecerá nas Trips e Relatórios deste veículo.
            </Form.Text>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" size="sm" onClick={() => setShowAssign(false)}>Cancelar</Button>
            <Button type="submit" variant="info" size="sm" disabled={assignSaving}>
              {assignSaving && <Spinner size="sm" className="me-1" />}
              {assignSaving ? 'Salvando…' : 'Confirmar vinculação'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
