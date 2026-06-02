'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { resolveApiBaseUrl } from '@/lib/api/config';
import styles from './styles.module.css';

const STAGE_LABELS = {
  planned: 'Planejada',
  checked_in: 'Check-in feito',
  loading: 'Carregando',
  loaded: 'Carregada',
  in_transit: 'Em viagem',
  arrived: 'No destino',
  delivered: 'Entregue',
  completed: 'Concluida',
  cancelled: 'Cancelada',
};

const ACTION_MESSAGES = {
  checkin: 'Check-in registrado.',
  collection_start: 'Carregamento iniciado.',
  collection_complete: 'Carregamento concluido.',
  start_trip: 'Viagem iniciada.',
  arrived: 'Chegada registrada.',
  delivery_attempted: 'Tentativa de entrega registrada.',
  refueling: 'Abastecimento registrado.',
  panic_button: 'Alerta de emergencia enviado.',
  close_trip: 'Viagem finalizada.',
};

const OCCURRENCES = [
  ['flat_tire', 'Pneu furado'],
  ['breakdown', 'Quebra do veiculo'],
  ['accident', 'Acidente'],
  ['absent_customer', 'Cliente ausente'],
  ['address_mismatch', 'Endereco divergente'],
  ['refused_delivery', 'Recusa de entrega'],
  ['road_block', 'Bloqueio ou transito'],
  ['theft', 'Roubo ou tentativa'],
  ['weather', 'Condicao climatica'],
  ['other', 'Outro'],
];

const COMMAND_LABELS = {
  message: 'Mensagem do operador',
  request_location: 'Solicitação de localização',
  reroute: 'Nova instrução de rota',
  call_operator: 'Ligar para o operador',
  cancel_instruction: 'Instrução cancelada',
};

function loadSocketIoScript(baseUrl) {
  return new Promise((resolve, reject) => {
    if (window.io) { resolve(window.io); return; }
    const scriptId = 'socket-io-client-script';
    const existing = document.getElementById(scriptId);
    if (existing) {
      const wait = () => window.io ? resolve(window.io) : setTimeout(wait, 50);
      wait();
      return;
    }
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `${baseUrl.replace(/\/+$/, '')}/socket.io/socket.io.js`;
    script.async = true;
    script.onload = () => window.io ? resolve(window.io) : reject(new Error('Socket.IO indisponível'));
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function apiFetch(path, options = {}) {
  const base = await resolveApiBaseUrl();
  const res = await fetch(`${base}${path}`, {
    cache: 'no-store',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(data?.message || data?.error || `Erro HTTP ${res.status}`);
  }

  return data;
}

function getCurrentPosition() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({});
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => resolve({}),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  });
}

function formatDate(value) {
  if (!value) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatDistance(planned) {
  const meters = planned?.distanceMeters;
  if (!meters) return null;
  return `${Math.round(meters / 1000)} km`;
}

export default function DriverPortalPage() {
  const params = useParams();
  const token = params?.token;
  const [portal, setPortal] = useState(null);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [occurrenceOpen, setOccurrenceOpen] = useState(false);
  const [occurrenceType, setOccurrenceType] = useState('other');
  const [occurrenceDescription, setOccurrenceDescription] = useState('');
  const [refuelOpen, setRefuelOpen] = useState(false);
  const [liters, setLiters] = useState('');
  const [commands, setCommands] = useState([]);
  const [commandBusy, setCommandBusy] = useState('');

  const trips = portal?.trips || [];
  const selectedTrip = useMemo(
    () => trips.find((trip) => trip.id === selectedTripId) || trips[0] || null,
    [selectedTripId, trips],
  );

  async function loadPortal() {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/driver/portal/${token}`);
      setPortal(data);
      setSelectedTripId((current) => current || data.trips?.[0]?.id || null);
    } catch (err) {
      setError(err.message || 'Nao foi possivel abrir o link.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPortal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadCommands(currentTripId = selectedTrip?.id) {
    if (!token) return;
    try {
      const query = currentTripId ? `?tripId=${encodeURIComponent(currentTripId)}` : '';
      const data = await apiFetch(`/driver/portal/${token}/commands${query}`);
      const list = Array.isArray(data) ? data : [];
      setCommands(list);
      await Promise.all(
        list
          .filter((command) => command.status === 'pending')
          .map((command) =>
            apiFetch(`/driver/portal/${token}/commands/${command._id || command.id}/delivered`, {
              method: 'POST',
            }).catch(() => null),
          ),
      );
    } catch {
      setCommands([]);
    }
  }

  useEffect(() => {
    if (!token || !selectedTrip?.id) return undefined;
    loadCommands(selectedTrip.id);
    const timer = setInterval(() => loadCommands(selectedTrip.id), 10000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedTrip?.id]);

  useEffect(() => {
    if (!token || !selectedTrip?.id) return undefined;
    let socket;
    let cancelled = false;

    async function connectRealtime() {
      try {
        const baseUrl = await resolveApiBaseUrl();
        const io = await loadSocketIoScript(baseUrl);
        if (cancelled) return;

        socket = io(`${baseUrl.replace(/\/+$/, '')}/fleet-realtime`, {
          transports: ['websocket', 'polling'],
          auth: { type: 'driver_link', token },
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 10000,
        });

        socket.on('realtime.ready', () => {
          socket.emit('trip.join', { tripId: selectedTrip.id });
        });

        socket.on('driver.command.created', (payload) => {
          const command = payload?.command;
          if (!command || String(command.tripId) !== String(selectedTrip.id)) return;
          setCommands((current) => [
            command,
            ...current.filter((item) => String(item._id || item.id) !== String(command._id || command.id)),
          ]);
          apiFetch(`/driver/portal/${token}/commands/${command._id || command.id}/delivered`, {
            method: 'POST',
          }).catch(() => null);
        });
      } catch {
        socket?.disconnect();
      }
    }

    connectRealtime();

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, [token, selectedTrip?.id]);

  async function markCommand(command, status) {
    const commandId = command?._id || command?.id;
    if (!commandId) return;
    setCommandBusy(commandId);
    setError('');
    try {
      await apiFetch(`/driver/portal/${token}/commands/${commandId}/${status}`, {
        method: 'POST',
      });
      setCommands((current) => current.filter((item) => String(item._id || item.id) !== String(commandId)));
      setMessage(status === 'acknowledged' ? 'Comando confirmado.' : 'Comando recusado.');
    } catch (err) {
      setError(err.message || 'Nao foi possivel atualizar o comando.');
    } finally {
      setCommandBusy('');
    }
  }

  async function runAction(action) {
    if (!selectedTrip) return;
    if (action === 'occurrence') {
      setOccurrenceOpen(true);
      return;
    }
    if (action === 'refueling') {
      setRefuelOpen(true);
      return;
    }
    if (action === 'panic_button') {
      const confirmed = window.confirm(
        'Confirmar situacao de emergencia? O operador sera alertado.',
      );
      if (!confirmed) return;
    }

    await submitAction(action);
  }

  async function submitAction(action, extra = {}) {
    setBusyAction(action);
    setError('');
    setMessage('');
    try {
      const coords = await getCurrentPosition();
      await apiFetch(`/driver/portal/${token}/trips/${selectedTrip.id}/action`, {
        method: 'POST',
        body: { action, ...coords, ...extra },
      });
      setMessage(ACTION_MESSAGES[action] || 'Acao registrada.');
      await loadPortal();
    } catch (err) {
      setError(err.message || 'Nao foi possivel registrar a acao.');
    } finally {
      setBusyAction('');
    }
  }

  async function submitOccurrence() {
    if (!selectedTrip) return;
    setBusyAction('occurrence');
    setError('');
    setMessage('');
    try {
      const coords = await getCurrentPosition();
      const label = OCCURRENCES.find(([value]) => value === occurrenceType)?.[1];
      await apiFetch(`/driver/portal/${token}/trips/${selectedTrip.id}/occurrence`, {
        method: 'POST',
        body: {
          type: occurrenceType,
          description: occurrenceDescription || label || occurrenceType,
          severity: 'medium',
          ...coords,
        },
      });
      setOccurrenceOpen(false);
      setOccurrenceDescription('');
      setMessage('Ocorrencia registrada.');
      await loadPortal();
    } catch (err) {
      setError(err.message || 'Nao foi possivel registrar a ocorrencia.');
    } finally {
      setBusyAction('');
    }
  }

  async function submitRefuel() {
    const parsed = Number(String(liters).replace(',', '.'));
    setRefuelOpen(false);
    setLiters('');
    await submitAction('refueling', {
      liters: Number.isFinite(parsed) && parsed > 0 ? parsed : undefined,
    });
  }

  if (loading) {
    return (
      <main className={styles.shell}>
        <section className={styles.stateCard}>
          <div className={styles.spinner} />
          <p>Carregando suas viagens...</p>
        </section>
      </main>
    );
  }

  if (error && !portal) {
    return (
      <main className={styles.shell}>
        <section className={styles.stateCard}>
          <span className={styles.bigIcon}>!</span>
          <h1>Link indisponivel</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Portal do motorista</p>
          <h1>Ola, {portal?.driver?.name?.split(' ')[0] || 'motorista'}</h1>
          <p>
            Suas viagens aparecem aqui enquanto o link estiver valido. A
            localizacao so e solicitada ao registrar uma acao.
          </p>
        </div>
        <div className={styles.badge}>{trips.length} viagem(ns)</div>
      </section>

      {message && <div className={styles.success}>{message}</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!trips.length ? (
        <section className={styles.stateCard}>
          <span className={styles.bigIcon}>OK</span>
          <h2>Nenhuma viagem disponivel</h2>
          <p>Quando houver uma viagem atribuida, ela aparecera neste link.</p>
        </section>
      ) : (
        <>
          <section className={styles.tripList}>
            {trips.map((trip) => (
              <button
                key={trip.id}
                className={`${styles.tripCard} ${
                  selectedTrip?.id === trip.id ? styles.tripCardActive : ''
                }`}
                onClick={() => setSelectedTripId(trip.id)}
                type="button"
              >
                <span>{STAGE_LABELS[trip.executionStage] || trip.executionStage}</span>
                <strong>{formatDate(trip.scheduledAt)}</strong>
                <small>{trip.origin?.address || 'Origem nao informada'}</small>
                <small>{trip.destination?.address || 'Destino nao informado'}</small>
              </button>
            ))}
          </section>

          {selectedTrip && (
            <section className={styles.detail}>
              <div className={styles.detailHeader}>
                <div>
                  <p className={styles.eyebrow}>Viagem selecionada</p>
                  <h2>{STAGE_LABELS[selectedTrip.executionStage] || selectedTrip.executionStage}</h2>
                </div>
                <span>{formatDistance(selectedTrip.planned) || 'Rota'}</span>
              </div>

              <div className={styles.routeBox}>
                <div>
                  <b>Origem</b>
                  <p>{selectedTrip.origin?.address || 'Nao informado'}</p>
                </div>
                <div>
                  <b>Destino</b>
                  <p>{selectedTrip.destination?.address || 'Nao informado'}</p>
                </div>
              </div>

              {selectedTrip.cargo?.description && (
                <p className={styles.cargo}>{selectedTrip.cargo.description}</p>
              )}

              {commands.length > 0 && (
                <div className={styles.commandBox}>
                  <p className={styles.eyebrow}>Comandos da operação</p>
                  {commands.map((command) => {
                    const commandId = command._id || command.id;
                    return (
                      <div key={commandId} className={styles.commandCard}>
                        <strong>{COMMAND_LABELS[command.type] || command.type}</strong>
                        {command.message && <p>{command.message}</p>}
                        <div className={styles.commandActions}>
                          <button
                            type="button"
                            onClick={() => markCommand(command, 'acknowledged')}
                            disabled={commandBusy === commandId}
                          >
                            Entendi
                          </button>
                          <button
                            type="button"
                            onClick={() => markCommand(command, 'rejected')}
                            disabled={commandBusy === commandId}
                          >
                            Recusar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className={styles.actions}>
                {(selectedTrip.nextActions || []).map((item) => (
                  <button
                    key={item.action}
                    type="button"
                    className={`${styles.actionBtn} ${styles[item.tone] || ''}`}
                    onClick={() => runAction(item.action)}
                    disabled={Boolean(busyAction)}
                  >
                    {busyAction === item.action ? 'Registrando...' : item.label}
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {occurrenceOpen && (
        <div className={styles.modalBackdrop}>
          <section className={styles.modal}>
            <h2>Reportar problema</h2>
            <label>
              Tipo
              <select
                value={occurrenceType}
                onChange={(event) => setOccurrenceType(event.target.value)}
              >
                {OCCURRENCES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Descricao
              <textarea
                value={occurrenceDescription}
                onChange={(event) => setOccurrenceDescription(event.target.value)}
                placeholder="Conte rapidamente o que aconteceu"
              />
            </label>
            <div className={styles.modalActions}>
              <button type="button" onClick={() => setOccurrenceOpen(false)}>
                Cancelar
              </button>
              <button type="button" onClick={submitOccurrence} disabled={Boolean(busyAction)}>
                Enviar
              </button>
            </div>
          </section>
        </div>
      )}

      {refuelOpen && (
        <div className={styles.modalBackdrop}>
          <section className={styles.modal}>
            <h2>Registrar abastecimento</h2>
            <label>
              Litros opcional
              <input
                value={liters}
                onChange={(event) => setLiters(event.target.value)}
                inputMode="decimal"
                placeholder="Ex: 120"
              />
            </label>
            <div className={styles.modalActions}>
              <button type="button" onClick={() => setRefuelOpen(false)}>
                Cancelar
              </button>
              <button type="button" onClick={submitRefuel} disabled={Boolean(busyAction)}>
                Registrar
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
