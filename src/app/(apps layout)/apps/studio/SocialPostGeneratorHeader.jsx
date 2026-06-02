'use client';
import React from 'react';
import { Button, Dropdown } from 'react-bootstrap';
import { ChevronDown, RefreshCw, Share2, Download, Bookmark, Settings, Menu } from 'react-feather';

const SocialPostGeneratorHeader = ({ showSidebar, toggleSidebar }) => {
    return (
        <header className="fm-header">
            <div className="d-flex align-items-center">
                {toggleSidebar && (
                    <a className="fmapp-sidebar-toggle me-3" onClick={toggleSidebar} style={{ cursor: 'pointer' }}>
                        <span className="feather-icon text-primary"><Menu size={18} /></span>
                    </a>
                )}
                <h5 className="mb-0">Criador de Posts - Redes Sociais</h5>
            </div>
            <div className="fm-header-actions">
                {/* <Button variant="outline-secondary" size="sm" className="me-2">
                    <RefreshCw size={14} className="me-1" />
                    Limpar
                </Button> */}
                {/* <Button variant="outline-primary" size="sm" className="me-2">
                    <Download size={14} className="me-1" />
                    Exportar Todos
                </Button> */}
                {/* <Dropdown>
                    <Dropdown.Toggle variant="light" size="sm">
                        Mais Opções
                        <ChevronDown size={14} className="ms-1" />
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end">
                        <Dropdown.Item>
                            <Share2 size={14} className="me-2" />
                            Compartilhar
                        </Dropdown.Item>
                        <Dropdown.Item>
                            <Bookmark size={14} className="me-2" />
                            Salvar como Template
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item>
                            <Settings size={14} className="me-2" />
                            Configurações
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown> */}
            </div>
        </header>
    );
};

export default SocialPostGeneratorHeader;
