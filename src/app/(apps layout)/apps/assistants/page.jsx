'use client';
import { useState } from 'react';
import classNames from 'classnames';
import AssistantsSidebar from './AssistantsSidebar';
import AssistantsHeader from './AssistantsHeader';
import AssistantsBody from './AssistantsBody';

/**
 * Página de Assistentes Especializados
 * Permite interagir com assistentes conectados ao n8n
 */
const AssistantsPage = () => {
  const [showSidebar, setShowSidebar] = useState(true);

  return (
    <div className="hk-pg-body py-0">
      <div className={classNames("integrationsapp-wrap", { 
        "integrationsapp-sidebar-toggle": !showSidebar 
      })}>
        <AssistantsSidebar />
        <div className="integrationsapp-content">
          <div className="integrationsapp-detail-wrap">
            <AssistantsHeader 
              toggleSidebar={() => setShowSidebar(!showSidebar)} 
              show={showSidebar} 
            />
            <AssistantsBody />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantsPage;
