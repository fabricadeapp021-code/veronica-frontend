'use client';

import React from 'react';
import { Card, Nav } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import { Share2, Clock, Star, Folder, Instagram, Facebook, Twitter, Linkedin, Zap } from 'react-feather';
import StudioSidebarTopNav from './StudioSidebarTopNav';

const activeLinkStyle = {
    backgroundColor: '#d5ebee',
    color: '#0a8b98',
    borderRadius: '8px',
};

const SocialPostGeneratorSidebar = () => {
    return (
        <aside className="fmapp-sidebar">
            <SimpleBar className="nicescroll-bar">
                <div className="menu-content-wrap">
                    <StudioSidebarTopNav />
                    <div className="separator separator-light" />

                    <div className="menu-group">
                        <Nav as="ul" className="nav-light navbar-nav flex-column">
                            <Nav.Item as="li">
                                <Nav.Link active style={activeLinkStyle}>
                                    <span className="nav-icon-wrap">
                                        <span className="feather-icon">
                                            <Share2 />
                                        </span>
                                    </span>
                                    <span className="nav-link-text">Criar Novo</span>
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item as="li">
                                <Nav.Link>
                                    <span className="nav-icon-wrap">
                                        <span className="feather-icon">
                                            <Clock />
                                        </span>
                                    </span>
                                    <span className="nav-link-text">Historico</span>
                                    <span className="badge badge-sm badge-soft-primary ms-auto">Em breve</span>
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item as="li">
                                <Nav.Link>
                                    <span className="nav-icon-wrap">
                                        <span className="feather-icon">
                                            <Star />
                                        </span>
                                    </span>
                                    <span className="nav-link-text">Favoritos</span>
                                    <span className="badge badge-sm badge-soft-primary ms-auto">Em breve</span>
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item as="li">
                                <Nav.Link>
                                    <span className="nav-icon-wrap">
                                        <span className="feather-icon">
                                            <Folder />
                                        </span>
                                    </span>
                                    <span className="nav-link-text">Campanhas</span>
                                    <span className="badge badge-sm badge-soft-primary ms-auto">Em breve</span>
                                </Nav.Link>
                            </Nav.Item>
                        </Nav>
                    </div>

                    <div className="menu-gap" />
                    <div className="nav-header">
                        <span>Formatos Rapidos</span>
                    </div>
                    <div className="menu-group">
                        <Nav as="ul" className="nav-light navbar-nav flex-column">
                            <Nav.Item as="li">
                                <Nav.Link>
                                    <span className="nav-icon-wrap">
                                        <span className="feather-icon">
                                            <Instagram />
                                            
                                        </span>
                                    </span>
                                    <span className="nav-link-text">Instagram</span>
                                    <span className="badge badge-sm badge-soft-primary ms-auto">Em breve</span>
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item as="li">
                                <Nav.Link>
                                    <span className="nav-icon-wrap">
                                        <span className="feather-icon">
                                            <Facebook />
                                        </span>
                                    </span>
                                    <span className="nav-link-text">Facebook</span>
                                    <span className="badge badge-sm badge-soft-primary ms-auto">Em breve</span>
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item as="li">
                                <Nav.Link>
                                    <span className="nav-icon-wrap">
                                        <span className="feather-icon">
                                            <Twitter />
                                        </span>
                                    </span>
                                    <span className="nav-link-text">Twitter/X</span>
                                    <span className="badge badge-sm badge-soft-primary ms-auto">Em breve</span>
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item as="li">
                                <Nav.Link>
                                    <span className="nav-icon-wrap">
                                        <span className="feather-icon">
                                            <Linkedin />
                                        </span>
                                    </span>
                                    <span className="nav-link-text">LinkedIn</span>
                                    <span className="badge badge-sm badge-soft-primary ms-auto">Em breve</span>
                                </Nav.Link>
                            </Nav.Item>
                        </Nav>
                    </div>

                    <Card className="card-border mt-3">
                        <Card.Body className="p-3">
                            <h6 className="mb-3 fs-7">Estatisticas</h6>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="fs-8 text-muted">Posts Criados</span>
                                <span className="fw-bold">47</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="fs-8 text-muted">Este Mes</span>
                                <span className="fw-bold text-success">+12</span>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span className="fs-8 text-muted">Templates Salvos</span>
                                <span className="fw-bold">8</span>
                            </div>
                        </Card.Body>
                    </Card>

                    <Card className="card-border bg-primary-light-5 mt-3">
                        <Card.Body className="p-3">
                            <div className="d-flex align-items-start">
                                <Zap size={20} className="text-primary me-2 mt-1" />
                                <div>
                                    <h6 className="mb-1 fs-7 text-primary">Dica</h6>
                                    <p className="fs-8 mb-0 text-dark">
                                        Descreva a cena com detalhes para resultados mais precisos.
                                    </p>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </SimpleBar>
        </aside>
    );
};

export default SocialPostGeneratorSidebar;
