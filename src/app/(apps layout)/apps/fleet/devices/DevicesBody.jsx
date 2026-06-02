'use client';
import { useState, useEffect } from 'react';
import {
  Card, Table, Badge, Button, Modal, Form, Row, Col, Spinner, Alert, InputGroup,
} from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import { Wifi, WifiOff, AlertCircle, Link2, Slash, Edit2, Search, Cpu, RefreshCw, PlusCircle, Terminal, Send, Trash2, Share2, Copy, ExternalLink, CheckCircle } from 'react-feather';
import SimpleBar from 'simplebar-react';
import {
  getTraccarDevices,
  linkTraccarDevice,
  unlinkTraccarDevice,
  updateTraccarDevice,
  getCommandTypes,
  sendCommand,
  deleteTraccarDevice,
  shareTraccarDevice,
} from '@/lib/api/services/fleet';
import { apiRequest } from '@/lib/api/client';

// ─── helpers ──────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  online:  { bg: 'success', icon: <Wifi size={12} />,        label: 'Online' },
  offline: { bg: 'danger',  icon: <WifiOff size={12} />,     label: 'Offline' },
  unknown: { bg: 'secondary',icon: <AlertCircle size={12} />, label: 'Desconhecido' },
};

const CAT_ICONS = {
  truck: '🚛', van: '🚐', car: '🚗', motorcycle: '🏍️', bus: '🚌',
};

function StatusBadge({ status, disabled }) {
  if (disabled) return <Badge bg="secondary" className="text-white">Desativado</Badge>;
  const cfg = STATUS_CFG[status] || STATUS_CFG.unknown;
  return (
    <Badge bg={cfg.bg} className="d-inline-flex align-items-center gap-1 text-white">
      {cfg.icon} {cfg.label}
    </Badge>
  );
}

// ─── componente principal ─────────────────────────────────────────────────────

export default function DevicesBody() {
  const router = useRouter();
  const [devices,   setDevices]   = useState([]);
  const [vehicles,  setVehicles]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('all'); // all | linked | unlinked

  // modal vincular
  const [linkModal, setLinkModal] = useState(null); // device selecionado
  const [linkVehicleId, setLinkVehicleId] = useState('');
  const [linkSaving, setLinkSaving] = useState(false);
  const [linkError, setLinkError] = useState('');

  // modal editar device
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm]   = useState({ name: '', category: '', disabled: false });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // modal comandos remotos
  const [cmdModal,    setCmdModal]    = useState(null); // device
  const [cmdTypes,    setCmdTypes]    = useState([]);
  const [cmdType,     setCmdType]     = useState('');
  const [cmdAttrs,    setCmdAttrs]    = useState({});
  const [cmdSending,  setCmdSending]  = useState(false);
  const [cmdError,    setCmdError]    = useState('');
  const [cmdSuccess,  setCmdSuccess]  = useState('');

  // modal share
  const [shareModal,   setShareModal]   = useState(null);
  const [shareExp,     setShareExp]     = useState('');
  const [shareUrl,     setShareUrl]     = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError,   setShareError]   = useState('');
  const [shareCopied,  setShareCopied]  = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [devs, vehsRes] = await Promise.all([
        getTraccarDevices(),
        apiRequest('/fleet/vehicles'),
      ]);
      // A API retorna { data: [...], total: N } — normaliza para array
      const vehs = vehsRes?.data ?? (Array.isArray(vehsRes) ? vehsRes : []);
      setDevices(Array.isArray(devs) ? devs : []);
      setVehicles(Array.isArray(vehs) ? vehs : []);
    } catch {
      // fallback silencioso — deixa arrays vazios
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── detect dark mode ──────────────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.getAttribute('data-bs-theme') === 'dark');
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] });
    return () => observer.disconnect();
  }, []);

  // ── filtro / busca ──────────────────────────────────────────────────────────
  const visible = devices
    .filter(d => {
      if (filter === 'linked')   return d.linked;
      if (filter === 'unlinked') return !d.linked;
      return true;
    })
    .filter(d => !search || [d.name, d.uniqueId, d.model, d.linkedVehicle?.plate]
      .filter(Boolean)
      .some(v => v.toLowerCase().includes(search.toLowerCase())));

  const linked   = devices.filter(d => d.linked).length;
  const unlinked = devices.length - linked;
  const online   = devices.filter(d => d.status === 'online' && !d.disabled).length;

  // ── vincular ────────────────────────────────────────────────────────────────
  const handleOpenLink = (device) => {
    setLinkModal(device);
    setLinkVehicleId(device.linkedVehicle?._id ?? device.linkedVehicle?.id ?? '');
    setLinkError('');
  };

  const handleLink = async (e) => {
    e.preventDefault();
    if (!linkVehicleId) { setLinkError('Selecione um veículo.'); return; }
    setLinkSaving(true); setLinkError('');
    try {
      await linkTraccarDevice(linkModal.id, linkVehicleId);
      await load();
      setLinkModal(null);
    } catch (err) {
      setLinkError(err?.message ?? 'Erro ao vincular.');
    } finally {
      setLinkSaving(false);
    }
  };

  const handleUnlink = async (device) => {
    if (!confirm(`Desvincular device "${device.name}" do veículo "${device.linkedVehicle?.name}"?`)) return;
    try {
      await unlinkTraccarDevice(device.id);
      await load();
    } catch {
      alert('Erro ao desvincular device.');
    }
  };

  // ── editar ──────────────────────────────────────────────────────────────────
  const handleOpenEdit = (device) => {
    setEditModal(device);
    setEditForm({ name: device.name ?? '', category: device.category ?? '', disabled: device.disabled ?? false });
    setEditError('');
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditSaving(true); setEditError('');
    try {
      await updateTraccarDevice(editModal.id, editForm);
      await load();
      setEditModal(null);
    } catch (err) {
      setEditError(err?.message ?? 'Erro ao atualizar device.');
    } finally {
      setEditSaving(false);
    }
  };

  // ── comandos remotos ─────────────────────────────────────────────────────────
  const handleOpenCmd = async (device) => {
    setCmdModal(device);
    setCmdType('');
    setCmdAttrs({});
    setCmdError('');
    setCmdSuccess('');
    setCmdSending(false);
    try {
      const types = await getCommandTypes(device.id);
      setCmdTypes(Array.isArray(types) ? types : []);
    } catch {
      setCmdTypes([]);
    }
  };

  const handleSendCmd = async (e) => {
    e.preventDefault();
    if (!cmdType) { setCmdError('Selecione um tipo de comando.'); return; }
    setCmdSending(true); setCmdError(''); setCmdSuccess('');
    try {
      await sendCommand(cmdModal.id, { type: cmdType, attributes: cmdAttrs });
      setCmdSuccess(`Comando "${cmdType}" enviado com sucesso!`);
      setCmdType('');
    } catch (err) {
      setCmdError(err?.body?.message || err?.message || 'Erro ao enviar comando.');
    } finally {
      setCmdSending(false);
    }
  };

  // ── deletar device ──────────────────────────────────────────────────────────
  const handleDelete = async (device) => {
    if (!confirm(`Remover permanentemente o device "${device.name}" do Traccar?\n\nEsta ação não pode ser desfeita.`)) return;
    try {
      await deleteTraccarDevice(device.id);
      await load();
    } catch (err) {
      alert(err?.body?.message || err?.message || 'Erro ao remover device.');
    }
  };

  // ── share device ─────────────────────────────────────────────────────────────
  const handleOpenShare = (device) => {
    setShareModal(device);
    setShareUrl('');
    setShareExp('');
    setShareError('');
    setShareCopied(false);
  };

  const handleShare = async (e) => {
    e.preventDefault();
    setShareLoading(true); setShareError(''); setShareUrl('');
    try {
      const result = await shareTraccarDevice(shareModal.id, shareExp || undefined);
      setShareUrl(result?.url ?? result);
    } catch (err) {
      setShareError(err?.body?.message || err?.message || 'Erro ao gerar link.');
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="fm-body">
      <SimpleBar className="nicescroll-bar">
        <div className="container-fluid px-4 py-4">

          {/* Header */}
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h4 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <Cpu size={22} className="text-primary" /> Dispositivos GPS
              </h4>
              <small className="text-muted">
                Rastreadores físicos cadastrados no Traccar
              </small>
            </div>
            <Button variant={isDark ? "outline-primary" : "primary"} size="sm" className={`d-flex align-items-center gap-2 ${!isDark ? "text-white" : ""}`} onClick={load} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Atualizar
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="d-flex align-items-center gap-2"
              onClick={() => router.push('/apps/fleet/devices/new')}
            >
              <PlusCircle size={14} /> Novo dispositivo
            </Button>
          </div>

          {/* KPIs */}
          <Row className="g-3 mb-4">
            {[
              { label: 'Total',       value: devices.length,  color: 'primary' },
              { label: 'Online',      value: online,          color: 'success' },
              { label: 'Vinculados',  value: linked,          color: 'info' },
              { label: 'Não vinculados', value: unlinked,     color: 'warning' },
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
                    <Form.Control
                      placeholder="Buscar por nome, IMEI/uniqueId, modelo, placa..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col md={4}>
                  <Form.Select value={filter} onChange={e => setFilter(e.target.value)}>
                    <option value="all">Todos os dispositivos</option>
                    <option value="linked">Vinculados a um veículo</option>
                    <option value="unlinked">Não vinculados (órfãos)</option>
                  </Form.Select>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Tabela */}
          <Card className="card-border">
            <Card.Header className="d-flex align-items-center justify-content-between">
              <h6 className="mb-0">Dispositivos no Traccar</h6>
              <small className="text-muted">{visible.length} dispositivo{visible.length !== 1 ? 's' : ''}</small>
            </Card.Header>
            <Card.Body className="p-0">
              {loading
                ? <div className="text-center py-5"><Spinner /></div>
                : visible.length === 0
                  ? (
                  <div className="text-center py-5 text-muted">
                    <Cpu size={40} className="mb-3 opacity-50" />
                    <p className="mb-0">Nenhum dispositivo encontrado.</p>
                    <small>Cadastre um dispositivo em "Novo dispositivo" e depois vincule-o a um veículo da frota.</small>
                  </div>
                  )
                  : (
                  <SimpleBar>
                    <Table hover className="mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th>Dispositivo</th>
                          <th>UniqueID (IMEI/Placa)</th>
                          <th>Categoria</th>
                          <th>Status</th>
                          <th>Veículo Vinculado</th>
                          <th>Última atualização</th>
                          <th className="text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visible.map(d => (
                          <tr key={d.id}>
                            <td>
                              <div className="fw-semibold small">{d.name}</div>
                              {d.model && <small className="text-muted">{d.model}</small>}
                            </td>
                            <td>
                              <code className="small text-muted">{d.uniqueId || '–'}</code>
                            </td>
                            <td>
                              <span className="me-1">{CAT_ICONS[d.category] ?? '📦'}</span>
                              <small>{d.category || '–'}</small>
                            </td>
                            <td><StatusBadge status={d.status} disabled={d.disabled} /></td>
                            <td>
                              {d.linkedVehicle
                                ? (
                                <div>
                                  <div className="small fw-semibold">{d.linkedVehicle.name}</div>
                                  <small className="text-muted">{d.linkedVehicle.plate}</small>
                                </div>
                                )
                                : <Badge bg="warning" text="dark">Não vinculado</Badge>
                              }
                            </td>
                            <td>
                              <small className="text-muted">
                                {d.lastUpdate
                                  ? new Date(d.lastUpdate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                                  : '–'}
                              </small>
                            </td>
                            <td className="text-center">
                              <div className="d-flex justify-content-center gap-1">
                                <Button
                                  variant={isDark ? "outline-primary" : "primary"} size="sm"
                                  title="Editar device no Traccar"
                                  onClick={() => handleOpenEdit(d)}
                                  className={!isDark ? "text-white" : ""}
                                >
                                  <Edit2 size={13} />
                                </Button>
                                <Button
                                  variant={isDark ? "outline-secondary" : "secondary"} size="sm"
                                  title="Enviar comando remoto"
                                  onClick={() => handleOpenCmd(d)}
                                  className={!isDark ? "text-white" : ""}
                                >
                                  <Terminal size={13} />
                                </Button>
                                <Button
                                  variant={isDark ? "outline-info" : "info"} size="sm"
                                  title="Gerar link público de rastreamento"
                                  onClick={() => handleOpenShare(d)}
                                  className={!isDark ? "text-white" : ""}
                                >
                                  <Share2 size={13} />
                                </Button>
                                {d.linked
                                  ? (
                                  <Button
                                    variant={isDark ? "outline-warning" : "warning"} size="sm"
                                    title="Desvincular do veículo"
                                    onClick={() => handleUnlink(d)}
                                    className={isDark ? "" : "text-dark"}
                                  >
                                    <Slash size={13} />
                                  </Button>
                                  )
                                  : (
                                  <Button
                                    variant={isDark ? "outline-success" : "success"} size="sm"
                                    title="Vincular a um veículo"
                                    onClick={() => handleOpenLink(d)}
                                    className={!isDark ? "text-white" : ""}
                                  >
                                    <Link2 size={13} />
                                  </Button>
                                  )
                                }
                                <Button
                                  variant={isDark ? "outline-danger" : "danger"} size="sm"
                                  title="Remover device do Traccar"
                                  onClick={() => handleDelete(d)}
                                  className={!isDark ? "text-white" : ""}
                                >
                                  <Trash2 size={13} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </SimpleBar>
                )}
            </Card.Body>
          </Card>

          {/* Explicação */}
          <Card className="card-border mt-4 border-info">
            <Card.Body className="py-3">
              <Row className="g-3 text-center">
                <Col md={4}>
                  <div className="fw-semibold small text-info mb-1">🔗 Device vinculado</div>
                  <small className="text-muted">Hardware GPS associado a um veículo no MongoDB. Telemetria aparece no dashboard e Torre de Controle.</small>
                </Col>
                <Col md={4}>
                  <div className="fw-semibold small text-warning mb-1">⚠️ Device não vinculado</div>
                  <small className="text-muted">Hardware instalado e enviando dados, mas sem veículo cadastrado. Use o botão de vincular para associar.</small>
                </Col>
                <Col md={4}>
                  <div className="fw-semibold small text-secondary mb-1">📡 UniqueID</div>
                  <small className="text-muted">Identificador único do hardware (IMEI, placa, código). Configurado no próprio dispositivo GPS.</small>
                </Col>
              </Row>
            </Card.Body>
          </Card>

        </div>
      </SimpleBar>

      {/* ── Modal vincular ───────────────────────────────────────────────────── */}
      <Modal show={!!linkModal} onHide={() => setLinkModal(null)} centered>
        <Form onSubmit={handleLink}>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold text-dark">
              Vincular Device a Veículo
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {linkError && <Alert variant="danger" className="py-2 small">{linkError}</Alert>}
            <p className="small text-muted mb-3">
              Device: <strong>{linkModal?.name}</strong> <code>({linkModal?.uniqueId})</code>
            </p>
            <Form.Label className="small fw-semibold">Selecionar Veículo *</Form.Label>
            <Form.Select
              value={linkVehicleId}
              onChange={e => setLinkVehicleId(e.target.value)}
              required
            >
              <option value="">— escolha um veículo —</option>
              {vehicles.map(v => (
                <option key={v._id ?? v.id} value={v._id ?? v.id}>
                  {v.name} {v.plate ? `(${v.plate})` : ''}
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              O campo <code>traccarId</code> do veículo será atualizado para <strong>{linkModal?.id}</strong>.
            </Form.Text>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" size="sm" onClick={() => setLinkModal(null)}>Cancelar</Button>
            <Button type="submit" variant="primary" size="sm" disabled={linkSaving}>
              {linkSaving && <Spinner size="sm" className="me-1" />}
              {linkSaving ? 'Vinculando…' : 'Vincular'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Modal editar device ──────────────────────────────────────────────── */}
      <Modal show={!!editModal} onHide={() => setEditModal(null)} centered>
        <Form onSubmit={handleEdit}>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold text-dark">Editar Device no Traccar</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {editError && <Alert variant="danger" className="py-2 small">{editError}</Alert>}
            <Row className="g-3">
              <Col xs={12}>
                <Form.Label className="small fw-semibold">Nome do Device</Form.Label>
                <Form.Control
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nome exibido no Traccar"
                />
              </Col>
              <Col xs={8}>
                <Form.Label className="small fw-semibold">Categoria</Form.Label>
                <Form.Select
                  value={editForm.category}
                  onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                >
                  <option value="">— selecione —</option>
                  <option value="truck">Caminhão</option>
                  <option value="van">Van</option>
                  <option value="car">Carro</option>
                  <option value="motorcycle">Moto</option>
                  <option value="bus">Ônibus</option>
                </Form.Select>
              </Col>
              <Col xs={4} className="d-flex align-items-end pb-1">
                <Form.Check
                  type="switch"
                  id="device-disabled"
                  label="Desativar"
                  checked={editForm.disabled}
                  onChange={e => setEditForm(f => ({ ...f, disabled: e.target.checked }))}
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" size="sm" onClick={() => setEditModal(null)}>Cancelar</Button>
            <Button type="submit" variant="primary" size="sm" disabled={editSaving}>
              {editSaving && <Spinner size="sm" className="me-1" />}
              {editSaving ? 'Salvando…' : 'Salvar no Traccar'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Modal comandos remotos ────────────────────────────────────────────── */}
      <Modal show={!!cmdModal} onHide={() => setCmdModal(null)} centered>
        <Form onSubmit={handleSendCmd}>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold text-dark">
              <Terminal size={15} className="me-2 text-secondary" />
              Comando Remoto — {cmdModal?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {cmdError   && <Alert variant="danger"  className="py-2 small">{cmdError}</Alert>}
            {cmdSuccess && <Alert variant="success" className="py-2 small">{cmdSuccess}</Alert>}

            <Form.Label className="small fw-semibold">Tipo de Comando *</Form.Label>
            {cmdTypes.length > 0
              ? (
                <Form.Select value={cmdType} onChange={e => { setCmdType(e.target.value); setCmdAttrs({}); }} required>
                  <option value="">— selecione um comando —</option>
                  {cmdTypes.map(t => (
                    <option key={t.type} value={t.type}>{t.type}</option>
                  ))}
                </Form.Select>
              ) : (
                <>
                  <Form.Select value={cmdType} onChange={e => setCmdType(e.target.value)} required>
                    <option value="">— selecione —</option>
                    <option value="engineStop">🔴 engineStop — Bloquear motor</option>
                    <option value="engineResume">🟢 engineResume — Liberar motor</option>
                    <option value="positionPeriodic">📍 positionPeriodic — Forçar envio de posição</option>
                    <option value="alarm">🔔 alarm — Disparar alarme</option>
                    <option value="custom">⚙️ custom — Comando personalizado</option>
                  </Form.Select>
                  <Form.Text className="text-muted d-block mb-2">
                    Device offline — comandos enfileirados no Traccar.
                  </Form.Text>
                </>
              )
            }

            {cmdType === 'positionPeriodic' && (
              <div className="mt-3">
                <Form.Label className="small fw-semibold">Frequência (segundos)</Form.Label>
                <Form.Control
                  type="number"
                  min={10}
                  placeholder="Ex: 30"
                  value={cmdAttrs.frequency ?? ''}
                  onChange={e => setCmdAttrs({ frequency: Number(e.target.value) })}
                />
              </div>
            )}

            {cmdType === 'custom' && (
              <div className="mt-3">
                <Form.Label className="small fw-semibold">Dados (data)</Form.Label>
                <Form.Control
                  placeholder="Payload personalizado"
                  value={cmdAttrs.data ?? ''}
                  onChange={e => setCmdAttrs({ data: e.target.value })}
                />
              </div>
            )}

            <div className="mt-3 p-2 bg-light rounded">
              <small className="text-muted">
                <strong>Device:</strong> {cmdModal?.name} &nbsp;|&nbsp;
                <strong>UniqueID:</strong> {cmdModal?.uniqueId} &nbsp;|&nbsp;
                <strong>Status:</strong> {cmdModal?.status}
              </small>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" size="sm" onClick={() => setCmdModal(null)}>Cancelar</Button>
            <Button type="submit" variant="danger" size="sm" disabled={cmdSending || !!cmdSuccess}>
              {cmdSending
                ? <><Spinner size="sm" className="me-1" />Enviando…</>
                : <><Send size={13} className="me-1" />Enviar Comando</>
              }
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Modal share / link público ────────────────────────────────────────── */}
      <Modal show={!!shareModal} onHide={() => setShareModal(null)} centered>
        <Form onSubmit={handleShare}>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold text-dark">
              <Share2 size={15} className="me-2 text-info" />
              Link Público — {shareModal?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {shareError && <Alert variant="danger" className="py-2 small">{shareError}</Alert>}

            <p className="small text-muted mb-3">
              Gera um link público temporário para rastrear este device sem precisar fazer login.
              Ideal para compartilhar localização com clientes ou parceiros.
            </p>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Expiração (opcional)</Form.Label>
              <Form.Control
                type="datetime-local"
                value={shareExp}
                onChange={e => setShareExp(e.target.value)}
              />
              <Form.Text className="text-muted">Deixe em branco para link sem expiração.</Form.Text>
            </Form.Group>

            {shareUrl && (
              <div className="mt-3">
                <Form.Label className="small fw-semibold text-success">Link gerado:</Form.Label>
                <InputGroup>
                  <Form.Control
                    readOnly
                    value={shareUrl}
                    className="small"
                    style={{ fontSize: '0.8rem' }}
                  />
                  <Button variant="outline-secondary" size="sm" onClick={handleCopy} title="Copiar">
                    {shareCopied ? <CheckCircle size={14} className="text-success" /> : <Copy size={14} />}
                  </Button>
                  <Button
                    variant="outline-primary" size="sm"
                    onClick={() => window.open(shareUrl, '_blank')}
                    title="Abrir link"
                  >
                    <ExternalLink size={14} />
                  </Button>
                </InputGroup>
                {shareCopied && <small className="text-success">Copiado!</small>}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" size="sm" onClick={() => setShareModal(null)}>Fechar</Button>
            {!shareUrl && (
              <Button type="submit" variant="info" size="sm" disabled={shareLoading}>
                {shareLoading
                  ? <><Spinner size="sm" className="me-1" />Gerando…</>
                  : <><Share2 size={13} className="me-1" />Gerar Link</>
                }
              </Button>
            )}
          </Modal.Footer>
        </Form>
      </Modal>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
