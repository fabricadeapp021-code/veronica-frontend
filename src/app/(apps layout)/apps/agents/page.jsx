'use client';
import AgentsSidebar from './AgentsSidebar';
import AgentsBody from './AgentsBody';

export default function AgentsPage() {
  return (
    <div className="hk-pg-body py-0">
      <div className="fmapp-wrap">
        <AgentsSidebar />
        <div className="fmapp-content">
          <div className="fmapp-detail-wrap">
            <AgentsBody />
          </div>
        </div>
      </div>
    </div>
  );
}
