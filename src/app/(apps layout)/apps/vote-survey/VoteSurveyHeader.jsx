'use client'
import { Button, Dropdown } from 'react-bootstrap';
import * as Icons from 'react-feather';

const VoteSurveyHeader = ({ toggleSidebar }) => {
    return (
        <header className="fm-header">
            <div className="d-flex align-items-center">
                <a className="fmapp-sidebar-toggle" onClick={toggleSidebar} style={{ cursor: 'pointer' }}>
                    <span className="feather-icon"><Icons.Menu /></span>
                </a>
                <h5 className="mb-0 ms-3">Pesquisa de Intenção de Voto</h5>
            </div>
            <div className="d-flex align-items-center fm-header-right">
                <Button variant="primary" size="sm" onClick={() => window.location.reload()}>
                    <Icons.RefreshCw size={16} className="me-2" />
                    <span className="d-none d-sm-inline">Atualizar</span>
                </Button>
                <Dropdown className="ms-2">
                    <Dropdown.Toggle variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover no-caret">
                        <Icons.MoreVertical size={20} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end">
                        <Dropdown.Item><Icons.Plus size={16} className="me-2" />Nova Pesquisa</Dropdown.Item>
                        <Dropdown.Item><Icons.Download size={16} className="me-2" />Exportar Relatório</Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item><Icons.HelpCircle size={16} className="me-2" />Ajuda</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </header>
    );
};

export default VoteSurveyHeader;
