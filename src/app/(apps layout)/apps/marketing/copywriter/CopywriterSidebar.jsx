'use client'
import { Nav } from 'react-bootstrap';
import * as Icons from 'react-feather';
import SimpleBar from 'simplebar-react';

const CopywriterSidebar = () => {
    return (
        <div className="fmapp-sidebar">
            <SimpleBar className="nicescroll-bar">
                <div className="menu-content-wrap">
                    <div className="fmapp-sidebar-header">
                        <div className="media">
                            <div className="media-head">
                                <div className="avatar avatar-icon avatar-primary avatar-rounded">
                                    <span className="initial-wrap">
                                        <Icons.Edit3 size={24} />
                                    </span>
                                </div>
                            </div>
                            <div className="media-body">
                                <div className="text-dark fw-medium">Copywriter IA</div>
                                <div className="fs-7 text-muted">Geração automática de textos</div>
                            </div>
                        </div>
                    </div>

                    <Nav className="nav nav-light mt-3">
                        <Nav.Item>
                            <a className="nav-link active" href="#">
                                <span className="nav-icon"><Icons.Edit3 size={18} /></span>
                                <span className="nav-link-text">Novo Texto</span>
                            </a>
                        </Nav.Item>
                        <Nav.Item>
                            <a className="nav-link" href="#">
                                <span className="nav-icon"><Icons.FileText size={18} /></span>
                                <span className="nav-link-text">Histórico</span>
                            </a>
                        </Nav.Item>
                        <Nav.Item>
                            <a className="nav-link" href="#">
                                <span className="nav-icon"><Icons.BookOpen size={18} /></span>
                                <span className="nav-link-text">Templates</span>
                            </a>
                        </Nav.Item>
                    </Nav>

                    <div className="separator separator-light mt-3 mb-3" />

                    <div className="px-3">
                        <h6 className="text-uppercase text-muted fs-7 fw-medium mb-3">Tipos de Conteúdo</h6>
                        <Nav className="nav nav-sm nav-light">
                            <Nav.Item><a className="nav-link" href="#"><span className="nav-icon-wrap">📱</span><span className="nav-link-text">Posts Sociais</span></a></Nav.Item>
                            <Nav.Item><a className="nav-link" href="#"><span className="nav-icon-wrap">📢</span><span className="nav-link-text">Anúncios</span></a></Nav.Item>
                            <Nav.Item><a className="nav-link" href="#"><span className="nav-icon-wrap">📧</span><span className="nav-link-text">E-mails</span></a></Nav.Item>
                            <Nav.Item><a className="nav-link" href="#"><span className="nav-icon-wrap">💬</span><span className="nav-link-text">Mensagens</span></a></Nav.Item>
                        </Nav>
                    </div>

                    <div className="separator separator-light mt-3 mb-3" />

                    <div className="px-3">
                        <h6 className="text-uppercase text-muted fs-7 fw-medium mb-3">Redes Sociais</h6>
                        <div className="card card-border mb-3">
                            <div className="card-body py-2">
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <div className="d-flex align-items-center">
                                        <span className="me-2" style={{ fontSize: '18px' }}>📘</span>
                                        <span className="fs-7">Facebook</span>
                                    </div>
                                    <span className="badge badge-success badge-indicator badge-indicator-lg"></span>
                                </div>
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <div className="d-flex align-items-center">
                                        <span className="me-2" style={{ fontSize: '18px' }}>📸</span>
                                        <span className="fs-7">Instagram</span>
                                    </div>
                                    <span className="badge badge-success badge-indicator badge-indicator-lg"></span>
                                </div>
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <div className="d-flex align-items-center">
                                        <span className="me-2" style={{ fontSize: '18px' }}>🐦</span>
                                        <span className="fs-7">Twitter / X</span>
                                    </div>
                                    <span className="badge badge-success badge-indicator badge-indicator-lg"></span>
                                </div>
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <div className="d-flex align-items-center">
                                        <span className="me-2" style={{ fontSize: '18px' }}>💼</span>
                                        <span className="fs-7">LinkedIn</span>
                                    </div>
                                    <span className="badge badge-secondary badge-indicator badge-indicator-lg"></span>
                                </div>
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <div className="d-flex align-items-center">
                                        <span className="me-2" style={{ fontSize: '18px' }}>🎵</span>
                                        <span className="fs-7">TikTok</span>
                                    </div>
                                    <span className="badge badge-success badge-indicator badge-indicator-lg"></span>
                                </div>
                                <div className="d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center">
                                        <span className="me-2" style={{ fontSize: '18px' }}>💬</span>
                                        <span className="fs-7">WhatsApp</span>
                                    </div>
                                    <span className="badge badge-success badge-indicator badge-indicator-lg"></span>
                                </div>
                            </div>
                            <div className="card-footer text-center py-2">
                                <a href="#" className="fs-7 text-primary">
                                    <Icons.Settings size={14} className="me-1" />
                                    Gerenciar Conexões
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="separator separator-light mt-3 mb-3" />

                    <div className="px-3">
                        <div className="card card-border border-primary mb-3">
                            <div className="card-body py-3">
                                <div className="media">
                                    <div className="media-head me-3">
                                        <div className="avatar avatar-icon avatar-sm avatar-primary avatar-rounded">
                                            <span className="initial-wrap"><Icons.Zap size={16} /></span>
                                        </div>
                                    </div>
                                    <div className="media-body">
                                        <div className="fs-7 fw-medium mb-1">IA Avançada</div>
                                        <div className="fs-8 text-muted">Textos otimizados para máximo engajamento e conversão.</div>
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

export default CopywriterSidebar;
