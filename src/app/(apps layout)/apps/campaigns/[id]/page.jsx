'use client';
import { useState } from 'react';
import classNames from 'classnames';
import CampaignAppSidebar from '../CampaignAppSidebar';
import CampaignAppHeader from '../CampaignAppHeader';
import EditCampaignBody from './EditCampaignBody';

const EditCampaign = () => {
    const [showSidebar, setShowSidebar] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(max-width: 1740px)').matches;
    });

    return (
        <div className="hk-pg-body py-0">
            <div className={classNames("contactapp-wrap", { "contactapp-sidebar-toggle": showSidebar })}>
                <CampaignAppSidebar />
                <div className="contactapp-content">
                    <div className="contactapp-detail-wrap">
                        <CampaignAppHeader toggleSidebar={() => setShowSidebar(!showSidebar)} show={showSidebar} />
                        <EditCampaignBody />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EditCampaign

