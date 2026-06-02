'use client';
import { useState } from 'react';
import { Modal, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { Truck, Smartphone, MapPin, CheckCircle, ArrowRight, ExternalLink, Copy, X } from 'react-feather';
import Link from 'next/link';
import { getTraccarDevices } from '@/lib/api/services/fleet';

const STEPS = [
  {
    id: 1,
    icon: Truck,
    color: 'primary',
    title: 'Cadastre seu primeiro veículo',
    desc: 'Adicione o veículo que será monitorado — placa, modelo e tipo.',
    action: { label: 'Ir para Veículos', href: '/apps/fleet/vehicles' },
    check: (data) => data.vehicles > 0,
    hint: 'Clique em "+ Adicionar Veículo" na tela de veículos.',
  },
  {
    id: 2,
    icon: Smartphone,
    color: 'warning',
    title: 'Instale o Traccar Client no celular',
    desc: 'Baixe o app Traccar Client (gratuito), configure o servidor e o ID do device.',
    action: null,
    check: (data) => data.devices > 0,
    hint: null,
  },
  {
    id: 3,
    icon: MapPin,
    color: 'success',
    title: 'Veja seu veículo no mapa',
    desc: 'Com o app rodando, o veículo aparecerá em tempo real na Torre de Controle.',
    action: { label: 'Abrir Torre de Controle', href: '/apps/fleet/control-tower' },
    check: (data) => data.positions > 0,
    hint: null,
  },
];

const TRACCAR_SERVER = process.env.NEXT_PUBLIC_TRACCAR_HOST ?? 'traccar.seudominio.com.br';
const TRACCAR_PORT   = process.env.NEXT_PUBLIC_TRACCAR_PORT ?? '5055';

function StepCard({ step, done, active }) {
  const Icon = step.icon;
  return (
    <div className={`d-flex gap-3 p-3 rounded-3 mb-3 border ${done ? 'border-success bg-success bg-opacity-10' : active ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary-subtle bg-light'}`}>
      <div className={`avatar avatar-icon avatar-lg avatar-rounded flex-shrink-0 ${done ? 'avatar-soft-success' : active ? `avatar-soft-${step.color}` : 'avatar-soft-secondary'}`}>
        {done ? <CheckCircle size={22} /> : <Icon size={22} />}
      </div>
      <div className="flex-fill">
        <div className="d-flex align-items-center gap-2 mb-1">
          <strong className="small">{step.title}</strong>
          {done && <Badge bg="success" className="text-white py-1">Concluído ✓</Badge>}
          {active && !done && <Badge bg="primary" className="text-white py-1">Agora</Badge>}
        </div>
        <p className="text-muted small mb-2">{step.desc}</p>
        {active && !done && step.action && (
          <Link href={step.action.href} className={`btn btn-sm btn-${step.color} d-inline-flex align-items-center gap-1`}>
            {step.action.label} <ArrowRight size={13} />
          </Link>
        )}
        {active && !done && step.hint && (
          <small className="text-muted fst-italic">💡 {step.hint}</small>
        )}
      </div>
    </div>
  );
}

function TraccarSetupCard({ copied, onCopy }) {
  return (
    <div className="border rounded-3 p-3 bg-light mb-3">
      <p className="fw-semibold small mb-2">📱 Como configurar o Traccar Client:</p>
      <ol className="small text-muted ps-3 mb-3">
        <li className="mb-1">Baixe <strong>Traccar Client</strong> na <a href="https://play.google.com/store/apps/details?id=org.traccar.client" target="_blank" rel="noreferrer" className="text-primary">Play Store <ExternalLink size={10} /></a> ou <a href="https://apps.apple.com/app/traccar-client/id843151387" target="_blank" rel="noreferrer" className="text-primary">App Store <ExternalLink size={10} /></a></li>
        <li className="mb-1">Abra o app → <strong>Configurações</strong></li>
        <li className="mb-1">
          <strong>URL do servidor:</strong>
          <code className="ms-1 px-1 bg-white border rounded">{`http://${TRACCAR_SERVER}:${TRACCAR_PORT}`}</code>
          <button className="btn btn-xs btn-light ms-1 py-0 px-1" onClick={() => onCopy(`http://${TRACCAR_SERVER}:${TRACCAR_PORT}`)}>
            {copied === 'url' ? <CheckCircle size={11} className="text-success" /> : <Copy size={11} />}
          </button>
        </li>
        <li className="mb-1">
          <strong>Identificador</strong>: qualquer texto único (ex: <code>PLACA-001</code>) — anote para vincular ao veículo depois
        </li>
        <li>Ative o rastreamento e aguarde o primeiro sinal</li>
      </ol>
      <p className="text-muted small mb-0">
        Depois vá em <Link href="/apps/fleet/devices" className="text-primary">Devices</Link> para vincular o identificador ao veículo.
      </p>
    </div>
  );
}

export default function OnboardingWizard({ vehicles = 0, devices = 0, positions = 0, onDismiss }) {
  const [checking,   setChecking]   = useState(false);
  const [checkError, setCheckError] = useState('');
  const [copied,     setCopied]     = useState('');

  const data = { vehicles, devices, positions };
  const completedSteps = STEPS.filter(s => s.check(data)).length;
  const allDone = completedSteps === STEPS.length;
  const activeStep = STEPS.find(s => !s.check(data));

  const handleCheck = async () => {
    setChecking(true);
    setCheckError('');
    try {
      await getTraccarDevices();
      window.location.reload();
    } catch (err) {
      setCheckError('Não foi possível verificar. Tente novamente.');
    } finally {
      setChecking(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied('url');
      setTimeout(() => setCopied(''), 2000);
    });
  };

  return (
    <div className="card card-border mb-4" style={{ borderLeft: '4px solid var(--bs-primary)' }}>
      <div className="card-body p-4">
        {/* Header */}
        <div className="d-flex align-items-start justify-content-between mb-3">
          <div>
            <h5 className="fw-bold mb-1">
              {allDone ? '🎉 Configuração completa!' : '🚀 Configure sua frota em 3 passos'}
            </h5>
            <p className="text-muted small mb-0">
              {allDone
                ? 'Seu TMS está pronto. Acesse a Torre de Controle para ver a frota em tempo real.'
                : `${completedSteps} de ${STEPS.length} passos concluídos`}
            </p>
          </div>
          <button className="btn btn-xs btn-light" onClick={onDismiss} title="Dispensar">
            <X size={14} />
          </button>
        </div>

        {/* Barra de progresso */}
        <div className="progress mb-4" style={{ height: 6 }}>
          <div
            className="progress-bar bg-primary"
            style={{ width: `${Math.round((completedSteps / STEPS.length) * 100)}%`, transition: 'width 0.5s' }}
          />
        </div>

        {allDone ? (
          <div className="text-center py-2">
            <Link href="/apps/fleet/control-tower" className="btn btn-primary d-inline-flex align-items-center gap-2">
              <MapPin size={16} /> Abrir Torre de Controle
            </Link>
          </div>
        ) : (
          <>
            {STEPS.map((step, i) => (
              <div key={step.id}>
                <StepCard
                  step={step}
                  done={step.check(data)}
                  active={activeStep?.id === step.id}
                />
                {/* Instrução de instalação do app — aparece quando step 2 está ativo */}
                {activeStep?.id === 2 && step.id === 2 && (
                  <TraccarSetupCard copied={copied} onCopy={handleCopy} />
                )}
              </div>
            ))}

            {checkError && <Alert variant="danger" className="py-2 small">{checkError}</Alert>}

            <div className="d-flex align-items-center gap-2 mt-1">
              <Button variant="soft-primary" size="sm" onClick={handleCheck} disabled={checking}>
                {checking ? <><Spinner size="sm" className="me-1" />Verificando…</> : '🔄 Verificar progresso'}
              </Button>
              <small className="text-muted">Clique após completar um passo para atualizar</small>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
