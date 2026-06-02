'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, Badge, Table, Button, Form, InputGroup, Modal, Row, Col, Spinner, Alert, ProgressBar, Nav } from 'react-bootstrap';
import { Search, Plus, User, Eye, Edit2, Trash2, Truck, AlertTriangle, RefreshCw, Link2, X, Activity, Key, MapPin, CreditCard, Briefcase, Heart, Save, Check } from 'react-feather';
import SimpleBar from 'simplebar-react';
import { getDrivers, getDevices, assignDriver, syncDriverScores } from '@/lib/api/services/fleet';
import { apiRequest } from '@/lib/api/client';
import { validateCep } from '@/lib/api/services/tripWizard';

// ── helpers ────────────────────────────────────────────────────────────────────

const statusConfig = {
  active:    { bg: 'success',   label: 'Ativo'    },
  inactive:  { bg: 'secondary', label: 'Inativo'  },
  suspended: { bg: 'danger',    label: 'Suspenso' },
};

const scoreColor = (s) => s >= 90 ? 'success' : s >= 70 ? 'warning' : 'danger';
const scoreLabel = (s) => s >= 90 ? 'Excelente' : s >= 70 ? 'Bom' : s >= 50 ? 'Regular' : 'Ruim';

const EMPTY_DRIVER = {
  name: '', cpf: '', rg: '', birthDate: '', maritalStatus: 'single', phone: '', email: '', emergencyPhone: '',
  cnhNumber: '', cnhCategory: 'D', cnhExpiry: '',
  addressZipCode: '', addressStreet: '', addressNumber: '', addressNeighborhood: '', addressCity: '', addressState: '',
  carrierType: 'own', contractType: 'clt', admissionDate: '', operationalStatus: 'available',
  medicalExamExpiry: '', toxicologicalExamExpiry: '',
  status: 'active', notes: '',
};

const DRIVER_DRAFT_KEY = 'fleet.driver.draft.v1';

const DRIVER_TABS = [
  { key: 'identification', label: 'Identificação', icon: User },
  { key: 'address', label: 'Endereço', icon: MapPin },
  { key: 'cnh', label: 'CNH', icon: CreditCard },
  { key: 'contract', label: 'Contrato', icon: Briefcase },
  { key: 'health', label: 'Saúde', icon: Heart },
];

const MARITAL_STATUS_LABELS = {
  single: 'Solteiro(a)',
  married: 'Casado(a)',
  divorced: 'Divorciado(a)',
  widowed: 'Viúvo(a)',
  stable_union: 'União estável',
};

const CONTRACT_TYPE_LABELS = {
  clt: 'CLT - Carteira Assinada',
  pj: 'PJ - Pessoa Jurídica',
  aggregate: 'Agregado',
  third_party: 'Terceiro',
  temporary: 'Temporário',
};

const OPERATIONAL_STATUS_LABELS = {
  available: 'Disponível',
  unavailable: 'Indisponível',
  on_trip: 'Em viagem',
  vacation: 'Férias',
  medical_leave: 'Afastado',
};

function dateOnly(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function driverProfile(driver = {}) {
  if (!driver || typeof driver !== 'object') return {};
  return driver.attributes?.driverProfile ?? {};
}

function cnhStatus(expiry) {
  if (!expiry) return null;
  const days = Math.ceil((new Date(expiry) - new Date()) / 86400000);
  if (days < 0)  return { label: 'Vencida',       color: 'danger',  days };
  if (days <= 30) return { label: `${days}d`,      color: 'danger',  days };
  if (days <= 90) return { label: `${days}d`,      color: 'warning', days };
  return               { label: 'OK',             color: 'success', days };
}

// ── componente principal ───────────────────────────────────────────────────────

export default function DriversBody() {
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCnh,    setFilterCnh]    = useState(''); // 'expiring30' | 'expiring90' | 'expired'
  const [selected,     setSelected]     = useState(null);
  const [allDrivers,   setAllDrivers]   = useState([]);
  const [vehicles,     setVehicles]     = useState([]);
  const [loading,      setLoading]      = useState(true);

  // add / edit modal
  const [showModal,  setShowModal]  = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form,       setForm]       = useState(EMPTY_DRIVER);
  const [saving,     setSaving]     = useState(false);
  const [modalError, setModalError] = useState('');
  const [activeDriverTab, setActiveDriverTab] = useState('identification');
  const [cepLoading, setCepLoading] = useState(false);

  // vincular veículo modal
  const [showAssign,    setShowAssign]    = useState(false);
  const [assignTarget,  setAssignTarget]  = useState(null);
  const [assignVehicle, setAssignVehicle] = useState('');
  const [assignSaving,  setAssignSaving]  = useState(false);
  const [assignError,   setAssignError]   = useState('');

  // delete
  const [deleting, setDeleting] = useState(null);

  // PIN modal
  const [showPin,   setShowPin]   = useState(false);
  const [pinTarget, setPinTarget] = useState(null);
  const [pinValue,  setPinValue]  = useState('');
  const [pinSaving, setPinSaving] = useState(false);
  const [pinError,  setPinError]  = useState('');

  // link web do motorista
  const [showDriverLink,   setShowDriverLink]   = useState(false);
  const [driverLinkTarget, setDriverLinkTarget] = useState(null);
  const [driverLinkHours,  setDriverLinkHours]  = useState(48);
  const [driverLinkResult, setDriverLinkResult] = useState(null);
  const [driverLinkSaving, setDriverLinkSaving] = useState(false);
  const [driverLinkError,  setDriverLinkError]  = useState('');

  // score sync
  const [syncing,    setSyncing]    = useState(false);
  const [syncResult, setSyncResult] = useState(null); // { updated, skipped }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, v] = await Promise.allSettled([
        apiRequest('/fleet/fleet-drivers'),
        getDevices({ all: true }),
      ]);
      const driversRaw = d.status === 'fulfilled'
        ? (d.value?.data ?? (Array.isArray(d.value) ? d.value : []))
        : [];
      if (Array.isArray(driversRaw))  setAllDrivers(driversRaw);
      if (v.status === 'fulfilled' && Array.isArray(v.value)) setVehicles(v.value);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── normalização ──────────────────────────────────────────────────────────────
  const normalize = (d) => ({
    ...d,
    _status:  d.status ?? 'active',
    _score:   d.drivingScore ?? 0,
    _phone:   d.phone ?? '',
    _cnh:     d.cnhCategory ?? '–',
    _expiry:  d.cnhExpiry ?? '',
    _trips:   d.totalTrips ?? 0,
    _km:      d.totalKm ?? 0,
    vehicle:  vehicles.find(v => (v._id ?? v.id) === d.currentVehicleId),
    _cnhStatus: cnhStatus(d.cnhExpiry),
  });

  const drivers = allDrivers
    .map(normalize)
    .filter(d => {
      if (search && !d.name.toLowerCase().includes(search.toLowerCase()) &&
          !(d._phone || '').includes(search) && !(d.cpf || '').includes(search)) return false;
      if (filterStatus && d._status !== filterStatus) return false;
      if (filterCnh === 'expired')    return d._cnhStatus?.days < 0;
      if (filterCnh === 'expiring30') return d._cnhStatus?.days >= 0 && d._cnhStatus?.days <= 30;
      if (filterCnh === 'expiring90') return d._cnhStatus?.days >= 0 && d._cnhStatus?.days <= 90;
      return true;
    });

  // KPIs
  const ativos     = allDrivers.filter(d => (d.status ?? 'active') === 'active').length;
  const avgScore   = allDrivers.length ? Math.round(allDrivers.reduce((a, d) => a + (d.drivingScore ?? 0), 0) / allDrivers.length) : 0;
  const cnhAlerts  = allDrivers.filter(d => d.cnhExpiry && cnhStatus(d.cnhExpiry)?.days <= 30).length;
  const totalKm    = allDrivers.reduce((a, d) => a + (d.totalKm ?? 0), 0);

  // drivers com CNH crítica para o banner
  const criticalCnh = allDrivers.map(normalize).filter(d => d._cnhStatus?.days != null && d._cnhStatus.days <= 30);

  // ── handlers ─────────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditTarget(null);
    const savedDraft = typeof window !== 'undefined' ? localStorage.getItem(DRIVER_DRAFT_KEY) : null;
    let draft = null;
    try {
      draft = savedDraft ? JSON.parse(savedDraft) : null;
    } catch {
      localStorage.removeItem(DRIVER_DRAFT_KEY);
    }
    setForm(draft ? { ...EMPTY_DRIVER, ...draft } : EMPTY_DRIVER);
    setModalError('');
    setActiveDriverTab('identification');
    setShowModal(true);
  };

  const openEdit = (d) => {
    const profile = driverProfile(d);
    setEditTarget(d);
    setForm({
      name:        d.name        ?? '',
      cpf:         d.cpf         ?? '',
      rg:          profile.rg    ?? '',
      birthDate:   dateOnly(d.birthDate),
      maritalStatus: profile.maritalStatus ?? 'single',
      phone:       d.phone       ?? '',
      email:       d.email       ?? '',
      emergencyPhone: profile.emergencyPhone ?? '',
      cnhNumber:   d.cnhNumber   ?? '',
      cnhCategory: d.cnhCategory ?? 'D',
      cnhExpiry:   dateOnly(d.cnhExpiry),
      addressZipCode:      profile.address?.zipCode      ?? '',
      addressStreet:       profile.address?.street       ?? '',
      addressNumber:       profile.address?.number       ?? '',
      addressNeighborhood: profile.address?.neighborhood ?? '',
      addressCity:         profile.address?.city         ?? '',
      addressState:        profile.address?.state        ?? '',
      carrierType: profile.carrierType ?? 'own',
      contractType: profile.contractType ?? 'clt',
      admissionDate: dateOnly(profile.admissionDate),
      operationalStatus: profile.operationalStatus ?? 'available',
      medicalExamExpiry: dateOnly(profile.medicalExamExpiry),
      toxicologicalExamExpiry: dateOnly(profile.toxicologicalExamExpiry),
      status:      d.status      ?? 'active',
      notes:       d.notes       ?? '',
    });
    setModalError('');
    setActiveDriverTab('identification');
    setShowModal(true);
  };

  const maskCPF = (v) => {
    const clean = v.replace(/\D/g, '').slice(0, 11);
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4').replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3').replace(/(\d{3})(\d{3})/, '$1.$2').replace(/(\d{3})/, '$1.');
  };
  const maskPhone = (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15);
  const maskCNH = (v) => v.replace(/\D/g, '').slice(0, 11);
  const maskCEP = (v) => v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');
  const maskRG = (v) => v.replace(/[^\dXx]/g, '').slice(0, 9).replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})([\dXx])$/, '$1-$2');

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'cpf') value = maskCPF(value);
    if (name === 'phone') value = maskPhone(value);
    if (name === 'emergencyPhone') value = maskPhone(value);
    if (name === 'cnhNumber') value = maskCNH(value);
    if (name === 'addressZipCode') value = maskCEP(value);
    if (name === 'rg') value = maskRG(value);
    if (name === 'addressState') value = value.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase();
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const buildDriverPayload = () => ({
    name: form.name.trim(),
    cpf: form.cpf || undefined,
    phone: form.phone || undefined,
    email: form.email || undefined,
    birthDate: form.birthDate || undefined,
    cnhNumber: form.cnhNumber || undefined,
    cnhCategory: form.cnhCategory || undefined,
    cnhExpiry: form.cnhExpiry || undefined,
    status: form.status || 'active',
    notes: form.notes || undefined,
    attributes: {
      ...(editTarget && editTarget.attributes ? editTarget.attributes : {}),
      driverProfile: {
        ...(driverProfile(editTarget) ?? {}),
        rg: form.rg || undefined,
        maritalStatus: form.maritalStatus || undefined,
        emergencyPhone: form.emergencyPhone || undefined,
        carrierType: form.carrierType || undefined,
        address: {
          zipCode: form.addressZipCode || undefined,
          street: form.addressStreet || undefined,
          number: form.addressNumber || undefined,
          neighborhood: form.addressNeighborhood || undefined,
          city: form.addressCity || undefined,
          state: form.addressState || undefined,
        },
        contractType: form.contractType || undefined,
        admissionDate: form.admissionDate || undefined,
        operationalStatus: form.operationalStatus || undefined,
        medicalExamExpiry: form.medicalExamExpiry || undefined,
        toxicologicalExamExpiry: form.toxicologicalExamExpiry || undefined,
      },
    },
  });

  const validateDriverForm = () => {
    if (!form.name.trim()) return { tab: 'identification', message: 'Nome completo é obrigatório.' };
    if (!form.cpf.trim()) return { tab: 'identification', message: 'CPF é obrigatório.' };
    if (!form.phone.trim()) return { tab: 'identification', message: 'Celular é obrigatório.' };
    if (!form.cnhNumber.trim()) return { tab: 'cnh', message: 'Número da CNH é obrigatório para liberar o motorista no wizard.' };
    if (!form.cnhCategory) return { tab: 'cnh', message: 'Categoria da CNH é obrigatória.' };
    if (!form.cnhExpiry) return { tab: 'cnh', message: 'Validade da CNH é obrigatória.' };
    return null;
  };

  const handleCepBlur = async () => {
    const cep = form.addressZipCode.replace(/\D/g, '');
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await validateCep(cep);
      const data = res?.data ?? res;
      if (data?.valid && data?.data) {
        const cepData = data.data;
        setForm(prev => ({
          ...prev,
          addressStreet: cepData.logradouro || prev.addressStreet,
          addressNeighborhood: cepData.bairro || prev.addressNeighborhood,
          addressCity: cepData.localidade || prev.addressCity,
          addressState: cepData.uf || prev.addressState,
        }));
      }
    } finally {
      setCepLoading(false);
    }
  };

  const saveDriverDraft = () => {
    localStorage.setItem(DRIVER_DRAFT_KEY, JSON.stringify(form));
    alert('Rascunho salvo neste navegador.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateDriverForm();
    if (validation) {
      setActiveDriverTab(validation.tab);
      setModalError(validation.message);
      return;
    }
    setSaving(true); setModalError('');
    try {
      const payload = buildDriverPayload();
      if (editTarget) {
        const id = editTarget._id ?? editTarget.id;
        const updated = await apiRequest(`/fleet/fleet-drivers/${id}`, { method: 'PUT', body: payload });
        setAllDrivers(prev => prev.map(d => (d._id ?? d.id) === id ? (updated?.data ?? updated) : d));
      } else {
        const created = await apiRequest('/fleet/fleet-drivers', { method: 'POST', body: payload });
        setAllDrivers(prev => [created?.data ?? created, ...prev]);
        localStorage.removeItem(DRIVER_DRAFT_KEY);
      }
      setShowModal(false);
    } catch (err) {
      setModalError(err?.body?.message ?? err?.message ?? 'Erro ao salvar motorista.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (d) => {
    if (!confirm(`Remover motorista "${d.name}"? Esta ação é irreversível.`)) return;
    const id = d._id ?? d.id;
    setDeleting(id);
    try {
      await apiRequest(`/fleet/fleet-drivers/${id}`, { method: 'DELETE' });
      setAllDrivers(prev => prev.filter(dr => (dr._id ?? dr.id) !== id));
    } catch {
      alert('Erro ao remover motorista.');
    } finally {
      setDeleting(null);
    }
  };

  // vincular veículo ao motorista
  const openAssign = (d) => {
    setAssignTarget(d);
    setAssignVehicle(d.currentVehicleId ?? '');
    setAssignError('');
    setShowAssign(true);
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setAssignSaving(true); setAssignError('');
    try {
      if (assignVehicle) {
        await assignDriver(assignVehicle, assignTarget._id ?? assignTarget.id);
      } else if (assignTarget.currentVehicleId) {
        // remove vinculação: passa null
        await assignDriver(assignTarget.currentVehicleId, null);
      }
      await load();
      setShowAssign(false);
    } catch (err) {
      setAssignError(err?.body?.message ?? err?.message ?? 'Erro ao vincular veículo.');
    } finally {
      setAssignSaving(false);
    }
  };

  const openPin = (d) => {
    setPinTarget(d);
    setPinValue('');
    setPinError('');
    setShowPin(true);
  };

  const handleSetPin = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pinValue)) { setPinError('PIN deve ter exatamente 6 dígitos numéricos.'); return; }
    const id = pinTarget._id ?? pinTarget.id;
    setPinSaving(true); setPinError('');
    try {
      await apiRequest(`/driver/admin/set-pin/${id}`, { method: 'POST', body: { pin: pinValue } });
      setShowPin(false);
    } catch (err) {
      setPinError(err?.body?.message ?? err?.message ?? 'Erro ao definir PIN.');
    } finally {
      setPinSaving(false);
    }
  };

  const openDriverLink = (d) => {
    setDriverLinkTarget(d);
    setDriverLinkHours(48);
    setDriverLinkResult(null);
    setDriverLinkError('');
    setShowDriverLink(true);
  };

  const handleCreateDriverLink = async (e) => {
    e.preventDefault();
    const id = driverLinkTarget?._id ?? driverLinkTarget?.id;
    if (!id) return;
    setDriverLinkSaving(true);
    setDriverLinkError('');
    try {
      const res = await apiRequest('/driver/admin/access-links', {
        method: 'POST',
        body: {
          driverId: id,
          expiresInHours: Number(driverLinkHours) || 48,
        },
      });
      const payload = res?.data ?? res;
      setDriverLinkResult({
        ...payload,
        url: payload?.url?.startsWith('/')
          ? `${window.location.origin}${payload.url}`
          : payload?.url,
      });
    } catch (err) {
      setDriverLinkError(err?.body?.message ?? err?.message ?? 'Erro ao gerar link.');
    } finally {
      setDriverLinkSaving(false);
    }
  };

  const copyDriverLink = async () => {
    if (!driverLinkResult?.url) return;
    try {
      await navigator.clipboard.writeText(driverLinkResult.url);
      alert('Link copiado.');
    } catch {
      window.prompt('Copie o link do motorista:', driverLinkResult.url);
    }
  };

  const handleSyncScores = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await syncDriverScores();
      setSyncResult(res ?? { updated: '?' });
      await load();
    } catch {
      alert('Erro ao recalcular scores.');
    } finally {
      setSyncing(false);
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

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <div className="fm-body">
      <SimpleBar className="nicescroll-bar">
        <div className="container-fluid px-4 py-4">

          {/* Header */}
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h4 className="fw-bold mb-0">Motoristas</h4>
              <small className="text-muted">{allDrivers.length} motorista{allDrivers.length !== 1 ? 's' : ''} cadastrado{allDrivers.length !== 1 ? 's' : ''}</small>
            </div>
            <div className="d-flex gap-2">
              <Button variant="soft-secondary" size="sm" className="d-flex align-items-center gap-1" onClick={load} disabled={loading}>
                {loading ? <Spinner size="sm" /> : <RefreshCw size={14} />} Atualizar
              </Button>
              <Button variant="soft-info" size="sm" className="d-flex align-items-center gap-1" onClick={handleSyncScores} disabled={syncing || loading}>
                {syncing ? <Spinner size="sm" /> : <Activity size={14} />} Recalcular Scores
              </Button>
              <Button variant="primary" className="d-flex align-items-center gap-2" onClick={openAdd}>
                <Plus size={16} /> Adicionar Motorista
              </Button>
            </div>
          </div>

          {/* Score sync feedback */}
          {syncResult && (
            <Alert variant="success" className="mb-3 py-2 d-flex align-items-center justify-content-between" dismissible onClose={() => setSyncResult(null)}>
              <span className="small">
                <Activity size={14} className="me-1" />
                Scores atualizados para <strong>{syncResult.updated ?? '?'}</strong> motorista{syncResult.updated !== 1 ? 's' : ''}.
                {syncResult.skipped > 0 && ` ${syncResult.skipped} sem veículo vinculado.`}
              </span>
            </Alert>
          )}

          {/* Alerta CNH crítica */}
          {!loading && criticalCnh.length > 0 && (
            <Alert variant="danger" className="mb-4 py-2">
              <div className="d-flex align-items-start gap-2">
                <AlertTriangle size={18} className="flex-shrink-0 mt-1" />
                <div>
                  <strong>Atenção — CNH vencida ou vencendo em até 30 dias:</strong>
                  <div className="d-flex flex-wrap gap-2 mt-1">
                    {criticalCnh.map(d => (
                      <Badge
                        key={d._id ?? d.id}
                        bg={d._cnhStatus.days < 0 ? 'danger' : 'warning'}
                        text={d._cnhStatus.days < 0 ? 'white' : 'dark'}
                        className="cursor-pointer"
                        onClick={() => setSelected(d)}
                        style={{ cursor: 'pointer' }}
                      >
                        {d.name} — {d._cnhStatus.days < 0 ? 'VENCIDA' : `${d._cnhStatus.days} dias`}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Alert>
          )}

          {/* KPIs */}
          <Row className="g-3 mb-4">
            {[
              { label: 'Total',          value: allDrivers.length, color: 'primary' },
              { label: 'Ativos',         value: ativos,            color: 'success' },
              { label: 'Score Médio',    value: `${avgScore}/100`, color: 'info' },
              { label: 'CNH Críticas ⚠️', value: cnhAlerts,        color: cnhAlerts > 0 ? 'danger' : 'secondary' },
            ].map(k => (
              <Col key={k.label} xs={6} md={3}>
                <Card className={`card-border text-center ${k.label.includes('CNH') && cnhAlerts > 0 ? 'border-danger' : ''}`}>
                  <Card.Body className="py-3">
                    <h3 className={`fw-bold text-${k.color} mb-0`}>{loading ? '…' : k.value}</h3>
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
                <Col md={5}>
                  <InputGroup>
                    <InputGroup.Text><Search size={16} /></InputGroup.Text>
                    <Form.Control
                      placeholder="Buscar por nome, CPF, telefone..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col md={3}>
                  <Form.Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">Todos os status</option>
                    <option value="active">Ativos</option>
                    <option value="inactive">Inativos</option>
                    <option value="suspended">Suspensos</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Select value={filterCnh} onChange={e => setFilterCnh(e.target.value)}>
                    <option value="">Todas as CNHs</option>
                    <option value="expired">CNH Vencida</option>
                    <option value="expiring30">Vence em 30 dias</option>
                    <option value="expiring90">Vence em 90 dias</option>
                  </Form.Select>
                </Col>
                <Col md={1} className="d-flex align-items-center">
                  {(search || filterStatus || filterCnh) && (
                    <Button variant="soft-secondary" size="sm" onClick={() => { setSearch(''); setFilterStatus(''); setFilterCnh(''); }}>
                      <X size={14} />
                    </Button>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Tabela */}
          <Card className="card-border">
            <Card.Body className="p-0">
              {loading
                ? <div className="text-center py-5"><Spinner /></div>
                : drivers.length === 0
                  ? (
                    <div className="text-center py-5 text-muted">
                      <User size={40} className="mb-3 opacity-50" />
                      <p className="mb-1">Nenhum motorista encontrado.</p>
                      <small>Ajuste os filtros ou cadastre um novo motorista.</small>
                    </div>
                  )
                  : (
                  <SimpleBar>
                    <Table hover className="mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th>Motorista</th>
                          <th>CNH</th>
                          <th>Vencimento CNH</th>
                          <th>Status</th>
                          <th>Veículo</th>
                          <th>Score</th>
                          <th>Viagens</th>
                          <th>KM Total</th>
                          <th className="text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {drivers.map(d => {
                          const cfg    = statusConfig[d._status] ?? statusConfig.inactive;
                          const cnh    = d._cnhStatus;
                          const rowId  = d._id ?? d.id;
                          return (
                            <tr key={rowId}>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <div className="avatar avatar-icon avatar-sm avatar-soft-primary avatar-rounded">
                                    <User size={14} />
                                  </div>
                                  <div>
                                    <div className="fw-semibold small">{d.name}</div>
                                    <small className="text-muted">{d._phone || d.email || '–'}</small>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <Badge bg="light" text="dark" className="fw-semibold">Tipo {d._cnh}</Badge>
                                {d.cnhNumber && <small className="text-muted d-block">{d.cnhNumber}</small>}
                              </td>
                              <td>
                                {cnh
                                  ? (
                                    <div>
                                      <Badge bg={cnh.color} text={cnh.color === 'warning' ? 'dark' : 'white'} className="me-1">
                                        {cnh.days < 0 ? 'VENCIDA' : cnh.label}
                                      </Badge>
                                      <small className="text-muted d-block">
                                        {new Date(d._expiry).toLocaleDateString('pt-BR')}
                                      </small>
                                    </div>
                                  )
                                  : <small className="text-muted">–</small>
                                }
                              </td>
                              <td>
                                <Badge bg={cfg.bg} className="text-white">{cfg.label}</Badge>
                              </td>
                              <td>
                                {d.vehicle
                                  ? (
                                    <div className="d-flex align-items-center gap-1">
                                      <Truck size={12} className="text-muted" />
                                      <small>{d.vehicle.name}</small>
                                    </div>
                                  )
                                  : <small className="text-muted">–</small>
                                }
                              </td>
                              <td>
                                <div style={{ width: 80 }}>
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <small className={`fw-bold text-${scoreColor(d._score)}`}>{d._score}</small>
                                    <small className={`text-${scoreColor(d._score)}`} style={{ fontSize: '0.65rem' }}>
                                      {scoreLabel(d._score)}
                                    </small>
                                  </div>
                                  <ProgressBar
                                    now={d._score}
                                    variant={scoreColor(d._score)}
                                    style={{ height: 4 }}
                                  />
                                </div>
                              </td>
                              <td><small>{d._trips}</small></td>
                              <td>
                                <small>
                                  {d._km >= 1000
                                    ? `${(d._km / 1000).toFixed(1)}k`
                                    : d._km} km
                                </small>
                              </td>
                              <td className="text-center">
                                <div className="d-flex justify-content-center gap-1">
                                  <Button variant={isDark ? "outline-primary" : "primary"}  size="sm" title="Ver detalhes"    onClick={() => setSelected(d)} className={!isDark ? "text-white" : ""}><Eye size={13} /></Button>
                                  <Button variant={isDark ? "outline-info" : "info"}     size="sm" title="Vincular veículo" onClick={() => openAssign(d)} className={!isDark ? "text-white" : ""}><Link2 size={13} /></Button>
                                  <Button variant={isDark ? "outline-success" : "success"} size="sm" title="Gerar link web do motorista" onClick={() => openDriverLink(d)} className={!isDark ? "text-white" : ""}><Link2 size={13} /></Button>
                                  <Button variant={isDark ? "outline-warning" : "warning"}  size="sm" title="Editar"          onClick={() => openEdit(d)} className={isDark ? "" : "text-dark"}><Edit2 size={13} /></Button>
                                  <Button variant={isDark ? "outline-secondary" : "secondary"} size="sm" title="Definir PIN do app" onClick={() => openPin(d)} className={!isDark ? "text-white" : ""}><Key size={13} /></Button>
                                  <Button
                                    variant={isDark ? "outline-danger" : "danger"} size="sm" title="Remover"
                                    disabled={deleting === rowId}
                                    onClick={() => handleDelete(d)}
                                    className={!isDark ? "text-white" : ""}
                                  >
                                    {deleting === rowId ? <Spinner size="sm" /> : <Trash2 size={13} />}
                                  </Button>
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

      {/* ── Modal detalhe ─────────────────────────────────────────────────────── */}
      <Modal show={!!selected} onHide={() => setSelected(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold d-flex align-items-center gap-2">
            <User size={16} className="text-primary" /> {selected?.name}
            {selected?._cnhStatus?.days != null && selected._cnhStatus.days <= 30 && (
              <Badge bg={selected._cnhStatus.days < 0 ? 'danger' : 'warning'} text={selected._cnhStatus.days < 0 ? 'white' : 'dark'}>
                {selected._cnhStatus.days < 0 ? '⚠️ CNH VENCIDA' : `⚠️ CNH vence em ${selected._cnhStatus.days}d`}
              </Badge>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selected && (
            <>
              {/* Score */}
              <div className="p-3 bg-light rounded mb-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="fw-semibold small">Score de Condução</span>
                  <span className={`fw-bold fs-4 text-${scoreColor(selected._score)}`}>{selected._score}<small className="fs-6">/100</small></span>
                </div>
                <ProgressBar
                  now={selected._score}
                  variant={scoreColor(selected._score)}
                  style={{ height: 10, borderRadius: 6 }}
                />
                <small className={`text-${scoreColor(selected._score)} fw-semibold`}>{scoreLabel(selected._score)}</small>
              </div>

              <Row className="g-3">
                {[
                  { label: 'Telefone',       value: selected._phone || '–' },
                  { label: 'E-mail',         value: selected.email  || '–' },
                  { label: 'CPF',            value: selected.cpf    || '–' },
                  { label: 'Nº CNH',         value: selected.cnhNumber || '–' },
                  { label: 'Categoria CNH',  value: `Categoria ${selected._cnh}` },
                  { label: 'Vencimento CNH', value: selected._expiry ? new Date(selected._expiry).toLocaleDateString('pt-BR') : '–', warn: selected._cnhStatus?.days != null && selected._cnhStatus.days <= 90 },
                  { label: 'Status',         value: statusConfig[selected._status]?.label ?? '–' },
                  { label: 'Veículo Atual',  value: selected.vehicle?.name ?? 'Não vinculado' },
                  { label: 'Total Viagens',  value: selected._trips },
                  { label: 'KM Total',       value: `${selected._km >= 1000 ? (selected._km / 1000).toFixed(1) + 'k' : selected._km} km` },
                ].map(item => (
                  <Col xs={6} key={item.label}>
                    <small className="text-muted d-block">{item.label}</small>
                    <strong className={`small ${item.warn ? 'text-warning' : ''}`}>{item.value}</strong>
                  </Col>
                ))}
                {selected.notes && (
                  <Col xs={12}>
                    <small className="text-muted d-block">Observações</small>
                    <small>{selected.notes}</small>
                  </Col>
                )}
              </Row>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="soft-info" size="sm" onClick={() => { const d = selected; setSelected(null); openAssign(d); }}>
            <Link2 size={13} className="me-1" /> Vincular Veículo
          </Button>
          <Button variant="soft-success" size="sm" onClick={() => { const d = selected; setSelected(null); openDriverLink(d); }}>
            <Link2 size={13} className="me-1" /> Link Web
          </Button>
          <Button variant="soft-warning" size="sm" onClick={() => { const d = selected; setSelected(null); openEdit(d); }}>
            <Edit2 size={13} className="me-1" /> Editar
          </Button>
          <Button variant="light" size="sm" onClick={() => setSelected(null)}>Fechar</Button>
        </Modal.Footer>
      </Modal>

      {/* ── Modal add / edit ────────────────────────────────────────────────────── */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <div>
              <Modal.Title className="fs-4 fw-bold text-dark">
                {editTarget ? `Editar: ${editTarget.name}` : 'Novo Motorista'}
              </Modal.Title>
              <div className="text-muted small">Cadastro completo de motorista</div>
            </div>
          </Modal.Header>
          <Modal.Body>
            {modalError && <Alert variant="danger" className="py-2 small">{modalError}</Alert>}
            <Nav variant="pills" activeKey={activeDriverTab} onSelect={setActiveDriverTab} className="bg-light rounded p-1 mb-4 d-flex justify-content-between">
              {DRIVER_TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <Nav.Item key={tab.key} className="flex-fill text-center">
                    <Nav.Link eventKey={tab.key} className="py-2 small fw-semibold">
                      <Icon size={15} className="me-1" /> {tab.label}
                    </Nav.Link>
                  </Nav.Item>
                );
              })}
            </Nav>

            {activeDriverTab === 'identification' && (
              <>
                <Form.Group className="mb-4">
                  <Form.Label className="small fw-semibold">Transportadora</Form.Label>
                  <Form.Select name="carrierType" value={form.carrierType} onChange={handleChange}>
                    <option value="own">Transportadora própria</option>
                    <option value="aggregate">Agregado</option>
                    <option value="third_party">Terceiro / parceiro</option>
                  </Form.Select>
                </Form.Group>

                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="avatar avatar-icon avatar-sm avatar-soft-primary avatar-rounded"><User size={16} /></div>
                  <h6 className="fw-bold mb-0">Dados Pessoais</h6>
                </div>
                <hr className="mt-0" />

                <Row className="g-3">
                  <Col md={6}>
                    <Form.Label className="small fw-semibold">Nome Completo <span className="text-danger">*</span></Form.Label>
                    <Form.Control name="name" value={form.name} onChange={handleChange} placeholder="Nome completo do motorista" required />
                  </Col>
                  <Col md={6}>
                    <Form.Label className="small fw-semibold">CPF <span className="text-danger">*</span></Form.Label>
                    <Form.Control name="cpf" value={form.cpf} onChange={handleChange} placeholder="000.000.000-00" />
                  </Col>
                  <Col md={4}>
                    <Form.Label className="small fw-semibold">RG</Form.Label>
                    <Form.Control name="rg" value={form.rg} onChange={handleChange} placeholder="00.000.000-0" />
                  </Col>
                  <Col md={4}>
                    <Form.Label className="small fw-semibold">Data de Nascimento</Form.Label>
                    <Form.Control type="date" name="birthDate" value={form.birthDate} onChange={handleChange} />
                  </Col>
                  <Col md={4}>
                    <Form.Label className="small fw-semibold">Estado Civil</Form.Label>
                    <Form.Select name="maritalStatus" value={form.maritalStatus} onChange={handleChange}>
                      {Object.entries(MARITAL_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </Form.Select>
                  </Col>
                  <Col md={6}>
                    <Form.Label className="small fw-semibold">Celular <span className="text-danger">*</span></Form.Label>
                    <Form.Control name="phone" value={form.phone} onChange={handleChange} placeholder="(00) 00000-0000" />
                  </Col>
                  <Col md={6}>
                    <Form.Label className="small fw-semibold">Email</Form.Label>
                    <Form.Control type="email" name="email" value={form.email} onChange={handleChange} placeholder="motorista@email.com" />
                  </Col>
                  <Col xs={12}>
                    <Form.Label className="small fw-semibold">Telefone de Emergência</Form.Label>
                    <Form.Control name="emergencyPhone" value={form.emergencyPhone} onChange={handleChange} placeholder="Contato de familiar ou pessoa próxima" />
                    <Form.Text className="text-muted">Contato de familiar ou pessoa próxima</Form.Text>
                  </Col>
                </Row>
              </>
            )}

            {activeDriverTab === 'address' && (
              <>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="avatar avatar-icon avatar-sm avatar-soft-primary avatar-rounded"><MapPin size={16} /></div>
                  <h6 className="fw-bold mb-0">Endereço Residencial</h6>
                </div>
                <hr className="mt-0" />

                <Row className="g-3">
                  <Col xs={12}>
                    <Form.Label className="small fw-semibold">CEP</Form.Label>
                    <InputGroup>
                      <Form.Control name="addressZipCode" value={form.addressZipCode} onChange={handleChange} onBlur={handleCepBlur} placeholder="00000-000" />
                      {cepLoading && <InputGroup.Text><Spinner size="sm" /></InputGroup.Text>}
                    </InputGroup>
                    <Form.Text className="text-muted">Digite o CEP para buscar automaticamente</Form.Text>
                  </Col>
                  <Col md={9}>
                    <Form.Label className="small fw-semibold">Logradouro</Form.Label>
                    <Form.Control name="addressStreet" value={form.addressStreet} onChange={handleChange} />
                  </Col>
                  <Col md={3}>
                    <Form.Label className="small fw-semibold">Número</Form.Label>
                    <Form.Control name="addressNumber" value={form.addressNumber} onChange={handleChange} />
                  </Col>
                  <Col md={4}>
                    <Form.Label className="small fw-semibold">Bairro</Form.Label>
                    <Form.Control name="addressNeighborhood" value={form.addressNeighborhood} onChange={handleChange} />
                  </Col>
                  <Col md={4}>
                    <Form.Label className="small fw-semibold">Cidade</Form.Label>
                    <Form.Control name="addressCity" value={form.addressCity} onChange={handleChange} />
                  </Col>
                  <Col md={4}>
                    <Form.Label className="small fw-semibold">Estado</Form.Label>
                    <Form.Control name="addressState" value={form.addressState} onChange={handleChange} placeholder="UF" />
                    <div className="text-end text-muted small mt-1">{form.addressState.length}/2</div>
                  </Col>
                </Row>
              </>
            )}

            {activeDriverTab === 'cnh' && (
              <>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="avatar avatar-icon avatar-sm avatar-soft-primary avatar-rounded"><CreditCard size={16} /></div>
                  <h6 className="fw-bold mb-0">Carteira Nacional de Habilitação</h6>
                </div>
                <hr className="mt-0" />

                <Row className="g-3">
                  <Col md={4}>
                    <Form.Label className="small fw-semibold">Número da CNH <span className="text-danger">*</span></Form.Label>
                    <Form.Control name="cnhNumber" value={form.cnhNumber} onChange={handleChange} placeholder="00000000000" />
                    <div className="text-end text-muted small mt-1">{form.cnhNumber.length}/11</div>
                  </Col>
                  <Col md={4}>
                    <Form.Label className="small fw-semibold">Categoria <span className="text-danger">*</span></Form.Label>
                    <Form.Select name="cnhCategory" value={form.cnhCategory} onChange={handleChange}>
                      {['A','B','C','D','E','AB','AC','AD','AE'].map(c => <option key={c} value={c}>{c}</option>)}
                    </Form.Select>
                  </Col>
                  <Col md={4}>
                    <Form.Label className="small fw-semibold">Validade <span className="text-danger">*</span></Form.Label>
                    <Form.Control type="date" name="cnhExpiry" value={form.cnhExpiry} onChange={handleChange} />
                    <Form.Text className="text-muted">Data de vencimento da CNH</Form.Text>
                    {form.cnhExpiry && (() => {
                      const s = cnhStatus(form.cnhExpiry);
                      return s && s.days <= 90
                        ? <Form.Text className={`d-block text-${s.color}`}>{s.days < 0 ? 'CNH já vencida!' : `Vence em ${s.days} dias`}</Form.Text>
                        : null;
                    })()}
                  </Col>
                </Row>
              </>
            )}

            {activeDriverTab === 'contract' && (
              <>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="avatar avatar-icon avatar-sm avatar-soft-primary avatar-rounded"><Briefcase size={16} /></div>
                  <h6 className="fw-bold mb-0">Vínculo Contratual</h6>
                </div>
                <hr className="mt-0" />

                <Row className="g-3">
                  <Col md={6}>
                    <Form.Label className="small fw-semibold">Tipo de Contrato</Form.Label>
                    <Form.Select name="contractType" value={form.contractType} onChange={handleChange}>
                      {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </Form.Select>
                  </Col>
                  <Col md={6}>
                    <Form.Label className="small fw-semibold">Data de Admissão</Form.Label>
                    <Form.Control type="date" name="admissionDate" value={form.admissionDate} onChange={handleChange} />
                  </Col>
                  <Col xs={12}>
                    <Form.Label className="small fw-semibold">Status Operacional</Form.Label>
                    <Form.Select name="operationalStatus" value={form.operationalStatus} onChange={handleChange}>
                      {Object.entries(OPERATIONAL_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </Form.Select>
                  </Col>
                  {editTarget && (
                    <Col md={4}>
                      <Form.Label className="small fw-semibold">Status do Cadastro</Form.Label>
                      <Form.Select name="status" value={form.status} onChange={handleChange}>
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                        <option value="suspended">Suspenso</option>
                      </Form.Select>
                    </Col>
                  )}
                </Row>
              </>
            )}

            {activeDriverTab === 'health' && (
              <>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="avatar avatar-icon avatar-sm avatar-soft-primary avatar-rounded"><Heart size={16} /></div>
                  <div>
                    <h6 className="fw-bold mb-0">Exames Obrigatórios</h6>
                    <div className="text-muted small">Exigidos pela legislação de trânsito</div>
                  </div>
                </div>
                <hr className="mt-0" />

                <Row className="g-3">
                  <Col md={6}>
                    <Form.Label className="small fw-semibold">Validade Exame Médico</Form.Label>
                    <Form.Control type="date" name="medicalExamExpiry" value={form.medicalExamExpiry} onChange={handleChange} />
                    <Form.Text className="text-muted">Obrigatório para motoristas profissionais</Form.Text>
                  </Col>
                  <Col md={6}>
                    <Form.Label className="small fw-semibold">Validade Exame Toxicológico</Form.Label>
                    <Form.Control type="date" name="toxicologicalExamExpiry" value={form.toxicologicalExamExpiry} onChange={handleChange} />
                    <Form.Text className="text-muted">Obrigatório a cada 2,5 anos</Form.Text>
                  </Col>
                  <Col xs={12}>
                    <Form.Label className="small fw-semibold">Observações</Form.Label>
                    <Form.Control as="textarea" rows={2} name="notes" value={form.notes} onChange={handleChange} placeholder="Informações adicionais..." />
                  </Col>
                </Row>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="link" className="me-auto text-dark text-decoration-none" onClick={saveDriverDraft} type="button">
              <Save size={15} className="me-2" /> Salvar Rascunho
            </Button>
            <Button variant="light" size="sm" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" variant="primary" size="sm" disabled={saving}>
              {saving ? <Spinner size="sm" className="me-1" /> : <Check size={15} className="me-1" />}
              {saving ? 'Salvando…' : editTarget ? 'Salvar alterações' : 'Cadastrar Motorista'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Modal link web do motorista ──────────────────────────────────────── */}
      <Modal show={showDriverLink} onHide={() => setShowDriverLink(false)} centered>
        <Form onSubmit={handleCreateDriverLink}>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold">
              <Link2 size={16} className="me-2 text-success" />
              Link Web — {driverLinkTarget?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {driverLinkError && <Alert variant="danger" className="py-2 small">{driverLinkError}</Alert>}
            <Form.Label className="small fw-semibold">Validade do link</Form.Label>
            <Form.Select
              value={driverLinkHours}
              onChange={e => setDriverLinkHours(e.target.value)}
              disabled={!!driverLinkResult}
            >
              <option value={24}>24 horas</option>
              <option value={48}>48 horas</option>
              <option value={72}>72 horas</option>
              <option value={168}>7 dias</option>
            </Form.Select>
            <Form.Text className="text-muted">
              O link lista todas as viagens úteis do motorista e expira automaticamente.
            </Form.Text>

            {driverLinkResult?.url && (
              <Alert variant="success" className="mt-3 mb-0">
                <div className="small fw-semibold mb-2">Link gerado:</div>
                <InputGroup size="sm">
                  <Form.Control value={driverLinkResult.url} readOnly />
                  <Button variant="success" onClick={copyDriverLink} type="button">
                    Copiar
                  </Button>
                </InputGroup>
                <small className="d-block mt-2">
                  Expira em {new Date(driverLinkResult.expiresAt).toLocaleString('pt-BR')}.
                </small>
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" size="sm" onClick={() => setShowDriverLink(false)}>Fechar</Button>
            {!driverLinkResult && (
              <Button type="submit" variant="success" size="sm" disabled={driverLinkSaving}>
                {driverLinkSaving && <Spinner size="sm" className="me-1" />}
                {driverLinkSaving ? 'Gerando…' : 'Gerar link'}
              </Button>
            )}
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Modal PIN ─────────────────────────────────────────────────────────── */}
      <Modal show={showPin} onHide={() => setShowPin(false)} centered size="sm">
        <Form onSubmit={handleSetPin}>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold">
              <Key size={16} className="me-2 text-secondary" />
              PIN do App — {pinTarget?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {pinError && <Alert variant="danger" className="py-2 small">{pinError}</Alert>}
            <Form.Label className="small fw-semibold">PIN (6 dígitos)</Form.Label>
            <Form.Control
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••••"
              value={pinValue}
              onChange={e => setPinValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
              autoFocus
            />
            <Form.Text className="text-muted">
              O motorista usará este PIN junto ao telefone para entrar no app.
            </Form.Text>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" size="sm" onClick={() => setShowPin(false)}>Cancelar</Button>
            <Button type="submit" variant="secondary" size="sm" disabled={pinSaving || pinValue.length !== 6}>
              {pinSaving && <Spinner size="sm" className="me-1" />}
              {pinSaving ? 'Salvando…' : 'Definir PIN'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── Modal vincular veículo ─────────────────────────────────────────────── */}
      <Modal show={showAssign} onHide={() => setShowAssign(false)} centered>
        <Form onSubmit={handleAssign}>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold">
              <Truck size={16} className="me-2 text-info" />
              Vincular Veículo — {assignTarget?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {assignError && <Alert variant="danger" className="py-2 small">{assignError}</Alert>}
            <Form.Label className="small fw-semibold">Veículo responsável</Form.Label>
            <Form.Select value={assignVehicle} onChange={e => setAssignVehicle(e.target.value)}>
              <option value="">— Nenhum (remover vinculação) —</option>
              {vehicles
                .filter(v => !v.defaultDriverId || v.defaultDriverId === (assignTarget?._id ?? assignTarget?.id))
                .map(v => (
                  <option key={v._id ?? v.id} value={v._id ?? v.id}>
                    {v.name} {v.plate ? `(${v.plate})` : ''}
                  </option>
                ))
              }
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
