'use client';
import Link from 'next/link';
import classNames from 'classnames';
import { Button, Form } from 'react-bootstrap';
import { ChevronDown, ChevronUp, Plus } from 'react-feather';
import HkTooltip from '@/components/@hk-tooltip/HkTooltip';
import { useGlobalStateContext } from '@/context/GolobalStateProvider';

/**
 * Header da página de gerenciamento de agentes
 */
const AgentsHeader = ({ toggleSidebar, show, onSearch, searchValue }) => {
  const { states, dispatch } = useGlobalStateContext();

  return (
    <header className="integrations-header">
      <div className="d-flex flex-1">
        <Link href="/apps/agents" className="integrationsapp-title text-decoration-none">
          <h1>Funcionários IA</h1>
        </Link>
      </div>
      <div className="integrations-options-wrap justify-content-end flex-1 d-md-flex d-none">
        <Form className="mw-300p flex-grow-1 d-lg-flex d-none" role="search">
          <Form.Control
            type="text"
            placeholder="Buscar funcionário..."
            value={searchValue || ''}
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </Form>
        <Button as={Link} href="/apps/agents/new" variant="primary" className="ms-2">
          <Plus size={18} className="me-1" />
          Contratar Funcionário IA
        </Button>
        <Button
          variant="flush-dark"
          className="btn-icon btn-rounded flush-soft-hover hk-navbar-togglable ms-2"
          onClick={() => dispatch({ type: 'top_nav_toggle' })}
        >
          <HkTooltip
            placement={states.layoutState.topNavCollapse ? 'bottom' : 'top'}
            title="Collapse"
          >
            <span className="icon">
              <span className="feather-icon">
                {states.layoutState.topNavCollapse ? <ChevronDown /> : <ChevronUp />}
              </span>
            </span>
          </HkTooltip>
        </Button>
      </div>
      <div
        className={classNames('hk-sidebar-togglable', { active: !show })}
        onClick={toggleSidebar}
      />
    </header>
  );
};

export default AgentsHeader;
