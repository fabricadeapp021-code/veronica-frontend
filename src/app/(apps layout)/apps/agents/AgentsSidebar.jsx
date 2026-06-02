'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button, Form, Nav } from 'react-bootstrap';
import { Briefcase, Cpu, Link as LinkIcon, List } from 'react-feather';
import SimpleBar from 'simplebar-react';
import HkTooltip from '@/components/@hk-tooltip/HkTooltip';

/**
 * Sidebar de navegação do gerenciamento de agentes
 */
const AgentsSidebar = () => {
  const pathName = usePathname();
  const isList = pathName === '/apps/agents' || pathName === '/apps/agents/';
  const isConnectors = pathName === '/apps/agents/connectors';

  return (
    <nav className="integrationsapp-sidebar">
      <SimpleBar className="nicescroll-bar">
        <div className="menu-content-wrap">
          <Form className="mb-4" role="search">
            <Form.Control type="text" placeholder="Buscar agente..." />
          </Form>

          <div className="menu-group">
            <Nav as="ul" className="nav-light navbar-nav flex-column">
              <Nav.Item as="li">
                <Nav.Link
                  as={Link}
                  href="/apps/agents"
                  className={isList ? 'active' : ''}
                >
                  <span className="nav-icon-wrap">
                    <span className="feather-icon">
                      <List />
                    </span>
                  </span>
                  <span className="nav-link-text">Funcionários IA</span>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item as="li">
                <Nav.Link
                  as={Link}
                  href="/apps/agents/connectors"
                  className={isConnectors ? 'active' : ''}
                >
                  <span className="nav-icon-wrap">
                    <span className="feather-icon">
                      <LinkIcon />
                    </span>
                  </span>
                  <span className="nav-link-text">Conectores</span>
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </div>

          <div className="menu-gap" />
          <div className="nav-header">
            <span>Catálogo</span>
          </div>

          <div className="menu-group">
            <Nav as="ul" className="nav-light navbar-nav flex-column">
              <Nav.Item as="li">
                <Nav.Link as={Link} href="/apps/agents">
                  <span className="nav-icon-wrap">
                    <span className="feather-icon">
                      <Briefcase />
                    </span>
                  </span>
                  <span className="nav-link-text">Templates</span>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item as="li">
                <Nav.Link as={Link} href="/apps/monitoring">
                  <span className="nav-icon-wrap">
                    <span className="feather-icon">
                      <Cpu />
                    </span>
                  </span>
                  <span className="nav-link-text">Monitor</span>
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </div>
        </div>
      </SimpleBar>
    </nav>
  );
};

export default AgentsSidebar;
