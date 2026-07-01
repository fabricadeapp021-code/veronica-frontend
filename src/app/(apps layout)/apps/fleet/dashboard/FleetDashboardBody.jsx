'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Row, Col, Card, Badge, Spinner, ProgressBar } from 'react-bootstrap';
import {
  Truck, AlertTriangle, TrendingUp, MapPin, Navigation, RefreshCw,
  Activity, Tool, DollarSign, Cpu, Clock, CheckCircle, AlertCircle,
} from 'react-feather';
import SimpleBar from 'simplebar-react';
import Link from 'next/link';
import {
  getFleetDashboard, getDevices, getTrips, getEvents,
  getTraccarDevices, getPositions, getMaintenances, todayRange,
} from '@/lib/api/services/fleet';
import { getFinancialSummary } from '@/lib/api/services/financial';
import { useColorMode } from '@/hooks/useColorMode';
import OnboardingWizard from './OnboardingWizard';

// ── helpers visuais ────────────────────────────────────────────────────────────

const statusLabel   = { online: { label: 'Online', bg: 'success' }, offline: { label: 'Offline', bg: 'danger' }, unknown: { label: 'Inativo', bg: 'secondary' } };
const eventTypes    = {
  speedingStart: 'Excesso de velocidade', geofenceExit: 'Saída de geofence',
  geofenceEnter: 'Entrada em geofence',   ignitionOff: 'Ignição desligada',
  deviceOffline: 'Dispositivo offline',   hardBraking: 'Freada brusca',
  hardAcceleration: 'Aceleração brusca',  alarm: 'Alarme',
};
const AUTO_REFRESH_MS = 60_000;

function StatCard({ title, value, sub, icon: Icon, color, href, loading, isDark }) {
  return (
    <Card className="card-border h-100">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <p className="text-muted mb-1 small">{title}</p>
            <h2 className="fw-bold mb-0">{loading ? <Spinner size="sm" /> : (value ?? '–')}</h2>
            {sub && <small className="text-muted">{sub}</small>}
          </div>
          <div className={`avatar avatar-icon avatar-lg avatar-soft-${color} avatar-rounded`}>
            <Icon size={22} />
          </div>
        </div>
        {href && (
          <Link href={href} className={isDark ? `btn btn-outline-${color} btn-xs mt-3 w-100` : `btn btn-soft-${color} btn-xs mt-3 w-100`}>Ver detalhes →</Link>
        )}
      </Card.Body>
    </Card>
  );
}

function MiniStatCard({ title, value, icon: Icon, color, loading }) {
  return (
    <Card className="card-border h-100">
      <Card.Body className="py-3">
        <div className="d-flex align-items-center gap-3">
          <div className={`avatar avatar-icon avatar-md avatar-soft-${color} avatar-rounded flex-shrink-0`}>
            <Icon size={16} />
          </div>
          <div className="flex-fill min-width-0">
            <p className="text-muted mb-0 small text-truncate">{title}</p>
            <h4 className="fw-bold mb-0">
              {loading ? <Spinner size="sm" /> : (value ?? '–')}
            </h4>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

// ── componente principal ───────────────────────────────────────────────────────

export default function FleetDashboardBody() {
  const { isDark } = useColorMode();
  const [stats,        setStats]        = useState(null);
  const [vehicles,     setVehicles]     = useState([]);
  const [traccarDevs,  setTraccarDevs]  = useState([]);
  const [positions,    setPositions]    = useState([]);
  const [trips,        setTrips]        = useState([]);
  const [events,       setEvents]       = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [financials,   setFinancials]   = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [lastFetch,    setLastFetch]    = useState(null);
  const [showOnboard,  setShowOnboard]  = useState(false);
  const timerRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { from, to } = todayRange();
    try {
      const [s, v, td, pos, t, e, m, fin] = await Promise.allSettled([
        getFleetDashboard(),
        getDevices({ all: true }),
        getTraccarDevices(),
        getPositions(),
        getTrips({ from, to }),
        getEvents({ from, to }),
        getMaintenances(),
        getFinancialSummary().catch(() => null),
      ]);
      if (s.status   === 'fulfilled' && s.value)                setStats(s.value);
      if (v.status   === 'fulfilled' && Array.isArray(v.value)) setVehicles(v.value);
      if (td.status  === 'fulfilled' && Array.isArray(td.value)) setTraccarDevs(td.value);
      if (pos.status === 'fulfilled' && Array.isArray(pos.value)) setPositions(pos.value);
      if (t.status   === 'fulfilled' && Array.isArray(t.value))  setTrips(t.value);
      if (e.status   === 'fulfilled' && Array.isArray(e.value))  setEvents(e.value);
      if (m.status   === 'fulfilled' && Array.isArray(m.value))  setMaintenances(m.value);
      if (fin.status === 'fulfilled' && fin.value)              setFinancials(fin.value);
      setLastFetch(new Date());

      const dismissed = sessionStorage.getItem('onboarding_dismissed');
      if (!dismissed) {
        const hasVehicles = v.status === 'fulfilled' && v.value?.length > 0;
        const hasDevices  = td.status === 'fulfilled' && td.value?.length > 0;
        if (!hasVehicles || !hasDevices) setShowOnboard(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    timerRef.current = setInterval(load, AUTO_REFRESH_MS);
    return () => clearInterval(timerRef.current);
  }, [load]);

  // ── métricas calculadas ────────────────────────────────────────────────────
  const total    = vehicles.length;
  const online   = stats?.onlineVehicles  ?? vehicles.filter(v => (v.telemetry?.status ?? v.status) === 'online').length;
  const offline  = stats?.offlineVehicles ?? vehicles.filter(v => (v.telemetry?.status ?? v.status) === 'offline').length;
  const inactive = stats?.unknownVehicles ?? (total - online - offline);
  const moving   = stats?.movingVehicles  ?? positions.filter(p => p.attributes?.motion === true).length;
  const stopped  = stats?.stoppedVehicles ?? positions.filter(p => p.attributes?.motion === false && p.attributes?.ignition === true).length;
  const pct      = total > 0 ? Math.round((online / total) * 100) : 0;

  const activeTrips    = trips.filter(t => !t.endTime || t.status === 'running').length;
  const completedTrips = trips.filter(t => t.endTime && t.status !== 'running').length;
  const totalKm        = (trips.reduce((a, t) => a + (t.distance ?? 0), 0) / 1000).toFixed(0);

  const linkedDevices   = traccarDevs.filter(d => d.linked).length;
  const unlinkedDevices = traccarDevs.length - linkedDevices;

  // manutenções vencidas / próximas do vencimento (campo nextDueDate ou similar)
  const pendingMaint = maintenances.filter(m => {
    if (!m.nextDueDate) return false;
    return new Date(m.nextDueDate) <= new Date(Date.now() + 7 * 24 * 3600_000);
  });

  // custo do mês corrente
  const monthCost = financials?.totalMonth ?? financials?.currentMonthTotal ?? null;
  const monthCostFmt = monthCost != null
    ? `R$ ${Number(monthCost).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : '–';

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fm-body">
      <SimpleBar className="nicescroll-bar">
        <div className="container-fluid px-4 py-4">

          {/* Header */}
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h4 className="fw-bold mb-0">Dashboard de Frota</h4>
              <small className="text-muted d-flex align-items-center gap-1">
                {loading
                  ? <><Spinner size="sm" className="me-1" />Atualizando…</>
                  : lastFetch
                    ? <><CheckCircle size={12} className="text-success me-1" />Atualizado às {lastFetch.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · auto-refresh a cada 60s</>
                    : 'Carregando…'
                }
              </small>
            </div>
            <div className="d-flex gap-2">
              <button className={isDark ? "btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" : "btn btn-soft-secondary btn-sm d-flex align-items-center gap-1"} onClick={load} disabled={loading}>
                {loading ? <Spinner size="sm" /> : <RefreshCw size={14} />}
                <span>Atualizar</span>
              </button>
              <Link href="/apps/fleet/control-tower" className={isDark ? "btn btn-outline-primary d-flex align-items-center gap-2" : "btn btn-primary d-flex align-items-center gap-2"}>
                <MapPin size={16} /> Torre de Controle
              </Link>
            </div>
          </div>

          {/* Onboarding */}
          {showOnboard && (
            <OnboardingWizard
              vehicles={vehicles.length}
              devices={traccarDevs.length}
              positions={positions.length}
              onDismiss={() => { sessionStorage.setItem('onboarding_dismissed', '1'); setShowOnboard(false); }}
            />
          )}

          {/* ── KPIs principais ── */}
          <Row className="g-3 mb-4">
            <Col xl={3} md={6} xs={6}>
              <StatCard
                title="Frota Online" value={`${online}/${total}`}
                sub={`${pct}% disponível · ${moving} em movimento`} icon={Truck} color="primary"
                href="/apps/fleet/vehicles" loading={loading} isDark={isDark}
              />
            </Col>
            <Col xl={3} md={6} xs={6}>
              <StatCard
                title="Viagens Ativas" value={activeTrips}
                sub={`${completedTrips} concluídas · ${totalKm} km hoje`}
                icon={Navigation} color="success" href="/apps/fleet/trips" loading={loading} isDark={isDark}
              />
            </Col>
            <Col xl={3} md={6} xs={6}>
              <StatCard
                title="Eventos Hoje" value={events.length}
                sub={`${events.filter(e => ['speedingStart','hardBraking','alarm'].includes(e.type)).length} críticos`}
                icon={AlertTriangle} color="warning"
                href="/apps/fleet/incidents" loading={loading} isDark={isDark}
              />
            </Col>
            <Col xl={3} md={6} xs={6}>
              <StatCard
                title="Custo do Mês" value={monthCostFmt}
                sub={`${pendingMaint.length > 0 ? `⚠️ ${pendingMaint.length} manutenções pendentes` : 'Notas fiscais lançadas'}`}
                icon={DollarSign} color="info"
                href="/apps/financial/invoices" loading={loading} isDark={isDark}
              />
            </Col>
          </Row>

          {/* ── Barra de disponibilidade (compacta, sem card) ── */}
          {!loading && total > 0 && (
            <div className="d-flex align-items-center gap-3 mb-4 px-1">
              <small className="text-muted fw-semibold text-nowrap flex-shrink-0">Disponibilidade da frota</small>
              <div className="flex-fill">
                <ProgressBar style={{ height: 6, borderRadius: 4 }}>
                  <ProgressBar variant="success"   now={Math.round((online   / total) * 100)} key={1} />
                  <ProgressBar variant="danger"    now={Math.round((offline  / total) * 100)} key={2} />
                  <ProgressBar variant="secondary" now={Math.round((inactive / total) * 100)} key={3} />
                </ProgressBar>
              </div>
              <div className="d-flex gap-3 flex-shrink-0">
                <small className="text-success fw-semibold">● {online}</small>
                <small className="text-danger fw-semibold">● {offline}</small>
                <small className="text-muted fw-semibold">● {inactive}</small>
                <Badge bg={pct >= 70 ? 'success' : pct >= 40 ? 'warning' : 'danger'} className="text-white">{pct}%</Badge>
              </div>
            </div>
          )}

          {/* ── Cards de detalhes ── */}
          <Row className="g-3 mb-3">

            {/* Status por veículo */}
            <Col xl={5}>
              <Card className="card-border h-100">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 d-flex align-items-center gap-2"><Truck size={15} /> Veículos</h6>
                  <Link href="/apps/fleet/vehicles" className={isDark ? "btn btn-xs btn-outline-primary" : "btn btn-xs btn-soft-primary"}>Ver todos</Link>
                </Card.Header>
                <Card.Body className="p-0">
                  {loading
                    ? <div className="text-center py-4"><Spinner size="sm" /></div>
                    : total === 0
                      ? <p className="text-muted text-center small py-4">Nenhum veículo cadastrado.</p>
                      : (
                        <SimpleBar style={{ maxHeight: 340 }}>
                          {vehicles.slice(0, 10).map(v => {
                            const st   = v.telemetry?.status ?? v.status ?? 'unknown';
                            const pos  = positions.find(p => p.deviceId === v.traccarId);
                            const spd  = pos?.speed ?? 0;
                            return (
                              <div key={v._id ?? v.id} className="px-3 py-2 border-bottom d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-2 min-width-0">
                                  <Truck size={13} className="text-muted flex-shrink-0" />
                                  <div className="min-width-0">
                                    <div className="small fw-semibold text-truncate" style={{ maxWidth: 140 }}>{v.name}</div>
                                    <small className="text-muted">{v.plate ?? '–'}{spd > 2 ? ` · ${Math.round(spd)} km/h` : ''}</small>
                                  </div>
                                </div>
                                <div className="d-flex align-items-center gap-1 flex-shrink-0">
                                  {!v.traccarId && <Badge bg="warning" text="dark" className="me-1" title="Sem GPS vinculado"><Cpu size={10} /></Badge>}
                                  <Badge bg={statusLabel[st]?.bg ?? 'secondary'} className="text-white">
                                    {statusLabel[st]?.label ?? 'Inativo'}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                          {total > 10 && (
                            <div className="px-3 py-2 text-center">
                              <Link href="/apps/fleet/vehicles" className={isDark ? "btn btn-xs btn-outline-primary w-100" : "btn btn-xs btn-soft-primary w-100"}>
                                + {total - 10} veículos →
                              </Link>
                            </div>
                          )}
                        </SimpleBar>
                      )}
                </Card.Body>
              </Card>
            </Col>

            {/* Viagens do dia - removido (ver em /apps/fleet/trips) */}
            {false && <Col xl={4}>
              <Card className="card-border h-100">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 d-flex align-items-center gap-2"><Navigation size={15} /> Viagens do Dia</h6>
                  <Link href="/apps/fleet/trips" className="btn btn-xs btn-soft-success">Ver todas</Link>
                </Card.Header>
                <Card.Body className="p-0">
                  {loading
                    ? <div className="text-center py-4"><Spinner size="sm" /></div>
                    : trips.length === 0
                      ? <p className="text-muted text-center small py-4">Nenhuma viagem registrada hoje.</p>
                      : (
                        <SimpleBar style={{ maxHeight: 340 }}>
                          {trips.slice(0, 8).map((t, i) => {
                            const kmFmt  = ((t.distance ?? 0) / 1000).toFixed(1);
                            const active = !t.endTime;
                            const dur    = t.duration ? `${Math.round(t.duration / 60)} min` : null;
                            return (
                              <div key={t.id ?? i} className="px-3 py-2 border-bottom">
                                <div className="d-flex justify-content-between align-items-start mb-1">
                                  <strong className="small text-truncate" style={{ maxWidth: 150 }}>{t.deviceName ?? '–'}</strong>
                                  <Badge bg={active ? 'primary' : 'success'} className="text-white">
                                    {active ? 'Em andamento' : 'Concluída'}
                                  </Badge>
                                </div>
                                {t.driverName && <small className="text-muted d-block">👤 {t.driverName}</small>}
                                <small className="text-muted">
                                  🛣️ {kmFmt} km
                                  {dur ? ` · ⏱ ${dur}` : ''}
                                  {t.averageSpeed ? ` · ${Math.round(t.averageSpeed)} km/h médio` : ''}
                                </small>
                              </div>
                            );
                          })}
                        </SimpleBar>
                      )}
                </Card.Body>
              </Card>
            </Col>}

            {/* Eventos recentes */}
            <Col xl={7}>
              <Card className="card-border h-100">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 d-flex align-items-center gap-2"><AlertTriangle size={15} /> Eventos Recentes</h6>
                  <Link href="/apps/fleet/incidents" className={isDark ? "btn btn-xs btn-outline-warning" : "btn btn-xs btn-soft-warning"}>Ver todos</Link>
                </Card.Header>
                <Card.Body className="p-0">
                  {loading
                    ? <div className="text-center py-4"><Spinner size="sm" /></div>
                    : events.length === 0
                      ? <p className="text-muted text-center small py-4">Nenhum evento hoje. 🎉</p>
                      : (
                        <SimpleBar style={{ maxHeight: 340 }}>
                          {events.slice(0, 10).map((ev, i) => {
                            const isCritical = ['speedingStart', 'hardBraking', 'hardAcceleration', 'alarm'].includes(ev.type);
                            return (
                              <div key={ev.id ?? i} className="px-3 py-2 border-bottom">
                                <div className="d-flex justify-content-between align-items-start">
                                  <div className="d-flex align-items-start gap-2">
                                    <Badge bg={isCritical ? 'danger' : 'warning'} text={isCritical ? 'white' : 'dark'} className="mt-1 flex-shrink-0" style={{ fontSize: '0.65rem' }}>
                                      {isCritical ? '!' : ''}
                                    </Badge>
                                    <div>
                                      <div className="small fw-semibold">{eventTypes[ev.type] ?? ev.type ?? 'Evento'}</div>
                                      {ev.deviceName && <small className="text-muted">🚛 {ev.deviceName}</small>}
                                    </div>
                                  </div>
                                  <small className="text-muted flex-shrink-0 ms-2">
                                    {ev.eventTime ? new Date(ev.eventTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                  </small>
                                </div>
                              </div>
                            );
                          })}
                        </SimpleBar>
                      )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* ── Manutenções preventivas ── */}
          <Row className="g-3">
            <Col xl={12}>
              <Card className="card-border">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 d-flex align-items-center gap-2">
                    <Tool size={15} /> Manutenções Preventivas
                    {pendingMaint.length > 0 && <Badge bg="danger" className="text-white ms-1">{pendingMaint.length}</Badge>}
                  </h6>
                  <Link href="/apps/fleet/maintenance" className={isDark ? "btn btn-xs btn-outline-warning" : "btn btn-xs btn-soft-warning"}>Gerenciar</Link>
                </Card.Header>
                <Card.Body className="p-0">
                  {loading
                    ? <div className="text-center py-3"><Spinner size="sm" /></div>
                    : maintenances.length === 0
                      ? (
                        <div className="text-center py-4 text-muted">
                          <Tool size={28} className="mb-2 opacity-50" />
                          <p className="small mb-0">Nenhuma manutenção preventiva configurada.</p>
                          <Link href="/apps/fleet/maintenance" className={isDark ? "btn btn-xs btn-outline-warning mt-2" : "btn btn-xs btn-soft-warning mt-2"}>Configurar alertas →</Link>
                        </div>
                      )
                      : (
                        <SimpleBar style={{ maxHeight: 220 }}>
                          {maintenances.slice(0, 6).map((m, i) => {
                            const overdue = m.nextDueDate && new Date(m.nextDueDate) < new Date();
                            const soon    = m.nextDueDate && !overdue && new Date(m.nextDueDate) <= new Date(Date.now() + 7 * 24 * 3600_000);
                            return (
                              <div key={m.id ?? i} className="px-3 py-2 border-bottom d-flex align-items-center justify-content-between">
                                <div>
                                  <div className="small fw-semibold">{m.name ?? m.type}</div>
                                  {m.nextDueDate && (
                                    <small className={`${overdue ? 'text-danger' : soon ? 'text-warning' : 'text-muted'}`}>
                                      📅 {new Date(m.nextDueDate).toLocaleDateString('pt-BR')}
                                    </small>
                                  )}
                                </div>
                                <Badge bg={overdue ? 'danger' : soon ? 'warning' : 'success'} text={soon ? 'dark' : 'white'}>
                                  {overdue ? 'Vencida' : soon ? 'Esta semana' : 'OK'}
                                </Badge>
                              </div>
                            );
                          })}
                        </SimpleBar>
                      )
                  }
                </Card.Body>
              </Card>
            </Col>

            {/* GPS: movido para /apps/fleet/devices */}
          </Row>

        </div>
      </SimpleBar>
    </div>
  );
}
