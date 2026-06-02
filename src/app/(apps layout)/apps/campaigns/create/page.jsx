'use client';
import { useSearchParams } from 'next/navigation';
import CreateCampaignBody from './CreateCampaignBody';
import CreateCampaignVoiceBody from './CreateCampaignVoiceBody';
import CreateCampaignWhatsAppBody from './CreateCampaignWhatsAppBody';

const CreateCampaign = () => {
    const searchParams = useSearchParams();
    const type = String(searchParams?.get('type') || '').toLowerCase();

    const renderCreateBody = () => {
        if (type === 'voice') return <CreateCampaignVoiceBody />;
        if (type === 'whatsapp') return <CreateCampaignWhatsAppBody />;
        return <CreateCampaignBody />;
    };

    return (
        <div className="hk-pg-body py-0">
            {renderCreateBody()}
        </div>
    )
}

export default CreateCampaign

