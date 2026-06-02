'use client'
import { Button, Dropdown } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import * as Icons from 'react-feather';
import { text } from '@fortawesome/fontawesome-svg-core';

const UsersHeader = ({ showSidebar, toggleSidebar, onExportCSV, canCreate = true }) => {
    const router = useRouter();
    const createButtonStyle = {
        padding: '0.52rem 0.9rem',
        fontSize: '1.05rem',
        lineHeight: 1.0,
        
    };
    
    return (
        <header className="fm-header">
            <div className="d-flex align-items-center">
                <a className="fmapp-sidebar-toggle" onClick={toggleSidebar} style={{ cursor: 'pointer' }}>
                    <span className="feather-icon"><Icons.Menu /></span>
                </a>
                <h5 className="mb-0 ms-3">👥 Gerenciar Usuários</h5>
            </div>
            <div className="d-flex align-items-center fm-header-right">
                {canCreate && (
                    <>
                        <Button 
                            variant="warning" 
                            style={createButtonStyle}
                            onClick={() => router.push('/apps/users/create-admin')}
                        >
                            <Icons.Award size={18} className="me-2" />
                            <span className="d-none d-sm-inline">Novo Político</span>
                        </Button>
                        <Button 
                            variant="primary" 
                            style={createButtonStyle}
                            className="ms-2"
                            onClick={() => router.push('/apps/users/create-employee')}
                        >
                            <Icons.UserPlus size={18} className="me-2" />
                            <span className="d-none d-sm-inline">Novo Funcionário</span>
                        </Button>
                        <Button 
                            variant="secondary" 
                            style={createButtonStyle}
                            className="ms-2"
                            onClick={() => router.push('/apps/users/create-external')}
                        >
                            <Icons.Link size={18} className="me-2" />
                            <span className="d-none d-sm-inline">Novo Externo</span>
                        </Button>
                        <Button
                            variant="success"
                            style={createButtonStyle}
                            className="ms-2"
                            onClick={() => router.push('/apps/users/create-campaign-manager')}
                        >
                            <Icons.Briefcase size={18} className="me-2" />
                            <span className="d-none d-sm-inline">Novo Gerente de Campanha</span>
                        </Button>
                    </>
                )}
                <Dropdown className="ms-2">
                    <Dropdown.Toggle variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover no-caret">
                        <Icons.MoreVertical size={20} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end">
                        {onExportCSV && (
                            <>
                                <Dropdown.Item onClick={onExportCSV}>
                                    <Icons.Download size={16} className="me-2" />Exportar CSV
                                </Dropdown.Item>
                                <Dropdown.Divider />
                            </>
                        )}
                        <Dropdown.Item><Icons.Settings size={16} className="me-2" />Configurações</Dropdown.Item>
                        <Dropdown.Item><Icons.HelpCircle size={16} className="me-2" />Ajuda</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </header>
    );
};

export default UsersHeader;
