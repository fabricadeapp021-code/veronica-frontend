'use client';
import { useState, useEffect, useCallback } from 'react';
import { Button, Nav, Spinner } from 'react-bootstrap';
import * as Icons from 'react-feather';
import SimpleBar from 'simplebar-react';
import HkTooltip from '@/components/@hk-tooltip/HkTooltip';
import { useRouter, usePathname } from 'next/navigation';
import { apiRequest } from '@/lib/api/client';

const AgentsSidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const data = await apiRequest('/agents');
      const agents = data?.agents || [];
      setStats({
        total:  agents.length,
        active: agents.filter((a) => a.status === 'active').length,
        paused: agents.filter((a) => a.status === 'paused').length,
      });
    } catch {
      // silent
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const menuItems = [
    { icon: Icons.Users,       label: 'Meu Time',        path: '/apps/agents',           exact: true },
    { icon: Icons.ShoppingBag, label: 'Marketplace',     path: '/apps/agents/new',       exact: true },
    { icon: Icons.Link2,       label: 'Conectores',      path: '/apps/agents/connectors',exact: false },
    { icon: Icons.Zap,         label: 'Integrações',     path: '/apps/integrations',     exact: false },
    { icon: Icons.Activity,    label: 'Monitor',         path: '/apps/monitoring',       exact: false },
  ];

  const quickActions = [
    { icon: Icons.UserPlus,  label: 'Contratar Novo IA', action: 'hire' },
    { icon: Icons.RefreshCw, label: 'Atualizar Lista',   action: 'refresh' },
  ];

  const isActive = (item) =>
    item.exact ? pathname === item.path : pathname.startsWith(item.path);

  const handleQuickAction = (action) => {
    if (action === 'hire') router.push('/apps/agents/new');
    if (action === 'refresh') fetchStats();
  };

  return (
    <nav className="fmapp-sidebar">
      <SimpleBar className="nicescroll-bar">
        <div className="menu-content-wrap">
          <div className="menu-group">
            <ul className="nav nav-light navbar-nav flex-column">
              {menuItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <li key={i} className={`nav-item ${isActive(item) ? 'active' : ''}`}>
                    <a
                      className="nav-link"
                      href="#"
                      onClick={(e) => { e.preventDefault(); router.push(item.path); }}
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="nav-icon-wrap">
                        <span className="feather-icon"><Icon size={18} /></span>
                      </span>
                      <span className="nav-link-text">{item.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="separator separator-light my-3" />

          <div className="menu-group">
            <p className="menu-title text-muted mb-2">Ações Rápidas</p>
            <ul className="nav nav-light navbar-nav flex-column">
              {quickActions.map((action, i) => {
                const Icon = action.icon;
                return (
                  <li key={i} className="nav-item">
                    <a
                      className="nav-link"
                      href="#"
                      onClick={(e) => { e.preventDefault(); handleQuickAction(action.action); }}
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="nav-icon-wrap">
                        <span className="feather-icon"><Icon size={16} /></span>
                      </span>
                      <span className="nav-link-text">{action.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </SimpleBar>

      <div className="fmapp-storage">
        <p className="p-sm fw-medium mb-2">Estatísticas</p>
        {loadingStats ? (
          <div className="text-center py-1">
            <Spinner animation="border" size="sm" variant="secondary" />
          </div>
        ) : (
          <>
            <div className="d-flex justify-content-between mb-2">
              <small className="text-muted">Total de Agentes:</small>
              <small className="fw-medium">{stats?.total ?? '—'}</small>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <small className="text-muted">Ativos:</small>
              <small className="fw-medium text-success">{stats?.active ?? '—'}</small>
            </div>
            <div className="d-flex justify-content-between">
              <small className="text-muted">Pausados:</small>
              <small className="fw-medium text-warning">{stats?.paused ?? '—'}</small>
            </div>
          </>
        )}
      </div>

      <div className="fmapp-fixednav">
        <div className="hk-toolbar">
          <Nav className="nav-light">
            <Nav.Item className="nav-link">
              <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover">
                <HkTooltip id="tt-agents-settings" placement="top" title="Configurações">
                  <span className="icon">
                    <span className="feather-icon"><Icons.Settings /></span>
                  </span>
                </HkTooltip>
              </Button>
            </Nav.Item>
            <Nav.Item className="nav-link">
              <Button
                variant="flush-dark"
                className="btn-icon btn-rounded flush-soft-hover"
                onClick={fetchStats}
              >
                <HkTooltip id="tt-agents-refresh" placement="top" title="Atualizar">
                  <span className="icon">
                    <span className="feather-icon"><Icons.RefreshCw /></span>
                  </span>
                </HkTooltip>
              </Button>
            </Nav.Item>
            <Nav.Item className="nav-link">
              <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover">
                <HkTooltip id="tt-agents-help" placement="top" title="Ajuda">
                  <span className="icon">
                    <span className="feather-icon"><Icons.HelpCircle /></span>
                  </span>
                </HkTooltip>
              </Button>
            </Nav.Item>
          </Nav>
        </div>
      </div>
    </nav>
  );
};

export default AgentsSidebar;
