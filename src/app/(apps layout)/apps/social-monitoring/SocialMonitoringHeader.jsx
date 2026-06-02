'use client'
import { Button } from 'react-bootstrap';
import * as Icons from 'react-feather';

const SocialMonitoringHeader = ({ toggleSidebar }) => {
    return (
        <header className="fm-header">
            <div className="d-flex align-items-center">
                <a className="fmapp-sidebar-toggle" onClick={toggleSidebar} style={{ cursor: 'pointer' }}>
                    <span className="feather-icon"><Icons.Menu /></span>
                </a>
                <h5 className="mb-0 ms-3">Monitoramento de Redes Sociais</h5>
            </div>
            <div className="d-flex align-items-center fm-header-right">
                <Button variant="outline-secondary" size="sm">
                    <Icons.RefreshCw size={16} className="me-2" />
                    <span className="d-none d-sm-inline">Atualizar</span>
                </Button>
            </div>
        </header>
    );
};

export default SocialMonitoringHeader;
