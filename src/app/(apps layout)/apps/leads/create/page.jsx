'use client';
import { useState } from 'react';
import classNames from 'classnames';
import LeadAppSidebar from '../LeadAppSidebar';
import LeadAppHeader from '../LeadAppHeader';
import CreateLeadBody from './CreateLeadBody';

const CreateLead = () => {
    const [showSidebar, setShowSidebar] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(max-width: 1740px)').matches;
    });

    return (
        <div className="hk-pg-body py-0">
            <div className={classNames("contactapp-wrap", { "contactapp-sidebar-toggle": showSidebar })}>
                <LeadAppSidebar />
                <div className="contactapp-content">
                    <div className="contactapp-detail-wrap">
                        <LeadAppHeader toggleSidebar={() => setShowSidebar(!showSidebar)} show={showSidebar} />
                        <CreateLeadBody />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CreateLead

