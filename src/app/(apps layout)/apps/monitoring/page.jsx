'use client';
import { useState } from 'react';
import classNames from 'classnames';
import MonitoringBody from './MonitoringBody';
import MonitoringSidebar from '../monitoring/MonitoringSidebar';
import MonitoringHeader from './MonitoringHeader';

const MonitoringPage = () => {
  const [showSidebar, setShowSidebar] = useState(true);
  const [bodyActions, setBodyActions] = useState({});

  return (
    <div className="hk-pg-body py-0">
      <div className={classNames("fmapp-wrap", { "fmapp-sidebar-toggle": !showSidebar })}>
        <MonitoringSidebar />
        <div className="fmapp-content">
          <div className="fmapp-detail-wrap">
            <MonitoringHeader 
              showSidebar={showSidebar} 
              toggleSidebar={() => setShowSidebar(!showSidebar)} 
              onRefresh={() => bodyActions?.refresh?.()}
              onExport={() => bodyActions?.exportLogs?.()}
            />
            <MonitoringBody bindActions={setBodyActions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringPage;
