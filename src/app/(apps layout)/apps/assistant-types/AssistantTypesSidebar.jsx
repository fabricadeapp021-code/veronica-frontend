'use client'
import { Nav } from 'react-bootstrap';
import * as Icons from 'react-feather';
import SimpleBar from 'simplebar-react';

const AssistantTypesSidebar = ({ onNewType }) => {
    return (
        <div className="fmapp-sidebar">
            <SimpleBar className="nicescroll-bar">
                <div className="menu-content-wrap">
                    <div className="fmapp-sidebar-header">
                        <button 
                            className="btn btn-primary btn-block mb-4"
                            onClick={onNewType}
                        >
                            <span className="icon">
                                <Icons.Plus size={18} />
                            </span>
                            <span className="btn-text ms-2">Novo Tipo</span>
                        </button>
                    </div>

                    <Nav className="nav nav-light">
                        <Nav.Item>
                            <a className="nav-link active" href="#">
                                <span className="nav-icon">
                                    <Icons.Cpu size={18} />
                                </span>
                                <span className="nav-link-text">Todos os Tipos</span>
                            </a>
                        </Nav.Item>
                        <Nav.Item>
                            <a className="nav-link" href="#">
                                <span className="nav-icon">
                                    <Icons.CheckCircle size={18} />
                                </span>
                                <span className="nav-link-text">Ativos</span>
                            </a>
                        </Nav.Item>
                        <Nav.Item>
                            <a className="nav-link" href="#">
                                <span className="nav-icon">
                                    <Icons.XCircle size={18} />
                                </span>
                                <span className="nav-link-text">Inativos</span>
                            </a>
                        </Nav.Item>
                    </Nav>

                    <div className="separator separator-light mt-3 mb-3" />

                    <div className="px-3">
                        <h6 className="text-uppercase text-muted fs-7 fw-medium mb-3">
                            Ferramentas
                        </h6>
                        <Nav className="nav nav-sm nav-light">
                            <Nav.Item>
                                <a className="nav-link" href="#">
                                    <span className="nav-icon-wrap">
                                        <span>📅</span>
                                    </span>
                                    <span className="nav-link-text">Google Calendar</span>
                                </a>
                            </Nav.Item>
                            <Nav.Item>
                                <a className="nav-link" href="#">
                                    <span className="nav-icon-wrap">
                                        <span>📧</span>
                                    </span>
                                    <span className="nav-link-text">Google Email</span>
                                </a>
                            </Nav.Item>
                            <Nav.Item>
                                <a className="nav-link" href="#">
                                    <span className="nav-icon-wrap">
                                        <span>💾</span>
                                    </span>
                                    <span className="nav-link-text">Google Drive</span>
                                </a>
                            </Nav.Item>
                            <Nav.Item>
                                <a className="nav-link" href="#">
                                    <span className="nav-icon-wrap">
                                        <span>📄</span>
                                    </span>
                                    <span className="nav-link-text">Google Docs</span>
                                </a>
                            </Nav.Item>
                            <Nav.Item>
                                <a className="nav-link" href="#">
                                    <span className="nav-icon-wrap">
                                        <span>📊</span>
                                    </span>
                                    <span className="nav-link-text">Google Sheets</span>
                                </a>
                            </Nav.Item>
                        </Nav>
                    </div>

                    <div className="separator separator-light mt-3 mb-3" />

                    <div className="px-3">
                        <h6 className="text-uppercase text-muted fs-7 fw-medium mb-3">
                            Informações
                        </h6>
                        <div className="card card-border border-primary mb-3">
                            <div className="card-body py-3">
                                <div className="media">
                                    <div className="media-head me-3">
                                        <div className="avatar avatar-icon avatar-sm avatar-primary avatar-rounded">
                                            <span className="initial-wrap">
                                                <Icons.Info size={16} />
                                            </span>
                                        </div>
                                    </div>
                                    <div className="media-body">
                                        <div className="fs-7 fw-medium mb-1">Tipos de Assistentes</div>
                                        <div className="fs-8 text-muted">
                                            Configure os tipos de assistentes com diferentes ferramentas e webhooks.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SimpleBar>
        </div>
    );
};

export default AssistantTypesSidebar;

