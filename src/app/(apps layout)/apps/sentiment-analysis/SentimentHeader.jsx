'use client'
import { Button } from 'react-bootstrap';
import * as Icons from 'react-feather';

const SentimentHeader = ({ toggleSidebar }) => {
    return (
        <header className="fm-header">
            <div className="d-flex align-items-center">
                <a className="fmapp-sidebar-toggle" onClick={toggleSidebar} style={{ cursor: 'pointer' }}>
                    <span className="feather-icon"><Icons.Menu /></span>
                </a>
                <div className="ms-3">
                    <h5 className="mb-0">Análise de Sentimento</h5>
                    <small className="text-muted">Reações nas redes sociais do candidato</small>
                </div>
            </div>
            <div className="d-flex align-items-center fm-header-right">
                <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="d-flex align-items-center"
                >
                    <Icons.RefreshCw size={14} className="me-2" />
                    Atualizar
                </Button>
            </div>
        </header>
    );
};

export default SentimentHeader;
