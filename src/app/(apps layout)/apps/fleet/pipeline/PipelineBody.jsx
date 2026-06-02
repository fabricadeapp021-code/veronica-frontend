'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, Spinner, Form, Modal } from 'react-bootstrap';
import {
  RefreshCw, Plus, CheckCircle, XCircle, Truck,
  Clock, MapPin, User, AlertTriangle, ExternalLink,
  ChevronRight,
} from 'react-feather';
import {
  listWizards, approveWizard, rejectWizard,
  activateWizard, createWizard,
} from '@/lib/api/services/tripWizard';

// ── Constantes ────────────────────────────────────────────────────────────────

const COLUMNS = [
  {
    key: 'draft',
    label: 'Rascunho',
    color: '#6c757d',
    bg: 'rgba(108,117,125,0.08)',
    icon: Clock,
    desc: 'Wizards em preenchimento',
  },
  {
    key: 'in_review',
    label: 'Aguardando Aprovação',
    color: '#fd7e14',
    bg: 'rgba(253,126,20,0.08)',
    icon: AlertTriangle,
    desc: 'Submetidos, aguardam gestor',
  },
  {
    key: 'approved',
    label: 'Aprovados',
    color: '#198754',
    bg: 'rgba(25,135,84,0.08)',
    icon: CheckCircle,
    desc: 'Aprovados, prontos para ativar',
  },
  {
    key: 'active',
    label: 'Em Andamento',
    color: '#0d6efd',
    bg: 'rgba(13,110,253,0.08)',
    icon: Truck,
    desc: 'Viagens ativas na estrada',
  },
  {
    key: 'completed',
    label: 'Concluídos',
    color: '#198754',
    bg: 'rgba(25,135,84,0.05)',
    icon: CheckCircle,
    desc: 'Finalizados com sucesso',
  },
];

const fmtDt = (iso) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '–';

const fmtKm = (m) => (m ? `${Math.round(m / 1000)} km` : null);

// ── WizardCard ────────────────────────────────────────────────────────────────

function WizardCard({ wizard, onApprove, onReject, onActivate, actionId }) {
  const router = useRouter();
  const busy = actionId === wizard._id;

  const s1 = wizard.steps?.step1;
  const s4 = wizard.steps?.step4;
  const s5 = wizard.steps?.step5;

  const origin = s1?.origin?.city
    ? `${s1.origin.city}, ${s1.origin.state}`
    : '–';
  const destination = s1?.destination?.city
    ? `${s1.destination.city}, ${s1.destination.state}`
    : '–';

  return (
    <Card
      className="border-0 shadow-sm mb-3"
      style={{ borderRadius: 10, cursor: 'default', transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.12)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
    >
      <Card.Body className="p-3">
        {/* Header */}
        <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
          <div>
            <div className="fw-semibold" style={{ fontSize: '0.82rem', color: 'var(--bs-body-color)' }}>
              {wizard.wizardNumber || wizard._id?.slice(-6)}
            </div>
            {s1?.clientName && (
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>{s1.clientName}</div>
            )}
          </div>
          <button
            className="btn btn-link btn-sm p-0 text-muted"
            onClick={() => router.push(`/apps/fleet/trip-wizard/${wizard._id}`)}
            title="Abrir wizard"
          >
            <ExternalLink size={13} />
          </button>
        </div>

        {/* Rota */}
        {s1 && (
          <div className="d-flex align-items-center gap-1 mb-2" style={{ fontSize: '0.75rem', color: '#6c757d' }}>
            <MapPin size={11} style={{ flexShrink: 0 }} />
            <span className="text-truncate" style={{ maxWidth: 80 }}>{origin}</span>
            <ChevronRight size={11} style={{ flexShrink: 0 }} />
            <span className="text-truncate" style={{ maxWidth: 80 }}>{destination}</span>
          </div>
        )}

        {/* Motorista / distância */}
        <div className="d-flex flex-wrap gap-2 mb-3" style={{ fontSize: '0.72rem' }}>
          {s4?.driverName && (
            <span className="d-flex align-items-center gap-1 text-muted">
              <User size={10} /> {s4.driverName.split(' ')[0]}
            </span>
          )}
          {s4?.vehiclePlate && (
            <span className="d-flex align-items-center gap-1 text-muted">
              <Truck size={10} /> {s4.vehiclePlate}
            </span>
          )}
          {s5?.distanceMeters && (
            <span className="text-muted">{fmtKm(s5.distanceMeters)}</span>
          )}
          <span className="ms-auto text-muted">{fmtDt(wizard.createdAt)}</span>
        </div>

        {/* Ações */}
        <div className="d-flex gap-1 flex-wrap">
          {wizard.status === 'in_review' && (
            <>
              <button
                className="btn btn-success btn-sm d-flex align-items-center gap-1 flex-fill"
                style={{ fontSize: '0.73rem', padding: '3px 8px', borderRadius: 6 }}
                disabled={busy}
                onClick={() => onApprove(wizard._id)}
              >
                {busy ? <Spinner size="sm" animation="border" style={{ width: 10, height: 10 }} /> : <CheckCircle size={11} />}
                Aprovar
              </button>
              <button
                className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                style={{ fontSize: '0.73rem', padding: '3px 8px', borderRadius: 6 }}
                disabled={busy}
                onClick={() => onReject(wizard._id)}
              >
                <XCircle size={11} /> Rejeitar
              </button>
            </>
          )}
          {wizard.status === 'approved' && (
            <button
              className="btn btn-primary btn-sm d-flex align-items-center gap-1 flex-fill"
              style={{ fontSize: '0.73rem', padding: '3px 8px', borderRadius: 6 }}
              disabled={busy}
              onClick={() => onActivate(wizard._id)}
            >
              {busy ? <Spinner size="sm" animation="border" style={{ width: 10, height: 10 }} /> : <Truck size={11} />}
              Ativar Viagem
            </button>
          )}
          {wizard.status === 'draft' && (
            <button
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 flex-fill"
              style={{ fontSize: '0.73rem', padding: '3px 8px', borderRadius: 6 }}
              onClick={() => router.push(`/apps/fleet/trip-wizard/${wizard._id}`)}
            >
              Continuar Preenchendo <ExternalLink size={11} />
            </button>
          )}
          {wizard.status === 'active' && (
            <button
              className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 flex-fill"
              style={{ fontSize: '0.73rem', padding: '3px 8px', borderRadius: 6 }}
              onClick={() => router.push('/apps/fleet/control-tower')}
            >
              <Truck size={11} /> Ver na Torre
            </button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}

// ── KanbanColumn ──────────────────────────────────────────────────────────────

function KanbanColumn({ col, wizards, onApprove, onReject, onActivate, actionId }) {
  const Icon = col.icon;
  return (
    <div
      style={{
        minWidth: 240,
        maxWidth: 280,
        flex: '1 0 240px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header da coluna */}
      <div
        className="d-flex align-items-center gap-2 px-3 py-2 mb-3"
        style={{
          borderRadius: 10,
          background: col.bg,
          border: `1px solid ${col.color}22`,
        }}
      >
        <Icon size={14} color={col.color} />
        <div style={{ flex: 1 }}>
          <div className="fw-semibold" style={{ fontSize: '0.8rem', color: col.color }}>
            {col.label}
          </div>
          <div className="text-muted" style={{ fontSize: '0.68rem' }}>{col.desc}</div>
        </div>
        <Badge
          style={{
            background: col.color,
            fontSize: '0.72rem',
            borderRadius: 20,
            minWidth: 22,
            textAlign: 'center',
          }}
        >
          {wizards.length}
        </Badge>
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
        {wizards.length === 0 ? (
          <div
            className="text-center text-muted py-4"
            style={{ fontSize: '0.78rem', border: '2px dashed var(--bs-border-color)', borderRadius: 8 }}
          >
            Nenhum wizard
          </div>
        ) : (
          wizards.map(w => (
            <WizardCard
              key={w._id}
              wizard={w}
              onApprove={onApprove}
              onReject={onReject}
              onActivate={onActivate}
              actionId={actionId}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── RejectModal ───────────────────────────────────────────────────────────────

function RejectModal({ show, onConfirm, onClose }) {
  const [reason, setReason] = useState('');
  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason);
    setReason('');
  };
  return (
    <Modal show={show} onHide={onClose} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: '0.95rem' }}>Motivo da Rejeição</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Control
          as="textarea"
          rows={3}
          size="sm"
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Descreva o motivo..."
          autoFocus
        />
      </Modal.Body>
      <Modal.Footer className="py-2">
        <Button variant="outline-secondary" size="sm" onClick={onClose}>Cancelar</Button>
        <Button variant="danger" size="sm" onClick={handleConfirm} disabled={!reason.trim()}>
          Confirmar Rejeição
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// ── PipelineBody — componente principal ───────────────────────────────────────

export default function PipelineBody() {
  const router = useRouter();
  const [wizards, setWizards]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [creating, setCreating]       = useState(false);
  const [actionId, setActionId]       = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const timerRef = useRef(null);

  const fetchAll = useCallback(async () => {
    try {
      const r = await listWizards({ limit: 100 });
      setWizards(Array.isArray(r) ? r : r?.items ?? r?.data ?? []);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    timerRef.current = setInterval(fetchAll, 30_000);
    return () => clearInterval(timerRef.current);
  }, [fetchAll]);

  const grouped = useCallback(() => {
    const map = {};
    COLUMNS.forEach(c => { map[c.key] = []; });
    wizards.forEach(w => {
      const col = w.status in map ? w.status : null;
      if (col) map[col].push(w);
    });
    return map;
  }, [wizards])();

  const handleNewWizard = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const res = await createWizard();
      const id = res?.data?._id ?? res?._id;
      if (id) router.push(`/apps/fleet/trip-wizard/${id}`);
    } finally {
      setCreating(false);
    }
  };

  const handleApprove = async (id) => {
    setActionId(id);
    try {
      await approveWizard(id, 'Aprovado pelo gestor');
      await fetchAll();
    } finally {
      setActionId(null);
    }
  };

  const handleReject = (id) => setRejectTarget(id);

  const handleRejectConfirm = async (reason) => {
    const id = rejectTarget;
    setRejectTarget(null);
    setActionId(id);
    try {
      await rejectWizard(id, reason);
      await fetchAll();
    } finally {
      setActionId(null);
    }
  };

  const handleActivate = async (id) => {
    setActionId(id);
    try {
      await activateWizard(id);
      await fetchAll();
    } finally {
      setActionId(null);
    }
  };

  const inReviewCount = grouped['in_review']?.length ?? 0;

  return (
    <div className="container-fluid py-4 px-3 px-md-4" style={{ paddingBottom: 90 }}>

      {/* Cabeçalho */}
      <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
        <div>
          <h4 className="mb-0 fw-bold d-flex align-items-center gap-2">
            Pipeline de Viagens
            {inReviewCount > 0 && (
              <Badge bg="warning" text="dark" style={{ fontSize: '0.7rem', borderRadius: 20 }}>
                {inReviewCount} pendente{inReviewCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </h4>
          <p className="text-muted mb-0" style={{ fontSize: '0.82rem' }}>
            Aprovação e acompanhamento de wizards de viagem
            {lastRefresh && (
              <span className="ms-2" style={{ fontSize: '0.73rem' }}>
                · atualizado às {lastRefresh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </p>
        </div>

        <div className="ms-auto d-flex gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={fetchAll}
            disabled={loading}
            className="d-flex align-items-center gap-1"
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            Atualizar
          </Button>
          <Button
            size="sm"
            onClick={handleNewWizard}
            disabled={creating}
            className="d-flex align-items-center gap-1 fw-semibold"
            style={{
              background: 'linear-gradient(135deg,#0d6efd,#6610f2)',
              border: 'none',
              borderRadius: 8,
            }}
          >
            {creating
              ? <Spinner animation="border" size="sm" style={{ width: 13, height: 13 }} />
              : <Plus size={13} />}
            Nova Viagem
          </Button>
        </div>
      </div>

      {/* Board */}
      {loading ? (
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 300 }}>
          <Spinner animation="border" className="me-2" />
          <span className="text-muted">Carregando pipeline...</span>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            gap: 16,
            overflowX: 'auto',
            paddingBottom: 16,
            alignItems: 'flex-start',
            minHeight: 'calc(100vh - 220px)',
          }}
        >
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.key}
              col={col}
              wizards={grouped[col.key] || []}
              onApprove={handleApprove}
              onReject={handleReject}
              onActivate={handleActivate}
              actionId={actionId}
            />
          ))}
        </div>
      )}

      {/* Modal de rejeição */}
      <RejectModal
        show={!!rejectTarget}
        onConfirm={handleRejectConfirm}
        onClose={() => setRejectTarget(null)}
      />

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
