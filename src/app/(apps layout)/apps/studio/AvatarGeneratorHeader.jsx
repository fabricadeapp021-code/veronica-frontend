import { Button, Dropdown, Form, InputGroup, Nav } from 'react-bootstrap';
import { Grid, List, Menu, MoreVertical, RefreshCw, Settings, User, Zap } from 'react-feather';
import HkTooltip from '@/components/@hk-tooltip/HkTooltip';

const AvatarGeneratorHeader = ({ toggleSidebar }) => {
    return (
        <header className="contact-header">
            <div className="d-flex align-items-center w-100">
                <Nav.Link
                    className="contactapp-sidebar-toggle"
                    href="#"
                    onClick={toggleSidebar}
                >
                    <span className="feather-icon text-primary">
                        <Menu size={18} />
                    </span>
                </Nav.Link>
                <div className="ms-3 d-flex align-items-left gap-3 flex-grow-1">
                    <div className="avatar avatar-sm avatar-soft-success avatar-rounded">
                        <span className="initial-wrap">
                            <User size={15} />
                        </span>
                    </div>
                    <div>
                        <h5 className="mb-0">Gerador de Avatares</h5>
                        <div className="small text-muted">Crie avatares personalizados com IA</div>
                    </div>
                </div>
                <div className="ms-auto d-flex align-items-center gap-2">
                    <HkTooltip id="tooltip-refresh" placement="top" title="Atualizar">
                        <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover">
                            <span className="icon">
                                <span className="feather-icon">
                                    <RefreshCw />
                                </span>
                            </span>
                        </Button>
                    </HkTooltip>
                    <Dropdown>
                        <Dropdown.Toggle variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover no-caret">
                            <span className="icon">
                                <span className="feather-icon">
                                    <MoreVertical />
                                </span>
                            </span>
                        </Dropdown.Toggle>
                        <Dropdown.Menu align="end">
                            <Dropdown.Item>
                                <Settings size={14} className="me-2" />
                                Configurações
                            </Dropdown.Item>
                            <Dropdown.Item>
                                <Grid size={14} className="me-2" />
                                Ver Galeria
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item>
                                <Zap size={14} className="me-2" />
                                Gerar Novo
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
            </div>
        </header>
    )
}

export default AvatarGeneratorHeader
