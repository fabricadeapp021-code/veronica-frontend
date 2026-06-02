'use client';
import React from 'react';
import { Nav, Button, Dropdown } from 'react-bootstrap';
import * as Icons from 'react-feather';

const JingleGeneratorHeader = ({ toggleSidebar }) => {
    return (
        <header className="contact-header">
            <div className="d-flex align-items-center">
                <Nav.Link
                    className="contactapp-sidebar-toggle"
                    href="#"
                    onClick={toggleSidebar}
                >
                    <span className="feather-icon text-primary">
                        <Icons.Menu size={18} />
                    </span>
                </Nav.Link>
                <div className="ms-3 d-flex align-items-center gap-3">
                    <div className="avatar avatar-sm avatar-soft-success avatar-rounded">
                        <span className="initial-wrap">
                            <Icons.Music size={15} />
                        </span>
                    </div>
                    <div>
                        <h5 className="mb-0">Gerador de Jingles</h5>
                        <div className="small text-muted">Crie jingles eleitorais com IA via GovernAI Studio</div>
                    </div>
                </div>
            </div>
            <div className="contact-options-wrap">
                <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover">
                    <span className="icon">
                        <Icons.RefreshCw size={18} />
                    </span>
                </Button>
                <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover">
                    <span className="icon">
                        <Icons.HelpCircle size={18} />
                    </span>
                </Button>
                <Dropdown>
                    <Dropdown.Toggle variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover no-caret">
                        <span className="icon">
                            <Icons.MoreVertical size={18} />
                        </span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end">
                        <Dropdown.Item>
                            <Icons.Music size={16} className="me-2" />
                            Meus Jingles
                        </Dropdown.Item>
                        <Dropdown.Item>
                            <Icons.Settings size={16} className="me-2" />
                            Configurações
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item>
                            <Icons.BookOpen size={16} className="me-2" />
                            Guia de Estilos
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </header>
    );
};

export default JingleGeneratorHeader;
