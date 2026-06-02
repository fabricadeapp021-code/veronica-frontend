'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Zap, Search, BarChart2, AlertTriangle, Users, DollarSign, Link2, Clock } from 'react-feather';
import classNames from 'classnames';
import FleetAiPanel from './_components/FleetAiPanel';
import { fleetAiGetPendingActions } from '@/lib/api/services/fleet-ai';

const AI_ACTIONS = [
  { icon: Search,        label: 'Detectar Anomalias',  color: 'danger',    message: 'Detecte anomalias na frota dos últimos 7 dias e classifique por severidade' },
  { icon: BarChart2,     label: 'Relatório Executivo', color: 'primary',   message: 'Gere um relatório completo da frota dos últimos 7 dias' },
  { icon: AlertTriangle, label: 'Analisar Alertas',    color: 'warning',   message: 'Quais foram os alertas mais críticos nas últimas 24 horas?' },
  { icon: Users,         label: 'Ranking Motoristas',  color: 'success',   message: 'Mostre o ranking dos motoristas por score de direção com recomendações' },
  { icon: DollarSign,    label: 'Análise Financeira',  color: 'info',      message: 'Me dê um resumo financeiro da frota do último mês com custo por km' },
  { icon: Link2,         label: 'Integrações',         color: 'secondary', message: 'Quais integrações externas estão configuradas? Lista os destinos disponíveis' },
];

// Páginas que já têm o painel embutido no body (não mostrar botão flutuante duplicado)
const PAGES_WITH_EMBEDDED_AI = ['/apps/fleet/dashboard'];

export default function FleetLayout({ children }) {
  const pathname = usePathname();
  const [showPanel, setShowPanel]           = useState(false);
  const [aiMessage, setAiMessage]           = useState(null);
  const [aiActionKey, setAiActionKey]       = useState(0);
  const [pendingCount, setPendingCount]     = useState(0);
  const pendingTimerRef = useRef(null);

  const isDashboard = PAGES_WITH_EMBEDDED_AI.some(p => pathname?.startsWith(p));

  const openWithMessage = useCallback((msg) => {
    setAiMessage(msg);
    setAiActionKey(k => k + 1);
    setShowPanel(true);
  }, []);

  // Polling leve para badge de pendentes
  const refreshPending = useCallback(async () => {
    try {
      const data = await fleetAiGetPendingActions();
      setPendingCount(Array.isArray(data) ? data.length : 0);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    refreshPending();
    pendingTimerRef.current = setInterval(refreshPending, 30_000);
    return () => clearInterval(pendingTimerRef.current);
  }, [refreshPending]);

  return (
    <>
      {children}

      {/* Barra de ações IA — fixa no rodapé, visível em todas as páginas fleet */}
      {!isDashboard && (
        <div
          className="fleet-ai-fab-bar"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1040,
            background: 'var(--bs-body-bg)',
            borderTop: '1px solid var(--bs-border-color)',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            boxShadow: '0 -2px 12px rgba(0,0,0,.07)',
          }}
        >
          {/* Botão principal IA */}
          <button
            className="btn btn-primary btn-sm d-flex align-items-center gap-2 flex-shrink-0 position-relative"
            style={{ borderRadius: 20, fontWeight: 600, fontSize: '0.8rem', padding: '6px 14px' }}
            onClick={() => setShowPanel(p => !p)}
          >
            <Zap size={13} />
            IA de Frota
            {pendingCount > 0 && (
              <span
                className="badge bg-warning text-dark position-absolute"
                style={{ top: -6, right: -6, fontSize: '0.6rem', borderRadius: 20, minWidth: 16, padding: '2px 5px' }}
              >
                {pendingCount}
              </span>
            )}
          </button>

          <div className="vr flex-shrink-0" style={{ height: 20 }} />

          {AI_ACTIONS.map(({ icon: Icon, label, color, message }) => (
            <button
              key={label}
              className={`btn btn-soft-${color} btn-sm d-flex align-items-center gap-1 flex-shrink-0`}
              style={{ fontSize: '0.78rem', borderRadius: 20 }}
              onClick={() => openWithMessage(message)}
            >
              <Icon size={13} />{label}
            </button>
          ))}

          {pendingCount > 0 && (
            <>
              <div className="vr flex-shrink-0" style={{ height: 20 }} />
              <button
                className="btn btn-soft-warning btn-sm d-flex align-items-center gap-2 flex-shrink-0"
                style={{ fontSize: '0.78rem', borderRadius: 20 }}
                onClick={() => { setShowPanel(true); }}
              >
                <Clock size={13} />
                {pendingCount} aprovação{pendingCount !== 1 ? 'ões' : ''} pendente{pendingCount !== 1 ? 's' : ''}
              </button>
            </>
          )}
        </div>
      )}

      {/* Painel IA global — disponível em todas as páginas fleet */}
      {!isDashboard && (
        <FleetAiPanel
          open={showPanel}
          onClose={() => setShowPanel(false)}
          initialMessage={aiMessage}
          actionKey={aiActionKey}
        />
      )}
    </>
  );
}
