'use client';
import { useState } from 'react';
import classNames from 'classnames';
import AgentsSidebar from './AgentsSidebar';
import AgentsHeader from './AgentsHeader';
import AgentsBody from './AgentsBody';
import AgentsDarkStyles from './AgentsDarkStyles';

/**
 * Página de Gerenciamento de Agentes
 * CRUD completo: listar, criar, editar, deletar, visualizar
 */
const AgentsPage = () => {
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchValue, setSearchValue] = useState('');

  return (
    <div className="hk-pg-body py-0">
      <AgentsDarkStyles />
      <div
        className={classNames('integrationsapp-wrap agents-page-dark', {
          'integrationsapp-sidebar-toggle': !showSidebar,
        })}
      >
        <AgentsSidebar />
        <div className="integrationsapp-content">
          <div className="integrationsapp-detail-wrap">
            <AgentsHeader
              toggleSidebar={() => setShowSidebar(!showSidebar)}
              show={showSidebar}
              onSearch={setSearchValue}
              searchValue={searchValue}
            />
            <AgentsBody searchValue={searchValue} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentsPage;
