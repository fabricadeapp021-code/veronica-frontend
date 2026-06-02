'use client';
import React from 'react';
import { Nav, Button, Dropdown } from 'react-bootstrap';
import * as Icons from 'react-feather';

const BannerGeneratorHeader = ({ toggleSidebar, show }) => {
    return (
        <header className="contact-header">
            <div className="d-flex align-items-center">
                <Nav.Link
                    className="contactapp-sidebar-toggle"
                    href="#"
                    onClick={toggleSidebar}
                >
                    <span className="ham-icon">
                        <span />
                        <span />
                        <span />
                    </span>
                </Nav.Link>
                <div className="ms-3">
                    <h4 className="mb-0">🎨 Gerador de Banners</h4>
                    <span className="text-muted fs-7">Crie banners profissionais para redes sociais</span>
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
                            <Icons.Image size={16} className="me-2" />
                            Meus Banners
                        </Dropdown.Item>
                        <Dropdown.Item>
                            <Icons.Settings size={16} className="me-2" />
                            Configurações
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item>
                            <Icons.BookOpen size={16} className="me-2" />
                            Templates
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </header>
    );
};

export default BannerGeneratorHeader;
