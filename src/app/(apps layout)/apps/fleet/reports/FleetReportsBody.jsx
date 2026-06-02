'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Table, Badge, Form, Button, Spinner, Alert, Dropdown } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import { getTrips, getSummary, getDrivers, getDevices, todayRange } from '@/lib/api/services/fleet';
import { Download } from 'react-feather';

// ── export helpers ────────────────────────────────────────────────────────────

function downloadCSV(rows, filename) {
  if (!rows.length) { alert('Nenhum dado para exportar.'); return; }
  const header = Object.keys(rows[0]);
  const escape = (v) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const csv = [header.join(','), ...rows.map(r => header.map(h => escape(r[h])).join(','))].join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const scoreColor = (s) => s >= 90 ? 'success' : s >= 75 ? 'warning' : 'danger';

export default function FleetReportsBody() {
  const [trips,    setTrips]    = useState([]);
  const [summary,  setSummary]  = useState([]);
  const [drivers,  setDrivers]  = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  const [range, setRange] = useState(() => {
    const { from, to } = todayRange();
    return { from: from.slice(0, 16), to: to.slice(0, 16) };
  });

  const fetchAll = useCallback(async (from, to) => {
    setLoading(true);
    setError('');
    try {
      const [t, s, d, v] = await Promise.allSettled([
        getTrips({ from, to }),
        getSummary({ from, to }),
        getDrivers(),
        getDevices({ all: true }),
      ]);
      setTrips(   t.status === 'fulfilled' && Array.isArray(t.value) ? t.value : []);
      setSummary( s.status === 'fulfilled' && Array.isArray(s.value) ? s.value : []);
      setDrivers( d.status === 'fulfilled' && Array.isArray(d.value) ? d.value : []);
      setVehicles(v.status === 'fulfilled' && Array.isArray(v.value) ? v.value : []);
    } catch (err) {
      setError(err?.message ?? 'Erro ao carregar relatório.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const { from, to } = todayRange();
    fetchAll(from, to);
  }, [fetchAll]);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchAll(new Date(range.from).toISOString(), new Date(range.to).toISOString());
  };

  const totalKm = summary.length
    ? summary.reduce((a, s) => a + (s.distance ?? 0), 0) / 1000
    : trips.reduce((a, t) => a + (t.distance ?? 0), 0) / 1000;

  const avgSpeed = trips.length
    ? Math.round(trips.reduce((a, t) => a + (t.averageSpeed ?? 0), 0) / trips.length)
    : 0;

  const activeVehicles = vehicles.filter(v => (v.telemetry?.status ?? v.status) === 'online').length;

  const topDrivers = [...drivers]
    .sort((a, b) => (b.drivingScore ?? b.attributes?.score ?? 0) - (a.drivingScore ?? a.attributes?.score ?? 0))
    .slice(0, 10);

  const exportVehicles = () => {
    const rows = vehicles.map(v => {
      const vid    = v.traccarId ?? v._id ?? v.id;
      const vTrips = trips.filter(t => String(t.deviceId) === String(vid));
      const km     = (vTrips.reduce((a, t) => a + (t.distance ?? 0), 0) / 1000).toFixed(1);
      const maxSpd = vTrips.length ? Math.round(Math.max(...vTrips.map(t => t.maxSpeed ?? 0))) : 0;
      const st     = v.telemetry?.status ?? v.status ?? 'unknown';
      return { Veículo: v.name, Placa: v.contact ?? v.plate ?? '–', Viagens: vTrips.length, 'KM Total': km, 'Vel Máx (km/h)': maxSpd, Status: st };
    });
    downloadCSV(rows, `frota_veiculos_${new Date().toISOString().slice(0,10)}.csv`);
  };

  const exportDrivers = () => {
    const rows = topDrivers.map((d, idx) => ({
      '#': idx + 1,
      Motorista: d.name,
      'Score': d.drivingScore ?? d.attributes?.score ?? 0,
      Viagens: d.totalTrips ?? d.attributes?.trips ?? 0,
      'KM Total': d.totalKm ?? d.attributes?.km ?? 0,
      Status: d.status ?? d.attributes?.status ?? 'active',
    }));
    downloadCSV(rows, `frota_motoristas_${new Date().toISOString().slice(0,10)}.csv`);
  };

  return (
    <div className="fm-body">
      <SimpleBar className="nicescroll-bar">
        <div className="container-fluid px-4 py-4">

          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h4 className="fw-bold mb-0">Relatórios de Frota</h4>
              <small className="text-muted">Resumo de desempenho e operações</small>
            </div>
            <div className="d-flex align-items-center gap-2">
              {loading && <Spinner size="sm" />}
              <Dropdown align="end">
                <Dropdown.Toggle variant="soft-secondary" size="sm" className="d-flex align-items-center gap-1" disabled={loading}>
                  <Download size={14} /> Exportar CSV
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={exportVehicles}>Viagens por Veículo</Dropdown.Item>
                  <Dropdown.Item onClick={exportDrivers}>Ranking Motoristas</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>

          {error && <Alert variant="danger" className="py-2 small mb-3">{error}</Alert>}

          {/* Filtro de período */}
          <Card className="card-border mb-4">
            <Card.Body>
              <Form onSubmit={handleFilter}>
                <Row className="g-2 align-items-end">
                  <Col md={4}>
                    <Form.Label className="small fw-semibold mb-1">Data inicial</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={range.from}
                      onChange={e => setRange(r => ({ ...r, from: e.target.value }))}
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Label className="small fw-semibold mb-1">Data final</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={range.to}
                      onChange={e => setRange(r => ({ ...r, to: e.target.value }))}
                    />
                  </Col>
                  <Col md={2}>
                    <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                      {loading ? <Spinner size="sm" /> : 'Filtrar'}
                    </Button>
                  </Col>
                  <Col md={2}>
                    <Button
                      type="button" variant="soft-secondary" className="w-100"
                      disabled={loading}
                      onClick={() => {
                        const now   = new Date();
                        const start = new Date(now);
                        start.setDate(start.getDate() - 7);
                        const fmt = (d) => d.toISOString().slice(0, 16);
                        setRange({ from: fmt(start), to: fmt(now) });
                        fetchAll(start.toISOString(), now.toISOString());
                      }}
                    >
                      Últimos 7d
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>

          <Row className="g-4">
            {/* Resumo geral */}
            <Col xl={4}>
              <Card className="card-border h-100">
                <Card.Header><h6 className="mb-0">Resumo Operacional</h6></Card.Header>
                <Card.Body>
                  {loading
                    ? <div className="text-center py-4"><Spinner size="sm" /></div>
                    : [
                      { label: 'Total de Viagens',   value: trips.length },
                      { label: 'KM Percorridos',     value: `${totalKm.toFixed(0)} km` },
                      { label: 'Vel. Média Geral',   value: `${avgSpeed} km/h` },
                      { label: 'Veículos Ativos',    value: activeVehicles },
                      { label: 'Viagens Concluídas', value: trips.filter(t => t.status === 'completed' || t.endTime).length },
                      { label: 'Viagens em Rota',    value: trips.filter(t => t.status === 'running' || !t.endTime).length },
                    ].map(item => (
                      <div key={item.label} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <small className="text-muted">{item.label}</small>
                        <strong className="small">{item.value}</strong>
                      </div>
                    ))}
                </Card.Body>
              </Card>
            </Col>

            {/* Ranking motoristas */}
            <Col xl={8}>
              <Card className="card-border h-100">
                <Card.Header><h6 className="mb-0">Ranking de Motoristas — Score de Condução</h6></Card.Header>
                <Card.Body className="p-0">
                  {loading
                    ? <div className="text-center py-4"><Spinner size="sm" /></div>
                    : topDrivers.length === 0
                      ? <p className="text-muted text-center small py-4">Nenhum motorista cadastrado.</p>
                      : (
                      <Table hover className="mb-0">
                        <thead className="bg-light">
                          <tr><th>#</th><th>Motorista</th><th>Score</th><th>Viagens</th><th>KM Total</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                          {topDrivers.map((d, idx) => {
                            const score  = d.drivingScore ?? d.attributes?.score ?? 0;
                            const status = d.status ?? d.attributes?.status ?? 'active';
                            const tripsN = d.totalTrips ?? d.attributes?.trips ?? '–';
                            const km     = d.totalKm ?? d.attributes?.km ?? 0;
                            return (
                              <tr key={d._id ?? d.id}>
                                <td>
                                  <strong className={`text-${idx === 0 ? 'warning' : idx === 1 ? 'secondary' : 'muted'}`}>
                                    {idx + 1}º
                                  </strong>
                                </td>
                                <td><strong className="small">{d.name}</strong></td>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    <div className="progress flex-fill" style={{ height: 6, width: 80 }}>
                                      <div className={`progress-bar bg-${scoreColor(score)}`} style={{ width: `${score}%` }} />
                                    </div>
                                    <small className={`fw-bold text-${scoreColor(score)}`}>{score}</small>
                                  </div>
                                </td>
                                <td><small>{tripsN}</small></td>
                                <td><small>{km >= 1000 ? `${(km / 1000).toFixed(1)}k` : km} km</small></td>
                                <td>
                                  <Badge bg={status === 'active' ? 'success' : 'secondary'} className="text-white">
                                    {status === 'active' ? 'Ativo' : 'Inativo'}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    )}
                </Card.Body>
              </Card>
            </Col>

            {/* Viagens por veículo */}
            <Col xl={12}>
              <Card className="card-border">
                <Card.Header><h6 className="mb-0">Viagens por Veículo</h6></Card.Header>
                <Card.Body className="p-0">
                  {loading
                    ? <div className="text-center py-4"><Spinner size="sm" /></div>
                    : vehicles.length === 0
                      ? <p className="text-muted text-center small py-4">Nenhum veículo cadastrado.</p>
                      : (
                      <Table hover className="mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th>Veículo</th>
                            <th>Contato / Placa</th>
                            <th>Nº de Viagens</th>
                            <th>KM Total</th>
                            <th>Vel. Máxima</th>
                            <th>Status Atual</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vehicles.map(v => {
                            const vid      = v.traccarId ?? v._id ?? v.id;
                            const vTrips   = trips.filter(t => String(t.deviceId) === String(vid));
                            const kmV      = vTrips.reduce((a, t) => a + (t.distance ?? 0), 0) / 1000;
                            const maxSpeed = vTrips.length ? Math.max(...vTrips.map(t => t.maxSpeed ?? 0)) : 0;
                            const st       = v.telemetry?.status ?? v.status ?? 'unknown';
                            return (
                              <tr key={v._id ?? v.id}>
                                <td><strong className="small">{v.name}</strong></td>
                                <td><small className="text-muted">{v.contact ?? v.plate ?? '–'}</small></td>
                                <td><Badge bg="light" text="dark">{vTrips.length}</Badge></td>
                                <td><small>{kmV.toFixed(1)} km</small></td>
                                <td><small>{maxSpeed > 0 ? `${Math.round(maxSpeed)} km/h` : '–'}</small></td>
                                <td>
                                  <Badge bg={st === 'online' ? 'success' : st === 'offline' ? 'danger' : 'secondary'} className="text-white">
                                    {st === 'online' ? 'Online' : st === 'offline' ? 'Offline' : 'Inativo'}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      </SimpleBar>
    </div>
  );
}
