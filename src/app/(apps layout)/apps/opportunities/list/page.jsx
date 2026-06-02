'use client';
import { useState } from 'react';
import classNames from 'classnames';
import OpportunityAppSidebar from '../OpportunityAppSidebar';
import OpportunityAppHeader from '../OpportunityAppHeader';
import OpportunitiesAppBody from './OpportunitiesAppBody';

const OpportunityList = () => {
    const [showSidebar, setShowSidebar] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(max-width: 1740px)').matches;
    });
    const [stageFilter, setStageFilter] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleFilterChange = (stage) => {
        setStageFilter(stage);
    };

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const handleShowCreateModal = () => {
        setShowCreateModal(true);
    };

    const handleHideCreateModal = () => {
        setShowCreateModal(false);
    };

    return (
        <div className="hk-pg-body py-0">
            <div className={classNames("contactapp-wrap", { "contactapp-sidebar-toggle": showSidebar })} >
                <OpportunityAppSidebar 
                    onFilterChange={handleFilterChange}
                    onShowCreateModal={handleShowCreateModal}
                />
                <div className="contactapp-content">
                    <div className="contactapp-detail-wrap">
                        <OpportunityAppHeader 
                            toggleSidebar={() => setShowSidebar(!showSidebar)} 
                            show={showSidebar}
                            onRefresh={handleRefresh}
                            onShowCreateModal={handleShowCreateModal}
                        />
                        <OpportunitiesAppBody 
                            stageFilter={stageFilter}
                            showCreateModal={showCreateModal}
                            onHideCreateModal={handleHideCreateModal}
                            refreshTrigger={refreshTrigger}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OpportunityList
